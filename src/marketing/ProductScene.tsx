import { useState } from "react";
import {
  ArrowRight,
  Check,
  ChevronLeft,
  ChevronRight,
  CircleCheck,
  FileText,
  ShieldCheck,
} from "lucide-react";

export type PublicLocale = "en" | "id";
export type SceneMode =
  "admin" | "employee" | "program" | "awareness" | "reporting" | "phishing";
const labels: Record<SceneMode, [string, string]> = {
  admin: ["Overview", "Ringkasan"],
  employee: ["My learning", "Pembelajaran saya"],
  program: ["Campaigns", "Kampanye"],
  awareness: ["Awareness", "Kesadaran"],
  reporting: ["Reports", "Laporan"],
  phishing: ["Security inbox", "Kotak masuk keamanan"],
};

export function ProductScene({
  locale = "en",
  initialMode = "admin",
  controlledMode,
  compact = false,
  onModeChange,
}: {
  locale?: PublicLocale;
  initialMode?: SceneMode;
  controlledMode?: SceneMode;
  compact?: boolean;
  onModeChange?: (mode: SceneMode) => void;
}) {
  const [mode, setMode] = useState<SceneMode>(initialMode);
  const [department, setDepartment] = useState("all");
  const [component, setComponent] = useState(0);
  const [step, setStep] = useState(0);
  const [audience, setAudience] = useState("finance");
  const [simulation, setSimulation] = useState(true);
  const [launched, setLaunched] = useState(false);
  const [lesson, setLesson] = useState(0);
  const [answer, setAnswer] = useState<number | null>(null);
  const [completed, setCompleted] = useState(false);
  const [report, setReport] = useState("Executive");
  const [reportReady, setReportReady] = useState(false);
  const [inboxState, setInboxState] = useState("Submitted");
  const t = (en: string, id: string) => (locale === "en" ? en : id);
  const current = controlledMode || mode;
  const changeMode = (next: SceneMode) => {
    setMode(next);
    onModeChange?.(next);
  };
  const modes: SceneMode[] = [
    "admin",
    "program",
    "employee",
    "awareness",
    "reporting",
  ];
  const knowledge = [
    [
      t("Knowledge", "Pengetahuan"),
      "35%",
      "84",
      t(
        "Graded quiz and assessment evidence.",
        "Bukti dari kuis dan asesmen yang dinilai.",
      ),
    ],
    [
      t("Behavior", "Perilaku"),
      "30%",
      "76",
      t(
        "Response to safe phishing simulations.",
        "Respons terhadap simulasi phishing yang aman.",
      ),
    ],
    [
      t("Reporting", "Pelaporan"),
      "20%",
      "80",
      t(
        "Reporting behavior recorded by the platform.",
        "Perilaku pelaporan yang dicatat platform.",
      ),
    ],
    [
      t("Improvement", "Peningkatan"),
      "15%",
      "66",
      t(
        "Change between comparable assessments.",
        "Perubahan antara asesmen yang dapat dibandingkan.",
      ),
    ],
  ];
  return (
    <figure className={`ps-scene ${compact ? "ps-scene-compact" : ""}`}>
      <div className="ps-scene-top">
        <span className="ps-scene-mark">A</span>
        <strong>Acme Indonesia</strong>
        <span className="ps-scene-divider" />
        <span>{t("Security workspace", "Ruang kerja keamanan")}</span>
        <span className="ps-sample">{t("Fictional demo", "Demo fiktif")}</span>
      </div>
      {!compact && (
        <nav
          className="ps-scene-nav"
          aria-label={t("Demo workspace", "Ruang kerja demo")}
        >
          {modes.map((item) => (
            <button
              key={item}
              aria-pressed={current === item}
              className={current === item ? "is-active" : ""}
              onClick={() => changeMode(item)}
            >
              {labels[item][locale === "en" ? 0 : 1]}
            </button>
          ))}
        </nav>
      )}
      <div className="ps-scene-body" key={current}>
        <div className="ps-scene-heading">
          <div>
            <span className="ps-kicker">
              {current === "employee"
                ? t("HELLO, ANDINI", "HALO, ANDINI")
                : t(
                    "ACME INDONESIA · SEPTEMBER 2026",
                    "ACME INDONESIA · SEPTEMBER 2026",
                  )}
            </span>
            <h3>
              {current === "admin"
                ? t("What needs attention?", "Apa yang perlu ditangani?")
                : current === "employee"
                  ? t("Your next step is clear.", "Langkah berikutnya jelas.")
                  : labels[current][locale === "en" ? 0 : 1]}
            </h3>
          </div>
          {current === "admin" && (
            <span className="ps-scene-live">
              {t("3 priorities", "3 prioritas")}
            </span>
          )}
        </div>
        {current === "admin" && (
          <>
            <div className="ps-priority">
              <div className="ps-priority-number">08</div>
              <div>
                <strong>
                  {t(
                    "Finance needs a phishing refresher",
                    "Tim Keuangan perlu penyegaran phishing",
                  )}
                </strong>
                <p>
                  {t(
                    "8 people scored below 60 in this topic. Review the evidence before assigning learning.",
                    "8 orang meraih skor di bawah 60 pada topik ini. Tinjau bukti sebelum menugaskan pembelajaran.",
                  )}
                </p>
              </div>
              <button
                onClick={() => changeMode("awareness")}
                aria-label={t(
                  "Review Finance evidence",
                  "Tinjau bukti Keuangan",
                )}
              >
                <ArrowRight size={20} />
              </button>
            </div>
            <div className="ps-scene-attention">
              <button onClick={() => changeMode("program")}>
                <span>
                  <b>12</b> {t("overdue assignments", "tugas lewat tenggat")}
                </span>
                <ArrowRight size={15} />
              </button>
              <button onClick={() => changeMode("phishing")}>
                <span>
                  <b>3</b>{" "}
                  {t("reports awaiting review", "laporan menunggu tinjauan")}
                </span>
                <ArrowRight size={15} />
              </button>
            </div>
            <div className="ps-scene-metrics">
              <div>
                <small>{t("Awareness Score", "Skor Kesadaran")}</small>
                <strong>
                  78<span>/100</span>
                </strong>
                <span className="ps-positive">
                  +7 {t("vs. previous period", "dari periode sebelumnya")}
                </span>
              </div>
              <div>
                <small>{t("Measured employees", "Karyawan terukur")}</small>
                <strong>
                  84<span>%</span>
                </strong>
                <small>126 / 150 {t("people", "orang")}</small>
              </div>
              <div>
                <small>
                  {t("Assignment completion", "Penyelesaian tugas")}
                </small>
                <strong>
                  72<span>%</span>
                </strong>
                <small>108 / 150 {t("assignments", "tugas")}</small>
              </div>
            </div>
            <div
              className="ps-risk-strip"
              role="img"
              aria-label={t(
                "Risk distribution: 63 low, 45 medium, 18 high, 24 unmeasured",
                "Distribusi risiko: 63 rendah, 45 sedang, 18 tinggi, 24 belum diukur",
              )}
            >
              <i style={{ width: "42%" }} />
              <i style={{ width: "30%" }} />
              <i style={{ width: "12%" }} />
              <i style={{ width: "16%" }} />
            </div>
            <div className="ps-risk-legend">
              <span>{t("Low", "Rendah")} 63</span>
              <span>{t("Medium", "Sedang")} 45</span>
              <span>{t("High", "Tinggi")} 18</span>
              <span>{t("Unmeasured", "Belum diukur")} 24</span>
            </div>
          </>
        )}
        {current === "awareness" && (
          <>
            <div className="ps-scene-filter">
              <label>
                {t("Department", "Departemen")}
                <select
                  aria-label={t("Department", "Departemen")}
                  value={department}
                  onChange={(event) => setDepartment(event.target.value)}
                >
                  <option value="all">
                    {t("All departments", "Semua departemen")}
                  </option>
                  <option value="finance">{t("Finance", "Keuangan")}</option>
                  <option value="new">
                    {t("New employees", "Karyawan baru")}
                  </option>
                </select>
              </label>
              <div>
                <small>{t("Awareness Score", "Skor Kesadaran")}</small>
                <strong>
                  {department === "new"
                    ? t("Unmeasured", "Belum diukur")
                    : department === "finance"
                      ? "68"
                      : "78"}
                </strong>
                <small>
                  {department === "new"
                    ? t("No assessment evidence yet", "Belum ada bukti asesmen")
                    : department === "finance"
                      ? t(
                          "24 of 30 people measured · 80%",
                          "24 dari 30 orang terukur · 80%",
                        )
                      : t(
                          "126 of 150 people measured · 84%",
                          "126 dari 150 orang terukur · 84%",
                        )}
                </small>
              </div>
            </div>
            {department !== "new" && (
              <>
                <div className="ps-component-tabs">
                  {knowledge.map(([name, weight], i) => (
                    <button
                      key={name}
                      aria-pressed={component === i}
                      onClick={() => setComponent(i)}
                    >
                      {name}
                      <small>{weight}</small>
                    </button>
                  ))}
                </div>
                <div className="ps-component-detail" aria-live="polite">
                  <strong>
                    {department === "finance"
                      ? ["72", "60", "76", "64"][component]
                      : knowledge[component][2]}
                    <small>/100</small>
                  </strong>
                  <div>
                    <b>{knowledge[component][0]}</b>
                    <p>{knowledge[component][3]}</p>
                  </div>
                </div>
              </>
            )}
            <p className="ps-scene-note">
              {t(
                "Score and coverage answer different questions. Missing evidence stays unmeasured; available components are reweighted.",
                "Skor dan cakupan menjawab pertanyaan berbeda. Bukti yang belum ada tetap belum diukur; bobot komponen yang tersedia disesuaikan.",
              )}
            </p>
            <button
              className="ps-button ps-button-primary"
              onClick={() => changeMode("program")}
            >
              {t("Plan a focused program", "Rencanakan program terarah")}
              <ArrowRight size={15} />
            </button>
          </>
        )}
        {current === "program" && (
          <>
            {launched ? (
              <div className="ps-demo-result" role="status">
                <CircleCheck size={32} />
                <h4>
                  {t(
                    "Your program preview is ready.",
                    "Pratinjau program Anda siap.",
                  )}
                </h4>
                <p>
                  {t(
                    "This is a local demo. No assignments or messages have been sent.",
                    "Ini demo lokal. Tidak ada tugas atau pesan yang dikirim.",
                  )}
                </p>
                <button
                  className="ps-button ps-button-secondary"
                  onClick={() => {
                    setLaunched(false);
                    setStep(0);
                  }}
                >
                  {t("Edit preview", "Edit pratinjau")}
                </button>
              </div>
            ) : (
              <>
                <ol className="ps-builder-steps">
                  {[
                    t("Basics", "Dasar"),
                    t("Audience", "Audiens"),
                    t("Learning", "Pembelajaran"),
                    t("Measure", "Pengukuran"),
                    t("Review", "Tinjauan"),
                  ].map((label, i) => (
                    <li key={label}>
                      <button
                        aria-current={step === i ? "step" : undefined}
                        onClick={() => setStep(i)}
                      >
                        <span>{i + 1}</span>
                        <small>{label}</small>
                      </button>
                    </li>
                  ))}
                </ol>
                <div className="ps-builder-panel">
                  {step === 0 && (
                    <>
                      <h4>
                        {t(
                          "Phishing awareness · September",
                          "Kesadaran phishing · September",
                        )}
                      </h4>
                      <p>
                        {t(
                          "A focused refresher on sender verification and reporting, with a baseline and follow-up assessment.",
                          "Penyegaran terarah tentang verifikasi pengirim dan pelaporan, dengan asesmen awal dan lanjutan.",
                        )}
                      </p>
                      <span className="ps-status">
                        {t("Draft preview", "Pratinjau draf")}
                      </span>
                    </>
                  )}
                  {step === 1 && (
                    <>
                      <h4>
                        {t(
                          "Who needs this program?",
                          "Siapa yang memerlukan program ini?",
                        )}
                      </h4>
                      <div className="ps-choice-row">
                        {[
                          [
                            "finance",
                            t("Finance · 30 people", "Keuangan · 30 orang"),
                          ],
                          [
                            "operations",
                            t(
                              "Operations · 54 people",
                              "Operasional · 54 orang",
                            ),
                          ],
                        ].map(([value, label]) => (
                          <button
                            key={value}
                            aria-pressed={audience === value}
                            onClick={() => setAudience(value)}
                          >
                            {audience === value && <Check size={15} />} {label}
                          </button>
                        ))}
                      </div>
                      <p>
                        {t(
                          "Preview includes active employees in the selected department.",
                          "Pratinjau mencakup karyawan aktif pada departemen terpilih.",
                        )}
                      </p>
                    </>
                  )}
                  {step === 2 && (
                    <>
                      <h4>
                        {t(
                          "Recognize and report phishing",
                          "Kenali dan laporkan phishing",
                        )}
                      </h4>
                      <p>
                        {t(
                          "Article · scenario · checklist · 8 minutes",
                          "Artikel · skenario · daftar periksa · 8 menit",
                        )}
                      </p>
                      <div className="ps-lesson-lines">
                        <span>
                          <Check size={15} />
                          {t(
                            "Published revision 2",
                            "Revisi 2 yang diterbitkan",
                          )}
                        </span>
                        <span>
                          <Check size={15} />
                          {t(
                            "5-question knowledge check",
                            "Uji pengetahuan 5 pertanyaan",
                          )}
                        </span>
                      </div>
                    </>
                  )}
                  {step === 3 && (
                    <>
                      <h4>
                        {t(
                          "Measure before and after",
                          "Ukur sebelum dan sesudah",
                        )}
                      </h4>
                      <p>
                        {t(
                          "Baseline and follow-up make changes in knowledge visible.",
                          "Asesmen awal dan lanjutan memperlihatkan perubahan pengetahuan.",
                        )}
                      </p>
                      <label className="ps-consent">
                        <input
                          type="checkbox"
                          checked={simulation}
                          onChange={(event) =>
                            setSimulation(event.target.checked)
                          }
                        />
                        {t(
                          "Include a safe phishing simulation",
                          "Sertakan simulasi phishing aman",
                        )}
                      </label>
                    </>
                  )}
                  {step === 4 && (
                    <>
                      <h4>
                        {t(
                          "Review before launch",
                          "Tinjau sebelum meluncurkan",
                        )}
                      </h4>
                      <dl className="ps-review-list">
                        <div>
                          <dt>{t("Audience", "Audiens")}</dt>
                          <dd>
                            {audience === "finance"
                              ? t("Finance · 30 people", "Keuangan · 30 orang")
                              : t(
                                  "Operations · 54 people",
                                  "Operasional · 54 orang",
                                )}
                          </dd>
                        </div>
                        <div>
                          <dt>{t("Duration", "Durasi")}</dt>
                          <dd>8 {t("minutes", "menit")}</dd>
                        </div>
                        <div>
                          <dt>{t("Simulation", "Simulasi")}</dt>
                          <dd>
                            {simulation
                              ? t("Included", "Disertakan")
                              : t("Not included", "Tidak disertakan")}
                          </dd>
                        </div>
                        <div>
                          <dt>{t("Schedule", "Jadwal")}</dt>
                          <dd>14–28 {t("September", "September")} 2026</dd>
                        </div>
                      </dl>
                    </>
                  )}
                </div>
                <div className="ps-builder-actions">
                  <button
                    className="ps-button ps-button-secondary"
                    disabled={step === 0}
                    onClick={() => setStep(step - 1)}
                  >
                    <ChevronLeft size={15} />
                    {t("Back", "Kembali")}
                  </button>
                  <small>
                    {t(
                      "Demo changes stay in this page",
                      "Perubahan demo tetap di halaman ini",
                    )}
                  </small>
                  <button
                    className="ps-button ps-button-primary"
                    onClick={() =>
                      step === 4 ? setLaunched(true) : setStep(step + 1)
                    }
                  >
                    {step === 4
                      ? t("Preview launch", "Pratinjau peluncuran")
                      : t("Continue", "Lanjutkan")}
                    <ChevronRight size={15} />
                  </button>
                </div>
              </>
            )}
          </>
        )}
        {current === "employee" && (
          <>
            {completed ? (
              <div className="ps-demo-result" role="status">
                <CircleCheck size={32} />
                <h4>
                  {t("Knowledge check complete.", "Uji pengetahuan selesai.")}
                </h4>
                <p>
                  {t(
                    "You chose to verify the request through a known channel. This demo does not issue a real certificate.",
                    "Anda memilih memverifikasi permintaan melalui kanal resmi. Demo ini tidak menerbitkan sertifikat asli.",
                  )}
                </p>
                <button
                  className="ps-button ps-button-secondary"
                  onClick={() => {
                    setCompleted(false);
                    setLesson(0);
                    setAnswer(null);
                  }}
                >
                  {t("Read again", "Baca lagi")}
                </button>
              </div>
            ) : (
              <>
                <div className="ps-lesson-progress">
                  <span>
                    {t(
                      "Recognize and report phishing",
                      "Kenali dan laporkan phishing",
                    )}
                  </span>
                  <small>{lesson + 1}/3</small>
                </div>
                <progress
                  max="3"
                  value={lesson + 1}
                  aria-label={t("Lesson progress", "Progres pelajaran")}
                />
                <div className="ps-lesson-content">
                  <span className="ps-kicker">
                    {t(
                      "8 MINUTES · DUE 28 SEPTEMBER",
                      "8 MENIT · TENGGAT 28 SEPTEMBER",
                    )}
                  </span>
                  <h4>
                    {
                      [
                        t(
                          "Pause before responding.",
                          "Berhenti sebelum merespons.",
                        ),
                        t(
                          "Verify through a known channel.",
                          "Verifikasi melalui kanal resmi.",
                        ),
                        t("What would you do?", "Apa yang akan Anda lakukan?"),
                      ][lesson]
                    }
                  </h4>
                  <p>
                    {
                      [
                        t(
                          "An urgent message asks you to approve a new bank account for a supplier. The sender’s name looks familiar, but the request is unexpected.",
                          "Pesan mendesak meminta Anda menyetujui rekening baru pemasok. Nama pengirim terlihat familier, tetapi permintaannya tidak terduga.",
                        ),
                        t(
                          "Use contact details already in your records. Call the supplier to confirm the request. Report the suspicious message through your organization’s reporting process.",
                          "Gunakan informasi kontak yang sudah Anda miliki. Hubungi pemasok untuk memastikan permintaannya. Laporkan pesan mencurigakan melalui proses pelaporan organisasi.",
                        ),
                        t(
                          "An unfamiliar link asks you to confirm your password. Choose the safest next step.",
                          "Tautan asing meminta Anda mengonfirmasi kata sandi. Pilih langkah berikutnya yang paling aman.",
                        ),
                      ][lesson]
                    }
                  </p>
                  {lesson === 2 && (
                    <div className="ps-quiz-options">
                      {[
                        t(
                          "Open the link and sign in",
                          "Buka tautan lalu masuk",
                        ),
                        t(
                          "Verify using the official website or a known contact",
                          "Verifikasi melalui situs resmi atau kontak yang dikenal",
                        ),
                      ].map((text, i) => (
                        <button
                          key={text}
                          aria-pressed={answer === i}
                          onClick={() => setAnswer(i)}
                        >
                          {text}
                        </button>
                      ))}
                      {answer === 0 && (
                        <p role="status">
                          {t(
                            "An unexpected link can impersonate a login page. Try a safer option.",
                            "Tautan tak terduga dapat meniru halaman masuk. Coba pilihan yang lebih aman.",
                          )}
                        </p>
                      )}
                    </div>
                  )}
                </div>
                <div className="ps-builder-actions">
                  <button
                    className="ps-button ps-button-secondary"
                    disabled={lesson === 0}
                    onClick={() => setLesson(lesson - 1)}
                  >
                    {t("Previous", "Sebelumnya")}
                  </button>
                  <button
                    className="ps-button ps-button-primary"
                    disabled={lesson === 2 && answer !== 1}
                    onClick={() =>
                      lesson === 2 ? setCompleted(true) : setLesson(lesson + 1)
                    }
                  >
                    {lesson === 2
                      ? t("Complete check", "Selesaikan kuis")
                      : lesson === 1
                        ? t("Take quiz", "Mulai kuis")
                        : t("Next lesson", "Pelajaran berikutnya")}
                    <ArrowRight size={15} />
                  </button>
                </div>
              </>
            )}
          </>
        )}
        {current === "reporting" && (
          <>
            <div className="ps-report-types">
              {[
                ["Executive", t("Executive", "Eksekutif")],
                ["Campaign", t("Campaign", "Kampanye")],
                ["Employee", t("Employee", "Karyawan")],
                [
                  "Compliance Evidence",
                  t("Compliance Evidence", "Bukti Kepatuhan"),
                ],
              ].map(([value, label]) => (
                <button
                  key={value}
                  aria-pressed={report === value}
                  onClick={() => {
                    setReport(value);
                    setReportReady(false);
                  }}
                >
                  {label}
                </button>
              ))}
            </div>
            <div className="ps-report-paper">
              <div>
                <FileText size={23} />
                <span>
                  {t(
                    "ACME INDONESIA · SEPTEMBER 2026",
                    "ACME INDONESIA · SEPTEMBER 2026",
                  )}
                </span>
              </div>
              <h4>
                {report === "Executive"
                  ? t(
                      "Awareness improved. Coverage still matters.",
                      "Kesadaran meningkat. Cakupan tetap penting.",
                    )
                  : report === "Campaign"
                    ? t(
                        "Phishing refresher outcomes",
                        "Hasil penyegaran phishing",
                      )
                    : report === "Employee"
                      ? t(
                          "Employee awareness record",
                          "Catatan kesadaran karyawan",
                        )
                      : t(
                          "A traceable record of completion",
                          "Catatan penyelesaian yang dapat ditelusuri",
                        )}
              </h4>
              <p>
                {report === "Executive"
                  ? t(
                      "Awareness 71 → 78. Measured employees: 126 of 150. Next action: complete baseline for 24 unmeasured employees.",
                      "Kesadaran 71 → 78. Karyawan terukur: 126 dari 150. Langkah berikutnya: selesaikan asesmen awal untuk 24 karyawan yang belum diukur.",
                    )
                  : report === "Campaign"
                    ? t(
                        "108 of 150 assignments completed. 12 are overdue. Compare baseline and follow-up for the same participants.",
                        "108 dari 150 tugas selesai. 12 melewati tenggat. Bandingkan asesmen awal dan lanjutan untuk peserta yang sama.",
                      )
                    : report === "Employee"
                      ? t(
                          "Andini · Finance. Learning revision, completion date, quiz outcome, and evidence coverage remain distinct.",
                          "Andini · Keuangan. Revisi pembelajaran, tanggal selesai, hasil kuis, dan cakupan bukti tetap terpisah.",
                        )
                      : t(
                          "Connect employee, course revision, campaign, due date, completion, and certificate record.",
                          "Hubungkan karyawan, revisi kursus, kampanye, tenggat, penyelesaian, dan catatan sertifikat.",
                        )}
              </p>
              <dl className="ps-review-list">
                <div>
                  <dt>{t("Scope", "Cakupan")}</dt>
                  <dd>Acme Indonesia</dd>
                </div>
                <div>
                  <dt>{t("Period", "Periode")}</dt>
                  <dd>1–30 Sep 2026</dd>
                </div>
                <div>
                  <dt>{t("Format", "Format")}</dt>
                  <dd>CSV / PDF</dd>
                </div>
              </dl>
            </div>
            <button
              className="ps-button ps-button-primary"
              onClick={() => setReportReady(true)}
            >
              {t("Preview export scope", "Pratinjau cakupan ekspor")}
              <ArrowRight size={15} />
            </button>
            {reportReady && (
              <p className="ps-scene-note" role="status">
                {t(
                  "Scope confirmed: Acme Indonesia, September 2026, selected report category. In your workspace, CSV and PDF are generated by the server from authorized data.",
                  "Cakupan dikonfirmasi: Acme Indonesia, September 2026, kategori laporan terpilih. Di ruang kerja Anda, CSV dan PDF dibuat server dari data yang diizinkan.",
                )}
              </p>
            )}
          </>
        )}
        {current === "phishing" && (
          <>
            <div className="ps-inbox-preview">
              <div>
                <span className="ps-status">
                  {inboxState === "Submitted"
                    ? t("Submitted", "Dikirim")
                    : inboxState === "Reviewing"
                      ? t("Reviewing", "Ditinjau")
                      : t("Confirmed Suspicious", "Dikonfirmasi Mencurigakan")}
                </span>
                <h4>
                  {t(
                    "Updated payment details",
                    "Perubahan informasi pembayaran",
                  )}
                </h4>
                <p>accounts@vendor-example.test</p>
                <small>
                  {t("Reported by Andini · Email", "Dilaporkan Andini · Email")}
                </small>
              </div>
              <div>
                <strong>{t("Review timeline", "Riwayat tinjauan")}</strong>
                <p>09:12 · {t("Report submitted", "Laporan dikirim")}</p>
                {inboxState !== "Submitted" && (
                  <p>
                    09:15 ·{" "}
                    {t("Admin review started", "Tinjauan admin dimulai")}
                  </p>
                )}
                {inboxState === "Confirmed Suspicious" && (
                  <p>
                    09:18 ·{" "}
                    {t(
                      "Classified suspicious by reviewer",
                      "Diklasifikasikan mencurigakan oleh peninjau",
                    )}
                  </p>
                )}
              </div>
            </div>
            <p className="ps-scene-note">
              {t(
                "Review is performed by an administrator. Internal notes are admin-only. No automatic malware analysis is implied.",
                "Tinjauan dilakukan administrator. Catatan internal hanya untuk admin. Tidak ada analisis malware otomatis.",
              )}
            </p>
            <button
              className="ps-button ps-button-primary"
              onClick={() =>
                setInboxState(
                  inboxState === "Submitted"
                    ? "Reviewing"
                    : inboxState === "Reviewing"
                      ? "Confirmed Suspicious"
                      : "Submitted",
                )
              }
            >
              <ShieldCheck size={15} />
              {inboxState === "Submitted"
                ? t("Start demo review", "Mulai tinjauan demo")
                : inboxState === "Reviewing"
                  ? t("Classify as suspicious", "Klasifikasi mencurigakan")
                  : t("Reset demo report", "Atur ulang laporan demo")}
            </button>
          </>
        )}
      </div>
      <figcaption>
        {t(
          "Illustrative product data. Local interactions do not change a real workspace.",
          "Data produk ilustratif. Interaksi lokal tidak mengubah ruang kerja asli.",
        )}
      </figcaption>
    </figure>
  );
}
