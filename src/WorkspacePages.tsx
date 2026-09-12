import { useEffect, useState } from "react";
import {
  Link,
  useNavigate,
  useParams,
  useSearchParams,
} from "react-router-dom";
import {
  ArrowRight,
  ArrowUpRight,
  Check,
  ChevronRight,
  Plus,
  Search,
  Users,
} from "lucide-react";
import { useAuth } from "./auth";
import { apiRequest } from "./api";
import {
  ActionLink,
  Button,
  ConfirmButton,
  Dialog,
  Download,
  Empty,
  ErrorNotice,
  Field,
  Loading,
  Metric,
  PageTitle,
  Progress,
  Status,
  Tabs,
  mutate,
  useData,
  useDate,
  useLocale,
  useStatus,
} from "./ui";

const value = (n: number | null, suffix = "") =>
  n === null || n === undefined ? "—" : `${n}${suffix}`;
function Metrics({ s, score = true }: { s: any; score?: boolean }) {
  const { t } = useLocale();
  return (
    <div className="metric-grid">
      {score && (
        <Metric
          label="Awareness Score"
          value={value(s.score)}
          note={
            s.change !== null
              ? `${s.change > 0 ? "+" : ""}${s.change} ${t("points vs previous period", "poin dari periode sebelumnya")}`
              : t("No comparable prior evidence", "Belum ada data pembanding")
          }
        />
      )}
      <Metric
        label={t("Employees covered", "Karyawan tercakup")}
        value={s.employees}
        note={`${value(s.coverage, "%")} ${t("measured", "terukur")}`}
      />
      <Metric
        label={t("Assignment completion", "Penyelesaian tugas")}
        value={value(s.assignmentCompletion, "%")}
        note={`${s.assigned} ${t("assigned activities", "aktivitas ditugaskan")}`}
      />
      <Metric
        label={t("Quiz pass rate", "Kelulusan kuis")}
        value={value(s.quizPassRate, "%")}
        note={`${s.attempts} ${t("completed attempts", "percobaan selesai")}`}
      />
    </div>
  );
}
function RiskDistribution({ data }: { data: any }) {
  const { t } = useLocale();
  const status = useStatus();
  return (
    <div className="sheet">
      <h2>{t("Risk distribution", "Distribusi risiko")}</h2>
      <p>
        <small>
          {t(
            "Based on the latest available individual evidence.",
            "Berdasarkan bukti individual terbaru yang tersedia.",
          )}
        </small>
      </p>
      <div className="risk-track">
        {data.risk.map((r: any) => (
          <span
            key={r.label}
            className={`risk-${r.label.toLowerCase()}`}
            style={{ flex: r.count }}
          />
        ))}
      </div>
      {data.risk.map((r: any) => (
        <div className="legend-row" key={r.label}>
          <span>{status(r.label)}</span>
          <strong>
            {r.count} <small>{t("employees", "karyawan")}</small>
          </strong>
        </div>
      ))}
      <Link className="text-link row" to="/admin/awareness">
        {t("Explore risk drivers", "Telusuri penyebab risiko")}
        <ChevronRight size={15} />
      </Link>
    </div>
  );
}
export function Overview() {
  const r = useData("/summary?period=30");
  const campaigns = useData("/campaigns");
  const { t } = useLocale();
  const d = r.data;
  const priorities = d
    ? [
        ...(d.summary.overdue
          ? [
              {
                title: `${d.summary.overdue} ${t("learning activities are overdue", "tugas pembelajaran melewati tenggat")}`,
                body: t(
                  "Review outstanding work and send a reminder.",
                  "Tinjau tugas tertunda dan kirim pengingat.",
                ),
                link: "/admin/employees?status=overdue",
                label: t("View people", "Lihat karyawan"),
              },
            ]
          : []),
        ...d.departments
          .filter((x: any) => x.score !== null && x.score < 60)
          .slice(0, 1)
          .map((x: any) => ({
            title: `${x.department}: ${t("high awareness risk", "risiko awareness tinggi")}`,
            body: t(
              "Assign a focused refresher to address current knowledge gaps.",
              "Tugaskan materi pengulangan untuk mengatasi kesenjangan pengetahuan.",
            ),
            link: `/admin/campaigns/new?department=${encodeURIComponent(x.department)}`,
            label: t("Assign learning", "Tugaskan materi"),
          })),
        ...(d.summary.clicked
          ? [
              {
                title: `${d.summary.clicked} ${t("simulation links were clicked", "tautan simulasi diklik")}`,
                body: t(
                  "Review behavior alongside reporting, without penalizing individuals.",
                  "Tinjau perilaku bersama pelaporan, tanpa menghukum individu.",
                ),
                link: "/admin/awareness",
                label: t("Review signals", "Tinjau sinyal"),
              },
            ]
          : []),
        ...(!d.summary.assigned
          ? [
              {
                title: t(
                  "Start your first awareness program",
                  "Mulai program awareness pertama",
                ),
                body: t(
                  "Select employees, choose learning and establish your baseline.",
                  "Pilih karyawan, materi, dan ukur kondisi awal.",
                ),
                link: "/admin/campaigns/new",
                label: t("Create campaign", "Buat kampanye"),
              },
            ]
          : []),
        ...(d.risk.find((x: any) => x.label === "Unmeasured")?.count
          ? [
              {
                title: `${d.risk.find((x: any) => x.label === "Unmeasured").count} ${t("employees need a first measurement", "karyawan memerlukan pengukuran awal")}`,
                body: t(
                  "A baseline assessment establishes evidence before learning.",
                  "Asesmen awal memberikan bukti sebelum pembelajaran.",
                ),
                link: "/admin/employees?risk=Unmeasured",
                label: t("View people", "Lihat karyawan"),
              },
            ]
          : []),
      ]
    : [];
  return (
    <>
      <PageTitle
        eyebrow={t("SECURITY WORKSPACE", "RUANG KEAMANAN")}
        title={t("Overview", "Ringkasan")}
        description={t(
          "Your organization’s awareness health, and where to act next.",
          "Kondisi awareness organisasi dan tindakan berikutnya.",
        )}
        actions={
          <>
            <Download path="/exports/pdf?period=30">
              {t("Download report", "Unduh laporan")}
            </Download>
            <ActionLink to="/admin/campaigns/new">
              {t("Create campaign", "Buat kampanye")}
            </ActionLink>
          </>
        }
      />
      <Loading resource={r}>
        {d && (
          <>
            <Metrics s={d.summary} />
            <div className="split">
              <section className="sheet">
                <div className="section-head">
                  <div>
                    <h2>
                      {t(
                        "What needs attention today?",
                        "Apa yang perlu diperhatikan hari ini?",
                      )}
                    </h2>
                    <p>
                      {t(
                        "Priorities from your organization’s actual activity.",
                        "Prioritas dari aktivitas aktual organisasi.",
                      )}
                    </p>
                  </div>
                </div>
                <div className="priority-list">
                  {priorities.length ? (
                    priorities.map((p, i) => (
                      <article className="priority" key={p.title}>
                        <span>{String(i + 1).padStart(2, "0")}</span>
                        <div>
                          <h3>{p.title}</h3>
                          <p>{p.body}</p>
                        </div>
                        <Link to={p.link}>
                          {p.label}
                          <ArrowUpRight size={13} />
                        </Link>
                      </article>
                    ))
                  ) : (
                    <Empty
                      title={t(
                        "No outstanding priorities",
                        "Tidak ada prioritas tertunda",
                      )}
                      description={t(
                        "Continue monitoring learning and the next measurement.",
                        "Pantau pembelajaran dan pengukuran berikutnya.",
                      )}
                    />
                  )}
                </div>
              </section>
              <RiskDistribution data={d} />
            </div>
            <section className="section">
              <div className="section-head">
                <div>
                  <h2>{t("Current programs", "Program saat ini")}</h2>
                  <p>
                    {t(
                      "Participation and completion are measured separately.",
                      "Partisipasi dan penyelesaian diukur secara terpisah.",
                    )}
                  </p>
                </div>
                <Link to="/admin/campaigns">
                  {t("All campaigns", "Semua kampanye")} →
                </Link>
              </div>
              {campaigns.data?.campaigns.length ? (
                <CampaignTable
                  campaigns={campaigns.data.campaigns.slice(0, 4)}
                />
              ) : (
                <Empty
                  title={t(
                    "No programs launched yet",
                    "Belum ada program yang diluncurkan",
                  )}
                  description={t(
                    "Create an awareness program to assign learning and measure improvement.",
                    "Buat program awareness untuk menugaskan pembelajaran dan mengukur peningkatan.",
                  )}
                  action={
                    <ActionLink to="/admin/campaigns/new">
                      {t("Create campaign", "Buat kampanye")}
                    </ActionLink>
                  }
                />
              )}
            </section>
            <div className="metric-grid section">
              <Metric
                label={t("Participation", "Partisipasi")}
                value={value(d.summary.participation, "%")}
                note={t(
                  "Assigned employees who started",
                  "Karyawan yang mulai mengerjakan",
                )}
              />
              <Metric
                label={t("Reporting rate", "Tingkat pelaporan")}
                value={value(d.summary.reportingRate, "%")}
                note={t(
                  "Reported / delivered simulations",
                  "Dilaporkan / simulasi terkirim",
                )}
              />
              <Metric
                label={t("Simulation click rate", "Tingkat klik simulasi")}
                value={value(d.summary.clickRate, "%")}
                note={t(
                  "Clicked / delivered simulations",
                  "Diklik / simulasi terkirim",
                )}
              />
              <Metric
                label={t("Evidence coverage", "Cakupan bukti")}
                value={value(d.summary.coverage, "%")}
                note={t(
                  "Employees with measured signals",
                  "Karyawan dengan sinyal terukur",
                )}
              />
            </div>
          </>
        )}
      </Loading>
    </>
  );
}
function CampaignTable({ campaigns }: { campaigns: any[] }) {
  const { t } = useLocale();
  const date = useDate();
  return (
    <div className="table-wrap">
      <table>
        <thead>
          <tr>
            <th>{t("Campaign", "Kampanye")}</th>
            <th>{t("Status", "Status")}</th>
            <th>{t("Audience", "Audiens")}</th>
            <th>{t("Participation", "Partisipasi")}</th>
            <th>{t("Completion", "Penyelesaian")}</th>
            <th className="secondary-column">
              {t("Improvement", "Peningkatan")}
            </th>
          </tr>
        </thead>
        <tbody>
          {campaigns.map((c) => (
            <tr key={c.id}>
              <td>
                <Link to={`/admin/campaigns/${c.id}`}>{c.name}</Link>
                <small>
                  {date(c.start_at)} – {date(c.due_at)}
                </small>
              </td>
              <td>
                <Status value={c.status} />
              </td>
              <td>
                {c.userIds.length} {t("employees", "karyawan")}
              </td>
              <td>{value(c.summary.participation, "%")}</td>
              <td>
                <Progress value={c.summary.assignmentCompletion} />
              </td>
              <td className="secondary-column">
                {c.improvement === null
                  ? "—"
                  : `${c.improvement > 0 ? "+" : ""}${c.improvement}`}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
export function Campaigns() {
  const r = useData("/campaigns");
  const { t } = useLocale();
  const [status, setStatus] = useState("All");
  const [search, setSearch] = useState("");
  const [templates, setTemplates] = useState(false);
  const rows =
    r.data?.campaigns.filter(
      (c: any) =>
        (status === "All" || c.status === status) &&
        c.name.toLowerCase().includes(search.toLowerCase()),
    ) || [];
  return (
    <>
      <PageTitle
        title={t("Campaigns", "Kampanye")}
        description={t(
          "Plan, run and evaluate your awareness programs.",
          "Rencanakan, jalankan, dan evaluasi program awareness.",
        )}
        actions={
          <>
            <Link className="btn secondary" to="/admin/human-risk/autopilot">
              Continuous programs
            </Link>
            <Button variant="secondary" onClick={() => setTemplates(true)}>
              {t("Use a template", "Gunakan templat")}
            </Button>
            <ActionLink to="/admin/campaigns/new">
              {t("Create campaign", "Buat kampanye")}
            </ActionLink>
          </>
        }
      />
      <Tabs
        tabs={[
          "All",
          "Draft",
          "Scheduled",
          "Active",
          "Completed",
          "Archived",
        ].map((s) => [
          s,
          s === "All"
            ? t("All programs", "Semua program")
            : s === "Draft"
              ? t("Draft", "Draf")
              : s === "Scheduled"
                ? t("Scheduled", "Terjadwal")
                : s === "Active"
                  ? t("Active", "Aktif")
                  : s === "Completed"
                    ? t("Completed", "Selesai")
                    : t("Archived", "Diarsipkan"),
        ])}
        value={status}
        onChange={setStatus}
      />
      <div className="toolbar">
        <input
          aria-label={t("Search campaigns", "Cari kampanye")}
          placeholder={t("Search campaigns…", "Cari kampanye…")}
          value={search}
          onChange={(e) => setSearch(e.target.value)}
        />
        <label className="check">
          <input
            type="checkbox"
            checked={status === "Cancelled"}
            onChange={(e) => setStatus(e.target.checked ? "Cancelled" : "All")}
          />
          {t("Cancelled programs", "Program dibatalkan")}
        </label>
        <span>
          {rows.length} {t("programs", "program")}
        </span>
      </div>
      <Loading resource={r}>
        {rows.length ? (
          <CampaignTable campaigns={rows} />
        ) : (
          <Empty
            title={t(
              "No campaigns in this view",
              "Tidak ada kampanye pada tampilan ini",
            )}
            description={t(
              "Adjust the filters or create your first awareness program.",
              "Ubah filter atau buat program awareness pertama.",
            )}
            action={
              <ActionLink to="/admin/campaigns/new">
                {t("Create campaign", "Buat kampanye")}
              </ActionLink>
            }
          />
        )}
      </Loading>
      {templates && (
        <Dialog
          title={t("Campaign templates", "Templat kampanye")}
          onClose={() => setTemplates(false)}
        >
          <Templates />
        </Dialog>
      )}
    </>
  );
}
const templateNames = [
  [
    "New Employee Security Onboarding",
    "Orientasi Keamanan Karyawan Baru",
    "Account Security",
  ],
  ["Quarterly Security Awareness", "Awareness Keamanan Triwulanan", "Phishing"],
  ["Phishing Resilience", "Ketahanan Phishing", "Phishing"],
  [
    "Password Security Refresh",
    "Penyegaran Keamanan Kata Sandi",
    "Account Security",
  ],
  [
    "Business Email Compromise Awareness",
    "Awareness Kompromi Email Bisnis",
    "Email Security",
  ],
  ["Remote Work Security", "Keamanan Kerja Jarak Jauh", "Workplace Security"],
];
function Templates() {
  const { t } = useLocale();
  const navigate = useNavigate();
  return (
    <div className="template-list">
      {templateNames.map(([en, id, topic], i) => (
        <button
          key={en}
          onClick={() => navigate(`/admin/campaigns/new?template=${i}`)}
        >
          <strong>{t(en, id)}</strong>
          <small>
            {topic} ·{" "}
            {t(
              "Customize audience and schedule",
              "Sesuaikan audiens dan jadwal",
            )}
          </small>
        </button>
      ))}
    </div>
  );
}
export function CampaignBuilder() {
  const localInput = (value: string | null) => {
    if (!value) return "";
    const date = new Date(value);
    return new Date(date.getTime() - date.getTimezoneOffset() * 60000)
      .toISOString()
      .slice(0, 16);
  };
  const { id } = useParams();
  const { user } = useAuth();
  const { t } = useLocale();
  const navigate = useNavigate();
  const [params] = useSearchParams();
  const people = useData("/people");
  const library = useData("/courses");
  const groups = useData("/groups");
  const [groupId, setGroupId] = useState("");
  const existing = useData(id ? `/campaigns/${id}` : "/campaigns");
  const [step, setStep] = useState(0);
  const [error, setError] = useState<unknown>(null);
  const [busy, setBusy] = useState(false);
  const [preview, setPreview] = useState(false);
  const [mode, setMode] = useState(params.has("employee") ? "selected" : "all");
  const [dept, setDept] = useState(params.get("department") || "");
  const template = templateNames[Number(params.get("template"))];
  const [form, setForm] = useState({
    name: params.has("template")
      ? t(template?.[0] || "", template?.[1] || "")
      : "",
    objective: "",
    ownerId: user?.id || "",
    userIds: params.has("employee")
      ? [params.get("employee")!]
      : ([] as string[]),
    courseIds: [] as string[],
    startAt: "",
    dueAt: "",
    baseline: true,
    followup: true,
    simulation: "",
    reminders: true,
    version: undefined as number | undefined,
  });
  useEffect(() => {
    if (id && existing.data?.campaign) {
      const c = existing.data.campaign;
      setForm({
        name: c.name,
        objective: c.objective,
        ownerId: c.owner_id,
        userIds: c.userIds,
        courseIds: c.courses.map((x: any) => x.id),
        startAt: localInput(c.start_at),
        dueAt: localInput(c.due_at),
        baseline: Boolean(c.baseline),
        followup: Boolean(c.followup),
        simulation: c.simulation || "",
        reminders: Boolean(c.reminders),
        version: c.version,
      });
      setMode("selected");
    }
  }, [id, existing.data]);
  const employees = (people.data?.people || []).filter(
    (u: any) => u.role === "employee" && u.active,
  );
  const departments = [
    ...new Set<string>(employees.map((u: any) => u.department)),
  ];
  const audience =
    mode === "all"
      ? employees
      : mode === "department"
        ? employees.filter((u: any) => u.department === dept)
        : mode === "group"
          ? employees.filter((u: any) =>
              groups.data?.groups
                .find((g: any) => g.id === groupId)
                ?.userIds.includes(u.id),
            )
          : employees.filter((u: any) => form.userIds.includes(u.id));
  const courses = (library.data?.courses || []).filter(
    (c: any) => c.status === "Published",
  );
  useEffect(() => {
    if (params.has("department")) setMode("department");
  }, [params]);
  useEffect(() => {
    if (params.has("template") && courses.length && !form.courseIds.length)
      setForm((f) => ({
        ...f,
        courseIds: courses
          .filter((c: any) => c.document.category === template?.[2])
          .map((c: any) => c.id),
      }));
  }, [library.data]);
  const set = (key: string, v: any) => setForm((f) => ({ ...f, [key]: v }));
  const toggle = (key: "userIds" | "courseIds", v: string) =>
    set(
      key,
      form[key].includes(v)
        ? form[key].filter((x) => x !== v)
        : [...form[key], v],
    );
  const selected = courses.filter((c: any) => form.courseIds.includes(c.id));
  const duration = selected.reduce(
    (n: number, c: any) => n + c.document.duration,
    0,
  );
  const canLaunch = user?.role !== "manager";
  const save = async (launch: boolean) => {
    setBusy(true);
    setError(null);
    try {
      const payload = {
        ...form,
        userIds: audience.map((u: any) => u.id),
        startAt: form.startAt ? new Date(form.startAt).toISOString() : null,
        dueAt: form.dueAt ? new Date(form.dueAt).toISOString() : null,
        simulation: form.simulation || null,
      };
      const saved = await mutate<{ id: string }>(
        id ? `/campaigns/${id}` : "/campaigns",
        payload,
        id ? "PUT" : "POST",
      );
      if (launch) {
        const current = await apiRequest<any>(
          `/api/workspace/campaigns/${saved.id}`,
        );
        await mutate(`/campaigns/${saved.id}/action`, {
          action: "launch",
          version: current.campaign.version,
        });
      }
      navigate(`/admin/campaigns/${saved.id}`);
    } catch (e) {
      setError(e);
    } finally {
      setBusy(false);
    }
  };
  const valid = [
    form.name.trim().length >= 3 && form.objective.trim().length >= 3,
    audience.length > 0,
    form.courseIds.length > 0,
    true,
    Boolean(form.dueAt) && new Date(form.dueAt) > new Date(),
  ][step];
  return (
    <div className="builder">
      <Link className="text-link" to="/admin/campaigns">
        ← {t("Campaigns", "Kampanye")}
      </Link>
      <PageTitle
        title={
          id
            ? t("Edit campaign", "Edit kampanye")
            : t("Create campaign", "Buat kampanye")
        }
        description={t(
          "A focused program, from audience to measurable improvement.",
          "Program terarah, dari audiens hingga peningkatan terukur.",
        )}
      />
      <ol className="builder-steps">
        {[
          t("Basics", "Dasar"),
          t("Audience", "Audiens"),
          t("Learning", "Pembelajaran"),
          t("Measurement", "Pengukuran"),
          t("Schedule & review", "Jadwal & tinjauan"),
        ].map((s, i) => (
          <li
            key={s}
            className={step === i ? "active" : ""}
            aria-current={step === i ? "step" : undefined}
          >
            {s}
          </li>
        ))}
      </ol>
      <ErrorNotice error={error} />
      <Loading resource={people}>
        <Loading resource={library}>
          <div className="sheet">
            {step === 0 && (
              <>
                <h2>
                  {t(
                    "What should this program achieve?",
                    "Apa tujuan program ini?",
                  )}
                </h2>
                <div className="section">
                  <Field label={t("Campaign name", "Nama kampanye")}>
                    <input
                      value={form.name}
                      onChange={(e) => set("name", e.target.value)}
                      required
                      minLength={3}
                    />
                  </Field>
                  <Field label={t("Objective", "Tujuan")}>
                    <textarea
                      value={form.objective}
                      onChange={(e) => set("objective", e.target.value)}
                      placeholder={t(
                        "For example: improve phishing recognition in Finance.",
                        "Contoh: meningkatkan pengenalan phishing di Finance.",
                      )}
                      required
                    />
                  </Field>
                  <Field label={t("Owner", "Penanggung jawab")}>
                    <select
                      value={form.ownerId}
                      onChange={(e) => set("ownerId", e.target.value)}
                    >
                      {people.data?.people
                        .filter((p: any) => p.role !== "employee" && p.active)
                        .map((p: any) => (
                          <option key={p.id} value={p.id}>
                            {p.name}
                          </option>
                        ))}
                      {user?.role === "manager" && (
                        <option value={user.id}>{user.name}</option>
                      )}
                    </select>
                  </Field>
                </div>
              </>
            )}
            {step === 1 && (
              <>
                <h2>
                  {t(
                    "Who needs this learning?",
                    "Siapa yang membutuhkan pembelajaran ini?",
                  )}
                </h2>
                <div className="section">
                  <Field label={t("Select audience", "Pilih audiens")}>
                    <select
                      value={mode}
                      onChange={(e) => setMode(e.target.value)}
                    >
                      <option value="all">
                        {t("All employees", "Semua karyawan")}
                      </option>
                      <option value="department">
                        {t("Department", "Departemen")}
                      </option>
                      <option value="selected">
                        {t("Selected employees", "Karyawan terpilih")}
                      </option>
                      <option value="group">{t("Group", "Kelompok")}</option>
                    </select>
                  </Field>
                  {mode === "department" && (
                    <Field label={t("Department", "Departemen")}>
                      <select
                        value={dept}
                        onChange={(e) => setDept(e.target.value)}
                      >
                        <option value="">
                          {t("Choose department", "Pilih departemen")}
                        </option>
                        {departments.map((d) => (
                          <option key={d}>{d}</option>
                        ))}
                      </select>
                    </Field>
                  )}
                  {mode === "group" && (
                    <>
                      <ErrorNotice error={groups.error} retry={groups.reload} />
                      <Field label={t("Group", "Kelompok")}>
                        <select
                          value={groupId}
                          onChange={(e) => setGroupId(e.target.value)}
                        >
                          <option value="">
                            {t("Choose a group", "Pilih kelompok")}
                          </option>
                          {groups.data?.groups.map((g: any) => (
                            <option value={g.id} key={g.id}>
                              {g.name} ({g.userIds.length})
                            </option>
                          ))}
                        </select>
                      </Field>
                      <small>
                        {t(
                          "Manage reusable groups in People. The audience is captured when saved.",
                          "Kelola kelompok di Karyawan. Audiens disalin saat disimpan.",
                        )}
                      </small>
                    </>
                  )}
                  {mode === "selected" &&
                    employees.map((u: any) => (
                      <label className="check" key={u.id}>
                        <input
                          type="checkbox"
                          checked={form.userIds.includes(u.id)}
                          onChange={() => toggle("userIds", u.id)}
                        />
                        <span>
                          {u.name}
                          <small>
                            {u.department} · {u.email}
                          </small>
                        </span>
                      </label>
                    ))}
                  <div className="row">
                    <div>
                      <strong>
                        {audience.length}{" "}
                        {t("employees selected", "karyawan dipilih")}
                      </strong>
                      <small>
                        {t(
                          "Only active employee accounts receive assignments.",
                          "Hanya akun karyawan aktif yang menerima tugas.",
                        )}
                      </small>
                    </div>
                    <Button
                      variant="secondary"
                      onClick={() => setPreview(true)}
                    >
                      {t("Preview audience", "Pratinjau audiens")}
                    </Button>
                  </div>
                </div>
              </>
            )}
            {step === 2 && (
              <>
                <div className="builder-section-heading">
                  <div>
                    <h2>{t("Choose learning", "Pilih pembelajaran")}</h2>
                    <p>{t("Select one or more published modules for this campaign.", "Pilih satu atau beberapa modul terbit untuk kampanye ini.")}</p>
                  </div>
                  <strong className="builder-total">{duration} {t("min total", "mnt total")}</strong>
                </div>
                {courses.length ? (
                  <div className="campaign-learning-grid">
                    {courses.map((c: any) => (
                      <label className={`campaign-learning-card ${form.courseIds.includes(c.id) ? "selected" : ""}`} key={c.id}>
                        <input
                          type="checkbox"
                          checked={form.courseIds.includes(c.id)}
                          onChange={() => toggle("courseIds", c.id)}
                        />
                        <div className="campaign-learning-card-main">
                          <div className="campaign-learning-card-top">
                            <span className="learning-origin">{c.isDefault ? t("AVERIS default", "Default AVERIS") : t("Created by your team", "Dibuat tim Anda")}</span>
                            <Status value={c.document.difficulty} />
                          </div>
                          <h3>{c.document.title}</h3>
                          <p>{c.document.description}</p>
                          <div className="campaign-learning-meta">
                            <span>{c.document.category}</span>
                            <span>{c.document.duration} {t("min", "menit")}</span>
                            <span>{t("Pass", "Lulus")} {c.document.passingScore}%</span>
                          </div>
                        </div>
                      </label>
                    ))}
                  </div>
                ) : (
                  <Empty
                    title={t(
                      "Publish learning first",
                      "Terbitkan materi terlebih dahulu",
                    )}
                    description={t(
                      "Only published learning can be assigned.",
                      "Hanya materi terbit yang dapat ditugaskan.",
                    )}
                    action={
                      <ActionLink to="/admin/learning/new">
                        {t("Create learning", "Buat materi")}
                      </ActionLink>
                    }
                  />
                )}
              </>
            )}
            {step === 3 && (
              <>
                <h2>{t("Measure change", "Ukur perubahan")}</h2>
                <label className="check">
                  <input
                    type="checkbox"
                    checked={form.baseline}
                    onChange={(e) => set("baseline", e.target.checked)}
                  />
                  <span>
                    {t("Baseline assessment", "Asesmen awal")}
                    <small>
                      {t(
                        "Measure knowledge before learning begins.",
                        "Ukur pengetahuan sebelum pembelajaran dimulai.",
                      )}
                    </small>
                  </span>
                </label>
                <label className="check">
                  <input
                    type="checkbox"
                    checked={form.followup}
                    onChange={(e) => set("followup", e.target.checked)}
                  />
                  <span>
                    {t("Follow-up assessment", "Asesmen tindak lanjut")}
                    <small>
                      {t(
                        "Measure the change after all required learning is complete.",
                        "Ukur perubahan setelah seluruh materi wajib selesai.",
                      )}
                    </small>
                  </span>
                </label>
                <Field
                  label={t(
                    "Optional phishing simulation",
                    "Simulasi phishing opsional",
                  )}
                  hint={t(
                    "Measures recognition and reporting. Never collects passwords.",
                    "Mengukur pengenalan dan pelaporan. Tidak mengumpulkan kata sandi.",
                  )}
                >
                  <select
                    value={form.simulation}
                    onChange={(e) => set("simulation", e.target.value)}
                  >
                    <option value="">
                      {t("No simulation", "Tanpa simulasi")}
                    </option>
                    {[
                      "Password Expiration",
                      "Shared Document",
                      "Delivery Notification",
                      "Account Security Alert",
                      "Payroll / HR Notice",
                    ].map((s) => (
                      <option key={s}>{s}</option>
                    ))}
                  </select>
                </Field>
                {form.simulation && (
                  <div className="notice">
                    {t(
                      "Email delivery must be configured before participants can receive the exercise.",
                      "Pengiriman email perlu dikonfigurasi agar peserta menerima latihan.",
                    )}
                  </div>
                )}
              </>
            )}
            {step === 4 && (
              <>
                <h2>
                  {t("Schedule and final review", "Jadwal dan tinjauan akhir")}
                </h2>
                <div className="form-grid section">
                  <Field
                    label={t(
                      "Start (leave empty to start now)",
                      "Mulai (kosongkan untuk mulai sekarang)",
                    )}
                  >
                    <input
                      type="datetime-local"
                      value={form.startAt}
                      onChange={(e) => set("startAt", e.target.value)}
                    />
                  </Field>
                  <Field label={t("Deadline", "Tenggat")}>
                    <input
                      required
                      type="datetime-local"
                      value={form.dueAt}
                      onChange={(e) => set("dueAt", e.target.value)}
                    />
                  </Field>
                </div>
                <label className="check">
                  <input
                    type="checkbox"
                    checked={form.reminders}
                    onChange={(e) => set("reminders", e.target.checked)}
                  />
                  <span>
                    {t("Send due reminders", "Kirim pengingat tenggat")}
                    <small>
                      {t(
                        "Reminders are sent during the final three days.",
                        "Pengingat dikirim selama tiga hari terakhir.",
                      )}
                    </small>
                  </span>
                </label>
                <dl className="review-grid">
                  <div>
                    <dt>{t("Campaign", "Kampanye")}</dt>
                    <dd>{form.name}</dd>
                  </div>
                  <div>
                    <dt>{t("Audience", "Audiens")}</dt>
                    <dd>
                      {audience.length} {t("employees", "karyawan")}
                    </dd>
                  </div>
                  <div>
                    <dt>{t("Learning", "Pembelajaran")}</dt>
                    <dd>
                      {selected.map((c: any) => c.document.title).join(", ")} ·{" "}
                      {duration} {t("min", "menit")}
                    </dd>
                  </div>
                  <div>
                    <dt>{t("Assessment", "Asesmen")}</dt>
                    <dd>
                      {[
                        form.baseline ? t("Baseline", "Awal") : null,
                        form.followup ? t("Follow-up", "Tindak lanjut") : null,
                      ]
                        .filter(Boolean)
                        .join(" + ") || t("None", "Tidak ada")}
                    </dd>
                  </div>
                  <div>
                    <dt>{t("Simulation", "Simulasi")}</dt>
                    <dd>{form.simulation || t("None", "Tidak ada")}</dd>
                  </div>
                  <div>
                    <dt>{t("Notification plan", "Rencana notifikasi")}</dt>
                    <dd>
                      {t(
                        "Assignment on launch, completion and certificate notifications.",
                        "Notifikasi tugas saat peluncuran, penyelesaian, dan sertifikat.",
                      )}
                    </dd>
                  </div>
                </dl>
              </>
            )}
            <div className="builder-footer">
              <Button
                variant="secondary"
                disabled={step === 0 || busy}
                onClick={() => setStep(step - 1)}
              >
                {t("Back", "Kembali")}
              </Button>
              <div className="actions">
                <Button
                  variant="quiet"
                  disabled={
                    busy ||
                    form.name.trim().length < 3 ||
                    form.objective.trim().length < 3
                  }
                  onClick={() => void save(false)}
                >
                  {t("Save draft", "Simpan draf")}
                </Button>
                {step < 4 ? (
                  <Button disabled={!valid} onClick={() => setStep(step + 1)}>
                    {t("Continue", "Lanjutkan")}
                    <ArrowRight size={14} />
                  </Button>
                ) : (
                  <Button
                    disabled={!valid || busy}
                    onClick={() => void save(canLaunch && !id)}
                  >
                    {busy
                      ? t("Saving…", "Menyimpan…")
                      : id
                        ? t("Save changes", "Simpan perubahan")
                        : canLaunch
                          ? t("Publish campaign", "Terbitkan kampanye")
                          : t(
                              "Save for admin review",
                              "Simpan untuk tinjauan admin",
                            )}
                  </Button>
                )}
              </div>
            </div>
          </div>
        </Loading>
      </Loading>
      {preview && (
        <Dialog
          title={`${audience.length} ${t("employees", "karyawan")}`}
          onClose={() => setPreview(false)}
        >
          {audience.map((u: any) => (
            <div className="row" key={u.id}>
              <div>
                <strong>{u.name}</strong>
                <small>{u.email}</small>
              </div>
              <span>{u.department}</span>
            </div>
          ))}
        </Dialog>
      )}
    </div>
  );
}
export function CampaignDetail() {
  const { id } = useParams();
  const r = useData(`/campaigns/${id}`);
  const { t } = useLocale();
  const { user } = useAuth();
  const date = useDate();
  const [tab, setTab] = useState("overview");
  const c = r.data?.campaign;
  const canManage = user?.role !== "manager";
  const action = async (a: string) => {
    await mutate(`/campaigns/${id}/action`, { action: a, version: c.version });
    r.reload();
  };
  return (
    <Loading resource={r}>
      {c && (
        <>
          <Link to="/admin/campaigns" className="text-link">
            ← {t("Campaigns", "Kampanye")}
          </Link>
          <PageTitle
            title={c.name}
            description={`${date(c.start_at)} – ${date(c.due_at)} · ${c.userIds.length} ${t("employees", "karyawan")}`}
            actions={
              <>
                <Status value={c.status} />
                {canManage && ["Draft", "Scheduled"].includes(c.status) && (
                  <ActionLink secondary to={`/admin/campaigns/${id}/edit`}>
                    {t("Edit", "Edit")}
                  </ActionLink>
                )}
                {canManage && c.status === "Draft" && (
                  <ConfirmButton
                    title={t("Launch campaign?", "Luncurkan kampanye?")}
                    description={t(
                      "Assignments and participant notifications will be created.",
                      "Tugas dan notifikasi peserta akan dibuat.",
                    )}
                    onConfirm={() => action("launch")}
                  >
                    {t("Launch", "Luncurkan")}
                  </ConfirmButton>
                )}
                {canManage && c.status === "Scheduled" && (
                  <ConfirmButton
                    title={t("Return to draft?", "Kembalikan ke draf?")}
                    description={t(
                      "The scheduled launch will be stopped.",
                      "Peluncuran terjadwal akan dihentikan.",
                    )}
                    onConfirm={() => action("draft")}
                  >
                    {t("Return to draft", "Kembalikan ke draf")}
                  </ConfirmButton>
                )}
                {canManage && ["Draft", "Scheduled"].includes(c.status) && (
                  <ConfirmButton
                    title={t("Cancel campaign?", "Batalkan kampanye?")}
                    description={t(
                      "This program will no longer launch.",
                      "Program ini tidak akan diluncurkan.",
                    )}
                    onConfirm={() => action("cancel")}
                  >
                    {t("Cancel", "Batalkan")}
                  </ConfirmButton>
                )}
                {canManage && c.status === "Active" && (
                  <>
                    <ConfirmButton
                      title={t("Send reminder?", "Kirim pengingat?")}
                      description={t(
                        "Participants with unfinished learning receive one reminder per day.",
                        "Peserta dengan tugas tertunda menerima satu pengingat per hari.",
                      )}
                      onConfirm={() => action("remind")}
                    >
                      {t("Send reminder", "Kirim pengingat")}
                    </ConfirmButton>
                    <ConfirmButton
                      title={t("End campaign?", "Akhiri kampanye?")}
                      description={t(
                        "Participants will no longer be able to submit learning. Evidence is retained.",
                        "Peserta tidak dapat mengirim pembelajaran lagi. Bukti tetap disimpan.",
                      )}
                      onConfirm={() => action("end")}
                    >
                      {t("End campaign", "Akhiri kampanye")}
                    </ConfirmButton>
                  </>
                )}
                {c.status === "Completed" && (
                  <>
                    <Download
                      path={`/exports/pdf?category=Campaign&period=all&campaignId=${id}`}
                    >
                      PDF
                    </Download>
                    {canManage && (
                      <ConfirmButton
                        title={t("Archive campaign?", "Arsipkan kampanye?")}
                        description={t(
                          "Historical results remain available.",
                          "Hasil historis tetap tersedia.",
                        )}
                        onConfirm={() => action("archive")}
                      >
                        {t("Archive", "Arsipkan")}
                      </ConfirmButton>
                    )}
                  </>
                )}
              </>
            }
          />
          <p>{c.objective}</p>
          <div className="section">
            <Metrics s={c.summary} />
          </div>
          <Tabs
            value={tab}
            onChange={setTab}
            tabs={[
              ["overview", t("Overview", "Ringkasan")],
              ["people", t("Participants", "Peserta")],
              ["learning", t("Learning", "Pembelajaran")],
              ["assessment", t("Assessment", "Asesmen")],
              ["simulation", t("Simulation", "Simulasi")],
              ["activity", t("Activity", "Aktivitas")],
            ]}
          />
          {tab === "overview" && (
            <div className="split">
              <div className="sheet">
                <h2>{t("Progress and results", "Progres dan hasil")}</h2>
                <div className="row">
                  <span>{t("Participation", "Partisipasi")}</span>
                  <strong>{value(c.summary.participation, "%")}</strong>
                </div>
                <div className="row">
                  <span>
                    {t("Assignment completion", "Penyelesaian tugas")}
                  </span>
                  <strong>{value(c.summary.assignmentCompletion, "%")}</strong>
                </div>
                <div className="row">
                  <span>{t("Quiz pass rate", "Kelulusan kuis")}</span>
                  <strong>{value(c.summary.quizPassRate, "%")}</strong>
                </div>
                <div className="row">
                  <span>{t("Overdue activities", "Aktivitas terlambat")}</span>
                  <strong>{c.summary.overdue}</strong>
                </div>
              </div>
              <div className="sheet">
                <h2>{t("Measured improvement", "Peningkatan terukur")}</h2>
                <div className="row">
                  <span>{t("Before learning", "Sebelum belajar")}</span>
                  <strong>{value(c.before)}</strong>
                </div>
                <div className="row">
                  <span>{t("After learning", "Setelah belajar")}</span>
                  <strong>{value(c.after)}</strong>
                </div>
                <div className="row">
                  <span>{t("Change", "Perubahan")}</span>
                  <strong>
                    {c.improvement === null
                      ? "—"
                      : `${c.improvement > 0 ? "+" : ""}${c.improvement}`}
                  </strong>
                </div>
                <small>
                  {t(
                    "Comparison becomes available after baseline and follow-up are completed.",
                    "Perbandingan tersedia setelah asesmen awal dan tindak lanjut selesai.",
                  )}
                </small>
              </div>
            </div>
          )}
          {tab === "people" && <PeopleTable people={c.users} />}
          {tab === "learning" && (
            <div className="sheet">
              {c.courses.map((r: any) => (
                <div className="row" key={r.id}>
                  <div>
                    <strong>{r.document.title}</strong>
                    <small>
                      {r.document.duration} {t("min", "menit")} ·{" "}
                      {t("Version", "Versi")} {r.version}
                    </small>
                  </div>
                  <Progress
                    value={
                      c.assignments.filter((a: any) => a.revision_id === r.id)
                        .length
                        ? Math.round(
                            (c.assignments.filter(
                              (a: any) =>
                                a.revision_id === r.id &&
                                a.status === "Completed",
                            ).length /
                              c.assignments.filter(
                                (a: any) => a.revision_id === r.id,
                              ).length) *
                              100,
                          )
                        : null
                    }
                  />
                </div>
              ))}
            </div>
          )}
          {tab === "assessment" && (
            <div className="table-wrap">
              <table>
                <thead>
                  <tr>
                    <th>{t("Employee", "Karyawan")}</th>
                    <th>{t("Assessment", "Asesmen")}</th>
                    <th>{t("Score", "Nilai")}</th>
                    <th>{t("Completed", "Selesai")}</th>
                  </tr>
                </thead>
                <tbody>
                  {c.assessments.map((a: any) => (
                    <tr key={a.id}>
                      <td>
                        {c.users.find((u: any) => u.id === a.user_id)?.name}
                      </td>
                      <td>
                        <Status value={a.kind} />
                      </td>
                      <td>{value(a.score)}</td>
                      <td>{date(a.completed_at)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
              {!c.assessments.length && (
                <Empty
                  title={t(
                    "No assessments assigned",
                    "Belum ada asesmen ditugaskan",
                  )}
                  description={t(
                    "Assessments are created when a configured campaign launches.",
                    "Asesmen dibuat ketika kampanye yang dikonfigurasi diluncurkan.",
                  )}
                />
              )}
            </div>
          )}
          {tab === "simulation" &&
            (c.simulation ? (
              <>
                <div className="section-head">
                  <h2>{c.simulation}</h2>
                  <small>
                    {t(
                      "No real credentials are collected.",
                      "Tidak mengumpulkan kredensial nyata.",
                    )}
                  </small>
                </div>
                <div className="metric-grid">
                  <Metric
                    label={t("Delivered", "Terkirim")}
                    value={c.summary.delivered}
                  />
                  <Metric
                    label={t("Opened", "Dibuka")}
                    value={c.summary.opened}
                  />
                  <Metric
                    label={t("Clicked", "Diklik")}
                    value={c.summary.clicked}
                  />
                  <Metric
                    label={t("Reported", "Dilaporkan")}
                    value={c.summary.reported}
                  />
                </div>
                <div className="sheet">
                  <div className="row">
                    <span>{t("Click rate", "Tingkat klik")}</span>
                    {value(c.summary.clickRate, "%")}
                  </div>
                  <div className="row">
                    <span>{t("Reporting rate", "Tingkat pelaporan")}</span>
                    {value(c.summary.reportingRate, "%")}
                  </div>
                  <div className="row">
                    <span>
                      {t("Average time to report", "Rata-rata waktu pelaporan")}
                    </span>
                    {value(c.summary.reportMinutes)} {t("min", "menit")}
                  </div>
                  <div className="row">
                    <span>{t("No action", "Tanpa tindakan")}</span>
                    {c.summary.noAction}
                  </div>
                  <small>
                    {t(
                      "Delivery counts reflect successful email delivery, not the target audience.",
                      "Jumlah terkirim berasal dari pengiriman email berhasil, bukan jumlah target.",
                    )}
                  </small>
                </div>
              </>
            ) : (
              <Empty
                title={t(
                  "No simulation attached",
                  "Tidak ada simulasi terlampir",
                )}
                description={t(
                  "This program measures knowledge through learning and assessments.",
                  "Program ini mengukur pengetahuan melalui pembelajaran dan asesmen.",
                )}
              />
            ))}
          {tab === "activity" && (
            <div className="sheet">
              <ul className="timeline">
                {c.activity.map((a: any, i: number) => (
                  <li key={i}>
                    <strong>{a.action}</strong>
                    <p>{date(a.created_at, true)}</p>
                    <details>
                      <summary>{t("Details", "Detail")}</summary>
                      <pre className="audit-details">
                        {JSON.stringify(a.metadata, null, 2)}
                      </pre>
                    </details>
                  </li>
                ))}
              </ul>
            </div>
          )}
        </>
      )}
    </Loading>
  );
}

export function PeopleTable({ people }: { people: any[] }) {
  const { t } = useLocale();
  const date = useDate();
  return (
    <div className="table-wrap">
      <table>
        <thead>
          <tr>
            <th>{t("Employee", "Karyawan")}</th>
            <th>{t("Department", "Departemen")}</th>
            <th>{t("Score", "Nilai")}</th>
            <th>{t("Risk", "Risiko")}</th>
            <th>{t("Learning", "Pembelajaran")}</th>
            <th>{t("Completion", "Penyelesaian")}</th>
            <th className="secondary-column">
              {t("Last activity", "Aktivitas terakhir")}
            </th>
          </tr>
        </thead>
        <tbody>
          {people.map((u) => (
            <tr key={u.id}>
              <td>
                <Link to={`/admin/employees/${u.id}`}>{u.name}</Link>
                <small>{u.email}</small>
              </td>
              <td>{u.department}</td>
              <td>{value(u.score)}</td>
              <td>
                <Status value={u.risk} />
              </td>
              <td>
                {u.completed}/{u.assigned}
              </td>
              <td>
                <Progress value={u.completion} />
              </td>
              <td className="secondary-column">{date(u.lastActivity)}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
export function People() {
  const r = useData("/people");
  const { t } = useLocale();
  const { user } = useAuth();
  const [params] = useSearchParams();
  const [search, setSearch] = useState("");
  const [dept, setDept] = useState("");
  const [risk, setRisk] = useState(params.get("risk") || "");
  const [status, setStatus] = useState(params.get("status") || "");
  const [add, setAdd] = useState(false);
  const [manageGroups, setManageGroups] = useState(false);
  const [importResult, setImportResult] = useState<any>(null);
  const [error, setError] = useState<unknown>(null);
  const canManage = user?.role !== "manager";
  const people = r.data?.people || [];
  const filtered = people.filter(
    (u: any) =>
      `${u.name} ${u.email}`.toLowerCase().includes(search.toLowerCase()) &&
      (!dept || u.department === dept) &&
      (!risk || u.risk === risk) &&
      (!status ||
        (status === "active"
          ? u.active
          : status === "inactive"
            ? !u.active
            : u.overdue > 0)),
  );
  return (
    <>
      <PageTitle
        title={t("People", "Karyawan")}
        description={t(
          "Understand individual risk, participation and learning needs.",
          "Pahami risiko, partisipasi, dan kebutuhan belajar setiap karyawan.",
        )}
        actions={
          canManage ? (
            <>
              <Button variant="secondary" onClick={() => setManageGroups(true)}>
                {t("Groups", "Kelompok")}
              </Button>
              <label className="btn secondary">
                {t("Import CSV", "Impor CSV")}
                <input
                  hidden
                  type="file"
                  accept=".csv"
                  onChange={async (e) => {
                    const file = e.target.files?.[0];
                    if (!file) return;
                    try {
                      const result = await mutate("/people/import", {
                        csv: await file.text(),
                      });
                      setImportResult(result);
                      r.reload();
                    } catch (e) {
                      setError(e);
                    }
                  }}
                />
              </label>
              <Button onClick={() => setAdd(true)}>
                <Plus size={15} />
                {t("Add employee", "Tambah karyawan")}
              </Button>
            </>
          ) : undefined
        }
      />
      <ErrorNotice error={error} />
      {importResult && (
        <div className="notice">
          {importResult.created.length}{" "}
          {t("invitations created", "undangan dibuat")} ·{" "}
          {importResult.errors.length}{" "}
          {t("rows need review", "baris perlu ditinjau")}
          {importResult.errors.map((e: any) => (
            <span key={e.row}>
              {t("Row", "Baris")} {e.row}:{" "}
              {e.code === "EMAIL_EXISTS"
                ? t("Email exists", "Email sudah ada")
                : t("Invalid format", "Format salah")}
            </span>
          ))}
        </div>
      )}
      <div className="toolbar">
        <input
          placeholder={t("Search name or email…", "Cari nama atau email…")}
          aria-label={t("Search people", "Cari karyawan")}
          value={search}
          onChange={(e) => setSearch(e.target.value)}
        />
        <select
          aria-label={t("Department", "Departemen")}
          value={dept}
          onChange={(e) => setDept(e.target.value)}
        >
          <option value="">{t("All departments", "Semua departemen")}</option>
          {[...new Set<string>(people.map((u: any) => u.department))].map(
            (d) => (
              <option key={d}>{d}</option>
            ),
          )}
        </select>
        <select
          aria-label={t("Risk", "Risiko")}
          value={risk}
          onChange={(e) => setRisk(e.target.value)}
        >
          <option value="">
            {t("All risk levels", "Semua tingkat risiko")}
          </option>
          <option value="High">{t("High", "Tinggi")}</option>
          <option value="Medium">{t("Medium", "Sedang")}</option>
          <option value="Low">{t("Low", "Rendah")}</option>
          <option value="Unmeasured">{t("Unmeasured", "Belum terukur")}</option>
        </select>
        <select
          aria-label={t("Status", "Status")}
          value={status}
          onChange={(e) => setStatus(e.target.value)}
        >
          <option value="">{t("All statuses", "Semua status")}</option>
          <option value="active">{t("Active", "Aktif")}</option>
          <option value="inactive">{t("Inactive", "Nonaktif")}</option>
          <option value="overdue">{t("Overdue", "Terlambat")}</option>
        </select>
        <span>
          {filtered.length} {t("people", "orang")}
        </span>
      </div>
      <Loading resource={r}>
        {filtered.length ? (
          <PeopleTable people={filtered} />
        ) : (
          <Empty
            title={t("No matching people", "Tidak ada karyawan yang sesuai")}
            description={t(
              "Adjust the filters, add employees or import a CSV with email,name,department,role columns.",
              "Sesuaikan filter, tambah karyawan, atau impor CSV dengan kolom email,name,department,role.",
            )}
          />
        )}
      </Loading>
      {manageGroups && (
        <GroupManager onClose={() => setManageGroups(false)} people={people} />
      )}
      {add && (
        <PersonForm
          onClose={() => setAdd(false)}
          onSaved={() => {
            setAdd(false);
            r.reload();
          }}
        />
      )}
    </>
  );
}
function GroupManager({
  onClose,
  people,
}: {
  onClose: () => void;
  people: any[];
}) {
  const { t } = useLocale();
  const groups = useData("/groups");
  const [groupId, setGroupId] = useState<string | undefined>();
  const [name, setName] = useState("");
  const [userIds, setUserIds] = useState<string[]>([]);
  const [error, setError] = useState<unknown>(null);
  const [busy, setBusy] = useState(false);
  return (
    <Dialog title={t("Employee groups", "Kelompok karyawan")} onClose={onClose}>
      <div className="toolbar">
        <select
          aria-label={t("Existing groups", "Kelompok tersedia")}
          value={groupId || ""}
          onChange={(e) => {
            const group = groups.data?.groups.find(
              (g: any) => g.id === e.target.value,
            );
            setGroupId(group?.id);
            setName(group?.name || "");
            setUserIds(group?.userIds || []);
          }}
        >
          <option value="">{t("Create a group", "Buat kelompok")}</option>
          {groups.data?.groups.map((g: any) => (
            <option key={g.id} value={g.id}>
              {g.name}
            </option>
          ))}
        </select>
      </div>
      <form
        onSubmit={async (e) => {
          e.preventDefault();
          setBusy(true);
          try {
            await mutate("/groups", { id: groupId, name, userIds });
            onClose();
          } catch (e) {
            setError(e);
          } finally {
            setBusy(false);
          }
        }}
      >
        <ErrorNotice error={error} />
        <Field label={t("Group name", "Nama kelompok")}>
          <input
            required
            minLength={2}
            value={name}
            onChange={(e) => setName(e.target.value)}
          />
        </Field>
        {people
          .filter((u) => u.role === "employee")
          .map((u) => (
            <label className="check" key={u.id}>
              <input
                type="checkbox"
                checked={userIds.includes(u.id)}
                onChange={() =>
                  setUserIds(
                    userIds.includes(u.id)
                      ? userIds.filter((id) => id !== u.id)
                      : [...userIds, u.id],
                  )
                }
              />
              <span>
                {u.name}
                <small>{u.department}</small>
              </span>
            </label>
          ))}
        <footer>
          <Button disabled={busy}>{t("Save group", "Simpan kelompok")}</Button>
        </footer>
      </form>
    </Dialog>
  );
}

function PersonForm({
  onClose,
  onSaved,
  person,
}: {
  onClose: () => void;
  onSaved: () => void;
  person?: any;
}) {
  const { t } = useLocale();
  const { user } = useAuth();
  const [form, setForm] = useState({
    name: person?.name || "",
    email: person?.email || "",
    department: person?.department || "",
    role: person?.role || "employee",
    temporaryPassword: "",
  });
  const [temporary, setTemporary] = useState(false);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<unknown>(null);
  return (
    <Dialog
      title={
        person
          ? t("Edit employee", "Edit karyawan")
          : t("Add employee", "Tambah karyawan")
      }
      onClose={onClose}
    >
      <form
        onSubmit={async (e) => {
          e.preventDefault();
          setBusy(true);
          try {
            if (person)
              await mutate(
                `/people/${person.id}`,
                {
                  name: form.name,
                  department: form.department,
                  role: form.role,
                  active: Boolean(person.active),
                },
                "PATCH",
              );
            else
              await mutate("/people", {
                ...form,
                temporaryPassword: temporary
                  ? form.temporaryPassword
                  : undefined,
              });
            onSaved();
          } catch (e) {
            setError(e);
          } finally {
            setBusy(false);
          }
        }}
      >
        <ErrorNotice error={error} />
        {[
          ["name", t("Full name", "Nama lengkap")],
          ["email", t("Work email", "Email kerja")],
          ["department", t("Department", "Departemen")],
        ].map(([key, label]) => (
          <Field key={key} label={label}>
            <input
              required
              type={key === "email" ? "email" : "text"}
              disabled={Boolean(person) && key === "email"}
              value={(form as any)[key]}
              onChange={(e) => setForm({ ...form, [key]: e.target.value })}
            />
          </Field>
        ))}
        <Field label={t("Role", "Peran")}>
          <select
            value={form.role}
            onChange={(e) => setForm({ ...form, role: e.target.value })}
          >
            <option value="employee">Employee</option>
            <option value="manager">Manager</option>
            {user?.role === "super_admin" && (
              <>
                <option value="admin">Admin</option>
                <option value="super_admin">Super Admin</option>
              </>
            )}
          </select>
        </Field>
        {!person && (
          <>
            <label className="check">
              <input
                type="checkbox"
                checked={temporary}
                onChange={(e) => setTemporary(e.target.checked)}
              />
              {t(
                "Use a temporary password instead of an invitation",
                "Gunakan kata sandi sementara sebagai pengganti undangan",
              )}
            </label>
            {temporary ? (
              <Field
                label={t("Temporary password", "Kata sandi sementara")}
                hint={t(
                  "12+ characters with uppercase, lowercase, a number and symbol. Must change at first login.",
                  "12+ karakter dengan huruf besar, kecil, angka, dan simbol. Wajib diganti saat login pertama.",
                )}
              >
                <input
                  required
                  minLength={12}
                  type="password"
                  autoComplete="new-password"
                  value={form.temporaryPassword}
                  onChange={(e) =>
                    setForm({ ...form, temporaryPassword: e.target.value })
                  }
                />
              </Field>
            ) : (
              <p>
                {t(
                  "A secure invitation is queued for email delivery. No password is displayed.",
                  "Undangan aman masuk antrean pengiriman email. Kata sandi tidak ditampilkan.",
                )}
              </p>
            )}
          </>
        )}
        <footer>
          <Button variant="secondary" type="button" onClick={onClose}>
            {t("Cancel", "Batal")}
          </Button>
          <Button disabled={busy}>
            {person
              ? t("Save changes", "Simpan perubahan")
              : t("Add employee", "Tambah karyawan")}
          </Button>
        </footer>
      </form>
    </Dialog>
  );
}
export function EmployeeDetail() {
  const [editing, setEditing] = useState(false);
  const { id } = useParams();
  const r = useData(`/people/${id}`);
  const { t } = useLocale();
  const date = useDate();
  const { user: actor } = useAuth();
  const [tab, setTab] = useState("overview");
  const d = r.data;
  const allowed =
    actor?.role === "super_admin" ||
    (actor?.role === "admin" &&
      d?.user.role !== "admin" &&
      d?.user.role !== "super_admin");
  return (
    <Loading resource={r}>
      {d && (
        <>
          <Link className="text-link" to="/admin/employees">
            ← {t("People", "Karyawan")}
          </Link>
          {editing && allowed && (
            <PersonForm
              person={d.user}
              onClose={() => setEditing(false)}
              onSaved={() => {
                setEditing(false);
                r.reload();
              }}
            />
          )}
          <PageTitle
            title={d.user.name}
            description={`${d.user.department} · ${d.user.email}`}
            actions={
              <>
                {actor?.role !== "manager" && (
                  <Link
                    className="btn secondary"
                    to={`/admin/human-risk/people/${id}`}
                  >
                    Human Risk Profile
                  </Link>
                )}
                <ActionLink to={`/admin/campaigns/new?employee=${id}`}>
                  {t("Assign learning", "Tugaskan materi")}
                </ActionLink>
                {allowed && (
                  <>
                    <Button
                      variant="secondary"
                      onClick={() => setEditing(true)}
                    >
                      {t("Edit employee", "Edit karyawan")}
                    </Button>
                    <ConfirmButton
                      title={t(
                        "Send password reset?",
                        "Kirim reset kata sandi?",
                      )}
                      description={t(
                        "A secure reset link will be emailed to this employee.",
                        "Tautan reset aman akan dikirim melalui email.",
                      )}
                      onConfirm={async () => {
                        await mutate(`/people/${id}/reset`);
                      }}
                    >
                      {t("Reset password", "Reset kata sandi")}
                    </ConfirmButton>
                    {actor?.id !== id && (
                      <ConfirmButton
                        title={
                          d.user.active
                            ? t("Deactivate employee?", "Nonaktifkan karyawan?")
                            : t("Activate employee?", "Aktifkan karyawan?")
                        }
                        description={t(
                          "Access changes immediately. Learning evidence is retained.",
                          "Akses berubah segera. Bukti pembelajaran tetap disimpan.",
                        )}
                        onConfirm={async () => {
                          await mutate(
                            `/people/${id}`,
                            {
                              name: d.user.name,
                              department: d.user.department,
                              role: d.user.role,
                              active: !d.user.active,
                            },
                            "PATCH",
                          );
                          r.reload();
                        }}
                      >
                        {d.user.active
                          ? t("Deactivate", "Nonaktifkan")
                          : t("Activate", "Aktifkan")}
                      </ConfirmButton>
                    )}
                  </>
                )}
              </>
            }
          />
          <div className="metric-grid">
            <Metric
              label="Awareness Score"
              value={value(d.user.score)}
              note={`${d.user.coverage}% ${t("component coverage", "cakupan komponen")}`}
            />
            <Metric
              label={t("Assigned learning", "Materi ditugaskan")}
              value={d.user.assigned}
            />
            <Metric
              label={t("Completed", "Selesai")}
              value={d.user.completed}
            />
            <Metric label={t("Overdue", "Terlambat")} value={d.user.overdue} />
          </div>
          <Tabs
            value={tab}
            onChange={setTab}
            tabs={[
              ["overview", t("Overview", "Ringkasan")],
              ["awareness", "Awareness"],
              ["learning", t("Learning", "Pembelajaran")],
              ["simulations", t("Simulations", "Simulasi")],
              ["certificates", t("Certificates", "Sertifikat")],
              ["activity", t("Activity", "Aktivitas")],
            ]}
          />
          {tab === "overview" && (
            <div className="sheet">
              <div className="row">
                <span>{t("Current risk", "Risiko saat ini")}</span>
                <Status value={d.user.risk} />
              </div>
              <div className="row">
                <span>{t("Last activity", "Aktivitas terakhir")}</span>
                {date(d.user.lastActivity, true)}
              </div>
              <div className="row">
                <span>{t("Completion", "Penyelesaian")}</span>
                <Progress value={d.user.completion} />
              </div>
            </div>
          )}
          {tab === "awareness" && (
            <ScoreLedger components={d.user.components} events={d.events} />
          )}{" "}
          {tab === "learning" && (
            <div className="sheet">
              {d.assignments.map((a: any) => (
                <div className="row" key={a.id}>
                  <div>
                    <strong>{a.title}</strong>
                    <small>
                      {t("Due", "Tenggat")} {date(a.due_at)}
                    </small>
                  </div>
                  <Status value={a.status} />
                </div>
              ))}
              <h2 className="section">
                {t("Attempt history", "Riwayat percobaan")}
              </h2>
              {d.attempts.map((a: any) => (
                <div className="row" key={a.id}>
                  <span>
                    {t("Attempt", "Percobaan")} {a.attempt}
                  </span>
                  <strong>{value(a.score)}</strong>
                  <small>{date(a.completed_at)}</small>
                </div>
              ))}
            </div>
          )}
          {tab === "simulations" && (
            <div className="sheet">
              {d.simulations.length ? (
                d.simulations.map((s: any, i: number) => (
                  <div className="row" key={i}>
                    <span>
                      {s.event ||
                        t("Awaiting interaction", "Menunggu interaksi")}
                    </span>
                    <small>{date(s.created_at || s.sent_at, true)}</small>
                  </div>
                ))
              ) : (
                <Empty
                  title={t(
                    "No simulation activity",
                    "Belum ada aktivitas simulasi",
                  )}
                  description={t(
                    "Events appear after the employee receives a simulation.",
                    "Aktivitas muncul setelah karyawan menerima simulasi.",
                  )}
                />
              )}
            </div>
          )}
          {tab === "certificates" && (
            <div className="sheet">
              {d.certificates.map((c: any) => (
                <div className="row" key={c.id}>
                  <div>
                    <strong>{c.title}</strong>
                    <small>{date(c.issued_at)}</small>
                  </div>
                  <Status value={c.status} />
                  <Download path={`/certificates/${c.id}/pdf`}>PDF</Download>
                </div>
              ))}
            </div>
          )}
          {tab === "activity" && <ScoreLedger events={d.events} />}
        </>
      )}
    </Loading>
  );
}
export function ScoreLedger({
  components,
  events,
}: {
  components?: any;
  events: any[];
}) {
  const { t } = useLocale();
  const date = useDate();
  const names: any = {
    knowledge: t("Knowledge", "Pengetahuan"),
    behavior: t("Behavior", "Perilaku"),
    reporting: t("Reporting", "Pelaporan"),
    improvement: t("Improvement", "Peningkatan"),
  };
  return (
    <>
      {components && (
        <div className="metric-grid">
          {Object.entries(components).map(([key, v]) => (
            <Metric key={key} label={names[key]} value={v as number | null} />
          ))}
        </div>
      )}
      <section className="sheet">
        <div className="section-head">
          <h2>{t("Score history", "Riwayat skor")}</h2>
          <Link className="text-link" to="/methodology">
            {t("Methodology", "Metodologi")}
          </Link>
        </div>
        {events.length ? (
          <ul className="timeline">
            {events.map((e: any) => (
              <li key={e.id}>
                <strong>
                  {names[e.component]}: {e.value}{" "}
                  {e.previous_value !== null && (
                    <span
                      className={
                        e.value >= e.previous_value ? "positive" : "negative"
                      }
                    >
                      ({e.value - e.previous_value >= 0 ? "+" : ""}
                      {e.value - e.previous_value})
                    </span>
                  )}
                </strong>
                <p>
                  {t(
                    e.reason,
                    e.reason === "Quiz completed"
                      ? "Kuis selesai"
                      : e.reason === "Baseline assessment completed"
                        ? "Asesmen awal selesai"
                        : e.reason === "Follow-up assessment completed"
                          ? "Asesmen tindak lanjut selesai"
                          : e.reason === "Baseline to follow-up change"
                            ? "Perubahan dari awal ke tindak lanjut"
                            : e.reason === "Suspicious report confirmed"
                              ? "Laporan mencurigakan dikonfirmasi"
                              : e.reason === "Simulation link clicked"
                                ? "Tautan simulasi diklik"
                                : e.reason === "Simulation reported"
                                  ? "Simulasi dilaporkan"
                                  : e.reason ===
                                      "Simulation reported without clicking"
                                    ? "Simulasi dilaporkan tanpa mengklik"
                                    : e.reason,
                  )}
                </p>
                <small>{date(e.created_at, true)}</small>
              </li>
            ))}
          </ul>
        ) : (
          <Empty
            title={t("No score evidence yet", "Belum ada bukti skor")}
            description={t(
              "Learning, assessments and reviewed reporting create an auditable history.",
              "Pembelajaran, asesmen, dan laporan yang ditinjau membentuk riwayat yang dapat diaudit.",
            )}
          />
        )}
      </section>
    </>
  );
}
export function Awareness() {
  const [dept, setDept] = useState("");
  const r = useData(
    `/summary?period=30${dept ? `&department=${encodeURIComponent(dept)}` : ""}`,
  );
  const { t } = useLocale();
  const d = r.data;
  return (
    <>
      <PageTitle
        title={t("Human risk & awareness", "Risiko manusia & awareness")}
        description={t(
          "Understand the evidence behind risk and decide where to intervene.",
          "Pahami bukti di balik risiko dan tentukan tindakan yang diperlukan.",
        )}
        actions={
          <ActionLink secondary to="/methodology">
            {t("Score methodology", "Metodologi skor")}
          </ActionLink>
        }
      />
      <Loading resource={r}>
        {d && (
          <>
            <div className="split">
              <section className="sheet">
                <span className="eyebrow">
                  {t("ORGANIZATION AWARENESS", "AWARENESS ORGANISASI")}
                </span>
                <div className="score-line">
                  <strong>{value(d.summary.score)}</strong>
                  <span>/ 100</span>
                  {d.summary.change !== null && (
                    <Status
                      value={`${d.summary.change > 0 ? "+" : ""}${d.summary.change}`}
                    />
                  )}
                </div>
                <p>
                  {d.summary.score === null
                    ? t(
                        "Measure a baseline to understand your current human risk.",
                        "Ukur kondisi awal untuk memahami risiko manusia saat ini.",
                      )
                    : d.summary.score < 60
                      ? t(
                          "Focused learning is needed. Start with the lowest-performing topics.",
                          "Pembelajaran terarah diperlukan. Mulai dari topik dengan hasil terendah.",
                        )
                      : t(
                          "Continue measuring knowledge and behavior to maintain coverage.",
                          "Lanjutkan pengukuran pengetahuan dan perilaku untuk menjaga cakupan.",
                        )}
                </p>
                <div className="row">
                  <span>{t("Employees measured", "Karyawan terukur")}</span>
                  <strong>{value(d.summary.coverage, "%")}</strong>
                </div>
                <small>
                  {t(
                    "Coverage describes available evidence; it is not statistical confidence.",
                    "Cakupan menunjukkan bukti tersedia, bukan tingkat keyakinan statistik.",
                  )}
                </small>
              </section>
              <RiskDistribution data={d} />
            </div>
            <section className="section">
              <div className="section-head">
                <h2>
                  {t(
                    "Risk drivers & recommended actions",
                    "Penyebab risiko & tindakan yang disarankan",
                  )}
                </h2>
              </div>
              <div className="sheet">
                {d.topics.length ? (
                  d.topics.map((x: any) => (
                    <div className="row" key={x.topic}>
                      <div>
                        <strong>{x.topic}</strong>
                        <small>
                          {x.attempts} {t("quiz attempts", "percobaan kuis")} ·{" "}
                          {x.score < 70
                            ? t(
                                "Knowledge gap: assign a refresher.",
                                "Kesenjangan pengetahuan: tugaskan materi pengulangan.",
                              )
                            : t(
                                "Maintain progress with regular measurement.",
                                "Pertahankan progres melalui pengukuran berkala.",
                              )}
                        </small>
                      </div>
                      <strong>{x.score}/100</strong>
                      {x.score < 70 && (
                        <Link className="text-link" to="/admin/campaigns/new">
                          {t("Assign learning", "Tugaskan materi")} →
                        </Link>
                      )}
                    </div>
                  ))
                ) : (
                  <Empty
                    title={t(
                      "Topic performance needs learning results",
                      "Performa topik memerlukan hasil belajar",
                    )}
                    description={t(
                      "Complete course quizzes to identify strong and weak topics.",
                      "Selesaikan kuis materi untuk mengidentifikasi topik kuat dan lemah.",
                    )}
                  />
                )}
              </div>
            </section>
            <section className="section">
              <div className="section-head">
                <h2>{t("Department comparison", "Perbandingan departemen")}</h2>
                {dept && (
                  <Button variant="quiet" onClick={() => setDept("")}>
                    {t("All departments", "Semua departemen")}
                  </Button>
                )}
              </div>
              <div className="table-wrap">
                <table>
                  <thead>
                    <tr>
                      <th>{t("Department", "Departemen")}</th>
                      <th>{t("Employees", "Karyawan")}</th>
                      <th>{t("Measured", "Terukur")}</th>
                      <th>{t("Score", "Nilai")}</th>
                      <th>{t("Overdue", "Terlambat")}</th>
                      <th />
                    </tr>
                  </thead>
                  <tbody>
                    {d.departments.map((x: any) => (
                      <tr key={x.department}>
                        <td>
                          <button
                            className="btn quiet"
                            onClick={() => setDept(x.department)}
                          >
                            {x.department}
                          </button>
                        </td>
                        <td>{x.employees}</td>
                        <td>{x.measured}</td>
                        <td>{value(x.score)}</td>
                        <td>{x.overdue}</td>
                        <td>
                          <Link
                            className="text-link"
                            to={`/admin/campaigns/new?department=${encodeURIComponent(x.department)}`}
                          >
                            {t("Assign refresher", "Tugaskan pengulangan")}
                          </Link>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </section>
          </>
        )}
      </Loading>
    </>
  );
}
export function Reports() {
  const { t } = useLocale();
  const [category, setCategory] = useState("Executive");
  const [period, setPeriod] = useState("30");
  const [department, setDepartment] = useState("");
  const [risk, setRisk] = useState("");
  const [campaignId, setCampaignId] = useState("");
  const campaigns = useData("/campaigns");
  const people = useData("/people");
  const query = new URLSearchParams({
    period,
    ...(department ? { department } : {}),
    ...(risk ? { risk } : {}),
    ...(campaignId ? { campaignId } : {}),
  }).toString();
  const r = useData(`/summary?${query}`);
  return (
    <>
      <PageTitle
        title={t("Reports", "Laporan")}
        description={t(
          "Evidence for leadership, program owners and compliance reviews.",
          "Bukti untuk pimpinan, penanggung jawab program, dan tinjauan kepatuhan.",
        )}
        actions={
          <>
            <ActionLink secondary to="/admin/reports/certificates">
              {t("Certificates", "Sertifikat")}
            </ActionLink>
            <Download
              path={`/exports/csv?${query}&category=${encodeURIComponent(category)}`}
            >
              CSV
            </Download>
            <Download
              path={`/exports/pdf?${query}&category=${encodeURIComponent(category)}`}
            >
              PDF
            </Download>
          </>
        }
      />
      <Tabs
        value={category}
        onChange={setCategory}
        tabs={[
          ["Executive", t("Executive", "Eksekutif")],
          ["Campaign", t("Campaign", "Kampanye")],
          ["Employee", t("Employee", "Karyawan")],
          ["Compliance Evidence", t("Compliance evidence", "Bukti kepatuhan")],
        ]}
      />
      <div className="toolbar">
        <select
          value={period}
          onChange={(e) => setPeriod(e.target.value)}
          aria-label={t("Period", "Periode")}
        >
          {["7", "30", "90", "365", "all"].map((p) => (
            <option key={p} value={p}>
              {p === "all"
                ? t("All time", "Semua waktu")
                : `${p} ${t("days", "hari")}`}
            </option>
          ))}
        </select>
        <select
          value={department}
          onChange={(e) => setDepartment(e.target.value)}
          aria-label={t("Department", "Departemen")}
        >
          <option value="">{t("All departments", "Semua departemen")}</option>
          {[
            ...new Set<string>(
              (people.data?.people || []).map((u: any) => u.department),
            ),
          ].map((d) => (
            <option key={d}>{d}</option>
          ))}
        </select>
        <select
          value={campaignId}
          onChange={(e) => setCampaignId(e.target.value)}
          aria-label={t("Campaign", "Kampanye")}
        >
          <option value="">{t("All campaigns", "Semua kampanye")}</option>
          {campaigns.data?.campaigns.map((c: any) => (
            <option key={c.id} value={c.id}>
              {c.name}
            </option>
          ))}
        </select>
        <select
          value={risk}
          onChange={(e) => setRisk(e.target.value)}
          aria-label={t("Risk", "Risiko")}
        >
          <option value="">
            {t("All risk levels", "Semua tingkat risiko")}
          </option>
          <option value="High">{t("High", "Tinggi")}</option>
          <option value="Medium">{t("Medium", "Sedang")}</option>
          <option value="Low">{t("Low", "Rendah")}</option>
        </select>
      </div>
      <Loading resource={r}>
        {r.data && (
          <>
            <Metrics s={r.data.summary} />
            {category === "Executive" ? (
              <div className="split">
                <RiskDistribution data={r.data} />
                <div className="sheet">
                  <h2>{t("Department results", "Hasil departemen")}</h2>
                  {r.data.departments.map((d: any) => (
                    <div className="row" key={d.department}>
                      <strong>{d.department}</strong>
                      <span>{value(d.score)}</span>
                    </div>
                  ))}
                </div>
              </div>
            ) : category === "Employee" ? (
              <PeopleTable people={r.data.users} />
            ) : (
              <div className="table-wrap">
                <table>
                  <thead>
                    <tr>
                      <th>{t("Employee", "Karyawan")}</th>
                      <th>{t("Learning", "Pembelajaran")}</th>
                      <th>{t("Program", "Program")}</th>
                      <th>{t("Status", "Status")}</th>
                    </tr>
                  </thead>
                  <tbody>
                    {r.data.assignments.map((a: any) => (
                      <tr key={a.id}>
                        <td>
                          {
                            r.data.users.find((u: any) => u.id === a.user_id)
                              ?.name
                          }
                        </td>
                        <td>{a.title}</td>
                        <td>{a.program_name}</td>
                        <td>
                          <Status value={a.status} />
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
                {!r.data.assignments.length && (
                  <Empty
                    title={t(
                      "No evidence matches these filters",
                      "Tidak ada bukti sesuai filter",
                    )}
                    description={t(
                      "Adjust your filters or launch a program to generate evidence.",
                      "Sesuaikan filter atau luncurkan program untuk menghasilkan bukti.",
                    )}
                  />
                )}
              </div>
            )}
            <p className="section">
              <small>
                {t(
                  "Participation = assigned employees who started. Assignment completion = completed activities / assigned activities. Quiz pass rate = passed attempts / submitted attempts. Date filters apply to attempts and simulation deliveries; assignment progress shows current state.",
                  "Partisipasi = karyawan yang mulai mengerjakan. Penyelesaian tugas = aktivitas selesai / ditugaskan. Kelulusan kuis = percobaan lulus / dikirim. Filter waktu berlaku untuk kuis dan pengiriman simulasi; progres tugas menunjukkan kondisi saat ini.",
                )}
              </small>
            </p>
          </>
        )}
      </Loading>
    </>
  );
}
export function Methodology() {
  const { t } = useLocale();
  return (
    <>
      <PageTitle
        title={t("Awareness Score methodology", "Metodologi Awareness Score")}
        description={t(
          "Version 1.0 · Deterministic, evidence-based scoring.",
          "Versi 1.0 · Penilaian deterministik berdasarkan bukti.",
        )}
      />
      <div className="sheet">
        <h2>{t("How the score is calculated", "Cara menghitung skor")}</h2>
        <div className="metric-grid section">
          <Metric label={t("Knowledge", "Pengetahuan")} value="35%" />
          <Metric label={t("Behavior", "Perilaku")} value="30%" />
          <Metric label={t("Reporting", "Pelaporan")} value="20%" />
          <Metric label={t("Improvement", "Peningkatan")} value="15%" />
        </div>
        <p>
          {t(
            "The latest measured value of each component contributes its weight. Missing components are excluded and the remaining weights are normalized. No score is shown without evidence.",
            "Nilai terukur terbaru setiap komponen berkontribusi sesuai bobot. Komponen tanpa bukti dikecualikan dan bobot sisanya dinormalisasi. Skor tidak ditampilkan tanpa bukti.",
          )}
        </p>
        <div className="section stack">
          <h3>{t("Data sources", "Sumber data")}</h3>
          <p>
            {t(
              "Knowledge: server-graded quizzes and assessments. Behavior: safe simulation responses (a click is 0, reporting without clicking is 100). Reporting: a reported simulation or a security-confirmed suspicious report is 100. Improvement: 50 + (follow-up − baseline) / 2, bounded to 0–100.",
              "Pengetahuan: kuis dan asesmen dinilai server. Perilaku: respons simulasi aman (klik bernilai 0, melapor tanpa klik bernilai 100). Pelaporan: simulasi dilaporkan atau laporan mencurigakan dikonfirmasi bernilai 100. Peningkatan: 50 + (tindak lanjut − awal) / 2, dibatasi 0–100.",
            )}
          </p>
          <h3>
            {t(
              "Interpretation and limitations",
              "Interpretasi dan keterbatasan",
            )}
          </h3>
          <p>
            {t(
              "High risk: below 60. Medium: 60–79. Low: 80–100. Unmeasured is distinct from high risk. Employee coverage and component coverage accompany the score. These are coverage measures, not statistical confidence. The organizational score is the mean of measured active employees.",
              "Risiko tinggi: di bawah 60. Sedang: 60–79. Rendah: 80–100. Belum terukur berbeda dari risiko tinggi. Cakupan karyawan dan komponen menyertai skor. Keduanya ukuran cakupan, bukan keyakinan statistik. Skor organisasi adalah rata-rata karyawan aktif yang terukur.",
            )}
          </p>
          <h3>{t("Governance", "Tata kelola")}</h3>
          <p>
            {t(
              "Scores guide learning; they are not employee performance ratings. Every score change records its source and time. Changes to the formula require a versioned backend release and a documented review. Current-period evidence is compared against a snapshot at the start of the period when available.",
              "Skor memandu pembelajaran, bukan penilaian kinerja karyawan. Setiap perubahan mencatat sumber dan waktu. Perubahan formula memerlukan rilis backend berversi dan tinjauan terdokumentasi. Bukti periode ini dibandingkan dengan kondisi awal periode jika tersedia.",
            )}
          </p>
        </div>
      </div>
    </>
  );
}
