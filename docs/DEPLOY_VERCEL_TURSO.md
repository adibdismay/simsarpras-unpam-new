# Deploy SIMSARPRAS — GitHub Pages + Vercel Hobby + Turso

Arsitektur: frontend statis di GitHub Pages → API di Vercel Functions (Node.js)
→ database Turso (libSQL/SQLite managed, persisten).

**Biaya: $0/bln. Tanpa kartu pembayaran.** Jika pada langkah mana pun muncul
permintaan kartu, **HENTIKAN** dan laporkan — jangan lanjutkan.

> Status: panduan ini disiapkan sebelum deployment. Akun belum dibuat,
> belum ada deployment produksi, belum ada migrasi data.

---

## 1. Buat database Turso (manual, ±10 menit)

1. Daftar di [turso.tech](https://turso.tech) (gratis, tanpa kartu).
2. Buat 1 database, pilih region **Singapura** (`sin1`) — dekat dengan pengguna.
3. Salin **Database URL** (`libsql://...`) dan buat **auth token**.
4. Simpan keduanya di tempat aman (password manager). Jangan taruh di repo.

Verifikasi: di dashboard Turso, database berstatus aktif dan bisa di-query.

## 2. Deploy backend ke Vercel (manual, ±15 menit)

1. Daftar di [vercel.com](https://vercel.com) via GitHub (Hobby plan, gratis).
2. Import repository `adibdismay/simsarpras-unpam-new`, branch
   `feature/integrated-booking-validation`.
3. Set Environment Variables (Production):
   | Variable | Nilai |
   |---|---|
   | `TURSO_DATABASE_URL` | URL database Turso |
   | `TURSO_AUTH_TOKEN` | token Turso (**secret**) |
   | `ADMIN_USERNAME` | username admin awal |
   | `ADMIN_PASSWORD` | password admin awal (≥12 karakter, **secret**) |
   | `NODE_ENV` | `production` |
   | `MAHASISWA_USERNAME` | (opsional) akun mahasiswa demo |
   | `MAHASISWA_PASSWORD` | (opsional, **secret**) |
4. Pastikan Functions region = **Singapore (sin1)** — dekat dengan Turso.
5. Deploy. Catat URL produksi, mis. `https://simsarpras-unpam-new.vercel.app`.
6. Uji: `GET https://<url>/api/health` → `{ok: true}`.

> File `server.js` / `dev-server.js` / `data/` / `test/` **tidak** ikut
> di-deploy (lihat `.vercelignore`) — tidak terekspos sebagai file statis.

## 3. Arahkan frontend ke backend

Di `assets/js/auth.js` dan `assets/js/pengajuan.js`:

```js
var API_BASE = window.SIMSARPRAS_API_BASE || "https://simsarpras-unpam-new.vercel.app";
```

Ganti URL default di atas dengan URL Vercel produksi, **atau** set
`window.SIMSARPRAS_API_BASE` sebelum memuat script (tanpa mengubah file):

```html
<script>window.SIMSARPRAS_API_BASE = "https://<project>.vercel.app";</script>
```

## 4. GitHub Pages (keputusan Adib)

Frontend dipublish dari branch `feature/integrated-booking-validation`
(bukan `main`). Langkah publikasi Pages menunggu instruksi Adib —
**`main` tidak disentuh tanpa persetujuan.**

## 5. Migrasi data SQLite lokal → Turso (SETELAH persetujuan terpisah)

```bash
# 1. Dry-run dulu (read-only, tidak menulis apa pun):
node scripts/migrate-sqlite-to-turso.js

# 2. Migrasi sungguhan (hanya setelah disetujui):
TURSO_DATABASE_URL="libsql://..." TURSO_AUTH_TOKEN="..." \
  node scripts/migrate-sqlite-to-turso.js --execute
```

Database lokal `data/simsarpras.db` **tidak** dihapus/dimodifikasi skrip ini.
Setelah migrasi, verifikasi jumlah baris di dashboard Turso.

## 6. Verifikasi pasca-deploy

Jalankan skenario di bawah dari `https://adibdismay.github.io`
(bukan localhost) — memakai dua browser/profil berbeda untuk dua peran:

1. Login mahasiswa → buat pengajuan peminjaman + perbaikan → status `menunggu`.
2. Login admin (browser lain) → daftar menampilkan semua → setujui satu, tolak satu.
3. Refresh sisi mahasiswa → status berubah (sinkronisasi antar-perangkat).
4. Logout → token lama tidak berlaku (401 di `/api/auth/me`).
5. Uji dari HP Android (Chrome) dan iPhone (Safari) — memastikan Bearer token
   berfungsi lintas browser mobile.
6. Redeploy Vercel → data tetap ada (bukti database persisten, bukan ephemeral).
7. Cek dashboard Turso: usage jauh di bawah batas free tier.

## 7. Batasan yang perlu diketahui

- **Vercel Hobby**: untuk penggunaan personal/non-komersial. Untuk demo dan
  tugas kampus ini sesuai; bila menjadi operasional resmi kampus, siapkan
  rencana upgrade Pro atau self-host.
- **Turso free**: jika satu metrik usage terlampaui, database **diblokir**
  (bukan ditagih). Monitor usage di dashboard. Backup dump berkala:
  `node scripts/migrate-sqlite-to-turso.js` (dry-run) + export via Turso CLI.
- **Keamanan**: token sesi di `sessionStorage` (rentan XSS bila ada celah —
  semua output user di-escape via `esc()`; CSP ketat di respons API).
  Kredensial hanya di env var Vercel, tidak pernah di repo/frontend.
