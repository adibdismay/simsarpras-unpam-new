# Deploy SIMSARPRAS ke Render (Free)

Panduan ini untuk branch `feature/integrated-booking-validation`.
Render Free = **$0 permanen, tanpa kartu kredit**, URL publik HTTPS otomatis.
Jangan deploy dari GitHub Pages — Pages hanya hosting statis dan tidak bisa
menjalankan `server.js`.

> Catatan: filesystem Render Free bersifat **ephemeral** — database SQLite
> hilang setiap redeploy/restart/spin-down. Ini sudah diterima untuk demo
> (lihat keputusan proyek). Akun admin & mahasiswa demo dibuat ulang otomatis
> dari environment variables setiap server start dengan database kosong.

## 1. Environment variables (wajib)

Set di Render: Service → **Environment**.

| Variable | Nilai | Keterangan |
|---|---|---|
| `NODE_ENV` | `production` | Menonaktifkan akun demo; mengaktifkan bootstrap via env |
| `ADMIN_USERNAME` | _(pilih sendiri)_ | Username admin awal |
| `ADMIN_PASSWORD` | _(password kuat, min. 12 karakter)_ | Password admin awal. **Tidak pernah dicetak ke log** |
| `MAHASISWA_USERNAME` | _(pilih sendiri, mis. `mhsdemo`)_ | Username mahasiswa demo (opsional tapi disarankan untuk demo) |
| `MAHASISWA_PASSWORD` | _(password kuat)_ | Password mahasiswa demo (opsional) |

`PORT` **jangan diset manual** — Render menginjeksi sendiri (default 10000).
`server.js` sudah membaca `process.env.PORT` dan bind ke `0.0.0.0`
(sesuai syarat Render).

> **PENTING:** Jangan pernah commit file berisi password ke GitHub.
> Password hanya diisi di dashboard Render (Environment), bukan di file repo.

## 2. Buat Web Service

1. Daftar di [render.com](https://render.com) (cukup email/GitHub — **tanpa kartu kredit** untuk Free).
2. Dashboard → **New → Web Service** → **Build and deploy from a Git repository**.
3. Connect GitHub, pilih repo `adibdismay/simsarpras-unpam-new`.
4. Isi form:

   | Field | Nilai |
   |---|---|
   | **Branch** | `feature/integrated-booking-validation` |
   | **Language** | `Node` |
   | **Build Command** | _(kosongkan — tidak ada dependensi npm)_ |
   | **Start Command** | `node server.js` |
   | **Instance Type** | `Free` |

5. Di bagian **Advanced** → **Environment Variables**, isi tabel dari bagian 1.
6. (Opsional) **Health Check Path**: `/api/health`.
7. Klik **Create Web Service**. Render mulai build & deploy otomatis.

URL publik: `https://<nama-service>.onrender.com` (TLS otomatis dari Render).

## 3. Verifikasi setelah deploy

- Buka `https://<nama-service>.onrender.com/api/health` → `{"ok": true, ...}`
- Login sebagai admin (`ADMIN_USERNAME`/`ADMIN_PASSWORD`) → dashboard admin tampil
- Login sebagai mahasiswa (`MAHASISWA_USERNAME`/`MAHASISWA_PASSWORD`) →
  buat satu pengajuan peminjaman, lalu sebagai admin setujui/tolak
- Cek cookie sesi punya flag `Secure` (DevTools → Application → Cookies)

## 4. Batasan Render Free (dari [dokumentasi resmi](https://docs.render.com/free))

- **Sleep**: service spin-down setelah 15 menit tanpa traffic; request berikutnya
  butuh ±1 menit untuk bangun (Render menampilkan halaman loading).
  **Tips demo**: buka URL ~2 menit sebelum demo agar service sudah bangun.
- **Database ephemeral**: SQLite hilang saat redeploy/restart/spin-down.
  Akun demo dibuat ulang otomatis dari env vars — pengajuan demo perlu dibuat
  ulang jika service sempat restart.
- **750 jam instance gratis/bulan** — cukup untuk 1 service 24/7.
- **Tidak ada persistent disk** di Free (hanya paket berbayar).
- **Tidak ada akses shell/SSH** di Free.
- Bandwidth & build minutes punya kuota bulanan; tanpa kartu, service hanya
  di-suspend sementara jika kuota habis (tidak ada tagihan).

## 5. Catatan keamanan produksi

- Akun demo hardcoded (`admin`/`Demo123!`) **tidak dibuat** saat `NODE_ENV=production`.
- Cookie otomatis `Secure` + HSTS aktif karena Render meneruskan
  `x-forwarded-proto: https`.
- Login dibatasi: maks 10 percobaan gagal per IP tiap 15 menit (429 + Retry-After).
- Header keamanan aktif: `X-Content-Type-Options`, `X-Frame-Options: DENY`,
  `Referrer-Policy`, HSTS (HTTPS saja).
