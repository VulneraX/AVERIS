import { L, type ContentEntry, type ContentLocale } from "./content/schema";
import { tutorials } from "./content/tutorials";
import { documentation } from "./content/knowledge";
import { guides, articles, videos } from "./content/editorial";
import { academyTracks } from "./content/academy";
export type { ContentEntry, ContentLocale, Localized } from "./content/schema";
export { L } from "./content/schema";
export { academyTracks } from "./content/academy";

export const contentEntries: ContentEntry[] = [
  ...documentation,
  ...tutorials,
  ...guides,
  ...articles,
  ...videos,
];
export const contentHubs = [
  {
    path: "/resources",
    title: L(
      "A practical resource for every next step.",
      "Panduan praktis untuk setiap langkah berikutnya.",
    ),
    description: L(
      "Product documentation, tutorials, and program guidance grounded in how AVERIS works.",
      "Dokumentasi produk, tutorial, dan panduan program berdasarkan cara kerja AVERIS.",
    ),
  },
  {
    path: "/docs",
    title: L(
      "Understand the product. Get the work done.",
      "Pahami produk. Selesaikan pekerjaan.",
    ),
    description: L(
      "Current AVERIS workflows, permissions, measurement, and configuration explained clearly.",
      "Alur kerja, izin, pengukuran, dan konfigurasi AVERIS saat ini dijelaskan dengan jelas.",
    ),
  },
  {
    path: "/tutorials",
    title: L(
      "Start with a task. Leave with a result.",
      "Mulai dari tugas. Selesaikan dengan hasil.",
    ),
    description: L(
      "Step-by-step instructions for the work administrators and employees need to do.",
      "Petunjuk langkah demi langkah untuk pekerjaan administrator dan karyawan.",
    ),
  },
  {
    path: "/guides",
    title: L(
      "Build a program you can explain.",
      "Bangun program yang dapat Anda jelaskan.",
    ),
    description: L(
      "Practical guides to program design, awareness measurement, and safe simulation.",
      "Panduan praktis desain program, pengukuran kesadaran, dan simulasi aman.",
    ),
  },
  {
    path: "/blog",
    title: L(
      "Notes on measuring human risk.",
      "Catatan tentang pengukuran risiko manusia.",
    ),
    description: L(
      "Product perspectives on evidence, learning, and the decisions behind an awareness program.",
      "Perspektif produk tentang bukti, pembelajaran, dan keputusan di balik program kesadaran.",
    ),
  },
  {
    path: "/videos",
    title: L(
      "See the workflow, step by step.",
      "Lihat alur kerja, langkah demi langkah.",
    ),
    description: L(
      "Explore written walkthroughs and the recording plan. Videos are clearly marked until original media is available.",
      "Jelajahi panduan tertulis dan rencana rekaman. Video ditandai dengan jelas sampai media asli tersedia.",
    ),
  },
  {
    path: "/academy",
    title: L(
      "Learn the work behind the platform.",
      "Pelajari pekerjaan di balik platform.",
    ),
    description: L(
      "Short learning tracks with practical checks. Progress stays on this device; no account is required.",
      "Jalur belajar singkat dengan pemeriksaan praktis. Progres tersimpan di perangkat ini; tanpa akun.",
    ),
  },
  {
    path: "/masterclass",
    title: L("AVERIS Academy", "Akademi AVERIS"),
    description: L(
      "Practical tracks for administrators, security teams, and evidence reviewers.",
      "Jalur praktis untuk administrator, tim keamanan, dan peninjau bukti.",
    ),
  },
];
export const contentRoutes = [
  ...contentHubs.map((item) => item.path),
  ...contentEntries.map((item) => item.href),
  ...academyTracks.map((track) => `/academy/${track.slug}`),
];
export const isContentPath = (path: string) =>
  [
    "/resources",
    "/docs",
    "/tutorials",
    "/guides",
    "/blog",
    "/videos",
    "/academy",
    "/masterclass",
  ].some((prefix) => path === prefix || path.startsWith(`${prefix}/`));
export function getContentMetadata(path: string, locale: ContentLocale = "en") {
  const entry =
    contentEntries.find((item) => item.href === path) ||
    contentHubs.find((item) => item.path === path) ||
    academyTracks.find((track) => `/academy/${track.slug}` === path);
  return entry
    ? { title: entry.title[locale], description: entry.description[locale] }
    : undefined;
}
export const contentKindLabels = {
  documentation: L("Documentation", "Dokumentasi"),
  tutorial: L("Tutorial", "Tutorial"),
  guide: L("Guide", "Panduan"),
  article: L("Article", "Artikel"),
  video: L("Video", "Video"),
};
export function searchContent(locale: ContentLocale = "en") {
  return [
    ...contentEntries.map((entry) => ({
      href: entry.href,
      title: entry.title[locale],
      description: entry.description[locale],
      type: contentKindLabels[entry.kind][locale],
      context: `${entry.topic[locale]} · ${entry.area[locale]}`,
    })),
    ...academyTracks.map((track) => ({
      href: `/academy/${track.slug}`,
      title: track.title[locale],
      description: track.description[locale],
      type: locale === "id" ? "Akademi" : "Academy",
      context: track.audience[locale],
    })),
  ];
}
