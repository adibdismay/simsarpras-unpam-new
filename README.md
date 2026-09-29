# SIMSARPRAS EDU — Universitas Pamulang

Sistem manajemen sarana dan prasarana (SIMSARPRAS) berbasis web untuk Universitas Pamulang.
Proyek ini merupakan tugas akademik Pemrograman Web 2 dan memakai **tema Material Design 3**,
dengan data simulasi yang disimpan di `localStorage` peramban (tanpa backend/server).

## Halaman

| Halaman | File | Keterangan |
| --- | --- | --- |
| Login | `login.html` | Halaman masuk demo (maskot robot + validasi) |
| Dashboard | `layout.html` | Ringkasan statistik dan grafik kondisi (Chart.js) |
| Data Inventaris | `data-master.html` | Tabel, pencarian, filter, tambah/edit/hapus (CRUD) |
| Form Inventaris | `form-inventaris.html` | Formulir tambah/edit data inventaris |
| Laporan | `laporan.html` | Rekap seluruh inventaris + tombol cetak |

## Akun Demo

- Username: `admin`
- Kata sandi: `Demo123!`

Login adalah **simulasi client-side**, bukan autentikasi aman. Kata sandi tidak disimpan
ke storage; setelah login berhasil hanya disimpan penanda sesi di `sessionStorage`
(key `simsarpras.session.v1`). Halaman Dashboard, Data Inventaris, Form, dan Laporan
memeriksa sesi; tanpa sesi akan diarahkan ke halaman login. Tombol **Keluar** menghapus
penanda sesi.

## Teknologi

- HTML, CSS, JavaScript (vanilla, tanpa framework)
- Tailwind CSS (via CDN)
- Chart.js (via CDN) untuk grafik kondisi
- Material Symbols (ikon) dan font Plus Jakarta Sans / JetBrains Mono
- `localStorage` untuk data mock (key `simsarpras.inventory.v1`) dan pilihan tema
  (key `simsarpras.theme.v1`)
- `sessionStorage` untuk penanda sesi login (key `simsarpras.session.v1`)

## Tema Terang/Gelap

Tersedia mode terang (default) dan gelap melalui tombol tema di setiap halaman. Pilihan
disimpan di `localStorage`; bila belum ada pilihan, mengikuti preferensi sistem
(`prefers-color-scheme`).

## Animasi Robot

Robot pada halaman login bersifat dekoratif: pupil mengikuti pointer, kelopak mata menutup
saat kolom kata sandi difokus, dan berkedip sesekali saat idle. Animasi dihormati oleh
`prefers-reduced-motion` (pelacakan dan kedipan dinonaktifkan).

## Cara Menjalankan

Jalankan melalui server lokal (bukan membuka file langsung) agar sumber daya relatif dan
modul JavaScript termuat dengan benar.

Contoh menggunakan Python:

```bash
python -m http.server 8000
```

Lalu buka `http://localhost:8000/` di peramban.

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
