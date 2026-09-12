import { randomUUID } from "node:crypto";
import { rateLimit } from "express-rate-limit";
import { z } from "zod";

const inquirySchema = z
  .object({
    kind: z.enum(["demo", "contact", "pricing"]),
    name: z.string().trim().min(2).max(100),
    email: z
      .string()
      .trim()
      .email()
      .max(254)
      .transform((value) => value.toLowerCase()),
    company: z.string().trim().min(2).max(160),
    size: z.enum(["1–50", "51–200", "201–1,000", "1,001–5,000", "5,001+"]),
    message: z.string().trim().max(2000).default(""),
    consent: z.literal(true),
    website: z.string().max(200).default(""),
  })
  .strict();

export function registerMarketing(app, db) {
  db.exec(`CREATE TABLE IF NOT EXISTS marketing_inquiries (
    id TEXT PRIMARY KEY,
    kind TEXT NOT NULL,
    name TEXT NOT NULL,
    email TEXT NOT NULL,
    company TEXT NOT NULL,
    team_size TEXT NOT NULL,
    message TEXT NOT NULL,
    consent_at TEXT NOT NULL,
    created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
  )`);
  const prune = () =>
    db
      .prepare(
        "DELETE FROM marketing_inquiries WHERE created_at <= datetime('now', '-90 days')",
      )
      .run();
  prune();
  const cleanup = setInterval(prune, 60 * 60 * 1000);
  cleanup.unref();
  const limiter = rateLimit({
    windowMs: 60 * 60 * 1000,
    limit: 5,
    standardHeaders: "draft-8",
    legacyHeaders: false,
    message: {
      error: { message: "Too many requests. Please try again in an hour." },
    },
  });
  app.post("/api/public/inquiries", limiter, (req, res, next) => {
    const parsed = inquirySchema.safeParse(req.body);
    if (!parsed.success || parsed.data.website) {
      return res.status(400).json({
        error: { message: "Check your details and consent, then try again." },
      });
    }
    try {
      prune();
      const input = parsed.data;
      const id = randomUUID();
      db.prepare(
        `INSERT INTO marketing_inquiries (id, kind, name, email, company, team_size, message, consent_at)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
      ).run(
        id,
        input.kind,
        input.name,
        input.email,
        input.company,
        input.size,
        input.message,
        new Date().toISOString(),
      );
      res.status(201).json({ reference: id });
    } catch (error) {
      next(error);
    }
  });
  return () => clearInterval(cleanup);
}
