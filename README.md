# SIMSARPRAS EDU — Universitas Pamulang

Sistem manajemen sarana dan prasarana (SIMSARPRAS) berbasis web untuk Universitas Pamulang.
Proyek ini merupakan tugas akademik Pemrograman Web 2 dan memakai **tema Material Design 3**,
dengan data simulasi yang disimpan di `localStorage` peramban (tanpa backend/server).

## Halaman

| Halaman | File | Keterangan |
| --- | --- | --- |
| Dashboard | `layout.html` | Ringkasan statistik dan grafik kondisi (Chart.js) |
| Data Inventaris | `data-master.html` | Tabel, pencarian, filter, tambah/edit/hapus (CRUD) |
| Form Inventaris | `form-inventaris.html` | Formulir tambah/edit data inventaris |
| Laporan | `laporan.html` | Rekap seluruh inventaris + tombol cetak |

## Teknologi

- HTML, CSS, JavaScript (vanilla, tanpa framework)
- Tailwind CSS (via CDN)
- Chart.js (via CDN) untuk grafik kondisi
- Material Symbols (ikon) dan font Plus Jakarta Sans / JetBrains Mono
- `localStorage` untuk penyimpanan data mock (key `simsarpras.inventory.v1`)

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

1. Buka Dashboard untuk melihat ringkasan dan grafik kondisi.
2. Masuk ke Data Inventaris, gunakan pencarian/filter, lalu tambah data via **+ Tambah Inventaris**.
3. Edit atau hapus data dari kolom Aksi pada tabel.
4. Buka Laporan untuk melihat rekap dan mencetak.

## Dokumentasi

- [PERANCANGAN.md](PERANCANGAN.md) — dokumen perancangan proyek.
