import { test, expect, type Page } from "@playwright/test";
import AxeBuilder from "@axe-core/playwright";
async function login(page: Page, email = "owner@acme.co.id") {
  await page.goto("/login");
  await page.getByRole("button", { name: "EN", exact: true }).click();
  await page.getByLabel("Work email", { exact: true }).fill(email);
  await page
    .getByLabel("Password", { exact: true })
    .fill("Browser-Test-Password!2026");
  await page.getByRole("button", { name: "Sign in", exact: true }).click();
  await expect(
    page.getByRole("navigation", { name: "Primary navigation" }),
  ).toBeVisible();
}
test("risk context, evidence ledger, content review, practice, and employee privacy", async ({
  page,
}, info) => {
  const errors: string[] = [];
  page.on("pageerror", (e) => errors.push(e.message));
  await login(page);
  const people = (
    await (
      await page.request.get("/api/workspace/intelligence/profiles")
    ).json()
  ).profiles;
  const employee = people.find((p: any) => p.email === "andini@acme.co.id");
  await page.goto(`/admin/human-risk/people/${employee.id}`);
  await page.getByRole("button", { name: "Edit impact context" }).click();
  let dialog = page.getByRole("dialog");
  await dialog
    .getByLabel("Business role", { exact: true })
    .fill("Finance payment approver");
  await dialog.getByLabel("Work location").fill("Makassar");
  await dialog.getByLabel("Business impact").selectOption("75");
  await dialog
    .getByLabel("Why this impact level?")
    .fill("Approves vendor payments with sensitive financial authority.");
  await dialog.getByRole("button", { name: "Record impact context" }).click();
  await expect(dialog).not.toBeVisible();
  const signal = await page.request.post(
    "/api/workspace/intelligence/signals",
    {
      data: {
        userId: employee.id,
        kind: "exposure_observed",
        topic: "BEC",
        value: 80,
        sourceId: "browser-verified-bec",
        description:
          "A verified payment-redirection threat targeted this role.",
        occurredAt: new Date().toISOString(),
      },
    },
  );
  expect(signal.status()).toBe(201);
  await page.reload();
  await page
    .getByRole("tab", { name: "Why this score?", exact: true })
    .click();
  await expect(page.locator(".intel-ledger")).toContainText(
    "payment-redirection",
  );
  await page.screenshot({
    path: info.outputPath("human-risk-ledger.png"),
    fullPage: true,
  });
  await page.goto("/admin/studio?kind=simulation");
  dialog = page.getByRole("dialog");
  await dialog
    .getByLabel("Title", { exact: true })
    .fill("Finance verification challenge");
  await dialog.getByLabel("Competency", { exact: true }).selectOption("BEC");
  await dialog
    .getByLabel("Workplace context")
    .fill("Quarter-end payment approval");
  await expect(
    dialog.getByRole("button", { name: "Generate with AI" }),
  ).toBeDisabled();
  await dialog.getByRole("button", { name: "Create manual draft" }).click();
  await expect(
    page.getByRole("heading", { name: "Finance verification challenge" }),
  ).toBeVisible();
  for (const name of ["Mark reviewed", "Approve this version"]) {
    await page
      .getByLabel("I reviewed this version and approve the next step.")
      .check();
    await page.getByRole("button", { name, exact: true }).click();
    await expect(
      page.getByLabel("I reviewed this version and approve the next step."),
    ).not.toBeChecked();
  }
  await page
    .getByRole("button", { name: "Assign practice", exact: true })
    .click();
  dialog = page.getByRole("dialog");
  await dialog.getByLabel(new RegExp(employee.name)).check();
  await dialog
    .getByLabel("I reviewed this audience and the approved scenario.")
    .check();
  await dialog.getByRole("button", { name: "Assign to 1 people" }).click();
  await expect(dialog).toContainText("Practice assigned.");
  await page.keyboard.press("Escape");
  await page.goto("/admin/simulations");
  await expect(page.locator("table")).toContainText("BEC");
  await page.getByRole("button", { name: "Sign out", exact: true }).click();
  await login(page, "andini@acme.co.id");
  await page
    .getByRole("link", { name: "Start challenge", exact: true })
    .click();
  await page
    .getByRole("button", { name: "Report & verify independently", exact: true })
    .click();
  await expect(
    page.getByRole("heading", { name: "This was a simulated attack." }),
  ).toBeVisible();
  await page.getByRole("link", { name: "Got it", exact: true }).click();
  await page.goto("/employee/awareness");
  await expect(page.locator("main")).toContainText("First Threat Reported");
  await expect(page.locator("main")).not.toContainText("Human Risk Index");
  await page.setViewportSize({ width: 390, height: 844 });
  await page.screenshot({
    path: info.outputPath("security-profile-mobile.png"),
    fullPage: true,
  });
  expect(await page.evaluate(() => document.documentElement.scrollWidth)).toBe(
    390,
  );
  expect((await new AxeBuilder({ page }).analyze()).violations).toEqual([]);
  expect(errors).toEqual([]);
});
test("new administrative views load without errors on desktop and mobile", async ({
  page,
}, info) => {
  await login(page);
  await page.emulateMedia({ reducedMotion: "reduce" });
  for (const path of [
    "/admin/human-risk",
    "/admin/human-risk/cohorts",
    "/admin/human-risk/threats",
    "/admin/human-risk/autopilot",
    "/admin/human-risk/audit",
    "/admin/studio",
    "/admin/simulations",
    "/admin/reports",
    "/admin/integrations",
  ]) {
    await page.goto(path);
    await expect(page.locator("#main-content h1").first()).toBeVisible();
    await expect(page.locator(".skeleton-page")).toHaveCount(0);
    await expect(page.getByRole("alert")).toHaveCount(0);
    if (path.endsWith("autopilot"))
      await page.screenshot({
        path: info.outputPath("autopilot-desktop.png"),
        fullPage: true,
      });
    await page.setViewportSize({ width: 390, height: 844 });
    expect(
      await page.evaluate(() => document.documentElement.scrollWidth),
      path,
    ).toBe(390);
    await page.setViewportSize({ width: 1440, height: 1000 });
  }
  await page.goto("/admin");
  await expect(page.locator(".skeleton-page")).toHaveCount(0);
  await page.screenshot({
    path: info.outputPath("intelligence-overview-desktop.png"),
    fullPage: true,
  });
  expect(
    (await new AxeBuilder({ page }).analyze()).violations.map((v) => ({
      id: v.id,
      targets: v.nodes.map((n) => n.target),
    })),
  ).toEqual([]);
});
