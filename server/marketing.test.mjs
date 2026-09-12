import { test } from "node:test";
import assert from "node:assert/strict";
import express from "express";
import Database from "better-sqlite3";
import { registerMarketing } from "./marketing.mjs";

test("inquiries validate consent, persist accurate records, reject bots, and rate limit", async () => {
  const db = new Database(":memory:");
  const app = express();
  app.use(express.json());
  const dispose = registerMarketing(app, db);
  const server = app.listen(0, "127.0.0.1");
  await new Promise((resolve) => server.once("listening", resolve));
  const url = `http://127.0.0.1:${server.address().port}/api/public/inquiries`;
  const input = {
    kind: "demo",
    name: "Test User",
    email: "TEAM@example.test",
    company: "Test organization",
    size: "51–200",
    message: "Understand awareness",
    consent: true,
    website: "",
  };
  const submit = (value) =>
    fetch(url, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(value),
    });
  try {
    assert.equal((await submit({ ...input, consent: false })).status, 400);
    assert.equal((await submit({ ...input, email: "invalid" })).status, 400);
    assert.equal(
      (await submit({ ...input, website: "spam.test" })).status,
      400,
    );
    assert.equal(
      db.prepare("SELECT COUNT(*) AS count FROM marketing_inquiries").get()
        .count,
      0,
    );
    const response = await submit(input);
    assert.equal(response.status, 201);
    const { reference } = await response.json();
    const row = db
      .prepare("SELECT * FROM marketing_inquiries WHERE id = ?")
      .get(reference);
    assert.equal(row.email, "team@example.test");
    assert.equal(row.company, input.company);
    assert.ok(row.consent_at);
    db.prepare(
      "UPDATE marketing_inquiries SET created_at = datetime('now', '-91 days') WHERE id = ?",
    ).run(reference);
    assert.equal((await submit({ ...input, kind: "pricing" })).status, 201);
    assert.equal(
      db.prepare("SELECT COUNT(*) AS count FROM marketing_inquiries").get()
        .count,
      1,
    );
    assert.equal(
      db.prepare("SELECT kind FROM marketing_inquiries").get().kind,
      "pricing",
    );
    assert.equal((await submit(input)).status, 429);
  } finally {
    dispose();
    await new Promise((resolve) => server.close(resolve));
    db.close();
  }
});
