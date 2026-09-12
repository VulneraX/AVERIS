import "dotenv/config";
import Database from "better-sqlite3";
import { resolve } from "node:path";
import { writeFileSync } from "node:fs";

const outputIndex = process.argv.indexOf("--output");
if (outputIndex < 0 || !process.argv[outputIndex + 1]) {
  console.error(
    "Usage: npm run inquiries:export -- --output /secure/path/inquiries.json",
  );
  process.exit(1);
}
const db = new Database(
  resolve(process.env.DATABASE_PATH || ".data/averis.sqlite"),
  { readonly: true, fileMustExist: true },
);
try {
  const records = db
    .prepare(
      "SELECT * FROM marketing_inquiries WHERE created_at > datetime('now', '-90 days') ORDER BY created_at DESC",
    )
    .all();
  writeFileSync(
    resolve(process.argv[outputIndex + 1]),
    JSON.stringify(records, null, 2),
    { mode: 0o600, flag: "wx" },
  );
  console.log(
    `Exported ${records.length} inquiry records. Treat the export as personal data and delete it when no longer needed.`,
  );
} finally {
  db.close();
}
