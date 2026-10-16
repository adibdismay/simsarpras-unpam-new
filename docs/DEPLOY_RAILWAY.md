# Deploy SIMSARPRAS ke Railway

Panduan ini untuk branch `feature/integrated-booking-validation`
(atau `main` setelah PR #3 di-merge). Jangan deploy dari GitHub Pages —
Pages hanya hosting statis dan tidak bisa menjalankan `server.js`.

## 1. Environment variables (wajib)

Set di Railway: Service → **Variables**.

| Variable | Nilai | Keterangan |
|---|---|---|
| `NODE_ENV` | `production` | Menonaktifkan akun demo; mengaktifkan bootstrap admin via env |
| `ADMIN_USERNAME` | _(pilih sendiri, mis. `adminunpam`)_ | Username admin awal. Hanya dipakai saat tabel users masih kosong |
| `ADMIN_PASSWORD` | _(password kuat, min. 12 karakter)_ | Password admin awal. **Tidak pernah dicetak ke log** |
| `SIMSARPRAS_DB` | `/data/simsarpras.db` | Lokasi SQLite di volume persisten |
| `PORT` | _(otomatis dari Railway)_ | Jangan set manual; Railway menginjeksi sendiri |

Variabel opsional:

| Variable | Default | Keterangan |
|---|---|---|
| `COOKIE_SECURE` | otomatis dari `x-forwarded-proto` | Set `1` untuk paksa flag Secure, `0` untuk matikan |

> **PENTING:** Jangan pernah commit file berisi password ke GitHub.
> `ADMIN_PASSWORD` hanya diisi di dashboard Railway (Variables),
> bukan di file repo.

## 2. Volume persisten (wajib untuk SQLite)

Tanpa volume, database hilang setiap redeploy.

1. Railway dashboard → Service → **Settings → Volumes → New Volume**
2. **Mount path:** `/data`
3. Pastikan `SIMSARPRAS_DB=/data/simsarpras.db` (lihat tabel di atas)

## 3. Deploy

1. Railway → **New Project → Deploy from GitHub repo**
2. Pilih repo `adibdismay/simsarpras-unpam-new`, branch yang diinginkan
3. Railway mendeteksi Node.js via `package.json`; start command: `node server.js`
   (sudah dikonfigurasi di `railway.json`)
4. Isi Variables (lihat bagian 1), pasang Volume (bagian 2)
5. **Generate Domain**: Service → Settings → Networking → Generate Domain
   (mendapat `https://<nama>.up.railway.app`, TLS otomatis)

## 4. Verifikasi setelah deploy

- Buka `https://<domain>/api/health` → harus `{"ok": true, ...}`
- Login dengan `ADMIN_USERNAME` / `ADMIN_PASSWORD`
- Cek cookie sesi memiliki flag `Secure` (DevTools → Application → Cookies)
- Buat satu pengajuan uji, redeploy service, pastikan data tetap ada
  (membuktikan volume persisten bekerja)

## 5. Catatan keamanan produksi

- Akun demo (`admin`/`Demo123!`) **tidak dibuat** saat `NODE_ENV=production`.
- Jika `ADMIN_USERNAME`/`ADMIN_PASSWORD` tidak diset dan tabel users kosong,
  server berjalan tanpa akun — set env vars lalu restart.
- Cookie otomatis `Secure` + HSTS aktif karena Railway meneruskan
  `x-forwarded-proto: https`.
- Login dibatasi: maks 10 percobaan gagal per IP tiap 15 menit (429).
- Header keamanan aktif: `X-Content-Type-Options`, `X-Frame-Options: DENY`,
  `Referrer-Policy`, HSTS (HTTPS saja).
- Backup: unduh `/data/simsarpras.db` dari volume secara berkala.
