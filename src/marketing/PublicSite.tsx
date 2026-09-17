import {
  createContext,
  useContext,
  useEffect,
  useRef,
  useState,
  type ReactNode,
} from "react";
import {
  ArrowRight,
  ArrowUpRight,
  Check,
  ChevronDown,
  ChevronLeft,
  ChevronRight,
  CircleCheck,
  LockKeyhole,
  Maximize2,
  Menu,
  Minimize2,
  RotateCcw,
  Search,
  ShieldCheck,
  X,
} from "lucide-react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import { Logo } from "./shared";
import {
  ProductScene,
  type PublicLocale,
  type SceneMode,
} from "./ProductScene";
import ContentExperience from "./ContentExperience";
import { isContentPath, searchContent } from "./content";
import { PublicMetadata } from "./PublicMetadata";
import { Reveal } from "../motion";
import "./public-site.css";

const Locale = createContext<PublicLocale>("en");
function useCopy() {
  const locale = useContext(Locale);
  return (en: string, id: string) => (locale === "en" ? en : id);
}
type NavLink = [string, string, string];
const navigation: { label: [string, string]; links: NavLink[] }[] = [
  {
    label: ["Product", "Produk"],
    links: [
      ["Platform", "Platform", "/platform"],
      ["How it works", "Cara kerja", "/how-it-works"],
      ["Awareness", "Kesadaran", "/product/awareness"],
      ["Programs", "Program", "/product/programs"],
      ["Learning", "Pembelajaran", "/product/learning"],
      ["Phishing resilience", "Ketahanan phishing", "/product/phishing"],
      ["Reporting", "Pelaporan", "/product/reporting"],
      ["Certificates", "Sertifikat", "/product/certificates"],
      [
        "Identity & security",
        "Identitas & keamanan",
        "/product/identity-security",
      ],
      ["Interactive tour", "Tur interaktif", "/tour"],
      ["Self-service demo", "Demo mandiri", "/demo"],
    ],
  },
  {
    label: ["Programs", "Program"],
    links: [
      ["Awareness programs", "Program kesadaran", "/programs"],
      [
        "Phishing resilience",
        "Ketahanan phishing",
        "/programs/phishing-resilience",
      ],
      [
        "Employee onboarding",
        "Orientasi karyawan",
        "/programs/new-hire-awareness",
      ],
      [
        "Security refresher",
        "Penyegaran keamanan",
        "/programs/security-refresher",
      ],
      [
        "Assessment programs",
        "Program asesmen",
        "/programs/assessment-programs",
      ],
      [
        "Compliance evidence",
        "Bukti kepatuhan",
        "/programs/compliance-evidence",
      ],
    ],
  },
  {
    label: ["Solutions", "Solusi"],
    links: [
      ["All solutions", "Semua solusi", "/solutions"],
      ["Security / IT", "Keamanan / TI", "/solutions/security-teams"],
      ["GRC", "GRC", "/solutions/grc"],
      ["HR / Learning", "SDM / Pembelajaran", "/solutions/hr-learning"],
      ["Management", "Manajemen", "/solutions/management"],
    ],
  },
  {
    label: ["Resources", "Sumber daya"],
    links: [
      ["Resource center", "Pusat sumber daya", "/resources"],
      ["Academy", "Akademi", "/academy"],
      ["Tutorials", "Tutorial", "/tutorials"],
      ["Videos", "Video", "/videos"],
      ["Guides", "Panduan", "/guides"],
      ["Blog", "Blog", "/blog"],
      ["Documentation", "Dokumentasi", "/docs"],
      [
        "Awareness maturity tool",
        "Alat kematangan kesadaran",
        "/tools/awareness-maturity",
      ],
    ],
  },
  {
    label: ["Company", "Perusahaan"],
    links: [
      ["About AVERIS", "Tentang AVERIS", "/about"],
      ["Security", "Keamanan", "/security"],
      ["Integrations", "Integrasi", "/integrations"],
      ["Support", "Dukungan", "/support"],
      ["Pricing", "Harga", "/pricing"],
      ["Compare approaches", "Bandingkan pendekatan", "/compare"],
    ],
  },
];

function SearchDialog({ open, close }: { open: boolean; close: () => void }) {
  const t = useCopy(),
    locale = useContext(Locale),
    dialog = useRef<HTMLDialogElement>(null),
    navigate = useNavigate();
  const [query, setQuery] = useState("");
  useEffect(() => {
    if (open) dialog.current?.showModal();
    else dialog.current?.close();
  }, [open]);
  const local = navigation.flatMap((group) =>
    group.links.map(([en, id, href]) => ({
      href,
      title: t(en, id),
      description: t(
        `Explore ${en.toLowerCase()} in AVERIS.`,
        `Jelajahi ${id.toLowerCase()} di AVERIS.`,
      ),
      type: t(group.label[0], group.label[1]),
      context: t("Product ecosystem", "Ekosistem produk"),
    })),
  );
  const entries = [...searchContent(locale), ...local].filter(
    (item, index, all) =>
      all.findIndex((other) => other.href === item.href) === index,
  );
  const found = entries
    .filter((item) =>
      `${item.title} ${item.description} ${item.type} ${item.context}`
        .toLowerCase()
        .includes(query.toLowerCase()),
    )
    .slice(0, 12);
  return (
    <dialog
      ref={dialog}
      className="ps-search-dialog"
      aria-label={t("Search AVERIS", "Cari AVERIS")}
      onCancel={close}
      onClick={(event) => {
        if (event.target === event.currentTarget) close();
      }}
    >
      <div className="ps-search-input">
        <Search size={20} />
        <input
          autoFocus
          placeholder={t(
            "Search docs, tutorials, product…",
            "Cari dokumen, tutorial, produk…",
          )}
          aria-label={t("Search AVERIS", "Cari AVERIS")}
          value={query}
          onChange={(event) => setQuery(event.target.value)}
          onKeyDown={(event) => {
            if (event.key === "Enter" && found[0]) {
              navigate(found[0].href);
              close();
            }
          }}
        />
        <button
          onClick={close}
          aria-label={t("Close search", "Tutup pencarian")}
        >
          <X size={19} />
        </button>
      </div>
      <div className="ps-search-results">
        <small aria-live="polite">
          {found.length} {t("results", "hasil")}
        </small>
        {found.map((item) => (
          <Link key={item.href} to={item.href} onClick={close}>
            <span>
              <small>
                {item.type} · {item.context}
              </small>
              <strong>{item.title}</strong>
              <p>{item.description}</p>
            </span>
            <ArrowUpRight size={17} />
          </Link>
        ))}
        {!found.length && (
          <p>
            {t(
              "No matches. Try a topic such as learning, evidence, or MFA.",
              "Tidak ada hasil. Coba topik pembelajaran, bukti, atau MFA.",
            )}
          </p>
        )}
      </div>
      <footer>
        {t(
          "Enter opens the first result. Escape closes search.",
          "Enter membuka hasil pertama. Escape menutup pencarian.",
        )}
      </footer>
    </dialog>
  );
}

function PublicNav({ onLocale }: { onLocale: (locale: PublicLocale) => void }) {
  const t = useCopy(),
    locale = useContext(Locale),
    location = useLocation();
  const [menu, setMenu] = useState<number | null>(null),
    [mobile, setMobile] = useState(false),
    [search, setSearch] = useState(false);
  const drawer = useRef<HTMLDialogElement>(null),
    trigger = useRef<HTMLButtonElement>(null),
    header = useRef<HTMLElement>(null);
  const close = () => {
    setMobile(false);
    setMenu(null);
  };
  useEffect(() => {
    close();
    setSearch(false);
  }, [location.pathname]);
  useEffect(() => {
    if (mobile) drawer.current?.showModal();
    else drawer.current?.close();
  }, [mobile]);
  useEffect(() => {
    const handler = (event: KeyboardEvent) => {
      if ((event.metaKey || event.ctrlKey) && event.key.toLowerCase() === "k") {
        event.preventDefault();
        setSearch((value) => !value);
      }
      if (event.key === "Escape") setMenu(null);
    };
    const outside = (event: PointerEvent) => {
      if (!header.current?.contains(event.target as Node)) setMenu(null);
    };
    document.addEventListener("keydown", handler);
    document.addEventListener("pointerdown", outside);
    return () => {
      document.removeEventListener("keydown", handler);
      document.removeEventListener("pointerdown", outside);
    };
  }, []);
  return (
    <>
      <header ref={header} className="ps-header">
        <div className="ps-container ps-nav">
          <Logo label={t("AVERIS home", "Beranda AVERIS")} />
          <nav
            className="ps-desktop-nav"
            aria-label={t("Public navigation", "Navigasi publik")}
          >
            {navigation.map((group, index) => (
              <div key={group.label[0]} className="ps-nav-group">
                <button
                  aria-expanded={menu === index}
                  aria-controls={`public-menu-${index}`}
                  onClick={() => setMenu(menu === index ? null : index)}
                >
                  {t(...group.label)}
                  <ChevronDown size={13} />
                </button>
                {menu === index && (
                  <div id={`public-menu-${index}`} className="ps-mega">
                    <div className="ps-mega-intro">
                      <span className="ps-kicker">{t(...group.label)}</span>
                      <h2>
                        {t(
                          "Every next step, connected.",
                          "Setiap langkah, terhubung.",
                        )}
                      </h2>
                      <p>
                        {t(
                          "Measure. Understand. Act. Prove improvement.",
                          "Ukur. Pahami. Bertindak. Buktikan peningkatan.",
                        )}
                      </p>
                      <Link to="/tour" onClick={close}>
                        {t("Take the tour", "Ikuti tur")}
                        <ArrowRight size={16} />
                      </Link>
                    </div>
                    <div className="ps-mega-links">
                      {group.links.map(([en, id, href]) => (
                        <Link key={href} to={href} onClick={close}>
                          {t(en, id)}
                          <ArrowUpRight size={14} />
                        </Link>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            ))}
          </nav>
          <div className="ps-nav-actions">
            <button
              className="ps-icon-button ps-search-trigger"
              aria-label={t("Search AVERIS", "Cari AVERIS")}
              onClick={() => setSearch(true)}
            >
              <Search size={18} />
              <kbd>⌘ K</kbd>
            </button>
            <button
              className="ps-language"
              aria-label={t("Switch to Indonesian", "Ganti ke bahasa Inggris")}
              onClick={() => onLocale(locale === "en" ? "id" : "en")}
            >
              {locale === "en" ? "ID" : "EN"}
            </button>
            <Link className="ps-sign-in" to="/login">
              {t("Sign in", "Masuk")}
            </Link>
            <Link className="ps-button ps-button-primary ps-nav-cta" to="/demo">
              {t("Explore AVERIS", "Jelajahi AVERIS")}
              <ArrowRight size={15} />
            </Link>
            <button
              ref={trigger}
              className="ps-menu-button ps-icon-button"
              aria-label={t("Open navigation", "Buka navigasi")}
              aria-expanded={mobile}
              onClick={() => setMobile(true)}
            >
              <Menu size={22} />
            </button>
          </div>
        </div>
      </header>
      <dialog
        ref={drawer}
        className="ps-mobile-panel"
        aria-label={t("Mobile navigation", "Navigasi seluler")}
        onCancel={() => {
          close();
          trigger.current?.focus();
        }}
      >
        <div className="ps-mobile-top">
          <Logo label={t("AVERIS home", "Beranda AVERIS")} />
          <button
            className="ps-icon-button"
            aria-label={t("Close navigation", "Tutup navigasi")}
            onClick={() => {
              close();
              trigger.current?.focus();
            }}
          >
            <X size={22} />
          </button>
        </div>
        <nav>
          {navigation.map((group) => (
            <details key={group.label[0]}>
              <summary>
                {t(...group.label)}
                <ChevronDown size={17} />
              </summary>
              {group.links.map(([en, id, href]) => (
                <Link key={href} to={href} onClick={close}>
                  {t(en, id)}
                  <ArrowRight size={14} />
                </Link>
              ))}
            </details>
          ))}
        </nav>
        <Link
          className="ps-button ps-button-primary"
          to="/demo"
          onClick={close}
        >
          {t("Explore AVERIS", "Jelajahi AVERIS")}
          <ArrowRight size={15} />
        </Link>
        <Link to="/login" onClick={close}>
          {t("Sign in", "Masuk")}
        </Link>
      </dialog>
      <SearchDialog open={search} close={() => setSearch(false)} />
    </>
  );
}
function PublicFooter() {
  const t = useCopy();
  return (
    <footer className="ps-footer">
      <div className="ps-container">
        <div className="ps-footer-top">
          <Logo label={t("AVERIS home", "Beranda AVERIS")} />
          <p>
            {t(
              "Measure awareness. Reduce human risk.",
              "Ukur kesadaran. Kurangi risiko manusia.",
            )}
          </p>
          <Link to="/request-demo">
            {t("Talk through your program", "Diskusikan program Anda")}
            <ArrowUpRight size={18} />
          </Link>
        </div>
        <div className="ps-footer-grid">
          {navigation.map((group) => (
            <div key={group.label[0]}>
              <strong>{t(...group.label)}</strong>
              {group.links
                .filter((_, index) => index < 7)
                .map(([en, id, href]) => (
                  <Link key={href} to={href}>
                    {t(en, id)}
                  </Link>
                ))}
            </div>
          ))}
        </div>
        <div className="ps-footer-bottom">
          <small>© 2026 AVERIS by VulneraX</small>
          <span>
            <Link to="/privacy">{t("Privacy", "Privasi")}</Link>
            <Link to="/terms">{t("Terms", "Ketentuan")}</Link>
            <Link to="/security">{t("Security", "Keamanan")}</Link>
          </span>
        </div>
      </div>
    </footer>
  );
}
export function PageHero({
  eyebrow,
  title,
  description,
  children,
}: {
  eyebrow: string;
  title: string;
  description: string;
  children?: ReactNode;
}) {
  return (
    <section className="ps-page-hero">
      <div className="ps-container">
        <span className="ps-kicker">{eyebrow}</span>
        <h1>{title}</h1>
        <p>{description}</p>
        {children && <div className="ps-hero-actions">{children}</div>}
      </div>
    </section>
  );
}
function Action({
  to = "/demo",
  children,
  secondary = false,
}: {
  to?: string;
  children?: ReactNode;
  secondary?: boolean;
}) {
  const t = useCopy();
  return (
    <Link
      className={`ps-button ps-button-${secondary ? "secondary" : "primary"}`}
      to={to}
    >
      {children || t("Explore AVERIS", "Jelajahi AVERIS")}
      <ArrowRight size={16} />
    </Link>
  );
}
function Heading({
  eyebrow,
  title,
  text,
}: {
  eyebrow: string;
  title: string;
  text?: string;
}) {
  return (
    <div className="ps-section-title">
      <span className="ps-kicker">{eyebrow}</span>
      <h2>{title}</h2>
      {text && <p>{text}</p>}
    </div>
  );
}
function FinalCTA() {
  const t = useCopy();
  return (
    <section className="ps-final">
      <div className="ps-container">
        <div>
          <span className="ps-kicker">
            {t("YOUR NEXT STEP", "LANGKAH BERIKUTNYA")}
          </span>
          <h2>
            {t(
              "See where your program could go next.",
              "Lihat langkah berikutnya untuk program Anda.",
            )}
          </h2>
          <p>
            {t(
              "Explore the product, then bring your questions.",
              "Jelajahi produk, lalu sampaikan pertanyaan Anda.",
            )}
          </p>
        </div>
        <div>
          <Action />
          <Action to="/request-demo" secondary>
            {t("Request a demo", "Minta demo")}
          </Action>
        </div>
      </div>
    </section>
  );
}
function Scene({
  mode = "admin",
  compact = false,
}: {
  mode?: SceneMode;
  compact?: boolean;
}) {
  return (
    <ProductScene
      locale={useContext(Locale)}
      initialMode={mode}
      compact={compact}
    />
  );
}

function HomePage() {
  const t = useCopy(),
    locale = useContext(Locale),
    [stage, setStage] = useState(0);
  const stages = [
    t("Evidence", "Bukti"),
    t("Awareness", "Kesadaran"),
    t("Action", "Tindakan"),
    t("Improvement", "Peningkatan"),
  ];
  const features = [
    {
      id: "awareness",
      number: "01",
      title: t(
        "A score with its evidence in view.",
        "Skor dengan bukti yang jelas.",
      ),
      text: t(
        "Read awareness alongside measured coverage. See weak topics and departments, and keep missing evidence visible.",
        "Baca kesadaran bersama cakupan pengukuran. Lihat topik dan departemen yang perlu perhatian, serta bukti yang belum tersedia.",
      ),
      href: "/product/awareness",
      mode: "awareness" as SceneMode,
    },
    {
      id: "campaigns",
      number: "02",
      title: t(
        "Turn a finding into a focused program.",
        "Ubah temuan menjadi program terarah.",
      ),
      text: t(
        "Bring the audience, published learning, baseline, simulation, and follow-up into one reviewed campaign.",
        "Satukan audiens, pembelajaran, asesmen awal, simulasi, dan asesmen lanjutan dalam satu kampanye yang ditinjau.",
      ),
      href: "/programs",
      mode: "program" as SceneMode,
    },
    {
      id: "learning",
      number: "03",
      title: t(
        "Give employees one clear next step.",
        "Berikan satu langkah berikutnya yang jelas.",
      ),
      text: t(
        "Short lessons, a readable player, and a knowledge check. Employees can focus on learning and return to their work.",
        "Pelajaran singkat, tampilan yang nyaman dibaca, dan uji pengetahuan. Karyawan fokus belajar lalu kembali bekerja.",
      ),
      href: "/product/learning",
      mode: "employee" as SceneMode,
    },
    {
      id: "reporting",
      number: "04",
      title: t(
        "Show what changed. Keep the record.",
        "Tunjukkan perubahan. Simpan buktinya.",
      ),
      text: t(
        "Explain the outcome to leadership and retain the evidence behind it. Choose executive, campaign, employee, or compliance reporting.",
        "Jelaskan hasil kepada pimpinan dan simpan bukti pendukungnya. Pilih laporan eksekutif, kampanye, karyawan, atau kepatuhan.",
      ),
      href: "/product/reporting",
      mode: "reporting" as SceneMode,
    },
  ];
  return (
    <>
      <section className="ps-home-hero">
        <div className="ps-container ps-home-grid">
          <div className="ps-home-copy">
            <span className="ps-kicker">
              <span className="ps-brand-line" />
              {t(
                "SECURITY AWARENESS & HUMAN RISK",
                "KESADARAN KEAMANAN & RISIKO MANUSIA",
              )}
            </span>
            <h1>
              {t("Measure awareness.", "Ukur kesadaran.")}
              <br />
              <em>{t("Reduce human risk.", "Kurangi risiko manusia.")}</em>
            </h1>
            <p>
              {t(
                "See what people know, how they respond, and where support is needed. Connect learning, assessment, and security behavior to measurable evidence.",
                "Lihat pengetahuan, respons, dan kebutuhan dukungan karyawan. Hubungkan pembelajaran, asesmen, dan perilaku keamanan dengan bukti terukur.",
              )}
            </p>
            <div className="ps-hero-actions">
              <Action />
              <Action to="/tour" secondary>
                {t("Take the product tour", "Ikuti tur produk")}
              </Action>
            </div>
            <div className="ps-hero-detail">
              <ShieldCheck size={16} />
              {t(
                "Evidence first. Clear next steps. Measurable change.",
                "Bukti terlebih dahulu. Langkah jelas. Perubahan terukur.",
              )}
            </div>
          </div>
          <div className="ps-hero-scene">
            <div
              className="ps-story-tabs"
              role="group"
              aria-label={t("Explore the product loop", "Jelajahi alur produk")}
            >
              {stages.map((label, index) => (
                <button
                  key={label}
                  aria-pressed={stage === index}
                  onClick={() => setStage(index)}
                >
                  <span>0{index + 1}</span>
                  {label}
                  {index < 3 && <ChevronRight size={13} />}
                </button>
              ))}
            </div>
            <ProductScene
              locale={locale}
              controlledMode={
                (["admin", "awareness", "program", "reporting"] as SceneMode[])[
                  stage
                ]
              }
              compact
              onModeChange={(mode) =>
                setStage(
                  mode === "awareness"
                    ? 1
                    : mode === "program"
                      ? 2
                      : mode === "reporting"
                        ? 3
                        : 0,
                )
              }
            />
          </div>
        </div>
      </section>
      <section className="ps-proof-band">
        <div className="ps-container">
          <p>
            {t(
              "Four questions. One connected platform.",
              "Empat pertanyaan. Satu platform terhubung.",
            )}
          </p>
          {[
            t("What can we measure?", "Apa yang dapat diukur?"),
            t("What explains the risk?", "Apa penjelasan risikonya?"),
            t("What should we do next?", "Apa langkah berikutnya?"),
            t("Did anything improve?", "Apakah ada peningkatan?"),
          ].map((item, i) => (
            <div key={item}>
              <span>0{i + 1}</span>
              <strong>{item}</strong>
            </div>
          ))}
        </div>
      </section>
      <section className="ps-section ps-problem">
        <div className="ps-container ps-split">
          <Heading
            eyebrow={t("THE MEASUREMENT GAP", "KESENJANGAN PENGUKURAN")}
            title={t(
              "Completion tells you what finished. Evidence tells you what to do.",
              "Penyelesaian mencatat yang selesai. Bukti menunjukkan yang perlu dilakukan.",
            )}
            text={t(
              "When learning, assessments, and reports live apart, it is hard to explain whether your program helped. AVERIS keeps the measurements and their limits together.",
              "Saat pembelajaran, asesmen, dan laporan terpisah, manfaat program sulit dijelaskan. AVERIS menyatukan pengukuran beserta batasannya.",
            )}
          />
          <div className="ps-evidence-list">
            {[
              [
                t("Participation", "Partisipasi"),
                t(
                  "Who started the assigned work?",
                  "Siapa yang mulai mengerjakan tugas?",
                ),
              ],
              [
                t("Knowledge", "Pengetahuan"),
                t(
                  "Which topics need more practice?",
                  "Topik apa yang perlu dilatih?",
                ),
              ],
              [
                t("Behavior", "Perilaku"),
                t(
                  "How did people respond to the simulation?",
                  "Bagaimana respons terhadap simulasi?",
                ),
              ],
              [
                t("Improvement", "Peningkatan"),
                t(
                  "What changed after the intervention?",
                  "Apa yang berubah setelah intervensi?",
                ),
              ],
            ].map(([title, text]) => (
              <div key={title}>
                <Check size={17} />
                <strong>{title}</strong>
                <p>{text}</p>
              </div>
            ))}
          </div>
        </div>
      </section>
      <section className="ps-loop-band">
        <div className="ps-container">
          <Heading
            eyebrow={t("HOW AVERIS WORKS", "CARA KERJA AVERIS")}
            title={t(
              "A continuous question. A deliberate next step.",
              "Pertanyaan berkelanjutan. Langkah yang terencana.",
            )}
          />
          <div className="ps-four-loop">
            {[
              t("Measure", "Ukur"),
              t("Understand", "Pahami"),
              t("Act", "Bertindak"),
              t("Prove improvement", "Buktikan peningkatan"),
            ].map((label, i) => (
              <Link key={label} to={`/how-it-works#stage-${i}`}>
                <span>0{i + 1}</span>
                <h3>{label}</h3>
                <ArrowRight size={21} />
              </Link>
            ))}
          </div>
        </div>
      </section>
      {features.map((feature) => (
        <Reveal key={feature.id}>
          <section
            id={feature.id}
            className={`ps-section ps-feature-story ${Number(feature.number) % 2 === 0 ? "ps-light" : ""}`}
          >
            <div className="ps-container ps-feature-grid">
              <div>
                <Heading
                  eyebrow={`${feature.number} / ${t("CONNECTED BY EVIDENCE", "TERHUBUNG OLEH BUKTI")}`}
                  title={feature.title}
                  text={feature.text}
                />
                <Action to={feature.href} secondary>
                  {t("Explore this workflow", "Jelajahi alur ini")}
                </Action>
              </div>
              <Scene mode={feature.mode} compact />
            </div>
          </section>
        </Reveal>
      ))}
      <section className="ps-section">
        <div className="ps-container ps-split">
          <Heading
            eyebrow={t(
              "SAFE PRACTICE. HUMAN REVIEW.",
              "LATIHAN AMAN. TINJAUAN MANUSIA.",
            )}
            title={t(
              "Make speaking up part of the program.",
              "Jadikan pelaporan bagian dari program.",
            )}
            text={t(
              "Run safe phishing simulations. Give employees a clear way to report suspicious messages, then review each report in a contextual security inbox. No credential collection.",
              "Jalankan simulasi phishing aman. Berikan cara jelas untuk melaporkan pesan mencurigakan, lalu tinjau laporan dalam kotak masuk keamanan. Tanpa mengumpulkan kredensial.",
            )}
          />
          <div className="ps-inline-links">
            <Link to="/product/phishing">
              <ShieldCheck size={23} />
              <span>
                <strong>
                  {t("Phishing resilience", "Ketahanan phishing")}
                </strong>
                <small>
                  {t("Practice, report, review", "Latih, laporkan, tinjau")}
                </small>
              </span>
              <ArrowRight size={18} />
            </Link>
            <Link to="/security">
              <LockKeyhole size={23} />
              <span>
                <strong>
                  {t("Security by design", "Keamanan sejak perancangan")}
                </strong>
                <small>
                  {t(
                    "Server-enforced access and evidence controls",
                    "Kontrol akses dan bukti pada server",
                  )}
                </small>
              </span>
              <ArrowRight size={18} />
            </Link>
          </div>
        </div>
      </section>
      <section className="ps-section ps-light">
        <div className="ps-container ps-split">
          <Heading
            eyebrow={t("LEARN YOUR WAY", "BELAJAR DENGAN CARA ANDA")}
            title={t(
              "A complete place to get started.",
              "Tempat lengkap untuk memulai.",
            )}
            text={t(
              "Explore a safe demo, follow a practical tutorial, or learn how to build a measurable program.",
              "Jelajahi demo aman, ikuti tutorial praktis, atau pelajari cara membangun program terukur.",
            )}
          />
          <div className="ps-resource-rows">
            {[
              [
                "/tour",
                t("Take the interactive tour", "Ikuti tur interaktif"),
                t(
                  "One signal, from evidence to outcome",
                  "Satu sinyal, dari bukti hingga hasil",
                ),
              ],
              [
                "/academy",
                t("Start with AVERIS Academy", "Mulai dengan Akademi AVERIS"),
                t(
                  "Short lessons and useful checks",
                  "Pelajaran singkat dan uji pemahaman",
                ),
              ],
              [
                "/tutorials",
                t("Complete a real task", "Selesaikan tugas nyata"),
                t(
                  "Product instructions, step by step",
                  "Panduan produk, langkah demi langkah",
                ),
              ],
            ].map(([href, title, text]) => (
              <Link key={href} to={href}>
                <span>
                  <strong>{title}</strong>
                  <small>{text}</small>
                </span>
                <ArrowUpRight size={20} />
              </Link>
            ))}
          </div>
        </div>
      </section>
      <FinalCTA />
    </>
  );
}

function PlatformPage() {
  const t = useCopy();
  return (
    <>
      <PageHero
        eyebrow={t("ONE CONNECTED PLATFORM", "SATU PLATFORM TERHUBUNG")}
        title={t(
          "The people. The program. The proof.",
          "Orang. Program. Bukti.",
        )}
        description={t(
          "Connect the work of running awareness to the evidence of what changed. Each part of AVERIS keeps the next decision within reach.",
          "Hubungkan pelaksanaan program kesadaran dengan bukti perubahannya. Setiap bagian AVERIS membantu menentukan keputusan berikutnya.",
        )}
      >
        <Action />
        <Action to="/how-it-works" secondary>
          {t("See how it connects", "Lihat keterhubungannya")}
        </Action>
      </PageHero>
      <section className="ps-container ps-platform-map">
        <div className="ps-platform-center">
          <Logo label={t("AVERIS home", "Beranda AVERIS")} />
          <strong>
            {t(
              "Measure → Understand → Act → Prove",
              "Ukur → Pahami → Bertindak → Buktikan",
            )}
          </strong>
        </div>
        {[
          [
            "People",
            "Karyawan",
            "/solutions/hr-learning",
            "Audience, groups, individual records",
            "Audiens, grup, catatan individu",
          ],
          [
            "Programs",
            "Program",
            "/programs",
            "Baseline, learning, follow-up",
            "Asesmen awal, pembelajaran, tindak lanjut",
          ],
          [
            "Learning",
            "Pembelajaran",
            "/product/learning",
            "Published revisions and focused lessons",
            "Revisi terbit dan pelajaran terarah",
          ],
          [
            "Awareness",
            "Kesadaran",
            "/product/awareness",
            "Score, coverage, supporting evidence",
            "Skor, cakupan, bukti pendukung",
          ],
          [
            "Reports",
            "Laporan",
            "/product/reporting",
            "Outcomes for each responsibility",
            "Hasil sesuai tanggung jawab",
          ],
          [
            "Security evidence",
            "Bukti keamanan",
            "/security",
            "Controlled access and audit history",
            "Akses terkontrol dan riwayat audit",
          ],
        ].map(([en, id, href, desc, descId], index) => (
          <Link key={href} to={href}>
            <span>0{index + 1}</span>
            <h2>{t(en, id)}</h2>
            <p>{t(desc, descId)}</p>
            <ArrowRight size={18} />
          </Link>
        ))}
      </section>
      <section className="ps-section">
        <div className="ps-container ps-feature-grid">
          <Heading
            eyebrow={t("THE OPERATIONAL VIEW", "TAMPILAN OPERASIONAL")}
            title={t(
              "Start with what needs attention.",
              "Mulai dari yang perlu ditangani.",
            )}
            text={t(
              "Overdue work, weak topics, and reports awaiting review lead to specific actions. Score and coverage give those actions context.",
              "Tugas lewat tenggat, topik lemah, dan laporan menunggu tinjauan mengarah pada tindakan tertentu. Skor dan cakupan memberikan konteksnya.",
            )}
          />
          <Scene />
        </div>
      </section>
      <FinalCTA />
    </>
  );
}
const loopCopy = [
  [
    "Measure",
    "Ukur",
    "Establish what you can actually measure.",
    "Tentukan apa yang benar-benar dapat diukur.",
    "Start a baseline. Collect quiz results, simulation responses, and reporting evidence. Missing measurements remain visible.",
    "Mulai asesmen awal. Kumpulkan hasil kuis, respons simulasi, dan bukti pelaporan. Pengukuran yang belum ada tetap terlihat.",
    "Baseline · Quiz · Simulation · Reporting",
    "Asesmen awal · Kuis · Simulasi · Pelaporan",
  ],
  [
    "Understand",
    "Pahami",
    "Read the score with the evidence beside it.",
    "Baca skor bersama bukti pendukungnya.",
    "Compare topics and departments. Distinguish measured employee coverage from component coverage before drawing a conclusion.",
    "Bandingkan topik dan departemen. Bedakan cakupan karyawan terukur dari cakupan komponen sebelum menarik kesimpulan.",
    "Score · Coverage · Topics · Departments",
    "Skor · Cakupan · Topik · Departemen",
  ],
  [
    "Act",
    "Bertindak",
    "Give each intervention a clear reason.",
    "Berikan alasan jelas untuk setiap intervensi.",
    "Choose the audience, assign published learning, add an optional simulation, and review the schedule before launch.",
    "Pilih audiens, tugaskan pembelajaran yang diterbitkan, tambahkan simulasi opsional, dan tinjau jadwal sebelum peluncuran.",
    "Audience · Learning · Campaign · Reminders",
    "Audiens · Pembelajaran · Kampanye · Pengingat",
  ],
  [
    "Prove improvement",
    "Buktikan peningkatan",
    "Return to the question you started with.",
    "Kembali ke pertanyaan awal Anda.",
    "Compare follow-up evidence. Separate participation from outcomes, preserve certificates, and export the report your stakeholders need.",
    "Bandingkan bukti lanjutan. Pisahkan partisipasi dari hasil, simpan sertifikat, dan ekspor laporan yang diperlukan pemangku kepentingan.",
    "Follow-up · Reports · Certificates · Audit",
    "Tindak lanjut · Laporan · Sertifikat · Audit",
  ],
];
function HowItWorksPage() {
  const t = useCopy(),
    locale = useContext(Locale),
    [stage, setStage] = useState(0),
    story = useRef<HTMLDivElement>(null);
  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        for (const entry of entries)
          if (entry.isIntersecting)
            setStage(Number((entry.target as HTMLElement).dataset.stage));
      },
      { rootMargin: "-20% 0px -45% 0px", threshold: 0 },
    );
    story.current
      ?.querySelectorAll("[data-stage]")
      .forEach((node) => observer.observe(node));
    return () => observer.disconnect();
  }, []);
  return (
    <>
      <PageHero
        eyebrow={t("HOW IT WORKS", "CARA KERJA")}
        title={t(
          "From the first measurement to the next better decision.",
          "Dari pengukuran pertama menuju keputusan yang lebih baik.",
        )}
        description={t(
          "Four stages keep your awareness program connected. Scroll through the workflow, or select a stage to explore it.",
          "Empat tahap menjaga program kesadaran tetap terhubung. Gulir alurnya, atau pilih tahap untuk menjelajah.",
        )}
      />
      <section className="ps-section ps-light">
        <div ref={story} className="ps-container ps-scroll-story">
          <div className="ps-story-copy">
            {loopCopy.map((copy, index) => (
              <article
                key={copy[0]}
                id={`stage-${index}`}
                data-stage={index}
                className={stage === index ? "is-active" : ""}
              >
                <span className="ps-kicker">
                  0{index + 1} / {t(copy[0], copy[1])}
                </span>
                <h2>{t(copy[2], copy[3])}</h2>
                <p>{t(copy[4], copy[5])}</p>
                <small>{t(copy[6], copy[7])}</small>
                <button
                  className="ps-text-button"
                  onClick={() => setStage(index)}
                >
                  {t("Show this stage", "Tampilkan tahap ini")}
                  <ArrowRight size={16} />
                </button>
              </article>
            ))}
          </div>
          <div className="ps-sticky-scene">
            <div className="ps-story-tabs">
              {loopCopy.map((copy, index) => (
                <button
                  key={copy[0]}
                  aria-pressed={stage === index}
                  onClick={() => setStage(index)}
                >
                  {index + 1}. {t(copy[0], copy[1])}
                </button>
              ))}
            </div>
            <ProductScene
              locale={locale}
              controlledMode={
                (["admin", "awareness", "program", "reporting"] as SceneMode[])[
                  stage
                ]
              }
              compact
              onModeChange={(mode) =>
                setStage(
                  mode === "awareness"
                    ? 1
                    : mode === "program"
                      ? 2
                      : mode === "reporting"
                        ? 3
                        : 0,
                )
              }
            />
          </div>
        </div>
      </section>
      <FinalCTA />
    </>
  );
}

type Capability = {
  name: [string, string];
  title: [string, string];
  description: [string, string];
  mode: SceneMode;
  sections: [string, string, string, string][];
};
const capabilities: Record<string, Capability> = {
  awareness: {
    name: ["Awareness", "Kesadaran"],
    title: ["See why awareness changed.", "Lihat mengapa kesadaran berubah."],
    description: [
      "A score is useful when you can explain the evidence, coverage, and limits behind it. AVERIS keeps all three in view.",
      "Skor berguna ketika bukti, cakupan, dan batasannya dapat dijelaskan. AVERIS memperlihatkan ketiganya.",
    ],
    mode: "awareness",
    sections: [
      [
        "Read coverage before conclusions",
        "Baca cakupan sebelum menyimpulkan",
        "Measured employees and available score components are different denominators. Neither is a confidence rating.",
        "Karyawan terukur dan komponen skor tersedia memiliki dasar hitung berbeda. Keduanya bukan tingkat keyakinan.",
      ],
      [
        "Keep missing evidence visible",
        "Tampilkan bukti yang belum ada",
        "An employee without score evidence is Unmeasured. Available components are reweighted; absent evidence is never a zero.",
        "Karyawan tanpa bukti skor berstatus Belum diukur. Bobot komponen tersedia disesuaikan; bukti yang tidak ada bukan nol.",
      ],
      [
        "Find the topic that needs practice",
        "Temukan topik yang perlu dilatih",
        "Compare topic and department results, inspect history, then choose a focused learning intervention.",
        "Bandingkan hasil topik dan departemen, periksa riwayat, lalu pilih intervensi pembelajaran terarah.",
      ],
    ],
  },
  programs: {
    name: ["Programs", "Program"],
    title: [
      "One campaign. A complete learning loop.",
      "Satu kampanye. Alur pembelajaran lengkap.",
    ],
    description: [
      "Move from audience selection to a reviewed launch with learning, assessment, safe simulation, and a clear schedule.",
      "Mulai dari pemilihan audiens hingga peluncuran yang ditinjau dengan pembelajaran, asesmen, simulasi aman, dan jadwal jelas.",
    ],
    mode: "program",
    sections: [
      [
        "Choose who needs support",
        "Pilih siapa yang perlu dukungan",
        "Use employee, department, or group audiences. Preview the participants before launching the campaign.",
        "Gunakan audiens karyawan, departemen, atau grup. Tinjau peserta sebelum meluncurkan kampanye.",
      ],
      [
        "Keep the program intentional",
        "Rencanakan program secara terarah",
        "Use five builder stages: Basics, Audience, Learning, Measure & Simulate, and Schedule & Review.",
        "Gunakan lima tahap: Dasar, Audiens, Pembelajaran, Ukur & Simulasikan, serta Jadwal & Tinjauan.",
      ],
      [
        "Manage the work after launch",
        "Kelola pekerjaan setelah peluncuran",
        "Review participants, progress, overdue work, assessments, and simulation outcomes in campaign context.",
        "Tinjau peserta, progres, tugas lewat tenggat, asesmen, dan hasil simulasi dalam konteks kampanye.",
      ],
    ],
  },
  learning: {
    name: ["Learning", "Pembelajaran"],
    title: [
      "Short lessons. Useful practice. A clear next step.",
      "Pelajaran singkat. Latihan berguna. Langkah jelas.",
    ],
    description: [
      "Create practical security learning with articles, scenarios, checklists, security tips, and questions. Give employees a focused player.",
      "Buat pembelajaran keamanan praktis melalui artikel, skenario, daftar periksa, tips keamanan, dan pertanyaan. Berikan tampilan belajar yang fokus.",
    ],
    mode: "employee",
    sections: [
      [
        "Publish with a reliable record",
        "Terbitkan dengan catatan tepercaya",
        "Published revisions stay immutable. Update a draft to create the next revision while existing assignments retain their content.",
        "Revisi yang diterbitkan tidak dapat diubah. Perbarui draf untuk revisi berikutnya sementara tugas lama mempertahankan kontennya.",
      ],
      [
        "Keep the library manageable",
        "Jaga pustaka tetap terkelola",
        "Organize by category, language, difficulty, duration, and publication status. Preview before publishing.",
        "Atur menurut kategori, bahasa, tingkat kesulitan, durasi, dan status penerbitan. Tinjau sebelum menerbitkan.",
      ],
      [
        "Finish with a knowledge check",
        "Akhiri dengan uji pengetahuan",
        "Employees resume their lesson, move through the content, then complete a quiz graded by the server.",
        "Karyawan melanjutkan pelajaran, membaca konten, lalu menyelesaikan kuis yang dinilai server.",
      ],
    ],
  },
  phishing: {
    name: ["Phishing resilience", "Ketahanan phishing"],
    title: [
      "Practice the response. Review the report.",
      "Latih respons. Tinjau laporannya.",
    ],
    description: [
      "Connect safe simulations with employee reporting and administrator review. Make the response visible without collecting credentials.",
      "Hubungkan simulasi aman dengan pelaporan karyawan dan tinjauan administrator. Perlihatkan respons tanpa mengumpulkan kredensial.",
    ],
    mode: "phishing",
    sections: [
      [
        "Track distinct simulation events",
        "Catat peristiwa simulasi secara terpisah",
        "Delivered, opened, clicked, reported, and no action answer different questions. An open is not proof of understanding.",
        "Terkirim, dibuka, diklik, dilaporkan, dan tanpa tindakan menjawab pertanyaan berbeda. Membuka bukan bukti pemahaman.",
      ],
      [
        "Review in a security inbox",
        "Tinjau dalam kotak masuk keamanan",
        "Read sender, subject, reporter, channel, status, classification, and timeline. Internal notes stay admin-only.",
        "Baca pengirim, subjek, pelapor, kanal, status, klasifikasi, dan riwayat. Catatan internal hanya untuk admin.",
      ],
      [
        "Keep the limits clear",
        "Jelaskan batasannya",
        "Safe simulations never ask for real passwords. Report classification is a human review workflow, not automatic malware analysis.",
        "Simulasi aman tidak meminta kata sandi asli. Klasifikasi laporan dilakukan peninjau manusia, bukan analisis malware otomatis.",
      ],
    ],
  },
  reporting: {
    name: ["Reporting", "Pelaporan"],
    title: [
      "An outcome for every audience. Evidence behind each one.",
      "Hasil untuk setiap audiens. Bukti di balik semuanya.",
    ],
    description: [
      "Choose the report your conversation requires. Keep scope, period, filters, and export format visible before generating it.",
      "Pilih laporan sesuai kebutuhan diskusi. Perlihatkan cakupan, periode, filter, dan format sebelum membuatnya.",
    ],
    mode: "reporting",
    sections: [
      [
        "Executive and campaign views",
        "Tampilan eksekutif dan kampanye",
        "Summarize organization awareness or inspect one campaign. Keep measured coverage beside outcomes and overdue work.",
        "Ringkas kesadaran organisasi atau periksa satu kampanye. Tampilkan cakupan bersama hasil dan tugas lewat tenggat.",
      ],
      [
        "Employee and compliance evidence",
        "Bukti karyawan dan kepatuhan",
        "Review individual learning records or trace employee, course, assignment, completion, and certificate evidence.",
        "Tinjau catatan belajar individu atau telusuri bukti karyawan, kursus, tugas, penyelesaian, dan sertifikat.",
      ],
      [
        "Server-generated CSV and PDF",
        "CSV dan PDF dibuat server",
        "Exports use authorized tenant data and the selected filters. Missing score evidence remains distinct from a zero score.",
        "Ekspor menggunakan data organisasi yang diizinkan dan filter terpilih. Bukti skor yang belum ada tetap berbeda dari skor nol.",
      ],
    ],
  },
  certificates: {
    name: ["Certificates", "Sertifikat"],
    title: [
      "A completion record you can verify.",
      "Catatan penyelesaian yang dapat diverifikasi.",
    ],
    description: [
      "Connect successful learning to a server-issued certificate. Keep the employee, course, outcome, and verification record together.",
      "Hubungkan pembelajaran yang berhasil dengan sertifikat terbitan server. Satukan karyawan, kursus, hasil, dan catatan verifikasinya.",
    ],
    mode: "employee",
    sections: [
      [
        "Issued from real completion",
        "Terbit dari penyelesaian nyata",
        "Certificate issuance stays with the server after the required completion conditions are met.",
        "Penerbitan sertifikat tetap dilakukan server setelah syarat penyelesaian terpenuhi.",
      ],
      [
        "Available to the employee",
        "Tersedia untuk karyawan",
        "Employees can find their certificates alongside their learning record and awareness history.",
        "Karyawan dapat menemukan sertifikat bersama catatan belajar dan riwayat kesadaran.",
      ],
      [
        "Verification with boundaries",
        "Verifikasi dengan batasan",
        "A verification reference checks certificate validity. It does not represent a professional accreditation or guarantee future behavior.",
        "Referensi verifikasi memeriksa validitas sertifikat. Sertifikat bukan akreditasi profesional atau jaminan perilaku masa depan.",
      ],
    ],
  },
  "identity-security": {
    name: ["Identity & security", "Identitas & keamanan"],
    title: [
      "Give people the access their work requires.",
      "Berikan akses sesuai kebutuhan pekerjaan.",
    ],
    description: [
      "Tenant scope, server-side roles, secure sessions, MFA, and optional OIDC support protect the people and evidence in your program.",
      "Cakupan organisasi, peran pada server, sesi aman, MFA, dan dukungan OIDC opsional melindungi karyawan dan bukti program.",
    ],
    mode: "admin",
    sections: [
      [
        "Roles enforced by the server",
        "Peran ditegakkan server",
        "Workspace authorization scopes what each role can read and change. Hiding a button is never the security boundary.",
        "Otorisasi ruang kerja menentukan data yang dapat dibaca dan diubah setiap peran. Menyembunyikan tombol bukan batas keamanan.",
      ],
      [
        "MFA and account sessions",
        "MFA dan sesi akun",
        "Use authenticator-based MFA and session controls. Recovery and verification stay in the authenticated identity workflow.",
        "Gunakan MFA berbasis autentikator dan kontrol sesi. Pemulihan dan verifikasi tetap dalam alur identitas terautentikasi.",
      ],
      [
        "OIDC when configured",
        "OIDC ketika dikonfigurasi",
        "An optional deployment-configured OIDC connection supports organization sign-in. It is separate from directory provisioning.",
        "Koneksi OIDC opsional yang dikonfigurasi pada penerapan mendukung masuk organisasi. Ini berbeda dari provisi direktori.",
      ],
    ],
  },
};
function ProductPage({ slug }: { slug: string }) {
  const t = useCopy();
  const alias: Record<string, string> = {
    "human-risk": "awareness",
    "security-awareness": "awareness",
    simulations: "phishing",
  };
  const page = capabilities[alias[slug] || slug];
  if (!page) return <NotFound />;
  return (
    <>
      <PageHero
        eyebrow={t(...page.name)}
        title={t(...page.title)}
        description={t(...page.description)}
      >
        <Action />
        <Action to="/docs" secondary>
          {t("Read the documentation", "Baca dokumentasi")}
        </Action>
      </PageHero>
      <section className="ps-container ps-product-stage">
        {slug === "certificates" ? (
          <div className="ps-certificate">
            <span className="ps-kicker">
              {t("ILLUSTRATIVE CERTIFICATE", "SERTIFIKAT ILUSTRATIF")}
            </span>
            <Logo label={t("AVERIS home", "Beranda AVERIS")} />
            <h2>{t("Certificate of completion", "Sertifikat penyelesaian")}</h2>
            <p>{t("Presented to", "Diberikan kepada")}</p>
            <strong>Andini Putri</strong>
            <p>
              {t(
                "Recognize and report phishing",
                "Kenali dan laporkan phishing",
              )}
            </p>
            <div>
              <span>
                {t("Passed knowledge check", "Lulus uji pengetahuan")}
              </span>
              <span>
                {t(
                  "Sample · Not a valid certificate",
                  "Contoh · Bukan sertifikat valid",
                )}
              </span>
            </div>
          </div>
        ) : slug === "identity-security" ? (
          <div className="ps-security-boundary">
            <LockKeyhole size={36} />
            <h2>
              {t(
                "The server owns the boundary.",
                "Server menegakkan batas akses.",
              )}
            </h2>
            <div>
              {[
                t("Tenant scope", "Cakupan organisasi"),
                t("Role permission", "Izin peran"),
                t("Session verification", "Verifikasi sesi"),
                t("Authorized action", "Tindakan yang diizinkan"),
              ].map((label, i) => (
                <span key={label}>
                  <b>0{i + 1}</b>
                  {label}
                  {i < 3 && <ArrowRight size={17} />}
                </span>
              ))}
            </div>
          </div>
        ) : (
          <Scene mode={page.mode} />
        )}
      </section>
      <section className="ps-section">
        <div className="ps-container ps-editorial-list">
          {page.sections.map(([en, id, body, bodyId], i) => (
            <article key={en}>
              <span>0{i + 1}</span>
              <h2>{t(en, id)}</h2>
              <p>{t(body, bodyId)}</p>
            </article>
          ))}
        </div>
      </section>
      {(alias[slug] || slug) === "awareness" && (
        <section className="ps-section ps-light">
          <div className="ps-container ps-split">
            <Heading
              eyebrow={t(
                "SAME SCORE. DIFFERENT EVIDENCE.",
                "SKOR SAMA. BUKTI BERBEDA.",
              )}
              title={t(
                "An 88 with one component is not an 88 with all four.",
                "Skor 88 dari satu komponen berbeda dengan skor 88 dari empat komponen.",
              )}
              text={t(
                "Coverage describes which components were measured. Read it together with the score, and collect the missing evidence before over-interpreting the result.",
                "Cakupan menjelaskan komponen yang telah diukur. Baca bersama skornya, dan kumpulkan bukti yang belum tersedia sebelum menafsirkan hasil terlalu jauh.",
              )}
            />
            <div className="ps-score-comparison">
              <div>
                <strong>88</strong>
                <span>{t("Knowledge only", "Pengetahuan saja")}</span>
                <small>35% {t("component coverage", "cakupan komponen")}</small>
              </div>
              <div>
                <strong>88</strong>
                <span>{t("All four components", "Keempat komponen")}</span>
                <small>
                  100% {t("component coverage", "cakupan komponen")}
                </small>
              </div>
            </div>
          </div>
        </section>
      )}
      <FinalCTA />
    </>
  );
}

const programs: Record<
  string,
  {
    title: [string, string];
    headline: [string, string];
    description: [string, string];
    audience: [string, string];
    measure: [string, string];
    learning: [string, string];
    followup: [string, string];
    mode: SceneMode;
  }
> = {
  "phishing-resilience": {
    title: ["Phishing resilience", "Ketahanan phishing"],
    headline: [
      "Help people pause, verify, and report.",
      "Bantu karyawan berhenti, memverifikasi, dan melaporkan.",
    ],
    description: [
      "Build a focused campaign around suspicious messages. Combine practical learning with safe practice and a reviewed reporting workflow.",
      "Bangun kampanye terarah tentang pesan mencurigakan. Gabungkan pembelajaran praktis dengan latihan aman dan alur pelaporan yang ditinjau.",
    ],
    audience: [
      "A department with weak phishing topic results, or a defined employee group.",
      "Departemen dengan hasil topik phishing lemah, atau grup karyawan tertentu.",
    ],
    measure: [
      "Baseline knowledge plus safe simulation responses. Keep clicked and reported distinct.",
      "Pengetahuan awal beserta respons simulasi aman. Bedakan diklik dari dilaporkan.",
    ],
    learning: [
      "Sender verification, unexpected payment requests, suspicious links, and the reporting process.",
      "Verifikasi pengirim, permintaan pembayaran tak terduga, tautan mencurigakan, dan proses pelaporan.",
    ],
    followup: [
      "Compare the follow-up assessment and review simulation outcomes for the selected audience.",
      "Bandingkan asesmen lanjutan dan tinjau hasil simulasi untuk audiens terpilih.",
    ],
    mode: "phishing",
  },
  "new-hire-awareness": {
    title: ["Employee onboarding", "Orientasi karyawan"],
    headline: [
      "Give new employees a clear security starting point.",
      "Berikan titik awal keamanan yang jelas untuk karyawan baru.",
    ],
    description: [
      "Create a program for a selected new-hire group. Establish a baseline, explain everyday decisions, and confirm understanding.",
      "Buat program untuk grup karyawan baru yang dipilih. Tetapkan kondisi awal, jelaskan keputusan sehari-hari, dan pastikan pemahaman.",
    ],
    audience: [
      "Select employees or maintain a new-hire group. Administrators manage enrollment explicitly.",
      "Pilih karyawan atau kelola grup karyawan baru. Administrator mengatur pendaftaran secara eksplisit.",
    ],
    measure: [
      "A baseline assessment before learning establishes what is already understood.",
      "Asesmen awal sebelum pembelajaran menetapkan apa yang telah dipahami.",
    ],
    learning: [
      "Account protection, suspicious messages, safe data handling, and how to ask for help.",
      "Perlindungan akun, pesan mencurigakan, penanganan data aman, dan cara meminta bantuan.",
    ],
    followup: [
      "Review knowledge checks, completion, and eligible certificates. Follow up on overdue work.",
      "Tinjau uji pengetahuan, penyelesaian, dan sertifikat yang memenuhi syarat. Tindak lanjuti tugas lewat tenggat.",
    ],
    mode: "employee",
  },
  "security-refresher": {
    title: ["Security refresher", "Penyegaran keamanan"],
    headline: [
      "Focus the refresher on the topic that needs it.",
      "Fokuskan penyegaran pada topik yang membutuhkan.",
    ],
    description: [
      "Use current evidence to choose a useful lesson and a defined audience. Keep the intervention small enough to understand its outcome.",
      "Gunakan bukti terkini untuk memilih pelajaran berguna dan audiens tertentu. Batasi intervensi agar hasilnya dapat dipahami.",
    ],
    audience: [
      "Employees or departments with a weak measured topic, based on reviewed results.",
      "Karyawan atau departemen dengan topik terukur lemah, berdasarkan hasil yang ditinjau.",
    ],
    measure: [
      "Record the current topic results and measured coverage before assigning the refresher.",
      "Catat hasil topik terkini dan cakupan sebelum menugaskan penyegaran.",
    ],
    learning: [
      "Choose one relevant published revision with a short lesson and focused questions.",
      "Pilih satu revisi terbit yang relevan dengan pelajaran singkat dan pertanyaan terarah.",
    ],
    followup: [
      "Run a follow-up assessment and compare the same audience. Explain coverage changes separately.",
      "Jalankan asesmen lanjutan dan bandingkan audiens yang sama. Jelaskan perubahan cakupan secara terpisah.",
    ],
    mode: "program",
  },
  "compliance-evidence": {
    title: ["Compliance evidence", "Bukti kepatuhan"],
    headline: [
      "Make the record as clear as the program.",
      "Buat catatan sejelas programnya.",
    ],
    description: [
      "Connect assigned learning to completion, assessment outcomes, certificates, and audit records. Prepare evidence with an explicit scope.",
      "Hubungkan tugas pembelajaran dengan penyelesaian, hasil asesmen, sertifikat, dan catatan audit. Siapkan bukti dengan cakupan jelas.",
    ],
    audience: [
      "The people included in the obligation you are documenting; confirm the scope with your team.",
      "Karyawan dalam kewajiban yang Anda dokumentasikan; konfirmasikan cakupan dengan tim.",
    ],
    measure: [
      "Keep assigned, started, completed, and passed records distinct.",
      "Pisahkan catatan ditugaskan, dimulai, selesai, dan lulus.",
    ],
    learning: [
      "Publish the required content revision and set a clear completion deadline.",
      "Terbitkan revisi konten yang diperlukan dan tetapkan tenggat penyelesaian jelas.",
    ],
    followup: [
      "Export Compliance Evidence CSV or PDF. A report supports your review; it does not certify compliance.",
      "Ekspor CSV atau PDF Bukti Kepatuhan. Laporan mendukung tinjauan Anda; bukan sertifikasi kepatuhan.",
    ],
    mode: "reporting",
  },
  "assessment-programs": {
    title: ["Assessment programs", "Program asesmen"],
    headline: [
      "Start with a baseline you can return to.",
      "Mulai dengan kondisi awal yang dapat dibandingkan.",
    ],
    description: [
      "Measure knowledge before learning and revisit it afterward. Keep audience, topic, and period clear when explaining a change.",
      "Ukur pengetahuan sebelum belajar dan tinjau kembali sesudahnya. Perjelas audiens, topik, dan periode saat menjelaskan perubahan.",
    ],
    audience: [
      "A defined campaign audience with eligible baseline and follow-up assessments.",
      "Audiens kampanye tertentu dengan asesmen awal dan lanjutan yang memenuhi syarat.",
    ],
    measure: [
      "Server-graded assessment results establish the knowledge evidence.",
      "Hasil asesmen yang dinilai server membentuk bukti pengetahuan.",
    ],
    learning: [
      "Choose learning based on weak topics; preserve the published revision used by the campaign.",
      "Pilih pembelajaran berdasarkan topik lemah; pertahankan revisi terbit yang digunakan kampanye.",
    ],
    followup: [
      "Compare the paired baseline and follow-up results. Unmeasured people remain separate.",
      "Bandingkan pasangan hasil awal dan lanjutan. Karyawan yang belum diukur tetap dipisahkan.",
    ],
    mode: "awareness",
  },
};
function ProgramsPage({ slug }: { slug?: string }) {
  const t = useCopy();
  const program = slug ? programs[slug] : undefined;
  if (slug && !program) return <NotFound />;
  return (
    <>
      <PageHero
        eyebrow={
          program
            ? t(...program.title)
            : t("AWARENESS PROGRAMS", "PROGRAM KESADARAN")
        }
        title={
          program
            ? t(...program.headline)
            : t(
                "Run a program with a reason. Measure what follows.",
                "Jalankan program dengan tujuan. Ukur hasilnya.",
              )
        }
        description={
          program
            ? t(...program.description)
            : t(
                "A program connects baseline, audience, learning, practice, and follow-up. In the workspace, you manage that work as a campaign.",
                "Program menghubungkan asesmen awal, audiens, pembelajaran, latihan, dan tindak lanjut. Di ruang kerja, Anda mengelolanya sebagai kampanye.",
              )
        }
      >
        <Action to="/demo" />
        <Action to="/tutorials/first-awareness-program" secondary>
          {t("Create your first campaign", "Buat kampanye pertama")}
        </Action>
      </PageHero>
      {program ? (
        <>
          <section className="ps-container ps-product-stage">
            <Scene mode={program.mode} />
          </section>
          <section className="ps-section">
            <div className="ps-container ps-program-playbook">
              <Heading
                eyebrow={t(
                  "A PRACTICAL PROGRAM OUTLINE",
                  "KERANGKA PROGRAM PRAKTIS",
                )}
                title={t(
                  "Build the program around this work.",
                  "Bangun program berdasarkan pekerjaan ini.",
                )}
              />
              {[
                [t("Audience", "Audiens"), program.audience],
                [t("Baseline", "Asesmen awal"), program.measure],
                [t("Learning", "Pembelajaran"), program.learning],
                [
                  t("Follow-up & reporting", "Tindak lanjut & pelaporan"),
                  program.followup,
                ],
              ].map(([label, copy], index) => (
                <article key={label as string}>
                  <span>0{index + 1}</span>
                  <h3>{label as string}</h3>
                  <p>{t(...(copy as [string, string]))}</p>
                </article>
              ))}
            </div>
          </section>
          <section className="ps-section ps-light">
            <div className="ps-container ps-split">
              <Heading
                eyebrow={t("ADMINISTRATOR-LED", "DIPANDU ADMINISTRATOR")}
                title={t(
                  "Review the audience and timing before launch.",
                  "Tinjau audiens dan jadwal sebelum peluncuran.",
                )}
                text={t(
                  "These are program patterns for current campaign capabilities. Your team chooses enrollment, content, scheduling, and follow-up; automatic continuous enrollment is not implied.",
                  "Ini pola program untuk kemampuan kampanye saat ini. Tim Anda memilih pendaftaran, konten, jadwal, dan tindak lanjut; bukan pendaftaran berkelanjutan otomatis.",
                )}
              />
              <Action to="/programs" secondary>
                {t("Explore other programs", "Jelajahi program lain")}
              </Action>
            </div>
          </section>
        </>
      ) : (
        <>
          <section className="ps-section ps-light">
            <div className="ps-container">
              <div className="ps-program-sequence">
                {[
                  t("Baseline", "Asesmen awal"),
                  t("Audience", "Audiens"),
                  t("Learning", "Pembelajaran"),
                  t("Simulation", "Simulasi"),
                  t("Follow-up", "Tindak lanjut"),
                  t("Reporting", "Pelaporan"),
                ].map((name, i) => (
                  <div key={name}>
                    <span>0{i + 1}</span>
                    <h2>{name}</h2>
                    {i < 5 && <ArrowRight size={18} />}
                  </div>
                ))}
              </div>
              <p className="ps-section-note">
                {t(
                  "Choose the measurements and optional simulation that fit the objective. Each campaign is reviewed and launched by your team.",
                  "Pilih pengukuran dan simulasi opsional yang sesuai tujuan. Setiap kampanye ditinjau dan diluncurkan oleh tim Anda.",
                )}
              </p>
            </div>
          </section>
          <section className="ps-section">
            <div className="ps-container ps-program-catalog">
              {Object.entries(programs).map(([key, item], i) => (
                <Link key={key} to={`/programs/${key}`}>
                  <span>0{i + 1}</span>
                  <div>
                    <small>{t(...item.title)}</small>
                    <h2>{t(...item.headline)}</h2>
                    <p>{t(...item.description)}</p>
                  </div>
                  <ArrowUpRight size={23} />
                </Link>
              ))}
            </div>
          </section>
        </>
      )}
      <FinalCTA />
    </>
  );
}

const solutions: Record<
  string,
  {
    name: [string, string];
    title: [string, string];
    description: [string, string];
    question: [string, string];
    steps: [string, string][];
    mode: SceneMode;
  }
> = {
  "security-teams": {
    name: ["Security / IT", "Keamanan / TI"],
    title: [
      "Know where to focus next—and why.",
      "Ketahui fokus berikutnya—beserta alasannya.",
    ],
    description: [
      "Prioritize weak topics and overdue work, review phishing reports, and run a focused program with evidence behind the decision.",
      "Prioritaskan topik lemah dan tugas lewat tenggat, tinjau laporan phishing, lalu jalankan program terarah dengan bukti pendukung.",
    ],
    question: [
      "Which team needs a useful intervention today?",
      "Tim mana yang memerlukan intervensi berguna hari ini?",
    ],
    steps: [
      [
        "Review attention items and measured coverage.",
        "Tinjau hal yang perlu perhatian dan cakupan pengukuran.",
      ],
      [
        "Inspect department and topic evidence.",
        "Periksa bukti departemen dan topik.",
      ],
      [
        "Launch a reviewed campaign and compare follow-up.",
        "Luncurkan kampanye yang ditinjau dan bandingkan hasil lanjutannya.",
      ],
    ],
    mode: "admin",
  },
  grc: {
    name: ["GRC", "GRC"],
    title: [
      "Keep the evidence within reach.",
      "Pastikan bukti mudah ditemukan.",
    ],
    description: [
      "Connect the program you ran to the records it produced. Scope your exports and explain what the evidence does and does not establish.",
      "Hubungkan program yang dijalankan dengan catatan yang dihasilkan. Tentukan cakupan ekspor dan jelaskan kesimpulan yang didukung bukti.",
    ],
    question: [
      "Can we trace this completion claim to a record?",
      "Dapatkah klaim penyelesaian ditelusuri ke catatan?",
    ],
    steps: [
      [
        "Confirm the campaign, period, and employee scope.",
        "Pastikan cakupan kampanye, periode, dan karyawan.",
      ],
      [
        "Review learning revisions, completion, and certificates.",
        "Tinjau revisi pembelajaran, penyelesaian, dan sertifikat.",
      ],
      [
        "Export evidence and retain the administrative audit trail.",
        "Ekspor bukti dan simpan jejak audit administratif.",
      ],
    ],
    mode: "reporting",
  },
  "hr-learning": {
    name: ["HR / Learning", "SDM / Pembelajaran"],
    title: [
      "Make awareness easier to manage—and complete.",
      "Buat kesadaran lebih mudah dikelola—dan diselesaikan.",
    ],
    description: [
      "Keep employee records, group audiences, relevant learning, and deadlines connected. Give each learner a clear next action.",
      "Hubungkan catatan karyawan, audiens grup, pembelajaran relevan, dan tenggat. Berikan tindakan berikutnya yang jelas bagi peserta.",
    ],
    question: [
      "What should this employee learn next?",
      "Apa yang sebaiknya dipelajari karyawan ini berikutnya?",
    ],
    steps: [
      [
        "Maintain the employee directory and groups.",
        "Kelola direktori karyawan dan grup.",
      ],
      [
        "Choose relevant published learning and realistic deadlines.",
        "Pilih pembelajaran relevan dan tenggat realistis.",
      ],
      [
        "Review participation, overdue assignments, and achievement.",
        "Tinjau partisipasi, tugas lewat tenggat, dan pencapaian.",
      ],
    ],
    mode: "employee",
  },
  management: {
    name: ["Management", "Manajemen"],
    title: [
      "See the outcome without losing the context.",
      "Lihat hasil tanpa kehilangan konteks.",
    ],
    description: [
      "Understand organization awareness, measured coverage, and program outcomes through concise reporting with clear denominators.",
      "Pahami kesadaran organisasi, cakupan pengukuran, dan hasil program melalui laporan ringkas dengan dasar hitung jelas.",
    ],
    question: [
      "Did the intervention improve the measured outcome?",
      "Apakah intervensi meningkatkan hasil terukur?",
    ],
    steps: [
      [
        "Read the score together with measured coverage.",
        "Baca skor bersama cakupan pengukuran.",
      ],
      [
        "Compare periods and distinguish a changed audience.",
        "Bandingkan periode dan bedakan perubahan audiens.",
      ],
      [
        "Ask for the next program action and its intended outcome.",
        "Tentukan tindakan program berikutnya dan hasil yang dituju.",
      ],
    ],
    mode: "awareness",
  },
};
function SolutionsPage({ slug }: { slug?: string }) {
  const t = useCopy();
  const solution = slug ? solutions[slug] : undefined;
  if (slug && !solution) return <NotFound />;
  return (
    <>
      <PageHero
        eyebrow={solution ? t(...solution.name) : t("SOLUTIONS", "SOLUSI")}
        title={
          solution
            ? t(...solution.title)
            : t(
                "One program. Different responsibilities.",
                "Satu program. Tanggung jawab berbeda.",
              )
        }
        description={
          solution
            ? t(...solution.description)
            : t(
                "Security, HR, GRC, and management ask different questions. AVERIS keeps their work connected, with access controlled by assigned workspace roles.",
                "Tim Keamanan, SDM, GRC, dan manajemen memiliki pertanyaan berbeda. AVERIS menghubungkan pekerjaan mereka dengan akses sesuai peran ruang kerja.",
              )
        }
      >
        <Action to="/request-demo">
          {t("Discuss your workflow", "Diskusikan alur kerja Anda")}
        </Action>
      </PageHero>
      {solution ? (
        <>
          <section className="ps-section ps-light">
            <div className="ps-container ps-feature-grid">
              <div>
                <Heading
                  eyebrow={t(
                    "THE QUESTION TO ANSWER",
                    "PERTANYAAN YANG PERLU DIJAWAB",
                  )}
                  title={t(...solution.question)}
                />
                <ol className="ps-solution-steps">
                  {solution.steps.map((copy, i) => (
                    <li key={copy[0]}>
                      <span>0{i + 1}</span>
                      {t(...copy)}
                    </li>
                  ))}
                </ol>
                <p className="ps-section-note">
                  {t(
                    "Buyer responsibilities do not grant permissions. Your organization assigns the appropriate product role.",
                    "Tanggung jawab pembeli tidak otomatis memberi izin. Organisasi Anda menetapkan peran produk yang sesuai.",
                  )}
                </p>
              </div>
              <Scene mode={solution.mode} compact />
            </div>
          </section>
          <section className="ps-section">
            <div className="ps-container">
              <Action to="/solutions" secondary>
                {t("Explore every perspective", "Jelajahi setiap perspektif")}
              </Action>
            </div>
          </section>
        </>
      ) : (
        <section className="ps-section">
          <div className="ps-container ps-solution-catalog">
            {Object.entries(solutions).map(([key, item], i) => (
              <Link key={key} to={`/solutions/${key}`}>
                <span>
                  0{i + 1} / {t(...item.name)}
                </span>
                <h2>{t(...item.title)}</h2>
                <p>{t(...item.description)}</p>
                <strong>
                  {t("Explore solution", "Jelajahi solusi")}
                  <ArrowRight size={16} />
                </strong>
              </Link>
            ))}
          </div>
        </section>
      )}
      <FinalCTA />
    </>
  );
}

function TourPage() {
  const t = useCopy(),
    locale = useContext(Locale),
    [step, setStep] = useState(0),
    [hotspot, setHotspot] = useState(false),
    [full, setFull] = useState(false),
    dialog = useRef<HTMLDialogElement>(null);
  useEffect(() => {
    if (full) {
      dialog.current?.showModal();
      return () => {
        requestAnimationFrame(() =>
          document
            .querySelector<HTMLButtonElement>(".ps-tour .ps-icon-button")
            ?.focus(),
        );
      };
    }
    dialog.current?.close();
  }, [full]);
  const steps = [
    {
      title: t("Overview", "Ringkasan"),
      text: t(
        "Start with the work that needs attention. Finance needs focused support; 24 employees still have no measured evidence.",
        "Mulai dari pekerjaan yang perlu perhatian. Keuangan membutuhkan dukungan terarah; 24 karyawan belum memiliki bukti pengukuran.",
      ),
      mode: "admin" as SceneMode,
      tip: t(
        "The priority leads to evidence, not an automatic assignment.",
        "Prioritas mengarah pada bukti, bukan penugasan otomatis.",
      ),
    },
    {
      title: t("Awareness & evidence", "Kesadaran & bukti"),
      text: t(
        "Inspect score components and coverage. Select New employees to see how the product treats missing evidence.",
        "Periksa komponen skor dan cakupan. Pilih Karyawan baru untuk melihat penanganan bukti yang belum tersedia.",
      ),
      mode: "awareness" as SceneMode,
      tip: t(
        "Unmeasured is a distinct state. It is never a zero score.",
        "Belum diukur adalah status tersendiri. Bukan skor nol.",
      ),
    },
    {
      title: t("Focused program", "Program terarah"),
      text: t(
        "Choose the audience, learning, and optional simulation. Review the schedule before previewing launch.",
        "Pilih audiens, pembelajaran, dan simulasi opsional. Tinjau jadwal sebelum melihat pratinjau peluncuran.",
      ),
      mode: "program" as SceneMode,
      tip: t(
        "The live workspace launches campaigns only after server validation and role checks.",
        "Ruang kerja meluncurkan kampanye setelah validasi server dan pemeriksaan peran.",
      ),
    },
    {
      title: t("Employee learning", "Pembelajaran karyawan"),
      text: t(
        "Move through a short scenario and answer the knowledge check. The employee experience focuses on the next useful action.",
        "Ikuti skenario singkat dan jawab uji pengetahuan. Pengalaman karyawan berfokus pada tindakan berikutnya yang berguna.",
      ),
      mode: "employee" as SceneMode,
      tip: t(
        "In the real product, grading and certificate eligibility are decided by the server.",
        "Pada produk asli, penilaian dan kelayakan sertifikat ditentukan server.",
      ),
    },
    {
      title: t("Outcome & evidence", "Hasil & bukti"),
      text: t(
        "Compare the result, inspect the reporting scope, and keep coverage visible. A change in score needs an explanation.",
        "Bandingkan hasil, periksa cakupan laporan, dan tampilkan cakupan pengukuran. Perubahan skor perlu penjelasan.",
      ),
      mode: "reporting" as SceneMode,
      tip: t(
        "Export formats are generated from authorized workspace data, not the public demo.",
        "Format ekspor dibuat dari data ruang kerja yang diizinkan, bukan demo publik.",
      ),
    },
  ];
  const view = (expanded = false) => (
    <div className={`ps-tour-workspace ${expanded ? "is-expanded" : ""}`}>
      <div className="ps-tour-toolbar">
        <span>
          {t("GUIDED TOUR", "TUR TERPANDU")} · {step + 1}/5
        </span>
        <div>
          <button
            className="ps-text-button"
            onClick={() => {
              setStep(0);
              setHotspot(false);
            }}
          >
            <RotateCcw size={15} />
            {t("Restart", "Mulai ulang")}
          </button>
          <button
            className="ps-icon-button"
            aria-label={
              full
                ? t("Exit full screen", "Keluar layar penuh")
                : t("Full screen", "Layar penuh")
            }
            onClick={() => setFull(!full)}
          >
            {full ? <Minimize2 size={18} /> : <Maximize2 size={18} />}
          </button>
        </div>
      </div>
      <ol className="ps-tour-progress">
        {steps.map((item, i) => (
          <li key={item.title}>
            <button
              aria-current={i === step ? "step" : undefined}
              onClick={() => {
                setStep(i);
                setHotspot(false);
              }}
            >
              <span>{i < step ? <Check size={14} /> : i + 1}</span>
              {item.title}
            </button>
          </li>
        ))}
      </ol>
      <div className="ps-tour-layout">
        <div className="ps-tour-copy">
          <span className="ps-kicker">
            {t("STEP", "LANGKAH")} 0{step + 1}
          </span>
          <h2>{steps[step].title}</h2>
          <p>{steps[step].text}</p>
          <button
            className="ps-hotspot"
            aria-expanded={hotspot}
            onClick={() => setHotspot(!hotspot)}
          >
            <span>{step + 1}</span>
            {t("Explain this detail", "Jelaskan detail ini")}
          </button>
          {hotspot && (
            <p className="ps-hotspot-note" role="status">
              {steps[step].tip}
            </p>
          )}
          <div className="ps-tour-actions">
            <button
              className="ps-button ps-button-secondary"
              disabled={step === 0}
              onClick={() => {
                setStep(step - 1);
                setHotspot(false);
              }}
            >
              <ChevronLeft size={16} />
              {t("Back", "Kembali")}
            </button>
            <button
              className="ps-button ps-button-primary"
              onClick={() => {
                setStep(step === 4 ? 0 : step + 1);
                setHotspot(false);
              }}
            >
              {step === 4
                ? t("Restart tour", "Ulangi tur")
                : t("Continue", "Lanjutkan")}
              <ArrowRight size={16} />
            </button>
          </div>
          <Link
            className="ps-text-button"
            to="/demo"
            onClick={() => setFull(false)}
          >
            {t("Skip to the self-service demo", "Lewati ke demo mandiri")}
            <ArrowUpRight size={14} />
          </Link>
        </div>
        <ProductScene
          key={step}
          locale={locale}
          controlledMode={steps[step].mode}
          compact
          onModeChange={(mode) => {
            const index = steps.findIndex((item) => item.mode === mode);
            if (index >= 0) setStep(index);
          }}
        />
      </div>
    </div>
  );
  return (
    <>
      <PageHero
        eyebrow={t("INTERACTIVE TOUR", "TUR INTERAKTIF")}
        title={t(
          "Follow one signal all the way to improvement.",
          "Ikuti satu sinyal hingga peningkatan.",
        )}
        description={t(
          "Five steps through a fictional Acme Indonesia program. Open the explanations, try the controls, and explore at your own pace.",
          "Lima langkah melalui program fiktif Acme Indonesia. Buka penjelasan, coba kontrolnya, dan jelajahi sesuai kecepatan Anda.",
        )}
      />
      <section className="ps-section ps-tour">
        <div className="ps-container">{!full && view()}</div>
      </section>
      <dialog
        ref={dialog}
        className="ps-tour-dialog"
        aria-label={t("Full-screen product tour", "Tur produk layar penuh")}
        onCancel={() => setFull(false)}
      >
        {full && view(true)}
      </dialog>
      <FinalCTA />
    </>
  );
}
function DemoPage() {
  const t = useCopy(),
    locale = useContext(Locale),
    [mode, setMode] = useState<SceneMode>("admin");
  const demos: [SceneMode, string, string][] = [
    ["admin", "Admin demo", "Demo admin"],
    ["employee", "Employee demo", "Demo karyawan"],
    ["program", "Program demo", "Demo program"],
    ["awareness", "Awareness demo", "Demo kesadaran"],
    ["reporting", "Reporting demo", "Demo pelaporan"],
  ];
  return (
    <>
      <PageHero
        eyebrow={t("SELF-SERVICE DEMO", "DEMO MANDIRI")}
        title={t(
          "Get a feel for the work. Try it yourself.",
          "Rasakan alur kerjanya. Coba sendiri.",
        )}
        description={t(
          "Explore five perspectives using one fictional organization. Select an audience, complete a lesson, inspect evidence, or preview a report. No sign-in required.",
          "Jelajahi lima perspektif menggunakan satu organisasi fiktif. Pilih audiens, selesaikan pelajaran, periksa bukti, atau pratinjau laporan. Tanpa harus masuk.",
        )}
      />
      <section className="ps-section ps-demo">
        <div className="ps-container">
          <div
            className="ps-demo-tabs"
            role="group"
            aria-label={t("Choose a demo", "Pilih demo")}
          >
            {demos.map(([value, en, id]) => (
              <button
                key={value}
                aria-pressed={mode === value}
                onClick={() => setMode(value)}
              >
                {t(en, id)}
              </button>
            ))}
          </div>
          <ProductScene
            locale={locale}
            controlledMode={mode}
            onModeChange={setMode}
          />
          <div className="ps-demo-help">
            <ShieldCheck size={18} />
            <p>
              {t(
                "This demo runs locally in your browser. It does not send messages, create assignments, issue certificates, or access employee data.",
                "Demo berjalan lokal di peramban. Tidak mengirim pesan, membuat tugas, menerbitkan sertifikat, atau mengakses data karyawan.",
              )}
            </p>
            <Link to="/tour">
              {t("Prefer a guided tour?", "Ingin tur terpandu?")}
              <ArrowRight size={15} />
            </Link>
          </div>
        </div>
      </section>
      <FinalCTA />
    </>
  );
}

function InquiryForm({
  kind = "demo",
}: {
  kind?: "demo" | "contact" | "pricing";
}) {
  const t = useCopy(),
    [busy, setBusy] = useState(false),
    [reference, setReference] = useState(""),
    [error, setError] = useState("");
  async function submit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setBusy(true);
    setError("");
    const data = new FormData(event.currentTarget);
    try {
      const response = await fetch("/api/public/inquiries", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          kind,
          name: data.get("name"),
          email: data.get("email"),
          company: data.get("company"),
          size: data.get("size"),
          message: data.get("message"),
          consent: data.get("consent") === "on",
          website: data.get("website") || "",
        }),
      });
      const result = await response.json();
      if (!response.ok)
        throw new Error(
          response.status === 429
            ? t(
                "Too many requests. Please try again in an hour.",
                "Terlalu banyak permintaan. Coba lagi dalam satu jam.",
              )
            : t(
                "Your request could not be saved. Please try again.",
                "Permintaan tidak dapat disimpan. Silakan coba lagi.",
              ),
        );
      setReference(result.reference);
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : t(
              "Connection failed. Please try again.",
              "Koneksi gagal. Silakan coba lagi.",
            ),
      );
    } finally {
      setBusy(false);
    }
  }
  if (reference)
    return (
      <div className="ps-form-success" role="status">
        <CircleCheck size={35} />
        <h2>{t("Request received.", "Permintaan diterima.")}</h2>
        <p>
          {t("Your reference:", "Referensi Anda:")} <strong>{reference}</strong>
        </p>
        <p>
          {t(
            "The AVERIS team will review your request. A meeting has not yet been scheduled.",
            "Tim AVERIS akan meninjau permintaan Anda. Pertemuan belum dijadwalkan.",
          )}
        </p>
        <Action to="/demo">
          {t("Explore while you wait", "Jelajahi sambil menunggu")}
        </Action>
      </div>
    );
  return (
    <form className="ps-inquiry-form" onSubmit={submit}>
      <div className="ps-form-grid">
        <label>
          {t("Your name", "Nama Anda")}
          <input
            name="name"
            required
            minLength={2}
            maxLength={100}
            autoComplete="name"
          />
        </label>
        <label>
          {t("Work email", "Email kerja")}
          <input
            name="email"
            type="email"
            required
            maxLength={254}
            autoComplete="email"
          />
        </label>
      </div>
      <div className="ps-form-grid">
        <label>
          {t("Organization", "Organisasi")}
          <input
            name="company"
            required
            minLength={2}
            maxLength={160}
            autoComplete="organization"
          />
        </label>
        <label>
          {t("Team size", "Jumlah karyawan")}
          <select name="size" required defaultValue="">
            <option value="" disabled>
              {t("Select team size", "Pilih jumlah karyawan")}
            </option>
            {["1–50", "51–200", "201–1,000", "1,001–5,000", "5,001+"].map(
              (size) => (
                <option key={size}>{size}</option>
              ),
            )}
          </select>
        </label>
      </div>
      <label>
        {kind === "contact"
          ? t("How can we help?", "Apa yang dapat kami bantu?")
          : t(
              "What would you like to improve? (optional)",
              "Apa yang ingin Anda tingkatkan? (opsional)",
            )}
        <textarea
          name="message"
          rows={4}
          maxLength={2000}
          placeholder={t(
            "Share your workflow or question. Avoid sensitive employee information.",
            "Ceritakan alur kerja atau pertanyaan Anda. Hindari informasi sensitif karyawan.",
          )}
        />
      </label>
      <label className="ps-honeypot" aria-hidden="true">
        Website
        <input name="website" tabIndex={-1} autoComplete="off" />
      </label>
      <label className="ps-consent">
        <input name="consent" type="checkbox" required />
        <span>
          {t(
            "I agree to share these details so AVERIS can respond.",
            "Saya setuju membagikan informasi ini agar AVERIS dapat merespons.",
          )}{" "}
          <Link to="/privacy">{t("Privacy details", "Informasi privasi")}</Link>
        </span>
      </label>
      {error && (
        <p className="ps-error" role="alert">
          {error}
        </p>
      )}
      <button className="ps-button ps-button-primary" disabled={busy}>
        {busy
          ? t("Sending request…", "Mengirim permintaan…")
          : kind === "contact"
            ? t("Contact support", "Hubungi dukungan")
            : kind === "pricing"
              ? t("Talk to sales", "Hubungi penjualan")
              : t("Request a demo", "Minta demo")}
        <ArrowRight size={16} />
      </button>
      <small>
        {t(
          "Your details are used to respond to this request. Inquiry records are retained for up to 90 days.",
          "Informasi Anda digunakan untuk merespons permintaan ini. Catatan permintaan disimpan hingga 90 hari.",
        )}
      </small>
    </form>
  );
}
function RequestDemoPage() {
  const t = useCopy();
  return (
    <>
      <PageHero
        eyebrow={t("REQUEST A DEMO", "MINTA DEMO")}
        title={t(
          "Bring your program. We will walk through the work.",
          "Ceritakan program Anda. Kita telusuri alur kerjanya.",
        )}
        description={t(
          "See how your team could measure awareness, run focused learning, and explain outcomes. Tell us what you need to evaluate.",
          "Lihat cara tim Anda mengukur kesadaran, menjalankan pembelajaran terarah, dan menjelaskan hasil. Ceritakan yang perlu Anda evaluasi.",
        )}
      />
      <section className="ps-section ps-request">
        <div className="ps-container ps-request-grid">
          <div>
            <Heading
              eyebrow={t("WHAT YOU WILL SEE", "YANG AKAN ANDA LIHAT")}
              title={t(
                "A demo shaped around your questions.",
                "Demo sesuai pertanyaan Anda.",
              )}
            />
            <ol className="ps-solution-steps">
              {[
                [
                  "Your awareness score and its evidence",
                  "Skor kesadaran dan bukti pendukung",
                ],
                [
                  "A program from audience to follow-up",
                  "Program dari audiens hingga tindak lanjut",
                ],
                [
                  "The employee learning experience",
                  "Pengalaman pembelajaran karyawan",
                ],
                [
                  "Reports, identity, and deployment requirements",
                  "Laporan, identitas, dan kebutuhan penerapan",
                ],
              ].map(([en, id], i) => (
                <li key={en}>
                  <span>0{i + 1}</span>
                  {t(en, id)}
                </li>
              ))}
            </ol>
            <div className="ps-request-alternative">
              <p>
                {t(
                  "Want to look around first?",
                  "Ingin melihat-lihat terlebih dahulu?",
                )}
              </p>
              <Action secondary>
                {t("Open the self-service demo", "Buka demo mandiri")}
              </Action>
            </div>
          </div>
          <div className="ps-form-panel">
            <InquiryForm />
          </div>
        </div>
      </section>
    </>
  );
}

const controls: [string, string, string, string][] = [
  [
    "Tenant scope & roles",
    "Cakupan organisasi & peran",
    "Workspace data is scoped by organization. Server-side role checks control access to administrative, reporting, and employee operations.",
    "Data ruang kerja dibatasi menurut organisasi. Pemeriksaan peran pada server mengontrol akses operasi administratif, pelaporan, dan karyawan.",
  ],
  [
    "Sessions & MFA",
    "Sesi & MFA",
    "Authentication uses server-managed sessions and secure cookie settings in production. Authenticator-based MFA adds account verification; session controls allow access to be reviewed.",
    "Autentikasi menggunakan sesi yang dikelola server dan pengaturan kuki aman pada produksi. MFA berbasis autentikator menambah verifikasi akun; kontrol sesi memungkinkan peninjauan akses.",
  ],
  [
    "Optional OIDC",
    "OIDC opsional",
    "OIDC sign-in requires deployment configuration for a specific organization. The flow validates state and nonce and uses PKCE. Directory provisioning is a separate capability.",
    "Masuk OIDC memerlukan konfigurasi penerapan untuk organisasi tertentu. Alur memvalidasi state dan nonce serta menggunakan PKCE. Provisi direktori merupakan kemampuan terpisah.",
  ],
  [
    "Server-owned results",
    "Hasil dikelola server",
    "Quiz grading, awareness calculation, campaign lifecycle, and certificate issuance are enforced by the server. Published course revisions retain their original content.",
    "Penilaian kuis, penghitungan kesadaran, siklus kampanye, dan penerbitan sertifikat ditegakkan server. Revisi kursus yang diterbitkan mempertahankan konten aslinya.",
  ],
  [
    "Safe simulation",
    "Simulasi aman",
    "Simulation tokens are hashed and event recording is validated and idempotent. Safe simulations do not collect real credentials. Telemetry avoids storing raw IP addresses in simulation events.",
    "Token simulasi di-hash dan pencatatan peristiwa divalidasi serta idempoten. Simulasi aman tidak mengumpulkan kredensial asli. Telemetri tidak menyimpan alamat IP mentah dalam peristiwa simulasi.",
  ],
  [
    "Evidence, audit & privacy",
    "Bukti, audit & privasi",
    "Administrative actions retain tenant-scoped audit records. Employee views are limited to permitted records, and phishing review notes remain administrator-only.",
    "Tindakan administratif menyimpan catatan audit menurut organisasi. Tampilan karyawan dibatasi pada catatan yang diizinkan, dan catatan tinjauan phishing hanya untuk administrator.",
  ],
];
function SecurityPage() {
  const t = useCopy();
  return (
    <>
      <PageHero
        eyebrow={t("SECURITY & TRUST", "KEAMANAN & KEPERCAYAAN")}
        title={t(
          "Clear controls. Reviewable boundaries.",
          "Kontrol jelas. Batas akses yang dapat ditinjau.",
        )}
        description={t(
          "Understand how AVERIS protects access, preserves evidence, and keeps sensitive decisions on the server. These are product controls, not certification claims.",
          "Pahami cara AVERIS melindungi akses, mempertahankan bukti, dan menjaga keputusan sensitif pada server. Ini kontrol produk, bukan klaim sertifikasi.",
        )}
      >
        <Action to="/request-demo">
          {t("Discuss security requirements", "Diskusikan kebutuhan keamanan")}
        </Action>
        <Action to="/docs/identity-security" secondary>
          {t("Read security documentation", "Baca dokumentasi keamanan")}
        </Action>
      </PageHero>
      <section className="ps-section">
        <div className="ps-container ps-security-layout">
          <aside>
            <LockKeyhole size={38} />
            <h2>
              {t(
                "Protect the person behind the evidence.",
                "Lindungi orang di balik bukti.",
              )}
            </h2>
            <p>
              {t(
                "Access, measurement, and retention need deliberate boundaries. Review deployment settings with your organization before production use.",
                "Akses, pengukuran, dan retensi memerlukan batasan terencana. Tinjau konfigurasi penerapan dengan organisasi Anda sebelum penggunaan produksi.",
              )}
            </p>
          </aside>
          <div className="ps-control-list">
            {controls.map(([en, id, body, bodyId], i) => (
              <article key={en}>
                <span>0{i + 1}</span>
                <h2>{t(en, id)}</h2>
                <p>{t(body, bodyId)}</p>
              </article>
            ))}
          </div>
        </div>
      </section>
      <section className="ps-section ps-light">
        <div className="ps-container ps-split">
          <Heading
            eyebrow={t("DUE DILIGENCE", "UJI TUNTAS")}
            title={t(
              "Start with the control, then verify the deployment.",
              "Mulai dari kontrol, lalu verifikasi penerapannya.",
            )}
            text={t(
              "Hosting, backup operations, retention policy, and external identity configuration depend on the deployment. Ask for the details that apply to your environment. No SOC 2 or ISO certification is represented here.",
              "Hosting, operasi pencadangan, kebijakan retensi, dan konfigurasi identitas eksternal bergantung pada penerapan. Minta detail sesuai lingkungan Anda. Tidak ada klaim sertifikasi SOC 2 atau ISO di sini.",
            )}
          />
          <Action to="/support" secondary>
            {t("Contact the team", "Hubungi tim")}
          </Action>
        </div>
      </section>
    </>
  );
}
function IntegrationsPage() {
  const t = useCopy();
  const rows = [
    {
      name: "SMTP",
      status: t("Setup required", "Perlu konfigurasi"),
      desc: t(
        "Email transport for assignments, notifications, and recovery. A deployment administrator supplies SMTP configuration and reviews delivery health.",
        "Transport email untuk tugas, notifikasi, dan pemulihan. Administrator penerapan menyediakan konfigurasi SMTP dan meninjau kesehatan pengiriman.",
      ),
      note: t(
        "When deployment configuration is complete",
        "Jika konfigurasi penerapan lengkap",
      ),
      href: "/docs/identity-security",
    },
    {
      name: "OIDC / SSO",
      status: t("Setup required", "Perlu konfigurasi"),
      desc: t(
        "Optional organization sign-in through a configured OIDC provider. Requires issuer, client, and organization configuration.",
        "Masuk organisasi opsional melalui penyedia OIDC yang dikonfigurasi. Memerlukan konfigurasi issuer, klien, dan organisasi.",
      ),
      note: t(
        "Optional; requires identity provider setup",
        "Opsional; memerlukan konfigurasi penyedia identitas",
      ),
      href: "/tutorials/configure-sso",
    },
  ];
  return (
    <>
      <PageHero
        eyebrow={t("INTEGRATIONS", "INTEGRASI")}
        title={t(
          "Connect what is supported. See what is planned.",
          "Hubungkan yang didukung. Lihat yang direncanakan.",
        )}
        description={t(
          "SMTP and optional OIDC form the current integration foundation. This public page describes implementation availability; it does not show the connection status of your workspace.",
          "SMTP dan OIDC opsional menjadi dasar integrasi saat ini. Halaman publik ini menjelaskan ketersediaan implementasi; bukan status koneksi ruang kerja Anda.",
        )}
      />
      <section className="ps-section">
        <div className="ps-container">
          <Heading
            eyebrow={t("CURRENT FOUNDATION", "DASAR SAAT INI")}
            title={t(
              "Configuration belongs to your deployment.",
              "Konfigurasi sesuai penerapan Anda.",
            )}
          />
          <div className="ps-integration-list">
            {rows.map((row) => (
              <article key={row.name}>
                <div>
                  <span className="ps-status">{row.status}</span>
                  <h2>{row.name}</h2>
                  <small>{row.note}</small>
                </div>
                <p>{row.desc}</p>
                <Link className="ps-text-button" to={row.href}>
                  {t("Setup guidance", "Panduan konfigurasi")}
                  <ArrowRight size={15} />
                </Link>
              </article>
            ))}
          </div>
          <h2 className="ps-subheading">
            {t("Planned connections", "Koneksi yang direncanakan")}
          </h2>
          <div className="ps-planned-integrations">
            {[
              "Microsoft 365",
              "Google Workspace",
              "SCIM",
              "Microsoft Teams",
              "Outbound SIEM / webhooks",
            ].map((name) => (
              <div key={name}>
                <strong>{name}</strong>
                <span>{t("Coming Soon", "Segera Hadir")}</span>
                <small>
                  {t(
                    "Not implemented · no committed date",
                    "Belum diterapkan · belum ada tanggal pasti",
                  )}
                </small>
              </div>
            ))}
          </div>
          <p className="ps-section-note">
            {t(
              "Active means a live connection has been verified in the workspace. Beta means an implemented preview. No planned connector is shown as connected or beta here.",
              "Aktif berarti koneksi langsung telah diverifikasi dalam ruang kerja. Beta berarti pratinjau yang sudah diterapkan. Tidak ada konektor rencana yang ditampilkan terhubung atau beta di sini.",
            )}
          </p>
        </div>
      </section>
      <FinalCTA />
    </>
  );
}
function PricingPage() {
  const t = useCopy();
  const comparisons = [
    [
      t("People and audiences", "Karyawan dan audiens"),
      t(
        "Employee count, departments, and groups",
        "Jumlah karyawan, departemen, dan grup",
      ),
    ],
    [
      t("Program scope", "Cakupan program"),
      t(
        "Learning, assessment, and optional simulation workflows",
        "Alur pembelajaran, asesmen, dan simulasi opsional",
      ),
    ],
    [
      t("Reporting needs", "Kebutuhan pelaporan"),
      t(
        "Executive, campaign, employee, and compliance evidence",
        "Eksekutif, kampanye, karyawan, dan bukti kepatuhan",
      ),
    ],
    [
      t("Identity and deployment", "Identitas dan penerapan"),
      t(
        "OIDC configuration, email delivery, and operational requirements",
        "Konfigurasi OIDC, pengiriman email, dan kebutuhan operasional",
      ),
    ],
  ];
  return (
    <>
      <PageHero
        eyebrow={t("PRICING", "HARGA")}
        title={t(
          "Scope the program. Get a clear proposal.",
          "Tentukan cakupan program. Dapatkan penawaran jelas.",
        )}
        description={t(
          "Public prices and fixed plan tiers have not been finalized. We will confirm your audience, program requirements, and deployment needs before providing a proposal.",
          "Harga publik dan tingkat paket belum ditetapkan. Kami mengonfirmasi audiens, kebutuhan program, dan penerapan sebelum memberikan penawaran.",
        )}
      >
        <Action to="/request-demo">
          {t("Talk to sales", "Hubungi penjualan")}
        </Action>
      </PageHero>
      <section className="ps-section">
        <div className="ps-container ps-pricing-layout">
          <div className="ps-pricing-outline">
            <span className="ps-kicker">
              {t("THE PLATFORM FOUNDATION", "DASAR PLATFORM")}
            </span>
            <h2>AVERIS</h2>
            <p>
              {t(
                "A connected security-awareness workspace.",
                "Ruang kerja kesadaran keamanan terhubung.",
              )}
            </p>
            <ul className="ps-check-list">
              {[
                t(
                  "People and campaign management",
                  "Pengelolaan karyawan dan kampanye",
                ),
                t(
                  "Published learning and assessments",
                  "Pembelajaran terbit dan asesmen",
                ),
                t(
                  "Awareness with measured coverage",
                  "Kesadaran dengan cakupan terukur",
                ),
                t(
                  "Safe simulations and reporting",
                  "Simulasi aman dan pelaporan",
                ),
                t(
                  "Evidence, certificates, and access controls",
                  "Bukti, sertifikat, dan kontrol akses",
                ),
              ].map((item) => (
                <li key={item}>
                  <Check size={17} />
                  {item}
                </li>
              ))}
            </ul>
            <small>
              {t(
                "Final commercial scope is confirmed in your proposal.",
                "Cakupan komersial akhir dikonfirmasi dalam penawaran Anda.",
              )}
            </small>
          </div>
          <div>
            <Heading
              eyebrow={t(
                "WHAT SHAPES YOUR PROPOSAL",
                "YANG MENENTUKAN PENAWARAN",
              )}
              title={t(
                "Start with the work you need to run.",
                "Mulai dari pekerjaan yang perlu dijalankan.",
              )}
            />
            <div className="ps-pricing-factors">
              {comparisons.map(([name, desc], i) => (
                <div key={name}>
                  <span>0{i + 1}</span>
                  <strong>{name}</strong>
                  <p>{desc}</p>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>
      <section className="ps-section ps-light">
        <div className="ps-container ps-split">
          <Heading
            eyebrow={t("EVALUATE FIRST", "EVALUASI TERLEBIH DAHULU")}
            title={t(
              "Explore the product before the pricing conversation.",
              "Jelajahi produk sebelum membahas harga.",
            )}
            text={t(
              "Try the public demo and review the security controls. Bring the requirements that will make the proposal useful.",
              "Coba demo publik dan tinjau kontrol keamanan. Sampaikan kebutuhan agar penawarannya sesuai.",
            )}
          />
          <Action />
        </div>
      </section>
    </>
  );
}
function ComparePage() {
  const t = useCopy();
  const rows = [
    [
      "Measurement",
      "Pengukuran",
      "Manually assembled",
      "Disusun manual",
      "Often course-specific",
      "Sering per kursus",
      "Score with evidence coverage",
      "Skor dengan cakupan bukti",
    ],
    [
      "Baseline",
      "Asesmen awal",
      "Separate form or spreadsheet",
      "Formulir atau lembar terpisah",
      "Depends on the approach",
      "Bergantung pendekatan",
      "Campaign baseline and follow-up",
      "Asesmen awal dan lanjutan kampanye",
    ],
    [
      "Learning",
      "Pembelajaran",
      "Links and manual reminders",
      "Tautan dan pengingat manual",
      "Course assignment and completion",
      "Penugasan dan penyelesaian kursus",
      "Published revisions, player, quiz",
      "Revisi terbit, pembelajaran, kuis",
    ],
    [
      "Simulation",
      "Simulasi",
      "Separate process",
      "Proses terpisah",
      "May require a separate tool",
      "Dapat memerlukan alat terpisah",
      "Safe campaign-linked simulation",
      "Simulasi aman terkait kampanye",
    ],
    [
      "Evidence",
      "Bukti",
      "Manual reconciliation",
      "Rekonsiliasi manual",
      "Usually completion records",
      "Umumnya catatan penyelesaian",
      "Assignments, outcomes, certificates, audit",
      "Tugas, hasil, sertifikat, audit",
    ],
    [
      "Reporting",
      "Pelaporan",
      "Custom spreadsheet views",
      "Tampilan lembar khusus",
      "Completion and course reports",
      "Laporan penyelesaian dan kursus",
      "Four report categories, server CSV/PDF",
      "Empat kategori laporan, CSV/PDF server",
    ],
    [
      "Workflow",
      "Alur kerja",
      "People coordinate across files",
      "Koordinasi melalui banyak berkas",
      "Training-centered process",
      "Proses berpusat pada pelatihan",
      "Measure → Understand → Act → Prove",
      "Ukur → Pahami → Bertindak → Buktikan",
    ],
  ];
  return (
    <>
      <PageHero
        eyebrow={t("COMPARE APPROACHES", "BANDINGKAN PENDEKATAN")}
        title={t(
          "Choose the workflow that answers your questions.",
          "Pilih alur yang menjawab pertanyaan Anda.",
        )}
        description={t(
          "A practical comparison of common approaches, not a ranking of vendors. Capabilities in individual training products vary; verify the tools you are evaluating.",
          "Perbandingan praktis pendekatan umum, bukan peringkat vendor. Kemampuan produk pelatihan berbeda; verifikasi alat yang Anda evaluasi.",
        )}
      />
      <section className="ps-section">
        <div className="ps-container">
          <div
            className="ps-table-scroll"
            tabIndex={0}
            role="region"
            aria-label={t("Approach comparison", "Perbandingan pendekatan")}
          >
            <table className="ps-compare-table">
              <thead>
                <tr>
                  <th scope="col">{t("Dimension", "Dimensi")}</th>
                  <th scope="col">
                    {t("Spreadsheet / manual", "Lembar kerja / manual")}
                  </th>
                  <th scope="col">
                    {t("Traditional training", "Pelatihan tradisional")}
                  </th>
                  <th scope="col">AVERIS</th>
                </tr>
              </thead>
              <tbody>
                {rows.map((row) => (
                  <tr key={row[0]}>
                    <th scope="row">{t(row[0], row[1])}</th>
                    <td>{t(row[2], row[3])}</td>
                    <td>{t(row[4], row[5])}</td>
                    <td>{t(row[6], row[7])}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <p className="ps-section-note">
            {t(
              "Spreadsheets can work for a small, simple program. A connected platform becomes useful when the cost of reconciling audiences, evidence, and follow-up grows.",
              "Lembar kerja dapat mencukupi program kecil dan sederhana. Platform terhubung membantu ketika rekonsiliasi audiens, bukti, dan tindak lanjut semakin rumit.",
            )}
          </p>
        </div>
      </section>
      <FinalCTA />
    </>
  );
}
function AboutPage() {
  const t = useCopy();
  return (
    <>
      <PageHero
        eyebrow={t("ABOUT AVERIS", "TENTANG AVERIS")}
        title={t(
          "Make security awareness easier to explain—and improve.",
          "Buat kesadaran keamanan lebih mudah dijelaskan—dan ditingkatkan.",
        )}
        description={t(
          "AVERIS by VulneraX connects people, learning, measurement, and evidence. The product is built around a practical question: did the program help people make safer decisions?",
          "AVERIS by VulneraX menghubungkan karyawan, pembelajaran, pengukuran, dan bukti. Produk dibangun dari pertanyaan praktis: apakah program membantu karyawan mengambil keputusan lebih aman?",
        )}
      />
      <section className="ps-section">
        <div className="ps-container ps-about-manifesto">
          <span className="ps-kicker">
            {t("OUR PRODUCT PRINCIPLES", "PRINSIP PRODUK KAMI")}
          </span>
          {[
            [
              "Evidence before claims.",
              "Bukti sebelum klaim.",
              "Show the measurement and its limits. A missing result is not a failure or a zero.",
              "Tampilkan pengukuran dan batasannya. Hasil yang belum ada bukan kegagalan atau nol.",
            ],
            [
              "A useful next action.",
              "Tindakan berikutnya yang berguna.",
              "Help administrators focus a program and employees finish the task in front of them.",
              "Bantu administrator memfokuskan program dan karyawan menyelesaikan tugasnya.",
            ],
            [
              "Improvement needs a comparison.",
              "Peningkatan perlu perbandingan.",
              "Keep baseline, follow-up, audience, and coverage visible when explaining outcomes.",
              "Tampilkan asesmen awal, lanjutan, audiens, dan cakupan saat menjelaskan hasil.",
            ],
            [
              "Trust through product depth.",
              "Kepercayaan melalui kedalaman produk.",
              "Let working demonstrations, transparent methodology, and documented controls speak for the product.",
              "Biarkan demo yang berfungsi, metodologi transparan, dan kontrol terdokumentasi menjelaskan produk.",
            ],
          ].map(([en, id, body, bodyId], i) => (
            <article key={en}>
              <span>0{i + 1}</span>
              <div>
                <h2>{t(en, id)}</h2>
                <p>{t(body, bodyId)}</p>
              </div>
            </article>
          ))}
        </div>
      </section>
      <FinalCTA />
    </>
  );
}
function SupportPage() {
  const t = useCopy(),
    locale = useContext(Locale),
    [query, setQuery] = useState("");
  const matches = searchContent(locale)
    .filter((item) =>
      `${item.title} ${item.description}`
        .toLowerCase()
        .includes(query.toLowerCase()),
    )
    .slice(0, 5);
  return (
    <>
      <PageHero
        eyebrow={t("SUPPORT", "DUKUNGAN")}
        title={t(
          "Find the answer. Keep your program moving.",
          "Temukan jawaban. Lanjutkan program Anda.",
        )}
        description={t(
          "Search practical guidance or send the team a question. Include the workflow and the error you saw, without sharing passwords or sensitive employee data.",
          "Cari panduan praktis atau kirim pertanyaan kepada tim. Sertakan alur kerja dan pesan kesalahan tanpa membagikan kata sandi atau data sensitif karyawan.",
        )}
      />
      <section className="ps-section">
        <div className="ps-container ps-support-layout">
          <div>
            <label className="ps-support-search">
              <Search size={19} />
              <input
                value={query}
                onChange={(event) => setQuery(event.target.value)}
                placeholder={t(
                  "Search support guidance",
                  "Cari panduan dukungan",
                )}
                aria-label={t(
                  "Search support guidance",
                  "Cari panduan dukungan",
                )}
              />
            </label>
            <div className="ps-resource-rows">
              {matches.map((item) => (
                <Link key={item.href} to={item.href}>
                  <span>
                    <small>{item.type}</small>
                    <strong>{item.title}</strong>
                  </span>
                  <ArrowRight size={17} />
                </Link>
              ))}
              {!matches.length && (
                <p role="status">
                  {t(
                    "No matches. Try another term or contact the team.",
                    "Tidak ada hasil. Coba kata lain atau hubungi tim.",
                  )}
                </p>
              )}
            </div>
            <h2 className="ps-subheading">
              {t("Common troubleshooting", "Pemecahan masalah umum")}
            </h2>
            <div className="ps-faq">
              {[
                [
                  "I cannot sign in.",
                  "Saya tidak dapat masuk.",
                  "Check the organization sign-in method and your email address. Use the password recovery flow if available. For OIDC, confirm that the account belongs to the configured organization.",
                  "Periksa metode masuk organisasi dan alamat email. Gunakan alur pemulihan kata sandi jika tersedia. Untuk OIDC, pastikan akun milik organisasi yang dikonfigurasi.",
                ],
                [
                  "An assignment email did not arrive.",
                  "Email tugas tidak diterima.",
                  "Check the employee address and spam folder. An administrator can review Delivery Health for SMTP failures. A saved assignment does not guarantee successful email delivery.",
                  "Periksa alamat karyawan dan folder spam. Administrator dapat meninjau Kesehatan Pengiriman untuk kegagalan SMTP. Tugas tersimpan tidak menjamin email berhasil dikirim.",
                ],
                [
                  "A score is Unmeasured.",
                  "Skor berstatus Belum diukur.",
                  "This means eligible evidence has not been recorded. Check whether the employee has completed an assessment or other measured activity. Do not interpret this as a zero score.",
                  "Artinya bukti yang memenuhi syarat belum dicatat. Periksa apakah karyawan menyelesaikan asesmen atau aktivitas terukur lain. Jangan tafsirkan sebagai skor nol.",
                ],
                [
                  "Where can I see system health?",
                  "Di mana saya melihat kesehatan sistem?",
                  "Delivery Health in organization settings describes your deployment’s email delivery. This website does not publish uptime history or claim a monitored public status service.",
                  "Kesehatan Pengiriman pada pengaturan organisasi menjelaskan pengiriman email penerapan Anda. Situs ini tidak menerbitkan riwayat uptime atau mengklaim layanan status publik terpantau.",
                ],
              ].map(([en, id, body, bodyId]) => (
                <details key={en}>
                  <summary>
                    {t(en, id)}
                    <ChevronDown size={16} />
                  </summary>
                  <p>{t(body, bodyId)}</p>
                </details>
              ))}
            </div>
          </div>
          <aside className="ps-form-panel">
            <h2>{t("Contact support", "Hubungi dukungan")}</h2>
            <p>
              {t(
                "Send a question to the AVERIS team.",
                "Kirim pertanyaan ke tim AVERIS.",
              )}
            </p>
            <InquiryForm kind="contact" />
          </aside>
        </div>
      </section>
    </>
  );
}
function LegalPage({ type }: { type: "privacy" | "terms" }) {
  const t = useCopy();
  return (
    <>
      <PageHero
        eyebrow={t("WEBSITE INFORMATION", "INFORMASI SITUS")}
        title={
          type === "privacy"
            ? t(
                "Privacy for this public website.",
                "Privasi untuk situs publik ini.",
              )
            : t(
                "Using the AVERIS public experience.",
                "Menggunakan pengalaman publik AVERIS.",
              )
        }
        description={
          type === "privacy"
            ? t(
                "A plain-language account of the current website’s data handling. Organization workspace policies depend on your deployment and agreement.",
                "Penjelasan sederhana penanganan data situs saat ini. Kebijakan ruang kerja organisasi bergantung pada penerapan dan perjanjian Anda.",
              )
            : t(
                "The public site explains the product and provides controlled demonstrations. Your workspace agreement governs production use.",
                "Situs publik menjelaskan produk dan menyediakan demo terkontrol. Perjanjian ruang kerja mengatur penggunaan produksi.",
              )
        }
      />
      <section className="ps-section">
        <article className="ps-container ps-legal">
          {(type === "privacy"
            ? [
                [
                  "Demo and support requests",
                  "Permintaan demo dan dukungan",
                  "The inquiry form stores your name, email, organization, team size, message, consent, and a reference. These inquiry records are removed after up to 90 days. The form does not schedule a meeting automatically.",
                  "Formulir menyimpan nama, email, organisasi, jumlah karyawan, pesan, persetujuan, dan referensi. Catatan permintaan dihapus setelah paling lama 90 hari. Formulir tidak menjadwalkan pertemuan otomatis.",
                ],
                [
                  "Browser preferences and learning progress",
                  "Preferensi peramban dan progres belajar",
                  "Language preference and public academy progress may be stored locally in your browser. Public product demos use fictional data and do not access your organization’s employee records.",
                  "Preferensi bahasa dan progres akademi publik dapat disimpan lokal di peramban. Demo produk menggunakan data fiktif dan tidak mengakses catatan karyawan organisasi Anda.",
                ],
                [
                  "Questions about your information",
                  "Pertanyaan tentang informasi Anda",
                  "Contact the team through Support and include your inquiry reference when available. Avoid including passwords or sensitive employee information in the request.",
                  "Hubungi tim melalui Dukungan dan sertakan referensi permintaan jika tersedia. Hindari menyertakan kata sandi atau informasi sensitif karyawan.",
                ],
              ]
            : [
                [
                  "Illustrative demonstrations",
                  "Demonstrasi ilustratif",
                  "Acme Indonesia and the public demo records are fictional. Demonstration scores and outcomes do not represent customer results or promised improvements.",
                  "Acme Indonesia dan catatan demo publik bersifat fiktif. Skor dan hasil demonstrasi bukan hasil pelanggan atau janji peningkatan.",
                ],
                [
                  "Product availability",
                  "Ketersediaan produk",
                  "Integration and media availability are labeled on the website. Deployment configuration and commercial scope must be confirmed before relying on a feature for production work.",
                  "Ketersediaan integrasi dan media diberi label pada situs. Konfigurasi penerapan dan cakupan komersial perlu dikonfirmasi sebelum mengandalkan fitur untuk produksi.",
                ],
                [
                  "Educational resources",
                  "Sumber belajar",
                  "Guides and the maturity tool provide practical education. They do not certify compliance, predict an individual’s behavior, or replace your organization’s review of evidence.",
                  "Panduan dan alat kematangan memberikan pendidikan praktis. Bukan sertifikasi kepatuhan, prediksi perilaku individu, atau pengganti tinjauan bukti organisasi.",
                ],
              ]
          ).map(([en, id, body, bodyId]) => (
            <section key={en}>
              <h2>{t(en, id)}</h2>
              <p>{t(body, bodyId)}</p>
            </section>
          ))}
          <Action to="/support" secondary>
            {t("Contact AVERIS", "Hubungi AVERIS")}
          </Action>
        </article>
      </section>
    </>
  );
}

function MaturityTool() {
  const t = useCopy(),
    [answers, setAnswers] = useState<(boolean | null)[]>([
      null,
      null,
      null,
      null,
      null,
    ]);
  const answered = answers.filter((value) => value !== null).length,
    score = answers.filter(Boolean).length;
  const questions = [
    {
      question: t(
        "Do you have a current baseline assessment?",
        "Apakah Anda memiliki asesmen awal terkini?",
      ),
      strength: t(
        "You have a baseline to compare against.",
        "Anda memiliki kondisi awal untuk perbandingan.",
      ),
      gap: t(
        "Establish a baseline for a defined audience before assigning learning.",
        "Tetapkan kondisi awal untuk audiens tertentu sebelum menugaskan pembelajaran.",
      ),
      href: "/programs/assessment-programs",
    },
    {
      question: t(
        "Can you distinguish completion from demonstrated knowledge?",
        "Dapatkah Anda membedakan penyelesaian dari pengetahuan yang dibuktikan?",
      ),
      strength: t(
        "You keep completion and knowledge distinct.",
        "Anda membedakan penyelesaian dan pengetahuan.",
      ),
      gap: t(
        "Add graded knowledge checks and report their denominator separately.",
        "Tambahkan uji pengetahuan dan laporkan dasar hitungnya secara terpisah.",
      ),
      href: "/product/learning",
    },
    {
      question: t(
        "Do you review evidence coverage before deciding on an intervention?",
        "Apakah Anda meninjau cakupan bukti sebelum menentukan intervensi?",
      ),
      strength: t(
        "Your decisions consider evidence coverage.",
        "Keputusan Anda mempertimbangkan cakupan bukti.",
      ),
      gap: t(
        "Record who is measured and which components are available beside each score.",
        "Catat siapa yang diukur dan komponen yang tersedia bersama setiap skor.",
      ),
      href: "/product/awareness",
    },
    {
      question: t(
        "Can employees report suspicious messages and receive a reviewed outcome?",
        "Dapatkah karyawan melaporkan pesan mencurigakan dan menerima hasil tinjauan?",
      ),
      strength: t(
        "You have a reporting and review path.",
        "Anda memiliki alur pelaporan dan tinjauan.",
      ),
      gap: t(
        "Define a reporting channel, reviewer, classification, and closure process.",
        "Tentukan kanal pelaporan, peninjau, klasifikasi, dan proses penutupan.",
      ),
      href: "/product/phishing",
    },
    {
      question: t(
        "Can you compare follow-up results with the same audience’s baseline?",
        "Dapatkah Anda membandingkan hasil lanjutan dengan kondisi awal audiens yang sama?",
      ),
      strength: t(
        "You can examine change after the intervention.",
        "Anda dapat memeriksa perubahan setelah intervensi.",
      ),
      gap: t(
        "Plan a follow-up assessment and retain the audience and period with the result.",
        "Rencanakan asesmen lanjutan dan simpan audiens serta periode bersama hasilnya.",
      ),
      href: "/product/reporting",
    },
  ];
  return (
    <>
      <PageHero
        eyebrow={t(
          "FREE AWARENESS MATURITY TOOL",
          "ALAT KEMATANGAN KESADARAN GRATIS",
        )}
        title={t(
          "Find the next useful step for your program.",
          "Temukan langkah berguna berikutnya untuk program Anda.",
        )}
        description={t(
          "Five questions about measurement, evidence, and follow-up. Get strengths, gaps, and next steps without sharing an email. This is a self-assessment, not a validated risk score.",
          "Lima pertanyaan tentang pengukuran, bukti, dan tindak lanjut. Dapatkan kekuatan, kesenjangan, dan langkah berikutnya tanpa email. Ini penilaian mandiri, bukan skor risiko tervalidasi.",
        )}
      />
      <section className="ps-section ps-light">
        <div className="ps-container ps-tool-grid">
          <div className="ps-tool-questions">
            {questions.map((item, index) => (
              <fieldset className="ps-tool-question" key={item.question}>
                <legend>
                  <span>0{index + 1}</span>
                  {item.question}
                </legend>
                <div>
                  {[
                    [true, t("Yes", "Ya")],
                    [false, t("Not yet", "Belum")],
                  ].map(([value, label]) => (
                    <button
                      key={label as string}
                      aria-pressed={answers[index] === value}
                      onClick={() =>
                        setAnswers((current) =>
                          current.map((answer, i) =>
                            i === index ? (value as boolean) : answer,
                          ),
                        )
                      }
                    >
                      {answers[index] === value && <Check size={15} />}{" "}
                      {label as string}
                    </button>
                  ))}
                </div>
              </fieldset>
            ))}
          </div>
          <aside className="ps-tool-result">
            <span className="ps-kicker">
              {t("YOUR STARTING POINT", "TITIK AWAL ANDA")}
            </span>
            <strong className="ps-tool-count" aria-live="polite">
              {answered}/5
            </strong>
            <progress
              value={answered}
              max={5}
              aria-label={t("Questions answered", "Pertanyaan dijawab")}
            />
            <h2>
              {answered < 5
                ? t(
                    "Complete the questions to see your result.",
                    "Selesaikan pertanyaan untuk melihat hasil.",
                  )
                : score >= 4
                  ? t(
                      "A measured program foundation.",
                      "Dasar program yang terukur.",
                    )
                  : score >= 2
                    ? t("A developing program.", "Program yang berkembang.")
                    : t(
                        "Start with the foundations.",
                        "Mulai dengan dasar-dasarnya.",
                      )}
            </h2>
            {answered === 5 ? (
              <>
                <p>
                  {score}{" "}
                  {t(
                    "of 5 practices are in place. This reflects your answers, not an independent audit.",
                    "dari 5 praktik telah diterapkan. Hasil ini berdasarkan jawaban Anda, bukan audit independen.",
                  )}
                </p>
                {score > 0 && (
                  <div>
                    <h3>{t("Strengths", "Kekuatan")}</h3>
                    <ul>
                      {questions
                        .filter((_, i) => answers[i])
                        .map((item) => (
                          <li key={item.question}>{item.strength}</li>
                        ))}
                    </ul>
                  </div>
                )}
                {score < 5 && (
                  <div>
                    <h3>
                      {t(
                        "Recommended next steps",
                        "Langkah berikutnya yang disarankan",
                      )}
                    </h3>
                    <ul>
                      {questions
                        .filter((_, i) => !answers[i])
                        .map((item) => (
                          <li key={item.question}>
                            <Link to={item.href}>
                              {item.gap}
                              <ArrowUpRight size={13} />
                            </Link>
                          </li>
                        ))}
                    </ul>
                  </div>
                )}
                {score === 5 && (
                  <p>
                    {t(
                      "Next: review the quality and consistency of the evidence, then repeat the loop for your weakest measured topic.",
                      "Berikutnya: tinjau kualitas dan konsistensi bukti, lalu ulangi alur untuk topik terukur terlemah.",
                    )}
                  </p>
                )}
                <button
                  className="ps-button ps-button-secondary"
                  onClick={() => setAnswers([null, null, null, null, null])}
                >
                  <RotateCcw size={15} />
                  {t("Start again", "Mulai ulang")}
                </button>
              </>
            ) : (
              <p>
                {t(
                  "Your answers stay in this page. No email or employee information is required.",
                  "Jawaban tetap di halaman ini. Tidak memerlukan email atau informasi karyawan.",
                )}
              </p>
            )}
          </aside>
        </div>
      </section>
    </>
  );
}
function NotFound() {
  const t = useCopy();
  return (
    <PageHero
      eyebrow="404"
      title={t("This page is not available.", "Halaman ini tidak tersedia.")}
      description={t(
        "Explore the platform or search the documentation to find the right next step.",
        "Jelajahi platform atau cari dokumentasi untuk menemukan langkah berikutnya.",
      )}
    >
      <Action to="/">{t("Back to AVERIS", "Kembali ke AVERIS")}</Action>
      <Action to="/docs" secondary>
        {t("Documentation", "Dokumentasi")}
      </Action>
    </PageHero>
  );
}
function PublicBody({ path }: { path: string }) {
  const locale = useContext(Locale);
  if (path === "/") return <HomePage />;
  if (isContentPath(path))
    return <ContentExperience path={path} locale={locale} />;
  if (path === "/platform") return <PlatformPage />;
  if (path === "/how-it-works") return <HowItWorksPage />;
  if (path.startsWith("/product/"))
    return <ProductPage slug={path.split("/")[2]} />;
  if (path === "/programs" || path.startsWith("/programs/"))
    return <ProgramsPage slug={path.split("/")[2]} />;
  if (path === "/solutions" || path.startsWith("/solutions/"))
    return <SolutionsPage slug={path.split("/")[2]} />;
  if (path === "/tour") return <TourPage />;
  if (path === "/demo") return <DemoPage />;
  if (path === "/request-demo") return <RequestDemoPage />;
  if (path === "/security") return <SecurityPage />;
  if (path === "/integrations") return <IntegrationsPage />;
  if (path === "/pricing") return <PricingPage />;
  if (path === "/compare") return <ComparePage />;
  if (path === "/about") return <AboutPage />;
  if (path === "/support") return <SupportPage />;
  if (path === "/privacy" || path === "/terms")
    return <LegalPage type={path.slice(1) as "privacy" | "terms"} />;
  if (path === "/tools/awareness-maturity") return <MaturityTool />;
  return <NotFound />;
}
export default function PublicSite({
  path,
  initialLocale = "en",
}: {
  path: string;
  initialLocale?: PublicLocale;
}) {
  const [locale, setLocale] = useState<PublicLocale>(initialLocale);
  useEffect(() => {
    const requested = new URLSearchParams(window.location.search).get("lang");
    let stored: string | null = null;
    try {
      stored = localStorage.getItem("averis-language");
    } catch {
      /* The public site works with storage disabled. */
    }
    const selected =
      requested === "id" || requested === "en"
        ? requested
        : stored === "id" || stored === "en"
          ? stored
          : initialLocale;
    setLocale(selected);
    document.documentElement.lang = selected;
  }, [initialLocale]);
  useEffect(() => {
    document.documentElement.lang = locale;
  }, [locale]);
  const changeLocale = (next: PublicLocale) => {
    setLocale(next);
    try {
      localStorage.setItem("averis-language", next);
    } catch {
      /* Preference persistence is optional. */
    }
    const url = new URL(window.location.href);
    url.searchParams.set("lang", next);
    window.history.replaceState(null, "", url);
  };
  return (
    <Locale.Provider value={locale}>
      <div className="ps-site" lang={locale}>
        <a className="ps-skip-link" href="#public-main">
          {locale === "en" ? "Skip to content" : "Lewati ke konten"}
        </a>
        <PublicMetadata />
        <PublicNav onLocale={changeLocale} />
        <main id="public-main" tabIndex={-1}>
          <PublicBody key={path} path={path} />
        </main>
        <PublicFooter />
      </div>
    </Locale.Provider>
  );
}
