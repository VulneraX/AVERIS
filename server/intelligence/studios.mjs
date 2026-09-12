import { z } from "zod";
import { randomUUID } from "node:crypto";
import { TOPICS } from "./risk-engine.mjs";
import { courseDocument, simulationDocument } from "./catalog.mjs";
import {
  draftCourseSchema,
  draftSimulationSchema,
  questionSchema,
  generateAI,
  providerStatus,
  validateQuestions,
  validateSimulation,
} from "./ai.mjs";
import { iso, problem, hash } from "./service.mjs";
import { fetchSource } from "./sources.mjs";

export function registerStudios({ route, service: s, validate }) {
  const admin = ["super_admin", "admin"];
  const org = (req) => req.auth.organization.id;
  const get = (req) => {
    const row = s.one(
      "SELECT * FROM intelligence_drafts WHERE organization_id=? AND id=?",
      org(req),
      req.params.id,
    );
    if (!row) problem(404, "DRAFT_NOT_FOUND", "Draft was not found.");
    return row;
  };
  const serialize = (row) => ({
    ...row,
    input: JSON.parse(row.input_json),
    document: JSON.parse(row.document_json),
    input_json: undefined,
    document_json: undefined,
  });
  route("get", "/studios", admin, (req, res) =>
    res.json({
      drafts: s
        .all(
          "SELECT * FROM intelligence_drafts WHERE organization_id=? ORDER BY updated_at DESC",
          org(req),
        )
        .map(serialize),
      provider: providerStatus(s.settings(org(req)).ai_enabled),
    }),
  );
  route("post", "/sources/url", admin, async (req, res) => {
    const input = validate(
      z.object({ url: z.string().url().max(2000) }).strict(),
      req.body,
    );
    const text = await fetchSource(input.url);
    s.audit(
      org(req),
      req.auth.id,
      "Source imported",
      null,
      { url: input.url },
      { characters: text.length },
    );
    res.json({ text, source: input.url });
  });
  route("post", "/studios", admin, async (req, res) => {
    const input = validate(
      z
        .object({
          kind: z.enum(["content", "simulation"]),
          topic: z.enum(TOPICS),
          title: z.string().trim().max(150).default(""),
          sourceText: z.string().max(40000).default(""),
          sourceLabel: z.string().max(200).default("Manual source"),
          channel: z
            .enum([
              "Email",
              "SMS",
              "QR",
              "Collaboration",
              "Voice",
              "Callback",
              "Deepfake",
            ])
            .default("Email"),
          difficulty: z.number().int().min(1).max(10).default(2),
          context: z.string().max(500).default(""),
          language: z.enum(["en", "id"]).default("en"),
          generationLevel: z
            .enum(["Foundation", "Intermediate", "Advanced"])
            .default("Foundation"),
          lessonCount: z.number().int().min(2).max(10).default(3),
          generate: z.boolean().default(false),
        })
        .strict(),
      req.body,
    );
    let document =
      input.kind === "content"
        ? courseDocument(input.topic)
        : simulationDocument(
            input.topic,
            input.difficulty,
            input.channel,
            input.context,
          );
    let provenance = "Manual draft · AVERIS editorial template",
      model = null;
    if (input.generate) {
      const result = await generateAI({
        enabled: s.settings(org(req)).ai_enabled,
        kind: input.kind,
        input,
        schema:
          input.kind === "content" ? draftCourseSchema : draftSimulationSchema,
      });
      document = result.document;
      provenance = result.provenance;
      model = result.model;
    } else if (input.sourceText && input.kind === "content") {
      document.description =
        "Organization source adapted for review. Verify objectives and questions against the source before publishing.";
      document.lessons = input.sourceText
        .match(/[\s\S]{1,20000}/g)
        .map((content, index) => ({
          title: `Your organization’s guidance${index ? " (continued)" : ""}`,
          kind: "Article",
          content,
        }));
      document.language = input.language;
    }
    if (input.title) document.title = input.title;
    if (input.kind === "content") validateQuestions(document.questions);
    else validateSimulation(document);
    const id = randomUUID(),
      stamp = iso();
    s.run(
      "INSERT INTO intelligence_drafts(id,organization_id,kind,title,input_json,document_json,provenance,model,created_by,created_at,updated_at) VALUES (?,?,?,?,?,?,?,?,?,?,?)",
      id,
      org(req),
      input.kind,
      document.title,
      JSON.stringify(input),
      JSON.stringify(document),
      provenance,
      model,
      req.auth.id,
      stamp,
      stamp,
    );
    s.audit(
      org(req),
      req.auth.id,
      input.generate ? "AI draft generated" : "Manual draft created",
      id,
      {
        kind: input.kind,
        sourceHash: hash(input.sourceText),
        sourceLabel: input.sourceLabel,
      },
      { provenance, model, status: "Draft" },
    );
    res.status(201).json({
      draft: serialize(
        s.one("SELECT * FROM intelligence_drafts WHERE id=?", id),
      ),
    });
  });
  route("get", "/studios/:id", admin, (req, res) =>
    res.json({
      draft: serialize(get(req)),
      provider: providerStatus(s.settings(org(req)).ai_enabled),
    }),
  );
  route("put", "/studios/:id", admin, (req, res) => {
    const row = get(req);
    const input = validate(
      z
        .object({
          version: z.number().int(),
          document:
            row.kind === "content" ? draftCourseSchema : draftSimulationSchema,
        })
        .strict(),
      req.body,
    );
    if (row.version !== input.version)
      problem(
        409,
        "VERSION_CONFLICT",
        "This draft changed. Reload before editing.",
      );
    if (row.status === "Published")
      problem(
        409,
        "DRAFT_PUBLISHED",
        "Published content is immutable. Create a new draft to revise it.",
      );
    if (row.kind === "content") validateQuestions(input.document.questions);
    else validateSimulation(input.document);
    s.run(
      "UPDATE intelligence_drafts SET document_json=?,title=?,status='Draft',version=version+1,reviewed_by=NULL,approved_by=NULL,updated_at=? WHERE id=?",
      JSON.stringify(input.document),
      input.document.title,
      iso(),
      row.id,
    );
    s.audit(
      org(req),
      req.auth.id,
      "Draft edited; approvals reset",
      row.id,
      { version: input.version },
      { status: "Draft" },
    );
    res.json({ draft: serialize(get(req)) });
  });
  route("post", "/studios/:id/questions", admin, async (req, res) => {
    const row = get(req);
    if (row.kind !== "content" || row.status === "Published")
      problem(409, "DRAFT_STATE", "Choose an editable content draft.");
    const input = validate(
      z
        .object({
          version: z.number().int(),
          difficulty: z.enum([
            "Foundation",
            "Developing",
            "Skilled",
            "Advanced",
            "Resilient",
          ]),
          competency: z.enum(TOPICS),
          language: z.enum(["en", "id"]),
        })
        .strict(),
      req.body,
    );
    if (input.version !== row.version)
      problem(
        409,
        "VERSION_CONFLICT",
        "Reload this draft before generating questions.",
      );
    const result = await generateAI({
      enabled: s.settings(org(req)).ai_enabled,
      kind: "questions",
      input: { ...input, course: JSON.parse(row.document_json) },
      schema: z
        .object({ questions: z.array(questionSchema).min(3).max(10) })
        .strict(),
    });
    validateQuestions(result.document.questions);
    const document = JSON.parse(row.document_json);
    document.questions = result.document.questions;
    const updated = s.run(
      "UPDATE intelligence_drafts SET document_json=?,status='Draft',version=version+1,reviewed_by=NULL,approved_by=NULL,provenance=?,model=?,updated_at=? WHERE id=? AND version=?",
      JSON.stringify(document),
      result.provenance,
      result.model,
      iso(),
      row.id,
      input.version,
    );
    if (!updated.changes)
      problem(
        409,
        "VERSION_CONFLICT",
        "The draft changed while questions were generated. Reload and try again.",
      );
    s.audit(
      org(req),
      req.auth.id,
      "Question drafts generated",
      row.id,
      { ...input },
      { model: result.model, count: document.questions.length },
    );
    res.json({ draft: serialize(get(req)) });
  });
  route("post", "/studios/:id/action", admin, (req, res) => {
    const input = validate(
      z
        .object({
          action: z.enum(["review", "approve", "publish"]),
          version: z.number().int(),
          acknowledged: z.literal(true),
        })
        .strict(),
      req.body,
    );
    const result = s.db.transaction(() => {
      const row = get(req);
      if (row.version !== input.version)
        problem(
          409,
          "VERSION_CONFLICT",
          "This draft changed. Review its latest version.",
        );
      const required = {
        review: "Draft",
        approve: "Reviewed",
        publish: "Approved",
      }[input.action];
      if (row.kind === "content" && input.action === "publish") {
        if (row.status === "Published")
          problem(409, "ALREADY_PUBLISHED", "This course is already published.");
      } else if (row.status !== required)
        problem(
          409,
          "APPROVAL_REQUIRED",
          `This action requires a ${required.toLowerCase()} draft.`,
        );
      const document = JSON.parse(row.document_json);
      if (row.kind === "content") {
        draftCourseSchema.parse(document);
        validateQuestions(document.questions);
      } else {
        draftSimulationSchema.parse(document);
        validateSimulation(document);
      }
      let revisionId = null;
      if (input.action === "publish" && row.kind === "content") {
        revisionId = randomUUID();
        s.run(
          "INSERT INTO course_revisions(id,organization_id,course_id,version,status,document_json,created_by,created_at) VALUES (?,?,?,1,'Published',?,?,?)",
          revisionId,
          org(req),
          `studio:${row.id}`,
          JSON.stringify(document),
          req.auth.id,
          iso(),
        );
      }
      const status = {
        review: "Reviewed",
        approve: "Approved",
        publish: "Published",
      }[input.action];
      s.run(
        "UPDATE intelligence_drafts SET status=?,version=version+1,reviewed_by=COALESCE(?,reviewed_by),approved_by=COALESCE(?,approved_by),published_revision_id=COALESCE(?,published_revision_id),updated_at=? WHERE id=?",
        status,
        input.action === "review" ? req.auth.id : null,
        input.action === "approve" ? req.auth.id : null,
        revisionId,
        iso(),
        row.id,
      );
      s.audit(
        org(req),
        req.auth.id,
        `Draft ${status.toLowerCase()}`,
        row.id,
        { version: input.version, sourceHash: hash(row.input_json) },
        { status, revisionId, provenance: row.provenance },
      );
      return serialize(get(req));
    })();
    res.json({ draft: result });
  });
  route("post", "/studios/:id/assign", admin, (req, res) => {
    const input = validate(
      z
        .object({
          userIds: z.array(z.string()).min(1).max(500),
          acknowledged: z.literal(true),
        })
        .strict(),
      req.body,
    );
    const row = get(req);
    if (
      row.kind !== "simulation" ||
      !["Approved", "Published"].includes(row.status)
    )
      problem(
        409,
        "APPROVAL_REQUIRED",
        "Review and approve this simulation before assignment.",
      );
    const document = draftSimulationSchema.parse(JSON.parse(row.document_json));
    validateSimulation(document);
    const result = s.db.transaction(() => {
      for (const userId of input.userIds)
        if (
          !s.one(
            "SELECT 1 FROM users WHERE id=? AND organization_id=? AND active=1",
            userId,
            org(req),
          )
        )
          problem(
            404,
            "USER_NOT_FOUND",
            "Choose active employees in your organization.",
          );
      const ids = [...new Set(input.userIds)].map((userId) =>
        s.assignPractice(
          org(req),
          userId,
          document.topic,
          `studio:${row.id}:${row.version}`,
          { document, draftId: row.id, channel: document.channel },
        ),
      );
      s.audit(
        org(req),
        req.auth.id,
        "Approved practice assigned",
        row.id,
        { userIds: input.userIds, version: row.version },
        { assignments: ids, delivery: "Scenario only" },
      );
      return ids;
    })();
    res.status(201).json({ ids: result, delivery: "Scenario only" });
  });
}
