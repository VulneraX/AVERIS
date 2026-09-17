import { useEffect } from "react";
import { useLocation } from "react-router-dom";

/** Metadata follows the authored page and selected language, including client navigation. */
export function PublicMetadata() {
  const { pathname } = useLocation();
  useEffect(() => {
    const apply = () => {
      const main = document.querySelector(".ps-site main");
      const heading = main?.querySelector("h1")?.textContent?.trim();
      if (!heading) return;
      const description = (main?.querySelector("p")?.textContent || heading)
        .replace(/\s+/g, " ")
        .trim()
        .slice(0, 190);
      const title = `${heading} | AVERIS`;
      const locale = document.documentElement.lang === "id" ? "id" : "en";
      const canonical = `${window.location.origin}${pathname}${locale === "id" ? "?lang=id" : ""}`;
      document.title = title;
      for (const [key, content] of Object.entries({
        description,
        "og:title": title,
        "og:description": description,
        "og:url": canonical,
        "og:image": `${window.location.origin}/og-image.png`,
        "og:locale": locale === "id" ? "id_ID" : "en_US",
      })) {
        const attr = key.startsWith("og:") ? "property" : "name";
        let node = document.head.querySelector<HTMLMetaElement>(
          `meta[${attr}="${key}"]`,
        );
        if (!node) {
          node = document.createElement("meta");
          node.setAttribute(attr, key);
          document.head.append(node);
        }
        node.content = content;
      }
      let link = document.head.querySelector<HTMLLinkElement>(
        'link[rel="canonical"]',
      );
      if (!link) {
        link = document.createElement("link");
        link.rel = "canonical";
        document.head.append(link);
      }
      link.href = canonical;
      document.head
        .querySelectorAll('link[rel="alternate"][hreflang]')
        .forEach((node) => node.remove());
      for (const language of ["en", "id", "x-default"]) {
        const alternate = document.createElement("link");
        alternate.rel = "alternate";
        alternate.hreflang = language;
        alternate.href = `${window.location.origin}${pathname}${language === "id" ? "?lang=id" : ""}`;
        document.head.append(alternate);
      }
    };
    apply();
    const observer = new MutationObserver(apply);
    observer.observe(document.documentElement, {
      attributes: true,
      attributeFilter: ["lang"],
    });
    const main = document.querySelector(".ps-site main");
    if (main) observer.observe(main, { childList: true, subtree: true });
    return () => observer.disconnect();
  }, [pathname]);
  return null;
}

export default PublicMetadata;
