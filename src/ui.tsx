import { GlobalCreate } from "./intelligence/shared";
import {
  Suspense,
  createContext,
  cloneElement,
  isValidElement,
  useId,
  type ReactElement,
  useCallback,
  useContext,
  useEffect,
  useRef,
  useState,
  type ReactNode,
} from "react";
import { Link, NavLink, Outlet, useLocation } from "react-router-dom";
import {
  ArrowUpRight,
  Award,
  BookOpen,
  Bell,
  ChartNoAxesCombined,
  ChevronRight,
  CircleHelp,
  FileText,
  Flag,
  LayoutDashboard,
  LogOut,
  Menu,
  Moon,
  Settings,
  ShieldCheck,
  Sun,
  Target,
  Users,
  X,
} from "lucide-react";
import { apiRequest, ApiError, downloadFromApi } from "./api";
import { useAuth } from "./auth";
import "./workspace-experience.css";

type Locale = "en" | "id";
const LocaleContext = createContext<{
  locale: Locale;
  setLocale: (l: Locale) => void;
}>({ locale: "id", setLocale: () => {} });
export function LocaleProvider({ children }: { children: ReactNode }) {
  const [locale, set] = useState<Locale>(
    localStorage.getItem("averis-language") === "en" ? "en" : "id",
  );
  const setLocale = (l: Locale) => {
    localStorage.setItem("averis-language", l);
    set(l);
  };
  useEffect(() => {
    document.documentElement.lang = locale;
  }, [locale]);
  return (
    <LocaleContext.Provider value={{ locale, setLocale }}>
      {children}
    </LocaleContext.Provider>
  );
}
export function useLocale() {
  const context = useContext(LocaleContext);
  return {
    ...context,
    t: (en: string, id: string) => (context.locale === "id" ? id : en),
  };
}
export function LanguageSwitch() {
  const { locale, setLocale } = useLocale();
  return (
    <div className="language" aria-label="Language">
      <button aria-pressed={locale === "id"} onClick={() => setLocale("id")}>
        ID
      </button>
      <button aria-pressed={locale === "en"} onClick={() => setLocale("en")}>
        EN
      </button>
    </div>
  );
}
export function ThemeSwitch() {
  const { t } = useLocale();
  const [dark, setDark] = useState(
    () => localStorage.getItem("averis-theme") === "dark",
  );
  useEffect(() => {
    document.documentElement.dataset.theme = dark ? "dark" : "light";
    localStorage.setItem("averis-theme", dark ? "dark" : "light");
  }, [dark]);
  return (
    <button
      className="icon-button"
      type="button"
      onClick={() => setDark((value) => !value)}
      aria-label={
        dark
          ? t("Use light theme", "Gunakan tema terang")
          : t("Use dark theme", "Gunakan tema gelap")
      }
      title={
        dark ? t("Light theme", "Tema terang") : t("Dark theme", "Tema gelap")
      }
    >
      {dark ? <Sun size={17} /> : <Moon size={17} />}
    </button>
  );
}
export function Brand() {
  return (
    <Link className="brand-word" to="/" aria-label="AVERIS home">
      <svg viewBox="0 0 32 32" aria-hidden="true">
        <path
          d="M5 26 16 5l7 14M9 20h12M23 23h5M21 27h9"
          fill="none"
          stroke="currentColor"
          strokeWidth="2.8"
        />
      </svg>
      <span>
        AVERIS<small>by VulneraX</small>
      </span>
    </Link>
  );
}
export const endpoint = (path: string) => `/api/workspace${path}`;
export async function mutate<T = unknown>(
  path: string,
  body?: unknown,
  method = "POST",
): Promise<T> {
  return apiRequest<T>(endpoint(path), {
    method,
    ...(body !== undefined ? { body: JSON.stringify(body) } : {}),
  });
}
export function useData<T = any>(path: string) {
  const [data, setData] = useState<T | null>(null);
  const [error, setError] = useState<unknown>(null);
  const [loading, setLoading] = useState(true);
  const [counter, setCounter] = useState(0);
  const reload = useCallback(() => setCounter((x) => x + 1), []);
  useEffect(() => {
    let live = true;
    setLoading(true);
    setError(null);
    apiRequest<T>(path.startsWith("/api/") ? path : endpoint(path))
      .then((d) => {
        if (live) setData(d);
      })
      .catch((e) => {
        if (live) setError(e);
      })
      .finally(() => {
        if (live) setLoading(false);
      });
    return () => {
      live = false;
    };
  }, [path, counter]);
  return { data, error, loading, reload, setData };
}
const errors: Record<string, [string, string]> = {
  VALIDATION_ERROR: [
    "Check the required fields and their format.",
    "Periksa kolom wajib dan format isian.",
  ],
  COURSE_INCOMPLETE: [
    "Complete the course fields before saving.",
    "Lengkapi isian materi sebelum menyimpan.",
  ],
  NETWORK_ERROR: [
    "Unable to connect. Check your connection and retry.",
    "Tidak dapat terhubung. Periksa koneksi lalu coba lagi.",
  ],
  INVALID_CREDENTIALS: [
    "Email or password was not accepted.",
    "Email atau kata sandi tidak sesuai.",
  ],
  MFA_REQUIRED: [
    "Enter a valid authenticator code.",
    "Masukkan kode autentikator yang berlaku.",
  ],
  FORBIDDEN: [
    "Your role does not allow this action.",
    "Peran Anda tidak memiliki izin untuk tindakan ini.",
  ],
  EMAIL_EXISTS: [
    "This email is already registered.",
    "Email ini sudah terdaftar.",
  ],
  VERSION_CONFLICT: [
    "This record changed. Reload before saving.",
    "Data telah berubah. Muat ulang sebelum menyimpan.",
  ],
  BASELINE_REQUIRED: [
    "Complete the initial assessment first.",
    "Selesaikan asesmen awal terlebih dahulu.",
  ],
  PROGRAM_INACTIVE: [
    "This learning program is not active.",
    "Program pembelajaran ini tidak aktif.",
  ],
  ATTEMPTS_EXHAUSTED: [
    "All attempts have been used. Ask your administrator for new learning.",
    "Batas percobaan tercapai. Hubungi administrator untuk pembelajaran baru.",
  ],
  RETRY_NOT_READY: [
    "Review the material and return after the waiting period.",
    "Tinjau materi dan kembali setelah waktu tunggu berakhir.",
  ],
  RESET_EXPIRED: [
    "This link has expired. Request a new link.",
    "Tautan kedaluwarsa. Minta tautan baru.",
  ],
  INCOMPLETE_CAMPAIGN: [
    "Select employees, learning and a future deadline before launch.",
    "Pilih karyawan, materi, dan tenggat mendatang sebelum meluncurkan.",
  ],
  CERTIFICATE_REVOKED: [
    "This certificate has been revoked.",
    "Sertifikat ini telah dicabut.",
  ],
  RATE_LIMITED: [
    "Please wait before trying again.",
    "Tunggu sebentar sebelum mencoba lagi.",
  ],
  INCOMPLETE_ANSWERS: [
    "Answer every question before submitting.",
    "Jawab semua pertanyaan sebelum mengirim.",
  ],
  INVALID_CURRENT_PASSWORD: [
    "Current password was not accepted.",
    "Kata sandi saat ini tidak sesuai.",
  ],
  MFA_INVALID: [
    "Code was not accepted. Check your device time.",
    "Kode tidak sesuai. Periksa waktu perangkat Anda.",
  ],
  INVALID_DATES: [
    "Deadline must be after the start date.",
    "Tenggat harus setelah tanggal mulai.",
  ],
};
export function ErrorNotice({
  error,
  retry,
}: {
  error: unknown;
  retry?: () => void;
}) {
  const { t } = useLocale();
  if (!error) return null;
  const code = error instanceof ApiError ? error.code : "";
  const copy = errors[code];
  return (
    <div className="notice error" role="alert">
      <span>
        {copy
          ? t(...copy)
          : t(
              "This action could not be completed. Check the details and try again.",
              "Tindakan belum dapat diselesaikan. Periksa data lalu coba lagi.",
            )}
      </span>
      {retry && <button onClick={retry}>{t("Try again", "Coba lagi")}</button>}
    </div>
  );
}
export function Skeleton() {
  const { t } = useLocale();
  return (
    <div
      className="skeleton-page"
      role="status"
      aria-label={t("Loading", "Memuat")}
    >
      <i />
      <i />
      <div>
        <i />
        <i />
        <i />
      </div>
      <i />
      <i />
    </div>
  );
}
export function Loading({
  resource,
  children,
}: {
  resource: { loading: boolean; error: unknown; reload: () => void };
  children: ReactNode;
}) {
  return resource.loading ? (
    <Skeleton />
  ) : resource.error ? (
    <ErrorNotice error={resource.error} retry={resource.reload} />
  ) : (
    <>{children}</>
  );
}
export function Empty({
  title,
  description,
  action,
}: {
  title: string;
  description: string;
  action?: ReactNode;
}) {
  return (
    <div className="empty">
      <CircleHelp size={24} />
      <h3>{title}</h3>
      <p>{description}</p>
      {action}
    </div>
  );
}
export function PageTitle({
  eyebrow,
  title,
  description,
  actions,
}: {
  eyebrow?: string;
  title: string;
  description?: string;
  actions?: ReactNode;
}) {
  return (
    <header className="page-title">
      <div>
        {eyebrow && <span className="eyebrow">{eyebrow}</span>}
        <h1>{title}</h1>
        {description && <p>{description}</p>}
      </div>
      {actions && <div className="actions">{actions}</div>}
    </header>
  );
}
export function Button({
  variant = "primary",
  className = "",
  ...props
}: React.ButtonHTMLAttributes<HTMLButtonElement> & {
  variant?: "primary" | "secondary" | "quiet" | "danger";
}) {
  return <button {...props} className={`btn ${variant} ${className}`} />;
}
export function ActionLink({
  to,
  children,
  secondary = false,
}: {
  to: string;
  children: ReactNode;
  secondary?: boolean;
}) {
  return (
    <Link className={`btn ${secondary ? "secondary" : "primary"}`} to={to}>
      {children}
      <ChevronRight size={15} />
    </Link>
  );
}
export function Metric({
  label,
  value,
  note,
}: {
  label: string;
  value: ReactNode;
  note?: string;
}) {
  return (
    <div className="metric">
      <span>{label}</span>
      <strong>{value ?? "—"}</strong>
      {note && <small>{note}</small>}
    </div>
  );
}
export function Progress({
  value,
  label,
}: {
  value: number | null;
  label?: string;
}) {
  const { t } = useLocale();
  const measured = value !== null && value !== undefined;
  return (
    <div className="progress-line">
      {measured ? (
        <progress
          value={Math.max(0, Math.min(100, value))}
          max={100}
          aria-label={label || t("Progress", "Progres")}
        />
      ) : (
        <span className="progress-unmeasured" aria-hidden="true" />
      )}
      <span>{measured ? `${value}%` : t("Unmeasured", "Belum terukur")}</span>
    </div>
  );
}
const states: Record<string, string> = {
  Draft: "Draf",
  Scheduled: "Terjadwal",
  Active: "Aktif",
  Completed: "Selesai",
  Archived: "Diarsipkan",
  Cancelled: "Dibatalkan",
  Published: "Terbit",
  Foundation: "Dasar",
  Intermediate: "Menengah",
  Advanced: "Lanjutan",
  High: "Tinggi",
  Medium: "Sedang",
  Low: "Rendah",
  Unmeasured: "Belum terukur",
  "Not Started": "Belum dimulai",
  "In Progress": "Berlangsung",
  "Quiz Available": "Kuis tersedia",
  Submitted: "Dikirim",
  Reviewing: "Ditinjau",
  "Confirmed Suspicious": "Dikonfirmasi mencurigakan",
  Safe: "Aman",
  Closed: "Ditutup",
  Valid: "Valid",
  Revoked: "Dicabut",
  "Not Found": "Tidak ditemukan",
  Pending: "Menunggu",
  Sending: "Mengirim",
  Sent: "Terkirim",
  Failed: "Gagal",
  Baseline: "Awal",
  "Follow-up": "Tindak lanjut",
  Article: "Artikel",
  Scenario: "Skenario",
  Checklist: "Daftar periksa",
  "Security tip": "Tips keamanan",
  Email: "Email",
  SMS: "SMS",
  Chat: "Percakapan",
  Other: "Lainnya",
  Suspicious: "Mencurigakan",
};
export function useStatus() {
  const { locale } = useLocale();
  return (s: string) => (locale === "id" ? states[s] || s : s);
}
export function Status({ value }: { value: string }) {
  const label = useStatus();
  return (
    <span
      className={`status status-${value.toLowerCase().replaceAll(" ", "-")}`}
    >
      {label(value)}
    </span>
  );
}
export function useDate() {
  const { locale } = useLocale();
  const { user } = useAuth();
  return (value: string | null | undefined, withTime = false) =>
    value
      ? new Intl.DateTimeFormat(locale === "id" ? "id-ID" : "en-GB", {
          dateStyle: "medium",
          timeZone: user?.organization.timezone || "Asia/Makassar",
          ...(withTime ? { timeStyle: "short" as const } : {}),
        }).format(new Date(value))
      : "—";
}
export function Field({
  label,
  children,
  hint,
}: {
  label: string;
  children: ReactNode;
  hint?: string;
}) {
  const id = useId();
  return (
    <div className="field">
      <label htmlFor={id}>{label}</label>
      {isValidElement(children)
        ? cloneElement(
            children as ReactElement<{
              id: string;
              "aria-describedby"?: string;
            }>,
            { id, "aria-describedby": hint ? `${id}-hint` : undefined },
          )
        : children}
      {hint && <small id={`${id}-hint`}>{hint}</small>}
    </div>
  );
}
export function Tabs({
  tabs,
  value,
  onChange,
}: {
  tabs: Array<[string, string]>;
  value: string;
  onChange: (value: string) => void;
}) {
  return (
    <div className="tabs" role="tablist">
      {tabs.map(([key, label]) => (
        <button
          key={key}
          type="button"
          role="tab"
          aria-selected={key === value}
          tabIndex={key === value ? 0 : -1}
          onKeyDown={(e) => {
            const index = tabs.findIndex(([id]) => id === key);
            const next =
              e.key === "ArrowRight"
                ? (index + 1) % tabs.length
                : e.key === "ArrowLeft"
                  ? (index - 1 + tabs.length) % tabs.length
                  : e.key === "Home"
                    ? 0
                    : e.key === "End"
                      ? tabs.length - 1
                      : null;
            if (next !== null) {
              e.preventDefault();
              onChange(tabs[next][0]);
              (
                e.currentTarget.parentElement?.querySelectorAll("button")[
                  next
                ] as HTMLButtonElement
              )?.focus();
            }
          }}
          onClick={() => onChange(key)}
        >
          {label}
        </button>
      ))}
    </div>
  );
}
export function Dialog({
  title,
  children,
  onClose,
}: {
  title: string;
  children: ReactNode;
  onClose: () => void;
}) {
  const ref = useRef<HTMLDialogElement>(null);
  const { t } = useLocale();
  const titleId = useId();
  useEffect(() => {
    const active = document.activeElement as HTMLElement;
    const d = ref.current;
    d?.showModal();
    return () => {
      d?.close();
      active?.focus();
    };
  }, []);
  return (
    <dialog
      ref={ref}
      className="dialog"
      aria-labelledby={titleId}
      onCancel={onClose}
    >
      <header>
        <h2 id={titleId}>{title}</h2>
        <button
          className="icon-button"
          onClick={onClose}
          aria-label={t("Close", "Tutup")}
        >
          <X size={20} />
        </button>
      </header>
      {children}
    </dialog>
  );
}
export function ConfirmButton({
  children,
  onConfirm,
  title,
  description,
  variant = "secondary",
}: {
  children: ReactNode;
  onConfirm: () => Promise<void>;
  title: string;
  description: string;
  variant?: "secondary" | "danger";
}) {
  const [open, setOpen] = useState(false);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<unknown>(null);
  const { t } = useLocale();
  return (
    <>
      <Button variant={variant} onClick={() => setOpen(true)}>
        {children}
      </Button>
      {open && (
        <Dialog title={title} onClose={() => !busy && setOpen(false)}>
          <p>{description}</p>
          <ErrorNotice error={error} />
          <footer>
            <Button
              variant="secondary"
              disabled={busy}
              onClick={() => setOpen(false)}
            >
              {t("Cancel", "Batal")}
            </Button>
            <Button
              variant={variant}
              disabled={busy}
              onClick={async () => {
                setBusy(true);
                try {
                  await onConfirm();
                  setOpen(false);
                } catch (e) {
                  setError(e);
                } finally {
                  setBusy(false);
                }
              }}
            >
              {busy ? t("Saving…", "Menyimpan…") : t("Confirm", "Konfirmasi")}
            </Button>
          </footer>
        </Dialog>
      )}
    </>
  );
}
export function Download({
  path,
  children,
}: {
  path: string;
  children: ReactNode;
}) {
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<unknown>(null);
  return (
    <>
      <Button
        variant="secondary"
        disabled={busy}
        onClick={async () => {
          setBusy(true);
          setError(null);
          try {
            await downloadFromApi(endpoint(path));
          } catch (e) {
            setError(e);
          } finally {
            setBusy(false);
          }
        }}
      >
        {children}
      </Button>
      <ErrorNotice error={error} />
    </>
  );
}

function Notifications() {
  const { t } = useLocale();
  const date = useDate();
  const r = useData("/notifications");
  const [open, setOpen] = useState(false);
  const [error, setError] = useState<unknown>(null);
  const unread = (r.data?.notifications || []).filter(
    (n: any) => !n.read_at,
  ).length;
  return (
    <>
      <button
        className="icon-button"
        aria-label={`${t("Notifications", "Notifikasi")}${unread ? ` (${unread})` : ""}`}
        onClick={() => {
          r.reload();
          setOpen(true);
        }}
      >
        <Bell size={18} />
        {unread > 0 && <small>{unread}</small>}
      </button>
      {open && (
        <Dialog
          title={t("Notifications", "Notifikasi")}
          onClose={() => setOpen(false)}
        >
          <ErrorNotice error={error} />
          <Loading resource={r}>
            {r.data?.notifications.length ? (
              r.data.notifications.map((n: any) => (
                <div className="row" key={n.id}>
                  <div>
                    <Link
                      className="text-link"
                      to={n.link}
                      onClick={() => {
                        setOpen(false);
                        void mutate(`/notifications/${n.id}/read`, {})
                          .then(r.reload)
                          .catch(setError);
                      }}
                    >
                      {n.title}
                    </Link>
                    <small>{date(n.created_at, true)}</small>
                  </div>
                  {!n.read_at && (
                    <Button
                      variant="secondary"
                      onClick={async () => {
                        try {
                          await mutate(`/notifications/${n.id}/read`, {});
                          r.reload();
                        } catch (e) {
                          setError(e);
                        }
                      }}
                    >
                      {t("Mark read", "Tandai dibaca")}
                    </Button>
                  )}
                </div>
              ))
            ) : (
              <p>
                {t(
                  "No notifications yet. Assigned learning and certificate updates will appear here.",
                  "Belum ada notifikasi. Pembelajaran yang ditugaskan dan pembaruan sertifikat akan muncul di sini.",
                )}
              </p>
            )}
          </Loading>
        </Dialog>
      )}
    </>
  );
}

export function Shell() {
  const { user, logout } = useAuth();
  const { t, setLocale } = useLocale();
  const [open, setOpen] = useState(false);
  const sidebarRef = useRef<HTMLElement>(null);
  const menuRef = useRef<HTMLButtonElement>(null);
  useEffect(() => {
    if (!open) return;
    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    const focusable = () => [
      ...(sidebarRef.current?.querySelectorAll<HTMLElement>(
        "a[href], button:not(:disabled)",
      ) || []),
    ];
    focusable()[0]?.focus();
    const keyboard = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        event.preventDefault();
        setOpen(false);
      }
      if (event.key !== "Tab") return;
      const items = focusable();
      const first = items[0];
      const last = items.at(-1);
      if (event.shiftKey && document.activeElement === first) {
        event.preventDefault();
        last?.focus();
      } else if (!event.shiftKey && document.activeElement === last) {
        event.preventDefault();
        first?.focus();
      }
    };
    document.addEventListener("keydown", keyboard);
    return () => {
      document.body.style.overflow = previousOverflow;
      document.removeEventListener("keydown", keyboard);
      menuRef.current?.focus();
    };
  }, [open]);
  const location = useLocation();
  useEffect(() => setOpen(false), [location.pathname]);
  useEffect(() => {
    if (user?.organization.locale && !localStorage.getItem("averis-language"))
      setLocale(user.organization.locale);
  }, [user?.organization.locale]);
  if (!user) return null;
  const employee = user.role === "employee";
  const canManageSecurity = ["super_admin", "admin"].includes(user.role);
  const navigation = employee
    ? [
        ["/employee", t("Home", "Beranda"), LayoutDashboard],
        ["/employee/learning", t("Learning", "Pembelajaran"), BookOpen],
        [
          "/employee/awareness",
          t("My Awareness", "Awareness Saya"),
          ChartNoAxesCombined,
        ],
        ["/employee/certificates", t("Certificates", "Sertifikat"), Award],
      ]
    : [
        ["/admin", t("Overview", "Ringkasan"), LayoutDashboard],
        ["/admin/employees", t("People", "Karyawan"), Users],
        ["/admin/campaigns", t("Campaigns", "Kampanye"), Target],
        ["/admin/learning", t("Learning", "Pembelajaran"), BookOpen],
        ["/admin/awareness", t("Awareness", "Awareness"), ChartNoAxesCombined],
        ["/admin/reports", t("Reports", "Laporan"), FileText],
      ];
  const current =
    navigation.find(
      ([path]) =>
        String(path) !== (employee ? "/employee" : "/admin") &&
        location.pathname.startsWith(String(path)),
    ) || navigation[0];
  return (
    <div className="workspace">
      <a href="#main-content" className="skip-link">
        {t("Skip to content", "Lewati ke konten")}
      </a>
      {open && (
        <button
          className="scrim"
          onClick={() => setOpen(false)}
          aria-label={t("Close navigation", "Tutup navigasi")}
        />
      )}
      <aside
        ref={sidebarRef}
        role={open ? "dialog" : undefined}
        aria-modal={open || undefined}
        aria-label={
          open ? t("Workspace navigation", "Navigasi ruang kerja") : undefined
        }
        className={`sidebar ${open ? "open" : ""}`}
      >
        <Brand />
        <div className="tenant">
          <span>{user.organization.name.slice(0, 2).toUpperCase()}</span>
          <div>
            <strong>{user.organization.name}</strong>
            <small>
              {employee
                ? t("Employee workspace", "Ruang karyawan")
                : t("Security workspace", "Ruang keamanan")}
            </small>
          </div>
        </div>
        <nav aria-label={t("Primary navigation", "Navigasi utama")}>
          {navigation.map(([path, label, Icon]) => {
            const Symbol = Icon as typeof Users;
            return (
              <NavLink
                key={String(path)}
                to={String(path)}
                end={String(path) === "/admin" || String(path) === "/employee"}
              >
                <Symbol size={18} />
                {String(label)}
              </NavLink>
            );
          })}
        </nav>
        <div className="sidebar-secondary">
          {!employee && canManageSecurity && (
            <NavLink to="/admin/integrations">
              <ShieldCheck size={17} />
              {t("Integrations", "Integrasi")}
            </NavLink>
          )}
          <NavLink to={employee ? "/employee/account" : "/admin/settings"}>
            <Settings size={17} />
            {employee
              ? t("My account", "Akun saya")
              : t("Settings", "Pengaturan")}
          </NavLink>
        </div>
        <div className="sidebar-user">
          <span className="avatar">
            {user.name
              .split(" ")
              .map((w) => w[0])
              .slice(0, 2)
              .join("")}
          </span>
          <div>
            <strong>{user.name}</strong>
            <small>{user.role.replace("_", " ")}</small>
          </div>
          <button
            className="icon-button"
            onClick={() => void logout()}
            aria-label={t("Sign out", "Keluar")}
          >
            <LogOut size={17} />
          </button>
        </div>
      </aside>
      <div className="workspace-body" inert={open}>
        <header className="topbar">
          <button
            ref={menuRef}
            className="icon-button mobile-menu"
            onClick={() => setOpen(!open)}
            aria-expanded={open}
            aria-label={t("Open navigation", "Buka navigasi")}
          >
            <Menu size={20} />
          </button>
          <span>
            {user.organization.name}
            <ChevronRight size={13} />
            {String(current[1])}
          </span>
          <div>
            {!employee && user.role !== "manager" && <GlobalCreate />}
            <Notifications />
            <LanguageSwitch />
            <ThemeSwitch />
            {employee && (
              <Link
                className="icon-button"
                aria-label={t("My account", "Akun saya")}
                to="/employee/account"
              >
                <Users size={17} />
              </Link>
            )}
            {employee ? (
              <Link className="report-action" to="/employee/report-phishing">
                <Flag size={15} />
                {t("Report phishing", "Laporkan phishing")}
              </Link>
            ) : (
              <Link className="report-action" to="/admin/reports/inbox">
                <Flag size={15} />
                {t("Security inbox", "Kotak masuk keamanan")}
              </Link>
            )}
          </div>
        </header>
        <main id="main-content" className="content" tabIndex={-1}>
          <Suspense fallback={<Skeleton />}>
            <Outlet />
          </Suspense>
        </main>
        <footer className="workspace-footer">
          <span>
            AVERIS ·{" "}
            {t(
              "Measure → Understand → Act → Prove improvement",
              "Ukur → Pahami → Bertindak → Buktikan peningkatan",
            )}
          </span>
          <Link to="/verify">
            {t("Verify certificate", "Verifikasi sertifikat")}
            <ArrowUpRight size={12} />
          </Link>
        </footer>
      </div>
    </div>
  );
}
