import { test, expect } from "@playwright/test";
import AxeBuilder from "@axe-core/playwright";
import { publicRoutes } from "../src/marketing/routeManifest";

const widths = [1440, 1024, 768, 390];
const coreRoutes = [
  "/",
  "/platform",
  "/how-it-works",
  "/programs",
  "/product/awareness",
  "/product/learning",
  "/solutions/grc",
  "/tour",
  "/demo",
  "/resources",
  "/docs",
  "/tutorials",
  "/videos",
  "/academy",
  "/blog",
  "/guides",
  "/security",
  "/support",
  "/pricing",
  "/compare",
  "/tools/awareness-maturity",
  "/request-demo",
];

test("every public route has crawlable content, localized metadata and sitemap coverage", async ({
  request,
}) => {
  test.setTimeout(180000);
  const sitemap = await (await request.get("/sitemap.xml")).text();
  const titles = new Map<string, string>();
  for (const path of publicRoutes) {
    const response = await request.get(path);
    expect(response.ok(), path).toBeTruthy();
    const html = await response.text();
    expect(html.match(/<h1[ >]/g), path).toHaveLength(1);
    for (const link of html.matchAll(/<a[^>]*href="(\/[^"#]*)"/g)) {
      const target = link[1].split(/[?#]/)[0];
      expect(
        publicRoutes.includes(target) ||
          /^\/(login|admin|employee|verify|methodology|risk-methodology)(\/|$)/.test(
            target,
          ),
        `${path} links to ${target}`,
      ).toBeTruthy();
    }
    expect(html, path).toContain('rel="canonical"');
    expect(html, path).toContain('property="og:description"');
    expect(html, path).toContain('hreflang="id"');
    expect(html, path).not.toContain("The page you requested is not available");
    expect(sitemap, path).toContain(`${path === "/" ? "/" : path}</loc>`);
    const title = html.match(/<title>(.*?)<\/title>/)?.[1] || "";
    expect(title.length, path).toBeGreaterThan(10);
    titles.set(path, title);
  }
  expect(new Set(titles.values()).size).toBeGreaterThan(
    publicRoutes.length - 12,
  );
  const id = await (await request.get("/platform?lang=id")).text();
  expect(id).toContain('<html lang="id">');
  expect(id).not.toContain(`<title>${titles.get("/platform")}</title>`);
  expect((await request.get("/docs/does-not-exist")).status()).toBe(404);
  expect(await (await request.get("/robots.txt")).text()).toContain("Sitemap:");
});

test("public ecosystem is responsive and keyboard accessible at all requested widths", async ({
  page,
}, info) => {
  test.setTimeout(240000);
  const errors: string[] = [];
  page.on("pageerror", (error) => errors.push(error.message));
  await page.emulateMedia({ reducedMotion: "reduce" });
  for (const path of coreRoutes) {
    await page.goto(path);
    await expect(page.locator("main h1"), path).toHaveCount(1);
    for (const width of widths) {
      await page.setViewportSize({ width, height: 900 });
      await expect(page.locator("main h1")).toBeVisible();
      expect(
        await page.evaluate(() => document.documentElement.scrollWidth),
        `${path} at ${width}px`,
      ).toBe(width);
    }
  }
  for (const path of [
    "/",
    "/docs",
    "/demo",
    "/request-demo",
    "/academy",
    "/tools/awareness-maturity",
  ]) {
    await page.goto(path);
    for (const width of [1440, 390]) {
      await page.setViewportSize({ width, height: 900 });
      const results = await new AxeBuilder({ page })
        .withTags(["wcag2a", "wcag2aa", "wcag21aa", "wcag22aa"])
        .analyze();
      expect(
        results.violations.map((v) => ({
          id: v.id,
          nodes: v.nodes.map((n) => n.target),
        })),
        `${path} ${width}`,
      ).toEqual([]);
    }
  }
  await page.goto("/");
  await page.setViewportSize({ width: 1440, height: 1000 });
  await page.screenshot({
    path: info.outputPath("averis-home-desktop.png"),
    fullPage: true,
  });
  await page.setViewportSize({ width: 390, height: 844 });
  await page.screenshot({
    path: info.outputPath("averis-home-mobile.png"),
    fullPage: true,
  });
  expect(errors).toEqual([]);
});

test("demo connects evidence to a reviewed program without workspace mutations", async ({
  page,
}) => {
  const writes: string[] = [];
  page.on("request", (req) => {
    if (req.url().includes("/api/workspace") && req.method() !== "GET")
      writes.push(req.url());
  });
  await page.goto("/demo");
  await page
    .getByRole("button", { name: "Review Finance evidence", exact: true })
    .click();
  await page.getByLabel("Department", { exact: true }).selectOption("new");
  await expect(page.locator(".ps-scene")).toContainText("Unmeasured");
  await page.getByLabel("Department", { exact: true }).selectOption("finance");
  await page
    .getByRole("button", { name: "Plan a focused program", exact: true })
    .click();
  await page.getByRole("button", { name: "Continue", exact: true }).click();
  await page
    .getByRole("button", { name: "Operations · 54 people", exact: true })
    .click();
  await page.getByRole("button", { name: "Continue", exact: true }).click();
  await page.getByRole("button", { name: "Continue", exact: true }).click();
  await page
    .getByLabel("Include a safe phishing simulation", { exact: true })
    .uncheck();
  await page.getByRole("button", { name: "Continue", exact: true }).click();
  await expect(page.locator(".ps-review-list")).toContainText(
    "Operations · 54 people",
  );
  await expect(page.locator(".ps-review-list")).toContainText("Not included");
  await page
    .getByRole("button", { name: "Preview launch", exact: true })
    .click();
  await expect(page.getByRole("status")).toContainText(
    "No assignments or messages have been sent",
  );
  expect(writes).toEqual([]);
});

test("demo request retains input on failure and saves a real inquiry", async ({
  page,
}) => {
  await page.goto("/request-demo");
  const form = page.locator("form");
  await form.locator('input[name="name"]').fill("Website Review");
  await form.locator('input[name="email"]').fill("review@example.test");
  await form.locator('input[name="company"]').fill("Example Organization");
  await form.locator('select[name="size"]').selectOption("51–200");
  await form.locator('input[name="consent"]').check();
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
  await form.getByRole("button", { name: /Request.*demo/i }).click();
  await expect(page.getByRole("alert")).toBeVisible();
  await expect(form.locator('input[name="email"]')).toHaveValue(
    "review@example.test",
  );
  const saved = page.waitForResponse(
    (response) =>
      response.url().endsWith("/api/public/inquiries") &&
      response.status() === 201,
  );
  await form.getByRole("button", { name: /Request.*demo/i }).click();
  const { reference } = await (await saved).json();
  await expect(page.getByRole("status")).toContainText(reference);
});
