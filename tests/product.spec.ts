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
test("campaign → individual learning → assessment → certificate → phishing review", async ({
  page,
}, testInfo) => {
  const pageErrors: string[] = [];
  page.on("pageerror", (e) => pageErrors.push(e.message));
  await login(page);
  await expect(
    page.getByRole("heading", { name: "What needs attention today?" }),
  ).toBeVisible();
  await page.screenshot({
    path: testInfo.outputPath("overview-empty-desktop.png"),
    fullPage: true,
  });
  const catalog = await (
    await page.request.get("/api/workspace/courses")
  ).json();
  const course = catalog.courses.find(
    (c: any) => c.document.title === "Phishing Awareness",
  );
  await page
    .getByRole("link", { name: "Create campaign", exact: true })
    .first()
    .click();
  await page
    .getByLabel("Campaign name", { exact: true })
    .fill("Quarterly awareness review");
  await page
    .getByLabel("Objective", { exact: true })
    .fill("Improve recognition of suspicious messages.");
  await page.getByRole("button", { name: "Continue", exact: true }).click();
  await page.getByRole("button", { name: "Preview audience" }).click();
  await expect(page.getByRole("dialog")).toContainText("Andini");
  await page.getByRole("button", { name: "Close", exact: true }).click();
  await page.getByRole("button", { name: "Continue", exact: true }).click();
  await page.getByLabel("Phishing Awareness", { exact: false }).check();
  await page.getByRole("button", { name: "Continue", exact: true }).click();
  await page.getByRole("button", { name: "Continue", exact: true }).click();
  const due = new Date(Date.now() + 7 * 86400000).toISOString().slice(0, 16);
  await page.getByLabel("Deadline", { exact: true }).fill(due);
  await page
    .getByRole("button", { name: "Launch campaign", exact: true })
    .click();
  await expect(
    page.getByRole("heading", { name: "Quarterly awareness review" }),
  ).toBeVisible();
  await page.screenshot({
    path: testInfo.outputPath("campaign-active.png"),
    fullPage: true,
  });
  await page.getByRole("button", { name: "Sign out", exact: true }).click();
  await login(page, "andini@acme.co.id");
  await page
    .getByRole("link", { name: "Start assessment", exact: true })
    .click();
  await page
    .getByRole("button", { name: "Start assessment", exact: true })
    .click();
  for (let i = 0; i < course.document.questions.length; i++) {
    await page.getByRole("radio").first().check();
    await page
      .getByRole("button", {
        name:
          i === course.document.questions.length - 1
            ? "Submit answers"
            : "Next question",
        exact: true,
      })
      .click();
  }
  await expect(
    page.getByRole("heading", { name: "Your security knowledge is measured" }),
  ).toBeVisible();
  await page.getByRole("link", { name: "Continue", exact: true }).click();
  await page.getByRole("link", { name: "Start learning", exact: true }).click();
  for (let i = 0; i < course.document.lessons.length; i++)
    await page
      .getByRole("button", {
        name:
          i === course.document.lessons.length - 1
            ? "Continue to quiz"
            : "Next lesson",
        exact: true,
      })
      .click();
  await page.getByRole("button", { name: "Start quiz", exact: true }).click();
  await expect(page.getByRole("radio").first()).toBeVisible();
  for (let i = 0; i < course.document.questions.length; i++) {
    const prompt = await page.locator(".quiz-wrap h1").textContent();
    const q = course.document.questions.find((q: any) => q.prompt === prompt);
    await page.getByRole("radio").nth(q.correct[0]).check();
    await page
      .getByRole("button", {
        name:
          i === course.document.questions.length - 1
            ? "Submit answers"
            : "Next question",
        exact: true,
      })
      .click();
  }
  await expect(
    page.getByRole("heading", { name: "Learning completed", exact: true }),
  ).toBeVisible();
  await page
    .getByRole("link", { name: "View certificate", exact: true })
    .click();
  const download = page.waitForEvent("download");
  await page.getByRole("button", { name: "Download PDF", exact: true }).click();
  expect((await download).suggestedFilename()).toMatch(/AVR-.*\.pdf/);
  await page
    .getByRole("link", { name: "Report phishing", exact: true })
    .click();
  await page
    .getByLabel("Suspicious sender", { exact: true })
    .fill("unknown@example.test");
  await page
    .getByLabel("Subject", { exact: true })
    .fill("Urgent account change");
  await page
    .getByLabel("Why does this look suspicious?", { exact: true })
    .fill("The sender is asking for my password on an unfamiliar site.");
  await page.getByRole("button", { name: "Submit report" }).click();
  await expect(page.locator(".notice[role=status]")).toContainText(
    "Report received",
  );
  await page.getByRole("button", { name: "Sign out", exact: true }).click();
  await login(page);
  await page.getByRole("link", { name: "Security inbox", exact: true }).click();
  await page.getByRole("button", { name: /Urgent account change/ }).click();
  await page
    .getByLabel("Investigation status")
    .selectOption("Confirmed Suspicious");
  await page
    .getByLabel("Investigation notes")
    .fill("Confirmed suspicious after reviewing the sender.");
  await page.getByRole("button", { name: "Save review" }).click();
  await expect(page.getByRole("dialog")).not.toBeVisible();
  await expect(page.locator(".security-message-list")).toContainText(
    "Confirmed Suspicious",
  );
  await page.goto("/admin");
  await page.screenshot({
    path: testInfo.outputPath("overview-with-evidence.png"),
    fullPage: true,
  });
  expect(pageErrors).toEqual([]);
});
test("navigation, localization, mobile learning and WCAG basics", async ({
  page,
}, testInfo) => {
  await login(page);
  for (const path of [
    "/admin",
    "/admin/employees",
    "/admin/campaigns",
    "/admin/learning",
    "/admin/awareness",
    "/admin/reports",
    "/admin/settings/organization",
    "/admin/settings/security",
    "/admin/settings/health",
    "/admin/settings/audit",
    "/admin/integrations",
  ]) {
    await page.goto(path);
    await expect(page.locator("main#main-content h1").first()).toBeVisible();
    await expect(page.locator(".skeleton-page")).toHaveCount(0);
    await expect(page.getByRole("alert")).toHaveCount(0);
  }
  await page.goto("/admin");
  const results = await new AxeBuilder({ page })
    .withTags(["wcag2a", "wcag2aa", "wcag21aa", "wcag22aa"])
    .analyze();
  expect(
    results.violations.map((v) => ({
      id: v.id,
      nodes: v.nodes.map((n) => n.target),
    })),
  ).toEqual([]);
  await page.getByRole("button", { name: "ID", exact: true }).click();
  await expect(
    page.getByRole("heading", { name: "Ringkasan", exact: true }),
  ).toBeVisible();
  await expect(
    page.getByRole("link", { name: "Karyawan", exact: true }),
  ).toBeVisible();
  await page.getByRole("button", { name: "Keluar", exact: true }).click();
  await login(page, "andini@acme.co.id");
  await page.setViewportSize({ width: 390, height: 844 });
  await page.goto("/employee");
  await expect(
    page.getByRole("link", { name: "Report phishing", exact: true }),
  ).toBeVisible();
  await page.screenshot({
    path: testInfo.outputPath("employee-mobile.png"),
    fullPage: true,
  });
  expect(
    await page.evaluate(
      () => document.documentElement.scrollWidth <= window.innerWidth,
    ),
  ).toBe(true);
  await page
    .getByRole("button", { name: "Open navigation", exact: true })
    .click();
  await expect(
    page.getByRole("navigation", { name: "Primary navigation" }),
  ).toBeVisible();
  await page
    .getByRole("navigation", { name: "Primary navigation" })
    .getByRole("link", { name: "Certificates", exact: true })
    .click();
  await expect(
    page.getByRole("heading", { name: "Certificates", exact: true }),
  ).toBeVisible();
});
test("manager navigation only exposes permitted work", async ({ page }) => {
  await login(page, "manager@acme.co.id");
  const navigation = page.getByRole("navigation", {
    name: "Primary navigation",
  });
  await expect(
    navigation.getByRole("link", { name: "Overview" }),
  ).toBeVisible();
  await expect(navigation.getByRole("link", { name: "People" })).toBeVisible();
  await expect(
    navigation.getByRole("link", { name: "Simulations" }),
  ).toHaveCount(0);
  await expect(
    navigation.getByRole("link", { name: "Integrations" }),
  ).toHaveCount(0);
  await page.goto("/admin/campaigns");
  await expect(
    page.getByRole("link", { name: "Continuous programs" }),
  ).toHaveCount(0);
  await page.goto("/admin/human-risk");
  const humanRiskNavigation = page.getByRole("navigation", {
    name: "Human risk views",
  });
  await expect(
    humanRiskNavigation.getByRole("link", { name: "Map" }),
  ).toBeVisible();
  await expect(
    humanRiskNavigation.getByRole("link", { name: "Autopilot" }),
  ).toHaveCount(0);
});

test("workspace preserves navigation during loading and recovers from a failed request", async ({
  page,
}) => {
  await login(page);
  let release!: () => void;
  const gate = new Promise<void>((resolve) => {
    release = resolve;
  });
  await page.route("**/api/workspace/people", async (route) => {
    await gate;
    await route.fulfill({
      status: 503,
      contentType: "application/json",
      body: JSON.stringify({
        error: {
          code: "SERVICE_UNAVAILABLE",
          message: "The directory is temporarily unavailable.",
        },
      }),
    });
  });
  await page.goto("/admin/employees");
  await expect(page.locator(".skeleton-page")).toBeVisible();
  await expect(
    page.getByRole("navigation", { name: "Primary navigation" }),
  ).toBeVisible();
  release();
  await expect(page.getByRole("alert")).toBeVisible();
  await page.unroute("**/api/workspace/people");
  await page.getByRole("button", { name: "Try again", exact: true }).click();
  await expect(page.getByRole("alert")).toHaveCount(0);
  await expect(page.locator(".skeleton-page")).toHaveCount(0);
  for (const width of [1440, 1024, 768, 390]) {
    await page.setViewportSize({ width, height: 900 });
    expect(
      await page.evaluate(() => document.documentElement.scrollWidth),
    ).toBe(width);
  }
});
