export type ContentLocale = "en" | "id";
export type Localized = Record<ContentLocale, string>;
export const L = (en: string, id: string): Localized => ({ en, id });
export type ContentKind =
  "documentation" | "tutorial" | "guide" | "article" | "video";
export type ContentSection = {
  id: string;
  heading: Localized;
  paragraphs?: Localized[];
  items?: Localized[];
  ordered?: boolean;
  note?: Localized;
};
export type ContentEntry = {
  href: string;
  kind: ContentKind;
  title: Localized;
  description: Localized;
  topic: Localized;
  role: Localized;
  area: Localized;
  difficulty: "foundation" | "intermediate";
  updated: string;
  author: Localized;
  sections: ContentSection[];
  related: string[];
  demo?: string;
  video?: {
    status: "planned" | "published";
    source?: string;
    poster?: string;
    captions?: { src: string; language: ContentLocale; label: string }[];
    duration?: string;
    chapters: { title: Localized; text: Localized; seconds?: number }[];
    transcript?: Localized;
  };
};
export type AcademyLesson = {
  id: string;
  title: Localized;
  intro: Localized;
  paragraphs: Localized[];
  related: string;
  check: {
    question: Localized;
    options: Localized[];
    correct: number;
    explanation: Localized;
  };
};
export type AcademyTrack = {
  slug: string;
  title: Localized;
  description: Localized;
  audience: Localized;
  lessons: AcademyLesson[];
};
export const editorial = {
  updated: "2026-09-13",
  author: L("AVERIS product team", "Tim produk AVERIS"),
};
export const areas = {
  campaigns: L("Campaigns", "Kampanye"),
  awareness: L("Awareness", "Kesadaran"),
  people: L("People", "Karyawan"),
  learning: L("Learning", "Pembelajaran"),
  reporting: L("Reporting", "Pelaporan"),
  security: L("Identity & security", "Identitas & keamanan"),
  phishing: L("Phishing", "Phishing"),
};
export const roles = {
  admin: L("Administrators", "Administrator"),
  security: L("Security / IT", "Keamanan / TI"),
  grc: L("GRC", "GRC"),
  hr: L("HR / Learning", "SDM / Pembelajaran"),
  everyone: L("Everyone", "Semua peran"),
};
