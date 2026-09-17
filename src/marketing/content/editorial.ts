import { L, areas, roles, editorial, type ContentEntry } from "./schema";

export const guides: ContentEntry[] = [
  {
    ...editorial,
    href: "/guides/security-awareness-program",
    kind: "guide",
    title: L(
      "A practical security awareness program guide",
      "Panduan praktis program kesadaran keamanan",
    ),
    description: L(
      "Plan a focused cycle from the first measurement to a defensible follow-up.",
      "Rencanakan siklus terarah dari pengukuran pertama hingga tindak lanjut yang dapat dipertanggungjawabkan.",
    ),
    topic: L("Program design", "Desain program"),
    role: roles.security,
    area: areas.campaigns,
    difficulty: "foundation",
    related: [
      "/tutorials/first-awareness-program",
      "/guides/awareness-measurement",
    ],
    sections: [
      {
        id: "objective",
        heading: L(
          "1. Write the decision you want to improve",
          "1. Tulis keputusan yang ingin diperbaiki",
        ),
        paragraphs: [
          L(
            "Start with a behavior in context. ‘Recognize an unexpected request to change bank details’ is more useful than ‘improve security culture.’ Define who faces that decision and who owns the program. Keep the first cycle small enough that you can examine incomplete work and discuss the results.",
            "Mulailah dengan perilaku dalam konteks. ‘Mengenali permintaan perubahan rekening yang tidak terduga’ lebih berguna daripada ‘meningkatkan budaya keamanan.’ Tentukan siapa yang menghadapi keputusan itu dan siapa penanggung jawab program. Buat siklus pertama cukup kecil agar Anda dapat memeriksa tugas yang belum selesai dan membahas hasilnya.",
          ),
        ],
      },
      {
        id: "baseline",
        heading: L(
          "2. Establish a baseline and a denominator",
          "2. Tetapkan kondisi awal dan pembagi",
        ),
        paragraphs: [
          L(
            "Record the intended audience before assigning learning. Run a baseline that addresses the objective. Report both the result and how many people completed the measurement. A high score among a small responding group does not establish awareness across the full audience.",
            "Catat audiens yang dituju sebelum menugaskan pembelajaran. Jalankan asesmen awal yang sesuai dengan tujuan. Laporkan hasil serta jumlah orang yang menyelesaikan pengukuran. Nilai tinggi pada kelompok kecil yang merespons tidak menetapkan kesadaran seluruh audiens.",
          ),
        ],
      },
      {
        id: "learning",
        heading: L(
          "3. Choose learning that rehearses the decision",
          "3. Pilih pembelajaran yang melatih keputusan",
        ),
        paragraphs: [
          L(
            "Use a short scenario, the relevant warning signs, and a checklist people can apply. Ask questions about the decision rather than repeating the wording of the lesson. Review the selected course language, duration, and published revision before creating assignments.",
            "Gunakan skenario singkat, tanda peringatan relevan, dan daftar periksa yang dapat diterapkan. Ajukan pertanyaan tentang keputusan alih-alih mengulang kata-kata pelajaran. Tinjau bahasa, durasi, dan revisi materi terbit sebelum membuat tugas.",
          ),
        ],
      },
      {
        id: "practice",
        heading: L(
          "4. Practice and make reporting easy",
          "4. Berlatih dan permudah pelaporan",
        ),
        paragraphs: [
          L(
            "Add a controlled simulation only if it contributes evidence for the objective. Explain the reporting route and who will review submissions. Separate delivery failures from employee response. A person who never received the exercise should not be described as having ignored it.",
            "Tambahkan simulasi terkendali hanya jika memberikan bukti untuk tujuan. Jelaskan saluran pelaporan dan siapa yang meninjau kiriman. Pisahkan kegagalan pengiriman dari respons karyawan. Orang yang tidak pernah menerima latihan tidak boleh disebut mengabaikannya.",
          ),
        ],
      },
      {
        id: "followup",
        heading: L(
          "5. Compare and choose one next action",
          "5. Bandingkan dan pilih satu tindakan berikutnya",
        ),
        paragraphs: [
          L(
            "Review baseline and follow-up for the same campaign audience where both exist. Describe missing measurements and any audience changes. Improvement supports another decision: repeat a difficult topic, reach people who were missed, or test the behavior in a different context. Completion alone does not establish that the program reduced incidents.",
            "Tinjau kondisi awal dan tindak lanjut untuk audiens kampanye yang sama jika keduanya tersedia. Jelaskan pengukuran yang belum tersedia dan perubahan audiens. Peningkatan mendukung keputusan berikutnya: ulangi topik sulit, jangkau orang yang terlewat, atau uji perilaku dalam konteks berbeda. Penyelesaian saja tidak membuktikan program mengurangi insiden.",
          ),
        ],
        note: L(
          "Planning worksheet: objective · audience · owner · baseline · learning · practice · deadline · follow-up · next review. Copy this outline into your program brief.",
          "Lembar perencanaan: tujuan · audiens · penanggung jawab · kondisi awal · pembelajaran · latihan · tenggat · tindak lanjut · tinjauan berikutnya. Salin kerangka ini ke ringkasan program Anda.",
        ),
      },
    ],
  },
  {
    ...editorial,
    href: "/guides/focused-simulation",
    kind: "guide",
    title: L(
      "Design a focused phishing simulation",
      "Rancang simulasi phishing yang terarah",
    ),
    description: L(
      "Choose a practice objective and interpret each response without overstating it.",
      "Pilih tujuan latihan dan tafsirkan setiap respons tanpa melebihkannya.",
    ),
    topic: L("Simulation", "Simulasi"),
    role: roles.security,
    area: areas.phishing,
    difficulty: "intermediate",
    related: [
      "/docs/phishing-and-simulations",
      "/tutorials/review-phishing-report",
    ],
    sections: [
      {
        id: "objective",
        heading: L(
          "Choose one behavior to practice",
          "Pilih satu perilaku untuk dilatih",
        ),
        paragraphs: [
          L(
            "A useful simulation has a specific question: does the employee pause at an unexpected shared document, check an urgent account notice, or report a suspicious request? Choose one of the supported campaign simulation themes and pair it with relevant learning. Avoid using an exercise to label an individual as a security problem.",
            "Simulasi yang berguna memiliki pertanyaan spesifik: apakah karyawan berhenti sejenak saat menerima dokumen tak terduga, memeriksa pemberitahuan akun mendesak, atau melaporkan permintaan mencurigakan? Pilih salah satu tema simulasi kampanye yang didukung dan pasangkan dengan materi relevan. Hindari menggunakan latihan untuk melabeli individu sebagai masalah keamanan.",
          ),
        ],
      },
      {
        id: "boundaries",
        heading: L(
          "Set the boundaries before launch",
          "Tetapkan batasan sebelum peluncuran",
        ),
        items: [
          L(
            "Use an approved audience, owner, and period. Check the selected participants rather than assuming a department filter is correct.",
            "Gunakan audiens, penanggung jawab, dan periode yang disetujui. Periksa peserta terpilih, jangan menganggap filter departemen sudah benar.",
          ),
          L(
            "Preview the controlled message and safe landing experience. No real passwords or other credentials should be entered.",
            "Pratinjau pesan terkendali dan halaman tujuan aman. Jangan memasukkan kata sandi nyata atau kredensial lainnya.",
          ),
          L(
            "Check SMTP and delivery health. The campaign's delivery evidence matters when interpreting the response denominator.",
            "Periksa SMTP dan kesehatan pengiriman. Bukti pengiriman kampanye penting saat menafsirkan pembagi respons.",
          ),
        ],
      },
      {
        id: "interpret",
        heading: L(
          "Keep delivery, clicks, and reports distinct",
          "Pisahkan pengiriman, klik, dan laporan",
        ),
        paragraphs: [
          L(
            "Delivered is not opened; opened is not clicked; clicked and reported can both occur. No tracked action is an absence of recorded response, not proof of safe behavior. Review the actual event sequence before drawing a conclusion. The safe page's opened event is not email-open telemetry.",
            "Terkirim bukan dibuka; dibuka bukan diklik; diklik dan dilaporkan dapat terjadi bersama. Tidak ada tindakan terlacak berarti tidak ada respons tercatat, bukan bukti perilaku aman. Tinjau urutan peristiwa sebenarnya sebelum menyimpulkan. Peristiwa dibuka pada halaman aman bukan telemetri pembukaan email.",
          ),
        ],
      },
      {
        id: "followup",
        heading: L(
          "Turn a response into useful learning",
          "Ubah respons menjadi pembelajaran berguna",
        ),
        paragraphs: [
          L(
            "Review reports promptly, explain the warning signs, and assign focused learning when needed. In a follow-up, use a comparable objective and document any differences in audience or context. A simulation gives evidence about this exercise; it does not calculate the probability of a real breach.",
            "Tinjau laporan segera, jelaskan tanda peringatan, dan tugaskan pembelajaran terarah bila diperlukan. Pada tindak lanjut, gunakan tujuan yang sebanding dan dokumentasikan perbedaan audiens atau konteks. Simulasi memberi bukti tentang latihan ini; tidak menghitung probabilitas pelanggaran nyata.",
          ),
        ],
      },
    ],
  },
  {
    ...editorial,
    href: "/guides/awareness-measurement",
    kind: "guide",
    title: L(
      "Measure awareness without losing the evidence",
      "Ukur kesadaran tanpa kehilangan bukti",
    ),
    description: L(
      "A field guide to scores, denominators, comparisons, and honest reporting.",
      "Panduan nilai, pembagi, perbandingan, dan pelaporan yang jujur.",
    ),
    topic: L("Measurement", "Pengukuran"),
    role: roles.grc,
    area: areas.awareness,
    difficulty: "intermediate",
    related: [
      "/docs/human-risk",
      "/docs/outcome-reports",
      "/blog/measure-awareness",
    ],
    sections: [
      {
        id: "question",
        heading: L(
          "Start with the question, not the percentage",
          "Mulai dari pertanyaan, bukan persentase",
        ),
        paragraphs: [
          L(
            "Participation asks who started. Assignment completion asks which assigned work is finished. Quiz results ask what was answered correctly. Simulation events ask what happened in a controlled practice. Awareness combines the available evidence. These measures are related, but none is an interchangeable label for another.",
            "Partisipasi menanyakan siapa yang memulai. Penyelesaian tugas menanyakan pekerjaan mana yang selesai. Hasil kuis menanyakan jawaban yang benar. Peristiwa simulasi menanyakan apa yang terjadi pada latihan terkendali. Kesadaran menggabungkan bukti yang tersedia. Pengukuran ini berkaitan, tetapi tidak dapat saling menggantikan.",
          ),
        ],
      },
      {
        id: "denominator",
        heading: L("Always carry the denominator", "Selalu sertakan pembagi"),
        paragraphs: [
          L(
            "Write ‘18 of 24 employees completed a baseline’ before you write 75%. Describe whether a score represents employees with evidence or the whole audience. In AVERIS, measured people coverage and component coverage answer separate questions. A high score with 35% component coverage deserves a different next step from the same score with all components measured.",
            "Tulis ‘18 dari 24 karyawan menyelesaikan asesmen awal’ sebelum menulis 75%. Jelaskan apakah nilai mewakili karyawan dengan bukti atau seluruh audiens. Di AVERIS, cakupan karyawan terukur dan cakupan komponen menjawab pertanyaan berbeda. Nilai tinggi dengan cakupan komponen 35% memerlukan langkah berbeda dari nilai sama dengan semua komponen terukur.",
          ),
        ],
      },
      {
        id: "comparison",
        heading: L("Compare like with like", "Bandingkan hal yang sebanding"),
        paragraphs: [
          L(
            "Use the same campaign audience and a defined measurement window where possible. Check which people completed both baseline and follow-up. If the responding group changes, explain that change alongside the score difference. A better average can reflect a different group, not just improved knowledge.",
            "Gunakan audiens kampanye yang sama dan jendela pengukuran jelas bila memungkinkan. Periksa siapa yang menyelesaikan asesmen awal dan tindak lanjut. Jika kelompok yang merespons berubah, jelaskan perubahan itu bersama selisih nilai. Rata-rata yang lebih baik dapat mencerminkan kelompok berbeda, bukan hanya peningkatan pengetahuan.",
          ),
        ],
      },
      {
        id: "missing",
        heading: L(
          "Make missing evidence a work item",
          "Jadikan bukti yang belum tersedia sebagai tindakan",
        ),
        paragraphs: [
          L(
            "Keep an unanswered assessment Unmeasured. Investigate whether the assignment was delivered, accessible, started, or overdue. Then choose the next action: resolve delivery, provide time to learn, explain the purpose, or perform the missing follow-up. Filling a chart with zero hides this operational question.",
            "Pertahankan asesmen yang belum dijawab sebagai Belum diukur. Selidiki apakah tugas terkirim, dapat diakses, dimulai, atau terlambat. Lalu pilih tindakan: perbaiki pengiriman, sediakan waktu belajar, jelaskan tujuan, atau lakukan tindak lanjut yang belum ada. Mengisi grafik dengan nol menyembunyikan pertanyaan operasional ini.",
          ),
        ],
      },
      {
        id: "report",
        heading: L(
          "Make the claim no stronger than the evidence",
          "Jangan membuat klaim melebihi bukti",
        ),
        paragraphs: [
          L(
            "A useful report states scope, period, evidence source, result, limitation, and next action. ‘The completed follow-ups improved; six people are still unmeasured’ is more informative than ‘risk reduced.’ Export the evidence register when the reader needs to inspect the underlying records.",
            "Laporan berguna menyatakan cakupan, periode, sumber bukti, hasil, batasan, dan tindakan berikutnya. ‘Hasil tindak lanjut yang selesai meningkat; enam orang masih belum diukur’ lebih informatif daripada ‘risiko berkurang.’ Ekspor daftar bukti jika pembaca perlu memeriksa catatan dasarnya.",
          ),
        ],
      },
    ],
  },
  {
    ...editorial,
    href: "/guides/human-risk",
    kind: "guide",
    title: L(
      "Turn human risk questions into a program",
      "Ubah pertanyaan risiko manusia menjadi program",
    ),
    description: L(
      "Use evidence to decide where to act without reducing people to a score.",
      "Gunakan bukti untuk menentukan tindakan tanpa mereduksi orang menjadi nilai.",
    ),
    topic: L("Human risk", "Risiko manusia"),
    role: roles.security,
    area: areas.awareness,
    difficulty: "foundation",
    related: ["/guides/security-awareness-program", "/docs/human-risk"],
    sections: [
      {
        id: "context",
        heading: L(
          "A useful question names the context",
          "Pertanyaan berguna menyebutkan konteks",
        ),
        paragraphs: [
          L(
            "‘Who is risky?’ invites a label. A more useful question is ‘Which team needs practice recognizing payment-change requests, and what evidence supports that choice?’ Define the task, the audience, and the available observations. Keep assumptions separate from measured activity.",
            "‘Siapa yang berisiko?’ mengundang pelabelan. Pertanyaan yang lebih berguna adalah ‘Tim mana yang perlu berlatih mengenali permintaan perubahan pembayaran, dan bukti apa yang mendukung pilihan itu?’ Tetapkan tugas, audiens, dan pengamatan yang tersedia. Pisahkan asumsi dari aktivitas terukur.",
          ),
        ],
      },
      {
        id: "evidence",
        heading: L(
          "Read several kinds of evidence",
          "Baca beberapa jenis bukti",
        ),
        paragraphs: [
          L(
            "Knowledge results indicate answers to selected questions. Practice events indicate responses in a controlled situation. Reporting history includes decisions reviewed by security administrators. Missing evidence identifies what you do not yet know. None of these describes the whole person or all of their work.",
            "Hasil pengetahuan menunjukkan jawaban atas pertanyaan terpilih. Peristiwa latihan menunjukkan respons dalam situasi terkendali. Riwayat pelaporan mencakup keputusan yang ditinjau administrator keamanan. Bukti yang belum tersedia menunjukkan hal yang belum diketahui. Tidak satu pun menggambarkan keseluruhan orang atau seluruh pekerjaannya.",
          ),
        ],
      },
      {
        id: "action",
        heading: L(
          "Choose the smallest useful intervention",
          "Pilih intervensi terkecil yang berguna",
        ),
        paragraphs: [
          L(
            "A weak topic may call for a short lesson. Low participation may call for clearer timing or a delivery fix. A reported suspicious message may call for a prompt review and an explanation. Match the intervention to its evidence rather than assigning the same course to everyone by default.",
            "Topik lemah mungkin memerlukan pelajaran singkat. Partisipasi rendah mungkin memerlukan jadwal lebih jelas atau perbaikan pengiriman. Pesan mencurigakan yang dilaporkan mungkin memerlukan tinjauan segera dan penjelasan. Sesuaikan intervensi dengan bukti, alih-alih selalu memberikan materi sama kepada semua orang.",
          ),
        ],
      },
      {
        id: "prove",
        heading: L(
          "Define what would count as progress",
          "Tentukan apa yang dianggap sebagai kemajuan",
        ),
        paragraphs: [
          L(
            "Before acting, decide how you will check the result. Use a follow-up assessment, a reviewed reporting record, or a new controlled practice as appropriate. State the limitations. AVERIS helps preserve these records and relationships; deciding whether the intervention worked still requires a person to review them.",
            "Sebelum bertindak, tentukan cara memeriksa hasilnya. Gunakan asesmen tindak lanjut, catatan pelaporan yang ditinjau, atau latihan terkendali baru sesuai kebutuhan. Nyatakan batasan. AVERIS membantu mempertahankan catatan dan hubungan ini; menentukan apakah intervensi berhasil tetap memerlukan tinjauan manusia.",
          ),
        ],
      },
    ],
  },
];

export const articles: ContentEntry[] = [
  {
    ...editorial,
    href: "/blog/measure-awareness",
    kind: "article",
    title: L(
      "Completion is a starting point, not an outcome",
      "Penyelesaian adalah titik awal, bukan hasil akhir",
    ),
    description: L(
      "A finished assignment tells you something useful. It does not answer every question about awareness.",
      "Tugas selesai memberi informasi berguna. Namun, itu tidak menjawab setiap pertanyaan tentang kesadaran.",
    ),
    topic: L("Measurement", "Pengukuran"),
    role: roles.everyone,
    area: areas.awareness,
    difficulty: "foundation",
    related: ["/guides/awareness-measurement", "/docs/human-risk"],
    sections: [
      {
        id: "completion",
        heading: L(
          "What a completed assignment actually tells you",
          "Makna tugas yang selesai",
        ),
        paragraphs: [
          L(
            "Completion is an operational result: a person finished assigned work under the course's rules. It helps administrators find overdue assignments and understand whether a program reached people. Keep that measure. The mistake is asking it to prove a different result, such as whether someone will recognize an unexpected request in their everyday work.",
            "Penyelesaian adalah hasil operasional: seseorang menyelesaikan tugas sesuai aturan materi. Ini membantu administrator menemukan tugas terlambat dan memahami apakah program menjangkau orang. Pertahankan pengukuran itu. Kekeliruannya adalah memintanya membuktikan hasil berbeda, seperti apakah seseorang akan mengenali permintaan tak terduga dalam pekerjaan sehari-hari.",
          ),
        ],
      },
      {
        id: "comparison",
        heading: L(
          "Add a before and an after",
          "Tambahkan kondisi sebelum dan sesudah",
        ),
        paragraphs: [
          L(
            "A baseline gives context to the result after learning. If both measurements exist, ask what changed and who is included. If only a final quiz exists, call it a quiz result. The absence of a baseline is a reason to plan the next measurement, not to reconstruct an improvement claim.",
            "Asesmen awal memberikan konteks bagi hasil setelah pembelajaran. Jika kedua pengukuran tersedia, tanyakan apa yang berubah dan siapa yang tercakup. Jika hanya ada kuis akhir, sebut itu hasil kuis. Tidak adanya kondisi awal adalah alasan merencanakan pengukuran berikutnya, bukan merekonstruksi klaim peningkatan.",
          ),
        ],
      },
      {
        id: "evidence",
        heading: L(
          "Show the evidence beside the result",
          "Tampilkan bukti di samping hasil",
        ),
        paragraphs: [
          L(
            "A high awareness score with limited component coverage is a useful signal with an incomplete picture. Showing the coverage makes the next action clear: collect the missing evidence. This is why AVERIS keeps participation, completion, awareness, and coverage visible as distinct measures.",
            "Nilai kesadaran tinggi dengan cakupan komponen terbatas adalah sinyal berguna dengan gambaran belum lengkap. Menampilkan cakupan memperjelas tindakan berikutnya: kumpulkan bukti yang belum ada. Karena itu AVERIS menampilkan partisipasi, penyelesaian, kesadaran, dan cakupan sebagai pengukuran terpisah.",
          ),
        ],
      },
    ],
  },
  {
    ...editorial,
    href: "/blog/unmeasured-is-not-zero",
    kind: "article",
    title: L(
      "Unmeasured is useful information",
      "Belum diukur adalah informasi yang berguna",
    ),
    description: L(
      "Missing evidence should lead to a question, not a made-up number.",
      "Bukti yang belum ada seharusnya menghasilkan pertanyaan, bukan angka buatan.",
    ),
    topic: L("Evidence", "Bukti"),
    role: roles.everyone,
    area: areas.awareness,
    difficulty: "foundation",
    related: ["/docs/human-risk", "/tutorials/run-baseline"],
    sections: [
      {
        id: "unknown",
        heading: L(
          "Zero and unknown describe different things",
          "Nol dan belum diketahui adalah hal berbeda",
        ),
        paragraphs: [
          L(
            "A score of zero is an observed result under a measurement rule. An unmeasured component has no result to interpret. Replacing one with the other makes a dashboard look complete while changing its meaning. It can make a new employee appear to be the weakest performer before they have received an assignment.",
            "Nilai nol adalah hasil yang diamati berdasarkan aturan pengukuran. Komponen yang belum diukur belum memiliki hasil untuk ditafsirkan. Mengganti satu dengan yang lain membuat dasbor terlihat lengkap sambil mengubah maknanya. Ini dapat membuat karyawan baru tampak sebagai peserta terlemah sebelum menerima tugas.",
          ),
        ],
      },
      {
        id: "action",
        heading: L(
          "Ask why the evidence is missing",
          "Tanyakan mengapa bukti belum ada",
        ),
        paragraphs: [
          L(
            "Check whether work was assigned, delivered, accessible, and due. Each answer suggests a different action. A failed email needs a delivery fix. An unassigned topic needs a program decision. An unfinished follow-up needs attention to sequence and timing. A single zero would hide these differences.",
            "Periksa apakah pekerjaan sudah ditugaskan, dikirim, dapat diakses, dan jatuh tempo. Setiap jawaban menyarankan tindakan berbeda. Email gagal memerlukan perbaikan pengiriman. Topik yang belum ditugaskan memerlukan keputusan program. Tindak lanjut belum selesai memerlukan perhatian pada urutan dan waktu. Satu angka nol akan menyembunyikan perbedaan ini.",
          ),
        ],
      },
      {
        id: "report",
        heading: L(
          "Give coverage a place in the report",
          "Sertakan cakupan dalam laporan",
        ),
        paragraphs: [
          L(
            "Report measured employees alongside the audience and component coverage alongside the score. A reader can then decide whether to expand measurement or address an observed gap. Honest incompleteness makes the report more actionable.",
            "Laporkan karyawan terukur bersama audiens dan cakupan komponen bersama nilai. Pembaca kemudian dapat menentukan apakah perlu memperluas pengukuran atau menangani kesenjangan yang diamati. Ketidaklengkapan yang jujur membuat laporan lebih berguna untuk bertindak.",
          ),
        ],
      },
    ],
  },
  {
    ...editorial,
    href: "/blog/learning-revisions",
    kind: "article",
    title: L(
      "Why learning evidence needs a version",
      "Mengapa bukti pembelajaran memerlukan versi",
    ),
    description: L(
      "A course title is not enough to explain what an employee completed.",
      "Judul materi saja tidak cukup untuk menjelaskan apa yang diselesaikan karyawan.",
    ),
    topic: L("Content operations", "Pengelolaan materi"),
    role: roles.hr,
    area: areas.learning,
    difficulty: "foundation",
    related: ["/docs/learning-revisions", "/tutorials/publish-learning"],
    sections: [
      {
        id: "question",
        heading: L(
          "Which lesson did this result belong to?",
          "Pelajaran mana yang menghasilkan nilai ini?",
        ),
        paragraphs: [
          L(
            "A course may change as procedures improve. If a question, answer, or passing rule is edited after people complete it, the title alone cannot explain the old result. A reviewer needs the content and rules that were assigned at the time.",
            "Materi dapat berubah saat prosedur diperbaiki. Jika pertanyaan, jawaban, atau aturan kelulusan diedit setelah peserta menyelesaikannya, judul saja tidak menjelaskan hasil lama. Peninjau memerlukan materi dan aturan yang ditugaskan saat itu.",
          ),
        ],
      },
      {
        id: "revision",
        heading: L(
          "Let new learning change without rewriting history",
          "Perbarui pembelajaran tanpa menulis ulang riwayat",
        ),
        paragraphs: [
          L(
            "AVERIS assignments retain their course revision. Editors can publish an improved version for future work while existing assignments keep their content. The result is a clearer relationship between the lesson, the questions, the completed attempt, and the certificate.",
            "Tugas AVERIS mempertahankan revisi materinya. Editor dapat menerbitkan versi lebih baik untuk pekerjaan berikutnya sementara tugas yang sudah ada mempertahankan isinya. Hasilnya adalah hubungan lebih jelas antara pelajaran, pertanyaan, percobaan selesai, dan sertifikat.",
          ),
        ],
      },
      {
        id: "practice",
        heading: L(
          "Make revision review part of publishing",
          "Jadikan tinjauan revisi bagian dari penerbitan",
        ),
        paragraphs: [
          L(
            "Before assigning a new campaign, check the course language, duration, questions, and current revision. When you archive old content, explain whether a replacement is needed for future assignments. Preserving evidence and improving learning can be part of the same workflow.",
            "Sebelum menugaskan kampanye baru, periksa bahasa, durasi, pertanyaan, dan revisi materi saat ini. Saat mengarsipkan materi lama, jelaskan apakah tugas mendatang memerlukan pengganti. Mempertahankan bukti dan memperbaiki pembelajaran dapat menjadi bagian dari alur yang sama.",
          ),
        ],
      },
    ],
  },
];

const videoPlans = [
  {
    slug: "product-tour",
    title: L("The AVERIS product loop", "Siklus produk AVERIS"),
    topic: L("Product Tour", "Tur Produk"),
    area: areas.awareness,
    related: ["/docs/getting-started", "/tutorials/first-awareness-program"],
    chapters: [
      L("Measure the starting point", "Ukur kondisi awal"),
      L("Understand score and coverage", "Pahami nilai dan cakupan"),
      L("Choose the next intervention", "Pilih intervensi berikutnya"),
      L("Review the follow-up evidence", "Tinjau bukti tindak lanjut"),
    ],
  },
  {
    slug: "getting-started",
    title: L("Prepare your first workspace", "Siapkan ruang kerja pertama"),
    topic: L("Getting Started", "Memulai"),
    area: areas.people,
    related: ["/tutorials/add-employees", "/tutorials/publish-learning"],
    chapters: [
      L("Add active employees", "Tambahkan karyawan aktif"),
      L("Publish the first course", "Terbitkan materi pertama"),
      L("Review access and delivery", "Tinjau akses dan pengiriman"),
    ],
  },
  {
    slug: "create-campaign",
    title: L("Build and launch a campaign", "Buat dan luncurkan kampanye"),
    topic: L("Admin Tutorials", "Tutorial Administrator"),
    area: areas.campaigns,
    related: ["/tutorials/first-awareness-program", "/docs/campaigns"],
    chapters: [
      L("Define the objective and audience", "Tetapkan tujuan dan audiens"),
      L("Select learning and measurement", "Pilih pembelajaran dan pengukuran"),
      L("Review the schedule and launch", "Tinjau jadwal dan luncurkan"),
    ],
  },
  {
    slug: "employee-experience",
    title: L(
      "Your next step as an employee",
      "Langkah berikutnya sebagai karyawan",
    ),
    topic: L("Employee Tutorials", "Tutorial Karyawan"),
    area: areas.learning,
    related: ["/docs/learning-revisions", "/docs/phishing-and-simulations"],
    chapters: [
      L("Find your next assignment", "Temukan tugas berikutnya"),
      L(
        "Resume learning and take the quiz",
        "Lanjutkan pembelajaran dan ikuti kuis",
      ),
      L("Review awareness and certificates", "Tinjau kesadaran dan sertifikat"),
    ],
  },
  {
    slug: "read-awareness",
    title: L(
      "Read awareness with its evidence",
      "Baca kesadaran bersama buktinya",
    ),
    topic: L("Feature Tutorials", "Tutorial Fitur"),
    area: areas.awareness,
    related: ["/docs/human-risk", "/guides/awareness-measurement"],
    chapters: [
      L("Separate score from coverage", "Pisahkan nilai dari cakupan"),
      L("Inspect the component history", "Periksa riwayat komponen"),
      L("Choose a follow-up action", "Pilih tindakan tindak lanjut"),
    ],
  },
];
export const videos: ContentEntry[] = videoPlans.map((plan) => ({
  ...editorial,
  href: `/videos/${plan.slug}`,
  kind: "video",
  title: plan.title,
  description: L(
    "Recording in preparation. Follow the written walkthrough and explore the interactive product tour while original media is prepared.",
    "Rekaman sedang disiapkan. Ikuti panduan tertulis dan jelajahi tur produk interaktif sambil menunggu media asli.",
  ),
  topic: plan.topic,
  area: plan.area,
  role: roles.everyone,
  difficulty: "foundation",
  related: plan.related,
  sections: [],
  demo: "/tour",
  video: {
    status: "planned",
    chapters: plan.chapters.map((title, index) => ({
      title,
      text: L(
        `Step ${index + 1} of the planned walkthrough. The linked tutorial below provides the current instructions.`,
        `Langkah ${index + 1} dalam panduan yang direncanakan. Tutorial tertaut di bawah menyediakan petunjuk saat ini.`,
      ),
    })),
  },
}));
