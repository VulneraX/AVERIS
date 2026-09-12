import { test, expect } from "@playwright/test";
import AxeBuilder from "@axe-core/playwright";

test("marketing content is crawlable and responsive at all requested widths", async ({
  page,
  request,
}, testInfo) => {
  const errors: string[] = [];
  page.on("pageerror", (error) => errors.push(error.message));
  const html = await (await request.get("/")).text();
  expect(html).toContain("Turn human behavior into");
  expect(html).toContain('property="og:image"');
  await page.emulateMedia({ reducedMotion: "reduce" });
  await page.goto("/");
  await expect(page.locator("h1")).toHaveCount(1);
  for (const width of [1440, 1280, 1024, 768, 390]) {
    await page.setViewportSize({ width, height: 900 });
    expect(
      await page.evaluate(() => document.documentElement.scrollWidth),
    ).toBe(width);
    await expect(page.locator("h1")).toBeVisible();
    await page.screenshot({
      path: testInfo.outputPath(`marketing-${width}.png`),
      fullPage: true,
    });
  }
  expect((await new AxeBuilder({ page }).analyze()).violations).toEqual([]);
  await page.setViewportSize({ width: 1440, height: 1000 });
  expect((await new AxeBuilder({ page }).analyze()).violations).toEqual([]);
  const missing = await page
    .locator('a[href^="#"]')
    .evaluateAll((links) =>
      links
        .map((link) => link.getAttribute("href")!)
        .filter((href) => !document.querySelector(href)),
    );
  expect(missing).toEqual([]);
  expect(errors).toEqual([]);
});

test("interactive previews connect score evidence, campaigns, learning, and reporting", async ({
  page,
}) => {
  await page.goto("/");
  await page.getByRole("button", { name: "Behavior 30%" }).click();
  await expect(page.locator(".mk-signal-detail")).toContainText(
    "Safe phishing simulations",
  );
  await page
    .locator(".mi-dashboard")
    .getByRole("button", { name: "Human Risk", exact: true })
    .click();
  await expect(page.locator(".mi-risk-equation")).toContainText(
    "Vulnerability",
  );
  await page
    .locator(".mi-dashboard")
    .getByRole("button", { name: "Recommendations", exact: true })
    .click();
  await page
    .getByRole("button", { name: "Preview workflow", exact: true })
    .click();
  await expect(page.locator(".mi-approved-flow")).toContainText(
    "No employee activity is assigned.",
  );
  const campaign = page.locator("#campaigns");
  await campaign
    .getByRole("button", { name: "Operations 54 employees" })
    .click();
  await campaign.getByRole("button", { name: "Continue", exact: true }).click();
  await expect(campaign).toContainText("Give learning a clear purpose.");
  await campaign.getByRole("button", { name: /4\s*Simulation/ }).click();
  await campaign.getByLabel("Include a phishing simulation").uncheck();
  await campaign.getByRole("button", { name: /6\s*Launch/ }).click();
  await expect(campaign.locator(".mk-review")).toContainText("Operations");
  await expect(campaign.locator(".mk-review")).toContainText("Not included");
  await campaign
    .getByRole("button", { name: "Preview launch", exact: true })
    .click();
  await expect(campaign).toContainText("Your campaign is ready.");
  await page.getByRole("button", { name: "Explore this lesson" }).click();
  await page.getByRole("button", { name: "Next lesson" }).click();
  await expect(page.locator(".mk-lesson-main")).toContainText(
    "Check before you click",
  );
  await page
    .getByRole("button", { name: "Report suspicious message", exact: true })
    .click();
  await expect(page.locator(".mk-report-success")).toContainText(
    "Thanks for speaking up.",
  );
  await page
    .locator("#solutions")
    .getByRole("button", { name: "GRC", exact: true })
    .click();
  await expect(page.locator(".mk-role-content")).toContainText(
    "Put evidence within reach.",
  );
  await page
    .getByRole("button", { name: "Report details", exact: true })
    .click();
  await expect(page.getByRole("dialog")).toContainText(
    "Passed quiz attempts, out of graded quiz attempts.",
  );
  await page.keyboard.press("Escape");
  await expect(page.getByRole("dialog")).not.toBeVisible();
  await expect(
    page.getByRole("button", { name: "Report details", exact: true }),
  ).toBeFocused();
});

test("demo inquiry handles failure then saves a real request, with accessible modal", async ({
  page,
}) => {
  await page.goto("/");
  const trigger = page
    .locator(".mk-nav-actions")
    .getByRole("button", { name: "Book a Demo" });
  await trigger.click();
  const dialog = page.getByRole("dialog");
  await expect(dialog).toBeVisible();
  expect((await new AxeBuilder({ page }).analyze()).violations).toEqual([]);
  await dialog.getByLabel("Your name", { exact: true }).fill("Test User");
  await dialog
    .getByLabel("Work email", { exact: true })
    .fill("test@example.test");
  await dialog
    .getByLabel("Organization", { exact: true })
    .fill("Test organization");
  await dialog.getByLabel("Team size").selectOption("51–200");
  await dialog.getByLabel("I agree to share").check();
  await page.route(
    "**/api/public/inquiries",
    (route) =>
      route.fulfill({
        status: 503,
        contentType: "application/json",
        body: JSON.stringify({
          error: { message: "Service unavailable. Please try again." },
        }),
      }),
    { times: 1 },
  );
  await dialog.getByRole("button", { name: "Request Demo" }).click();
  await expect(dialog.getByRole("alert")).toContainText("Please try again.");
  await expect(dialog.getByLabel("Work email")).toHaveValue(
    "test@example.test",
  );
  const saved = page.waitForResponse(
    (response) =>
      response.url().endsWith("/api/public/inquiries") &&
      response.status() === 201,
  );
  await dialog.getByRole("button", { name: "Request Demo" }).click();
  const response = await saved;
  const { reference } = await response.json();
  await expect(dialog.getByRole("status")).toContainText(reference);
  await expect(dialog).toContainText("a meeting has not yet been scheduled");
  await page.keyboard.press("Escape");
  await expect(trigger).toBeFocused();
});

test("mobile drawer supports keyboard, navigation, and contact; sign-in remains reachable", async ({
  page,
}) => {
  await page.setViewportSize({ width: 390, height: 844 });
  await page.goto("/");
  const trigger = page.getByRole("button", { name: "Open navigation" });
  await trigger.click();
  const menu = page.getByRole("dialog", { name: "Mobile navigation" });
  await expect(menu).toBeVisible();
  expect((await new AxeBuilder({ page }).analyze()).violations).toEqual([]);
  await page.keyboard.press("Escape");
  await expect(trigger).toBeFocused();
  await trigger.click();
  await menu.getByRole("link", { name: "Solutions" }).click();
  await expect(menu).not.toBeVisible();
  await expect(page).toHaveURL(/#solutions$/);
  await trigger.click();
  await menu.getByRole("button", { name: "Book a Demo" }).click();
  await expect(page.getByRole("dialog")).toContainText("See AVERIS in action.");
  expect(await page.evaluate(() => document.documentElement.scrollWidth)).toBe(
    390,
  );
  expect((await new AxeBuilder({ page }).analyze()).violations).toEqual([]);
  await page.keyboard.press("Escape");
  await trigger.click();
  await menu.getByRole("link", { name: "Sign in" }).click();
  await expect(page).toHaveURL(/\/login$/);
  await page.getByRole("button", { name: "EN", exact: true }).click();
  await expect(
    page.getByRole("heading", { name: "Sign in to AVERIS" }),
  ).toBeVisible();
});

test("pricing, legal, and resources expose honest content", async ({
  page,
}) => {
  await page.goto("/");
  await page
    .locator(".mk-desktop-nav")
    .getByRole("button", { name: "Pricing", exact: true })
    .click();
  await expect(page.getByRole("dialog")).toContainText(
    "No published pricing tiers",
  );
  await page.keyboard.press("Escape");
  for (const [name, content] of [
    ["Privacy", "up to 90 days"],
    ["Terms", "do not represent customer results"],
    ["Documentation", "Read the Awareness Score methodology"],
  ]) {
    await page
      .locator("footer")
      .getByRole("button", { name, exact: true })
      .click();
    await expect(page.getByRole("dialog")).toContainText(content);
    await page.keyboard.press("Escape");
  }
  await expect(page.locator(".mk-planned")).toHaveCount(6);
  await page
    .getByRole("link", { name: "See how Awareness Score works" })
    .click();
  await expect(page).toHaveURL(/\/methodology$/);
});
