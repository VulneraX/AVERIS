import { L, areas, roles, editorial, type ContentEntry } from "./schema";

export const documentation: ContentEntry[] = [
  {
    ...editorial,
    href: "/docs/getting-started",
    kind: "documentation",
    title: L("Your first AVERIS workspace", "Ruang kerja AVERIS pertama Anda"),
    description: L(
      "The roles, prerequisites, and sequence behind a measurable awareness program.",
      "Peran, prasyarat, dan urutan program kesadaran yang terukur.",
    ),
    topic: L("Getting started", "Memulai"),
    role: roles.everyone,
    area: areas.campaigns,
    difficulty: "foundation",
    related: [
      "/tutorials/first-awareness-program",
      "/docs/people-and-permissions",
      "/docs/human-risk",
    ],
    sections: [
      {
        id: "workspace",
        heading: L("Start with the work", "Mulai dari pekerjaan"),
        paragraphs: [
          L(
            "Administrators manage people, campaigns, learning, awareness, and reports. Employees use Home, Learning, My Awareness, and Certificates. The account role determines which workspace and actions are available.",
            "Administrator mengelola karyawan, kampanye, pembelajaran, kesadaran, dan laporan. Karyawan menggunakan Beranda, Pembelajaran, Kesadaran Saya, dan Sertifikat. Peran akun menentukan ruang kerja dan tindakan yang tersedia.",
          ),
        ],
      },
      {
        id: "sequence",
        heading: L(
          "Measure → Understand → Act → Prove",
          "Ukur → Pahami → Bertindak → Buktikan",
        ),
        items: [
          L(
            "Add active employees and review their departments. Publish the learning needed for the program.",
            "Tambahkan karyawan aktif dan tinjau departemennya. Terbitkan materi yang dibutuhkan program.",
          ),
          L(
            "Create a campaign with a baseline, a clear audience, focused learning, and a follow-up.",
            "Buat kampanye dengan asesmen awal, audiens jelas, pembelajaran terarah, dan tindak lanjut.",
          ),
          L(
            "Read awareness with coverage. Find overdue work, weak topics, and missing measurements.",
            "Baca kesadaran bersama cakupan. Temukan tugas terlambat, topik lemah, dan pengukuran yang belum tersedia.",
          ),
          L(
            "Review outcomes and export evidence. Record what changed and which measurement remains incomplete.",
            "Tinjau hasil dan ekspor bukti. Catat perubahan dan pengukuran yang belum lengkap.",
          ),
        ],
        ordered: true,
      },
      {
        id: "configuration",
        heading: L(
          "Check deployment configuration",
          "Periksa konfigurasi penerapan",
        ),
        paragraphs: [
          L(
            "Email delivery requires SMTP configuration. Organization sign-in requires the optional OIDC adapter to be configured by the deployment operator. An available configuration screen does not mean a connection is active.",
            "Pengiriman email memerlukan konfigurasi SMTP. Masuk organisasi memerlukan adaptor OIDC opsional yang dikonfigurasi pengelola penerapan. Layar konfigurasi yang tersedia tidak berarti koneksi aktif.",
          ),
        ],
      },
      {
        id: "evidence",
        heading: L(
          "Begin with honest empty states",
          "Mulai dengan kondisi kosong yang jujur",
        ),
        paragraphs: [
          L(
            "New employees are Unmeasured. A missing score is not zero, and public demonstrations are fictional. Only recorded workspace activity contributes to organizational evidence.",
            "Karyawan baru berstatus Belum diukur. Nilai yang belum tersedia bukan nol, dan demonstrasi publik menggunakan data fiktif. Hanya aktivitas ruang kerja yang tercatat yang menjadi bukti organisasi.",
          ),
        ],
      },
    ],
  },
  {
    ...editorial,
    href: "/docs/human-risk",
    kind: "documentation",
    title: L(
      "Awareness score and evidence coverage",
      "Nilai kesadaran dan cakupan bukti",
    ),
    description: L(
      "Read the score, its components, and what has not been measured.",
      "Baca nilai, komponennya, dan hal yang belum diukur.",
    ),
    topic: L("Measurement", "Pengukuran"),
    role: roles.security,
    area: areas.awareness,
    difficulty: "intermediate",
    related: [
      "/guides/awareness-measurement",
      "/tutorials/run-baseline",
      "/blog/measure-awareness",
    ],
    sections: [
      {
        id: "score",
        heading: L(
          "A score summarizes available evidence",
          "Nilai merangkum bukti yang tersedia",
        ),
        paragraphs: [
          L(
            "The current Awareness Score combines knowledge, behavior, reporting, and improvement. The server calculates it from recorded evidence. When no component has evidence, the score and risk category remain Unmeasured.",
            "Nilai Kesadaran menggabungkan pengetahuan, perilaku, pelaporan, dan peningkatan. Server menghitungnya dari bukti tercatat. Jika tidak ada komponen dengan bukti, nilai dan kategori risiko tetap Belum diukur.",
          ),
        ],
      },
      {
        id: "components",
        heading: L("Four score components", "Empat komponen nilai"),
        items: [
          L(
            "Knowledge · 35%: server-graded quizzes and assessments.",
            "Pengetahuan · 35%: kuis dan asesmen yang dinilai server.",
          ),
          L(
            "Behavior · 30%: safe simulation responses. A click records 0; reporting without clicking records 100.",
            "Perilaku · 30%: respons simulasi aman. Klik mencatat 0; melaporkan tanpa klik mencatat 100.",
          ),
          L(
            "Reporting · 20%: a reported simulation or a security-confirmed suspicious report records positive evidence.",
            "Pelaporan · 20%: simulasi yang dilaporkan atau laporan mencurigakan yang dikonfirmasi tim keamanan mencatat bukti positif.",
          ),
          L(
            "Improvement · 15%: 50 + (follow-up − baseline) / 2, bounded to 0–100. Both assessments are required.",
            "Peningkatan · 15%: 50 + (tindak lanjut − awal) / 2, dibatasi 0–100. Kedua asesmen diperlukan.",
          ),
        ],
      },
      {
        id: "coverage",
        heading: L(
          "Coverage changes the interpretation",
          "Cakupan mengubah penafsiran",
        ),
        paragraphs: [
          L(
            "For an individual, evidence coverage is the sum of the weights of measured components. The score is normalized over those measured components. A knowledge score of 90 with no other evidence produces an awareness score of 90 with 35% component coverage; this is an illustrative calculation, not an organization result.",
            "Untuk individu, cakupan bukti adalah jumlah bobot komponen yang diukur. Nilai dinormalisasi atas komponen tersebut. Nilai pengetahuan 90 tanpa bukti lain menghasilkan nilai kesadaran 90 dengan cakupan komponen 35%; ini contoh perhitungan, bukan hasil organisasi.",
          ),
          L(
            "Measured people coverage answers a different question: how many active employees have any score? Review that percentage together with average component coverage. Neither percentage proves that every behavior has been observed.",
            "Cakupan karyawan terukur menjawab pertanyaan berbeda: berapa banyak karyawan aktif yang memiliki nilai? Tinjau persentase tersebut bersama rata-rata cakupan komponen. Keduanya tidak membuktikan bahwa setiap perilaku telah diamati.",
          ),
        ],
      },
      {
        id: "interpretation",
        heading: L(
          "Use the score to choose the next measurement",
          "Gunakan nilai untuk memilih pengukuran berikutnya",
        ),
        paragraphs: [
          L(
            "Current risk bands are High below 60, Medium from 60 to 79, and Low from 80. These describe the product's awareness bands; they are not a probability of an incident or a judgment about an employee. Open the evidence history before deciding which intervention is useful.",
            "Kategori risiko saat ini adalah Tinggi di bawah 60, Sedang dari 60 hingga 79, dan Rendah mulai 80. Ini kategori kesadaran produk; bukan probabilitas insiden atau penilaian terhadap seseorang. Buka riwayat bukti sebelum menentukan intervensi yang berguna.",
          ),
        ],
      },
    ],
  },
  {
    ...editorial,
    href: "/docs/campaigns",
    kind: "documentation",
    title: L(
      "Campaign lifecycle and measurement",
      "Siklus kampanye dan pengukuran",
    ),
    description: L(
      "How audiences, published learning, assessments, and schedule stay connected.",
      "Cara audiens, materi terbit, asesmen, dan jadwal tetap terhubung.",
    ),
    topic: L("Program operations", "Pengelolaan program"),
    role: roles.admin,
    area: areas.campaigns,
    difficulty: "foundation",
    related: [
      "/tutorials/first-awareness-program",
      "/tutorials/run-baseline",
      "/docs/learning-revisions",
    ],
    sections: [
      {
        id: "builder",
        heading: L(
          "One program, five decisions",
          "Satu program, lima keputusan",
        ),
        items: [
          L(
            "Basics: name, objective, and owner.",
            "Dasar: nama, tujuan, dan penanggung jawab.",
          ),
          L(
            "Audience: active employees selected individually, by department, or from a group.",
            "Audiens: karyawan aktif yang dipilih per orang, per departemen, atau dari grup.",
          ),
          L(
            "Learning: published course revisions and expected duration.",
            "Pembelajaran: revisi materi terbit dan perkiraan durasi.",
          ),
          L(
            "Measurement: baseline, follow-up, and an optional safe simulation.",
            "Pengukuran: asesmen awal, tindak lanjut, dan simulasi aman opsional.",
          ),
          L(
            "Schedule and review: start, deadline, reminders, and launch validation.",
            "Jadwal dan tinjauan: mulai, tenggat, pengingat, dan validasi peluncuran.",
          ),
        ],
      },
      {
        id: "lifecycle",
        heading: L(
          "Draft, scheduled, and active work",
          "Pekerjaan draf, terjadwal, dan aktif",
        ),
        paragraphs: [
          L(
            "A draft records the intended program. Launch requires a valid audience, published learning, and a future deadline. A future start schedules the campaign; active campaigns make assignments available. Lifecycle transitions are validated on the server and version checks protect against conflicting edits.",
            "Draf mencatat program yang direncanakan. Peluncuran memerlukan audiens valid, materi terbit, dan tenggat mendatang. Tanggal mulai mendatang menjadwalkan kampanye; kampanye aktif menyediakan tugas. Perubahan siklus divalidasi server dan pemeriksaan versi melindungi dari konflik penyuntingan.",
          ),
        ],
      },
      {
        id: "assessment",
        heading: L(
          "Learning and assessment are separate evidence",
          "Pembelajaran dan asesmen adalah bukti terpisah",
        ),
        paragraphs: [
          L(
            "A baseline establishes starting knowledge. Lessons and quizzes record learning progress. Follow-up measures knowledge after required learning. A completion percentage alone cannot show improvement, and a missing baseline cannot be reconstructed from a later quiz.",
            "Asesmen awal menetapkan pengetahuan awal. Pelajaran dan kuis mencatat progres pembelajaran. Tindak lanjut mengukur pengetahuan setelah pembelajaran wajib. Persentase penyelesaian saja tidak menunjukkan peningkatan, dan kondisi awal yang tidak diukur tidak dapat direkonstruksi dari kuis berikutnya.",
          ),
        ],
      },
      {
        id: "operations",
        heading: L(
          "Keep the next action specific",
          "Tetapkan tindakan berikutnya secara spesifik",
        ),
        paragraphs: [
          L(
            "Use campaign detail to review participants, learning, assessment, simulation, and activity where available. Investigate failed delivery before sending another reminder. A campaign is an explicitly configured program; AVERIS does not promise an automatically renewing continuous program.",
            "Gunakan detail kampanye untuk meninjau peserta, pembelajaran, asesmen, simulasi, dan aktivitas yang tersedia. Selidiki kegagalan pengiriman sebelum mengirim pengingat lagi. Kampanye adalah program yang dikonfigurasi secara eksplisit; AVERIS tidak menjanjikan program berkelanjutan yang diperbarui otomatis.",
          ),
        ],
      },
    ],
  },
  {
    ...editorial,
    href: "/docs/learning-revisions",
    kind: "documentation",
    title: L(
      "Learning, revisions, and certificates",
      "Pembelajaran, revisi, dan sertifikat",
    ),
    description: L(
      "What gets published, what an assignment preserves, and when completion is recorded.",
      "Materi yang diterbitkan, versi yang dipertahankan tugas, dan waktu penyelesaian dicatat.",
    ),
    topic: L("Content operations", "Pengelolaan materi"),
    role: roles.hr,
    area: areas.learning,
    difficulty: "foundation",
    related: ["/tutorials/publish-learning", "/docs/outcome-reports"],
    sections: [
      {
        id: "content",
        heading: L(
          "Readable lessons and graded questions",
          "Pelajaran yang mudah dibaca dan pertanyaan yang dinilai",
        ),
        paragraphs: [
          L(
            "Courses support Article, Scenario, Checklist, and Security Tip lesson blocks. Questions support single choice, multiple answer, true/false, and scenarios. The course defines its passing score, allowed attempts, retry interval, language, and duration.",
            "Materi mendukung blok pelajaran Artikel, Skenario, Daftar Periksa, dan Tips Keamanan. Pertanyaan mendukung pilihan tunggal, jawaban majemuk, benar/salah, dan skenario. Materi menetapkan nilai kelulusan, jumlah percobaan, jeda pengulangan, bahasa, dan durasi.",
          ),
        ],
      },
      {
        id: "revisions",
        heading: L(
          "Assignments preserve their revision",
          "Tugas mempertahankan revisinya",
        ),
        paragraphs: [
          L(
            "Saving changes creates a new revision. Existing assignments retain the revision assigned to them, so their questions and learning evidence remain consistent. Archiving removes a course from future selection while retaining existing assignment records.",
            "Menyimpan perubahan membuat revisi baru. Tugas yang sudah ada mempertahankan revisi yang ditugaskan sehingga pertanyaan dan bukti pembelajarannya tetap konsisten. Pengarsipan menghapus materi dari pilihan berikutnya sambil mempertahankan catatan tugas yang sudah ada.",
          ),
        ],
      },
      {
        id: "completion",
        heading: L(
          "Progress is recorded by the server",
          "Progres dicatat oleh server",
        ),
        paragraphs: [
          L(
            "Employees resume their current lesson and move through the sequence before starting the quiz. Quiz answers are graded on the server. A passing completed assignment can issue a certificate; the browser cannot grant itself a passing result.",
            "Karyawan melanjutkan pelajaran saat ini dan mengikuti urutan sebelum memulai kuis. Jawaban kuis dinilai server. Tugas selesai yang lulus dapat menerbitkan sertifikat; peramban tidak dapat memberikan hasil lulus sendiri.",
          ),
        ],
      },
      {
        id: "certificates",
        heading: L("Check certificate status", "Periksa status sertifikat"),
        paragraphs: [
          L(
            "Employees can view and download their certificates. Public verification checks the certificate record, including revocation status. Administrators can revoke a certificate or reinstate a revoked record. A certificate proves the recorded learning result; it is not an external accreditation.",
            "Karyawan dapat melihat dan mengunduh sertifikatnya. Verifikasi publik memeriksa catatan sertifikat, termasuk status pencabutan. Administrator dapat mencabut sertifikat atau memulihkan catatan yang dicabut. Sertifikat membuktikan hasil pembelajaran tercatat; bukan akreditasi eksternal.",
          ),
        ],
      },
      {
        id: "language",
        heading: L(
          "Course language is explicit",
          "Bahasa materi ditetapkan secara eksplisit",
        ),
        paragraphs: [
          L(
            "Changing the interface between English and Indonesian does not translate stored course text. Author a separate language version when needed. This course workflow does not provide video uploads or SCORM imports.",
            "Mengubah antarmuka antara bahasa Inggris dan Indonesia tidak menerjemahkan teks materi tersimpan. Buat versi bahasa terpisah bila diperlukan. Alur materi ini tidak menyediakan unggah video atau impor SCORM.",
          ),
        ],
      },
    ],
  },
  {
    ...editorial,
    href: "/docs/people-and-permissions",
    kind: "documentation",
    title: L(
      "People and workspace permissions",
      "Karyawan dan izin ruang kerja",
    ),
    description: L(
      "Understand the employee directory and the boundaries of each role.",
      "Pahami direktori karyawan dan batasan setiap peran.",
    ),
    topic: L("Access", "Akses"),
    role: roles.admin,
    area: areas.people,
    difficulty: "foundation",
    related: ["/tutorials/add-employees", "/docs/identity-security"],
    sections: [
      {
        id: "roles",
        heading: L(
          "Roles follow responsibility",
          "Peran mengikuti tanggung jawab",
        ),
        items: [
          L(
            "Tenant owner: manages administrator access as well as organizational administration.",
            "Pemilik organisasi: mengelola akses administrator serta administrasi organisasi.",
          ),
          L(
            "Administrator: manages employees, learning, campaign launches, and operational review within the organization.",
            "Administrator: mengelola karyawan, pembelajaran, peluncuran kampanye, dan tinjauan operasional dalam organisasi.",
          ),
          L(
            "Manager: can view workspace reporting and prepare campaign drafts. Launching and restricted administration require an administrator.",
            "Manajer: dapat melihat pelaporan ruang kerja dan menyiapkan draf kampanye. Peluncuran dan administrasi terbatas memerlukan administrator.",
          ),
          L(
            "Employee: accesses their assigned learning, assessments, awareness, certificates, and phishing reporting.",
            "Karyawan: mengakses pembelajaran, asesmen, kesadaran, sertifikat, dan pelaporan phishing miliknya.",
          ),
        ],
      },
      {
        id: "directory",
        heading: L("Keep the audience accurate", "Pastikan audiens akurat"),
        paragraphs: [
          L(
            "The directory supports employee search and filters including department, risk, active status, and group. Check the selected participant preview when building a campaign. Department names and group membership organize the audience; they do not independently grant a role.",
            "Direktori mendukung pencarian karyawan serta filter departemen, risiko, status aktif, dan grup. Periksa pratinjau peserta yang dipilih saat membuat kampanye. Nama departemen dan keanggotaan grup mengatur audiens; keduanya tidak memberikan peran secara mandiri.",
          ),
        ],
      },
      {
        id: "access",
        heading: L(
          "Access changes preserve evidence",
          "Perubahan akses mempertahankan bukti",
        ),
        paragraphs: [
          L(
            "Deactivating an account revokes access and retains learning history. Role changes revoke existing sessions. Server checks enforce organization scope and permissions, even if someone manually opens a restricted URL.",
            "Menonaktifkan akun mencabut akses dan mempertahankan riwayat pembelajaran. Perubahan peran mencabut sesi yang ada. Pemeriksaan server menegakkan cakupan organisasi dan izin, meskipun seseorang membuka URL terbatas secara manual.",
          ),
        ],
      },
    ],
  },
  {
    ...editorial,
    href: "/docs/phishing-and-simulations",
    kind: "documentation",
    title: L(
      "Phishing reporting and safe simulations",
      "Pelaporan phishing dan simulasi aman",
    ),
    description: L(
      "Distinguish practice events, employee reports, and reviewed classifications.",
      "Bedakan peristiwa latihan, laporan karyawan, dan klasifikasi hasil tinjauan.",
    ),
    topic: L("Reporting behavior", "Perilaku pelaporan"),
    role: roles.security,
    area: areas.phishing,
    difficulty: "foundation",
    related: [
      "/tutorials/review-phishing-report",
      "/guides/focused-simulation",
    ],
    sections: [
      {
        id: "reports",
        heading: L("A report begins a review", "Laporan memulai tinjauan"),
        paragraphs: [
          L(
            "Employees submit sender, subject, description, and channel: Email, SMS, Chat, or Other. A report moves through Submitted, Reviewing, Confirmed Suspicious or Safe, then Closed as appropriate. Closing requires a classification. Internal review notes are restricted to administrators.",
            "Karyawan mengirim pengirim, subjek, deskripsi, dan saluran: Email, SMS, Percakapan, atau Lainnya. Laporan bergerak dari Dikirim, Ditinjau, Dikonfirmasi Mencurigakan atau Aman, lalu Ditutup sesuai kebutuhan. Penutupan memerlukan klasifikasi. Catatan tinjauan internal hanya untuk administrator.",
          ),
        ],
      },
      {
        id: "events",
        heading: L(
          "Simulation events answer different questions",
          "Peristiwa simulasi menjawab pertanyaan berbeda",
        ),
        items: [
          L(
            "Delivered: delivery was recorded for the simulation target.",
            "Terkirim: pengiriman tercatat untuk target simulasi.",
          ),
          L(
            "Opened: the safe simulation experience was opened; this is not proof of reading an email.",
            "Dibuka: pengalaman simulasi aman dibuka; ini bukan bukti membaca email.",
          ),
          L(
            "Clicked: the tracked practice action was taken.",
            "Diklik: tindakan latihan yang dilacak dilakukan.",
          ),
          L(
            "Reported: the simulation was reported using its reporting action.",
            "Dilaporkan: simulasi dilaporkan melalui tindakan pelaporannya.",
          ),
          L(
            "No action: no tracked response exists. It does not identify why someone did not respond.",
            "Tidak ada tindakan: tidak ada respons terlacak. Ini tidak menjelaskan alasan seseorang tidak merespons.",
          ),
        ],
      },
      {
        id: "safety",
        heading: L(
          "Practice without collecting credentials",
          "Berlatih tanpa mengumpulkan kredensial",
        ),
        paragraphs: [
          L(
            "Simulations attach to a campaign and use expiring, validated tokens. The safe page does not request real passwords. Duplicate tracked events are handled idempotently. Templates are controlled practice themes, not an automatic malware-analysis service.",
            "Simulasi dilampirkan ke kampanye dan menggunakan token tervalidasi yang kedaluwarsa. Halaman aman tidak meminta kata sandi nyata. Peristiwa terlacak yang duplikat ditangani secara idempoten. Templat adalah tema latihan terkendali, bukan layanan analisis malware otomatis.",
          ),
        ],
      },
      {
        id: "evidence",
        heading: L(
          "Reviewed reporting contributes evidence",
          "Pelaporan yang ditinjau menjadi bukti",
        ),
        paragraphs: [
          L(
            "A confirmed suspicious report can contribute to reporting evidence. Repeated submissions are limited and do not create unlimited score increases. Review the classification and event history before interpreting a response as an improvement.",
            "Laporan mencurigakan yang dikonfirmasi dapat menjadi bukti pelaporan. Kiriman berulang dibatasi dan tidak menghasilkan kenaikan nilai tanpa batas. Tinjau klasifikasi dan riwayat peristiwa sebelum menafsirkan respons sebagai peningkatan.",
          ),
        ],
      },
    ],
  },
  {
    ...editorial,
    href: "/docs/outcome-reports",
    kind: "documentation",
    title: L(
      "Reports, periods, and evidence exports",
      "Laporan, periode, dan ekspor bukti",
    ),
    description: L(
      "Choose a report by the decision it supports and preserve its scope.",
      "Pilih laporan berdasarkan keputusan yang didukungnya dan pertahankan cakupannya.",
    ),
    topic: L("Evidence", "Bukti"),
    role: roles.grc,
    area: areas.reporting,
    difficulty: "intermediate",
    related: [
      "/tutorials/export-evidence",
      "/docs/human-risk",
      "/guides/awareness-measurement",
    ],
    sections: [
      {
        id: "categories",
        heading: L(
          "Four reports, four questions",
          "Empat laporan, empat pertanyaan",
        ),
        items: [
          L(
            "Executive: what is measured across the organization, where is evidence missing, and what needs attention?",
            "Eksekutif: apa yang diukur di organisasi, di mana bukti belum tersedia, dan apa yang perlu diperhatikan?",
          ),
          L(
            "Campaign: who participated, what learning was completed, and what changed within this program?",
            "Kampanye: siapa yang berpartisipasi, pembelajaran apa yang selesai, dan apa yang berubah dalam program ini?",
          ),
          L(
            "Employee: which people have incomplete work, measured scores, or missing evidence?",
            "Karyawan: siapa yang memiliki tugas belum selesai, nilai terukur, atau bukti yang belum tersedia?",
          ),
          L(
            "Compliance Evidence: which assignments, completion records, and certificates support the review?",
            "Bukti Kepatuhan: tugas, catatan penyelesaian, dan sertifikat mana yang mendukung tinjauan?",
          ),
        ],
      },
      {
        id: "period",
        heading: L("Understand the time scope", "Pahami cakupan waktu"),
        paragraphs: [
          L(
            "Select the reporting period and relevant campaign, department, or risk filter. Assessment attempts and simulation delivery/events are filtered by their activity dates. Current employee awareness and assignment status remain a current-state view; the selected period does not turn every record into a historical snapshot.",
            "Pilih periode pelaporan serta filter kampanye, departemen, atau risiko yang relevan. Percobaan asesmen serta pengiriman/peristiwa simulasi difilter menurut tanggal aktivitas. Kesadaran karyawan dan status tugas terkini tetap menjadi tampilan kondisi saat ini; periode yang dipilih tidak mengubah setiap catatan menjadi rekaman historis.",
          ),
        ],
      },
      {
        id: "files",
        heading: L("Export from the server", "Ekspor dari server"),
        paragraphs: [
          L(
            "CSV provides structured records; PDF provides a readable report. Both are generated by the server with organization scope and validated filters. Compliance Evidence CSV includes assignment, course, program, due date, completion, status, and certificate reference when present.",
            "CSV menyediakan catatan terstruktur; PDF menyediakan laporan yang mudah dibaca. Keduanya dibuat server dengan cakupan organisasi dan filter tervalidasi. CSV Bukti Kepatuhan memuat tugas, materi, program, tenggat, penyelesaian, status, dan referensi sertifikat jika tersedia.",
          ),
        ],
      },
      {
        id: "limits",
        heading: L(
          "Describe what the evidence supports",
          "Jelaskan hal yang didukung bukti",
        ),
        paragraphs: [
          L(
            "Do not turn an empty value into zero or describe a certificate as a certification of the organization. Evidence helps document the program; compliance conclusions require review against your own requirements.",
            "Jangan mengubah nilai kosong menjadi nol atau menyebut sertifikat sebagai sertifikasi organisasi. Bukti membantu mendokumentasikan program; kesimpulan kepatuhan memerlukan tinjauan terhadap persyaratan Anda sendiri.",
          ),
        ],
      },
    ],
  },
  {
    ...editorial,
    href: "/docs/identity-security",
    kind: "documentation",
    title: L(
      "Account security and deployment connections",
      "Keamanan akun dan koneksi penerapan",
    ),
    description: L(
      "Sessions, authenticator setup, OIDC, SMTP, and the boundaries of configuration.",
      "Sesi, penyiapan autentikator, OIDC, SMTP, dan batasan konfigurasi.",
    ),
    topic: L("Account security", "Keamanan akun"),
    role: roles.admin,
    area: areas.security,
    difficulty: "intermediate",
    related: [
      "/tutorials/configure-mfa",
      "/tutorials/configure-sso",
      "/docs/people-and-permissions",
    ],
    sections: [
      {
        id: "sessions",
        heading: L("Review your account sessions", "Tinjau sesi akun Anda"),
        paragraphs: [
          L(
            "Account security lists active sessions and identifies the current session. Revoke another session when appropriate; use Sign out for the current one. Account deactivation and role changes revoke existing sessions.",
            "Keamanan akun menampilkan sesi aktif dan mengidentifikasi sesi saat ini. Cabut sesi lain bila diperlukan; gunakan Keluar untuk sesi saat ini. Penonaktifan akun dan perubahan peran mencabut sesi yang ada.",
          ),
        ],
      },
      {
        id: "mfa",
        heading: L(
          "Authenticator setup requires verification",
          "Penyiapan autentikator memerlukan verifikasi",
        ),
        paragraphs: [
          L(
            "MFA uses a time-based authenticator. Setup requires the current password and confirmation with a six-digit code. Disabling MFA requires a password and valid code. Enabling it ends other sessions. Recovery codes are not part of the current setup workflow.",
            "MFA menggunakan autentikator berbasis waktu. Penyiapan memerlukan kata sandi saat ini dan konfirmasi kode enam digit. Menonaktifkan MFA memerlukan kata sandi dan kode valid. Mengaktifkannya mengakhiri sesi lain. Kode pemulihan bukan bagian dari alur penyiapan saat ini.",
          ),
        ],
      },
      {
        id: "oidc",
        heading: L(
          "OIDC connects existing identities",
          "OIDC menghubungkan identitas yang sudah ada",
        ),
        paragraphs: [
          L(
            "The optional OIDC adapter supports one configured issuer and organization. It validates the sign-in flow and connects an existing active account using verified email or an established identity link. It does not automatically create users, synchronize a directory, or infer workspace roles from identity-provider claims.",
            "Adaptor OIDC opsional mendukung satu penerbit dan organisasi yang dikonfigurasi. Adaptor memvalidasi alur masuk dan menghubungkan akun aktif melalui email terverifikasi atau tautan identitas yang sudah ada. Adaptor tidak otomatis membuat pengguna, menyinkronkan direktori, atau menyimpulkan peran ruang kerja dari klaim penyedia identitas.",
          ),
        ],
      },
      {
        id: "delivery",
        heading: L(
          "Delivery health describes actual jobs",
          "Kesehatan pengiriman menjelaskan pekerjaan aktual",
        ),
        paragraphs: [
          L(
            "SMTP must be configured for email. Delivery health shows queued and failed jobs and provides an administrator retry for failed delivery. Inspect the error and configuration before retrying. No public uptime history or connected Microsoft 365, Google Workspace, SCIM, Teams, or SIEM service is implied by these foundations.",
            "SMTP harus dikonfigurasi untuk email. Kesehatan pengiriman menampilkan pekerjaan antre dan gagal serta menyediakan pengulangan pengiriman gagal bagi administrator. Periksa kesalahan dan konfigurasi sebelum mencoba lagi. Fondasi ini tidak menyiratkan riwayat ketersediaan publik atau koneksi Microsoft 365, Google Workspace, SCIM, Teams, maupun SIEM.",
          ),
        ],
      },
    ],
  },
];
