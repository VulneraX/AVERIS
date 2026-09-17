# AVERIS — Product Maturity: Implementasi dan Penerimaan

Status per 13 September 2026. Panduan produk, alur, stack, API, operasi, serta batasan detail ada di [DOKUMENTASI_LENGKAP.md](DOKUMENTASI_LENGKAP.md).

## Hasil implementasi

Route utama telah menggunakan workspace baru dengan navigasi enam menu admin dan empat menu employee. Satu design system putih / merah / netral menggantikan styling bertumpuk pada pengalaman aktif. Player dan kuis menggunakan tampilan fokus. Bahasa ID / EN dikelola React state, bukan mutasi DOM.

Model data utama sudah dinormalisasi: program, audiens, revisi konten, assignment personal, asesmen, attempt, ledger skor, phishing report, sertifikat, notifikasi, dan delivery job. API lama dinonaktifkan default. Data legacy dipertahankan untuk review migrasi, tidak diubah menjadi skor atau completion individu palsu.

Public website kini memiliki ecosystem route terpisah dari workspace: platform,
product pages, solutions, interactive tour, self-service demo, request demo,
resource hubs, documentation, academy, security, integrations, support, dan
awareness maturity tool. Homepage diprerender; route publik lain dihidangkan
oleh SPA fallback. Demo memakai data fiktif dan tidak mengakses data tenant.
Detail route dan batas capability ada di [PUBLIC_WEBSITE.md](docs/PUBLIC_WEBSITE.md).

## Matriks penerimaan

| Area | Bukti yang tersedia | Status / batas |
| --- | --- | --- |
| Navigasi / design system | Halaman utama dan mobile diperiksa browser | Implemented; audit semua viewport belum dilakukan |
| Public website ecosystem | Route public, product frames, tour, demo, request demo, resources, docs, security | Implemented; content masih local typed data, bukan CMS |
| Onboarding pengguna | Invite, CSV, temporary password, edit, deactivate | Backend diuji; pengiriman undangan nyata membutuhkan SMTP |
| Kelompok | Tenant validation, dedupe member, pilihan audiens | Backend diuji; UI edit kelompok existing belum lengkap |
| Kampanye | Builder lima langkah, launch, lifecycle, optimistic version | Browser dan backend diuji |
| Schedule | Aktivasi sekali, fallback audiens tidak valid | Backend diuji dengan clock / jadwal terkontrol |
| Pembelajaran | Assignment individual, resume lesson, immutable revision | Browser dan backend diuji |
| Kuis | Server grading, snapshot, retry, multiple-response | Backend diuji; pilihan belum submit belum autosave |
| Asesmen | Baseline gate, follow-up gate, jawaban tersimpan | Backend diuji; baseline juga lewat browser |
| Skor | Coverage, latest valid evidence, invalidation / restoration | Backend diuji; belum model risiko tervalidasi empiris |
| Laporan | Denominator terpisah, tenant scope, CSV / PDF asli | Backend diuji; kategori export / locale belum sepenuhnya berbeda |
| Phishing report | Submit, dedupe, review, internal notes, koreksi kredit | Browser dan backend diuji |
| Simulasi | Token hash, safe events, dedupe, actual-delivery denominator | Backend diuji; template visual masih generik |
| Sertifikat | Issuance, PDF, revoke, restore, privacy verify | Browser dan backend diuji; tanpa PKI |
| Password / sesi | Forced change, reset sekali pakai, revoke | Backend diuji |
| MFA | TOTP, encrypted seed, timestep anti-replay | Backend diuji; recovery codes / QR belum ada |
| OIDC SSO | PKCE, state, nonce, signature, mapping lokal | Adapter implemented; belum diuji terhadap IdP nyata |
| Notifikasi | Personal feed, read state, dedupe | API tersedia dan tampil di browser; tanpa push realtime |
| Queue email | Durable SQLite, lease, retry, backoff, payload cleanup | Implemented; SMTP eksternal / crash-delivery belum diuji |
| Audit / health | Filter, pagination, worker status, failed jobs | Implemented; bukan immutable audit sink / full telemetry |
| Database | Empat migrasi additive dan transaksi | SQLite single-node; PostgreSQL belum ada |
| Integrasi eksternal lain | Status unavailable secara eksplisit | Tidak tersambung; konektor belum diimplementasikan |

## Hasil pengujian lokal

- `npm run check:server`: lulus pemeriksaan sintaks modul server.
- `npm test`: 21 tes lulus, terdiri dari 12 workspace dan sembilan compatibility/security legacy.
- `npm run test:e2e`: dua skenario Chromium lulus, tanpa page error yang ditangkap suite.
- `npm run build`: TypeScript dan bundling Vite lulus.
- `npx playwright test tests/marketing.spec.ts`: enam skenario marketing lulus, termasuk route public inti, tour progression, demo mode switching, maturity tool, responsive width, dan Axe check.
- `npm run format:check`: lulus pemeriksaan format file workspace.
- `npm audit --omit=dev`: tidak menemukan kerentanan dependency produksi pada pemeriksaan ini; bukan pengganti audit keamanan aplikasi.
- Pemeriksaan axe pada overview lulus aturan WCAG yang dipilih suite, termasuk contrast yang diperbaiki.
- Screenshot desktop dan mobile telah diperiksa secara visual.

Skenario browser pertama mencakup admin launch → employee baseline → lesson → quiz → download PDF certificate → report phishing → review admin. Skenario kedua mencakup navigasi, pergantian bahasa, mobile 390×844, serta pemeriksaan axe. Ini bukan klaim seluruh halaman telah diaudit WCAG.

Database tes terisolasi, SMTP / OIDC issuer tidak diaktifkan. Tidak ada email organisasi dikirim atau tenant eksternal diprovisioning dalam pengujian ini.

## Keputusan implementasi yang penting

1. Missing evidence ditampilkan belum terukur, bukan nilai nol atau demo.
2. Assignment menunjuk revisi tertentu agar edit materi tidak mengubah bukti lama.
3. Completion, pass rate, participation, dan simulation delivery mempunyai denominator masing-masing.
4. Submission phishing bukan kredit otomatis. Koreksi klasifikasi menonaktifkan bukti melalui ledger invalidation tanpa menghapus riwayat.
5. Campaign Completed berarti program ditutup, bukan semua peserta lulus.
6. Configured integration tidak ditampilkan sebagai Verified / Connected tanpa bukti.
7. Model legacy tetap disimpan tetapi API-nya retired secara default.
8. SSO dibatasi pada issuer dan tenant eksplisit, akun aktif existing, email terverifikasi, serta pemeriksaan MFA claim ketika diperlukan.

## Sebelum rollout organisasi

- Sediakan HTTPS, secret store, SMTP, dan konfigurasi IdP jika dipakai.
- Uji deliverability serta callback / claim / MFA dengan layanan organisasi.
- Siapkan recovery MFA, rotasi secret, backup dan restore rehearsal.
- Tinjau materi seed, kebijakan retensi, akses skor individu, dan role manager yang saat ini tenant-wide.
- Lakukan load testing, manual accessibility review, dan security review independen.
- Untuk multi-instance, implementasikan PostgreSQL, worker mandiri, pagination / aggregation, dan distributed rate limiter.

Belum semua acceptance criterion brief enterprise terpenuhi. Konektor direktori / kolaborasi, media lesson, template simulasi penuh, report design per kategori, locale ekspor, tren cohort, lifecycle identity enterprise, dan observability lanjutan tetap backlog. Repository ini belum dideploy atau dinyatakan siap produksi tanpa syarat.
