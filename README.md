# SIMSARPRAS EDU — Universitas Pamulang

Sistem manajemen sarana dan prasarana (SIMSARPRAS) berbasis web untuk Universitas Pamulang.
Proyek ini merupakan tugas akademik Pemrograman Web 2 dan memakai **tema Material Design 3**.
Data inventaris/gedung/ruangan memakai data simulasi di `localStorage` peramban, sedangkan
**autentikasi dan pengajuan sarpras terintegrasi backend** (Node.js + SQLite).

## Halaman

| Halaman | File | Keterangan |
| --- | --- | --- |
| Login | `login.html` | Halaman masuk (maskot robot + validasi, terverifikasi backend) |
| Dashboard | `layout.html` | Ringkasan statistik dan grafik kondisi (Chart.js) |
| Data Inventaris | `data-master.html` | Tabel, pencarian, filter, tambah/edit/hapus (CRUD) |
| Form Inventaris | `form-inventaris.html` | Formulir tambah/edit data inventaris |
| Pengajuan | `pengajuan.html` | Pengajuan peminjaman/perbaikan + validasi admin (backend) |
| Laporan | `laporan.html` | Rekap seluruh inventaris + tombol cetak |

## Teknologi

- HTML, CSS, JavaScript (vanilla, tanpa framework)
- Tailwind CSS (via CDN)
- Chart.js (via CDN) untuk grafik kondisi
- Material Symbols (ikon) dan font Plus Jakarta Sans / JetBrains Mono
- Backend: Node.js (stdlib saja — `node:http` + `node:sqlite`, tanpa dependensi npm)
- Database: SQLite (file `data/simsarpras.db`, dibuat otomatis)
- `localStorage` untuk data mock inventaris (key `simsarpras.inventory.v1`) dan pilihan tema
  (key `simsarpras.theme.v1`)
- Sesi login: cookie httpOnly dari backend (menggantikan flag `sessionStorage` lama)

## Tema Terang/Gelap

Tersedia mode terang (default) dan gelap melalui tombol tema di setiap halaman. Pilihan
disimpan di `localStorage`; bila belum ada pilihan, mengikuti preferensi sistem
(`prefers-color-scheme`).

## Animasi Robot

Robot pada halaman login bersifat dekoratif: pupil mengikuti pointer, kelopak mata menutup
saat kolom kata sandi difokus, dan berkedip sesekali saat idle. Animasi dihormati oleh
`prefers-reduced-motion` (pelacakan dan kedipan dinonaktifkan).

## Cara Menjalankan

Aplikasi membutuhkan backend terpadu (Node.js) untuk login dan pengajuan.
Backend **tanpa dependensi npm** (memakai `node:http` + `node:sqlite` bawaan).

```bash
node server.js
```

Lalu buka `http://localhost:3000/` di peramban. Database SQLite dibuat otomatis
di `data/simsarpras.db` saat pertama dijalankan (diabaikan git).

Variabel lingkungan opsional:

```bash
PORT=8080 node server.js
SIMSARPRAS_DB=/path/ke/db.sqlite node server.js
```

## Akun Demo

| Username    | Kata sandi | Peran     |
| ----------- | ---------- | --------- |
| `admin`     | `Demo123!` | Admin     |
| `mahasiswa` | `Demo123!` | Mahasiswa |

Kata sandi disimpan sebagai hash scrypt di database; login menerbitkan cookie
sesi httpOnly. Halaman yang dilindungi memeriksa sesi ke server.

## Alur Pengajuan (baru)

1. Login sebagai `mahasiswa` / `Demo123!`.
2. Buka halaman **Pengajuan** (tombol "Ajukan Sarpras" di header atau menu).
3. Pilih tab **Peminjaman Fasilitas** (ruangan/fasilitas + tanggal + keperluan)
   atau **Perbaikan Inventaris** (kode inventaris + deskripsi kerusakan), lalu kirim.
4. Login sebagai `admin` / `Demo123!` untuk melihat semua pengajuan dan
   **Setujui** / **Tolak** beserta catatan. Status langsung terlihat oleh mahasiswa.

## Data Mock

Seluruh data inventaris adalah data simulasi. Data seed diisikan sekali ke `localStorage`
saat pertama kali dibuka dan tidak terhubung ke server mana pun. Perubahan (tambah, edit,
hapus) tersimpan di peramban yang sama.

## Alur Demo

1. Buka halaman login dan masuk dengan akun demo `admin` / `Demo123!`.
2. Dashboard menampilkan ringkasan dan grafik kondisi.
3. Masuk ke Data Inventaris, gunakan pencarian/filter, lalu tambah data via **+ Tambah Inventaris**.
4. Edit atau hapus data dari kolom Aksi pada tabel.
5. Buka Laporan untuk melihat rekap dan mencetak.

## Dokumentasi

- [PERANCANGAN.md](PERANCANGAN.md) — dokumen perancangan proyek.
