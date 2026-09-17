import { useEffect, useState } from "react";
import {
  Link,
  useNavigate,
  useParams,
  useSearchParams,
} from "react-router-dom";
import {
  ArrowRight,
  BookOpen,
  Check,
  FileText,
  Mail,
  Plus,
  ShieldCheck,
  Sparkles,
  Target,
  Upload,
  Users,
} from "lucide-react";
import {
  Button,
  Dialog,
  Empty,
  ErrorNotice,
  Field,
  Loading,
  PageTitle,
  Tabs,
  useLocale,
  useData,
} from "../ui";
import { act, display, Provenance, useIntelligence } from "./shared";

export function Studios() {
  const r = useIntelligence("/studios");
  const topics = useIntelligence("/threats");
  const { t } = useLocale();
  const [params] = useSearchParams();
  const [create, setCreate] = useState(params.has("kind"));
  const [kind, setKind] = useState(params.get("kind") || "content");
  const navigate = useNavigate();
  return (
    <div className="intel-page">
      <PageTitle
        eyebrow={t("CONTENT STUDIO", "STUDIO KONTEN")}
        title={t("AVERIS Content Studio", "AVERIS Content Studio")}
        description={t(
          "Turn guidance into focused learning and safe practice. Every draft stays under human review.",
          "Ubah panduan menjadi pembelajaran dan simulasi yang relevan. Setiap draft tetap ditinjau manusia.",
        )}
        actions={
          <Button onClick={() => setCreate(true)}>
            <Plus size={15} />
            {t("Create draft", "Buat draft")}
          </Button>
        }
      />
      <div className="intel-studio-intro">
        <div>
          <span className="intel-studio-icon">
            <FileText size={25} />
          </span>
          <h2>
            {t(
              "Start with what your people need to know.",
              "Mulai dari hal yang perlu diketahui tim Anda.",
            )}
          </h2>
          <p>
            {t(
              "Use a policy, PDF, text, URL, existing course, or security bulletin as your reference.",
              "Gunakan kebijakan, PDF, teks, URL, materi yang ada, atau buletin keamanan sebagai rujukan.",
            )}
          </p>
          <div className="intel-studio-sources">
            <span>{t("Policy / PDF", "Kebijakan / PDF")}</span>
            <span>{t("Text / URL", "Teks / URL")}</span>
            <span>{t("Existing learning", "Materi yang ada")}</span>
            <span>{t("Security bulletin", "Buletin keamanan")}</span>
          </div>
        </div>
        <div className="intel-studio-callout">
          <strong>One workspace, from idea to approved draft.</strong>
          <span>
            Choose the type, add context, then review the result before
            publishing.
          </span>
        </div>
      </div>
      <div className="intel-privacy-note">
        <ShieldCheck size={17} />
        {r.data?.provider.status || "AI unconfigured"}. Manual editing and the
        review workflow are available.
      </div>
      <Loading resource={r}>
        <div className="section-head">
          <h2>{t("Your drafts", "Draft Anda")}</h2>
          <Tabs
            value={kind}
            onChange={setKind}
            tabs={[
              ["content", t("Learning", "Pembelajaran")],
              ["simulation", t("Simulations", "Simulasi")],
            ]}
          />
        </div>
        {r.data?.drafts.filter((d: any) => d.kind === kind).length ? (
          <div className="intel-draft-list">
            {r.data.drafts
              .filter((d: any) => d.kind === kind)
              .map((d: any) => (
                <Link to={`/admin/studio/${d.id}`} className="sheet" key={d.id}>
                  <div className="section-head">
                    {d.kind === "content" ? (
                      <BookOpen size={21} />
                    ) : (
                      <Target size={21} />
                    )}
                    <span
                      className={`intel-status ${d.status === "Published" ? "positive" : ""}`}
                    >
                      {d.status}
                    </span>
                  </div>
                  <h3>{d.title}</h3>
                  <p>{d.document.description || d.document.objective}</p>
                  <Provenance>{d.provenance}</Provenance>
                  <div className="intel-draft-foot">
                    <small>
                      Version {d.version} ·{" "}
                      {new Date(d.updated_at).toLocaleDateString()}
                    </small>
                    <ArrowRight size={15} />
                  </div>
                </Link>
              ))}
          </div>
        ) : (
          <Empty
            title="Your next useful draft starts here"
            description="Choose a competency and source. A manual draft uses clearly labeled editorial content; AI is never implied."
          />
        )}
      </Loading>
      {create && (
        <CreateDraft
          initialKind={kind}
          topics={topics.data?.topics || []}
          provider={r.data?.provider}
          onClose={() => setCreate(false)}
          onCreated={(id) => navigate(`/admin/studio/${id}`)}
        />
      )}
    </div>
  );
}
function CreateDraft({
  initialKind,
  topics,
  provider,
  onClose,
  onCreated,
}: {
  initialKind: string;
  topics: string[];
  provider: any;
  onClose: () => void;
  onCreated: (id: string) => void;
}) {
  const { t } = useLocale();
  const [kind, setKind] = useState(initialKind);
  const [source, setSource] = useState("");
  const [sourceLabel, setSourceLabel] = useState("Manual source");
  const [sourceType, setSourceType] = useState("text");
  const [url, setUrl] = useState("");
  const [generationMode, setGenerationMode] = useState<"manual" | "ai">(
    "manual",
  );
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<unknown>(null);
  const courses = useData("/courses");
  const threats = useIntelligence("/threats");
  return (
    <Dialog
      title={t(
        kind === "content" ? "Create learning" : "Create simulation",
        kind === "content" ? "Buat pembelajaran" : "Buat simulasi",
      )}
      onClose={onClose}
    >
      <form
        className="intel-form"
        onSubmit={async (e) => {
          e.preventDefault();
          const form = e.currentTarget;
          const f = new FormData(form);
          const submitter = (e.nativeEvent as SubmitEvent)
            .submitter as HTMLButtonElement;
          setBusy(true);
          setError(null);
          try {
            const result = await act("/studios", {
              kind,
              topic: f.get("topic"),
              title: f.get("title"),
              sourceText: source,
              sourceLabel,
              channel: f.get("channel") || "Email",
              difficulty: Number(f.get("difficulty") || 2),
              context: f.get("context") || "",
              language: f.get("language") || "en",
              generationLevel: f.get("generationLevel") || "Foundation",
              lessonCount: Number(f.get("lessonCount") || 3),
              generate:
                kind === "content"
                  ? generationMode === "ai"
                  : submitter?.value === "ai",
            });
            onCreated(result.draft.id);
          } catch (e) {
            setError(e);
          } finally {
            setBusy(false);
          }
        }}
      >
        <div className="intel-form-heading">
          <div>
            <strong>
              {t("Start with the outcome", "Mulai dari hasil yang diinginkan")}
            </strong>
            <p>
              {t(
                "Give this draft a clear purpose. You can edit every generated detail later.",
                "Tentukan tujuan draft dengan jelas. Semua hasil tetap bisa diedit nanti.",
              )}
            </p>
          </div>
          <span className="intel-status">Draft only</span>
        </div>
        <Tabs
          value={kind}
          onChange={setKind}
          tabs={[
            ["content", "Learning"],
            ["simulation", "Simulation"],
          ]}
        />
        <Field
          label={t("Title", "Judul")}
          hint={t(
            "Use a name your team will recognize.",
            "Gunakan nama yang mudah dikenali tim.",
          )}
        >
          <input
            name="title"
            maxLength={150}
            placeholder={
              kind === "content"
                ? "e.g. Safe AI at work"
                : "e.g. Finance payment verification"
            }
          />
        </Field>
        <div className="intel-form-grid">
          <Field label={t("Competency", "Kompetensi")}>
            <select name="topic">
              {topics.map((t) => (
                <option key={t}>{t}</option>
              ))}
            </select>
          </Field>
          <Field label={t("Content language", "Bahasa konten")}>
            <select name="language">
              <option value="en">English</option>
              <option value="id">Bahasa Indonesia</option>
            </select>
          </Field>
        </div>
        {kind === "content" && (
          <div className="intel-form-heading">
            <div>
              <strong>
                {t(
                  "How do you want to create it?",
                  "Bagaimana Anda ingin membuatnya?",
                )}
              </strong>
              <p>
                {t(
                  "Start manually, or let AI prepare an editable first version.",
                  "Mulai secara manual, atau biarkan AI menyiapkan versi awal yang bisa diedit.",
                )}
              </p>
            </div>
            <div className="actions">
              <Button
                type="button"
                variant={generationMode === "manual" ? undefined : "secondary"}
                onClick={() => setGenerationMode("manual")}
              >
                {t("Manual", "Manual")}
              </Button>
              <Button
                type="button"
                variant={generationMode === "ai" ? undefined : "secondary"}
                onClick={() => setGenerationMode("ai")}
              >
                <Sparkles size={15} />
                {t("AI generated", "Generate dengan AI")}
              </Button>
            </div>
          </div>
        )}
        {kind === "simulation" ? (
          <>
            <div className="intel-form-grid">
              <Field label={t("Channel", "Kanal")}>
                <select name="channel">
                  {[
                    "Email",
                    "SMS",
                    "QR",
                    "Collaboration",
                    "Voice",
                    "Callback",
                    "Deepfake",
                  ].map((c) => (
                    <option key={c}>{c}</option>
                  ))}
                </select>
              </Field>
              <Field label={t("Difficulty (1–10)", "Tingkat kesulitan (1–10)")}>
                <input
                  name="difficulty"
                  type="number"
                  min={1}
                  max={10}
                  defaultValue={4}
                />
              </Field>
            </div>
            <Field label={t("Workplace context", "Konteks pekerjaan")}>
              <input
                name="context"
                maxLength={500}
                placeholder="Quarter-end invoice approval"
              />
            </Field>
            <p className="intel-help">
              All channels support in-app scenarios. External email requires
              configured SMTP and an explicit send action. Other delivery
              channels are not connected.
            </p>
          </>
        ) : generationMode === "ai" ? (
          <>
            <div className="intel-form-grid">
              <Field
                label={t("Course level", "Level course")}
                hint={t(
                  "Sets the language and complexity.",
                  "Mengatur bahasa dan tingkat kompleksitas.",
                )}
              >
                <select name="generationLevel">
                  <option value="Foundation">
                    {t("Easy · Foundation", "Mudah · Foundation")}
                  </option>
                  <option value="Intermediate">
                    {t("Balanced · Intermediate", "Seimbang · Intermediate")}
                  </option>
                  <option value="Advanced">
                    {t("Deep · Advanced", "Mendalam · Advanced")}
                  </option>
                </select>
              </Field>
              <Field
                label={t("Number of lessons", "Banyaknya lesson")}
                hint={t(
                  "Choose how much content AI should prepare.",
                  "Pilih jumlah materi yang disiapkan AI.",
                )}
              >
                <select name="lessonCount">
                  <option value="2">2 {t("lessons", "lesson")}</option>
                  <option value="3">3 {t("lessons", "lesson")}</option>
                  <option value="5">5 {t("lessons", "lesson")}</option>
                  <option value="7">7 {t("lessons", "lesson")}</option>
                </select>
              </Field>
            </div>
            <Field
              label={t(
                "Reference material (optional)",
                "Materi rujukan (opsional)",
              )}
            >
              <select
                value={sourceType}
                onChange={(e) => setSourceType(e.target.value)}
              >
                <option value="text">Paste policy or guidance</option>
                <option value="file">PDF or text document</option>
                <option value="url">Public source URL</option>
                <option value="course">Existing course</option>
                <option value="bulletin">Security bulletin</option>
              </select>
            </Field>
            {sourceType === "file" && (
              <Field
                label={t(
                  "Upload policy or guidance",
                  "Unggah kebijakan atau panduan",
                )}
              >
                <input
                  type="file"
                  accept=".pdf,.txt,.md"
                  onChange={async (e) => {
                    const file = e.target.files?.[0];
                    if (!file) return;
                    setBusy(true);
                    setError(null);
                    try {
                      const { readPolicyFile } = await import("./pdf-source");
                      setSource(await readPolicyFile(file));
                      setSourceLabel(file.name);
                    } catch (e) {
                      setError(e);
                    } finally {
                      setBusy(false);
                    }
                  }}
                />
              </Field>
            )}
            {sourceType === "url" && (
              <div className="intel-source-url">
                <Field label={t("Source URL", "URL sumber")}>
                  <input
                    type="url"
                    value={url}
                    onChange={(e) => setUrl(e.target.value)}
                    placeholder="https://"
                  />
                </Field>
                <Button
                  type="button"
                  variant="secondary"
                  disabled={busy || !url}
                  onClick={async () => {
                    setBusy(true);
                    setError(null);
                    try {
                      const result = await act("/sources/url", { url });
                      setSource(result.text);
                      setSourceLabel(result.source);
                    } catch (e) {
                      setError(e);
                    } finally {
                      setBusy(false);
                    }
                  }}
                >
                  {t("Import", "Impor")}
                </Button>
              </div>
            )}
            {sourceType === "course" && (
              <Field
                label={t("Existing learning", "Pembelajaran yang sudah ada")}
              >
                <select
                  defaultValue=""
                  onChange={(e) => {
                    const course = courses.data?.courses.find(
                      (c: any) => c.id === e.target.value,
                    );
                    if (course) {
                      setSource(
                        course.document.lessons
                          .map((l: any) => `${l.title}\n${l.content}`)
                          .join("\n\n")
                          .slice(0, 40000),
                      );
                      setSourceLabel(course.document.title);
                    }
                  }}
                >
                  <option value="">Choose learning</option>
                  {courses.data?.courses.map((c: any) => (
                    <option value={c.id} key={c.id}>
                      {c.document.title}
                    </option>
                  ))}
                </select>
              </Field>
            )}
            {sourceType === "bulletin" && (
              <Field label={t("Security bulletin", "Buletin keamanan")}>
                <select
                  defaultValue=""
                  onChange={(e) => {
                    const threat = threats.data?.threats.find(
                      (t: any) => t.id === e.target.value,
                    );
                    if (threat) {
                      setSource(threat.description);
                      setSourceLabel(`${threat.title} · ${threat.source}`);
                    }
                  }}
                >
                  <option value="">Choose a bulletin</option>
                  {threats.data?.threats.map((t: any) => (
                    <option value={t.id} key={t.id}>
                      {t.title}
                    </option>
                  ))}
                </select>
              </Field>
            )}
            <Field
              label={t("Reference text", "Teks rujukan")}
              hint={t(
                "Optional. Keep only the guidance you want to turn into learning.",
                "Opsional. Masukkan panduan yang ingin diubah menjadi pembelajaran.",
              )}
            >
              <textarea
                value={source}
                onChange={(e) => setSource(e.target.value)}
                rows={5}
                maxLength={40000}
              />
            </Field>
            <small>
              {source.length.toLocaleString()} / 40,000 characters ·{" "}
              {sourceLabel}
            </small>
          </>
        ) : (
          <div className="intel-privacy-note">
            <BookOpen size={17} />
            {t(
              "You can add lessons and quiz questions in the editor after creating the course.",
              "Anda dapat menambahkan lesson dan pertanyaan kuis di editor setelah membuat course.",
            )}
          </div>
        )}
        <ErrorNotice error={error} />
        <div className="actions">
          {kind === "content" ? (
            <Button
              disabled={
                busy ||
                (generationMode === "ai" &&
                  (!provider?.configured || !provider?.enabled))
              }
              aria-label={t("Create course", "Buat course")}
            >
              {busy
                ? t("Preparing…", "Menyiapkan…")
                : generationMode === "ai"
                  ? t("Generate course", "Generate course")
                  : t("Create course", "Buat course")}
            </Button>
          ) : (
            <>
              <Button name="method" value="manual" disabled={busy}>
                {busy
                  ? t("Preparing…", "Menyiapkan…")
                  : t("Create draft", "Buat draft")}
              </Button>
              <Button
                name="method"
                value="ai"
                variant="secondary"
                disabled={busy || !provider?.configured || !provider?.enabled}
              >
                <Sparkles size={15} />
                {t("Generate with AI", "Buat dengan AI")}
              </Button>
            </>
          )}
        </div>
        <p className="intel-help">
          {t(
            "You can edit the course before publishing. Nothing is published automatically.",
            "Course dapat diedit sebelum diterbitkan. Tidak ada yang dipublikasikan otomatis.",
          )}
        </p>
      </form>
    </Dialog>
  );
}
export function StudioEditor() {
  const { id } = useParams();
  const r = useIntelligence(`/studios/${id}`);
  const [document, setDocument] = useState<any>(null);
  const [dirty, setDirty] = useState(false);
  const [preview, setPreview] = useState(false);
  const [assign, setAssign] = useState(false);
  const [error, setError] = useState<unknown>(null);
  const [busy, setBusy] = useState(false);
  const [ack, setAck] = useState(false);
  const [tab, setTab] = useState("content");
  const d = r.data?.draft;
  useEffect(() => {
    if (d) {
      setDocument(structuredClone(d.document));
      setDirty(false);
      setAck(false);
    }
  }, [d?.version]);
  const change = (next: any) => {
    setDocument(next);
    setDirty(true);
    setAck(false);
  };
  const save = async () => {
    setBusy(true);
    setError(null);
    try {
      await act(`/studios/${id}`, { version: d.version, document }, "PUT");
      r.reload();
    } catch (e) {
      setError(e);
    } finally {
      setBusy(false);
    }
  };
  const transition = async (action: string, acknowledged = ack) => {
    setBusy(true);
    setError(null);
    try {
      await act(`/studios/${id}/action`, {
        action,
        version: d.version,
        acknowledged,
      });
      r.reload();
    } catch (e) {
      setError(e);
    } finally {
      setBusy(false);
    }
  };
  return (
    <div className="intel-page">
      <Link className="intel-link" to="/admin/studio">
        ← Content Studio
      </Link>
      <Loading resource={r}>
        {d && document && (
          <>
            <PageTitle
              eyebrow={
                d.kind === "content" ? "LEARNING DRAFT" : "SIMULATION DRAFT"
              }
              title={d.title}
              description={`Version ${d.version} · ${d.provenance}`}
              actions={
                <>
                  <Button variant="secondary" onClick={() => setPreview(true)}>
                    Preview
                  </Button>
                  {d.status !== "Published" && (
                    <Button disabled={busy || !dirty} onClick={save}>
                      Save changes
                    </Button>
                  )}
                </>
              }
            />
            <div className="intel-privacy-note">
              <BookOpen size={16} />
              {d.status === "Published"
                ? "Published course"
                : "Draft course · ready to edit"}
            </div>
            <ErrorNotice error={error} />
            <div className="intel-editor-layout">
              <section className="sheet">
                <Tabs
                  value={tab}
                  onChange={setTab}
                  tabs={
                    d.kind === "content"
                      ? [
                          ["content", "Lessons"],
                          ["questions", "Quiz & explanations"],
                          ["settings", "Details"],
                        ]
                      : [
                          ["content", "Scenario"],
                          ["settings", "Design factors"],
                        ]
                  }
                />
                {d.kind === "content" ? (
                  <>
                    {tab === "content" && (
                      <div className="intel-editor-lessons">
                        {document.lessons.map((lesson: any, i: number) => (
                          <div key={i}>
                            <span className="intel-eyebrow">
                              LESSON {i + 1}
                            </span>
                            <Field label={`Lesson ${i + 1} title`}>
                              <input
                                disabled={d.status === "Published"}
                                value={lesson.title}
                                onChange={(e) =>
                                  change({
                                    ...document,
                                    lessons: document.lessons.map(
                                      (l: any, j: number) =>
                                        j === i
                                          ? { ...l, title: e.target.value }
                                          : l,
                                    ),
                                  })
                                }
                              />
                            </Field>
                            <Field label={`Lesson ${i + 1} content`}>
                              <textarea
                                disabled={d.status === "Published"}
                                rows={7}
                                value={lesson.content}
                                onChange={(e) =>
                                  change({
                                    ...document,
                                    lessons: document.lessons.map(
                                      (l: any, j: number) =>
                                        j === i
                                          ? { ...l, content: e.target.value }
                                          : l,
                                    ),
                                  })
                                }
                              />
                            </Field>
                          </div>
                        ))}
                        {d.status !== "Published" && (
                          <Button
                            variant="secondary"
                            onClick={() =>
                              change({
                                ...document,
                                lessons: [
                                  ...document.lessons,
                                  {
                                    title: "New lesson",
                                    kind: "Article",
                                    content:
                                      "Add practical guidance and a relevant workplace example.",
                                  },
                                ],
                              })
                            }
                          >
                            <Plus size={14} />
                            Add lesson
                          </Button>
                        )}
                      </div>
                    )}
                    {tab === "questions" && (
                      <div className="intel-editor-lessons">
                        <div className="intel-privacy-note">
                          <ShieldCheck size={16} />
                          Questions are checked for duplicate prompts, repeated
                          options, and valid answer mappings before review.
                        </div>
                        {document.questions.map((q: any, i: number) => (
                          <QuestionEditor
                            key={i}
                            question={q}
                            index={i}
                            disabled={d.status === "Published"}
                            onChange={(next) =>
                              change({
                                ...document,
                                questions: document.questions.map(
                                  (item: any, j: number) =>
                                    j === i ? next : item,
                                ),
                              })
                            }
                          />
                        ))}
                        <Button
                          variant="secondary"
                          disabled={d.status === "Published"}
                          onClick={() =>
                            change({
                              ...document,
                              questions: [
                                ...document.questions,
                                {
                                  prompt:
                                    "Describe a workplace decision to assess.",
                                  type: "scenario",
                                  options: [
                                    "A safer action",
                                    "An unsafe action",
                                    "An incomplete action",
                                  ],
                                  correct: [0],
                                  explanation:
                                    "Explain why the safer action follows the organization’s guidance.",
                                },
                              ],
                            })
                          }
                        >
                          Add question
                        </Button>
                        <Button
                          variant="secondary"
                          disabled={
                            !r.data.provider.enabled ||
                            !r.data.provider.configured ||
                            dirty ||
                            d.status === "Published" ||
                            busy
                          }
                          onClick={async () => {
                            setBusy(true);
                            try {
                              await act(`/studios/${id}/questions`, {
                                version: d.version,
                                difficulty: "Foundation",
                                competency: document.category,
                                language: document.language,
                              });
                              r.reload();
                            } catch (e) {
                              setError(e);
                            } finally {
                              setBusy(false);
                            }
                          }}
                        >
                          <Sparkles size={14} />
                          Generate question drafts
                        </Button>
                      </div>
                    )}
                    {tab === "settings" && (
                      <div className="intel-form">
                        <Field label="Course title">
                          <input
                            disabled={d.status === "Published"}
                            value={document.title}
                            onChange={(e) =>
                              change({ ...document, title: e.target.value })
                            }
                          />
                        </Field>
                        <Field label="Learning objective / description">
                          <textarea
                            disabled={d.status === "Published"}
                            value={document.description}
                            onChange={(e) =>
                              change({
                                ...document,
                                description: e.target.value,
                              })
                            }
                          />
                        </Field>
                        <div className="intel-form-grid">
                          <Field label="Duration (minutes)">
                            <input
                              type="number"
                              min={2}
                              max={60}
                              disabled={d.status === "Published"}
                              value={document.duration}
                              onChange={(e) =>
                                change({
                                  ...document,
                                  duration: Number(e.target.value),
                                })
                              }
                            />
                          </Field>
                          <Field label="Language">
                            <select
                              disabled={d.status === "Published"}
                              value={document.language}
                              onChange={(e) =>
                                change({
                                  ...document,
                                  language: e.target.value,
                                })
                              }
                            >
                              <option value="en">English</option>
                              <option value="id">Bahasa Indonesia</option>
                            </select>
                          </Field>
                        </div>
                      </div>
                    )}
                  </>
                ) : (
                  <div className="intel-form">
                    {tab === "content" ? (
                      <>
                        <Field label="Scenario title">
                          <input
                            disabled={d.status === "Published"}
                            value={document.title}
                            onChange={(e) =>
                              change({ ...document, title: e.target.value })
                            }
                          />
                        </Field>
                        <Field label="Message subject">
                          <input
                            disabled={d.status === "Published"}
                            value={document.subject}
                            onChange={(e) =>
                              change({ ...document, subject: e.target.value })
                            }
                          />
                        </Field>
                        <Field label="Controlled message">
                          <textarea
                            rows={5}
                            disabled={d.status === "Published"}
                            value={document.message}
                            onChange={(e) =>
                              change({ ...document, message: e.target.value })
                            }
                          />
                        </Field>
                        <Field label="Learning objective">
                          <textarea
                            disabled={d.status === "Published"}
                            value={document.objective}
                            onChange={(e) =>
                              change({ ...document, objective: e.target.value })
                            }
                          />
                        </Field>
                        <Field label="Safer next action">
                          <textarea
                            disabled={d.status === "Published"}
                            value={document.safeAction}
                            onChange={(e) =>
                              change({
                                ...document,
                                safeAction: e.target.value,
                              })
                            }
                          />
                        </Field>
                      </>
                    ) : (
                      <>
                        <Field label="Configured difficulty (1–10)">
                          <input
                            type="number"
                            min={1}
                            max={10}
                            value={document.difficulty}
                            disabled={d.status === "Published"}
                            onChange={(e) =>
                              change({
                                ...document,
                                difficulty: Number(e.target.value),
                              })
                            }
                          />
                        </Field>
                        <p>
                          These are scenario design factors, not an AI
                          prediction of employee failure.
                        </p>
                        {document.difficultyFactors.map((factor: any) => (
                          <div
                            className="intel-design-factor"
                            key={factor.factor}
                          >
                            <span>{factor.factor}</span>
                            <strong>{factor.value} / 10</strong>
                          </div>
                        ))}
                        <h3>Detectable indicators</h3>
                        <ul>
                          {document.indicators.map((indicator: string) => (
                            <li key={indicator}>{indicator}</li>
                          ))}
                        </ul>
                      </>
                    )}
                  </div>
                )}
              </section>
              <aside className="intel-editor-review">
                <span className="intel-eyebrow">PUBLISHING CONTROL</span>
                <h2>
                  {d.status === "Published"
                    ? "Published with approval"
                    : "A human makes the call."}
                </h2>
                <p>
                  Verify the source, factual accuracy, relevance, and answer
                  explanations. Simulations must remain controlled and safe.
                </p>
                <Provenance>{d.provenance}</Provenance>
                <dl>
                  <div>
                    <dt>Source</dt>
                    <dd>{d.input.sourceLabel}</dd>
                  </div>
                  <div>
                    <dt>Reviewed</dt>
                    <dd>
                      {d.reviewed_by ? "Human reviewed" : "Not yet reviewed"}
                    </dd>
                  </div>
                  <div>
                    <dt>Approved</dt>
                    <dd>
                      {d.approved_by ? "Human approved" : "Not yet approved"}
                    </dd>
                  </div>
                </dl>
                {d.status !== "Published" && (
                  <>
                    <label className="intel-consent">
                      <input
                        type="checkbox"
                        checked={ack}
                        onChange={(e) => setAck(e.target.checked)}
                        disabled={dirty}
                      />
                      <span>
                        I reviewed this version and approve the next step.
                      </span>
                    </label>
                    <Button
                      disabled={!ack || dirty || busy}
                      onClick={() =>
                        transition(
                          d.status === "Draft"
                            ? "review"
                            : d.status === "Reviewed"
                              ? "approve"
                              : "publish",
                        )
                      }
                    >
                      {d.status === "Draft"
                        ? "Mark reviewed"
                        : d.status === "Reviewed"
                          ? "Approve this version"
                          : "Publish approved content"}
                      <Check size={15} />
                    </Button>
                  </>
                )}
                {dirty && (
                  <p className="intel-warning">
                    Save your edits before review. Editing resets prior
                    approval.
                  </p>
                )}
                {d.kind === "simulation" &&
                  ["Approved", "Published"].includes(d.status) && (
                    <Button variant="secondary" onClick={() => setAssign(true)}>
                      <Users size={15} />
                      Assign practice
                    </Button>
                  )}
                {d.published_revision_id && (
                  <Link
                    className="intel-link"
                    to={`/admin/learning/${d.published_revision_id}`}
                  >
                    View published learning
                    <ArrowRight size={14} />
                  </Link>
                )}
              </aside>
            </div>
          </>
        )}
      </Loading>
      {preview && (
        <Dialog
          title="Employee experience preview"
          onClose={() => setPreview(false)}
        >
          <div className="intel-form">
            {d.kind === "content" ? (
              <>
                <Provenance>Preview · answers visible to reviewers</Provenance>
                <h2>{document.title}</h2>
                {document.lessons.map((l: any, i: number) => (
                  <section key={i}>
                    <h3>{l.title}</h3>
                    <p className="intel-preserve-lines">{l.content}</p>
                  </section>
                ))}
                {document.questions.map((q: any, i: number) => (
                  <section key={i}>
                    <h3>{q.prompt}</h3>
                    {q.options.map((o: string, j: number) => (
                      <p key={j}>
                        {q.correct.includes(j) ? "✓ " : ""}
                        {o}
                      </p>
                    ))}
                    <small>{q.explanation}</small>
                  </section>
                ))}
              </>
            ) : (
              <>
                <span className="intel-status">
                  {document.channel} · Scenario only
                </span>
                <h2>{document.subject}</h2>
                <p>{document.message}</p>
                <h3>Coaching moment</h3>
                <ul>
                  {document.indicators.map((v: string) => (
                    <li key={v}>{v}</li>
                  ))}
                </ul>
                <p>
                  <strong>Next time:</strong> {document.safeAction}
                </p>
                <small>{document.safety}</small>
              </>
            )}
          </div>
        </Dialog>
      )}
      {assign && (
        <AssignPractice
          draft={d}
          onClose={() => setAssign(false)}
          onSaved={r.reload}
        />
      )}
    </div>
  );
}
function QuestionEditor({
  question: q,
  index,
  disabled,
  onChange,
}: {
  question: any;
  index: number;
  disabled: boolean;
  onChange: (q: any) => void;
}) {
  return (
    <div className="intel-question-editor">
      <Field label={`Question ${index + 1}`}>
        <textarea
          rows={3}
          disabled={disabled}
          value={q.prompt}
          onChange={(e) => onChange({ ...q, prompt: e.target.value })}
        />
      </Field>
      {q.options.map((option: string, i: number) => (
        <label className="intel-answer-option" key={i}>
          <input
            type={q.type === "multiple" ? "checkbox" : "radio"}
            disabled={disabled}
            name={`question-${index}`}
            checked={q.correct.includes(i)}
            onChange={() =>
              onChange({
                ...q,
                correct:
                  q.type === "multiple"
                    ? q.correct.includes(i)
                      ? q.correct.filter((v: number) => v !== i)
                      : [...q.correct, i]
                    : [i],
              })
            }
            aria-label={`Mark option ${i + 1} correct for question ${index + 1}`}
          />
          <input
            value={option}
            disabled={disabled}
            onChange={(e) =>
              onChange({
                ...q,
                options: q.options.map((o: string, j: number) =>
                  i === j ? e.target.value : o,
                ),
              })
            }
            aria-label={`Option ${i + 1} for question ${index + 1}`}
          />
        </label>
      ))}
      <Field label={`Explanation for question ${index + 1}`}>
        <textarea
          rows={2}
          disabled={disabled}
          value={q.explanation}
          onChange={(e) => onChange({ ...q, explanation: e.target.value })}
        />
      </Field>
    </div>
  );
}
function AssignPractice({
  draft,
  onClose,
  onSaved,
}: {
  draft: any;
  onClose: () => void;
  onSaved: () => void;
}) {
  const r = useIntelligence("/profiles");
  const [selected, setSelected] = useState<string[]>([]);
  const [error, setError] = useState<unknown>(null);
  const [busy, setBusy] = useState(false);
  const [done, setDone] = useState(false);
  return (
    <Dialog title="Assign approved practice" onClose={onClose}>
      {done ? (
        <div className="intel-form" role="status">
          <ShieldCheck size={28} />
          <h3>Practice assigned.</h3>
          <p>
            Employees can open their challenge from their home page. No external
            message was sent.
          </p>
          <Link className="btn primary" to="/admin/simulations">
            Open simulations
            <ArrowRight size={14} />
          </Link>
        </div>
      ) : (
        <form
          className="intel-form"
          onSubmit={async (e) => {
            e.preventDefault();
            setBusy(true);
            try {
              await act(`/studios/${draft.id}/assign`, {
                userIds: selected,
                acknowledged: true,
              });
              setDone(true);
              onSaved();
            } catch (e) {
              setError(e);
            } finally {
              setBusy(false);
            }
          }}
        >
          <p>
            {draft.title} · Approved version {draft.version}
          </p>
          <div className="intel-audience-select">
            {r.data?.profiles
              .filter((p: any) => p.role === "employee")
              .map((p: any) => (
                <label key={p.id}>
                  <input
                    type="checkbox"
                    checked={selected.includes(p.id)}
                    onChange={(e) =>
                      setSelected(
                        e.target.checked
                          ? [...selected, p.id]
                          : selected.filter((id) => id !== p.id),
                      )
                    }
                  />
                  <span>
                    {p.name}
                    <small>{p.department}</small>
                  </span>
                </label>
              ))}
          </div>
          <label className="intel-consent">
            <input type="checkbox" required />I reviewed this audience and the
            approved scenario.
          </label>
          <ErrorNotice error={error} />
          <Button disabled={!selected.length || busy}>
            Assign to {selected.length} people
          </Button>
        </form>
      )}
    </Dialog>
  );
}
function SimulationLibrary() {
  const { t } = useLocale();
  const resource = useIntelligence("/studios");
  const [query, setQuery] = useState("");
  const [selected, setSelected] = useState<any>(null);
  const templates = (resource.data?.drafts || []).filter(
    (draft: any) =>
      draft.kind === "simulation" &&
      `${draft.title} ${draft.document.topic || ""}`
        .toLowerCase()
        .includes(query.toLowerCase()),
  );
  return (
    <section className="sheet section">
      <div className="section-head">
        <div>
          <h2>{t("Simulation library", "Pustaka simulasi")}</h2>
          <p>
            {t(
              "Preview your scenarios and review each version before assigning practice.",
              "Pratinjau skenario Anda dan tinjau setiap versi sebelum menugaskan latihan.",
            )}
          </p>
        </div>
        <input
          style={{ maxWidth: 280 }}
          aria-label={t("Search simulations", "Cari simulasi")}
          placeholder={t("Search scenarios", "Cari skenario")}
          value={query}
          onChange={(e) => setQuery(e.target.value)}
        />
      </div>
      <Loading resource={resource}>
        {templates.length ? (
          templates.map((draft: any) => (
            <div className="row" key={draft.id}>
              <div>
                <strong>{draft.title}</strong>
                <small>
                  {draft.document.channel} · {t("Version", "Versi")}{" "}
                  {draft.version} · {draft.status}
                </small>
              </div>
              <Button variant="secondary" onClick={() => setSelected(draft)}>
                {t("Preview", "Pratinjau")}
              </Button>
            </div>
          ))
        ) : (
          <Empty
            title={t("No matching scenarios", "Tidak ada skenario yang cocok")}
            description={t(
              "Create a reviewed scenario in Simulation Studio. Published learning and scenarios remain separate.",
              "Buat skenario yang ditinjau di Studio Simulasi. Pembelajaran terbit dan skenario tetap terpisah.",
            )}
          />
        )}
      </Loading>
      <div className="actions section">
        <Link className="btn secondary" to="/admin/studio?kind=simulation">
          {t("Create scenario", "Buat skenario")}
        </Link>
        <Link className="btn secondary" to="/admin/campaigns/new">
          {t("Plan a campaign", "Rencanakan kampanye")}
        </Link>
      </div>
      {selected && (
        <Dialog title={selected.title} onClose={() => setSelected(null)}>
          <span className="intel-status">
            {selected.status} · {t("Version", "Versi")} {selected.version}
          </span>
          <h3 className="section">{selected.document.subject}</h3>
          <p className="lesson-prose">{selected.document.message}</p>
          <div className="notice section">
            {t(
              "Preview only. No message is sent and no credentials are collected. Campaign phishing options are configured separately in the campaign builder.",
              "Hanya pratinjau. Tidak ada pesan dikirim atau kredensial dikumpulkan. Opsi phishing kampanye diatur terpisah di pembuat kampanye.",
            )}
          </div>
          <Link className="btn primary" to={`/admin/studio/${selected.id}`}>
            {t("Review scenario", "Tinjau skenario")}
          </Link>
        </Dialog>
      )}
    </section>
  );
}

export function Simulations() {
  const { t } = useLocale();
  const r = useIntelligence("/practice");
  const [send, setSend] = useState<any>(null);
  const [error, setError] = useState<unknown>(null);
  return (
    <div className="intel-page">
      <PageTitle
        eyebrow="SAFE, RELEVANT PRACTICE"
        title="Simulations"
        description="Adapt topic and difficulty from demonstrated performance. Practice remains controlled and supportive."
        actions={
          <Link className="btn primary" to="/admin/studio?kind=simulation">
            <Plus size={15} />
            Create simulation
          </Link>
        }
      />
      <div className="intel-channel-strip">
        {r.data?.channels.map((c: any) => (
          <div key={c.name}>
            <span>{c.name}</span>
            <small>{c.status}</small>
          </div>
        ))}
      </div>
      <div className="intel-privacy-note">
        <ShieldCheck size={17} />
        No real credentials, MFA codes, malware, or external authorization.
        Voice and deepfake scenarios teach independent verification.
      </div>
      <SimulationLibrary />
      <Loading resource={r}>
        <section className="sheet">
          <div className="section-head">
            <h2>Assigned practice</h2>
            <Provenance>Difficulty follows demonstrated performance</Provenance>
          </div>
          {r.data?.assignments.length ? (
            <div className="table-scroll">
              <table>
                <thead>
                  <tr>
                    <th>Employee</th>
                    <th>Competency</th>
                    <th>Channel</th>
                    <th>Difficulty</th>
                    <th>Response</th>
                    <th>Delivery</th>
                  </tr>
                </thead>
                <tbody>
                  {r.data.assignments.map((p: any) => (
                    <tr key={p.id}>
                      <td>
                        <strong>{p.name}</strong>
                        <small>{p.department}</small>
                      </td>
                      <td>{p.topic}</td>
                      <td>{p.channel}</td>
                      <td>{p.difficulty} / 10</td>
                      <td>
                        <span
                          className={`intel-status ${p.reported_at ? "positive" : ""}`}
                        >
                          {p.reported_at
                            ? "Reported"
                            : p.clicked_at
                              ? t("Clicked", "Diklik")
                              : p.opened_at
                                ? t("Opened", "Dibuka")
                                : t("No action", "Belum ada tindakan")}
                        </span>
                      </td>
                      <td>
                        {p.delivery}
                        <small>
                          {p.channel === "Email" &&
                            r.data.smtpConfigured &&
                            p.delivery === "Scenario only" && (
                              <button
                                className="intel-link"
                                onClick={() => setSend(p)}
                              >
                                Review email delivery
                              </button>
                            )}
                        </small>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ) : (
            <Empty
              title="Build a useful practice scenario"
              description="Start with a competency, review the scenario, then assign it to the relevant audience."
              action={
                <Link className="intel-link" to="/admin/studio?kind=simulation">
                  Open Simulation Studio
                  <ArrowRight size={15} />
                </Link>
              }
            />
          )}
        </section>
      </Loading>
      <ErrorNotice error={error} />
      {send && (
        <Dialog
          title="Send controlled email practice?"
          onClose={() => setSend(null)}
        >
          <form
            className="intel-form"
            onSubmit={async (e) => {
              e.preventDefault();
              try {
                await act(`/practice/${send.id}/send`, { acknowledged: true });
                setSend(null);
                r.reload();
              } catch (e) {
                setError(e);
              }
            }}
          >
            <p>
              This queues an email to <strong>{send.name}</strong> using the
              configured SMTP connection. The message links to their
              authenticated AVERIS challenge.
            </p>
            <h3>{send.document.subject}</h3>
            <p>{send.document.message}</p>
            <label className="intel-consent">
              <input type="checkbox" required />I authorize delivery of this
              approved training scenario to this employee.
            </label>
            <ErrorNotice error={error} />
            <Button>
              <Mail size={15} />
              Queue training email
            </Button>
          </form>
        </Dialog>
      )}
    </div>
  );
}
