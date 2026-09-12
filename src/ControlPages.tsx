import { ReportTriage } from "./intelligence/ReportTriage";
import { useEffect, useState } from "react";
import { Link, NavLink, useNavigate, useParams } from "react-router-dom";
import { apiRequest } from "./api";
import { useAuth } from "./auth";
import {
  ActionLink,
  Brand,
  Button,
  ConfirmButton,
  Dialog,
  Empty,
  ErrorNotice,
  Field,
  LanguageSwitch,
  Loading,
  PageTitle,
  Status,
  mutate,
  useData,
  useDate,
  useLocale,
  useStatus,
} from "./ui";

export function PhishingReports() {
  const { user } = useAuth();
  const { t } = useLocale();
  const date = useDate();
  const label = useStatus();
  const employee = user?.role === "employee";
  const canReview = ["super_admin", "admin"].includes(user?.role || "");
  const r = useData("/phishing");
  const [form, setForm] = useState({
    sender: "",
    subject: "",
    description: "",
    channel: "Email",
  });
  const [error, setError] = useState<unknown>(null);
  const [busy, setBusy] = useState(false);
  const [success, setSuccess] = useState(false);
  const [filter, setFilter] = useState("");
  const [selected, setSelected] = useState<any>(null);
  const [notes, setNotes] = useState("");
  const [status, setStatus] = useState("Reviewing");
  const [classification, setClassification] = useState("");
  const states = [
    "Submitted",
    "Reviewing",
    "Confirmed Suspicious",
    "Safe",
    "Closed",
  ];
  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setBusy(true);
    setError(null);
    try {
      await mutate("/phishing", form);
      setSuccess(true);
      setForm({ sender: "", subject: "", description: "", channel: "Email" });
      r.reload();
    } catch (e) {
      setError(e);
    } finally {
      setBusy(false);
    }
  };
  const open = (report: any) => {
    setSelected(report);
    setNotes(report.notes);
    setStatus(report.status);
    setClassification(report.classification || "");
    setError(null);
  };
  return (
    <>
      <PageTitle
        title={
          employee
            ? t("Report phishing", "Laporkan phishing")
            : t("Security inbox", "Kotak masuk keamanan")
        }
        description={
          employee
            ? t(
                "Report suspicious messages. Do not click links or open attachments.",
                "Laporkan pesan mencurigakan. Jangan klik tautan atau buka lampiran.",
              )
            : t(
                "Review reports, document findings and classify messages.",
                "Tinjau laporan, dokumentasikan temuan, dan klasifikasikan pesan.",
              )
        }
      />
      <ErrorNotice error={error} />
      {success && (
        <div className="notice" role="status">
          {t(
            "Report received. The security team can now review it.",
            "Laporan diterima. Tim keamanan dapat meninjaunya.",
          )}
        </div>
      )}
      {employee && (
        <form className="sheet" onSubmit={submit}>
          <div className="form-grid">
            <Field label={t("Suspicious sender", "Pengirim mencurigakan")}>
              <input
                required
                minLength={3}
                value={form.sender}
                onChange={(e) => setForm({ ...form, sender: e.target.value })}
              />
            </Field>
            <Field label={t("Source / channel", "Sumber / kanal")}>
              <select
                value={form.channel}
                onChange={(e) => setForm({ ...form, channel: e.target.value })}
              >
                {["Email", "SMS", "Chat", "Other"].map((s) => (
                  <option key={s} value={s}>
                    {label(s)}
                  </option>
                ))}
              </select>
            </Field>
          </div>
          <Field label={t("Subject", "Subjek")}>
            <input
              required
              minLength={3}
              value={form.subject}
              onChange={(e) => setForm({ ...form, subject: e.target.value })}
            />
          </Field>
          <Field
            label={t(
              "Why does this look suspicious?",
              "Mengapa pesan ini mencurigakan?",
            )}
            hint={t(
              "Do not include passwords or other secrets.",
              "Jangan sertakan kata sandi atau rahasia lain.",
            )}
          >
            <textarea
              required
              minLength={10}
              value={form.description}
              onChange={(e) =>
                setForm({ ...form, description: e.target.value })
              }
            />
          </Field>
          <Button disabled={busy}>{t("Submit report", "Kirim laporan")}</Button>
        </form>
      )}
      <section className="section">
        <div className="section-head">
          <h2>
            {employee
              ? t("My reports", "Laporan saya")
              : t("Reported messages", "Pesan dilaporkan")}
          </h2>
          <select
            style={{ maxWidth: 200 }}
            aria-label={t("Filter status", "Filter status")}
            value={filter}
            onChange={(e) => setFilter(e.target.value)}
          >
            <option value="">{t("All statuses", "Semua status")}</option>
            {states.map((s) => (
              <option key={s} value={s}>
                {label(s)}
              </option>
            ))}
          </select>
        </div>
        <Loading resource={r}>
          {r.data?.reports.filter((p: any) => !filter || p.status === filter)
            .length ? (
            <div className="table-wrap">
              <table>
                <thead>
                  <tr>
                    <th>{t("Message", "Pesan")}</th>
                    {!employee && <th>{t("Reporter", "Pelapor")}</th>}
                    <th>{t("Received", "Diterima")}</th>
                    <th>{t("Status", "Status")}</th>
                    <th />
                  </tr>
                </thead>
                <tbody>
                  {r.data.reports
                    .filter((p: any) => !filter || p.status === filter)
                    .map((p: any) => (
                      <tr key={p.id}>
                        <td>
                          <strong>{p.subject}</strong>
                          <small>
                            {p.sender} · {label(p.channel)}
                          </small>
                        </td>
                        {!employee && (
                          <td>
                            {p.reporter}
                            <small>{p.department}</small>
                          </td>
                        )}
                        <td>{date(p.created_at, true)}</td>
                        <td>
                          <Status value={p.status} />
                        </td>
                        <td>
                          <Button variant="quiet" onClick={() => open(p)}>
                            {t("View", "Lihat")}
                          </Button>
                        </td>
                      </tr>
                    ))}
                </tbody>
              </table>
            </div>
          ) : (
            <Empty
              title={t(
                "No reports in this view",
                "Tidak ada laporan pada tampilan ini",
              )}
              description={t(
                "Reported messages and their review status appear here.",
                "Pesan yang dilaporkan dan status tinjauannya muncul di sini.",
              )}
            />
          )}
        </Loading>
      </section>
      {selected && (
        <Dialog title={selected.subject} onClose={() => setSelected(null)}>
          <p>
            {selected.sender} · {label(selected.channel)}
          </p>
          <div className="lesson-prose">{selected.description}</div>
          {canReview && <ReportTriage reportId={selected.id} />}
          <ErrorNotice error={error} />
          {canReview ? (
            <form
              className="section"
              onSubmit={async (e) => {
                e.preventDefault();
                setBusy(true);
                try {
                  await mutate(
                    `/phishing/${selected.id}`,
                    { status, notes, classification: classification || null },
                    "PATCH",
                  );
                  setSelected(null);
                  r.reload();
                } catch (e) {
                  setError(e);
                } finally {
                  setBusy(false);
                }
              }}
            >
              <div className="form-grid">
                <Field label={t("Investigation status", "Status investigasi")}>
                  <select
                    value={status}
                    onChange={(e) => {
                      const s = e.target.value;
                      setStatus(s);
                      if (s === "Safe") setClassification("Safe");
                      if (s === "Confirmed Suspicious")
                        setClassification("Suspicious");
                    }}
                  >
                    {states.map((s) => (
                      <option key={s} value={s}>
                        {label(s)}
                      </option>
                    ))}
                  </select>
                </Field>
                <Field label={t("Final classification", "Klasifikasi akhir")}>
                  <select
                    value={classification}
                    onChange={(e) => setClassification(e.target.value)}
                  >
                    <option value="">
                      {t("Not classified", "Belum diklasifikasikan")}
                    </option>
                    <option value="Suspicious">
                      {t("Suspicious", "Mencurigakan")}
                    </option>
                    <option value="Safe">{t("Safe", "Aman")}</option>
                  </select>
                </Field>
              </div>
              <Field label={t("Investigation notes", "Catatan investigasi")}>
                <textarea
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                />
              </Field>
              <small>
                {t(
                  "Confirmed reports contribute at most once per reporter per day.",
                  "Laporan dikonfirmasi berkontribusi maksimal sekali per pelapor per hari.",
                )}
              </small>
              <footer>
                <Button disabled={busy}>
                  {t("Save review", "Simpan tinjauan")}
                </Button>
              </footer>
            </form>
          ) : (
            <div className="section">
              <Status value={selected.status} />
              {!employee && <p>{selected.notes}</p>}
            </div>
          )}
        </Dialog>
      )}
    </>
  );
}

export function Settings() {
  const { section } = useParams();
  const { t } = useLocale();
  const { user, refresh } = useAuth();
  const r = useData("/settings");
  const active = section || "organization";
  const [form, setForm] = useState({
    name: "",
    locale: "id",
    timezone: "Asia/Makassar",
    reminders: true,
    retentionDays: 365,
  });
  const [error, setError] = useState<unknown>(null);
  const [success, setSuccess] = useState(false);
  const [busy, setBusy] = useState(false);
  const canEdit = user?.role !== "manager";
  useEffect(() => {
    if (r.data)
      setForm({
        name: r.data.organization.name,
        locale: r.data.settings.locale,
        timezone: r.data.settings.timezone,
        reminders: Boolean(r.data.settings.reminders),
        retentionDays: r.data.settings.retention_days,
      });
  }, [r.data]);
  const save = async (e: React.FormEvent) => {
    e.preventDefault();
    setBusy(true);
    setSuccess(false);
    try {
      await mutate("/settings", form, "PUT");
      await refresh();
      setSuccess(true);
      r.reload();
    } catch (e) {
      setError(e);
    } finally {
      setBusy(false);
    }
  };
  const nav = [
    ["organization", t("Organization", "Organisasi")],
    ["security", t("Security", "Keamanan")],
    ["score", "Awareness Score"],
    ["notifications", t("Notifications", "Notifikasi")],
    ["privacy", t("Data & privacy", "Data & privasi")],
    ["administrators", t("Administrators", "Administrator")],
    ["health", t("System health", "Kesehatan sistem")],
    ["audit", t("Audit log", "Log audit")],
  ];
  return (
    <>
      <PageTitle
        title={t("Settings", "Pengaturan")}
        description={t(
          "Organization preferences, access and operational health.",
          "Preferensi organisasi, akses, dan kesehatan operasional.",
        )}
      />
      <div className="setting-layout">
        <nav
          className="setting-nav"
          aria-label={t("Settings navigation", "Navigasi pengaturan")}
        >
          {nav.map(([key, label]) => (
            <NavLink key={key} to={`/admin/settings/${key}`}>
              {label}
            </NavLink>
          ))}
        </nav>
        <div>
          {active === "security" ? (
            <Account />
          ) : active === "score" ? (
            <div className="sheet">
              <h2>{t("Scoring governance", "Tata kelola penilaian")}</h2>
              <p className="section">
                {t(
                  "Score weights are versioned. Changes require a reviewed release.",
                  "Bobot skor diberi versi. Perubahan memerlukan rilis yang ditinjau.",
                )}
              </p>
              <ActionLink secondary to="/methodology">
                {t("View methodology", "Lihat metodologi")}
              </ActionLink>
            </div>
          ) : active === "audit" ? (
            <Audit />
          ) : active === "administrators" ? (
            <div className="sheet">
              <h2>{t("Roles and access", "Peran dan akses")}</h2>
              <p className="section">
                {t(
                  "The tenant owner manages administrators. Admins manage employees and learning. Managers monitor and prepare programs.",
                  "Pemilik organisasi mengelola administrator. Admin mengelola karyawan dan materi. Manager memantau dan menyiapkan program.",
                )}
              </p>
              <ActionLink secondary to="/admin/employees">
                {t("Manage people", "Kelola karyawan")}
              </ActionLink>
            </div>
          ) : (
            <Loading resource={r}>
              {r.data &&
                (active === "health" ? (
                  <SystemHealth data={r.data} reload={r.reload} />
                ) : (
                  <form className="sheet" onSubmit={save}>
                    <ErrorNotice error={error} />
                    {success && (
                      <div className="notice" role="status">
                        {t("Settings saved.", "Pengaturan tersimpan.")}
                      </div>
                    )}
                    <fieldset disabled={!canEdit || busy}>
                      {active === "organization" && (
                        <>
                          <h2>
                            {t("Organization details", "Detail organisasi")}
                          </h2>
                          <div className="section">
                            <Field
                              label={t("Organization name", "Nama organisasi")}
                            >
                              <input
                                value={form.name}
                                onChange={(e) =>
                                  setForm({ ...form, name: e.target.value })
                                }
                                required
                                minLength={2}
                              />
                            </Field>
                            <div className="form-grid">
                              <Field
                                label={t("Default locale", "Bahasa default")}
                              >
                                <select
                                  value={form.locale}
                                  onChange={(e) =>
                                    setForm({ ...form, locale: e.target.value })
                                  }
                                >
                                  <option value="id">Bahasa Indonesia</option>
                                  <option value="en">English</option>
                                </select>
                              </Field>
                              <Field label={t("Time zone", "Zona waktu")}>
                                <select
                                  value={form.timezone}
                                  onChange={(e) =>
                                    setForm({
                                      ...form,
                                      timezone: e.target.value,
                                    })
                                  }
                                >
                                  {[
                                    "Asia/Makassar",
                                    "Asia/Jakarta",
                                    "Asia/Jayapura",
                                    "Asia/Singapore",
                                    "UTC",
                                    "Europe/London",
                                    "America/New_York",
                                  ].map((x) => (
                                    <option key={x}>{x}</option>
                                  ))}
                                </select>
                              </Field>
                            </div>
                          </div>
                        </>
                      )}
                      {active === "notifications" && (
                        <>
                          <h2>
                            {t(
                              "Notification preferences",
                              "Preferensi notifikasi",
                            )}
                          </h2>
                          <label className="check">
                            <input
                              type="checkbox"
                              checked={form.reminders}
                              onChange={(e) =>
                                setForm({
                                  ...form,
                                  reminders: e.target.checked,
                                })
                              }
                            />
                            <span>
                              {t(
                                "Learning deadline reminders",
                                "Pengingat tenggat pembelajaran",
                              )}
                              <small>
                                {t(
                                  "At most once daily, starting three days before the deadline.",
                                  "Maksimal sekali sehari, mulai tiga hari sebelum tenggat.",
                                )}
                              </small>
                            </span>
                          </label>
                          <p>
                            {t(
                              "Assignment, assessment, certificate and account security messages remain enabled.",
                              "Pesan tugas, asesmen, sertifikat, dan keamanan akun tetap aktif.",
                            )}
                          </p>
                        </>
                      )}
                      {active === "privacy" && (
                        <>
                          <h2>{t("Data retention", "Retensi data")}</h2>
                          <Field
                            label={t(
                              "Operational message retention (days)",
                              "Retensi pesan operasional (hari)",
                            )}
                            hint={t(
                              "Applies to completed delivery metadata and read notifications. Learning evidence, audit and certificates are retained.",
                              "Berlaku untuk metadata pengiriman selesai dan notifikasi terbaca. Bukti pembelajaran, audit, dan sertifikat tetap disimpan.",
                            )}
                          >
                            <input
                              type="number"
                              min={30}
                              max={3650}
                              value={form.retentionDays}
                              onChange={(e) =>
                                setForm({
                                  ...form,
                                  retentionDays: Number(e.target.value),
                                })
                              }
                            />
                          </Field>
                          <p>
                            {t(
                              "Public verification reveals only course title, status, issue date and certificate ID. Simulation IP addresses are pseudonymized.",
                              "Verifikasi publik hanya menampilkan judul materi, status, tanggal terbit, dan ID sertifikat. Alamat IP simulasi dipseudonimkan.",
                            )}
                          </p>
                        </>
                      )}
                      {canEdit && (
                        <Button className="section" disabled={busy}>
                          {t("Save changes", "Simpan perubahan")}
                        </Button>
                      )}
                    </fieldset>
                  </form>
                ))}
            </Loading>
          )}
        </div>
      </div>
    </>
  );
}
function SystemHealth({ data, reload }: { data: any; reload: () => void }) {
  const { t } = useLocale();
  const date = useDate();
  const { user } = useAuth();
  const [error, setError] = useState<unknown>(null);
  const healthy =
    data.health &&
    !data.health.last_error &&
    Date.now() - new Date(data.health.last_run).getTime() < 180000;
  return (
    <>
      <div className="sheet">
        <h2>{t("Service health", "Kesehatan layanan")}</h2>
        <div className="row">
          <span>{t("Automation", "Otomatisasi")}</span>
          <Status
            value={
              healthy
                ? t("Healthy", "Sehat")
                : t("Needs attention", "Perlu perhatian")
            }
          />
        </div>
        <div className="row">
          <span>{t("Last checked", "Terakhir diperiksa")}</span>
          {date(data.health?.last_run, true)}
        </div>
        <div className="row">
          <span>{t("Email delivery", "Pengiriman email")}</span>
          <Status
            value={
              data.smtp.configured
                ? t("Configured", "Dikonfigurasi")
                : t("Not configured", "Belum dikonfigurasi")
            }
          />
        </div>
        <p>
          <small>
            {t(
              "Delivery resumes after restart. Failed messages retry with increasing delays, up to five attempts.",
              "Pengiriman dilanjutkan setelah restart. Pesan gagal dicoba ulang dengan jeda bertambah, maksimal lima percobaan.",
            )}
          </small>
        </p>
      </div>
      <details className="section">
        <summary>
          {t("Advanced: delivery history", "Lanjutan: riwayat pengiriman")}
        </summary>
        <ErrorNotice error={error} />
        <div className="table-wrap">
          <table>
            <thead>
              <tr>
                <th>{t("Type", "Jenis")}</th>
                <th>{t("Status", "Status")}</th>
                <th>{t("Attempts", "Percobaan")}</th>
                <th>{t("Created", "Dibuat")}</th>
                <th />
              </tr>
            </thead>
            <tbody>
              {data.jobs.map((j: any) => (
                <tr key={j.id}>
                  <td>{j.kind}</td>
                  <td>
                    <Status value={j.status} />
                  </td>
                  <td>{j.attempts}</td>
                  <td>{date(j.created_at, true)}</td>
                  <td>
                    {j.status === "Failed" && user?.role !== "manager" && (
                      <Button
                        variant="quiet"
                        onClick={async () => {
                          try {
                            await mutate(`/jobs/${j.id}/retry`);
                            reload();
                          } catch (e) {
                            setError(e);
                          }
                        }}
                      >
                        {t("Retry", "Coba lagi")}
                      </Button>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </details>
    </>
  );
}

export function Account() {
  const { t } = useLocale();
  const { user, refresh } = useAuth();
  const r = useData("/sessions");
  const date = useDate();
  const [current, setCurrent] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<unknown>(null);
  const [success, setSuccess] = useState(false);
  const [secret, setSecret] = useState("");
  const [otp, setOtp] = useState("");
  const [busy, setBusy] = useState(false);
  return (
    <>
      <PageTitle
        title={t("Account security", "Keamanan akun")}
        description={user?.email}
      />
      <ErrorNotice error={error} />
      {success && (
        <div className="notice" role="status">
          {t("Account updated.", "Akun diperbarui.")}
        </div>
      )}
      <form
        className="sheet"
        onSubmit={async (e) => {
          e.preventDefault();
          setBusy(true);
          try {
            await apiRequest("/api/auth/change-password", {
              method: "POST",
              body: JSON.stringify({
                currentPassword: current,
                newPassword: password,
              }),
            });
            setSuccess(true);
            setCurrent("");
            setPassword("");
            await refresh();
            r.reload();
          } catch (e) {
            setError(e);
          } finally {
            setBusy(false);
          }
        }}
      >
        <h2>{t("Change password", "Ganti kata sandi")}</h2>
        <div className="form-grid section">
          <Field label={t("Current password", "Kata sandi saat ini")}>
            <input
              required
              type="password"
              autoComplete="current-password"
              value={current}
              onChange={(e) => setCurrent(e.target.value)}
            />
          </Field>
          <Field
            label={t("New password", "Kata sandi baru")}
            hint={t(
              "12+ characters: uppercase, lowercase, number and symbol.",
              "12+ karakter: huruf besar, kecil, angka, dan simbol.",
            )}
          >
            <input
              required
              type="password"
              minLength={12}
              autoComplete="new-password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
            />
          </Field>
        </div>
        <Button disabled={busy}>
          {t("Change password", "Ganti kata sandi")}
        </Button>
      </form>
      <Loading resource={r}>
        {r.data && (
          <>
            <section className="sheet section">
              <div className="section-head">
                <h2>{t("Authenticator app", "Aplikasi autentikator")}</h2>
                <Status
                  value={
                    r.data.mfaEnabled
                      ? t("Enabled", "Aktif")
                      : t("Not enabled", "Belum aktif")
                  }
                />
              </div>
              <p>
                {t(
                  "Protect your account with a time-based code. Store the setup key securely for recovery.",
                  "Lindungi akun dengan kode berbasis waktu. Simpan kunci pengaturan dengan aman untuk pemulihan.",
                )}
              </p>
              {!r.data.mfaEnabled && (
                <form
                  className="section"
                  onSubmit={async (e) => {
                    e.preventDefault();
                    setBusy(true);
                    try {
                      if (secret) {
                        await mutate("/mfa/confirm", { otp });
                        setSecret("");
                        setCurrent("");
                        r.reload();
                      } else {
                        const result = await mutate<any>("/mfa/setup", {
                          password: current,
                        });
                        setSecret(result.secret);
                      }
                    } catch (e) {
                      setError(e);
                    } finally {
                      setBusy(false);
                    }
                  }}
                >
                  {!secret ? (
                    <Field
                      label={t(
                        "Confirm current password",
                        "Konfirmasi kata sandi saat ini",
                      )}
                    >
                      <input
                        type="password"
                        required
                        value={current}
                        onChange={(e) => setCurrent(e.target.value)}
                      />
                    </Field>
                  ) : (
                    <>
                      <div className="copy-code">{secret}</div>
                      <Field
                        label={t(
                          "6-digit authenticator code",
                          "Kode autentikator 6 digit",
                        )}
                      >
                        <input
                          required
                          inputMode="numeric"
                          autoComplete="one-time-code"
                          pattern="[0-9]{6}"
                          maxLength={6}
                          value={otp}
                          onChange={(e) => setOtp(e.target.value)}
                        />
                      </Field>
                    </>
                  )}
                  <Button disabled={busy}>
                    {secret
                      ? t("Confirm authenticator", "Konfirmasi autentikator")
                      : t("Set up authenticator", "Atur autentikator")}
                  </Button>
                </form>
              )}
              {r.data.mfaEnabled && (
                <details className="section">
                  <summary>
                    {t("Disable authenticator", "Nonaktifkan autentikator")}
                  </summary>
                  <form
                    onSubmit={async (e) => {
                      e.preventDefault();
                      setBusy(true);
                      try {
                        await mutate("/mfa/disable", {
                          password: current,
                          otp,
                        });
                        setCurrent("");
                        setOtp("");
                        r.reload();
                      } catch (e) {
                        setError(e);
                      } finally {
                        setBusy(false);
                      }
                    }}
                  >
                    <p>
                      {t(
                        "Disabling removes this extra sign-in protection. Confirm your password and a fresh code.",
                        "Menonaktifkan akan menghapus perlindungan login tambahan ini. Konfirmasi kata sandi dan kode baru.",
                      )}
                    </p>
                    <Field
                      label={t(
                        "Confirm current password",
                        "Konfirmasi kata sandi saat ini",
                      )}
                    >
                      <input
                        required
                        type="password"
                        autoComplete="current-password"
                        value={current}
                        onChange={(e) => setCurrent(e.target.value)}
                      />
                    </Field>
                    <Field
                      label={t(
                        "6-digit authenticator code",
                        "Kode autentikator 6 digit",
                      )}
                    >
                      <input
                        required
                        pattern="[0-9]{6}"
                        inputMode="numeric"
                        autoComplete="one-time-code"
                        value={otp}
                        onChange={(e) => setOtp(e.target.value)}
                      />
                    </Field>
                    <Button disabled={busy}>
                      {t("Confirm disabling", "Konfirmasi penonaktifan")}
                    </Button>
                  </form>
                </details>
              )}
            </section>
            <section className="sheet section">
              <h2>{t("Active sessions", "Sesi aktif")}</h2>
              {r.data.sessions.map((s: any) => (
                <div className="row" key={s.id}>
                  <div>
                    <strong>
                      {s.current
                        ? t("This session", "Sesi ini")
                        : t("Other session", "Sesi lain")}
                    </strong>
                    <small>
                      {s.ip_address} · {date(s.last_seen_at, true)}
                    </small>
                    <small>{s.user_agent?.slice(0, 80)}</small>
                  </div>
                  {!s.current && (
                    <ConfirmButton
                      title={t("Revoke session?", "Cabut sesi?")}
                      description={t(
                        "That device will need to sign in again.",
                        "Perangkat tersebut harus masuk kembali.",
                      )}
                      onConfirm={async () => {
                        await mutate(`/sessions/${s.id}`, undefined, "DELETE");
                        r.reload();
                      }}
                    >
                      {t("Revoke", "Cabut")}
                    </ConfirmButton>
                  )}
                </div>
              ))}
            </section>
          </>
        )}
      </Loading>
    </>
  );
}
export function Integrations() {
  const { t } = useLocale();
  const r = useData("/settings");
  const [selected, setSelected] = useState<string | null>(null);
  const names = [
    "Organization SSO / OIDC",
    "Microsoft Entra ID",
    "Microsoft 365",
    "Google Workspace",
    "SCIM",
    "Microsoft Teams",
    "Email / SMTP",
    "SIEM / Webhook",
  ];
  return (
    <>
      <PageTitle
        title={t("Integrations", "Integrasi")}
        description={t(
          "Connect organizational services. Availability reflects implemented connectors.",
          "Hubungkan layanan organisasi. Ketersediaan sesuai konektor yang telah diimplementasikan.",
        )}
      />
      <Loading resource={r}>
        <div className="sheet">
          {names.map((name) => (
            <div className="integration-row" key={name}>
              <span className="integration-logo">
                {name
                  .split(/\s/)
                  .slice(0, 2)
                  .map((s) => s[0])
                  .join("")}
              </span>
              <div>
                <h3>{name}</h3>
                <p>
                  {name === "Email / SMTP"
                    ? t(
                        "Invitations, reminders and learning notifications.",
                        "Undangan, pengingat, dan notifikasi pembelajaran.",
                      )
                    : t(
                        "Organization identity, collaboration and employee lifecycle.",
                        "Identitas organisasi, kolaborasi, dan siklus karyawan.",
                      )}
                </p>
              </div>
              <Status
                value={
                  name === "Organization SSO / OIDC"
                    ? r.data?.sso.configured
                      ? t("Configured", "Dikonfigurasi")
                      : t("Not connected", "Belum terhubung")
                    : name === "Email / SMTP"
                      ? r.data?.smtp.configured
                        ? t("Configured", "Dikonfigurasi")
                        : t("Not connected", "Belum terhubung")
                      : t("Unavailable", "Belum tersedia")
                }
              />
              <Button variant="secondary" onClick={() => setSelected(name)}>
                {t("Details", "Detail")}
              </Button>
            </div>
          ))}
        </div>
      </Loading>
      {selected && (
        <Dialog title={selected} onClose={() => setSelected(null)}>
          {selected === "Organization SSO / OIDC" ? (
            <>
              <p>
                {t(
                  "OpenID Connect authorization code flow with PKCE, nonce and signed identity-token validation. Configure the issuer, client, callback URL and organization on the server. Only existing active accounts with a verified email can sign in.",
                  "Alur kode otorisasi OpenID Connect menggunakan PKCE, nonce, dan validasi tanda tangan token identitas. Atur issuer, klien, URL callback, dan organisasi di server. Hanya akun aktif yang sudah ada dengan email terverifikasi yang dapat masuk.",
                )}
              </p>
              <p>
                {r.data?.sso.issuer ||
                  t("No issuer configured.", "Issuer belum diatur.")}
              </p>
              <small>
                {t(
                  "Configured does not mean verified with your identity provider. Test login before rollout. Directory sync is separate and unavailable.",
                  "Dikonfigurasi bukan berarti telah terverifikasi dengan penyedia identitas Anda. Uji login sebelum peluncuran. Sinkronisasi direktori terpisah dan belum tersedia.",
                )}
              </small>
            </>
          ) : selected === "Email / SMTP" ? (
            <>
              <p>
                {t(
                  "SMTP is configured by the deployment administrator. Credentials remain on the server.",
                  "SMTP dikonfigurasi administrator deployment. Kredensial tetap di server.",
                )}
              </p>
              <div className="row">
                <span>Host</span>
                {r.data?.smtp.host || "—"}
              </div>
              <div className="row">
                <span>{t("Sender", "Pengirim")}</span>
                {r.data?.smtp.from || "—"}
              </div>
              <ActionLink secondary to="/admin/settings/health">
                {t("View delivery health", "Lihat kesehatan pengiriman")}
              </ActionLink>
            </>
          ) : (
            <>
              <p>
                {t(
                  "This connector is not implemented. No external account is connected and no permissions have been requested.",
                  "Konektor ini belum diimplementasikan. Tidak ada akun eksternal terhubung atau izin diminta.",
                )}
              </p>
              <p>
                {t(
                  "Use CSV invitations for onboarding and PDF/CSV reporting while this connector is unavailable.",
                  "Gunakan undangan melalui CSV serta pelaporan PDF/CSV selama konektor belum tersedia.",
                )}
              </p>
            </>
          )}
        </Dialog>
      )}
    </>
  );
}
export function Audit() {
  const { t } = useLocale();
  const date = useDate();
  const [action, setAction] = useState("");
  const [actor, setActor] = useState("");
  const [outcome, setOutcome] = useState("");
  const [page, setPage] = useState(1);
  const r = useData(
    `/audit?${new URLSearchParams({ action, actor, outcome, page: String(page) })}`,
  );
  return (
    <>
      <PageTitle
        title={t("Audit log", "Log audit")}
        description={t(
          "Security-relevant activity, separate from learning notifications.",
          "Aktivitas terkait keamanan, terpisah dari notifikasi pembelajaran.",
        )}
      />
      <div className="toolbar">
        <input
          aria-label={t("Actor", "Pelaku")}
          placeholder={t("Search actor", "Cari pelaku")}
          value={actor}
          onChange={(e) => {
            setActor(e.target.value);
            setPage(1);
          }}
        />
        <input
          aria-label={t("Action", "Tindakan")}
          placeholder={t("Search action", "Cari tindakan")}
          value={action}
          onChange={(e) => {
            setAction(e.target.value);
            setPage(1);
          }}
        />
        <select
          aria-label={t("Outcome", "Hasil")}
          value={outcome}
          onChange={(e) => {
            setOutcome(e.target.value);
            setPage(1);
          }}
        >
          <option value="">{t("All results", "Semua hasil")}</option>
          <option value="success">{t("Success", "Berhasil")}</option>
          <option value="failure">{t("Failure", "Gagal")}</option>
          <option value="denied">{t("Denied", "Ditolak")}</option>
        </select>
      </div>
      <Loading resource={r}>
        {r.data && (
          <>
            <div className="table-wrap">
              <table>
                <thead>
                  <tr>
                    <th>{t("Time", "Waktu")}</th>
                    <th>{t("Actor", "Pelaku")}</th>
                    <th>{t("Action", "Tindakan")}</th>
                    <th>{t("Result", "Hasil")}</th>
                    <th>{t("Details", "Detail")}</th>
                  </tr>
                </thead>
                <tbody>
                  {r.data.logs.map((l: any) => (
                    <tr key={l.id}>
                      <td>{date(l.created_at, true)}</td>
                      <td>{l.actor}</td>
                      <td>{l.action}</td>
                      <td>
                        {l.outcome === "success"
                          ? t("Success", "Berhasil")
                          : l.outcome === "denied"
                            ? t("Denied", "Ditolak")
                            : t("Failure", "Gagal")}
                      </td>
                      <td>
                        <details>
                          <summary>{t("Inspect", "Periksa")}</summary>
                          <pre className="audit-details">
                            {JSON.stringify(
                              { entity: l.entity_type, ...l.metadata },
                              null,
                              2,
                            )}
                          </pre>
                        </details>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
              {!r.data.logs.length && (
                <Empty
                  title={t(
                    "No matching audit events",
                    "Tidak ada aktivitas audit sesuai filter",
                  )}
                  description={t(
                    "Adjust filters to inspect other activity.",
                    "Sesuaikan filter untuk memeriksa aktivitas lain.",
                  )}
                />
              )}
            </div>
            <div className="builder-footer">
              <Button
                variant="secondary"
                disabled={page === 1}
                onClick={() => setPage(page - 1)}
              >
                {t("Previous", "Sebelumnya")}
              </Button>
              <small>
                {page} / {Math.max(1, Math.ceil(r.data.total / 30))}
              </small>
              <Button
                variant="secondary"
                disabled={page * 30 >= r.data.total}
                onClick={() => setPage(page + 1)}
              >
                {t("Next", "Berikutnya")}
              </Button>
            </div>
          </>
        )}
      </Loading>
    </>
  );
}

export function VerifyCertificate() {
  const { id } = useParams();
  const { t } = useLocale();
  const date = useDate();
  const navigate = useNavigate();
  const [input, setInput] = useState(id || "");
  const [result, setResult] = useState<any>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<unknown>(null);
  useEffect(() => {
    if (!id) return;
    setLoading(true);
    setError(null);
    setResult(null);
    fetch(`/api/public/verify/${encodeURIComponent(id)}`)
      .then(async (res) => {
        const body = await res.json();
        if (res.status === 404) {
          setResult({ status: "Not Found" });
          return;
        }
        if (!res.ok) throw new Error("verification failed");
        setResult(body);
      })
      .catch(setError)
      .finally(() => setLoading(false));
  }, [id]);
  return (
    <div className="public-wrap">
      <Brand />
      <div className="sheet">
        <LanguageSwitch />
        <PageTitle
          title={t("Verify a certificate", "Verifikasi sertifikat")}
          description={t(
            "Check whether a learning certificate is valid.",
            "Periksa apakah sertifikat pembelajaran berlaku.",
          )}
        />
        <form
          onSubmit={(e) => {
            e.preventDefault();
            navigate(`/verify/${encodeURIComponent(input.trim())}`);
          }}
        >
          <Field label={t("Certificate ID", "ID sertifikat")}>
            <input
              required
              value={input}
              onChange={(e) => setInput(e.target.value)}
            />
          </Field>
          <Button disabled={loading}>{t("Verify", "Verifikasi")}</Button>
        </form>
        <ErrorNotice error={error} />
        {result && (
          <section className="section">
            <Status value={result.status} />
            {result.certificate && (
              <>
                <h2 className="section">{result.certificate.title}</h2>
                <p>
                  {t("Issued", "Diterbitkan")}{" "}
                  {date(result.certificate.issued_at)}
                </p>
              </>
            )}
            {result.status === "Revoked" && (
              <p>
                {t(
                  "This certificate is no longer valid. Contact the issuing organization.",
                  "Sertifikat ini tidak berlaku. Hubungi organisasi penerbit.",
                )}
              </p>
            )}
            {result.status === "Not Found" && (
              <p>
                {t(
                  "Check the ID on your certificate and try again.",
                  "Periksa ID pada sertifikat lalu coba lagi.",
                )}
              </p>
            )}
          </section>
        )}
      </div>
    </div>
  );
}
export function Simulation() {
  const { token } = useParams();
  const { t } = useLocale();
  const [result, setResult] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<unknown>(null);
  const send = async (event: string) => {
    setBusy(true);
    try {
      await apiRequest(
        `/api/public/exercise/${encodeURIComponent(token || "")}`,
        { method: "POST", body: JSON.stringify({ event }) },
      );
      if (event !== "opened") setResult(event);
    } catch (e) {
      setError(e);
    } finally {
      setBusy(false);
    }
  };
  useEffect(() => {
    void send("opened");
  }, [token]);
  return (
    <div className="public-wrap">
      <Brand />
      <div className="sheet">
        <LanguageSwitch />
        <span className="eyebrow section">
          {t("SECURITY LEARNING EXERCISE", "LATIHAN PEMBELAJARAN KEAMANAN")}
        </span>
        <h1>
          {t(
            "An unexpected account request",
            "Permintaan akun yang tidak terduga",
          )}
        </h1>
        <p>
          {t(
            "A message asks you to keep your account active by opening an unfamiliar link. What would you do?",
            "Sebuah pesan meminta Anda menjaga akun tetap aktif dengan membuka tautan asing. Apa yang Anda lakukan?",
          )}
        </p>
        <div className="sheet section">
          <small>
            {t(
              "From: IT Support <support@account-review.example>",
              "Dari: Dukungan IT <support@account-review.example>",
            )}
          </small>
          <p className="section">
            {t(
              "Your password expires soon. Verify your account to avoid losing access.",
              "Kata sandi Anda segera kedaluwarsa. Verifikasi akun agar akses tidak terputus.",
            )}
          </p>
          <Button
            className="section"
            disabled={busy || Boolean(result)}
            onClick={() => void send("clicked")}
          >
            {t("Open the link", "Buka tautan")}
          </Button>
        </div>
        <div className="actions section">
          <Button
            variant="secondary"
            disabled={busy || Boolean(result)}
            onClick={() => void send("reported")}
          >
            {t("Report as suspicious", "Laporkan sebagai mencurigakan")}
          </Button>
        </div>
        <ErrorNotice error={error} />
        {result && (
          <div className="notice" role="status">
            {result === "reported"
              ? t(
                  "Response recorded. Verifying through a trusted channel is a safe response.",
                  "Respons tercatat. Verifikasi melalui kanal tepercaya merupakan tindakan aman.",
                )
              : t(
                  "This was a learning exercise. Unfamiliar senders and urgency are warning signs. No password was collected.",
                  "Ini latihan pembelajaran. Pengirim asing dan desakan waktu adalah tanda bahaya. Tidak ada kata sandi dikumpulkan.",
                )}
          </div>
        )}
      </div>
    </div>
  );
}
