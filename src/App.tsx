import { lazy, Suspense, useState } from "react";
import { Link, Navigate, Outlet, Route, Routes } from "react-router-dom";
import { ArrowRight } from "lucide-react";
import { useAuth } from "./auth";
import { apiRequest } from "./api";
import {
  Brand,
  Button,
  Empty,
  ErrorNotice,
  Field,
  LanguageSwitch,
  Shell,
  Skeleton,
  useLocale,
  useData,
} from "./ui";

const Overview = lazy(() =>
  import("./WorkspacePages").then((m) => ({ default: m.Overview })),
);
const People = lazy(() =>
  import("./WorkspacePages").then((m) => ({ default: m.People })),
);
const EmployeeDetail = lazy(() =>
  import("./WorkspacePages").then((m) => ({ default: m.EmployeeDetail })),
);
const Campaigns = lazy(() =>
  import("./WorkspacePages").then((m) => ({ default: m.Campaigns })),
);
const CampaignBuilder = lazy(() =>
  import("./WorkspacePages").then((m) => ({ default: m.CampaignBuilder })),
);
const CampaignDetail = lazy(() =>
  import("./WorkspacePages").then((m) => ({ default: m.CampaignDetail })),
);
const Awareness = lazy(() =>
  import("./WorkspacePages").then((m) => ({ default: m.Awareness })),
);
const Reports = lazy(() =>
  import("./WorkspacePages").then((m) => ({ default: m.Reports })),
);
const Methodology = lazy(() =>
  import("./WorkspacePages").then((m) => ({ default: m.Methodology })),
);
const LearningLibrary = lazy(() =>
  import("./LearningPages").then((m) => ({ default: m.LearningLibrary })),
);
const CourseBuilder = lazy(() =>
  import("./LearningPages").then((m) => ({ default: m.CourseBuilder })),
);
const EmployeeHome = lazy(() =>
  import("./LearningPages").then((m) => ({ default: m.EmployeeHome })),
);
const MyLearning = lazy(() =>
  import("./LearningPages").then((m) => ({ default: m.MyLearning })),
);
const MyAwareness = lazy(() =>
  import("./LearningPages").then((m) => ({ default: m.MyAwareness })),
);
const LearningPlayer = lazy(() =>
  import("./LearningPages").then((m) => ({ default: m.LearningPlayer })),
);
const Quiz = lazy(() =>
  import("./LearningPages").then((m) => ({ default: m.Quiz })),
);
const QuizResult = lazy(() =>
  import("./LearningPages").then((m) => ({ default: m.QuizResult })),
);
const Assessment = lazy(() =>
  import("./LearningPages").then((m) => ({ default: m.Assessment })),
);
const Certificates = lazy(() =>
  import("./LearningPages").then((m) => ({ default: m.Certificates })),
);
const Account = lazy(() =>
  import("./ControlPages").then((m) => ({ default: m.Account })),
);
const Settings = lazy(() =>
  import("./ControlPages").then((m) => ({ default: m.Settings })),
);
const Integrations = lazy(() =>
  import("./ControlPages").then((m) => ({ default: m.Integrations })),
);
const PhishingReports = lazy(() =>
  import("./ControlPages").then((m) => ({ default: m.PhishingReports })),
);
const VerifyCertificate = lazy(() =>
  import("./ControlPages").then((m) => ({ default: m.VerifyCertificate })),
);
const Simulation = lazy(() =>
  import("./ControlPages").then((m) => ({ default: m.Simulation })),
);
const RiskMethodology = lazy(() =>
  import("./intelligence/Methodology").then((m) => ({
    default: m.RiskMethodology,
  })),
);
const IntelligenceOverview = lazy(() =>
  import("./intelligence/Overview").then((m) => ({
    default: m.IntelligenceOverview,
  })),
);
const HumanRisk = lazy(() =>
  import("./intelligence/HumanRisk").then((m) => ({ default: m.HumanRisk })),
);
const HumanRiskProfile = lazy(() =>
  import("./intelligence/HumanRisk").then((m) => ({
    default: m.HumanRiskProfile,
  })),
);
const Cohorts = lazy(() =>
  import("./intelligence/Programs").then((m) => ({ default: m.Cohorts })),
);
const ThreatFeed = lazy(() =>
  import("./intelligence/Programs").then((m) => ({ default: m.ThreatFeed })),
);
const Autopilot = lazy(() =>
  import("./intelligence/Programs").then((m) => ({ default: m.Autopilot })),
);
const IntelligenceAudit = lazy(() =>
  import("./intelligence/Programs").then((m) => ({
    default: m.IntelligenceAudit,
  })),
);
const Studios = lazy(() =>
  import("./intelligence/Studios").then((m) => ({ default: m.Studios })),
);
const StudioEditor = lazy(() =>
  import("./intelligence/Studios").then((m) => ({ default: m.StudioEditor })),
);
const Simulations = lazy(() =>
  import("./intelligence/Studios").then((m) => ({ default: m.Simulations })),
);
const EmployeeHome2 = lazy(() =>
  import("./intelligence/EmployeeSecurity").then((m) => ({
    default: m.EmployeeHome2,
  })),
);
const SecurityProfile = lazy(() =>
  import("./intelligence/EmployeeSecurity").then((m) => ({
    default: m.SecurityProfile,
  })),
);
const PracticeChallenge = lazy(() =>
  import("./intelligence/EmployeeSecurity").then((m) => ({
    default: m.PracticeChallenge,
  })),
);
const OutcomeReports = lazy(() =>
  import("./intelligence/Reports").then((m) => ({ default: m.OutcomeReports })),
);
const Connections = lazy(() =>
  import("./intelligence/Connections").then((m) => ({
    default: m.Connections,
  })),
);

function AuthLayout({ children }: { children: React.ReactNode }) {
  const { t } = useLocale();
  return (
    <div className="auth-layout">
      <section className="auth-story">
        <Brand />
        <div>
          <span className="eyebrow">
            {t(
              "SECURITY AWARENESS & HUMAN RISK",
              "KESADARAN KEAMANAN & RISIKO MANUSIA",
            )}
          </span>
          <h1>
            {t("Measure awareness.", "Ukur kesadaran.")}
            <br />
            <span>
              {t("Understand risk.", "Pahami risiko.")}
              <br />
              {t("Prove improvement.", "Buktikan peningkatan.")}
            </span>
          </h1>
          <p>
            {t(
              "Understand security risk through people, learning and measurable progress.",
              "Pahami risiko keamanan melalui karyawan, pembelajaran, dan progres terukur.",
            )}
          </p>
        </div>
        <footer>© {new Date().getFullYear()} VulneraX</footer>
      </section>
      <main className="auth-form-wrap">
        <LanguageSwitch />
        {children}
      </main>
    </div>
  );
}
function Login() {
  const options = useData("/api/auth/options");
  const { user, loading, login, devLogin } = useAuth();
  const { t } = useLocale();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [remember, setRemember] = useState(false);
  const [otp, setOtp] = useState("");
  const [error, setError] = useState<unknown>(null);
  const [busy, setBusy] = useState(false);
  const [devBusy, setDevBusy] = useState<string | null>(null);
  if (loading) return <Skeleton />;
  if (user)
    return (
      <Navigate
        to={
          user.mustChangePassword
            ? "/change-password"
            : user.role === "employee"
              ? "/employee"
              : "/admin"
        }
        replace
      />
    );
  return (
    <AuthLayout>
      <form
        className="auth-form"
        onSubmit={async (e) => {
          e.preventDefault();
          setBusy(true);
          setError(null);
          try {
            await login(email, password, remember, otp || undefined);
          } catch (e) {
            setError(e);
          } finally {
            setBusy(false);
          }
        }}
      >
        <h1>{t("Sign in to AVERIS", "Masuk ke AVERIS")}</h1>
        <p>
          {t(
            "Use the account provided by your organization.",
            "Gunakan akun yang diberikan organisasi Anda.",
          )}
        </p>
        <Field label={t("Work email", "Email kerja")}>
          <input
            required
            type="email"
            autoComplete="username"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
          />
        </Field>
        <Field label={t("Password", "Kata sandi")}>
          <input
            required
            type="password"
            autoComplete="current-password"
            minLength={8}
            value={password}
            onChange={(e) => setPassword(e.target.value)}
          />
        </Field>
        <details>
          <summary>
            {t("Use an authenticator code", "Gunakan kode autentikator")}
          </summary>
          <Field label={t("Authenticator code", "Kode autentikator")}>
            <input
              inputMode="numeric"
              autoComplete="one-time-code"
              maxLength={6}
              value={otp}
              onChange={(e) => setOtp(e.target.value)}
            />
          </Field>
        </details>
        <div className="auth-options">
          <label className="check">
            <input
              type="checkbox"
              checked={remember}
              onChange={(e) => setRemember(e.target.checked)}
            />
            {t("Remember me", "Ingat saya")}
          </label>
          <Link className="text-link" to="/forgot-password">
            {t("Forgot password?", "Lupa kata sandi?")}
          </Link>
        </div>
        <ErrorNotice error={error} />
        {new URLSearchParams(window.location.search).has("sso") && (
          <p role="alert">
            {t(
              "Single sign-on could not complete. Check that your account is active and your identity provider satisfies your MFA policy, or sign in with your password.",
              "SSO belum berhasil. Pastikan akun aktif dan penyedia identitas memenuhi kebijakan MFA, atau masuk dengan kata sandi.",
            )}
          </p>
        )}
        <Button disabled={busy}>
          {busy ? t("Signing in…", "Masuk…") : t("Sign in", "Masuk")}
          <ArrowRight size={15} />
        </Button>
        {options.data?.ssoConfigured && (
          <a className="button button-secondary" href="/api/auth/sso/start">
            {t(
              "Continue with organization SSO",
              "Lanjutkan dengan SSO organisasi",
            )}
          </a>
        )}
        {import.meta.env.DEV && (
          <div className="dev-login-panel">
            <strong>Development quick login</strong>
            <small>Temporary access for local testing only.</small>
            <div className="dev-login-grid">
              {(
                [
                  ["superadmin", "Superadmin"],
                  ["admin", "Admin"],
                  ["manager", "Manager"],
                  ["user", "User / Employee"],
                ] as const
              ).map(([role, label]) => (
                <button
                  type="button"
                  key={role}
                  disabled={Boolean(devBusy)}
                  onClick={async () => {
                    setDevBusy(role);
                    setError(null);
                    try {
                      await devLogin(role);
                    } catch (e) {
                      setError(e);
                    } finally {
                      setDevBusy(null);
                    }
                  }}
                >
                  {devBusy === role ? "Opening…" : label}
                </button>
              ))}
            </div>
          </div>
        )}
        <div className="section">
          <Link className="text-link" to="/verify">
            {t("Verify a certificate", "Verifikasi sertifikat")} →
          </Link>
        </div>
      </form>
    </AuthLayout>
  );
}
function PasswordReset({ reset = false }: { reset?: boolean }) {
  const { t } = useLocale();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [otp, setOtp] = useState("");
  const [token] = useState(() => window.location.hash.slice(1));
  const [error, setError] = useState<unknown>(null);
  const [done, setDone] = useState(false);
  const [busy, setBusy] = useState(false);
  return (
    <AuthLayout>
      <form
        className="auth-form"
        onSubmit={async (e) => {
          e.preventDefault();
          setBusy(true);
          try {
            await apiRequest(
              reset ? "/api/auth/reset-password" : "/api/auth/forgot-password",
              {
                method: "POST",
                body: JSON.stringify(
                  reset
                    ? { token, password, otp: otp || undefined }
                    : { email },
                ),
              },
            );
            setDone(true);
            if (reset) history.replaceState(null, "", location.pathname);
          } catch (e) {
            setError(e);
          } finally {
            setBusy(false);
          }
        }}
      >
        <h1>
          {reset
            ? t("Set your password", "Atur kata sandi")
            : t("Reset password", "Reset kata sandi")}
        </h1>
        <p>
          {reset
            ? t(
                "Choose a strong password for your organization account.",
                "Pilih kata sandi kuat untuk akun organisasi Anda.",
              )
            : t(
                "We will send a secure reset link if an active account matches this email.",
                "Kami akan mengirim tautan reset aman jika ada akun aktif dengan email ini.",
              )}
        </p>
        {done ? (
          <div className="notice" role="status">
            {reset
              ? t(
                  "Password saved. Sign in with your new password.",
                  "Kata sandi tersimpan. Masuk dengan kata sandi baru.",
                )
              : t(
                  "If the account exists, a reset email has been queued. Check your inbox or contact your administrator.",
                  "Jika akun tersedia, email reset masuk antrean. Periksa kotak masuk atau hubungi administrator.",
                )}
          </div>
        ) : (
          <>
            {reset ? (
              <>
                <Field
                  label={t("New password", "Kata sandi baru")}
                  hint={t(
                    "12+ characters: uppercase, lowercase, number and symbol.",
                    "12+ karakter: huruf besar, kecil, angka, dan simbol.",
                  )}
                >
                  <input
                    type="password"
                    required
                    minLength={12}
                    autoComplete="new-password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                  />
                </Field>
                <Field
                  label={t(
                    "Authenticator code, if enabled",
                    "Kode autentikator, jika aktif",
                  )}
                >
                  <input
                    inputMode="numeric"
                    maxLength={6}
                    value={otp}
                    onChange={(e) => setOtp(e.target.value)}
                  />
                </Field>
              </>
            ) : (
              <Field label={t("Work email", "Email kerja")}>
                <input
                  type="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                />
              </Field>
            )}
            <ErrorNotice error={error} />
            <Button disabled={busy}>
              {reset
                ? t("Save password", "Simpan kata sandi")
                : t("Send reset link", "Kirim tautan reset")}
            </Button>
          </>
        )}
        <div className="section">
          <Link className="text-link" to="/login">
            ← {t("Back to sign in", "Kembali ke halaman masuk")}
          </Link>
        </div>
      </form>
    </AuthLayout>
  );
}
function ChangePassword() {
  const { user, refresh } = useAuth();
  const { t } = useLocale();
  const [currentPassword, setCurrent] = useState("");
  const [newPassword, setNew] = useState("");
  const [error, setError] = useState<unknown>(null);
  const [busy, setBusy] = useState(false);
  if (!user) return <Navigate to="/login" replace />;
  if (!user.mustChangePassword)
    return (
      <Navigate
        to={user.role === "employee" ? "/employee" : "/admin"}
        replace
      />
    );
  return (
    <AuthLayout>
      <form
        className="auth-form"
        onSubmit={async (e) => {
          e.preventDefault();
          setBusy(true);
          try {
            await apiRequest("/api/auth/change-password", {
              method: "POST",
              body: JSON.stringify({ currentPassword, newPassword }),
            });
            await refresh();
          } catch (e) {
            setError(e);
          } finally {
            setBusy(false);
          }
        }}
      >
        <h1>{t("Secure your account", "Amankan akun Anda")}</h1>
        <p>
          {t(
            "Replace your temporary password before continuing.",
            "Ganti kata sandi sementara sebelum melanjutkan.",
          )}
        </p>
        <Field label={t("Temporary password", "Kata sandi sementara")}>
          <input
            type="password"
            required
            autoComplete="current-password"
            value={currentPassword}
            onChange={(e) => setCurrent(e.target.value)}
          />
        </Field>
        <Field
          label={t("New password", "Kata sandi baru")}
          hint={t(
            "12+ characters with uppercase, lowercase, number and symbol.",
            "12+ karakter dengan huruf besar, kecil, angka, dan simbol.",
          )}
        >
          <input
            type="password"
            required
            minLength={12}
            autoComplete="new-password"
            value={newPassword}
            onChange={(e) => setNew(e.target.value)}
          />
        </Field>
        <ErrorNotice error={error} />
        <Button disabled={busy}>
          {t("Save and continue", "Simpan dan lanjutkan")}
        </Button>
      </form>
    </AuthLayout>
  );
}
function Protected({ employee = false }: { employee?: boolean }) {
  const { user, loading } = useAuth();
  if (loading) return <Skeleton />;
  if (!user) return <Navigate to="/login" replace />;
  if (user.mustChangePassword)
    return <Navigate to="/change-password" replace />;
  if ((user.role === "employee") !== employee)
    return (
      <Navigate
        to={user.role === "employee" ? "/employee" : "/admin"}
        replace
      />
    );
  return <Outlet />;
}
function SecurityAdmin({ children }: { children: React.ReactNode }) {
  const { user } = useAuth();
  return user?.role === "manager" ? (
    <Empty
      title="Security administrator access required"
      description="Use Overview and Reports to review organization trends and program evidence."
      action={
        <Link className="btn primary" to="/admin">
          Open Overview
        </Link>
      }
    />
  ) : (
    children
  );
}
function NotFound() {
  const { t } = useLocale();
  return (
    <div className="public-wrap">
      <Brand />
      <Empty
        title={t("Page not found", "Halaman tidak ditemukan")}
        description={t(
          "Open your workspace to continue.",
          "Buka ruang kerja Anda untuk melanjutkan.",
        )}
        action={
          <Link className="btn primary" to="/login">
            {t("Go to workspace", "Buka ruang kerja")}
          </Link>
        }
      />
    </div>
  );
}
export default function App() {
  return (
    <Suspense fallback={<Skeleton />}>
      <Routes>
        <Route path="/login" element={<Login />} />
        <Route path="/forgot-password" element={<PasswordReset />} />
        <Route path="/reset-password" element={<PasswordReset reset />} />
        <Route path="/change-password" element={<ChangePassword />} />
        <Route path="/risk-methodology" element={<RiskMethodology />} />
        <Route path="/verify/:id?" element={<VerifyCertificate />} />
        <Route path="/simulation/:token" element={<Simulation />} />
        <Route
          path="/methodology"
          element={
            <div className="public-wrap">
              <Methodology />
            </div>
          }
        />
        <Route element={<Protected />}>
          <Route element={<Shell />}>
            <Route path="/admin" element={<Overview />} />
            <Route path="/admin/employees" element={<People />} />
            <Route path="/admin/employees/:id" element={<EmployeeDetail />} />
            <Route path="/admin/campaigns" element={<Campaigns />} />
            <Route path="/admin/campaigns/new" element={<CampaignBuilder />} />
            <Route path="/admin/campaigns/:id" element={<CampaignDetail />} />
            <Route
              path="/admin/campaigns/:id/edit"
              element={<CampaignBuilder />}
            />
            <Route path="/admin/learning" element={<LearningLibrary />} />
            <Route
              path="/admin/learning/new"
              element={
                <SecurityAdmin>
                  <CourseBuilder />
                </SecurityAdmin>
              }
            />
            <Route path="/admin/learning/:id" element={<CourseBuilder />} />
            <Route
              path="/admin/studio"
              element={
                <SecurityAdmin>
                  <Studios />
                </SecurityAdmin>
              }
            />
            <Route
              path="/admin/studio/:id"
              element={
                <SecurityAdmin>
                  <StudioEditor />
                </SecurityAdmin>
              }
            />
            <Route
              path="/admin/simulations"
              element={
                <SecurityAdmin>
                  <Simulations />
                </SecurityAdmin>
              }
            />
            <Route
              path="/admin/human-risk/overview"
              element={<IntelligenceOverview />}
            />
            <Route
              path="/admin/reports/outcomes"
              element={<OutcomeReports />}
            />
            <Route path="/admin/human-risk" element={<HumanRisk />} />
            <Route
              path="/admin/human-risk/people/:id"
              element={
                <SecurityAdmin>
                  <HumanRiskProfile />
                </SecurityAdmin>
              }
            />
            <Route
              path="/admin/human-risk/cohorts"
              element={
                <SecurityAdmin>
                  <Cohorts />
                </SecurityAdmin>
              }
            />
            <Route
              path="/admin/human-risk/threats"
              element={
                <SecurityAdmin>
                  <ThreatFeed />
                </SecurityAdmin>
              }
            />
            <Route
              path="/admin/human-risk/autopilot"
              element={
                <SecurityAdmin>
                  <Autopilot />
                </SecurityAdmin>
              }
            />
            <Route
              path="/admin/human-risk/audit"
              element={
                <SecurityAdmin>
                  <IntelligenceAudit />
                </SecurityAdmin>
              }
            />
            <Route path="/admin/awareness" element={<Awareness />} />
            <Route path="/admin/reports" element={<Reports />} />
            <Route path="/admin/reports/inbox" element={<PhishingReports />} />
            <Route
              path="/admin/reports/certificates"
              element={<Certificates />}
            />
            <Route
              path="/admin/integrations"
              element={
                <SecurityAdmin>
                  <Integrations />
                </SecurityAdmin>
              }
            />
            <Route
              path="/admin/integrations/signals"
              element={
                <SecurityAdmin>
                  <Connections />
                </SecurityAdmin>
              }
            />
            <Route path="/admin/settings/:section?" element={<Settings />} />
            <Route
              path="/admin/content"
              element={<Navigate to="/admin/learning" replace />}
            />
            <Route
              path="/admin/automation"
              element={<Navigate to="/admin/human-risk/autopilot" replace />}
            />
            <Route
              path="/admin/audit"
              element={<Navigate to="/admin/settings/audit" replace />}
            />
          </Route>
        </Route>
        <Route element={<Protected employee />}>
          <Route element={<Shell />}>
            <Route path="/employee" element={<EmployeeHome />} />
            <Route path="/employee/learning" element={<MyLearning />} />
            <Route
              path="/employee/challenges/:id"
              element={<PracticeChallenge />}
            />
            <Route path="/employee/awareness" element={<MyAwareness />} />
            <Route path="/employee/certificates" element={<Certificates />} />
            <Route
              path="/employee/report-phishing"
              element={<PhishingReports />}
            />
            <Route path="/employee/account" element={<Account />} />
          </Route>
          <Route path="/employee/learning/:id" element={<LearningPlayer />} />
          <Route path="/employee/learning/:id/quiz" element={<Quiz />} />
          <Route
            path="/employee/learning/:id/result"
            element={<QuizResult />}
          />
          <Route path="/employee/assessment/:id" element={<Assessment />} />
        </Route>
        <Route path="*" element={<NotFound />} />
      </Routes>
    </Suspense>
  );
}
