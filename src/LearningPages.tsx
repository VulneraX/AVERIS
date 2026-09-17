import { useEffect, useRef, useState } from "react";
import { Link, useNavigate, useParams } from "react-router-dom";
import {
  ArrowLeft,
  ArrowRight,
  BookOpen,
  Check,
  Plus,
  Save,
  Trash2,
} from "lucide-react";
import { useAuth } from "./auth";
import {
  ActionLink,
  Brand,
  Button,
  ConfirmButton,
  Dialog,
  Download,
  Empty,
  ErrorNotice,
  Field,
  LanguageSwitch,
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
import { ScoreLedger } from "./WorkspacePages";
import { useIntelligence } from "./intelligence/shared";
import { CoachingMoment } from "./intelligence/EmployeeSecurity";

type Question = {
  prompt: string;
  type: "choice" | "multiple" | "boolean" | "scenario";
  options: string[];
  correct: number[];
  explanation: string;
};
type CourseDocument = {
  title: string;
  category: string;
  description: string;
  duration: number;
  difficulty: "Foundation" | "Intermediate" | "Advanced";
  language: "id" | "en";
  passingScore: number;
  maxAttempts: number;
  retryMinutes: number;
  lessons: Array<{
    title: string;
    content: string;
    kind: "Article" | "Scenario" | "Checklist" | "Security tip";
  }>;
  questions: Question[];
};
const blankQuestion: Question = {
  prompt: "",
  type: "choice",
  options: ["", ""],
  correct: [0],
  explanation: "",
};
const blankCourse: CourseDocument = {
  title: "",
  category: "",
  description: "",
  duration: 5,
  difficulty: "Foundation",
  language: "id",
  passingScore: 70,
  maxAttempts: 3,
  retryMinutes: 0,
  lessons: [{ title: "", content: "", kind: "Article" }],
  questions: [blankQuestion],
};
export function LearningLibrary() {
  const r = useData("/courses");
  const { t } = useLocale();
  const date = useDate();
  const statusLabel = useStatus();
  const { user } = useAuth();
  const [search, setSearch] = useState("");
  const [category, setCategory] = useState("");
  const [status, setStatus] = useState("");
  const [usage, setUsage] = useState("");
  const courses = r.data?.courses || [];
  const rows = courses.filter(
    (c: any) =>
      `${c.document.title} ${c.document.description}`
        .toLowerCase()
        .includes(search.toLowerCase()) &&
      (!category || c.document.category === category) &&
      (!status || c.status === status) &&
      (!usage || (usage === "used" ? c.assigned > 0 : !c.assigned)),
  );
  return (
    <>
      <PageTitle
        title={t("Learning library", "Pustaka pembelajaran")}
        description={t(
          "Practical security learning, managed from one place.",
          "Pembelajaran keamanan praktis yang dikelola dari satu tempat.",
        )}
        actions={
          user?.role !== "manager" ? (
            <>
              <ActionLink secondary to="/admin/studio?kind=content">
                {t("Content studio", "Studio konten")}
              </ActionLink>
              <ActionLink to="/admin/learning/new">
                {t("Create course", "Buat materi")}
              </ActionLink>
            </>
          ) : undefined
        }
      />
      <div className="toolbar">
        <input
          aria-label={t("Search learning", "Cari materi")}
          placeholder={t("Search learning…", "Cari materi…")}
          value={search}
          onChange={(e) => setSearch(e.target.value)}
        />
        <select
          aria-label={t("Category", "Kategori")}
          value={category}
          onChange={(e) => setCategory(e.target.value)}
        >
          <option value="">{t("All topics", "Semua topik")}</option>
          {[
            ...new Set<string>(courses.map((c: any) => c.document.category)),
          ].map((c) => (
            <option key={c}>{c}</option>
          ))}
        </select>
        <select
          aria-label={t("Status", "Status")}
          value={status}
          onChange={(e) => setStatus(e.target.value)}
        >
          <option value="">{t("All statuses", "Semua status")}</option>
          <option value="Published">{t("Published", "Terbit")}</option>
          <option value="Draft">{t("Draft", "Draf")}</option>
          <option value="Archived">{t("Archived", "Diarsipkan")}</option>
        </select>
        <select
          value={usage}
          onChange={(e) => setUsage(e.target.value)}
          aria-label={t("Usage", "Penggunaan")}
        >
          <option value="">{t("All usage", "Semua penggunaan")}</option>
          <option value="used">{t("Assigned", "Ditugaskan")}</option>
          <option value="unused">
            {t("Not assigned", "Belum ditugaskan")}
          </option>
        </select>
      </div>
      <Loading resource={r}>
        {rows.length ? (
          <div className="learning-library-sections">
            {[
              [true, t("AVERIS library", "Pustaka AVERIS")],
              [false, t("Organization learning", "Pembelajaran organisasi")],
            ].map(([isDefault, label]) => {
              const sectionRows = rows.filter(
                (course: any) => course.isDefault === isDefault,
              );
              if (!sectionRows.length) return null;
              return (
                <section
                  className="learning-library-section"
                  key={String(isDefault)}
                >
                  <div className="section-head">
                    <div>
                      <span className="eyebrow">
                        {isDefault ? "AVERIS" : t("ORGANIZATION", "ORGANISASI")}
                      </span>
                      <h2>{label}</h2>
                    </div>
                    <small>
                      {sectionRows.length} {t("modules", "modul")}
                    </small>
                  </div>
                  <div className="learning-card-grid">
                    {sectionRows.map((c: any) => (
                      <Link
                        to={`/admin/learning/${c.id}`}
                        className="learning-card"
                        key={c.id}
                      >
                        <div className="learning-card-icon">
                          <BookOpen size={19} />
                        </div>
                        <div className="learning-card-top">
                          <span className="learning-origin">
                            {isDefault
                              ? t("AVERIS default", "Default AVERIS")
                              : t("Created by your team", "Dibuat tim Anda")}
                          </span>
                          <Status value={c.status} />
                        </div>
                        <h3>{c.document.title}</h3>
                        <p>
                          {c.document.description ||
                            t("No description yet.", "Belum ada deskripsi.")}
                        </p>
                        <div className="learning-card-meta">
                          <span>{c.document.category}</span>
                          <span>
                            {c.document.duration} {t("min", "menit")}
                          </span>
                          <span>{statusLabel(c.document.difficulty)}</span>
                          <span>
                            {c.document.language === "id"
                              ? "Bahasa Indonesia"
                              : "English"}
                          </span>
                          <span>
                            {t("Revision", "Revisi")} {c.version}
                          </span>
                          <span>
                            {c.assigned || 0} {t("assigned", "ditugaskan")}
                          </span>
                        </div>
                        <div className="learning-card-foot">
                          <small>
                            {t("Updated", "Diperbarui")} {date(c.created_at)}
                          </small>
                          <ArrowRight size={15} />
                        </div>
                      </Link>
                    ))}
                  </div>
                </section>
              );
            })}
          </div>
        ) : (
          <Empty
            title={t("No matching learning", "Tidak ada materi yang sesuai")}
            description={t(
              "Adjust your filters or create a course with lessons and a quiz.",
              "Sesuaikan filter atau buat materi dengan pelajaran dan kuis.",
            )}
          />
        )}
      </Loading>
    </>
  );
}
export function CourseBuilder() {
  const { id } = useParams();
  const r = useData(id ? `/courses/${id}` : "/courses");
  const { user } = useAuth();
  const { t } = useLocale();
  const statusLabel = useStatus();
  const navigate = useNavigate();
  const date = useDate();
  const [document, setDocument] = useState<CourseDocument>(blankCourse);
  const [meta, setMeta] = useState<{
    courseId?: string;
    version?: number;
    status?: string;
  }>({});
  const [tab, setTab] = useState("basics");
  const [preview, setPreview] = useState(false);
  const [error, setError] = useState<unknown>(null);
  const [saved, setSaved] = useState(false);
  const [busy, setBusy] = useState(false);
  const [dirty, setDirty] = useState(false);
  const [publishConfirm, setPublishConfirm] = useState(false);
  const incomplete =
    !document.title.trim() ||
    !document.category.trim() ||
    document.lessons.some(
      (lesson) => !lesson.title.trim() || !lesson.content.trim(),
    ) ||
    document.questions.some(
      (question) =>
        !question.prompt.trim() ||
        !question.explanation.trim() ||
        question.options.some((option) => !option.trim()),
    );
  const saveRef = useRef<() => Promise<boolean>>(async () => true);
  const canEdit = user?.role !== "manager";
  useEffect(() => {
    if (id && r.data?.course) {
      setDocument(r.data.course.document);
      setMeta({
        courseId: r.data.course.course_id,
        version: r.data.course.version,
        status: r.data.course.status,
      });
      setDirty(false);
    }
  }, [id, r.data]);
  const set = (key: keyof CourseDocument, v: any) => {
    setDocument((d) => ({ ...d, [key]: v }));
    setDirty(true);
    setSaved(false);
  };
  const save = async (status: "Draft" | "Published") => {
    if (incomplete) {
      setError(new Error("COURSE_INCOMPLETE"));
      setTab(
        document.lessons.some(
          (lesson) => !lesson.title.trim() || !lesson.content.trim(),
        )
          ? "lessons"
          : "basics",
      );
      return false;
    }
    setBusy(true);
    setError(null);
    try {
      const result = await mutate<any>("/courses", {
        document,
        status,
        courseId: meta.courseId,
        baseVersion: meta.version,
      });
      setMeta({
        courseId: result.course.course_id,
        version: result.course.version,
        status: result.course.status,
      });
      setDirty(false);
      setSaved(true);
      if (!id)
        navigate(`/admin/learning/${result.course.id}`, { replace: true });
      return true;
    } catch (e) {
      setError(e);
      return false;
    } finally {
      setBusy(false);
    }
  };
  saveRef.current = () => save("Draft");
  useEffect(() => {
    if (
      !dirty ||
      !canEdit ||
      busy ||
      !document.title.trim() ||
      !document.category.trim() ||
      document.lessons.some((l) => !l.title.trim() || !l.content.trim()) ||
      document.questions.some(
        (q) =>
          !q.prompt.trim() ||
          !q.explanation.trim() ||
          q.options.some((o) => !o.trim()),
      )
    )
      return;
    const timeout = setTimeout(() => void saveRef.current(), 3000);
    return () => clearTimeout(timeout);
  }, [document, dirty, busy, canEdit]);
  useEffect(() => {
    const handler = (e: BeforeUnloadEvent) => {
      if (dirty) {
        e.preventDefault();
        e.returnValue = "";
      }
    };
    window.addEventListener("beforeunload", handler);
    return () => window.removeEventListener("beforeunload", handler);
  }, [dirty]);
  return (
    <>
      <Link className="text-link" to="/admin/learning">
        ← {t("Learning library", "Pustaka pembelajaran")}
      </Link>
      <PageTitle
        title={
          id
            ? document.title || t("Course", "Materi")
            : t("Create course", "Buat materi")
        }
        description={t(
          "Structured lessons and a quiz. Published versions preserve learning evidence.",
          "Pelajaran terstruktur dan kuis. Versi terbit mempertahankan bukti belajar.",
        )}
        actions={
          <>
            <Button variant="secondary" onClick={() => setPreview(true)}>
              {t("Preview", "Pratinjau")}
            </Button>
            {canEdit && (
              <>
                <Button
                  variant="secondary"
                  disabled={busy}
                  onClick={() => void save("Draft")}
                >
                  {t("Save draft", "Simpan draf")}
                </Button>
                <Button
                  disabled={busy || incomplete}
                  onClick={() => setPublishConfirm(true)}
                >
                  <Check size={15} />
                  {t("Publish learning", "Terbitkan pembelajaran")}
                </Button>
              </>
            )}
          </>
        }
      />
      <ErrorNotice error={error} />
      {incomplete && (
        <div className="notice warning" role="status">
          {t(
            "Complete the title, topic, lesson text, and quiz answers before saving or publishing.",
            "Lengkapi judul, topik, isi pelajaran, dan jawaban kuis sebelum menyimpan atau menerbitkan.",
          )}
        </div>
      )}
      {saved && (
        <div className="notice" role="status">
          {t("Version saved", "Versi tersimpan")} · {meta.version} ·{" "}
          {statusLabel(meta.status || "Draft")}
        </div>
      )}
      <Tabs
        value={tab}
        onChange={setTab}
        tabs={[
          ["basics", t("Course", "Materi")],
          ["lessons", t("Lessons", "Pelajaran")],
          ["quiz", t("Quiz", "Kuis")],
          ["history", t("Version history", "Riwayat versi")],
        ]}
      />
      <Loading resource={r}>
        <fieldset disabled={!canEdit || busy}>
          {tab === "basics" && (
            <div className="sheet">
              <div className="form-grid">
                <Field label={t("Title", "Judul")}>
                  <input
                    value={document.title}
                    required
                    onChange={(e) => set("title", e.target.value)}
                  />
                </Field>
                <Field label={t("Topic", "Topik")}>
                  <input
                    value={document.category}
                    required
                    onChange={(e) => set("category", e.target.value)}
                  />
                </Field>
              </div>
              <Field label={t("Description", "Deskripsi")}>
                <textarea
                  value={document.description}
                  onChange={(e) => set("description", e.target.value)}
                />
              </Field>
              <div className="form-grid">
                <Field label={t("Duration (minutes)", "Durasi (menit)")}>
                  <input
                    type="number"
                    min={1}
                    max={600}
                    value={document.duration}
                    onChange={(e) => set("duration", Number(e.target.value))}
                  />
                </Field>
                <Field label={t("Difficulty", "Kesulitan")}>
                  <select
                    value={document.difficulty}
                    onChange={(e) => set("difficulty", e.target.value)}
                  >
                    {["Foundation", "Intermediate", "Advanced"].map((x) => (
                      <option key={x} value={x}>
                        {statusLabel(x)}
                      </option>
                    ))}
                  </select>
                </Field>
                <Field
                  label={t("Content language", "Bahasa materi")}
                  hint={t(
                    "Course language is independent of the application language.",
                    "Bahasa materi terpisah dari bahasa aplikasi.",
                  )}
                >
                  <select
                    value={document.language}
                    onChange={(e) => set("language", e.target.value)}
                  >
                    <option value="id">Bahasa Indonesia</option>
                    <option value="en">English</option>
                  </select>
                </Field>
              </div>
              {id && (
                <div className="actions section">
                  <Button
                    variant="secondary"
                    onClick={async () => {
                      setBusy(true);
                      try {
                        const result = await mutate<any>("/courses", {
                          document: {
                            ...document,
                            title: `${document.title} (${t("copy", "salinan")})`,
                          },
                          status: "Draft",
                        });
                        navigate(`/admin/learning/${result.course.id}`);
                      } catch (e) {
                        setError(e);
                      } finally {
                        setBusy(false);
                      }
                    }}
                  >
                    {t("Duplicate", "Duplikasi")}
                  </Button>
                  <ConfirmButton
                    title={t("Archive learning?", "Arsipkan materi?")}
                    description={t(
                      "Existing assignments retain their version. The course is removed from future selection.",
                      "Tugas yang sudah ada mempertahankan versinya. Materi tidak dapat dipilih untuk tugas baru.",
                    )}
                    onConfirm={async () => {
                      await mutate(`/courses/${id}/archive`);
                      navigate("/admin/learning");
                    }}
                  >
                    {t("Archive", "Arsipkan")}
                  </ConfirmButton>
                </div>
              )}
            </div>
          )}
          {tab === "lessons" && (
            <>
              <p>
                {t(
                  "Write short, readable lessons. Each block becomes one step in the learning player.",
                  "Tulis pelajaran singkat dan mudah dibaca. Setiap blok menjadi satu langkah dalam pembelajaran.",
                )}
              </p>
              {document.lessons.map((l, i) => (
                <section className="editor-item" key={i}>
                  <header>
                    <h3>
                      {t("Lesson", "Pelajaran")} {i + 1}
                    </h3>
                    <Button
                      variant="quiet"
                      disabled={document.lessons.length < 2}
                      onClick={() =>
                        set(
                          "lessons",
                          document.lessons.filter((_, n) => n !== i),
                        )
                      }
                    >
                      {t("Remove", "Hapus")}
                    </Button>
                  </header>
                  <div className="form-grid">
                    <Field label={t("Title", "Judul")}>
                      <input
                        value={l.title}
                        onChange={(e) =>
                          set(
                            "lessons",
                            document.lessons.map((x, n) =>
                              n === i ? { ...x, title: e.target.value } : x,
                            ),
                          )
                        }
                      />
                    </Field>
                    <Field label={t("Format", "Format")}>
                      <select
                        value={l.kind}
                        onChange={(e) =>
                          set(
                            "lessons",
                            document.lessons.map((x, n) =>
                              n === i ? { ...x, kind: e.target.value } : x,
                            ),
                          )
                        }
                      >
                        {[
                          "Article",
                          "Scenario",
                          "Checklist",
                          "Security tip",
                        ].map((k) => (
                          <option key={k} value={k}>
                            {statusLabel(k)}
                          </option>
                        ))}
                      </select>
                    </Field>
                  </div>
                  <Field
                    label={t("Content", "Isi materi")}
                    hint={t(
                      "Use paragraphs or one checklist item per line. Content is rendered as safe text.",
                      "Gunakan paragraf atau satu butir per baris. Konten ditampilkan sebagai teks aman.",
                    )}
                  >
                    <textarea
                      rows={10}
                      value={l.content}
                      onChange={(e) =>
                        set(
                          "lessons",
                          document.lessons.map((x, n) =>
                            n === i ? { ...x, content: e.target.value } : x,
                          ),
                        )
                      }
                    />
                  </Field>
                </section>
              ))}
              <Button
                className="section"
                variant="secondary"
                onClick={() =>
                  set("lessons", [
                    ...document.lessons,
                    { title: "", content: "", kind: "Article" },
                  ])
                }
              >
                <Plus size={15} />
                {t("Add lesson", "Tambah pelajaran")}
              </Button>
            </>
          )}
          {tab === "quiz" && (
            <>
              <div className="sheet form-grid">
                <Field label={t("Passing score", "Nilai kelulusan")}>
                  <input
                    type="number"
                    min={1}
                    max={100}
                    value={document.passingScore}
                    onChange={(e) =>
                      set("passingScore", Number(e.target.value))
                    }
                  />
                </Field>
                <Field label={t("Attempt limit", "Batas percobaan")}>
                  <input
                    type="number"
                    min={1}
                    max={20}
                    value={document.maxAttempts}
                    onChange={(e) => set("maxAttempts", Number(e.target.value))}
                  />
                </Field>
                <Field
                  label={t("Retry delay (minutes)", "Jeda mengulang (menit)")}
                >
                  <input
                    type="number"
                    min={0}
                    max={43200}
                    value={document.retryMinutes}
                    onChange={(e) =>
                      set("retryMinutes", Number(e.target.value))
                    }
                  />
                </Field>
              </div>
              {document.questions.map((q, i) => {
                const change = (key: string, v: any) =>
                  set(
                    "questions",
                    document.questions.map((x, n) =>
                      n === i ? { ...x, [key]: v } : x,
                    ),
                  );
                return (
                  <section className="editor-item" key={i}>
                    <header>
                      <h3>
                        {t("Question", "Pertanyaan")} {i + 1}
                      </h3>
                      <Button
                        variant="quiet"
                        disabled={document.questions.length === 1}
                        onClick={() =>
                          set(
                            "questions",
                            document.questions.filter((_, n) => n !== i),
                          )
                        }
                      >
                        {t("Remove", "Hapus")}
                      </Button>
                    </header>
                    <Field label={t("Question type", "Jenis pertanyaan")}>
                      <select
                        value={q.type}
                        onChange={(e) => {
                          const type = e.target.value;
                          set(
                            "questions",
                            document.questions.map((x, n) =>
                              n === i
                                ? {
                                    ...x,
                                    type,
                                    correct: [0],
                                    options:
                                      type === "boolean"
                                        ? [
                                            t("True", "Benar"),
                                            t("False", "Salah"),
                                          ]
                                        : x.options,
                                  }
                                : x,
                            ),
                          );
                        }}
                      >
                        <option value="choice">
                          {t("Multiple choice", "Pilihan ganda")}
                        </option>
                        <option value="multiple">
                          {t("Multiple response", "Jawaban jamak")}
                        </option>
                        <option value="boolean">
                          {t("True / false", "Benar / salah")}
                        </option>
                        <option value="scenario">
                          {t("Scenario choice", "Pilihan skenario")}
                        </option>
                      </select>
                    </Field>
                    <Field label={t("Prompt", "Pertanyaan")}>
                      <textarea
                        value={q.prompt}
                        onChange={(e) => change("prompt", e.target.value)}
                      />
                    </Field>
                    <p>
                      <small>
                        {t(
                          "Select the correct answer(s).",
                          "Pilih jawaban yang benar.",
                        )}
                      </small>
                    </p>
                    {q.options.map((o, oi) => (
                      <div className="selection-row" key={oi}>
                        <input
                          type={q.type === "multiple" ? "checkbox" : "radio"}
                          name={`correct-${i}`}
                          aria-label={`${t("Correct answer", "Jawaban benar")} ${oi + 1}`}
                          checked={q.correct.includes(oi)}
                          onChange={() =>
                            change(
                              "correct",
                              q.type === "multiple"
                                ? q.correct.includes(oi)
                                  ? q.correct.filter((c) => c !== oi)
                                  : [...q.correct, oi]
                                : [oi],
                            )
                          }
                        />
                        <input
                          aria-label={`${t("Option", "Opsi")} ${oi + 1}`}
                          value={o}
                          onChange={(e) =>
                            change(
                              "options",
                              q.options.map((x, n) =>
                                n === oi ? e.target.value : x,
                              ),
                            )
                          }
                        />
                      </div>
                    ))}
                    {q.type !== "boolean" && q.options.length < 10 && (
                      <Button
                        variant="quiet"
                        onClick={() => change("options", [...q.options, ""])}
                      >
                        {t("Add option", "Tambah opsi")}
                      </Button>
                    )}
                    <Field
                      label={t(
                        "Feedback after submission",
                        "Penjelasan setelah jawaban dikirim",
                      )}
                    >
                      <textarea
                        value={q.explanation}
                        onChange={(e) => change("explanation", e.target.value)}
                      />
                    </Field>
                  </section>
                );
              })}
              <Button
                className="section"
                variant="secondary"
                onClick={() =>
                  set("questions", [
                    ...document.questions,
                    { ...blankQuestion, options: ["", ""], correct: [0] },
                  ])
                }
              >
                <Plus size={15} />
                {t("Add question", "Tambah pertanyaan")}
              </Button>
            </>
          )}
        </fieldset>
        {tab === "history" && (
          <div className="sheet">
            {r.data?.versions?.map((v: any) => (
              <div className="row" key={v.id}>
                <div>
                  <Link to={`/admin/learning/${v.id}`}>
                    {t("Version", "Versi")} {v.version}
                  </Link>
                  <small>{date(v.created_at, true)}</small>
                </div>
                <Status value={v.status} />
              </div>
            )) || (
              <Empty
                title={t("Save your first version", "Simpan versi pertama")}
                description={t(
                  "A version is retained each time valid content is saved.",
                  "Versi disimpan setiap kali konten valid disimpan.",
                )}
              />
            )}
          </div>
        )}
      </Loading>
      {preview && (
        <Dialog
          title={t("Employee preview", "Pratinjau karyawan")}
          onClose={() => setPreview(false)}
        >
          <h2>{document.title}</h2>
          {document.lessons.map((l, i) => (
            <article className="section" key={i}>
              <h3>{l.title}</h3>
              <div className="lesson-prose">{l.content}</div>
            </article>
          ))}
        </Dialog>
      )}
      {publishConfirm && (
        <Dialog
          title={t("Publish learning?", "Terbitkan pembelajaran?")}
          onClose={() => !busy && setPublishConfirm(false)}
        >
          <p>
            {t(
              "This version will be available for campaign assignment. Review the title, lessons, and quiz before publishing.",
              "Versi ini akan tersedia untuk ditugaskan ke kampanye. Periksa judul, pelajaran, dan kuis sebelum menerbitkan.",
            )}
          </p>
          <div className="actions section">
            <Button
              variant="secondary"
              disabled={busy}
              onClick={() => setPublishConfirm(false)}
            >
              {t("Keep editing", "Lanjut mengedit")}
            </Button>
            <Button
              disabled={busy}
              onClick={async () => {
                if (await save("Published")) setPublishConfirm(false);
              }}
            >
              {t("Confirm publish", "Konfirmasi terbitkan")}
            </Button>
          </div>
        </Dialog>
      )}
    </>
  );
}

function TaskRow({ a }: { a: any }) {
  const { t } = useLocale();
  const date = useDate();
  const active = a.program_status === "Active";
  const link =
    a.status === "Completed"
      ? `/employee/learning/${a.id}/result`
      : `/employee/learning/${a.id}`;
  return (
    <div className="row">
      <div>
        <strong>{a.title}</strong>
        <small>
          {a.duration} {t("min", "menit")} · {t("Due", "Tenggat")}{" "}
          {date(a.due_at)}
          {a.overdue ? ` · ${t("Overdue", "Terlambat")}` : ""}
        </small>
      </div>
      <div className="actions">
        <Status value={a.status} />
        {(active || a.status === "Completed") && (
          <Link className="text-link" to={link}>
            {a.status === "Completed"
              ? t("View result", "Lihat hasil")
              : t("Continue", "Lanjutkan")}{" "}
            →
          </Link>
        )}
      </div>
    </div>
  );
}
export function EmployeeHome() {
  const r = useData("/me");
  const security = useIntelligence("/me");
  const [coach, setCoach] = useState<any>(null);
  const coaching = security.data?.coaching.find((c: any) => !c.completed_at);
  const practice = security.data?.practice.find(
    (p: any) => p.status !== "Completed" && new Date(p.expires_at) > new Date(),
  );
  const { user } = useAuth();
  const { t } = useLocale();
  const date = useDate();
  const d = r.data;
  const nextAssessment = d?.assessments.find(
    (a: any) => !a.completed_at && !a.locked,
  );
  const next = d?.assignments
    .filter(
      (a: any) => a.status !== "Completed" && a.program_status === "Active",
    )
    .sort(
      (a: any, b: any) =>
        new Date(a.due_at).getTime() - new Date(b.due_at).getTime(),
    )[0];
  const completed =
    d?.assignments.filter((a: any) => a.status === "Completed").length || 0;
  return (
    <>
      <PageTitle
        eyebrow={t("MY WORKSPACE", "RUANG SAYA")}
        title={`${t("Hello", "Halo")}, ${user?.name.split(" ")[0]}`}
        description={t(
          "Your security learning, one step at a time.",
          "Pembelajaran keamanan Anda, selangkah demi selangkah.",
        )}
      />
      <Loading resource={r}>
        {d && (
          <>
            <ErrorNotice error={security.error} retry={security.reload} />
            {coaching ? (
              <section className="learning-next">
                <span className="eyebrow">
                  {t("YOUR NEXT ACTION", "TINDAKAN BERIKUTNYA")}
                </span>
                <h2>{coaching.topic}</h2>
                <p>{coaching.reason}</p>
                <small>
                  {t(
                    "A short coaching moment with practical guidance.",
                    "Sesi pembinaan singkat dengan panduan praktis.",
                  )}
                </small>
                <Button onClick={() => setCoach(coaching)}>
                  {t("Start coaching", "Mulai pembinaan")}
                  <ArrowRight size={15} />
                </Button>
              </section>
            ) : practice ? (
              <section className="learning-next">
                <span className="eyebrow">
                  {t("YOUR NEXT ACTION", "TINDAKAN BERIKUTNYA")}
                </span>
                <h2>
                  {practice.topic} ·{" "}
                  {t("Practice challenge", "Tantangan latihan")}
                </h2>
                <p>
                  {t(
                    "Practice a workplace decision and learn what to notice next time.",
                    "Latih keputusan di tempat kerja dan pelajari hal yang perlu diperhatikan.",
                  )}
                </p>
                <p>
                  {t("Due", "Tenggat")} {date(practice.expires_at)}
                </p>
                <ActionLink to={`/employee/challenges/${practice.id}`}>
                  {t("Start challenge", "Mulai tantangan")}
                </ActionLink>
              </section>
            ) : nextAssessment || next ? (
              <section className="learning-next">
                <span className="eyebrow">
                  {t("YOUR NEXT ACTION", "TINDAKAN BERIKUTNYA")}
                </span>
                <h2>
                  {nextAssessment
                    ? nextAssessment.kind === "Baseline"
                      ? t(
                          "Initial security assessment",
                          "Asesmen keamanan awal",
                        )
                      : t(
                          "Follow-up security assessment",
                          "Asesmen keamanan tindak lanjut",
                        )
                    : next.title}
                </h2>
                <p>
                  {nextAssessment
                    ? t(
                        "A short measurement of your security knowledge.",
                        "Pengukuran singkat pengetahuan keamanan Anda.",
                      )
                    : `${next.duration} ${t("minutes", "menit")} · ${t("Due", "Tenggat")} ${date(next.due_at)}`}
                </p>
                {!nextAssessment && next && (
                  <div className="learning-next-progress">
                    <Progress
                      value={
                        next.lessons
                          ? Math.round(
                              (Math.min(next.lesson_index, next.lessons) /
                                next.lessons) *
                                100,
                            )
                          : null
                      }
                      label={t("Lesson progress", "Progres pelajaran")}
                    />
                    <small>
                      {Math.max(
                        0,
                        Math.ceil(
                          next.duration *
                            (1 -
                              Math.min(next.lesson_index, next.lessons) /
                                Math.max(1, next.lessons)),
                        ),
                      )}{" "}
                      {t(
                        "min of learning remaining · estimate",
                        "menit belajar tersisa · perkiraan",
                      )}
                    </small>
                  </div>
                )}
                <ActionLink
                  to={
                    nextAssessment
                      ? `/employee/assessment/${nextAssessment.id}`
                      : `/employee/learning/${next.id}`
                  }
                >
                  {nextAssessment
                    ? t("Start assessment", "Mulai asesmen")
                    : next.lesson_index
                      ? t("Continue learning", "Lanjutkan pembelajaran")
                      : t("Start learning", "Mulai pembelajaran")}
                </ActionLink>
              </section>
            ) : (
              <Empty
                title={t("You are up to date", "Semua tugas sudah ditangani")}
                description={t(
                  "New required learning will appear here when assigned.",
                  "Pembelajaran wajib baru akan muncul di sini saat ditugaskan.",
                )}
              />
            )}
            <div className="metric-grid section">
              <Metric
                label={t("My progress", "Progres saya")}
                value={`${completed} / ${d.assignments.length}`}
                note={t(
                  "Required activities completed",
                  "Aktivitas wajib selesai",
                )}
              />
              <Metric
                label={t("Awareness Score", "Skor Kesadaran")}
                value={d.score ?? t("Unmeasured", "Belum terukur")}
                note={
                  d.score === null
                    ? t(
                        "Complete an assessment to measure",
                        "Selesaikan asesmen untuk mengukur",
                      )
                    : `${d.coverage}% ${t("evidence coverage", "cakupan bukti")}`
                }
              />
              <Metric
                label={t("Certificates earned", "Sertifikat diperoleh")}
                value={
                  d.certificates.filter((c: any) => c.status === "Valid").length
                }
              />
              <Metric
                label={t("Learning remaining", "Pembelajaran tersisa")}
                value={
                  d.assignments.filter((a: any) => a.status !== "Completed")
                    .length
                }
              />
            </div>
            <div className="split">
              <section className="sheet">
                <div className="section-head">
                  <h2>{t("My learning", "Pembelajaran saya")}</h2>
                  <Link to="/employee/learning">
                    {t("View all", "Lihat semua")} →
                  </Link>
                </div>
                {d.assignments.slice(0, 4).map((a: any) => (
                  <TaskRow a={a} key={a.id} />
                ))}
              </section>
              <section className="sheet">
                <h2>{t("Upcoming & recent", "Mendatang & terbaru")}</h2>
                {d.assessments
                  .filter((a: any) => a.locked && !a.completed_at)
                  .map((a: any) => (
                    <div className="row" key={a.id}>
                      <div>
                        <strong>
                          {t("Follow-up assessment", "Asesmen tindak lanjut")}
                        </strong>
                        <small>
                          {t(
                            "Unlocks after required learning is complete.",
                            "Terbuka setelah pembelajaran wajib selesai.",
                          )}
                        </small>
                      </div>
                    </div>
                  ))}
                {d.certificates.slice(0, 2).map((c: any) => (
                  <div className="row" key={c.id}>
                    <div>
                      <strong>{c.title}</strong>
                      <small>
                        {t("Certificate issued", "Sertifikat diterbitkan")} ·{" "}
                        {date(c.issued_at)}
                      </small>
                    </div>
                    <Check size={16} />
                  </div>
                ))}
                {!d.certificates.length && !d.assessments.length && (
                  <p className="section">
                    <small>
                      {t(
                        "Your next assessment and achievements will appear here.",
                        "Asesmen berikutnya dan pencapaian Anda akan muncul di sini.",
                      )}
                    </small>
                  </p>
                )}
              </section>
            </div>
          </>
        )}
      </Loading>
      {coach && (
        <CoachingMoment
          coaching={coach}
          onClose={() => setCoach(null)}
          onSaved={security.reload}
        />
      )}
    </>
  );
}
export function MyLearning() {
  const r = useData("/me");
  const { t } = useLocale();
  const [tab, setTab] = useState("assigned");
  const d = r.data;
  return (
    <>
      <PageTitle
        title={t("My learning", "Pembelajaran saya")}
        description={t(
          "Complete your assigned security learning and required assessments.",
          "Selesaikan pembelajaran keamanan dan asesmen wajib Anda.",
        )}
      />
      <Tabs
        value={tab}
        onChange={setTab}
        tabs={[
          ["assigned", t("Assigned", "Ditugaskan")],
          ["completed", t("Completed", "Selesai")],
        ]}
      />
      <Loading resource={r}>
        {d && (
          <>
            {d.assessments
              .filter((a: any) =>
                tab === "completed" ? a.completed_at : !a.completed_at,
              )
              .map((a: any) => (
                <div className="sheet row" key={a.id}>
                  <div>
                    <strong>
                      {a.kind === "Baseline"
                        ? t(
                            "Initial security assessment",
                            "Asesmen keamanan awal",
                          )
                        : t(
                            "Follow-up security assessment",
                            "Asesmen keamanan tindak lanjut",
                          )}
                    </strong>
                    <small>
                      {a.locked
                        ? t(
                            "Complete required learning to unlock.",
                            "Selesaikan materi wajib untuk membuka.",
                          )
                        : a.completed_at
                          ? `${t("Score", "Nilai")}: ${a.score}`
                          : t(
                              "Measure your security knowledge.",
                              "Ukur pengetahuan keamanan Anda.",
                            )}
                    </small>
                  </div>
                  {!a.locked && (
                    <ActionLink secondary to={`/employee/assessment/${a.id}`}>
                      {a.completed_at
                        ? t("View result", "Lihat hasil")
                        : t("Start", "Mulai")}
                    </ActionLink>
                  )}
                </div>
              ))}
            <div className="sheet section">
              {d.assignments
                .filter((a: any) =>
                  tab === "completed"
                    ? a.status === "Completed"
                    : a.status !== "Completed",
                )
                .map((a: any) => (
                  <TaskRow key={a.id} a={a} />
                ))}
              {!d.assignments.filter((a: any) =>
                tab === "completed"
                  ? a.status === "Completed"
                  : a.status !== "Completed",
              ).length && (
                <Empty
                  title={
                    tab === "completed"
                      ? t(
                          "No completed learning yet",
                          "Belum ada pembelajaran selesai",
                        )
                      : t(
                          "No outstanding learning",
                          "Tidak ada pembelajaran tertunda",
                        )
                  }
                  description={t(
                    "Assigned learning and your progress are saved here.",
                    "Materi yang ditugaskan dan progres Anda tersimpan di sini.",
                  )}
                />
              )}
            </div>
          </>
        )}
      </Loading>
    </>
  );
}
export function MyAwareness() {
  const r = useData("/me");
  const security = useIntelligence("/me");
  const { t } = useLocale();
  return (
    <>
      <PageTitle
        title={t("My Awareness", "Awareness Saya")}
        description={t(
          "Understand your security knowledge and how it changes.",
          "Pahami pengetahuan keamanan Anda dan perubahannya.",
        )}
      />
      <Loading resource={r}>
        {r.data && (
          <>
            <div className="learning-next">
              <span className="eyebrow">
                {t("Awareness Score", "Skor Kesadaran")}
              </span>
              <div className="score-line">
                <strong>
                  {r.data.score ?? t("Unmeasured", "Belum terukur")}
                </strong>
                {r.data.score !== null && <span>/ 100</span>}
                <Status value={r.data.risk} />
              </div>
              <div className="row">
                <span>
                  {t("Measured component coverage", "Cakupan komponen terukur")}
                </span>
                <strong>{r.data.coverage}%</strong>
              </div>
              {r.data.score !== null && r.data.coverage < 100 && (
                <small>
                  {t(
                    "Partial evidence: some score components have not been measured yet.",
                    "Bukti parsial: beberapa komponen skor belum diukur.",
                  )}
                </small>
              )}
              <p>
                {t(
                  "A learning guide, not a performance rating. Your next assessment or learning result adds new evidence.",
                  "Panduan belajar, bukan penilaian kinerja. Asesmen atau hasil belajar berikutnya menambahkan bukti baru.",
                )}
              </p>
              <ActionLink secondary to="/employee/learning">
                {t("Continue learning", "Lanjutkan pembelajaran")}
              </ActionLink>
            </div>
            <Loading resource={security}>
              {security.data && (
                <div className="split section">
                  <section className="sheet">
                    <h2>{t("Your next skill", "Keterampilan berikutnya")}</h2>
                    <h3 className="section">{security.data.plan.topic}</h3>
                    <p>{security.data.plan.reason}</p>
                    <p className="section">{security.data.plan.outcome}</p>
                    <Link className="text-link row" to="/employee">
                      {t("See my next action", "Lihat tindakan berikutnya")}
                      <ArrowRight size={15} />
                    </Link>
                  </section>
                  <section className="sheet">
                    <h2>{t("Achievements", "Pencapaian")}</h2>
                    <div className="row">
                      <span>{security.data.level}</span>
                      <strong>
                        {security.data.streak}{" "}
                        {t("week activity streak", "minggu aktivitas beruntun")}
                      </strong>
                    </div>
                    {security.data.badges.length ? (
                      security.data.badges.map((b: any) => (
                        <div className="row" key={b.name}>
                          <Check size={18} />
                          <div>
                            <strong>{b.name}</strong>
                            <small>{b.description}</small>
                          </div>
                        </div>
                      ))
                    ) : (
                      <p>
                        {t(
                          "Learning, practice and verified reports build your achievement record.",
                          "Pembelajaran, latihan, dan laporan terverifikasi membentuk catatan pencapaian Anda.",
                        )}
                      </p>
                    )}
                  </section>
                </div>
              )}
            </Loading>
            <ScoreLedger
              components={r.data.components}
              events={r.data.events}
            />
          </>
        )}
      </Loading>
    </>
  );
}

export function LearningPlayer() {
  const { id } = useParams();
  const r = useData(`/learning/${id}`);
  const { t } = useLocale();
  const status = useStatus();
  const navigate = useNavigate();
  const [index, setIndex] = useState(0);
  const [completedLessons, setCompletedLessons] = useState(0);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<unknown>(null);
  useEffect(() => {
    if (r.data) {
      setCompletedLessons(r.data.assignment.lesson_index);
      setIndex(
        Math.min(
          r.data.assignment.lesson_index,
          r.data.document.lessons.length - 1,
        ),
      );
    }
  }, [r.data]);
  const d = r.data;
  const next = async () => {
    setBusy(true);
    setError(null);
    try {
      await mutate(`/learning/${id}/progress`, { lessonIndex: index + 1 });
      setCompletedLessons((previous) => Math.max(previous, index + 1));
      if (index === d.document.lessons.length - 1)
        navigate(`/employee/learning/${id}/quiz`);
      else setIndex(index + 1);
    } catch (e) {
      setError(e);
    } finally {
      setBusy(false);
    }
  };
  return (
    <div className="lesson-shell">
      <header className="lesson-top">
        <Link to="/employee/learning">
          ← {t("Back to learning", "Kembali ke pembelajaran")}
        </Link>
        <strong>{d?.document.title}</strong>
        <LanguageSwitch />
      </header>
      <Loading resource={r}>
        {d && (
          <>
            <div className="lesson-layout">
              <nav
                className="lesson-nav"
                aria-label={t("Lessons", "Pelajaran")}
              >
                <span className="eyebrow">
                  {t("COURSE CONTENT", "ISI MATERI")}
                </span>
                {d.document.lessons.map((l: any, i: number) => (
                  <button
                    key={i}
                    className={i === index ? "active" : ""}
                    disabled={i > completedLessons}
                    aria-current={i === index ? "step" : undefined}
                    onClick={() => setIndex(i)}
                  >
                    <span>
                      {i < completedLessons ? <Check size={14} /> : `${i + 1}.`}
                    </span>{" "}
                    {l.title}
                  </button>
                ))}
              </nav>
              <label className="lesson-mobile-navigation">
                {t("Lesson navigation", "Navigasi pelajaran")}
                <select
                  value={index}
                  onChange={(event) => setIndex(Number(event.target.value))}
                >
                  {d.document.lessons.map((lesson: any, position: number) => (
                    <option
                      key={position}
                      value={position}
                      disabled={position > completedLessons}
                    >
                      {position + 1}. {lesson.title}
                    </option>
                  ))}
                </select>
              </label>
              <article
                key={index}
                className="lesson-article"
                lang={d.document.language}
              >
                <span className="eyebrow">
                  {t("LESSON", "PELAJARAN")} {index + 1} /{" "}
                  {d.document.lessons.length} ·{" "}
                  {status(d.document.lessons[index].kind)}
                </span>
                <Progress
                  value={Math.round(
                    (completedLessons / d.document.lessons.length) * 100,
                  )}
                />
                <small role="status">
                  {completedLessons} / {d.document.lessons.length}{" "}
                  {t(
                    "lessons completed · progress saves when you continue",
                    "pelajaran selesai · progres tersimpan saat melanjutkan",
                  )}
                </small>
                <h1>{d.document.lessons[index].title}</h1>
                {d.document.lessons[index].kind === "Checklist" ? (
                  <ul className="lesson-prose">
                    {d.document.lessons[index].content
                      .split("\n")
                      .filter(Boolean)
                      .map((line: string, i: number) => (
                        <li key={i}>{line}</li>
                      ))}
                  </ul>
                ) : (
                  <div className="lesson-prose">
                    {d.document.lessons[index].content}
                  </div>
                )}
                <ErrorNotice error={error} />
                <div className="builder-footer">
                  <Button
                    variant="secondary"
                    disabled={index === 0 || busy}
                    onClick={() => setIndex(index - 1)}
                  >
                    <ArrowLeft size={15} />
                    {t("Previous", "Sebelumnya")}
                  </Button>
                  <Button disabled={busy} onClick={() => void next()}>
                    {index === d.document.lessons.length - 1
                      ? t("Continue to quiz", "Lanjutkan ke kuis")
                      : t("Next lesson", "Pelajaran berikutnya")}
                    <ArrowRight size={15} />
                  </Button>
                </div>
              </article>
            </div>
          </>
        )}
      </Loading>
    </div>
  );
}
export function Quiz() {
  const { id } = useParams();
  const r = useData(`/learning/${id}`);
  const { t } = useLocale();
  const navigate = useNavigate();
  const [attempt, setAttempt] = useState<any>(null);
  const [answers, setAnswers] = useState<number[][]>([]);
  const [index, setIndex] = useState(0);
  const [error, setError] = useState<unknown>(null);
  const [busy, setBusy] = useState(false);
  const start = async () => {
    setBusy(true);
    try {
      const result = await mutate<any>(`/learning/${id}/quiz`);
      setAttempt(result);
      setAnswers(result.questions.map(() => []));
    } catch (e) {
      setError(e);
    } finally {
      setBusy(false);
    }
  };
  const submit = async () => {
    setBusy(true);
    try {
      await mutate(`/learning/${id}/quiz/${attempt.attempt.id}`, { answers });
      navigate(`/employee/learning/${id}/result`);
    } catch (e) {
      setError(e);
    } finally {
      setBusy(false);
    }
  };
  const d = r.data;
  return (
    <div className="lesson-shell">
      <header className="lesson-top">
        <Link to={`/employee/learning/${id}`}>
          ← {t("Review lesson", "Tinjau pelajaran")}
        </Link>
        <strong>{d?.document.title}</strong>
        <LanguageSwitch />
      </header>
      <main className="quiz-wrap">
        <ErrorNotice error={error} />
        <Loading resource={r}>
          {d &&
            (attempt ? (
              <QuestionPlayer
                questions={attempt.questions}
                index={index}
                setIndex={setIndex}
                answers={answers}
                setAnswers={setAnswers}
                onSubmit={submit}
                busy={busy}
              />
            ) : (
              <>
                <span className="eyebrow">
                  {t("KNOWLEDGE CHECK", "UJI PENGETAHUAN")}
                </span>
                <h1>
                  {t(
                    "Ready to check your understanding?",
                    "Siap menguji pemahaman Anda?",
                  )}
                </h1>
                <p>
                  {t(
                    "Review the learning whenever you need. Your answers are graded when you submit.",
                    "Tinjau materi kapan saja. Jawaban dinilai setelah dikirim.",
                  )}
                </p>
                <div className="sheet section">
                  <div className="row">
                    <span>{t("Questions", "Pertanyaan")}</span>
                    <strong>{d.questionCount}</strong>
                  </div>
                  <div className="row">
                    <span>{t("Passing score", "Nilai kelulusan")}</span>
                    <strong>{d.document.passingScore}/100</strong>
                  </div>
                  <div className="row">
                    <span>{t("Attempt limit", "Batas percobaan")}</span>
                    <strong>{d.document.maxAttempts}</strong>
                  </div>
                  <div className="row">
                    <span>{t("Estimated time", "Perkiraan waktu")}</span>
                    <strong>
                      {Math.max(1, Math.ceil(d.questionCount * 0.7))}{" "}
                      {t("min", "menit")}
                    </strong>
                  </div>
                  <div className="row">
                    <span>{t("Retry delay", "Jeda mengulang")}</span>
                    <strong>
                      {d.document.retryMinutes} {t("min", "menit")}
                    </strong>
                  </div>
                </div>
                <Button
                  className="section"
                  disabled={busy}
                  onClick={() => void start()}
                >
                  {t("Start quiz", "Mulai kuis")}
                  <ArrowRight size={15} />
                </Button>
              </>
            ))}
        </Loading>
      </main>
    </div>
  );
}
function QuestionPlayer({
  questions,
  index,
  setIndex,
  answers,
  setAnswers,
  onSubmit,
  busy,
}: {
  questions: any[];
  index: number;
  setIndex: (n: number) => void;
  answers: number[][];
  setAnswers: (a: number[][]) => void;
  onSubmit: () => void;
  busy: boolean;
}) {
  const { t } = useLocale();
  const q = questions[index];
  const selected = answers[index] || [];
  return (
    <>
      <span className="eyebrow">
        {t("QUESTION", "PERTANYAAN")} {index + 1} / {questions.length}
      </span>
      <Progress value={Math.round(((index + 1) / questions.length) * 100)} />
      <h1>{q.prompt}</h1>
      <p>
        <small>
          {q.type === "multiple"
            ? t(
                "Select all correct answers.",
                "Pilih semua jawaban yang benar.",
              )
            : t("Select one answer.", "Pilih satu jawaban.")}
        </small>
      </p>
      <fieldset>
        <legend className="skip-link">{q.prompt}</legend>
        {q.options.map((option: string, i: number) => (
          <label className="quiz-option" key={i}>
            <input
              name={`q-${index}`}
              type={q.type === "multiple" ? "checkbox" : "radio"}
              checked={selected.includes(i)}
              onChange={() =>
                setAnswers(
                  answers.map((a, n) =>
                    n === index
                      ? q.type === "multiple"
                        ? a.includes(i)
                          ? a.filter((x) => x !== i)
                          : [...a, i]
                        : [i]
                      : a,
                  ),
                )
              }
            />
            <span>{option}</span>
          </label>
        ))}
      </fieldset>
      <div className="builder-footer">
        <Button
          variant="secondary"
          disabled={!index || busy}
          onClick={() => setIndex(index - 1)}
        >
          {t("Previous", "Sebelumnya")}
        </Button>
        {index === questions.length - 1 ? (
          <Button
            disabled={busy || answers.some((a) => !a.length)}
            onClick={onSubmit}
          >
            {t("Submit answers", "Kirim jawaban")}
          </Button>
        ) : (
          <Button
            disabled={!selected.length}
            onClick={() => setIndex(index + 1)}
          >
            {t("Next question", "Pertanyaan berikutnya")}
          </Button>
        )}
      </div>
      {index === questions.length - 1 && answers.some((a) => !a.length) && (
        <div className="notice error">
          {t(
            "Some questions are unanswered. Review earlier questions before submitting.",
            "Beberapa pertanyaan belum dijawab. Tinjau pertanyaan sebelumnya sebelum mengirim.",
          )}
        </div>
      )}
    </>
  );
}
export function QuizResult() {
  const { id } = useParams();
  const r = useData(`/learning/${id}/result`);
  const { t } = useLocale();
  const date = useDate();
  const d = r.data;
  return (
    <div className="quiz-wrap">
      <Link className="text-link" to="/employee/learning">
        ← {t("My learning", "Pembelajaran saya")}
      </Link>
      <Loading resource={r}>
        {d && (
          <>
            <span className="eyebrow section">
              {t("RESULT", "HASIL")} · {d.title}
            </span>
            <h1>
              {d.passed
                ? t("Learning completed", "Pembelajaran selesai")
                : t(
                    "A few topics need another look",
                    "Beberapa topik perlu ditinjau kembali",
                  )}
            </h1>
            <div className="quiz-result-score">
              {d.score}
              <small>/100</small>
            </div>
            <p>
              {d.passed
                ? t(
                    "Your result is saved and your certificate is ready.",
                    "Hasil tersimpan dan sertifikat Anda tersedia.",
                  )
                : t(
                    "Review the explanations and revisit the lesson before your next attempt.",
                    "Tinjau penjelasan dan pelajari kembali materi sebelum percobaan berikutnya.",
                  )}
            </p>
            <div className="actions section">
              {d.passed ? (
                <ActionLink to="/employee/certificates">
                  {t("View certificate", "Lihat sertifikat")}
                </ActionLink>
              ) : (
                <>
                  <ActionLink to={`/employee/learning/${id}`}>
                    {t(
                      "Review recommended lesson",
                      "Tinjau pelajaran yang disarankan",
                    )}
                  </ActionLink>
                  {d.remainingAttempts > 0 &&
                    (!d.retryAt || new Date(d.retryAt) <= new Date()) && (
                      <ActionLink
                        secondary
                        to={`/employee/learning/${id}/quiz`}
                      >
                        {t("Retake quiz", "Ulangi kuis")}
                      </ActionLink>
                    )}
                </>
              )}
            </div>
            {!d.passed && (
              <p className="section">
                <small>
                  {d.remainingAttempts}{" "}
                  {t("attempts remaining", "percobaan tersisa")} ·{" "}
                  {t("Next eligible attempt", "Percobaan berikutnya tersedia")}{" "}
                  {date(d.retryAt, true)}
                </small>
              </p>
            )}
            <h2 className="section">
              {t("Answer review", "Tinjauan jawaban")}
            </h2>
            {d.review.map((q: any, i: number) => (
              <article className="question-review" key={i}>
                <span className={q.isCorrect ? "positive" : "negative"}>
                  {q.isCorrect ? t("Correct", "Benar") : t("Review", "Tinjau")}{" "}
                  · {i + 1}
                </span>
                <h3 className="section">{q.prompt}</h3>
                <p>
                  {t("Your answer", "Jawaban Anda")}:{" "}
                  {q.selected.map((n: number) => q.options[n]).join("; ")}
                </p>
                {!q.isCorrect && (
                  <p>
                    {t("Correct answer", "Jawaban benar")}:{" "}
                    {q.correct.map((n: number) => q.options[n]).join("; ")}
                  </p>
                )}
                <p>{q.explanation}</p>
              </article>
            ))}
          </>
        )}
      </Loading>
    </div>
  );
}
export function Assessment() {
  const { id } = useParams();
  const r = useData(`/assessments/${id}`);
  const { t } = useLocale();
  const [index, setIndex] = useState(0);
  const [answers, setAnswers] = useState<number[][]>([]);
  const [start, setStart] = useState(false);
  const [result, setResult] = useState<any>(null);
  const [error, setError] = useState<unknown>(null);
  const [busy, setBusy] = useState(false);
  useEffect(() => {
    if (r.data) setAnswers(r.data.questions.map(() => []));
  }, [r.data]);
  const d = r.data;
  const submit = async () => {
    setBusy(true);
    try {
      setResult(await mutate(`/assessments/${id}`, { answers }));
    } catch (e) {
      setError(e);
    } finally {
      setBusy(false);
    }
  };
  const done = result || d?.assessment.completed_at;
  const score = result?.score ?? d?.assessment.score;
  const before = result?.before ?? d?.before;
  return (
    <div className="lesson-shell">
      <header className="lesson-top">
        <Link to="/employee/learning">
          ← {t("Back to learning", "Kembali ke pembelajaran")}
        </Link>
        <span>{t("REQUIRED ASSESSMENT", "ASESMEN WAJIB")}</span>
        <LanguageSwitch />
      </header>
      <div className="quiz-wrap">
        <ErrorNotice error={error} />
        <Loading resource={r}>
          {d &&
            (done ? (
              <>
                <span className="eyebrow">
                  {t("MEASUREMENT COMPLETE", "PENGUKURAN SELESAI")}
                </span>
                <h1>
                  {t(
                    "Your security knowledge is measured",
                    "Pengetahuan keamanan Anda telah diukur",
                  )}
                </h1>
                <div className="quiz-result-score">
                  {score}
                  <small>/100</small>
                </div>
                {d.assessment.kind === "Follow-up" && before !== null && (
                  <div className="metric-grid">
                    <Metric label={t("Before", "Sebelum")} value={before} />
                    <Metric label={t("After", "Sesudah")} value={score} />
                    <Metric
                      label={t("Improvement", "Peningkatan")}
                      value={`${score - before >= 0 ? "+" : ""}${score - before}`}
                    />
                  </div>
                )}
                <ActionLink to="/employee">
                  {t("Continue", "Lanjutkan")}
                </ActionLink>
              </>
            ) : start ? (
              <QuestionPlayer
                questions={d.questions}
                index={index}
                setIndex={setIndex}
                answers={answers}
                setAnswers={setAnswers}
                onSubmit={() => void submit()}
                busy={busy}
              />
            ) : (
              <>
                <span className="eyebrow">
                  {d.assessment.kind === "Baseline"
                    ? t("INITIAL MEASUREMENT", "PENGUKURAN AWAL")
                    : t("FOLLOW-UP MEASUREMENT", "PENGUKURAN TINDAK LANJUT")}
                </span>
                <h1>
                  {d.assessment.kind === "Baseline"
                    ? t(
                        "Where are you starting from?",
                        "Bagaimana pemahaman awal Anda?",
                      )
                    : t(
                        "What changed after learning?",
                        "Apa yang berubah setelah belajar?",
                      )}
                </h1>
                <p>
                  {d.assessment.kind === "Baseline"
                    ? t(
                        "Measures your current security knowledge before learning. This establishes a baseline, not a pass or fail.",
                        "Mengukur pengetahuan keamanan Anda sebelum belajar. Ini menetapkan kondisi awal, bukan lulus atau gagal.",
                      )
                    : t(
                        "Measures how your knowledge changed after completing the program.",
                        "Mengukur perubahan pengetahuan setelah menyelesaikan program.",
                      )}
                </p>
                <p className="section">
                  {d.questions.length} {t("questions", "pertanyaan")} ·{" "}
                  {Math.max(1, Math.ceil(d.questions.length * 0.7))}{" "}
                  {t("min", "menit")}
                </p>
                <Button className="section" onClick={() => setStart(true)}>
                  {t("Start assessment", "Mulai asesmen")}
                </Button>
              </>
            ))}
        </Loading>
      </div>
    </div>
  );
}
export function Certificates() {
  const { user } = useAuth();
  const r = useData("/certificates");
  const { t } = useLocale();
  const date = useDate();
  const [search, setSearch] = useState("");
  const [revoking, setRevoking] = useState<any>(null);
  const [reason, setReason] = useState("");
  const [error, setError] = useState<unknown>(null);
  const admin = user?.role === "admin" || user?.role === "super_admin";
  const rows =
    r.data?.certificates.filter((c: any) =>
      `${c.title} ${c.employee} ${c.id}`
        .toLowerCase()
        .includes(search.toLowerCase()),
    ) || [];
  return (
    <>
      <PageTitle
        title={t("Certificates", "Sertifikat")}
        description={t(
          "Verified learning achievements with downloadable certificates.",
          "Pencapaian belajar terverifikasi dengan sertifikat yang dapat diunduh.",
        )}
      />
      <div className="toolbar">
        <input
          placeholder={t("Search certificates…", "Cari sertifikat…")}
          aria-label={t("Search certificates", "Cari sertifikat")}
          value={search}
          onChange={(e) => setSearch(e.target.value)}
        />
      </div>
      <ErrorNotice error={error} />
      <Loading resource={r}>
        {rows.length ? (
          <div className="sheet">
            {rows.map((c: any) => (
              <div className="row" key={c.id}>
                <div>
                  <strong>{c.title}</strong>
                  <small>
                    {user?.role !== "employee" ? `${c.employee} · ` : ""}
                    {date(c.issued_at)} · {c.score}/100
                  </small>
                  {c.reason && (
                    <small>
                      {t("Reason", "Alasan")}: {c.reason}
                    </small>
                  )}
                </div>
                <div className="actions">
                  <Status value={c.status} />
                  {c.status === "Valid" && (
                    <Download path={`/certificates/${c.id}/pdf`}>
                      {t("Download PDF", "Unduh PDF")}
                    </Download>
                  )}
                  <Link className="text-link" to={`/verify/${c.id}`}>
                    {t("Verify", "Verifikasi")}
                  </Link>
                  {admin &&
                    (c.status === "Valid" ? (
                      <Button
                        variant="quiet"
                        onClick={() => {
                          setRevoking(c);
                          setReason("");
                        }}
                      >
                        {t("Revoke", "Cabut")}
                      </Button>
                    ) : (
                      <ConfirmButton
                        title={t(
                          "Reinstate certificate?",
                          "Pulihkan sertifikat?",
                        )}
                        description={t(
                          "The existing certificate will become valid again. Its audit history remains.",
                          "Sertifikat yang ada akan berlaku kembali. Riwayat audit tetap tersimpan.",
                        )}
                        onConfirm={async () => {
                          await mutate(`/certificates/${c.id}/reissue`);
                          r.reload();
                        }}
                      >
                        {t("Reinstate", "Pulihkan")}
                      </ConfirmButton>
                    ))}
                </div>
              </div>
            ))}
          </div>
        ) : (
          <Empty
            title={t(
              "No certificates earned yet",
              "Belum ada sertifikat diperoleh",
            )}
            description={t(
              "Pass a course quiz to earn a verifiable certificate.",
              "Lulus kuis materi untuk mendapatkan sertifikat terverifikasi.",
            )}
            action={
              user?.role === "employee" ? (
                <ActionLink to="/employee/learning">
                  {t("Continue learning", "Lanjutkan pembelajaran")}
                </ActionLink>
              ) : undefined
            }
          />
        )}
      </Loading>
      {revoking && (
        <Dialog
          title={t("Revoke certificate", "Cabut sertifikat")}
          onClose={() => setRevoking(null)}
        >
          <form
            onSubmit={async (e) => {
              e.preventDefault();
              try {
                await mutate(`/certificates/${revoking.id}/revoke`, { reason });
                setRevoking(null);
                r.reload();
              } catch (e) {
                setError(e);
              }
            }}
          >
            <Field label={t("Reason for revocation", "Alasan pencabutan")}>
              <textarea
                required
                minLength={5}
                maxLength={1000}
                value={reason}
                onChange={(e) => setReason(e.target.value)}
              />
            </Field>
            <footer>
              <Button variant="danger">
                {t("Revoke certificate", "Cabut sertifikat")}
              </Button>
            </footer>
          </form>
        </Dialog>
      )}
    </>
  );
}
