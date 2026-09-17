import { useEffect, useMemo, useRef, useState } from "react";
import { Link } from "react-router-dom";
import {
  ArrowLeft,
  ArrowRight,
  BookOpen,
  Check,
  CheckCircle2,
  ChevronRight,
  Clock3,
  Copy,
  FileText,
  GraduationCap,
  Search,
  Video,
} from "lucide-react";
import {
  academyTracks,
  contentEntries,
  contentHubs,
  contentKindLabels,
  type ContentEntry,
  type ContentLocale,
} from "./content";
import type { AcademyTrack, ContentKind } from "./content/schema";
import "./content-experience.css";

type Props = { path: string; locale?: ContentLocale };
const hubPaths: Record<ContentKind, string> = {
  documentation: "/docs",
  tutorial: "/tutorials",
  guide: "/guides",
  article: "/blog",
  video: "/videos",
};
const hubNames = {
  "/resources": ["Resources", "Ruang sumber"],
  "/docs": ["Documentation", "Dokumentasi"],
  "/tutorials": ["Tutorials", "Tutorial"],
  "/guides": ["Guides", "Panduan"],
  "/blog": ["From the product team", "Dari tim produk"],
  "/videos": ["Video Center", "Pusat Video"],
  "/academy": ["AVERIS Academy", "Akademi AVERIS"],
} as const;
const text = (locale: ContentLocale, en: string, id: string) =>
  locale === "id" ? id : en;
function readMinutes(entry: ContentEntry, locale: ContentLocale) {
  const words = entry.sections
    .flatMap((s) => [...(s.paragraphs || []), ...(s.items || [])])
    .map((p) => p[locale])
    .join(" ")
    .split(/\s+/).length;
  return Math.max(1, Math.ceil(words / 180));
}
function dateLabel(value: string, locale: ContentLocale) {
  return new Intl.DateTimeFormat(locale === "id" ? "id-ID" : "en-GB", {
    day: "numeric",
    month: "long",
    year: "numeric",
    timeZone: "UTC",
  }).format(new Date(`${value}T12:00:00Z`));
}
function Icon({ kind }: { kind: ContentKind }) {
  return kind === "video" ? (
    <Video size={19} />
  ) : kind === "documentation" ? (
    <FileText size={19} />
  ) : (
    <BookOpen size={19} />
  );
}
function Hero({ path, locale }: { path: string; locale: ContentLocale }) {
  const hub = contentHubs.find((item) => item.path === path)!;
  const name = hubNames[path as keyof typeof hubNames] || hubNames["/academy"];
  return (
    <section className="ps-page-hero ce-hero">
      <div className="ps-container">
        <span className="ps-kicker">{name[locale === "id" ? 1 : 0]}</span>
        <h1>{hub.title[locale]}</h1>
        <p>{hub.description[locale]}</p>
      </div>
    </section>
  );
}
function ContentRow({
  entry,
  locale,
  featured = false,
}: {
  entry: ContentEntry;
  locale: ContentLocale;
  featured?: boolean;
}) {
  return (
    <Link
      className={`ce-content-row${featured ? " ce-featured" : ""}`}
      to={entry.href}
    >
      {featured && (
        <div className="ce-featured-graphic" aria-hidden="true">
          <span>{text(locale, "COMPLETED", "SELESAI")}</span>
          <div className="ce-graphic-line">
            <i />
            <i />
            <i />
            <i />
            <i />
          </div>
          <span>{text(locale, "MEASURED", "TERUKUR")}</span>
          <div className="ce-graphic-line">
            <i />
            <i />
            <i className="is-outline" />
            <i className="is-outline" />
            <i className="is-outline" />
          </div>
          <small>
            {text(
              locale,
              "Different measures. Better questions.",
              "Pengukuran berbeda. Pertanyaan lebih baik.",
            )}
          </small>
        </div>
      )}
      <div className="ce-row-icon">
        <Icon kind={entry.kind} />
      </div>
      <div className="ce-row-copy">
        <div className="ce-meta">
          <span>{contentKindLabels[entry.kind][locale]}</span>
          <span>{entry.topic[locale]}</span>
        </div>
        <h2>{entry.title[locale]}</h2>
        <p>{entry.description[locale]}</p>
        <div className="ce-row-foot">
          <span>{entry.role[locale]}</span>
          <span>
            {entry.kind === "video"
              ? text(
                  locale,
                  "Recording in preparation",
                  "Rekaman sedang disiapkan",
                )
              : `${readMinutes(entry, locale)} ${text(locale, "min read", "menit baca")}`}
          </span>
        </div>
      </div>
      <ArrowRight className="ce-row-arrow" size={18} />
    </Link>
  );
}
function SearchField({
  value,
  onChange,
  label,
}: {
  value: string;
  onChange: (value: string) => void;
  label: string;
}) {
  return (
    <label className="ce-search">
      <Search size={18} />
      <span className="ce-sr-only">{label}</span>
      <input
        type="search"
        value={value}
        placeholder={label}
        onChange={(e) => onChange(e.target.value)}
      />
    </label>
  );
}
function Empty({
  locale,
  onReset,
}: {
  locale: ContentLocale;
  onReset: () => void;
}) {
  return (
    <div className="ce-empty" role="status">
      <Search size={26} />
      <h2>
        {text(
          locale,
          "No resources match these filters.",
          "Tidak ada sumber yang cocok dengan filter ini.",
        )}
      </h2>
      <p>
        {text(
          locale,
          "Try a broader term or reset the filters.",
          "Coba istilah lebih luas atau atur ulang filter.",
        )}
      </p>
      <button className="ps-button ps-button-secondary" onClick={onReset}>
        {text(locale, "Reset filters", "Atur ulang filter")}
      </button>
    </div>
  );
}
function Hub({ path, locale }: { path: string; locale: ContentLocale }) {
  const [query, setQuery] = useState("");
  const [kind, setKind] = useState("");
  const [topic, setTopic] = useState("");
  const [role, setRole] = useState("");
  const [difficulty, setDifficulty] = useState("");
  const [area, setArea] = useState("");
  const scope = contentEntries.filter(
    (entry) => path === "/resources" || hubPaths[entry.kind] === path,
  );
  const filtered = scope.filter(
    (entry) =>
      (!kind || entry.kind === kind) &&
      (!topic || entry.topic[locale] === topic) &&
      (!role || entry.role[locale] === role) &&
      (!difficulty || entry.difficulty === difficulty) &&
      (!area || entry.area[locale] === area) &&
      `${entry.title[locale]} ${entry.description[locale]} ${entry.topic[locale]} ${entry.area[locale]}`
        .toLocaleLowerCase()
        .includes(query.toLocaleLowerCase()),
  );
  const reset = () => {
    setQuery("");
    setKind("");
    setTopic("");
    setRole("");
    setDifficulty("");
    setArea("");
  };
  const filter = (
    label: string,
    value: string,
    setValue: (v: string) => void,
    options: string[],
  ) => (
    <label>
      <span>{label}</span>
      <select value={value} onChange={(e) => setValue(e.target.value)}>
        <option value="">{text(locale, "All", "Semua")}</option>
        {options.map((option) => (
          <option key={option}>{option}</option>
        ))}
      </select>
    </label>
  );
  return (
    <>
      <Hero path={path} locale={locale} />
      <section className="ps-container ce-hub">
        {path === "/resources" && (
          <nav
            className="ce-resource-nav"
            aria-label={text(locale, "Resource collections", "Koleksi sumber")}
          >
            {(
              [
                "/docs",
                "/tutorials",
                "/videos",
                "/guides",
                "/academy",
                "/blog",
              ] as const
            ).map((href) => (
              <Link key={href} to={href}>
                {hubNames[href][locale === "id" ? 1 : 0]}
                <ArrowRight size={14} />
              </Link>
            ))}
          </nav>
        )}
        {path === "/videos" && (
          <div className="ce-notice">
            <Video size={21} />
            <div>
              <strong>
                {text(
                  locale,
                  "Original recordings are in preparation.",
                  "Rekaman asli sedang disiapkan.",
                )}
              </strong>
              <p>
                {text(
                  locale,
                  "There are no playable recordings yet. Each entry includes its planned chapters and related written instructions. The interactive tour is available now.",
                  "Belum ada rekaman yang dapat diputar. Setiap entri memuat rencana bab dan petunjuk tertulis terkait. Tur interaktif sudah tersedia.",
                )}
              </p>
              <Link to="/tour">
                {text(
                  locale,
                  "Open the interactive tour",
                  "Buka tur interaktif",
                )}
                <ArrowRight size={14} />
              </Link>
            </div>
          </div>
        )}
        {path === "/blog" && !query && !topic && filtered[0] && (
          <ContentRow entry={filtered[0]} locale={locale} featured />
        )}
        <div className="ce-toolbar">
          <SearchField
            value={query}
            onChange={setQuery}
            label={text(
              locale,
              "Search these resources",
              "Cari dalam sumber ini",
            )}
          />
          <span role="status">
            {filtered.length} {text(locale, "resources", "sumber")}
          </span>
        </div>
        <div className="ce-filters">
          {path === "/resources" && (
            <label>
              <span>{text(locale, "Type", "Jenis")}</span>
              <select value={kind} onChange={(e) => setKind(e.target.value)}>
                <option value="">
                  {text(locale, "All types", "Semua jenis")}
                </option>
                {Object.entries(contentKindLabels).map(([key, label]) => (
                  <option key={key} value={key}>
                    {label[locale]}
                  </option>
                ))}
              </select>
            </label>
          )}
          {filter(text(locale, "Topic", "Topik"), topic, setTopic, [
            ...new Set(scope.map((e) => e.topic[locale])),
          ])}
          {path !== "/blog" && path !== "/videos" && (
            <>
              {filter(text(locale, "Role", "Peran"), role, setRole, [
                ...new Set(scope.map((e) => e.role[locale])),
              ])}
              <label>
                <span>{text(locale, "Difficulty", "Kesulitan")}</span>
                <select
                  value={difficulty}
                  onChange={(e) => setDifficulty(e.target.value)}
                >
                  <option value="">
                    {text(locale, "All levels", "Semua tingkat")}
                  </option>
                  <option value="foundation">
                    {text(locale, "Foundation", "Dasar")}
                  </option>
                  <option value="intermediate">
                    {text(locale, "Intermediate", "Menengah")}
                  </option>
                </select>
              </label>
              {filter(
                text(locale, "Product area", "Area produk"),
                area,
                setArea,
                [...new Set(scope.map((e) => e.area[locale]))],
              )}
            </>
          )}
        </div>
        <div
          className={`ce-resource-list${path === "/videos" ? " ce-video-grid" : ""}`}
        >
          {filtered.map((entry) =>
            path === "/videos" ? (
              <Link to={entry.href} className="ce-video-card" key={entry.href}>
                <div className="ce-video-thumbnail">
                  <Video size={34} />
                  <span>
                    {text(locale, "Recording planned", "Rekaman direncanakan")}
                  </span>
                </div>
                <div className="ce-meta">{entry.topic[locale]}</div>
                <h2>{entry.title[locale]}</h2>
                <p>
                  {entry.video?.chapters.length}{" "}
                  {text(
                    locale,
                    "planned chapters · Written guide available",
                    "bab direncanakan · Panduan tertulis tersedia",
                  )}
                </p>
                <span className="ce-inline-link">
                  {text(locale, "View walkthrough", "Lihat panduan")}
                  <ArrowRight size={15} />
                </span>
              </Link>
            ) : (
              <ContentRow entry={entry} locale={locale} key={entry.href} />
            ),
          )}
        </div>
        {!filtered.length && <Empty locale={locale} onReset={reset} />}
        {path === "/resources" && (
          <aside className="ce-academy-callout">
            <GraduationCap size={30} />
            <div>
              <h2>
                {text(
                  locale,
                  "Prefer a learning path?",
                  "Lebih suka jalur belajar?",
                )}
              </h2>
              <p>
                {text(
                  locale,
                  "Four Academy tracks connect the concepts with practical checks and progress saved on this device.",
                  "Empat jalur Akademi menghubungkan konsep dengan pemeriksaan praktis dan progres tersimpan di perangkat ini.",
                )}
              </p>
            </div>
            <Link className="ps-button ps-button-secondary" to="/academy">
              {text(locale, "Open Academy", "Buka Akademi")}
              <ArrowRight size={16} />
            </Link>
          </aside>
        )}
      </section>
    </>
  );
}
function DocsNavigation({
  current,
  locale,
}: {
  current: string;
  locale: ContentLocale;
}) {
  const [query, setQuery] = useState("");
  const entries = contentEntries.filter(
    (entry) =>
      entry.kind === "documentation" &&
      `${entry.title[locale]} ${entry.description[locale]}`
        .toLocaleLowerCase()
        .includes(query.toLocaleLowerCase()),
  );
  return (
    <details className="ce-docs-nav" open>
      <summary>
        {text(locale, "Documentation navigation", "Navigasi dokumentasi")}
      </summary>
      <div>
        <SearchField
          value={query}
          onChange={setQuery}
          label={text(locale, "Search documentation", "Cari dokumentasi")}
        />
        <nav
          aria-label={text(locale, "Documentation chapters", "Bab dokumentasi")}
        >
          <Link
            to="/docs"
            aria-current={current === "/docs" ? "page" : undefined}
          >
            {text(locale, "Documentation home", "Beranda dokumentasi")}
          </Link>
          {entries.map((entry) => (
            <Link
              key={entry.href}
              to={entry.href}
              aria-current={entry.href === current ? "page" : undefined}
            >
              {entry.title[locale]}
            </Link>
          ))}
        </nav>
        {!entries.length && (
          <p role="status">
            {text(locale, "No matching chapters.", "Tidak ada bab yang cocok.")}
          </p>
        )}
      </div>
    </details>
  );
}
function DocsHome({ locale }: { locale: ContentLocale }) {
  return (
    <>
      <Hero path="/docs" locale={locale} />
      <div className="ps-container ce-docs-home">
        <DocsNavigation current="/docs" locale={locale} />
        <div>
          <div className="ce-docs-intro">
            <span className="ps-kicker">
              {text(locale, "START HERE", "MULAI DI SINI")}
            </span>
            <h2>
              {text(
                locale,
                "Follow the work from setup to evidence.",
                "Ikuti pekerjaan dari penyiapan hingga bukti.",
              )}
            </h2>
            <p>
              {text(
                locale,
                "Choose a chapter for product behavior or a tutorial for exact steps. Documentation describes the current workspace; configuration requirements and limitations are included.",
                "Pilih bab untuk perilaku produk atau tutorial untuk langkah terperinci. Dokumentasi menjelaskan ruang kerja saat ini; persyaratan konfigurasi dan batasan disertakan.",
              )}
            </p>
            <Link
              className="ps-button ps-button-primary"
              to="/docs/getting-started"
            >
              {text(
                locale,
                "Start with your workspace",
                "Mulai dari ruang kerja Anda",
              )}
              <ArrowRight size={16} />
            </Link>
          </div>
          {contentEntries
            .filter((entry) => entry.kind === "documentation")
            .map((entry) => (
              <ContentRow key={entry.href} entry={entry} locale={locale} />
            ))}
        </div>
      </div>
    </>
  );
}
function Feedback({
  entry,
  locale,
}: {
  entry: ContentEntry;
  locale: ContentLocale;
}) {
  const [choice, setChoice] = useState<string | null>(null);
  const [saved, setSaved] = useState(false);
  useEffect(() => {
    try {
      setChoice(localStorage.getItem(`averis-content-feedback:${entry.href}`));
    } catch {
      /* Reading remains available without browser storage. */
    }
  }, [entry.href]);
  function choose(value: string) {
    setChoice(value);
    try {
      localStorage.setItem(`averis-content-feedback:${entry.href}`, value);
      setSaved(true);
    } catch {
      setSaved(false);
    }
  }
  return (
    <div className="ce-feedback">
      <div>
        <strong>
          {text(locale, "Was this page useful?", "Apakah halaman ini berguna?")}
        </strong>
        <p>
          {text(
            locale,
            "Your response stays on this device. For help from the team, visit Support.",
            "Respons Anda tersimpan di perangkat ini. Untuk bantuan dari tim, kunjungi Dukungan.",
          )}
        </p>
      </div>
      <div className="ce-feedback-actions">
        <button aria-pressed={choice === "yes"} onClick={() => choose("yes")}>
          {text(locale, "Yes", "Ya")}
        </button>
        <button aria-pressed={choice === "no"} onClick={() => choose("no")}>
          {text(locale, "Not yet", "Belum")}
        </button>
      </div>
      {choice && (
        <span className="ce-feedback-status" role="status">
          {saved
            ? text(
                locale,
                "Preference saved on this device.",
                "Preferensi disimpan di perangkat ini.",
              )
            : text(
                locale,
                "Response selected for this visit.",
                "Respons dipilih untuk kunjungan ini.",
              )}
        </span>
      )}
      <Link to="/support">
        {text(locale, "Get support", "Dapatkan dukungan")}
        <ArrowRight size={14} />
      </Link>
    </div>
  );
}
function VideoDetail({
  entry,
  locale,
}: {
  entry: ContentEntry;
  locale: ContentLocale;
}) {
  const player = useRef<HTMLVideoElement>(null);
  const media = entry.video!;
  return (
    <div className="ce-video-detail">
      {media.status === "published" && media.source ? (
        <video
          ref={player}
          controls
          preload="none"
          poster={media.poster}
          aria-label={entry.title[locale]}
        >
          <source src={media.source} />
          {media.captions?.map((track) => (
            <track
              key={track.language}
              kind="captions"
              src={track.src}
              srcLang={track.language}
              label={track.label}
              default={track.language === locale}
            />
          ))}
          {text(
            locale,
            "Your browser does not support this video.",
            "Peramban Anda tidak mendukung video ini.",
          )}
        </video>
      ) : (
        <div className="ce-recording-notice">
          <Video size={38} />
          <h2>
            {text(
              locale,
              "The original recording is being prepared.",
              "Rekaman asli sedang disiapkan.",
            )}
          </h2>
          <p>
            {text(
              locale,
              "A playable video, duration, and transcript will appear when the recording is published. Use the interactive tour or the written instructions below today.",
              "Video yang dapat diputar, durasi, dan transkrip akan tampil saat rekaman diterbitkan. Gunakan tur interaktif atau petunjuk tertulis di bawah saat ini.",
            )}
          </p>
          <Link className="ps-button ps-button-primary" to="/tour">
            {text(
              locale,
              "Explore the interactive tour",
              "Jelajahi tur interaktif",
            )}
            <ArrowRight size={16} />
          </Link>
        </div>
      )}
      <section>
        <h2>
          {text(
            locale,
            media.status === "published" ? "Chapters" : "Planned chapters",
            media.status === "published" ? "Bab" : "Bab yang direncanakan",
          )}
        </h2>
        <ol className="ce-chapters">
          {media.chapters.map((chapter, index) => (
            <li key={chapter.title.en}>
              <span>{String(index + 1).padStart(2, "0")}</span>
              <div>
                {media.source && chapter.seconds !== undefined ? (
                  <button
                    onClick={() => {
                      if (player.current) {
                        player.current.currentTime = chapter.seconds!;
                        player.current.focus();
                      }
                    }}
                  >
                    {chapter.title[locale]}
                  </button>
                ) : (
                  <h3>{chapter.title[locale]}</h3>
                )}
                <p>{chapter.text[locale]}</p>
              </div>
            </li>
          ))}
        </ol>
      </section>
      {media.transcript && (
        <section>
          <h2>{text(locale, "Transcript", "Transkrip")}</h2>
          <p>{media.transcript[locale]}</p>
        </section>
      )}
    </div>
  );
}
function Detail({
  entry,
  locale,
}: {
  entry: ContentEntry;
  locale: ContentLocale;
}) {
  const [copyStatus, setCopyStatus] = useState("");
  const docs = entry.kind === "documentation";
  const siblings = contentEntries.filter((item) => item.kind === entry.kind);
  const position = siblings.indexOf(entry);
  const related = entry.related
    .map((href) => contentEntries.find((item) => item.href === href))
    .filter((item): item is ContentEntry => Boolean(item));
  async function copyHeading(id: string) {
    const href = `${window.location.origin}${window.location.pathname}${window.location.search}#${id}`;
    try {
      await navigator.clipboard.writeText(href);
      setCopyStatus(
        text(locale, "Heading link copied.", "Tautan judul disalin."),
      );
    } catch {
      window.location.hash = id;
      setCopyStatus(
        text(
          locale,
          "Heading selected. Copy the address from your browser.",
          "Judul dipilih. Salin alamat dari peramban Anda.",
        ),
      );
    }
  }
  return (
    <div className="ps-container ce-detail">
      <nav
        className="ce-breadcrumbs"
        aria-label={text(locale, "Breadcrumbs", "Jejak navigasi")}
      >
        <Link to="/resources">{text(locale, "Resources", "Ruang sumber")}</Link>
        <ChevronRight size={13} />
        <Link to={hubPaths[entry.kind]}>
          {contentKindLabels[entry.kind][locale]}
        </Link>
        <ChevronRight size={13} />
        <span aria-current="page">{entry.title[locale]}</span>
      </nav>
      <div className={`ce-reading-layout${docs ? " is-docs" : ""}`}>
        {docs && <DocsNavigation current={entry.href} locale={locale} />}
        <article className="ce-article">
          <header>
            <span className="ps-kicker">{entry.topic[locale]}</span>
            <h1>{entry.title[locale]}</h1>
            <p className="ce-deck">{entry.description[locale]}</p>
            <div className="ce-byline">
              <span>{entry.author[locale]}</span>
              <span>
                <Clock3 size={14} />
                {entry.kind === "video"
                  ? entry.video?.duration ||
                    text(locale, "Recording planned", "Rekaman direncanakan")
                  : `${readMinutes(entry, locale)} ${text(locale, "min read", "menit baca")}`}
              </span>
              <span>
                {text(locale, "Updated", "Diperbarui")}{" "}
                <time dateTime={entry.updated}>
                  {dateLabel(entry.updated, locale)}
                </time>
              </span>
            </div>
          </header>
          {entry.kind === "video" ? (
            <VideoDetail entry={entry} locale={locale} />
          ) : (
            entry.sections.map((section) => (
              <section
                className="ce-article-section"
                id={section.id}
                key={section.id}
              >
                <h2>
                  {section.heading[locale]}
                  <button
                    className="ce-copy-heading"
                    onClick={() => void copyHeading(section.id)}
                    aria-label={`${text(locale, "Copy link to", "Salin tautan ke")} ${section.heading[locale]}`}
                  >
                    <Copy size={15} />
                  </button>
                </h2>
                {section.paragraphs?.map((paragraph, index) => (
                  <p key={index}>{paragraph[locale]}</p>
                ))}
                {section.items &&
                  (section.ordered ? (
                    <ol>
                      {section.items.map((item, index) => (
                        <li key={index}>{item[locale]}</li>
                      ))}
                    </ol>
                  ) : (
                    <ul>
                      {section.items.map((item, index) => (
                        <li key={index}>{item[locale]}</li>
                      ))}
                    </ul>
                  ))}
                {section.note && (
                  <aside className="ce-note">{section.note[locale]}</aside>
                )}
              </section>
            ))
          )}
          <span className="ce-sr-only" role="status">
            {copyStatus}
          </span>
          {entry.demo && entry.kind !== "video" && (
            <div className="ce-reading-demo">
              <BookOpen size={21} />
              <div>
                <h2>
                  {text(
                    locale,
                    "See the workflow in context",
                    "Lihat alur kerja dalam konteks",
                  )}
                </h2>
                <p>
                  {text(
                    locale,
                    "Explore a controlled product demonstration with fictional data.",
                    "Jelajahi demonstrasi produk terkendali dengan data fiktif.",
                  )}
                </p>
              </div>
              <Link className="ps-button ps-button-secondary" to={entry.demo}>
                {text(locale, "Open demo", "Buka demo")}
                <ArrowRight size={15} />
              </Link>
            </div>
          )}
          <section className="ce-related">
            <h2>{text(locale, "Keep going", "Lanjutkan")}</h2>
            {related.map((item) => (
              <Link key={item.href} to={item.href}>
                <span>
                  <small>{contentKindLabels[item.kind][locale]}</small>
                  {item.title[locale]}
                </span>
                <ArrowRight size={17} />
              </Link>
            ))}
          </section>
          <nav
            className="ce-pagination"
            aria-label={text(
              locale,
              "Previous and next resources",
              "Sumber sebelumnya dan berikutnya",
            )}
          >
            {position > 0 ? (
              <Link to={siblings[position - 1].href}>
                <ArrowLeft size={15} />
                <span>
                  <small>{text(locale, "Previous", "Sebelumnya")}</small>
                  {siblings[position - 1].title[locale]}
                </span>
              </Link>
            ) : (
              <span />
            )}
            {position < siblings.length - 1 && (
              <Link to={siblings[position + 1].href}>
                <span>
                  <small>{text(locale, "Next", "Berikutnya")}</small>
                  {siblings[position + 1].title[locale]}
                </span>
                <ArrowRight size={15} />
              </Link>
            )}
          </nav>
          <Feedback entry={entry} locale={locale} />
        </article>
        {entry.sections.length > 0 && (
          <aside className="ce-toc">
            <span>{text(locale, "On this page", "Di halaman ini")}</span>
            <nav aria-label={text(locale, "Table of contents", "Daftar isi")}>
              {entry.sections.map((section) => (
                <a href={`#${section.id}`} key={section.id}>
                  {section.heading[locale]}
                </a>
              ))}
            </nav>
            <Link to="/support">
              {text(locale, "Need a hand?", "Butuh bantuan?")}
              <ArrowRight size={14} />
            </Link>
          </aside>
        )}
      </div>
    </div>
  );
}
const progressKey = "averis-academy-progress-v1";
function useProgress() {
  const [completed, setCompleted] = useState<string[]>([]);
  const [storage, setStorage] = useState(true);
  useEffect(() => {
    try {
      const value = JSON.parse(localStorage.getItem(progressKey) || "[]");
      if (Array.isArray(value))
        setCompleted(value.filter((v) => typeof v === "string"));
    } catch {
      setStorage(false);
    }
  }, []);
  function save(next: string[]) {
    setCompleted(next);
    try {
      localStorage.setItem(progressKey, JSON.stringify(next));
      setStorage(true);
    } catch {
      setStorage(false);
    }
  }
  return { completed, save, storage };
}
function AcademyHome({ locale }: { locale: ContentLocale }) {
  const { completed } = useProgress();
  return (
    <>
      <Hero path="/academy" locale={locale} />
      <section className="ps-container ce-academy">
        <div className="ce-academy-intro">
          <span>
            <BookOpen size={18} />
            {text(locale, "Read", "Baca")}
          </span>
          <ChevronRight size={14} />
          <span>
            <CheckCircle2 size={18} />
            {text(locale, "Check your understanding", "Periksa pemahaman")}
          </span>
          <ChevronRight size={14} />
          <span>
            <ArrowRight size={18} />
            {text(locale, "Put it to work", "Terapkan")}
          </span>
        </div>
        <div className="ce-tracks">
          {academyTracks.map((track, index) => {
            const done = track.lessons.filter((lesson) =>
              completed.includes(`${track.slug}/${lesson.id}`),
            ).length;
            return (
              <Link
                className="ce-track"
                key={track.slug}
                to={`/academy/${track.slug}`}
              >
                <span className="ce-track-number">0{index + 1}</span>
                <div>
                  <span className="ce-meta">{track.audience[locale]}</span>
                  <h2>{track.title[locale]}</h2>
                  <p>{track.description[locale]}</p>
                  <div className="ce-track-progress">
                    <progress
                      value={done}
                      max={track.lessons.length}
                      aria-label={`${track.title[locale]} ${text(locale, "progress", "progres")}`}
                    />
                    <span>
                      {done}/{track.lessons.length}{" "}
                      {text(locale, "lessons completed", "pelajaran selesai")}
                    </span>
                  </div>
                </div>
                <ArrowRight size={21} />
              </Link>
            );
          })}
        </div>
        <p className="ce-storage-note">
          {text(
            locale,
            "Academy completion is a local learning record, separate from workspace assignments and certificates. Video recordings are in preparation; the reading lessons and checks are available now.",
            "Penyelesaian Akademi adalah catatan belajar lokal, terpisah dari tugas dan sertifikat ruang kerja. Rekaman video sedang disiapkan; pelajaran bacaan dan pemeriksaan sudah tersedia.",
          )}
        </p>
      </section>
    </>
  );
}
function AcademyTrackPage({
  track,
  locale,
}: {
  track: AcademyTrack;
  locale: ContentLocale;
}) {
  const { completed, save, storage } = useProgress();
  const [step, setStep] = useState(0);
  const [answer, setAnswer] = useState<number | null>(null);
  const [checked, setChecked] = useState(false);
  const [showCompletion, setShowCompletion] = useState(false);
  const heading = useRef<HTMLHeadingElement>(null);
  const lesson = track.lessons[step];
  const done = track.lessons.filter((item) =>
    completed.includes(`${track.slug}/${item.id}`),
  ).length;
  const correct = checked && answer === lesson.check.correct;
  function select(index: number) {
    setStep(index);
    setAnswer(null);
    setChecked(false);
    setShowCompletion(false);
    requestAnimationFrame(() => heading.current?.focus());
  }
  function complete() {
    const key = `${track.slug}/${lesson.id}`;
    if (!completed.includes(key)) save([...completed, key]);
    if (step < track.lessons.length - 1) select(step + 1);
    else setShowCompletion(true);
  }
  return (
    <section className="ps-container ce-academy-player">
      <Link className="ce-back" to="/academy">
        <ArrowLeft size={15} />
        {text(locale, "All Academy tracks", "Semua jalur Akademi")}
      </Link>
      <header>
        <span className="ps-kicker">{track.audience[locale]}</span>
        <h1>{track.title[locale]}</h1>
        <p>{track.description[locale]}</p>
        <div className="ce-track-progress">
          <progress
            value={done}
            max={track.lessons.length}
            aria-label={text(locale, "Track progress", "Progres jalur")}
          />
          <span>
            {done}/{track.lessons.length} {text(locale, "completed", "selesai")}
          </span>
        </div>
      </header>
      <div className="ce-academy-layout">
        <nav aria-label={text(locale, "Academy lessons", "Pelajaran Akademi")}>
          {track.lessons.map((item, index) => (
            <button
              key={item.id}
              aria-current={step === index ? "step" : undefined}
              onClick={() => select(index)}
            >
              <span>
                {completed.includes(`${track.slug}/${item.id}`) ? (
                  <Check size={15} />
                ) : (
                  index + 1
                )}
              </span>
              {item.title[locale]}
            </button>
          ))}
          <p>
            {storage
              ? text(
                  locale,
                  "Progress is saved on this device.",
                  "Progres tersimpan di perangkat ini.",
                )
              : text(
                  locale,
                  "Browser storage is unavailable. Progress lasts for this visit.",
                  "Penyimpanan peramban tidak tersedia. Progres berlaku selama kunjungan ini.",
                )}
          </p>
        </nav>
        <article className="ce-lesson" key={lesson.id}>
          {showCompletion ? (
            <div className="ce-track-complete">
              <CheckCircle2 size={40} />
              <h2 ref={heading} tabIndex={-1}>
                {done === track.lessons.length
                  ? text(locale, "Track completed.", "Jalur selesai.")
                  : text(locale, "Lesson completed.", "Pelajaran selesai.")}
              </h2>
              <p>
                {done === track.lessons.length
                  ? text(
                      locale,
                      "You have completed every lesson and check in this track. Take the next step with the related product instructions.",
                      "Anda telah menyelesaikan setiap pelajaran dan pemeriksaan pada jalur ini. Ambil langkah berikutnya melalui petunjuk produk terkait.",
                    )
                  : text(
                      locale,
                      "Choose the unfinished lessons to complete this track.",
                      "Pilih pelajaran yang belum selesai untuk menyelesaikan jalur ini.",
                    )}
              </p>
              <Link className="ps-button ps-button-primary" to={lesson.related}>
                {text(locale, "Put it into practice", "Terapkan")}
                <ArrowRight size={16} />
              </Link>
              <button
                className="ps-button ps-button-secondary"
                onClick={() => select(0)}
              >
                {text(locale, "Review the track", "Tinjau jalur")}
              </button>
            </div>
          ) : (
            <>
              <span className="ce-meta">
                {text(locale, "LESSON", "PELAJARAN")} {step + 1} /{" "}
                {track.lessons.length}
              </span>
              <h2 ref={heading} tabIndex={-1}>
                {lesson.title[locale]}
              </h2>
              <p className="ce-deck">{lesson.intro[locale]}</p>
              {lesson.paragraphs.map((paragraph, index) => (
                <p key={index}>{paragraph[locale]}</p>
              ))}
              <Link className="ce-inline-link" to={lesson.related}>
                {text(
                  locale,
                  "Read the complete guide",
                  "Baca panduan lengkap",
                )}
                <ArrowRight size={15} />
              </Link>
              <form
                className="ce-mini-check"
                onSubmit={(e) => {
                  e.preventDefault();
                  setChecked(true);
                }}
              >
                <span className="ps-kicker">
                  {text(
                    locale,
                    "CHECK YOUR UNDERSTANDING",
                    "PERIKSA PEMAHAMAN ANDA",
                  )}
                </span>
                <fieldset>
                  <legend>{lesson.check.question[locale]}</legend>
                  {lesson.check.options.map((option, index) => (
                    <label
                      key={option.en}
                      className={answer === index ? "is-selected" : ""}
                    >
                      <input
                        type="radio"
                        name={`check-${lesson.id}`}
                        checked={answer === index}
                        onChange={() => {
                          setAnswer(index);
                          setChecked(false);
                        }}
                        required
                      />
                      {option[locale]}
                    </label>
                  ))}
                </fieldset>
                {checked && (
                  <div
                    className={`ce-check-result${correct ? " is-correct" : ""}`}
                    role="status"
                  >
                    <strong>
                      {correct
                        ? text(locale, "That's right.", "Benar.")
                        : text(
                            locale,
                            "Review the idea and try again.",
                            "Tinjau konsepnya dan coba lagi.",
                          )}
                    </strong>
                    <p>{lesson.check.explanation[locale]}</p>
                  </div>
                )}
                {!correct && (
                  <button
                    className="ps-button ps-button-secondary"
                    type="submit"
                    disabled={answer === null}
                  >
                    {text(locale, "Check answer", "Periksa jawaban")}
                  </button>
                )}
              </form>
              <div className="ce-lesson-actions">
                <button
                  className="ps-button ps-button-secondary"
                  disabled={step === 0}
                  onClick={() => select(step - 1)}
                >
                  <ArrowLeft size={15} />
                  {text(locale, "Previous", "Sebelumnya")}
                </button>
                <button
                  className="ps-button ps-button-primary"
                  disabled={!correct}
                  onClick={complete}
                >
                  {step === track.lessons.length - 1
                    ? text(locale, "Complete lesson", "Selesaikan pelajaran")
                    : text(
                        locale,
                        "Complete and continue",
                        "Selesaikan dan lanjutkan",
                      )}
                  <ArrowRight size={16} />
                </button>
              </div>
            </>
          )}
        </article>
      </div>
    </section>
  );
}
export default function ContentExperience({ path, locale = "en" }: Props) {
  const normalized = path.replace(/\/$/, "") || "/resources";
  const entry = useMemo(
    () => contentEntries.find((item) => item.href === normalized),
    [normalized],
  );
  if (normalized === "/academy" || normalized === "/masterclass")
    return <AcademyHome key={normalized} locale={locale} />;
  if (normalized.startsWith("/academy/")) {
    const track = academyTracks.find(
      (item) => `/academy/${item.slug}` === normalized,
    );
    if (track)
      return (
        <AcademyTrackPage key={normalized} track={track} locale={locale} />
      );
  }
  if (normalized === "/docs") return <DocsHome locale={locale} />;
  if (entry) return <Detail key={normalized} entry={entry} locale={locale} />;
  if (contentHubs.some((item) => item.path === normalized))
    return (
      <Hub key={`${normalized}-${locale}`} path={normalized} locale={locale} />
    );
  return (
    <section className="ps-container ce-empty">
      <h1>
        {text(
          locale,
          "This resource could not be found.",
          "Sumber ini tidak ditemukan.",
        )}
      </h1>
      <p>
        {text(
          locale,
          "Browse current documentation, tutorials, and guides to find the next useful step.",
          "Jelajahi dokumentasi, tutorial, dan panduan saat ini untuk menemukan langkah berikutnya.",
        )}
      </p>
      <Link className="ps-button ps-button-primary" to="/resources">
        {text(locale, "Browse resources", "Jelajahi sumber")}
        <ArrowRight size={16} />
      </Link>
    </section>
  );
}
