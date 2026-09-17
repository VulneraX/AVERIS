import {
  L,
  areas,
  roles,
  editorial,
  type ContentEntry,
  type ContentSection,
} from "./schema";

const goal = (en: string, id: string): ContentSection => ({
  id: "goal",
  heading: L("Goal", "Tujuan"),
  paragraphs: [L(en, id)],
});
const prerequisites = (...items: ReturnType<typeof L>[]): ContentSection => ({
  id: "prerequisites",
  heading: L("Before you begin", "Sebelum memulai"),
  items,
});
const steps = (...items: ReturnType<typeof L>[]): ContentSection => ({
  id: "steps",
  heading: L("Steps", "Langkah"),
  items,
  ordered: true,
});
const result = (en: string, id: string): ContentSection => ({
  id: "expected-result",
  heading: L("Expected result", "Hasil yang diharapkan"),
  paragraphs: [L(en, id)],
});
const trouble = (...items: ReturnType<typeof L>[]): ContentSection => ({
  id: "troubleshooting",
  heading: L("Troubleshooting", "Pemecahan masalah"),
  items,
});

export const tutorials: ContentEntry[] = [
  {
    ...editorial,
    href: "/tutorials/first-awareness-program",
    kind: "tutorial",
    title: L("Create your first campaign", "Buat kampanye pertama Anda"),
    description: L(
      "Choose an audience, establish a baseline, assign learning, and review the follow-up.",
      "Pilih audiens, ukur kondisi awal, tugaskan pembelajaran, dan tinjau hasil tindak lanjut.",
    ),
    topic: L("Getting started", "Memulai"),
    role: roles.admin,
    area: areas.campaigns,
    difficulty: "foundation",
    demo: "/demo?mode=program",
    related: [
      "/docs/campaigns",
      "/tutorials/publish-learning",
      "/guides/security-awareness-program",
    ],
    sections: [
      goal(
        "Launch one focused program with an explicit audience and a useful before-and-after comparison. A program is managed as a Campaign in the workspace.",
        "Luncurkan satu program terarah dengan audiens yang jelas serta perbandingan sebelum dan sesudah yang berguna. Program dikelola sebagai Kampanye di ruang kerja.",
      ),
      prerequisites(
        L(
          "Use an administrator account to launch. Managers can create a draft, but cannot launch it.",
          "Gunakan akun administrator untuk meluncurkan. Manajer dapat membuat draf, tetapi tidak dapat meluncurkannya.",
        ),
        L(
          "Add active employees and publish at least one course first.",
          "Tambahkan karyawan aktif dan terbitkan setidaknya satu materi terlebih dahulu.",
        ),
      ),
      steps(
        L(
          "Open Campaigns and choose Create campaign. Give it a specific name, an objective, and an owner. For example: help the finance team recognize urgent payment requests.",
          "Buka Kampanye dan pilih Buat kampanye. Isi nama yang spesifik, tujuan, dan penanggung jawab. Contoh: membantu tim keuangan mengenali permintaan pembayaran mendesak.",
        ),
        L(
          "Choose all active employees, a department, a group, or selected people. Review the participant list before continuing.",
          "Pilih semua karyawan aktif, departemen, grup, atau orang tertentu. Tinjau daftar peserta sebelum melanjutkan.",
        ),
        L(
          "Select published learning that addresses that objective. Review its language, revision, and total duration.",
          "Pilih materi terbit yang sesuai dengan tujuan. Tinjau bahasa, revisi, dan total durasinya.",
        ),
        L(
          "Enable baseline and follow-up measurement if you need a comparison. Add a safe simulation only when it serves the objective.",
          "Aktifkan pengukuran awal dan tindak lanjut jika memerlukan perbandingan. Tambahkan simulasi aman hanya jika sesuai dengan tujuan.",
        ),
        L(
          "Set a future deadline, review the schedule and reminders, then launch or save the draft. A future start date schedules the campaign.",
          "Tetapkan tenggat mendatang, tinjau jadwal dan pengingat, lalu luncurkan atau simpan draf. Tanggal mulai mendatang akan menjadwalkan kampanye.",
        ),
      ),
      result(
        "The campaign detail shows its status and participants. When active, employees receive assignments and any enabled baseline. The follow-up remains locked until its learning requirements are met.",
        "Detail kampanye menampilkan status dan peserta. Saat aktif, karyawan menerima tugas dan asesmen awal yang diaktifkan. Tindak lanjut tetap terkunci sampai persyaratan pembelajarannya terpenuhi.",
      ),
      trouble(
        L(
          "No courses appear: check that the course is Published rather than Draft or Archived.",
          "Materi tidak muncul: pastikan statusnya Terbit, bukan Draf atau Diarsipkan.",
        ),
        L(
          "Launch is rejected: check your role, active audience, published learning, and future deadline. If another administrator changed the draft, reload before retrying.",
          "Peluncuran ditolak: periksa peran, audiens aktif, materi terbit, dan tenggat mendatang. Jika administrator lain mengubah draf, muat ulang sebelum mencoba lagi.",
        ),
      ),
    ],
  },
  {
    ...editorial,
    href: "/tutorials/add-employees",
    kind: "tutorial",
    title: L(
      "Add employees and check their access",
      "Tambahkan karyawan dan periksa aksesnya",
    ),
    description: L(
      "Create individual accounts or import a CSV, then verify the audience before assigning work.",
      "Buat akun satu per satu atau impor CSV, lalu verifikasi audiens sebelum memberikan tugas.",
    ),
    topic: L("Getting started", "Memulai"),
    role: roles.admin,
    area: areas.people,
    difficulty: "foundation",
    demo: "/demo?mode=admin",
    related: [
      "/docs/people-and-permissions",
      "/tutorials/first-awareness-program",
    ],
    sections: [
      goal(
        "Create the correct employee records without granting unnecessary administrative access.",
        "Buat catatan karyawan yang tepat tanpa memberikan akses administratif yang tidak diperlukan.",
      ),
      prerequisites(
        L(
          "An administrator account and a verified list of names, work email addresses, and departments.",
          "Akun administrator serta daftar nama, alamat email kerja, dan departemen yang telah diverifikasi.",
        ),
      ),
      steps(
        L(
          "Open People and choose Add employee. Enter the name, work email, and department. Select the employee role for learners.",
          "Buka Karyawan dan pilih Tambah karyawan. Isi nama, email kerja, dan departemen. Pilih peran karyawan untuk peserta belajar.",
        ),
        L(
          "For a batch, use Import CSV with email,name,department,role columns. Review each reported row error; successful rows may already have been created.",
          "Untuk beberapa karyawan, gunakan Impor CSV dengan kolom email,name,department,role. Tinjau setiap kesalahan baris; baris yang berhasil mungkin sudah dibuat.",
        ),
        L(
          "Search for the new employees, check active status and department, and open a profile to verify the record.",
          "Cari karyawan baru, periksa status aktif dan departemen, lalu buka profil untuk memverifikasi catatan.",
        ),
        L(
          "Review delivery health if invitations or password setup messages are not received. Use the account reset action when appropriate.",
          "Tinjau kesehatan pengiriman jika undangan atau pesan pengaturan kata sandi tidak diterima. Gunakan tindakan pengaturan ulang akun bila diperlukan.",
        ),
      ),
      result(
        "Active employees can be selected in campaign audiences. Their awareness stays Unmeasured until evidence is collected.",
        "Karyawan aktif dapat dipilih sebagai audiens kampanye. Kesadaran mereka tetap Belum diukur sampai bukti terkumpul.",
      ),
      trouble(
        L(
          "A duplicate email is rejected: search the directory before importing again.",
          "Email duplikat ditolak: cari di direktori sebelum mengimpor lagi.",
        ),
        L(
          "An administrator account cannot be managed: only the tenant owner can manage administrator access. Deactivation revokes access while retaining learning evidence.",
          "Akun administrator tidak dapat dikelola: hanya pemilik organisasi yang dapat mengelola akses administrator. Penonaktifan mencabut akses sambil mempertahankan bukti pembelajaran.",
        ),
      ),
    ],
  },
  {
    ...editorial,
    href: "/tutorials/publish-learning",
    kind: "tutorial",
    title: L(
      "Publish learning that is ready to assign",
      "Terbitkan materi yang siap ditugaskan",
    ),
    description: L(
      "Write a focused lesson, check the questions, and publish a versioned course.",
      "Tulis pelajaran terarah, periksa pertanyaan, dan terbitkan materi dengan versi yang jelas.",
    ),
    topic: L("Content operations", "Pengelolaan materi"),
    role: roles.admin,
    area: areas.learning,
    difficulty: "foundation",
    demo: "/demo?mode=program",
    related: ["/docs/learning-revisions", "/tutorials/first-awareness-program"],
    sections: [
      goal(
        "Publish a readable course whose quiz measures the lesson objective.",
        "Terbitkan materi yang mudah dibaca dengan kuis yang mengukur tujuan pelajaran.",
      ),
      prerequisites(
        L(
          "Administrator access, lesson text, and at least one question with an answer explanation.",
          "Akses administrator, teks pelajaran, dan setidaknya satu pertanyaan dengan penjelasan jawaban.",
        ),
      ),
      steps(
        L(
          "Open Learning and create a course. Set its title, category, duration, difficulty, and content language.",
          "Buka Pembelajaran dan buat materi. Tetapkan judul, kategori, durasi, tingkat kesulitan, dan bahasa materi.",
        ),
        L(
          "Add Article, Scenario, Checklist, or Security Tip lessons. Use concrete decisions and short paragraphs that are comfortable to read.",
          "Tambahkan pelajaran Artikel, Skenario, Daftar Periksa, atau Tips Keamanan. Gunakan keputusan konkret dan paragraf pendek yang nyaman dibaca.",
        ),
        L(
          "Add choice, multiple-answer, true/false, or scenario questions. Check the correct options and explanations; configure the passing score, attempts, and retry interval.",
          "Tambahkan pertanyaan pilihan, jawaban majemuk, benar/salah, atau skenario. Periksa opsi benar dan penjelasannya; atur nilai kelulusan, jumlah percobaan, dan jeda pengulangan.",
        ),
        L(
          "Preview the content and questions. Save a draft for review, or publish when the complete course is ready.",
          "Pratinjau materi dan pertanyaan. Simpan draf untuk ditinjau, atau terbitkan saat seluruh materi siap.",
        ),
      ),
      result(
        "The published revision becomes available for future campaigns. Existing assignments keep the revision they received, even after a later edit.",
        "Revisi terbit tersedia untuk kampanye berikutnya. Tugas yang sudah ada mempertahankan revisi yang diterimanya, meskipun materi diedit kemudian.",
      ),
      trouble(
        L(
          "Publishing fails: ensure every lesson has a title and content, and every question has valid answers and an explanation.",
          "Penerbitan gagal: pastikan setiap pelajaran memiliki judul dan isi, serta setiap pertanyaan memiliki jawaban yang valid dan penjelasan.",
        ),
        L(
          "Changing the interface language does not translate stored lessons. Create the intended language version explicitly. Video upload and SCORM import are not part of this text-course workflow.",
          "Mengubah bahasa antarmuka tidak menerjemahkan pelajaran tersimpan. Buat versi bahasa yang diinginkan secara eksplisit. Unggah video dan impor SCORM bukan bagian dari alur materi teks ini.",
        ),
      ),
    ],
  },
  {
    ...editorial,
    href: "/tutorials/run-baseline",
    kind: "tutorial",
    title: L(
      "Measure a baseline before learning",
      "Ukur kondisi awal sebelum pembelajaran",
    ),
    description: L(
      "Establish a starting point and keep missing evidence visible.",
      "Tetapkan titik awal dan pastikan bukti yang belum tersedia tetap terlihat.",
    ),
    topic: L("Measurement", "Pengukuran"),
    role: roles.security,
    area: areas.awareness,
    difficulty: "foundation",
    demo: "/demo?mode=awareness",
    related: [
      "/docs/human-risk",
      "/tutorials/first-awareness-program",
      "/guides/awareness-measurement",
    ],
    sections: [
      goal(
        "Capture starting knowledge for a defined audience before interpreting learning outcomes.",
        "Catat pengetahuan awal audiens yang jelas sebelum menafsirkan hasil pembelajaran.",
      ),
      prerequisites(
        L(
          "An administrator launching a campaign, a published course, and an active employee audience.",
          "Administrator yang meluncurkan kampanye, materi terbit, dan audiens karyawan aktif.",
        ),
      ),
      steps(
        L(
          "Create a campaign and select the audience and relevant learning. Enable Baseline and Follow-up in the measurement step.",
          "Buat kampanye dan pilih audiens serta materi yang relevan. Aktifkan Asesmen awal dan Tindak lanjut pada langkah pengukuran.",
        ),
        L(
          "Launch or schedule the campaign. Ask employees to start from Home, where their next eligible assessment or lesson is shown.",
          "Luncurkan atau jadwalkan kampanye. Minta karyawan memulai dari Beranda, tempat asesmen atau pelajaran berikutnya yang tersedia ditampilkan.",
        ),
        L(
          "Review participation and completed baselines in campaign detail. Identify missing responses separately from low scores.",
          "Tinjau partisipasi dan asesmen awal yang selesai pada detail kampanye. Pisahkan respons yang belum tersedia dari nilai rendah.",
        ),
        L(
          "After learning, review completed follow-ups alongside the baseline. Report the audience and available evidence with any change.",
          "Setelah pembelajaran, tinjau tindak lanjut yang selesai bersama kondisi awal. Laporkan audiens dan bukti yang tersedia bersama setiap perubahan.",
        ),
      ),
      result(
        "Completed assessments create server-graded evidence. A before-and-after comparison appears only when the necessary measurements exist.",
        "Asesmen yang selesai menghasilkan bukti yang dinilai server. Perbandingan sebelum dan sesudah hanya muncul ketika pengukuran yang diperlukan tersedia.",
      ),
      trouble(
        L(
          "An assessment is locked: complete the earlier required learning or assessment. An unanswered assessment is not a zero score.",
          "Asesmen terkunci: selesaikan pembelajaran atau asesmen prasyarat. Asesmen yang belum dijawab bukan nilai nol.",
        ),
      ),
    ],
  },
  {
    ...editorial,
    href: "/tutorials/review-phishing-report",
    kind: "tutorial",
    title: L("Review a phishing report", "Tinjau laporan phishing"),
    description: L(
      "Move from employee submission to a documented security decision.",
      "Ubah laporan karyawan menjadi keputusan keamanan yang terdokumentasi.",
    ),
    topic: L("Reporting behavior", "Perilaku pelaporan"),
    role: roles.security,
    area: areas.phishing,
    difficulty: "foundation",
    demo: "/demo?mode=admin",
    related: ["/docs/phishing-and-simulations", "/guides/focused-simulation"],
    sections: [
      goal(
        "Review the information an employee submitted, classify it, and keep an accountable history.",
        "Tinjau informasi yang dikirim karyawan, klasifikasikan, dan simpan riwayat yang dapat dipertanggungjawabkan.",
      ),
      prerequisites(
        L(
          "Administrator access and an existing employee report. AVERIS stores report details; it does not automatically analyze attachments or malware.",
          "Akses administrator dan laporan karyawan yang sudah ada. AVERIS menyimpan detail laporan; tidak menganalisis lampiran atau malware secara otomatis.",
        ),
      ),
      steps(
        L(
          "Open the phishing inbox from Reports or its contextual shortcut. Select a submitted report and read the sender, subject, channel, reporter, and description.",
          "Buka kotak masuk phishing dari Laporan atau pintasan kontekstualnya. Pilih laporan masuk dan baca pengirim, subjek, saluran, pelapor, dan deskripsinya.",
        ),
        L(
          "Set the status to Reviewing while you investigate using your approved security procedures.",
          "Atur status menjadi Ditinjau saat menyelidiki menggunakan prosedur keamanan yang disetujui.",
        ),
        L(
          "Choose Suspicious or Safe classification with the supporting internal notes. Confirmed Suspicious requires a suspicious classification; Safe requires a safe classification.",
          "Pilih klasifikasi Mencurigakan atau Aman dengan catatan internal pendukung. Dikonfirmasi Mencurigakan memerlukan klasifikasi mencurigakan; Aman memerlukan klasifikasi aman.",
        ),
        L(
          "Save the decision and close when the review is finished. A report must be classified before it can be closed.",
          "Simpan keputusan dan tutup setelah tinjauan selesai. Laporan harus diklasifikasikan sebelum dapat ditutup.",
        ),
      ),
      result(
        "The report carries its current status and audit history. Internal notes remain administrator-only. A confirmed suspicious report can contribute reporting evidence.",
        "Laporan memuat status terkini dan riwayat audit. Catatan internal tetap hanya untuk administrator. Laporan mencurigakan yang dikonfirmasi dapat menjadi bukti pelaporan.",
      ),
      trouble(
        L(
          "A status cannot be saved: check the required classification. Multiple submissions do not automatically mean stronger reporting evidence.",
          "Status tidak dapat disimpan: periksa klasifikasi yang diperlukan. Banyak kiriman tidak otomatis berarti bukti pelaporan lebih kuat.",
        ),
      ),
    ],
  },
  {
    ...editorial,
    href: "/tutorials/export-evidence",
    kind: "tutorial",
    title: L(
      "Export a report with the right scope",
      "Ekspor laporan dengan cakupan yang tepat",
    ),
    description: L(
      "Choose the question, period, audience, and file format before exporting.",
      "Pilih pertanyaan, periode, audiens, dan format berkas sebelum mengekspor.",
    ),
    topic: L("Evidence", "Bukti"),
    role: roles.grc,
    area: areas.reporting,
    difficulty: "foundation",
    demo: "/demo?mode=reporting",
    related: ["/docs/outcome-reports", "/guides/awareness-measurement"],
    sections: [
      goal(
        "Produce a server-generated report that a reviewer can interpret without guessing which people or dates it covers.",
        "Hasilkan laporan yang dibuat server dan dapat ditafsirkan peninjau tanpa menebak orang atau tanggal yang dicakup.",
      ),
      prerequisites(
        L(
          "An administrator or manager account with report access. Available results depend on completed workspace activity.",
          "Akun administrator atau manajer dengan akses laporan. Hasil yang tersedia bergantung pada aktivitas ruang kerja yang selesai.",
        ),
      ),
      steps(
        L(
          "Open Reports. Choose Executive for organizational outcomes, Campaign for program progress, Employee for individual records, or Compliance Evidence for the assignment evidence register.",
          "Buka Laporan. Pilih Eksekutif untuk hasil organisasi, Kampanye untuk progres program, Karyawan untuk catatan individu, atau Bukti Kepatuhan untuk daftar bukti tugas.",
        ),
        L(
          "Select the period and apply the campaign, department, or risk filters relevant to your question.",
          "Pilih periode dan terapkan filter kampanye, departemen, atau risiko yang relevan dengan pertanyaan Anda.",
        ),
        L(
          "Check the visible scope and missing measurements. Current assignment status and time-filtered activity answer different questions; describe both correctly.",
          "Periksa cakupan yang terlihat dan pengukuran yang belum tersedia. Status tugas terkini dan aktivitas dalam periode menjawab pertanyaan berbeda; jelaskan keduanya dengan tepat.",
        ),
        L(
          "Choose CSV for structured records or PDF for a readable report. Keep the exported scope with any explanation you share.",
          "Pilih CSV untuk catatan terstruktur atau PDF untuk laporan yang mudah dibaca. Sertakan cakupan ekspor bersama penjelasan yang Anda bagikan.",
        ),
      ),
      result(
        "The server generates the file using your organization and selected filters. An empty evidence register means no matching records, not a verified outcome.",
        "Server membuat berkas berdasarkan organisasi dan filter yang dipilih. Daftar bukti kosong berarti tidak ada catatan yang cocok, bukan hasil terverifikasi.",
      ),
      trouble(
        L(
          "The export has fewer records than expected: clear campaign and department filters, then check the selected period and employee status.",
          "Ekspor berisi lebih sedikit catatan dari perkiraan: hapus filter kampanye dan departemen, lalu periksa periode serta status karyawan.",
        ),
      ),
    ],
  },
  {
    ...editorial,
    href: "/tutorials/configure-mfa",
    kind: "tutorial",
    title: L(
      "Set up an authenticator for your account",
      "Siapkan autentikator untuk akun Anda",
    ),
    description: L(
      "Enable time-based verification and review your active sessions.",
      "Aktifkan verifikasi berbasis waktu dan tinjau sesi aktif Anda.",
    ),
    topic: L("Account security", "Keamanan akun"),
    role: roles.everyone,
    area: areas.security,
    difficulty: "foundation",
    related: ["/docs/identity-security", "/tutorials/configure-sso"],
    sections: [
      goal(
        "Add an authenticator code to your account sign-in.",
        "Tambahkan kode autentikator saat masuk ke akun Anda.",
      ),
      prerequisites(
        L(
          "Your current password, a signed-in session, and an authenticator application on a device you control.",
          "Kata sandi saat ini, sesi yang telah masuk, dan aplikasi autentikator pada perangkat yang Anda kendalikan.",
        ),
      ),
      steps(
        L(
          "Open your account security controls and start authenticator setup. Confirm your current password.",
          "Buka pengaturan keamanan akun dan mulai penyiapan autentikator. Konfirmasikan kata sandi Anda saat ini.",
        ),
        L(
          "Add the setup key to your authenticator. Treat the key as a secret and do not include it in support messages.",
          "Tambahkan kunci penyiapan ke autentikator. Perlakukan kunci sebagai rahasia dan jangan menyertakannya dalam pesan dukungan.",
        ),
        L(
          "Enter the current six-digit code and confirm. The setup is pending until the code is accepted.",
          "Masukkan kode enam digit saat ini dan konfirmasikan. Penyiapan belum selesai sampai kode diterima.",
        ),
        L(
          "Review active sessions. Enabling MFA revokes your other sessions. On your next sign-in, use your password and current authenticator code.",
          "Tinjau sesi aktif. Mengaktifkan MFA mencabut sesi lainnya. Saat masuk berikutnya, gunakan kata sandi dan kode autentikator saat ini.",
        ),
      ),
      result(
        "The account shows the authenticator as enabled. Disabling it requires your password and a valid code.",
        "Akun menampilkan autentikator aktif. Menonaktifkannya memerlukan kata sandi dan kode yang valid.",
      ),
      trouble(
        L(
          "A code is rejected: check automatic time synchronization on your device and enter the newest code. Repeated attempts are rate-limited.",
          "Kode ditolak: periksa sinkronisasi waktu otomatis perangkat dan masukkan kode terbaru. Percobaan berulang dibatasi.",
        ),
        L(
          "If you lose access to the authenticator, contact your organization administrator. This workflow does not provide downloadable recovery codes.",
          "Jika kehilangan akses ke autentikator, hubungi administrator organisasi. Alur ini tidak menyediakan kode pemulihan yang dapat diunduh.",
        ),
      ),
    ],
  },
  {
    ...editorial,
    href: "/tutorials/configure-sso",
    kind: "tutorial",
    title: L(
      "Prepare an OIDC sign-in connection",
      "Siapkan koneksi masuk OIDC",
    ),
    description: L(
      "Coordinate deployment configuration, existing accounts, and an identity-provider test.",
      "Koordinasikan konfigurasi penerapan, akun yang sudah ada, dan pengujian penyedia identitas.",
    ),
    topic: L("Account security", "Keamanan akun"),
    role: roles.admin,
    area: areas.security,
    difficulty: "intermediate",
    related: [
      "/docs/identity-security",
      "/tutorials/add-employees",
      "/tutorials/configure-mfa",
    ],
    sections: [
      goal(
        "Enable the existing OIDC adapter for one configured issuer and organization. Setup is performed by the deployment operator, not by connecting a directory in the browser.",
        "Aktifkan adaptor OIDC yang tersedia untuk satu penerbit dan organisasi yang dikonfigurasi. Penyiapan dilakukan pengelola penerapan, bukan dengan menghubungkan direktori melalui peramban.",
      ),
      prerequisites(
        L(
          "An OIDC application, HTTPS issuer and AVERIS URLs, deployment access, and existing active AVERIS accounts with matching verified email addresses.",
          "Aplikasi OIDC, URL penerbit dan AVERIS berbasis HTTPS, akses penerapan, serta akun AVERIS aktif dengan alamat email terverifikasi yang sesuai.",
        ),
      ),
      steps(
        L(
          "Register the callback URL ending in /api/auth/sso/callback with the identity provider. Coordinate the issuer, client credentials, organization slug, and public application URL with the deployment operator.",
          "Daftarkan URL panggilan balik yang diakhiri /api/auth/sso/callback pada penyedia identitas. Koordinasikan penerbit, kredensial klien, slug organisasi, dan URL publik aplikasi dengan pengelola penerapan.",
        ),
        L(
          "The operator sets OIDC_ISSUER, OIDC_CLIENT_ID, OIDC_CLIENT_SECRET, OIDC_ORG_SLUG, and PUBLIC_APP_URL in deployment configuration. Keep client secrets outside messages and documentation.",
          "Pengelola menetapkan OIDC_ISSUER, OIDC_CLIENT_ID, OIDC_CLIENT_SECRET, OIDC_ORG_SLUG, dan PUBLIC_APP_URL pada konfigurasi penerapan. Jangan masukkan rahasia klien ke pesan atau dokumentasi.",
        ),
        L(
          "Check Integrations for the configured state, then test organization sign-in with an existing active account.",
          "Periksa status konfigurasi pada Integrasi, lalu uji masuk organisasi dengan akun aktif yang sudah ada.",
        ),
        L(
          "Verify the resulting workspace role and test an account with MFA if applicable. The adapter requires an MFA claim for an account that has local MFA enabled.",
          "Verifikasi peran ruang kerja yang dihasilkan dan uji akun dengan MFA jika berlaku. Adaptor memerlukan klaim MFA untuk akun yang mengaktifkan MFA lokal.",
        ),
      ),
      result(
        "The user signs in to their existing organization and retains the role assigned in AVERIS. OIDC does not provision employees or grant roles from provider claims.",
        "Pengguna masuk ke organisasi yang sudah ada dan mempertahankan peran yang ditetapkan di AVERIS. OIDC tidak membuat karyawan atau memberikan peran dari klaim penyedia.",
      ),
      trouble(
        L(
          "Sign-in is unavailable: the required deployment settings may be incomplete. A failed sign-in can also indicate a callback mismatch, unverified email, inactive account, or missing MFA claim.",
          "Masuk tidak tersedia: pengaturan penerapan mungkin belum lengkap. Kegagalan juga dapat menunjukkan ketidaksesuaian panggilan balik, email belum terverifikasi, akun tidak aktif, atau klaim MFA tidak ada.",
        ),
      ),
    ],
  },
];
