import { createServer } from "vite";
import { createElement } from "react";
import { renderToString } from "react-dom/server";
import { readFileSync, writeFileSync } from "node:fs";

// Ship crawlable marketing content without requiring JavaScript or an SSR server.
const vite = await createServer({
  server: { middlewareMode: true },
  appType: "custom",
});
try {
  const { default: LandingPage } = await vite.ssrLoadModule(
    "/src/marketing/LandingPage.tsx",
  );
  const markup = renderToString(createElement(LandingPage));
  let html = readFileSync("dist/index.html", "utf8").replace(
    '<div id="root"></div>',
    `<div id="root">${markup}</div>`,
  );
  if (process.env.PUBLIC_SITE_URL) {
    const origin = new URL(process.env.PUBLIC_SITE_URL).origin;
    if (!/^https?:$/.test(new URL(origin).protocol))
      throw new Error("PUBLIC_SITE_URL must be an HTTP(S) origin.");
    html = html
      .replace('content="/og-image.png"', `content="${origin}/og-image.png"`)
      .replace(
        "</head>",
        `<link rel="canonical" href="${origin}/" /><meta property="og:url" content="${origin}/" /></head>`,
      );
  }
  writeFileSync("dist/index.html", html);
  console.log("Prerendered AVERIS marketing page.");
} finally {
  await vite.close();
}
