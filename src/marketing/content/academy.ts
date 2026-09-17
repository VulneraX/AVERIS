import { documentation } from "./knowledge";
import { guides } from "./editorial";
import {
  L,
  roles,
  type AcademyLesson,
  type AcademyTrack,
  type Localized,
} from "./schema";

function lesson(
  id: string,
  source: string,
  sectionIds: string[],
  question: Localized,
  options: Localized[],
  correct: number,
  explanation: Localized,
): AcademyLesson {
  const entry = [...documentation, ...guides].find(
    (item) => item.href === source,
  )!;
  const sections = entry.sections.filter((section) =>
    sectionIds.includes(section.id),
  );
  return {
    id,
    title: sections[0].heading,
    intro: entry.description,
    paragraphs: sections.flatMap((section) => [
      ...(section.paragraphs || []),
      ...(section.items || []),
    ]),
    related: source,
    check: { question, options, correct, explanation },
  };
}
export const academyTracks: AcademyTrack[] = [
  {
    slug: "admin-essentials",
    title: L("AVERIS Admin Essentials", "Dasar Administrator AVERIS"),
    description: L(
      "Prepare the workspace, assign responsibility, and publish dependable learning.",
      "Siapkan ruang kerja, tetapkan tanggung jawab, dan terbitkan pembelajaran yang andal.",
    ),
    audience: roles.admin,
    lessons: [
      lesson(
        "workspace",
        "/docs/getting-started",
        ["workspace", "sequence"],
        L(
          "What needs to exist before a campaign can assign learning?",
          "Apa yang harus tersedia sebelum kampanye dapat menugaskan pembelajaran?",
        ),
        [
          L(
            "Active employees and published learning",
            "Karyawan aktif dan materi terbit",
          ),
          L("A public demo score", "Nilai demo publik"),
          L(
            "An automatically connected directory",
            "Direktori yang terhubung otomatis",
          ),
        ],
        0,
        L(
          "The campaign uses active employee records and published course revisions from the workspace.",
          "Kampanye menggunakan catatan karyawan aktif dan revisi materi terbit dari ruang kerja.",
        ),
      ),
      lesson(
        "responsibility",
        "/docs/people-and-permissions",
        ["roles", "access"],
        L(
          "Who can launch a campaign?",
          "Siapa yang dapat meluncurkan kampanye?",
        ),
        [
          L("Every employee", "Setiap karyawan"),
          L("A manager preparing a draft", "Manajer yang menyiapkan draf"),
          L(
            "An administrator or tenant owner",
            "Administrator atau pemilik organisasi",
          ),
        ],
        2,
        L(
          "Managers can prepare drafts. Launching requires administrator permissions, enforced by the server.",
          "Manajer dapat menyiapkan draf. Peluncuran memerlukan izin administrator yang ditegakkan server.",
        ),
      ),
      lesson(
        "revisions",
        "/docs/learning-revisions",
        ["content", "revisions"],
        L(
          "What happens to an existing assignment when a course is edited?",
          "Apa yang terjadi pada tugas yang sudah ada saat materi diedit?",
        ),
        [
          L("Its evidence is deleted", "Buktinya dihapus"),
          L(
            "It keeps its assigned revision",
            "Tugas mempertahankan revisi yang ditugaskan",
          ),
          L(
            "It receives a new passing score automatically",
            "Tugas menerima nilai kelulusan baru secara otomatis",
          ),
        ],
        1,
        L(
          "Existing assignments retain their course revision. New edits can be used for future assignments.",
          "Tugas yang sudah ada mempertahankan revisi materi. Penyuntingan baru dapat digunakan untuk tugas berikutnya.",
        ),
      ),
    ],
  },
  {
    slug: "program-fundamentals",
    title: L(
      "Security Awareness Program Fundamentals",
      "Dasar Program Kesadaran Keamanan",
    ),
    description: L(
      "Connect the objective, audience, learning, and follow-up in one deliberate cycle.",
      "Hubungkan tujuan, audiens, pembelajaran, dan tindak lanjut dalam satu siklus terencana.",
    ),
    audience: roles.security,
    lessons: [
      lesson(
        "objective",
        "/guides/security-awareness-program",
        ["objective", "baseline"],
        L(
          "Which objective is most useful for a focused program?",
          "Tujuan mana yang paling berguna untuk program terarah?",
        ),
        [
          L(
            "Recognize unexpected bank-detail changes in payment requests",
            "Mengenali perubahan rekening tak terduga dalam permintaan pembayaran",
          ),
          L(
            "Make every dashboard number green",
            "Membuat semua angka dasbor berwarna hijau",
          ),
          L(
            "Finish as much content as possible",
            "Menyelesaikan materi sebanyak mungkin",
          ),
        ],
        0,
        L(
          "A concrete decision gives the audience, baseline, and learning a shared purpose.",
          "Keputusan konkret memberikan tujuan yang sama bagi audiens, kondisi awal, dan pembelajaran.",
        ),
      ),
      lesson(
        "practice",
        "/guides/security-awareness-program",
        ["learning", "practice"],
        L(
          "A simulation has no recorded response. What should you check first?",
          "Simulasi tidak memiliki respons tercatat. Apa yang perlu diperiksa terlebih dahulu?",
        ),
        [
          L("Whether the employee is unsafe", "Apakah karyawan tidak aman"),
          L(
            "Whether it was delivered and accessible",
            "Apakah simulasi terkirim dan dapat diakses",
          ),
          L(
            "Whether the awareness score can be set to zero",
            "Apakah nilai kesadaran dapat diatur menjadi nol",
          ),
        ],
        1,
        L(
          "A lack of response can reflect delivery or access. Verify those facts before interpreting behavior.",
          "Tidak adanya respons dapat mencerminkan masalah pengiriman atau akses. Verifikasi fakta tersebut sebelum menafsirkan perilaku.",
        ),
      ),
      lesson(
        "followup",
        "/guides/security-awareness-program",
        ["followup"],
        L(
          "What makes a before-and-after comparison useful?",
          "Apa yang membuat perbandingan sebelum dan sesudah berguna?",
        ),
        [
          L("The same course title alone", "Judul materi yang sama saja"),
          L(
            "Ignoring missing measurements",
            "Mengabaikan pengukuran yang belum tersedia",
          ),
          L(
            "A defined audience and both measurements, with limitations shown",
            "Audiens yang jelas dan kedua pengukuran, dengan batasan ditampilkan",
          ),
        ],
        2,
        L(
          "A comparison needs evidence at both points and an explanation of audience or coverage changes.",
          "Perbandingan memerlukan bukti pada kedua waktu dan penjelasan perubahan audiens atau cakupan.",
        ),
      ),
    ],
  },
  {
    slug: "reporting-evidence",
    title: L("Reporting & Evidence", "Pelaporan & Bukti"),
    description: L(
      "Choose a report, understand its scope, and make claims the evidence supports.",
      "Pilih laporan, pahami cakupannya, dan buat klaim yang didukung bukti.",
    ),
    audience: roles.grc,
    lessons: [
      lesson(
        "report-purpose",
        "/docs/outcome-reports",
        ["categories"],
        L(
          "Which report is designed around assignment and certificate records?",
          "Laporan mana yang berfokus pada catatan tugas dan sertifikat?",
        ),
        [
          L("Compliance Evidence", "Bukti Kepatuhan"),
          L("A public product tour", "Tur produk publik"),
          L("Delivery health alone", "Kesehatan pengiriman saja"),
        ],
        0,
        L(
          "Compliance Evidence provides the assignment register and certificate references when available.",
          "Bukti Kepatuhan menyediakan daftar tugas dan referensi sertifikat jika tersedia.",
        ),
      ),
      lesson(
        "scope",
        "/docs/outcome-reports",
        ["period", "files"],
        L(
          "Does selecting a period turn every record into a historical snapshot?",
          "Apakah memilih periode mengubah setiap catatan menjadi rekaman historis?",
        ),
        [
          L(
            "Yes, all fields are historical",
            "Ya, semua kolom bersifat historis",
          ),
          L(
            "No; current awareness and assignment status remain current-state views",
            "Tidak; kesadaran dan status tugas tetap menampilkan kondisi terkini",
          ),
        ],
        1,
        L(
          "Activity dates filter attempts and simulation events. Current-state measures need their own explanation.",
          "Tanggal aktivitas memfilter percobaan dan peristiwa simulasi. Pengukuran kondisi terkini memerlukan penjelasannya sendiri.",
        ),
      ),
      lesson(
        "claims",
        "/guides/awareness-measurement",
        ["comparison", "report"],
        L(
          "Which conclusion stays closest to the evidence?",
          "Kesimpulan mana yang paling sesuai dengan bukti?",
        ),
        [
          L(
            "The company cannot have a security incident",
            "Perusahaan tidak mungkin mengalami insiden keamanan",
          ),
          L(
            "Everyone is secure because training finished",
            "Semua orang aman karena pelatihan selesai",
          ),
          L(
            "Completed follow-ups improved; missing measurements are listed",
            "Hasil tindak lanjut yang selesai meningkat; pengukuran yang belum tersedia dicantumkan",
          ),
        ],
        2,
        L(
          "Describe the observed result, audience, and limitation instead of claiming an unmeasured outcome.",
          "Jelaskan hasil yang diamati, audiens, dan batasan, alih-alih mengklaim hasil yang belum diukur.",
        ),
      ),
    ],
  },
  {
    slug: "human-risk-fundamentals",
    title: L("Human Risk Fundamentals", "Dasar Risiko Manusia"),
    description: L(
      "Interpret scores, recognize missing evidence, and choose a useful next action.",
      "Tafsirkan nilai, kenali bukti yang belum ada, dan pilih tindakan berikutnya yang berguna.",
    ),
    audience: roles.everyone,
    lessons: [
      lesson(
        "context",
        "/guides/human-risk",
        ["context", "evidence"],
        L(
          "What should an awareness score help you do?",
          "Apa yang seharusnya dibantu oleh nilai kesadaran?",
        ),
        [
          L(
            "Label an employee permanently",
            "Melabeli karyawan secara permanen",
          ),
          L(
            "Choose the next evidence-based question or action",
            "Memilih pertanyaan atau tindakan berikutnya berdasarkan bukti",
          ),
          L(
            "Predict a breach with certainty",
            "Memprediksi pelanggaran dengan pasti",
          ),
        ],
        1,
        L(
          "Use the available evidence to guide work. A score does not describe the whole person or predict an incident.",
          "Gunakan bukti yang tersedia untuk memandu pekerjaan. Nilai tidak menggambarkan keseluruhan orang atau memprediksi insiden.",
        ),
      ),
      lesson(
        "coverage",
        "/docs/human-risk",
        ["score", "coverage"],
        L(
          "An employee has a score of 90 with 35% component coverage. What does that mean?",
          "Karyawan memiliki nilai 90 dengan cakupan komponen 35%. Apa artinya?",
        ),
        [
          L(
            "Every component has been measured",
            "Setiap komponen telah diukur",
          ),
          L(
            "Missing components count as zero",
            "Komponen yang belum tersedia dihitung nol",
          ),
          L(
            "The measured evidence scores highly; the picture is incomplete",
            "Bukti terukur bernilai tinggi; gambaran belum lengkap",
          ),
        ],
        2,
        L(
          "The score is normalized over measured components. Coverage keeps the missing evidence visible.",
          "Nilai dinormalisasi atas komponen terukur. Cakupan memperlihatkan bukti yang belum tersedia.",
        ),
      ),
      lesson(
        "next-action",
        "/guides/human-risk",
        ["action", "prove"],
        L(
          "Which response fits a weak measured topic?",
          "Respons mana yang sesuai untuk topik terukur yang lemah?",
        ),
        [
          L(
            "Assign focused learning and define a follow-up check",
            "Tugaskan pembelajaran terarah dan tetapkan pemeriksaan tindak lanjut",
          ),
          L("Hide the topic from reports", "Sembunyikan topik dari laporan"),
          L(
            "Assume completion proves risk reduction",
            "Anggap penyelesaian membuktikan penurunan risiko",
          ),
        ],
        0,
        L(
          "Connect the intervention to the evidence, then decide how to measure its result.",
          "Hubungkan intervensi dengan bukti, lalu tentukan cara mengukur hasilnya.",
        ),
      ),
    ],
  },
];
