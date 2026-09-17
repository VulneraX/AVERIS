# Dokumentasi Lengkap AVERIS

Security Awareness & Human Risk Platform · oleh VulneraX  
**Measure Awareness. Reduce Human Risk.**

Dokumentasi implementasi workspace dan public website per 13 September 2026. Versi paket `0.1.0`, metodologi skor workspace `1.0`. Nomor versi bukan sertifikasi kesiapan produksi. Dokumen ini mendeskripsikan kode aktif; [dokumen historis](docs/DOKUMENTASI_LEGACY.md) disimpan untuk peninjauan migrasi. Status penerimaan dan pekerjaan tersisa tersedia di [PRODUCT_MATURITY.md](PRODUCT_MATURITY.md).

## Daftar isi

1. [Apa itu AVERIS](#1-apa-itu-averis)
2. [Public website ecosystem](#2-public-website-ecosystem)
3. [Tujuan dan batas penggunaan](#3-tujuan-dan-batas-penggunaan)
4. [Pengguna dan hak akses](#4-pengguna-dan-hak-akses)
5. [Navigasi produk](#5-navigasi-produk)
6. [Fitur administrator](#6-fitur-administrator)
7. [Fitur karyawan](#7-fitur-karyawan)
8. [Alur end-to-end](#8-alur-end-to-end)
9. [Lifecycle kampanye](#9-lifecycle-kampanye)
10. [Materi, kuis, dan asesmen](#10-materi-kuis-dan-asesmen)
11. [Awareness Score](#11-awareness-score)
12. [Metrik dan laporan](#12-metrik-dan-laporan)
13. [Phishing](#13-phishing)
14. [Sertifikat](#14-sertifikat)
15. [Arsitektur](#15-arsitektur)
16. [Technology stack](#16-technology-stack)
17. [Struktur repository](#17-struktur-repository)
18. [Model data dan migrasi](#18-model-data-dan-migrasi)
19. [Kontrak API](#19-kontrak-api)
20. [Identitas dan akses](#20-identitas-dan-akses)
21. [Keamanan dan privasi](#21-keamanan-dan-privasi)
22. [Notifikasi dan automation](#22-notifikasi-dan-automation)
23. [Integrasi](#23-integrasi)
24. [Design system dan aksesibilitas](#24-design-system-dan-aksesibilitas)
25. [Instalasi dan konfigurasi](#25-instalasi-dan-konfigurasi)
26. [Deployment dan operasional](#26-deployment-dan-operasional)
27. [Testing](#27-testing)
28. [Troubleshooting](#28-troubleshooting)
29. [Batasan dan backlog](#29-batasan-dan-backlog)
30. [Contoh penggunaan](#30-contoh-penggunaan)
31. [Glosarium dan referensi](#31-glosarium-dan-referensi)

## 1. Apa itu AVERIS

AVERIS adalah aplikasi web full-stack untuk mengelola program kesadaran keamanan siber dan memahami risiko manusia berdasarkan bukti pengetahuan serta perilaku yang tercatat. Organisasi dapat menugaskan materi kepada peserta tertentu, mengukur pengetahuan sebelum dan setelah program, menjalankan kuis, meninjau pesan mencurigakan, dan menghasilkan bukti hasil pembelajaran.

Produk memiliki ruang pengelola untuk Security, IT, HR, GRC, dan manajemen, serta ruang personal karyawan. Data tugas, asesmen, nilai, dan sertifikat melekat pada pengguna yang benar-benar melakukan aktivitas tersebut.

Empat pertanyaan utama yang ingin dijawab:

- Apa risiko manusia yang sudah terukur saat ini?
- Bukti apa yang menjelaskan kondisi tersebut?
- Intervensi apa yang perlu dilakukan berikutnya?
- Apakah ada bukti perubahan setelah intervensi?

```text
Ukur → Pahami risiko → Ambil tindakan → Buktikan perubahan
  ↑                                             │
  └──────────── pengukuran berikutnya ───────────┘
```

Contoh sederhana: hasil topik phishing rendah pada kelompok Finance. Admin menugaskan refresher, peserta menjalankan baseline dan pembelajaran, lalu follow-up. Tim meninjau hasil dan mengekspor bukti program.

## 2. Public website ecosystem

Website publik AVERIS sekarang memiliki route terpisah untuk discovery,
evaluasi, product education, dan konversi. Homepage `/` tetap menjadi cerita
singkat; halaman lain tidak masuk ke workspace terautentikasi.

Route inti:

- `/platform`, `/how-it-works`, dan `/product/*` menjelaskan kemampuan produk aktif.
- `/solutions` menjelaskan kebutuhan Security, GRC, dan HR / Learning.
- `/tour` menyediakan guided tour lima langkah dengan data demo fiktif.
- `/demo` menyediakan self-service product preview tanpa membuat akun.
- `/request-demo` mengirim inquiry melalui endpoint public yang sudah ada.
- `/videos`, `/tutorials`, `/academy`, `/docs`, `/resources`, `/blog`, dan `/guides` menyediakan content hub lokal.
- `/security`, `/integrations`, `/support`, `/pricing`, `/about`, dan `/compare` menjelaskan trust, status konektor, bantuan, serta positioning komersial.
- `/tools/awareness-maturity` menyediakan penilaian indikatif lima pertanyaan tanpa meminta email.

Halaman public menggunakan `PublicSite.tsx` dan `public-site.css`. Product frame
memakai data ACME fiktif yang diberi label ilustratif; tidak ada tenant,
employee, inquiry, campaign, atau simulation workspace yang berubah ketika
visitor berinteraksi dengan tour atau demo.

Content saat ini masih berupa typed local data, bukan CMS. Video player nyata,
transcript/chapter, global Cmd/Ctrl+K search, localized route metadata, CRM,
webinar lifecycle, customer stories, dan public uptime history belum aktif.
Jangan mendokumentasikan item tersebut sebagai capability yang sudah tersedia.
Route inventory dan batas detail ada di [PUBLIC_WEBSITE.md](docs/PUBLIC_WEBSITE.md).

## 3. Tujuan dan batas penggunaan

### Masalah yang ditangani

- Pelatihan tersebar di spreadsheet dan hasil sulit ditelusuri.
- Status selesai tidak selalu berarti peserta memahami materi.
- Tidak ada baseline untuk membandingkan perubahan.
- Tim keamanan kesulitan menentukan sasaran intervensi.
- Laporan phishing tidak memiliki alur peninjauan yang konsisten.
- Bukti penyelesaian dan sertifikat sulit dikumpulkan saat diperlukan.

| Pihak | Manfaat praktis |
| --- | --- |
| Security / IT | Menentukan prioritas, menjalankan program, meninjau laporan |
| HR / Learning | Mengelola peserta, konten, assignment, dan progres |
| GRC / audit internal | Mengambil bukti penyelesaian serta riwayat aktivitas |
| Manajemen | Menilai cakupan, partisipasi, hasil, dan perubahan |
| Karyawan | Mengetahui tugas berikutnya dan perkembangan pribadi |

AVERIS bukan SIEM, EDR, email gateway, pemindai kerentanan, atau platform respons insiden lengkap. Pelaporan phishing bukan analisis malware otomatis. Simulasi tidak mengumpulkan kata sandi nyata.

Awareness Score adalah indikator berdasarkan bukti tersedia, bukan probabilitas seseorang menyebabkan insiden. Sertifikat membuktikan kriteria belajar di aplikasi terpenuhi, bukan sertifikasi profesi atau jaminan kepatuhan hukum. Penggunaan data individual perlu mengikuti kebijakan internal dan prinsip minimisasi akses.

## 4. Pengguna dan hak akses

Role ditegakkan backend melalui sesi dan pemeriksaan izin.

| Kemampuan workspace | Super Admin | Admin | Manager | Employee |
| --- | --- | --- | --- | --- |
| Overview, awareness, laporan organisasi | Ya | Ya | Ya | Tidak |
| Melihat direktori organisasi | Ya | Ya | Akun employee | Tidak |
| Membuat draft kampanye | Ya | Ya | Ya | Tidak |
| Edit / launch / end kampanye | Ya | Ya | Tidak | Tidak |
| Mengelola revisi konten | Ya | Ya | Baca | Tidak |
| Menambah employee / manager | Ya | Ya | Tidak | Tidak |
| Mengelola administrator | Ya | Tidak | Tidak | Tidak |
| Mengelola kelompok | Ya | Ya | Baca | Tidak |
| Meninjau phishing | Ya | Ya | Baca | Laporan sendiri |
| Melihat sertifikat | Tenant | Tenant | Tenant | Sendiri |
| Cabut / pulihkan sertifikat | Ya | Ya | Tidak | Tidak |
| Mengubah pengaturan organisasi | Ya | Ya | Baca | Tidak |
| Membaca audit organisasi | Ya | Ya | Ya | Tidak |
| Belajar / kuis / asesmen | Tidak | Tidak | Tidak | Tugas sendiri |
| Kata sandi, MFA, sesi sendiri | Ya | Ya | Ya | Ya |

Super Admin adalah pemilik tenant, bukan operator global lintas semua organisasi. Manager belum dibatasi hanya ke departemen yang dipimpinnya. Jangan menganggap pembatasan departemen manager sudah tersedia.

Pengguna tidak dapat menonaktifkan akun sendiri atau mengubah role sendiri melalui manajemen pengguna. Penonaktifan dan perubahan role mencabut sesi target. Bukti pembelajaran tetap disimpan.

## 5. Navigasi produk

### Pengelola

| Menu utama | Tujuan |
| --- | --- |
| Overview | Kondisi organisasi dan prioritas tindakan |
| People | Peserta, departemen, kelompok, profil individual |
| Campaigns | Perencanaan, pelaksanaan, dan evaluasi program |
| Learning | Materi, lesson, pertanyaan, revisi |
| Awareness | Distribusi risiko, komponen skor, topik, departemen |
| Reports | Ekspor hasil untuk pimpinan dan bukti program |

Integrations dan Settings merupakan navigasi sekunder. Security inbox berada di header. Audit dan kesehatan pengiriman disediakan dalam pengaturan, bukan memenuhi navigasi utama.

### Karyawan

Empat menu: Home, Learning, My Awareness, Certificates. My account berada di navigasi sekunder. Report phishing dapat dijangkau dari header. Player dan kuis menggunakan tampilan fokus tanpa navigasi administratif.

Kondisi kosong tidak diganti angka demo. Skeleton menunjukkan pemuatan; kesalahan memberikan penjelasan dan opsi mencoba kembali. Tindakan berdampak menggunakan konfirmasi. Pilihan bahasa ID / EN disimpan sebagai preferensi lokal.

## 6. Fitur administrator

### 5.1 Overview

Menampilkan awareness, cakupan pengukuran, partisipasi, penyelesaian, distribusi risiko, dan prioritas. Angka berasal dari assignment, attempt, ledger skor, serta simulasi yang tersimpan. Workspace baru menampilkan belum terukur apabila belum ada bukti, meskipun database lama berisi agregat demo.

### 5.2 People

- Pencarian dan filter departemen, risiko, serta status aktif.
- Penambahan melalui undangan atau kata sandi sementara.
- Impor CSV dengan hasil berhasil dan kesalahan per baris.
- Kelompok karyawan sebagai audiens kampanye.
- Profil individual: awareness, pembelajaran, simulasi, sertifikat, aktivitas.
- Edit nama, departemen, role; email tidak diubah dari form edit.
- Reset kata sandi, aktivasi / penonaktifan, dan pintasan penugasan personal.

Keanggotaan kelompok dipakai saat memilih audiens; perubahan kelompok tidak otomatis mengubah assignment yang sudah diluncurkan. UI kelompok berfokus pada pembuatan dan pemilihan; penyuntingan kelompok existing tersedia pada kontrak API.

### 5.3 Campaigns

Daftar kampanye memiliki pencarian, tab status, template awal, dan builder lima langkah. Detail menggabungkan overview, participants, learning, assessment, simulation, dan activity. Template hanya titik awal, bukan program yang sudah berjalan.

### 5.4 Learning

Library menampilkan revisi terbaru, kategori, status, dan penggunaan. Builder mengelola metadata, lesson teks terstruktur, pertanyaan, kelulusan, pratinjau, autosave draft valid, publish revisi baru, duplikasi, dan arsip.

Jenis lesson aktif: Article, Scenario, Checklist, Security tip. Upload video, SCORM, PDF lesson, dan asset manager belum merupakan kemampuan workspace aktif.

### 5.5 Awareness

Menampilkan skor, cakupan, distribusi risiko, hasil topik, perbandingan departemen, dan tindakan refresher. Perbandingan perubahan memakai ledger. Chart tren multi-titik dan analisis cohort lanjutan belum lengkap; jangan menafsirkan tampilan saat ini sebagai analytics longitudinal penuh.

### 5.6 Reports dan Settings

Kategori laporan: Executive, Campaign, Employee, Compliance Evidence. Settings menyimpan organisasi, bahasa default, zona waktu, pengingat, dan retensi pesan operasional. Account, sesi, MFA, audit, serta kesehatan pengiriman tersedia sebagai bagian sekunder.

## 7. Fitur karyawan

Home memprioritaskan tugas berikutnya berdasarkan data pribadi: asesmen awal, pembelajaran, lalu asesmen tindak lanjut yang telah terbuka. Halaman menampilkan progres, tenggat, awareness, dan pencapaian terbaru.

Learning memisahkan tugas yang ditugaskan dan selesai. Satu peserta menyelesaikan tugas tidak mengubah status orang lain. Server memeriksa kepemilikan, prasyarat baseline, serta status program.

Player menyimpan indeks lesson di backend dan dapat dilanjutkan. Setelah konten selesai, kuis terbuka. Hasil menunjukkan nilai, kelulusan, jawaban, dan kebijakan ulang.

Attempt dan urutan soal tersimpan, tetapi pilihan jawaban sebelum submit hanya berada pada state halaman; refresh dapat menghilangkan pilihan yang belum dikirim. Ini bukan autosave jawaban lintas perangkat.

My Awareness hanya menampilkan data sendiri, komponen terukur, metodologi, dan histori. Certificates memberikan download setelah kelulusan sah. Form phishing menerima pengirim, kanal, subjek, dan alasan; catatan investigasi internal tidak diberikan kepada employee.

## 8. Alur end-to-end

### 7.1 Onboarding organisasi

1. Operator menyiapkan runtime, database, secret, dan origin.
2. Bootstrap pertama membuat organisasi dan akun sesuai environment.
3. Pemilik masuk dan meninjau pengaturan organisasi.
4. SMTP dikonfigurasi bila undangan / pengingat email akan digunakan.
5. Tim menambah peserta dan administrator sesuai kewenangan.
6. Materi ditinjau serta diterbitkan.
7. Kampanye pilot dijalankan pada kelompok kecil sebelum rollout.

Self-service billing, registrasi tenant publik, dan provisioning SaaS belum tersedia.

### 7.2 Program awareness

```text
Draft + audiens + revisi konten + jadwal
                  │
                Launch
                  │
      Assignment individual + notifikasi
                  │
     Baseline → Lesson → Kuis → Sertifikat
                            │
                   Follow-up jika aktif
                            │
                    Ledger skor / audit
                            │
                Laporan → Intervensi ulang
```

Baseline dan follow-up mengikuti pilihan kampanye. Follow-up terbuka setelah seluruh assignment pengguna di program selesai. Remediasi dilakukan dengan penugasan baru; attempt yang habis tidak dihapus untuk memberi kesan berhasil.

### 7.3 Pelaporan phishing

Employee mengirim → validasi / deduplikasi → notifikasi admin → tinjauan dan klasifikasi → status / audit → kontribusi skor jika memenuhi aturan. Submission saja tidak memberi kredit.

### 7.4 Pemulihan akun

Permintaan reset → respons generik → job email untuk akun aktif yang cocok → token sekali pakai → password baru → pencabutan token dan sesi lama → login kembali. Akun dengan MFA tetap memerlukan verifikasi MFA dalam reset.

## 9. Lifecycle kampanye

| Status | Makna | Transisi |
| --- | --- | --- |
| Draft | Konfigurasi belum dijalankan | Launch, Cancel |
| Scheduled | Menunggu waktu mulai | Draft, Cancel, otomatis Active |
| Active | Program dapat dikerjakan | End, otomatis Completed saat deadline |
| Completed | Ditutup, bukti disimpan | Archive |
| Archived | Riwayat diarsipkan | Baca |
| Cancelled | Draft / jadwal dibatalkan | Baca |

Active ditutup dengan End, bukan Cancel. Completed tidak berarti semua peserta lulus.

Builder lima langkah:

1. Basics: nama, tujuan, penanggung jawab.
2. Audience: semua employee aktif, departemen, kelompok, atau individu; preview peserta.
3. Learning: revisi Published, durasi, passing score.
4. Measure & Simulate: baseline, follow-up, template simulasi.
5. Schedule & Review: start, deadline, pengingat, tinjauan dan launch.

Server menyimpan tanggal ISO UTC. Input jadwal mengikuti zona waktu browser; tampilan tanggal umum mengikuti zona waktu organisasi. Pastikan zona perangkat benar saat mengisi jadwal.

Launch memerlukan audiens, konten, dan deadline mendatang. Draft dapat belum lengkap. `version` mendeteksi edit bersamaan; versi lama ditolak `409 VERSION_CONFLICT`.

Aktivasi membuat satu assignment per kombinasi program–user–revision. Unique constraint mencegah duplikasi. Peserta nonaktif tidak menerima tugas baru. Jadwal tanpa audiens aktif dikembalikan ke Draft dengan notifikasi pemilik, sehingga tidak menghentikan seluruh siklus worker.

## 10. Materi, kuis, dan asesmen

### 9.1 Dokumen materi

Metadata: title, category, description, duration, difficulty, language, passingScore, maxAttempts, retryMinutes. Dokumen berisi lessons dan questions.

| Data | Batas server |
| --- | --- |
| Judul | 3–150 karakter |
| Durasi | 1–600 menit |
| Passing score | 1–100 |
| Attempt | 1–20 |
| Retry delay | 0–43.200 menit |
| Lesson | 1–40 per revisi |
| Isi lesson | Maksimal 20.000 karakter |
| Opsi jawaban | 2–10 per pertanyaan |
| Bahasa konten | `id`, `en` |

### 9.2 Revisi immutable

Perubahan menghasilkan revision baru. Assignment menunjuk revision ID tertentu. Mengedit soal hari ini tidak mengubah snapshot tugas yang diluncurkan kemarin. Arsip tidak menghapus dokumen yang menjadi bukti assignment lama.

Library mengambil revisi terbaru. Jika revisi terbaru Draft, terbitkan dahulu sebelum memilih materi tersebut untuk kampanye baru melalui library aktif. Dokumen revisi tidak ditimpa, meskipun status arsip dapat diperbarui.

### 9.3 Jenis soal dan penilaian

- `choice`: satu jawaban benar.
- `multiple`: himpunan jawaban harus tepat seluruhnya; tanpa nilai parsial.
- `boolean`: dua opsi, satu jawaban benar.
- `scenario`: skenario dengan satu pilihan terbaik.

Duplikat opsi, indeks tidak valid, atau jawaban kosong ditolak. Urutan indeks pada jawaban multiple tidak memengaruhi hasil. Server menghitung persentase benar dan membandingkan dengan passing score.

### 9.4 Attempt

Attempt menyimpan snapshot pertanyaan dan urutannya. Pertanyaan diacak saat attempt baru. Payload sebelum submit tidak memuat `correct` dan `explanation`. Submit ulang attempt selesai ditolak. Attempt yang belum selesai dapat digunakan kembali; attempt baru tunduk pada batas jumlah dan waktu tunggu.

Lulus membuat assignment Completed, menyimpan waktu selesai, menerbitkan sertifikat, menambah ledger, dan mengirim notifikasi. Sudah lulus berarti tidak dapat memulai kuis ulang pada assignment yang sama.

### 9.5 Asesmen

Baseline mengukur pengetahuan awal. Follow-up mengukur setelah seluruh assignment program pengguna selesai. Snapshot mengambil maksimal 20 pertanyaan dari materi program. Jawaban dan hasil disimpan dalam model asesmen tersendiri.

Asesmen bukan kuis penerbit sertifikat. Perubahan baseline–follow-up menjadi sinyal improvement bila kedua nilai ada. Asesmen hanya dapat dikerjakan pada program aktif. Penyelesaian asesmen yang sama tidak dapat dikirim ulang.

## 11. Awareness Score

### 10.1 Prinsip

Skor memakai event server, bukan angka yang dikirim frontend. Setiap event memuat organisasi, user, komponen, nilai sebelumnya, nilai baru, alasan, sumber, dan waktu. Sumber yang sama tidak dapat menghasilkan event ganda pada komponen yang sama.

Untuk setiap komponen, perhitungan mengambil bukti valid terakhir, bukan jumlah seluruh poin. Komponen yang belum terukur bernilai `null`, bukan nol. Ini penting agar peserta baru tidak langsung dianggap berisiko tinggi hanya karena belum ada data.

### 10.2 Komponen dan bobot

| Komponen | Bobot nominal | Bukti aktif |
| --- | --- | --- |
| Knowledge | 35% | Nilai kuis atau asesmen terakhir |
| Behavior | 30% | Klik simulasi: 0; melapor tanpa klik: 100 |
| Reporting | 20% | Pelaporan simulasi atau laporan mencurigakan terkonfirmasi |
| Improvement | 15% | `50 + (followUp - baseline) / 2` |

Semua nilai dibatasi 0–100. Improvement 50 berarti tidak berubah, lebih dari 50 meningkat, kurang dari 50 menurun. Formula ini bukan persentase peningkatan relatif terhadap baseline.

Jika komponen belum tersedia, bobot komponen yang tersedia dinormalisasi:

```text
coverageWeight = jumlah bobot komponen dengan bukti
score = round(jumlah(nilaiKomponen × bobotKomponen) / coverageWeight)
componentCoverage = round(coverageWeight × 100)
```

Contoh: hanya Knowledge=80, skor 80 dengan cakupan bobot 35%. Jika Reporting=100 juga tersedia, skor menjadi `round((80×0,35 + 100×0,20)/0,55) = 87`, cakupan 55%. Nilai 87 dengan cakupan 55% tidak setara kelengkapan buktinya dengan 87 pada cakupan 100%.

### 10.3 Risiko dan agregasi

| Nilai | Kategori |
| --- | --- |
| Tidak ada bukti | Unmeasured / Belum terukur |
| 0–59 | High / Tinggi |
| 60–79 | Medium / Sedang |
| 80–100 | Low / Rendah |

Skor organisasi adalah rata-rata skor employee aktif yang sudah terukur. Akun administrator dan manager tidak masuk populasi employee. Peserta belum terukur tidak dimasukkan sebagai nol. Cakupan organisasi menunjukkan proporsi employee yang sudah memiliki skor.

### 10.4 Koreksi bukti

Laporan phishing yang dikonfirmasi memberi kredit maksimal sekali per pelapor per tanggal UTC submission. Jika klasifikasi dikoreksi dan tidak ada lagi laporan Suspicious pada hari itu, kredit dinonaktifkan melalui `score_event_invalidations`; event asli tetap tersimpan. Konfirmasi kembali memulihkan bukti tanpa menduplikasi event. Audit mencatat perubahan klasifikasi.

Histori ledger dapat memuat event yang sudah dinonaktifkan. Untuk penjelasan koreksi, periksa audit dan tabel invalidasi; tampilan ledger belum memiliki badge pembatalan bukti khusus.

### 10.5 Interpretasi perubahan

Ringkasan membandingkan skor sekarang dengan bukti sebelum awal periode, pada populasi pengguna yang cocok dengan filter saat ini. Ini bukan eksperimen kausal atau cohort tetap. Perubahan jumlah peserta terukur, role, status aktif, atau komponen tersedia dapat mengubah rata-rata tanpa berarti semua orang meningkat.

Metodologi workspace ini dipisahkan dari kalkulasi agregat legacy. Angka lama tidak dikonversi menjadi event individual. Bobot ditampilkan sebagai metodologi tetap, bukan pengaturan yang dapat diubah bebas tanpa versioning.

## 12. Metrik dan laporan

### 11.1 Definisi denominator

| Metrik | Perhitungan |
| --- | --- |
| Participation | Employee dengan assignment mulai / employee yang menerima assignment |
| Assignment completion | Assignment selesai / seluruh assignment terpilih |
| Quiz pass rate | Attempt selesai yang lulus / seluruh attempt selesai dalam periode |
| Measured coverage | Employee dengan skor / employee aktif terpilih |
| Component coverage | Bobot komponen yang sudah memiliki bukti |
| Simulation click rate | Target terkirim yang mengklik / target terkirim |
| Simulation reporting rate | Target terkirim yang melapor / target terkirim |
| No action | Target terkirim tanpa klik dan tanpa laporan |
| Overdue | Assignment belum selesai dengan deadline lewat |
| Topic performance | Rata-rata nilai attempt selesai dalam kategori tersebut |

Denominator nol menghasilkan belum terukur, bukan angka nol palsu. Satu orang dengan tiga modul mempunyai tiga assignment. Attempt gagal lalu lulus menghasilkan satu assignment selesai, tetapi dua attempt pada pass-rate.

### 11.2 Semantik filter

UI menyediakan periode 7, 30, 90, 365 hari, atau semua waktu; departemen, risiko, serta kampanye. API juga menerima `from` dan `to` ISO datetime.

Periode membatasi attempt berdasarkan waktu selesai dan target simulasi berdasarkan waktu terkirim. Status assignment, profil user, serta skor merupakan snapshot sekarang. Rentang tanggal tidak membuat seluruh laporan menjadi rekonstruksi historis keadaan organisasi pada tanggal tersebut.

Campaign filter membatasi assignment, total tugas individual pada ekspor, overdue departemen, dan cohort peserta. Skor peserta tetap skor personal lintas bukti, bukan skor yang dihitung hanya dari kampanye terpilih. Perhatikan perbedaan ini ketika menilai hasil intervensi.

### 11.3 Jenis laporan

| Kategori | Penggunaan |
| --- | --- |
| Executive | Ringkasan kondisi, partisipasi, penyelesaian, cakupan, simulasi |
| Campaign | Tinjauan hasil pada kampanye terpilih |
| Employee | Ringkasan individual dan bukti belajar |
| Compliance Evidence | Assignment, kursus, program, tenggat, completion, ID sertifikat |

CSV dan PDF dibuat backend dari data tenant yang sedang login. CSV mengutip cell dan menangani awalan formula berbahaya. PDF dihasilkan oleh PDFKit, bukan HTML dengan ekstensi `.pdf`.

Implementasi saat ini belum mempunyai desain ekspor yang sepenuhnya berbeda untuk setiap kategori: CSV non-Compliance menggunakan struktur employee yang sama; PDF memakai ringkasan bersama dan detail assignment untuk kategori Employee / Compliance. Label statis PDF dan CSV masih berbahasa Inggris. Ini adalah batas implementasi, bukan empat report engine terpisah.

Ekspor adalah snapshot saat request. Keberadaan ID sertifikat pada CSV tidak menggantikan pengecekan status validitas terkini. Jangan menganggap laporan sebagai arsip bertanda tangan digital atau bukti yang tidak dapat diubah administrator database.

## 13. Phishing

### 12.1 Pelaporan oleh karyawan

Form memuat sender, subject, description, channel. Kanal: Email, SMS, Chat, Other. Pengguna diminta tidak memasukkan password atau rahasia. Tidak ada upload attachment atau parser email `.eml` pada alur aktif.

Fingerprint mencegah laporan identik berulang dari pelapor sama. Batas submission adalah 10 per jam per pelapor. Submission tidak menaikkan skor. Admin menerima notifikasi dalam aplikasi.

### 12.2 Peninjauan

Status tersedia: Submitted, Reviewing, Confirmed Suspicious, Safe, Closed. Klasifikasi terpisah: Suspicious atau Safe. Konfirmasi dan penutupan memerlukan klasifikasi yang sesuai. Admin menyimpan notes internal; employee hanya menerima status serta data laporannya, bukan catatan investigasi.

Koreksi klasifikasi dapat mengubah kontribusi skor sesuai aturan hari pelaporan. Tidak ada analisis otomatis reputasi domain, sandbox malware, atau integrasi SIEM pada alur ini.

### 12.3 Simulasi aman

Kampanye dapat menyertakan template simulasi. Aktivasi menciptakan target dan token acak per peserta; hash token disimpan pada target. Tautan digunakan untuk event `opened`, `clicked`, dan `reported`. Event `credentialAttempted` dan field tambahan ditolak oleh skema.

Alamat IP di event simulasi dipseudonimkan memakai hash dengan secret server. Event yang sama per target hanya tercatat satu kali. Tautan tidak berlaku untuk program tidak aktif atau melewati expiry; respons generik menghindari kebocoran validitas token.

Target dihitung terkirim hanya sesudah SMTP menerima pengiriman. Pending bukan delivered; tidak ada asumsi bahwa browser dibuka berarti email terkirim. Klik dan laporan adalah sinyal latihan, bukan bukti bahwa kredensial telah dicuri.

Template saat ini memengaruhi pemilihan / judul email. Konten email dan landing masih berupa latihan generik yang aman; belum ada library visual berbeda beserta preview lengkap setiap template. Event opened mencerminkan akses landing, bukan tracking pixel inbox. Token yang bocor masih dapat digunakan pihak yang memegangnya selama aktif; lindungi payload dan tautan.

## 14. Sertifikat

Sertifikat diterbitkan setelah kuis assignment lulus. Satu assignment memiliki satu record sertifikat. ID acak menggunakan awalan `AVR-`; record memuat organisasi, user, assignment, judul, nilai, status, issued_at, dan data pencabutan.

PDF menyertakan nama peserta, nama materi, organisasi, nilai, tanggal, ID, dan tautan verifikasi. Employee hanya dapat mengunduh sertifikat sendiri. Role pengelola dapat mengunduh dalam tenant-nya.

Admin dapat mencabut dengan alasan. Status publik menjadi Revoked dan download aktif ditolak. Aksi reissue pada versi ini memulihkan record yang sama menjadi Valid; tidak membuat serial baru atau riwayat penerbitan terpisah.

Endpoint publik mengembalikan hanya ID, judul, tanggal terbit, status. Nama lengkap, email, nilai, dan organisasi peserta tidak diungkap pada respons verifikasi. Status: Valid, Revoked, Not Found.

Sertifikat tidak ditandatangani dengan PKI dan PDF lama yang sudah diunduh tidak dapat ditarik dari perangkat pengguna. Status di URL verifikasi adalah acuan validitas terkini.

## 15. Arsitektur

```text
Browser
  React + Router + AuthProvider + LocaleProvider
            │ fetch JSON / cookie HttpOnly
            ▼
Express API
  origin / rate limit / validasi / sesi / role
            │
            ├── Workspace service → SQLite + migrasi + transaksi
            │       ├── assignment / asesmen / attempt
            │       ├── ledger / laporan / sertifikat
            │       └── notifikasi / audit / job pengiriman
            │
            ├── Durable job processor → SMTP (jika dikonfigurasi)
            ├── OIDC adapter → IdP HTTPS (jika dikonfigurasi)
            └── PDFKit / CSV → file unduhan
```

Frontend bukan sumber kebenaran nilai atau completion. Server menentukan organisasi dari sesi, memvalidasi role, memeriksa ownership resource, serta menyimpan transaksi. Browser hanya mempertahankan state presentasi, input belum disimpan, dan preferensi bahasa.

Database aktif adalah SQLite. Worker dipanggil dalam proses API, memakai antrean durable di database; bukan layanan worker mandiri atau Redis queue. Runtime saat ini ditujukan untuk satu instance dengan storage lokal persisten.

API lama dimatikan default dengan HTTP 410. Kode legacy tetap ada untuk peninjauan migrasi dan compatibility test, tetapi tidak dipakai oleh route utama workspace baru. Tidak ada migrasi otomatis yang menganggap angka demo sebagai bukti individual.

## 16. Technology stack

Versi berikut dibaca dari `package-lock.json` pada pembaruan dokumen, bukan klaim versi terbaru di internet.

| Lapisan | Teknologi | Versi / fungsi |
| --- | --- | --- |
| Runtime | Node.js | Pengujian lokal 22.22.2; gunakan versi kompatibel dependency |
| UI | React / React DOM | 19.2.8 |
| Routing | React Router DOM | 7.18.3 |
| Bahasa frontend | TypeScript | 7.0.2 |
| Build | Vite | 8.2.2 |
| API | Express | 5.2.1 |
| Database | SQLite via better-sqlite3 | Driver 13.0.3 |
| Validasi | Zod | 4.5.4 |
| Password | bcryptjs | Hash password |
| Cookie / header | cookie-parser, Helmet | Sesi dan hardening header |
| Rate limit | express-rate-limit | Login, reset, MFA, endpoint publik |
| Email | Nodemailer | Pengiriman SMTP |
| CSV | csv-parse | Impor CSV |
| PDF | PDFKit | 0.20.2 |
| SSO | openid-client | 6.8.8 |
| Ikon | lucide-react | Ikon UI konsisten |
| Styling | CSS native | Token dalam design-system.css |
| Backend test | node:test, assert | Integrasi HTTP / database |
| Browser test | Playwright | 1.63.0 |
| Aksesibilitas otomatis | axe-core/playwright | 4.13.0 |
| Formatter | Prettier | Konsistensi source |

Dependency legacy seperti Recharts masih berada dalam package; keberadaan dependency bukan berarti semua route baru memakainya. Lockfile menjadi acuan instalasi reproducible dengan `npm ci`. Hindari mengandalkan rentang `latest` di manifest tanpa lockfile.

`better-sqlite3` memerlukan Node >=22 dan Vite memerlukan Node ^20.19 atau >=22.12. Untuk kombinasi aplikasi ini, gunakan Node >=22.12 dalam jalur runtime yang sudah diuji, bukan Node 18/20.

## 17. Struktur repository

```text
src/
  main.tsx                 Entry, provider, stylesheet aktif
  App.tsx                  Route, login, reset, proteksi akses
  auth.tsx                 Identitas sesi frontend
  api.ts                   Request, ApiError, download
  ui.tsx                   Komponen bersama, bahasa, shell
  design-system.css        Token dan semua styling workspace aktif
  WorkspacePages.tsx       Overview, people, campaign, awareness, report
  LearningPages.tsx        Library, builder, belajar, kuis, sertifikat
  ControlPages.tsx         Phishing, account, settings, integrasi, public
  ErrorBoundary.tsx        Fallback kesalahan render
  ...                      Source lama dipertahankan, tidak semua aktif
server/
  index.mjs                Express, auth, static hosting, scheduler tick
  db.mjs                   Koneksi SQLite, bootstrap, audit, schema lama
  migrations.mjs           Migrasi additive workspace
  workspace.mjs            Domain service dan API workspace
  identity.mjs             TOTP, enkripsi secret, anti-replay
  sso.mjs                  OIDC authorization code + PKCE
  workspace.test.mjs       Pengujian model dan alur workspace
  security.test.mjs        Regression compatibility / security legacy
  platform.mjs             Implementasi platform legacy
  product-actions.mjs      Mutasi state legacy
tests/product.spec.ts      Browser acceptance + axe
playwright.config.ts       Server / database terisolasi untuk E2E
.env.example               Konfigurasi tanpa secret nyata
DOKUMENTASI_LENGKAP.md      Panduan implementasi aktif
PRODUCT_MATURITY.md         Penerimaan dan pekerjaan tersisa
docs/DOKUMENTASI_LEGACY.md  Arsip implementasi sebelum redesign
```

`src/main.tsx` hanya memuat design system aktif. Provider state demo dan mekanisme terjemahan dengan mutasi DOM lama tidak dipasang dalam aplikasi aktif.

## 18. Model data dan migrasi

### 17.1 Entitas

| Tabel | Tanggung jawab |
| --- | --- |
| organizations | Identitas tenant |
| users | Identitas, role, departemen, password hash, active |
| sessions | Hash token, expiry, metadata sesi |
| audit_logs | Aktor, aksi, entitas, outcome, metadata |
| programs | Kampanye, status, owner, jadwal, version |
| program_audience | Snapshot pilihan peserta |
| program_courses | Referensi revision yang dipilih |
| course_revisions | Dokumen materi per revisi |
| learning_assignments | Tugas individual dan progres lesson |
| learning_attempts | Snapshot soal, jawaban, score, pass, retry |
| program_assessments | Baseline / follow-up individual |
| assessment_responses | Jawaban asesmen dan hasil final |
| score_events | Ledger perubahan komponen |
| score_event_invalidations | Penonaktifan / pemulihan bukti setelah koreksi |
| employee_groups | Nama kelompok dalam tenant |
| employee_group_members | Keanggotaan user pada kelompok |
| user_notifications | Notifikasi personal, link, read_at, dedupe |
| delivery_jobs | Antrean pengiriman durable dan retry |
| simulation_targets | Target, hash token, sent_at, expiry |
| safe_simulation_events | Open / click / report dengan pseudonim IP |
| phishing_reports | Submission dan investigasi |
| certificate_records | Bukti kelulusan dan validitas |
| identity_tokens | Hash token undangan / reset sekali pakai |
| identity_policy | Forced password, secret MFA terenkripsi, replay step |
| tenant_settings | Locale, timezone, reminders, retention |
| worker_health | Waktu siklus worker dan error terakhir |
| sso_flows | State hash, verifier terenkripsi, nonce, expiry |
| oidc_identities | Mapping issuer + subject ke user lokal |
| schema_migrations | Versi migrasi yang telah diterapkan |

### 17.2 Relasi penting

```text
Organization
 ├── Users ── Groups / Sessions / Identity policy
 ├── Programs
 │    ├── Audience ── Users
 │    ├── Courses ── Course revisions
 │    ├── Assignments ── Attempts ── Certificate
 │    ├── Assessments ── Responses
 │    └── Simulation targets ── Events
 ├── Score events ── Invalidations
 ├── Phishing reports
 └── Notifications / Delivery jobs / Audit
```

### 17.3 Constraint

- Assignment unik pada program + user + revision.
- Assessment unik pada program + user + kind.
- Attempt number unik per assignment.
- Score source unik per tenant + user + component + source.
- Report fingerprint unik per tenant + reporter.
- Certificate satu per assignment.
- Simulation event unik per target + event.
- Group name unik dalam organisasi.
- Identity issuer + subject tidak dapat dipetakan ke dua user.

### 17.4 Migrasi

Migrasi dijalankan saat registrasi workspace setelah inisialisasi database. Setiap migration dibungkus transaksi dan dicatat di `schema_migrations`.

1. Versi 1: tabel domain workspace, identitas, notifikasi, job, settings.
2. Versi 2: jawaban asesmen dan kelompok karyawan.
3. Versi 3: flow SSO dan mapping identitas OIDC.
4. Versi 4: invalidasi bukti skor akibat koreksi klasifikasi.

Tabel / state lama tidak dihapus. Konten awal dapat diterbitkan sebagai revision dari library lama; completion atau nilai demo tidak diimpor sebagai pencapaian individu. Migrasi balik otomatis belum disediakan. Backup sebelum upgrade wajib untuk lingkungan yang berisi data nyata.

## 19. Kontrak API

### 18.1 Konvensi

Endpoint workspace memakai prefix `/api/workspace`. Respons biasa berupa JSON; export menghasilkan stream CSV / PDF. Request mutasi menggunakan `Content-Type: application/json`. Cookie sesi dibawa browser dengan credentials include.

```json
{
  "error": {
    "code": "VALIDATION_ERROR",
    "message": "Periksa kembali data yang dikirim.",
    "fields": { "name": "Pesan validasi" }
  }
}
```

`fields` opsional. Kesalahan diinterpretasi frontend berdasarkan code agar pesan utama dapat dilokalkan. Kode umum: 400 input tidak valid, 401 sesi / kredensial, 403 role / origin, 404 resource tidak dapat diakses, 409 konflik lifecycle / version, 410 API lama, 429 rate limit, 503 integrasi belum dikonfigurasi.

Tidak ada parameter `organization_id` yang dapat dipakai memilih tenant. Scope berasal dari sesi. Resource tenant lain umumnya diperlakukan tidak ditemukan. Query tidak dikenal pada skema strict ditolak.

### 18.2 Identitas dan endpoint publik

| Method | Path | Fungsi |
| --- | --- | --- |
| GET | `/api/health` | Liveness sederhana, tanpa path database |
| POST | `/api/auth/login` | Email, password, rememberMe, otp opsional |
| GET | `/api/auth/me` | Identitas sesi, forced password, preferensi tenant |
| POST | `/api/auth/logout` | Hapus sesi saat ini |
| POST | `/api/auth/change-password` | Password saat ini dan password baru |
| POST | `/api/auth/forgot-password` | Permintaan reset dengan respons generik |
| POST | `/api/auth/reset-password` | Token, password baru, otp bila dibutuhkan |
| GET | `/api/auth/options` | Status konfigurasi SSO |
| GET | `/api/auth/sso/start` | Redirect ke issuer yang dikonfigurasi |
| GET | `/api/auth/sso/callback` | Verifikasi flow dan identitas OIDC |
| GET | `/api/public/verify/:id` | Validitas sertifikat dengan data minimal |
| POST | `/api/public/exercise/:token` | Event simulasi aman |

### 18.3 Endpoint workspace

Path pada tabel berikut ditambahkan ke `/api/workspace`.

| Method | Path | Fungsi |
| --- | --- | --- |
| GET | `/summary` | Metrik, cohort, distribusi, topik, metodologi |
| GET | `/people` | Direktori sesuai role |
| GET | `/people/:id` | Profil dan bukti individual |
| POST | `/people` | Tambah akun / undangan |
| PATCH | `/people/:id` | Nama, departemen, role, active |
| POST | `/people/:id/reset` | Kirim reset |
| POST | `/people/import` | Impor string CSV |
| GET / POST | `/groups` | Daftar / simpan kelompok; `id` opsional untuk edit |
| GET | `/me` | Bukti dan tugas personal |
| GET | `/notifications` | Maksimal 30 notifikasi terbaru sendiri |
| POST | `/notifications/:id/read` | Tandai notifikasi sendiri dibaca |
| GET | `/courses` | Revisi terbaru per course |
| GET | `/courses/:id` | Revision dan daftar versi |
| POST | `/courses` | Simpan revision baru |
| POST | `/courses/:id/archive` | Arsip course beserta revisinya |
| GET / POST | `/campaigns` | Daftar / buat draft |
| GET / PUT | `/campaigns/:id` | Detail / edit draft atau scheduled |
| POST | `/campaigns/:id/action` | launch, draft, cancel, end, archive, remind |
| GET | `/learning/:id` | Dokumen assignment employee |
| POST | `/learning/:id/progress` | Simpan lessonIndex bertahap |
| POST | `/learning/:id/quiz` | Buat / lanjutkan attempt |
| POST | `/learning/:id/quiz/:attemptId` | Submit jawaban |
| GET | `/learning/:id/result` | Hasil attempt yang selesai |
| GET / POST | `/assessments/:id` | Soal / submit asesmen |
| GET / POST | `/phishing` | Daftar sesuai akses / laporan employee |
| PATCH | `/phishing/:id` | Status, classification, notes |
| GET | `/certificates` | Daftar sesuai akses |
| GET | `/certificates/:id/pdf` | Download PDF sertifikat valid |
| POST | `/certificates/:id/revoke` | Cabut dengan reason |
| POST | `/certificates/:id/reissue` | Pulihkan validitas |
| GET | `/exports/:format` | `csv` atau `pdf`, filter dan category |
| GET / PUT | `/settings` | Baca / simpan pengaturan |
| GET | `/sessions` | Sesi aktif sendiri dan status MFA |
| DELETE | `/sessions/:id` | Cabut sesi lain milik sendiri |
| POST | `/mfa/setup` | Password untuk membuat secret terenkripsi |
| POST | `/mfa/confirm` | OTP untuk mengaktifkan |
| POST | `/mfa/disable` | Password dan OTP untuk menonaktifkan |
| POST | `/jobs/:id/retry` | Ulangi job Failed dalam tenant |
| GET | `/audit` | Filter aktor, aksi, outcome, tanggal, halaman |

### 18.4 Contoh payload

Pembuatan kampanye; ID harus berasal dari resource tenant yang benar:

```json
{
  "name": "Finance Phishing Refresher",
  "objective": "Memperbaiki pengenalan pesan mencurigakan",
  "ownerId": "<user-admin-id>",
  "userIds": ["<employee-id>"],
  "courseIds": ["<published-revision-id>"],
  "startAt": null,
  "dueAt": "2026-10-01T09:00:00.000Z",
  "baseline": true,
  "followup": true,
  "simulation": null,
  "reminders": true
}
```

Contoh deadline hanya ilustrasi, ganti dengan waktu mendatang. Edit menambahkan `version`. Launch:

```json
{ "action": "launch", "version": 1 }
```

Submit kuis menggunakan indeks opsi mulai nol:

```json
{ "answers": [[1], [0, 2], [0]] }
```

Frontend tidak mengirim score, passed, nama penerima sertifikat, atau role untuk menentukan hasil.

CSV onboarding:

```csv
email,name,department,role
employee@example.com,Nama Karyawan,Finance,employee
manager@example.com,Nama Manager,Finance,manager
```

Request import adalah `{ "csv": "..." }`. Maksimal 5.000 baris, string 2.000.000 karakter, dan body JSON global 3 MB. Import hanya menerima employee / manager; akun admin dibuat terpisah oleh Super Admin. Baris valid dapat disimpan walaupun baris lain ditolak. Respons memuat `created` dan `errors`; bukan all-or-nothing untuk kesalahan validasi per baris.

### 18.5 API legacy

`/api/product-state`, `/api/product-actions`, `/api/admin`, `/api/quiz`, `/api/audit-logs`, serta endpoint publik sertifikat / simulasi lama dinonaktifkan default. `LEGACY_API_ENABLED=true` hanya untuk review migrasi terkontrol. Mengaktifkannya membuka model perilaku lama yang tidak menjadi sumber kebenaran workspace.

## 20. Identitas dan akses

### 19.1 Password dan sesi

Password dihash bcrypt. Login tidak mengirim password hash ke frontend. Session token acak disimpan dalam cookie HttpOnly; database menyimpan keyed hash token, bukan token mentah.

Durasi sesi: 12 jam normal, 30 hari untuk Remember me. Cookie SameSite Strict dan Secure pada mode produksi. `/auth/me` memuat role serta organisasi dari server. Perubahan password mencabut sesi lain; reset mencabut seluruh sesi user.

Password baru melalui reset / temporary / change-password memerlukan 12–128 karakter dengan huruf kecil, huruf besar, angka, dan simbol. Persyaratan ini bukan pengganti penyimpanan password aman atau proteksi perangkat.

### 19.2 Undangan dan forced change

Jika tidak diberikan temporaryPassword, sistem membuat password acak yang tidak ditampilkan lalu mengantrekan tautan undangan. Invitation berlaku 48 jam. Reset biasa berlaku satu jam. Token disimpan dalam bentuk hash dan hanya dapat digunakan sekali.

Temporary password yang ditetapkan admin membuat `must_change=1`. Setelah login, akses workspace diblokir sampai password diganti. Endpoint me, logout, dan change-password tetap tersedia untuk menyelesaikan alur.

Token undangan / reset berada pada URL fragment agar tidak ikut dikirim sebagai path / query HTTP saat halaman dibuka. Payload email pending tetap mengandung tautan tersebut: lindungi database dan backup.

### 19.3 MFA TOTP

MFA menggunakan kode 6 digit per interval 30 detik dengan toleransi satu interval sebelum / sesudah. Kode pada timestep yang telah digunakan tidak dapat dipakai ulang. Secret dienkripsi AES-256-GCM menggunakan kunci turunan SESSION_SECRET sebelum disimpan.

Setup memerlukan current password. Aktivasi memerlukan OTP valid dan mencabut sesi lain. Penonaktifan memerlukan current password serta OTP baru. UI menyediakan secret untuk dimasukkan ke authenticator; belum ada QR provisioning maupun kumpulan recovery code sekali pakai.

Simpan seed pemulihan di tempat yang disetujui organisasi. Mengganti SESSION_SECRET tanpa prosedur migrasi membuat seed terenkripsi lama tidak dapat dibaca. Recovery MFA administratif belum menjadi alur produk lengkap.

### 19.4 OIDC SSO

Adapter memakai authorization code flow, PKCE S256, state, nonce, validasi ID token melalui openid-client, serta pemeriksaan tanda tangan JWKS. Issuer dan public app URL harus HTTPS. Satu deployment memiliki satu issuer dan satu organisasi SSO eksplisit.

Flow berlaku 10 menit, state dicocokkan dengan cookie HttpOnly SameSite Lax, hash state tersimpan server, dan flow dikonsumsi sekali. Verifier dienkripsi di database. Redirect callback berasal dari konfigurasi, bukan Host atau input pengguna.

Identitas harus memberikan `sub`, email, dan `email_verified=true`. Akun lokal harus sudah ada dan aktif dalam `OIDC_ORG_SLUG`. Pada sign-in pertama, email terverifikasi dari issuer tepercaya dapat ditautkan ke akun lokal; sesudah itu mapping issuer + subject dipakai. Tidak ada auto-provisioning akun atau promosi role dari claim.

Jika akun lokal memakai MFA, token IdP harus memiliki `amr` berisi `mfa`; jika tidak, SSO ditolak dan pengguna dapat memakai password + TOTP. Provider yang tidak mengeluarkan claim email_verified atau amr yang sesuai belum kompatibel tanpa pengembangan adapter / kebijakan tambahan.

```dotenv
PUBLIC_APP_URL=https://awareness.example.com
OIDC_ISSUER=https://identity.example.com
OIDC_CLIENT_ID=<registered-client>
OIDC_CLIENT_SECRET=<secret-in-server-secret-store>
OIDC_ORG_SLUG=<existing-organization-slug>
```

Daftarkan redirect URI persis `https://awareness.example.com/api/auth/sso/callback` pada IdP. Jangan memasukkan secret ke frontend. Konfigurasi harus diuji pada IdP organisasi; pengujian lokal belum membuktikan login produksi, logout federasi, atau kompatibilitas provider tertentu.

## 21. Keamanan dan privasi

### Kontrol aktif

- Tenant scope dari sesi dan ownership resource pada layanan backend.
- Role guard pada endpoint, bukan hanya UI.
- Zod strict validation dan prepared SQL statements.
- Origin check pada mutasi; cookie SameSite sebagai lapisan browser.
- Rate limit pada login, reset, MFA, dan endpoint publik.
- Helmet dan CSP pada production; aplikasi tidak membutuhkan script eksternal.
- Hash password, hash session token, hash identity token, seed MFA terenkripsi.
- Pertanyaan employee disaring agar tidak mengirim kunci sebelum submit.
- Server grading, snapshot revisi, anti-submit ulang, unique evidence source.
- Simulasi tanpa field pengumpulan kredensial dan pseudonim IP event.
- Audit untuk tindakan penting, kegagalan login, dan penolakan otorisasi.
- CSV escaping untuk mengurangi formula injection saat dibuka di spreadsheet.
- Verifikasi sertifikat publik meminimalkan data pribadi.

### Yang tetap perlu dipahami

Rate-limit store masih memory proses; bukan limiter bersama lintas node. Audit tersimpan di database yang sama dan belum berupa immutable external audit sink. Request tanpa header Origin tidak otomatis ditolak; desain mengandalkan pembatasan cookie browser, JSON validation, serta origin ketika tersedia, bukan CSRF token khusus.

Metadata IP / user-agent pada sesi dan audit dapat mengandung data pribadi. Hash IP simulasi adalah pseudonimisasi, bukan jaminan anonimitas. Pengelola database dan backup dapat mengakses payload email pending yang berisi token tautan. Enkripsi seluruh database / backup dan pengelolaan secret berada pada operator deployment.

### Retensi

Setting `retentionDays` menerima 30–3.650 hari, default 365. Retensi otomatis aktif menghapus metadata job Sent dan notifikasi yang sudah dibaca melewati batas, pada tenant yang memiliki row settings tersimpan.

Setting ini tidak menghapus seluruh profil, hasil belajar, audit, sertifikat, laporan phishing, atau semua token lama. Jangan menyebutnya kebijakan penghapusan data universal. Kebutuhan erasure, legal hold, atau expiry evidence harus dirancang terpisah.

Menggunakan data individual untuk keputusan personal yang berdampak membutuhkan review tata kelola organisasi; skor awareness tidak dirancang sebagai penilaian kelayakan kerja atau ukuran karakter seseorang.

## 22. Notifikasi dan automation

### 21.1 In-app

Notifikasi melekat pada user dan tenant. Header menyediakan daftar, link tindakan, serta tandai dibaca. Sumber antara lain assignment baru, follow-up, sertifikat, laporan phishing, pengingat, dan lifecycle kampanye. Dedupe key menghindari notifikasi identik berulang.

Daftar memuat 30 item terbaru. Tidak ada WebSocket atau push notification mobile. Feed diperbarui ketika dimuat / dibuka, bukan jaminan realtime.

### 21.2 Durable delivery

```text
Transaksi domain → job Pending dalam SQLite
                           │
                      processor tick
                           │
                    lease + Sending
                           │
                    SMTP send attempt
                   ┌───────┴────────┐
                  Sent            Failed
            payload dibersihkan    backoff / retry
```

Worker berjalan saat startup dan tiap 60 detik. Maksimal 25 job diproses per siklus; lease lima menit memungkinkan pekerjaan direbut kembali setelah worker terhenti. Maksimal lima percobaan otomatis; kegagalan dijadwalkan ulang dengan exponential backoff. Admin dapat retry job Failed dari health settings.

SMTP kosong berarti job tetap Pending, tidak diklaim terkirim. Setelah sukses, payload dikosongkan dan `sent_at` target simulasi diperbarui. Simulasi yang programnya tidak lagi aktif atau sudah expired dibatalkan sebelum dikirim.

Semantik email adalah at-least-once: crash setelah SMTP menerima email tetapi sebelum commit Sent dapat menghasilkan pengiriman ulang. Message-ID stabil membantu pelacakan, bukan jaminan deduplikasi seluruh provider.

### 21.3 Jadwal dan reminder

Worker mengaktifkan Scheduled saat waktunya tiba, menutup Active saat deadline, dan menambahkan reminder menjelang tenggat bila kebijakan kampanye serta tenant mengizinkan. Reminder manual dideduplikasi per program, user, dan tanggal UTC.

Reminder otomatis memeriksa tugas belum selesai dalam tiga hari sebelum due pada program aktif. Karena program ditutup saat deadline, jangan mengasumsikan reminder overdue terus dikirim setelah program berakhir. Reminder generik / identity yang sudah ada di antrean belum memiliki pembatalan menyeluruh berdasarkan perubahan lifecycle.

`worker_health` memberikan waktu siklus dan error terakhir. Liveness `/api/health` hanya berarti API hidup, bukan SMTP / IdP / worker berhasil.

## 23. Integrasi

| Integrasi | Status implementasi |
| --- | --- |
| SMTP | Adapter pengiriman aktif; membutuhkan konfigurasi dan uji deliverability |
| OIDC SSO | Adapter aktif opsional; belum diverifikasi dengan IdP organisasi |
| Microsoft Entra directory | Belum tersedia sebagai sinkronisasi direktori |
| Microsoft 365 | Belum tersedia sebagai konektor khusus |
| Google Workspace | Belum tersedia sebagai konektor lifecycle |
| SCIM | Belum tersedia |
| Microsoft Teams | Belum tersedia |
| SIEM / Webhook | Belum tersedia |

UI menggunakan status sesuai kenyataan. “Configured” berarti konfigurasi tersedia, bukan bukti koneksi sehat. OIDC tidak otomatis membuat Entra, Google, atau SCIM tersambung. Tidak ada izin external account yang diminta hanya dengan membuka halaman Integrations.

## 24. Design system dan aksesibilitas

### Visual

Satu stylesheet aktif: `src/design-system.css`. Surface putih / off-white, teks abu netral, merah untuk brand dan aksi utama. Tidak menggunakan gradient ungu, glassmorphism, atau dekorasi keamanan yang tidak membantu tugas.

| Token | Nilai |
| --- | --- |
| Brand | `#b72b30` |
| Hover brand | `#982227` |
| Teks utama | `#25272b` |
| Teks sekunder | `#626772` |
| Border | `#e8e9ec` |
| Surface | `#ffffff` |
| Background subtle | `#f6f7f9` |
| Spacing | 4, 8, 12, 16, 24, 32, 48 px |
| Radius dasar | 7 px |
| Sidebar desktop | 224 px |

Font stack menggunakan Inter bila tersedia di perangkat, lalu system sans-serif; tidak ada unduhan font pihak ketiga yang wajib. Komponen bersama mencakup Button, Field, Dialog, Loading, ErrorNotice, Empty, Status, Tabs, Metric, Download, ConfirmButton, dan Shell.

### Responsif dan aksesibilitas

Desktop memakai sidebar; viewport sempit memakai navigasi drawer. Tabel memberi horizontal scrolling atau menyembunyikan kolom sekunder. Player dan form menyesuaikan lebar. Skip link, focus style, label input, deskripsi hint terpisah, tombol semantik, dialog native, dan status feedback tersedia.

Pengujian axe otomatis mencakup WCAG 2 / 2.1 / 2.2 AA pada halaman yang diuji. Ini bukan audit aksesibilitas menyeluruh atau sertifikasi WCAG. Perlu pengujian screen reader, keyboard seluruh flow, zoom, dan kombinasi browser / perangkat tambahan.

### Bahasa

Teks UI aktif menggunakan pasangan ID / EN dalam komponen React, bukan mengganti DOM secara manual. Preferensi lokal mengalahkan default tenant. Dokumen HTML mengikuti locale. Tanggal diformat dengan locale dan zona waktu organisasi.

Nama kursus, isi materi, alasan audit yang disimpan, dan beberapa judul notifikasi adalah data tersimpan, bukan terjemahan otomatis. Label ekspor PDF / CSV masih Inggris. Jangan menyebut seluruh output aplikasi sudah bilingual tanpa pengecualian.

## 25. Instalasi dan konfigurasi

### 24.1 Prasyarat

- Node.js 22.12 atau lebih baru yang kompatibel; pengujian lokal menggunakan 22.22.2.
- npm dan akses dependency registry untuk instalasi pertama.
- Direktori data yang dapat ditulis proses API.
- Native toolchain bila binary better-sqlite3 tidak tersedia untuk platform.
- SMTP hanya jika email akan dikirim.
- Chromium Playwright untuk menjalankan tes browser.

### 24.2 Menjalankan development

Di root repository:

```bash
cp .env.example .env
npm ci
npm run dev
```

Sebelum menjalankan, isi SESSION_SECRET yang kuat dan unik serta password bootstrap. `.env` tidak boleh dimasukkan ke version control. `npm run dev` menjalankan API dan Vite bersama.

| Layanan | Default |
| --- | --- |
| Web development | `http://localhost:4173` |
| API | `http://localhost:3001` |
| Health | `http://localhost:3001/api/health` |
| Database | `.data/averis.sqlite` |

Pada database baru, bootstrap membuat organisasi dan empat akun role awal. Password yang tidak diberikan akan dibuat acak dan dicetak sekali pada log bootstrap. Perlakukan log pertama sebagai data sensitif. Mengubah environment bootstrap setelah akun sudah ada tidak mengganti password akun lama.

Materi awal adalah seed konten yang perlu ditinjau sebelum penggunaan organisasi. Label Published pada seed tidak berarti materi telah mendapat persetujuan editorial organisasi.

### 24.3 Environment

| Variabel | Arti / catatan |
| --- | --- |
| NODE_ENV | `production` mengaktifkan Secure cookie, CSP, static build |
| PORT | Port API, default 3001 |
| HOST | Bind address; default loopback saat development |
| DATABASE_PATH | Lokasi SQLite; gunakan volume persisten |
| SESSION_SECRET | Minimal 32 karakter pada production; juga melindungi token / seed |
| ALLOWED_ORIGINS | Daftar origin tambahan dipisahkan koma |
| TRUST_PROXY | `true` hanya untuk satu reverse proxy yang tepercaya |
| PUBLIC_APP_URL | URL absolut untuk tautan email, verifikasi, simulasi, SSO |
| BOOTSTRAP_ORG_NAME | Nama tenant awal |
| BOOTSTRAP_ORG_SLUG | Slug tenant awal |
| BOOTSTRAP_SUPER_ADMIN_EMAIL / PASSWORD | Kredensial awal pemilik |
| BOOTSTRAP_ADMIN_EMAIL / PASSWORD | Kredensial awal admin |
| BOOTSTRAP_MANAGER_EMAIL / PASSWORD | Kredensial awal manager |
| BOOTSTRAP_EMPLOYEE_EMAIL / PASSWORD | Kredensial awal employee |
| SMTP_HOST | Kosong: tidak mengirim email |
| SMTP_PORT | Default 587 |
| SMTP_SECURE | `true` untuk transport TLS langsung sesuai provider |
| SMTP_USER / SMTP_PASS | Autentikasi SMTP jika dibutuhkan |
| SMTP_FROM | Identitas pengirim yang disetujui provider |
| OIDC_ISSUER | Issuer HTTPS tepercaya |
| OIDC_CLIENT_ID / OIDC_CLIENT_SECRET | Klien OIDC server-side |
| OIDC_ORG_SLUG | Tenant lokal yang dapat memakai SSO |
| LEGACY_API_ENABLED | Default false; jangan aktifkan untuk operasi workspace normal |
| SERVE_STATIC | Opsi server untuk tes build dengan mode development |

PUBLIC_APP_URL production harus HTTPS. Jangan menggunakan origin wildcard atau mengarahkan callback / tautan ke domain yang tidak dikuasai organisasi. `SMTP_SECURE=false` bukan instruksi menonaktifkan seluruh TLS; pilih konfigurasi STARTTLS atau TLS langsung sesuai provider dan uji hasilnya.

### 24.4 Skrip proyek

| Perintah | Kegunaan |
| --- | --- |
| `npm run dev` | API + frontend development |
| `npm run dev:api` | API dengan watch |
| `npm run dev:web` | Vite |
| `npm run build` | Type-check dan build frontend |
| `npm start` | API production yang menyajikan dist |
| `npm run preview` | Preview asset Vite; bukan pengganti backend |
| `npm run check:server` | Pemeriksaan sintaks modul backend |
| `npm test` | Tes workspace dan compatibility security |
| `npm run test:e2e` | Build dan browser acceptance |
| `npm run format:check` | Konsistensi format file workspace |

## 26. Deployment dan operasional

### 25.1 Topologi yang didukung saat ini

Satu proses API di belakang reverse proxy HTTPS, satu database SQLite lokal pada volume persisten. Reverse proxy meneruskan request API dan asset static ke server aplikasi. Firewall membatasi akses langsung port API.

```bash
npm ci
npm run check:server
npm test
npm run build
npm start
```

Perintah ini mengasumsikan environment production sudah disiapkan, bukan membuat deployment publik otomatis. Login production membutuhkan HTTPS karena Secure cookie. Preview Vite sendiri tidak menjalankan layanan domain.

Tidak ada deployment, perubahan DNS, koneksi SMTP, atau koneksi IdP organisasi yang dilakukan sebagai bagian pengujian lokal ini.

### 25.2 Checklist sebelum pilot organisasi

- Ganti seluruh secret dan password bootstrap dengan nilai unik.
- Pastikan TLS, trusted proxy, origin, dan callback menggunakan domain benar.
- Lindungi direktori data, log bootstrap, log operasional, serta backup.
- Nonaktifkan LEGACY_API_ENABLED.
- Tinjau seed materi dan soal; terbitkan materi yang disetujui.
- Verifikasi account / role pengguna dengan populasi kecil.
- Uji isolation tenant dan employee pada deployment sebenarnya.
- Uji undangan, reset, reminder, retry, serta deliverability SMTP.
- Jika memakai SSO, uji signature, nonce/state, account mismatch, MFA claim, dan deactivation.
- Siapkan prosedur recovery MFA dan rotasi SESSION_SECRET sebelum mengaktifkan secara luas.
- Jalankan backup dan restore rehearsal.
- Sepakati batas retensi serta siapa yang boleh mengakses skor individual.
- Lakukan manual accessibility review dan uji browser organisasi.

### 25.3 Backup dan restore

Gunakan fasilitas backup SQLite yang konsisten atau hentikan proses sebelum mengambil salinan file beserta keadaan WAL yang diperlukan. Jangan menganggap menyalin file utama saat writer aktif selalu menghasilkan backup lengkap.

Backup harus mencakup database, konfigurasi relevan, dan mekanisme pemulihan secret dalam penyimpanan terpisah yang terkendali. Tanpa secret lama, seed MFA terenkripsi serta beberapa hash token tidak dapat digunakan seperti sebelumnya.

Restore dilakukan pada lingkungan terisolasi lebih dahulu: periksa integritas database, migration ledger, akun, assignment, hasil, sertifikat, dan audit. Matikan SMTP / SSO ketika menguji restore agar tidak mengirim ulang job atau berinteraksi dengan akun produksi.

Rollback aplikasi setelah migrasi membutuhkan backup yang kompatibel. Tidak ada `down migration` otomatis yang boleh diasumsikan tersedia.

### 25.4 Monitoring

Pantau process uptime, health HTTP, waktu tick worker, job Pending / Failed, kapasitas disk, latency API, rasio login gagal, dan error server. Audit adalah sumber penelusuran tindakan bisnis; bukan pengganti logs infrastruktur.

Observability saat ini belum mencakup OpenTelemetry, tracing lintas layanan, metrik Prometheus, error tracker terkelola, atau alerting produksi. Pengukuran tersebut perlu ditambahkan sebelum komitmen SLA.

### 25.5 Skalabilitas

SQLite dan query agregasi saat ini cocok untuk runtime lokal / single-node yang divalidasi sesuai beban organisasi. Direktori dan sebagian laporan memuat data untuk agregasi di proses; jangan menganggap telah diuji untuk puluhan ribu peserta bersamaan.

Untuk multi-instance, diperlukan adapter PostgreSQL, migrasi schema, pagination / aggregate query yang efisien, distributed rate limit, worker terpisah, observability, dan uji contention / recovery. Tidak cukup mengganti DATABASE_PATH menjadi connection string PostgreSQL.

## 27. Testing

### 26.1 Backend

```bash
npm run check:server
npm test
```

`server/workspace.test.mjs` menggunakan database sementara dan proses API tersendiri. Cakupannya meliputi:

- Sesi nyata, role, resource tenant lain, dan API lama yang retired.
- Workspace kosong tanpa nilai fabrikasi.
- Kelompok dengan member tenant lain ditolak.
- Campaign launch dan assignment terpisah per employee.
- Baseline gate, follow-up unlock, dan server grading.
- Revisi baru tidak mengganti assignment / kunci lama.
- Submit ulang tidak memberi bukti atau sertifikat tambahan.
- Denominator partisipasi, assignment completion, dan quiz pass rate.
- PDF sebenarnya, download permission, revocation, privacy verification.
- Phishing dedupe, klasifikasi, koreksi kredit, serta catatan internal.
- Simulasi idempotent, field kredensial ditolak, hash IP.
- Undangan, forced change, reset sekali pakai, dan pencabutan sesi.
- TOTP test vector, secret terenkripsi, replay prevention.
- Format ekspor dan larangan mengubah tenant dari query.
- Scheduled activation, retry delay, jawaban multiple, dan audiens tidak valid.

`server/security.test.mjs` mengaktifkan API legacy hanya dalam environment test untuk menjaga compatibility. Lulusnya tes legacy bukan alasan mengaktifkan API lama pada production.

### 26.2 Browser

```bash
npx playwright install chromium
npm run test:e2e
```

Playwright menjalankan build dengan server dan database terisolasi. SMTP dan issuer SSO dikosongkan. Data pengujian tidak dimasukkan ke database kerja pengguna.

Skenario browser mencakup pembuatan / launch kampanye, baseline, lesson, kuis, PDF sertifikat, laporan phishing, review admin, navigasi halaman, pergantian bahasa, viewport mobile 390×844, dan axe pada overview.

Screenshot disimpan di `test-results/`. Trace dipertahankan jika gagal. Keduanya diabaikan git karena artefak dapat mengandung data test atau data sesi jika suite diperluas.

### 26.3 Batas jaminan pengujian

Hasil lokal: 21 tes backend dan dua skenario browser telah lulus. Hasil final / perintah diverifikasi di PRODUCT_MATURITY.md. Tidak ada pengujian SMTP eksternal, IdP nyata, semua browser, volume besar, pen-test independen, atau audit WCAG penuh dalam hasil tersebut.

Tes tidak membuktikan keamanan absolut. Penambahan fitur perlu tes ownership, tenant, role, happy path, empty state, failure, retry, dan race / duplicate submission yang relevan.

## 28. Troubleshooting

| Gejala | Penyebab yang perlu diperiksa | Tindakan |
| --- | --- | --- |
| Login production kembali ke halaman masuk | HTTP biasa tidak menyimpan Secure cookie; proxy salah | Gunakan HTTPS dan trusted proxy yang sesuai |
| Password bootstrap baru tidak bekerja | Database sudah berisi akun lama | Gunakan reset; environment bootstrap bukan mekanisme ubah akun |
| Workspace kosong | Belum ada program / bukti individu baru | Buat kampanye dan jalankan peserta, jangan mengimpor skor demo |
| Nilai tampil `—` | Belum ada bukti / denominator nol | Periksa assignment, attempt, dan coverage |
| Tidak bisa belajar | Baseline belum selesai / program ditutup / ownership salah | Selesaikan baseline atau minta assignment aktif yang sesuai |
| Kuis belum tersedia | Lesson belum seluruhnya selesai | Lanjutkan progres lesson yang tersimpan |
| Retry ditolak | Waktu tunggu belum selesai / batas attempt habis | Tunggu atau siapkan intervensi baru |
| Edit campaign / konten gagal 409 | Versi lebih baru sudah disimpan | Muat ulang, bandingkan perubahan, simpan dari revisi terbaru |
| Undangan / reminder tidak masuk | SMTP kosong, job Pending / Failed, spam filter | Lihat Settings → health, konfigurasi provider, uji deliverability |
| Campaign terjadwal kembali Draft | Tidak ada audiens aktif saat waktu mulai | Perbaiki peserta dan jadwalkan kembali |
| MFA selalu ditolak | Clock drift, kode sudah dipakai, seed salah | Sinkronkan waktu; gunakan kode interval baru; lakukan recovery resmi |
| MFA rusak setelah rotasi secret | Secret lama diperlukan mendekripsi seed | Ikuti prosedur migrasi secret; jangan menghapus policy sembarangan |
| SSO gagal | Issuer / callback / email_verified / amr / tenant tidak cocok | Tinjau konfigurasi IdP; gunakan password + TOTP sebagai jalur lokal |
| Sertifikat tidak dapat diunduh | Revoked, milik orang lain, atau belum terbit | Periksa kelulusan dan status verifikasi |
| API lama 410 | Endpoint sengaja retired | Gunakan `/api/workspace`, bukan mengaktifkan legacy di produksi |
| Build gagal pada native database | Versi Node / ABI / platform tidak cocok | Gunakan runtime kompatibel dan instalasi dependency bersih terkontrol |
| SQLite terkunci / lambat | Banyak writer atau query besar | Batasi instance, ukur beban, rencanakan adapter produksi |

Saat meminta bantuan, berikan code error, endpoint, waktu, role, dan langkah reproduksi tanpa password, cookie, OTP, token reset, atau payload rahasia.

## 29. Batasan dan backlog

Implementasi ini merupakan fondasi produk yang lebih matang dan dapat diuji lokal, bukan klaim seluruh brief enterprise selesai. Backlog penting:

1. Uji SMTP, OIDC, recovery MFA, dan rotasi secret dengan konfigurasi organisasi.
2. SSO multi-tenant, federation logout, provider-specific claims, dan alur identity linking administratif.
3. Konektor Entra / Google / SCIM / Teams / webhook yang benar-benar sinkron.
4. PostgreSQL, worker terpisah, distributed limiter, pagination dan load testing.
5. Analisis cohort tetap, report layout khusus kategori, locale ekspor, dan historical as-of reporting.
6. Template phishing dengan konten / preview berbeda dan pembatalan antrean non-simulasi yang menyeluruh.
7. Media lesson, file storage aman, question bank lintas course, dan autosave jawaban kuis.
8. Tren multi-titik, analisis cohort tetap, serta badge invalidasi event pada histori.
9. Recovery codes MFA, QR setup, kebijakan session lifetime yang dapat dikonfigurasi.
10. Retensi evidence / audit / identity token, legal hold, ekspor data personal, dan penghapusan terkontrol.
11. Audit sink tahan perubahan, request correlation, metrics / tracing / alerting.
12. Pelokalan data operasional dan output yang masih berbahasa Inggris.
13. Uji keyboard / screen reader penuh, lintas browser, dan pen-test independen.

Penentuan production readiness harus mempertimbangkan populasi, threat model, regulasi yang berlaku, SLA, dan hasil uji deployment nyata. Dokumen ini bukan opini kepatuhan hukum.

## 30. Contoh penggunaan

### Program onboarding karyawan baru

HR mengimpor daftar employee, mengelompokkannya sebagai cohort onboarding, lalu Security memilih modul password, phishing, dan data handling. Kampanye diatur dua minggu dengan baseline dan follow-up. Peserta menyelesaikan tugas sendiri. Tim melihat siapa belum mulai, siapa belum lulus, serta perubahan setelah program.

### Refresher departemen

Awareness menunjukkan kategori phishing paling lemah berdasarkan attempt yang telah selesai. Admin memfilter departemen, memilih peserta, dan membuat refresher. Assignment baru mempertahankan revision baru tanpa mengubah bukti program sebelumnya. Laporan dievaluasi bersama coverage, bukan hanya rata-rata nilai.

### Pesan mencurigakan

Karyawan menerima email yang meminta password. Ia tidak memasukkan password atau membuka attachment, lalu mengisi laporan. Tim memeriksa pesan melalui prosedur investigasi organisasi di luar aplikasi jika diperlukan, mencatat hasil, dan mengklasifikasikannya. Jika kemudian diketahui aman, klasifikasi dapat dikoreksi dengan audit dan penyesuaian validitas kredit.

### Bukti tinjauan internal

GRC memilih campaign dan mengekspor Compliance Evidence. ID sertifikat digunakan untuk memeriksa validitas terkini. Reviewer menyimpan konteks periode, definisi completion, dan batas laporan. PDF / CSV tidak diperlakukan sebagai pengganti audit trail atau bukti PKI.

## 31. Glosarium dan referensi

| Istilah | Arti |
| --- | --- |
| Tenant | Batas organisasi untuk data dan akses |
| Campaign / Program | Paket intervensi berisi audiens, konten, jadwal, pengukuran |
| Revision | Snapshot versi konten yang menjadi referensi assignment |
| Assignment | Tugas satu employee pada satu revision dalam program |
| Attempt | Satu percobaan kuis beserta snapshot soal dan hasil |
| Baseline | Pengukuran sebelum pembelajaran |
| Follow-up | Pengukuran sesudah pembelajaran |
| Ledger | Riwayat event yang menjelaskan perubahan skor |
| Coverage | Kelengkapan peserta atau bobot bukti yang telah terukur |
| Dedupe | Pencegahan pencatatan / pekerjaan identik berulang |
| Lease | Klaim sementara worker atas job yang sedang dikerjakan |
| Backoff | Waktu tunggu yang meningkat sebelum mencoba kembali |
| OIDC | Protokol identitas OpenID Connect |
| PKCE | Pengikat authorization code dengan verifier per flow |
| TOTP | Kode autentikasi berdasarkan secret dan waktu |
| RBAC | Kontrol akses berdasarkan role |
| Snapshot | Salinan data pada saat keputusan / penugasan dibuat |
| As-of | Rekonstruksi keadaan pada waktu historis tertentu |

Sumber implementasi utama: [workspace service](server/workspace.mjs), [migration schema](server/migrations.mjs), [identity](server/identity.mjs), [SSO](server/sso.mjs), [frontend routes](src/App.tsx), [tests](server/workspace.test.mjs).

Referensi protokol yang dipakai untuk implementasi TOTP: [RFC 6238](https://www.rfc-editor.org/rfc/rfc6238). Alur authorization code / PKCE mengikuti API resmi [openid-client](https://github.com/panva/openid-client). Status fitur lokal tetap ditentukan source dan pengujian repository, bukan kelengkapan fitur library.
