import { createServer } from "vite";
import { createElement, Suspense } from "react";
import { renderToString } from "react-dom/server";
import { StaticRouter } from "react-router-dom";
import { mkdirSync, readFileSync, writeFileSync } from "node:fs";
import { dirname, join } from "node:path";

const vite = await createServer({
  server: { middlewareMode: true },
  appType: "custom",
});
const escape = (value) =>
  value
    .replaceAll("&", "&amp;")
    .replaceAll('"', "&quot;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;");
const plain = (value) =>
  value
    .replace(/<[^>]*>/g, "")
    .replaceAll("&amp;", "&")
    .replaceAll("&#x27;", "'")
    .replaceAll("&quot;", '"')
    .replace(/\s+/g, " ")
    .trim();
try {
  const { default: PublicSite } = await vite.ssrLoadModule(
    "/src/marketing/PublicSite.tsx",
  );
  const { publicRoutes } = await vite.ssrLoadModule(
    "/src/marketing/routeManifest.ts",
  );
  const template = readFileSync("dist/index.html", "utf8");
  writeFileSync(
    "dist/app.html",
    template.replace(
      "</head>",
      '<meta name="robots" content="noindex, nofollow" /></head>',
    ),
  );
  const origin = process.env.PUBLIC_SITE_URL
    ? new URL(process.env.PUBLIC_SITE_URL).origin
    : "http://localhost:4173";
  if (!/^https?:$/.test(new URL(origin).protocol))
    throw new Error("PUBLIC_SITE_URL must use HTTP(S).");
  if (!process.env.PUBLIC_SITE_URL)
    console.log(
      "SEO uses local development origin; set PUBLIC_SITE_URL to the deployment origin for production.",
    );
  const urls = [];
  for (const path of publicRoutes) {
    for (const locale of ["en", "id"]) {
      const canonical = `${origin}${path}${locale === "id" ? "?lang=id" : ""}`;
      const markup = renderToString(
        createElement(
          StaticRouter,
          { location: path },
          createElement(
            Suspense,
            { fallback: null },
            createElement(PublicSite, { path, initialLocale: locale }),
          ),
        ),
      );
      const heading = plain(
        markup.match(/<h1[^>]*>([\s\S]*?)<\/h1>/)?.[1] || "AVERIS",
      );
      const main = markup.split(/<main[^>]*>/)[1] || markup;
      const description = plain(
        main.match(/<p[^>]*>([\s\S]*?)<\/p>/)?.[1] || heading,
      ).slice(0, 190);
      const title = `${heading} | AVERIS`;
      let html = template
        .replace('<html lang="en">', `<html lang="${locale}">`)
        .replace('<div id="root"></div>', `<div id="root">${markup}</div>`)
        .replace(/<title>[\s\S]*?<\/title>/, `<title>${escape(title)}</title>`);
      html = html
        .replace(
          /<meta\s+name="description"\s+content="[^"]*"\s*\/>/,
          `<meta name="description" content="${escape(description)}" />`,
        )
        .replace(
          /<meta\s+property="og:title"\s+content="[^"]*"\s*\/>/,
          `<meta property="og:title" content="${escape(title)}" />`,
        )
        .replace(
          /<meta\s+property="og:description"\s+content="[^"]*"\s*\/>/,
          `<meta property="og:description" content="${escape(description)}" />`,
        )
        .replace('content="/og-image.png"', `content="${origin}/og-image.png"`);
      const extra = `<link rel="canonical" href="${escape(canonical)}" /><meta property="og:url" content="${escape(canonical)}" /><meta property="og:locale" content="${locale === "id" ? "id_ID" : "en_US"}" /><link rel="alternate" hreflang="en" href="${origin}${path}" /><link rel="alternate" hreflang="id" href="${origin}${path}?lang=id" /><link rel="alternate" hreflang="x-default" href="${origin}${path}" />`;
      html = html.replace("</head>", `${extra}</head>`);
      const file = join(
        "dist",
        locale === "id" ? "localized/id" : "",
        path,
        "index.html",
      );
      mkdirSync(dirname(file), { recursive: true });
      writeFileSync(file, html);
      urls.push(
        `<url><loc>${escape(canonical)}</loc><xhtml:link rel="alternate" hreflang="en" href="${origin}${path}" /><xhtml:link rel="alternate" hreflang="id" href="${origin}${path}?lang=id" /></url>`,
      );
    }
  }
  writeFileSync("dist/public-routes.json", JSON.stringify(publicRoutes));
  writeFileSync(
    "dist/sitemap.xml",
    `<?xml version="1.0" encoding="UTF-8"?><urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9" xmlns:xhtml="http://www.w3.org/1999/xhtml">${urls.join("")}</urlset>`,
  );
  writeFileSync(
    "dist/robots.txt",
    `${readFileSync("public/robots.txt", "utf8")}\nDisallow: /localized/\nDisallow: /app.html\nSitemap: ${origin}/sitemap.xml\n`,
  );
  console.log(
    `Prerendered ${publicRoutes.length} AVERIS routes in English and Indonesian.`,
  );
} finally {
  await vite.close();
}
