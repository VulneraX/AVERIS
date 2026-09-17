const sections = [
  "platform",
  "how-it-works",
  "product",
  "programs",
  "solutions",
  "tour",
  "demo",
  "request-demo",
  "videos",
  "tutorials",
  "docs",
  "resources",
  "blog",
  "guides",
  "academy",
  "masterclass",
  "integrations",
  "support",
  "security",
  "tools/awareness-maturity",
  "pricing",
  "about",
  "compare",
  "privacy",
  "terms",
];
export function isPublicPath(path: string) {
  return (
    path === "/" ||
    sections.some(
      (section) => path === `/${section}` || path.startsWith(`/${section}/`),
    )
  );
}
