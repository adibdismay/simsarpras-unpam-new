/* ============================================================
   SIMSARPRAS UNPAM — Validasi & mapping pengajuan (shared).
   Disalin verbatim dari server.js agar perilaku identik.
   ============================================================ */
'use strict';

const JENIS_PENGAJUAN = ['peminjaman', 'perbaikan'];
const STATUS_MENUNGGU = 'menunggu';
const STATUS_AKHIR = ['disetujui', 'ditolak'];

function isValidDate(str) {
  if (typeof str !== 'string' || !/^\d{4}-\d{2}-\d{2}$/.test(str)) return false;
  // Parse sebagai UTC agar validasi tanggal kalender tidak bergeser zona waktu server.
  const d = new Date(str + 'T00:00:00Z');
  return !Number.isNaN(d.getTime()) && d.toISOString().slice(0, 10) === str;
}

function validatePengajuanInput(body) {
  const errors = [];
  const jenis = typeof body.jenis === 'string' ? body.jenis.trim() : '';

  if (!JENIS_PENGAJUAN.includes(jenis)) {
    errors.push('Jenis pengajuan wajib diisi: "peminjaman" atau "perbaikan".');
    return { valid: false, errors, data: null };
  }

  const clean = (v, max) => {
    if (typeof v !== 'string') return '';
    const t = v.trim();
    return max && t.length > max ? t.slice(0, max) : t;
  };

  if (jenis === 'peminjaman') {
    const fasilitas = clean(body.fasilitas, 120);
    const tanggalMulai = typeof body.tanggal_mulai === 'string' ? body.tanggal_mulai.trim() : '';
    const tanggalSelesai = typeof body.tanggal_selesai === 'string' ? body.tanggal_selesai.trim() : '';
    const keperluan = clean(body.keperluan, 500);

    if (!fasilitas) errors.push('Fasilitas/ruangan wajib diisi.');
    if (!isValidDate(tanggalMulai)) errors.push('Tanggal mulai tidak valid (format YYYY-MM-DD).');
    if (!isValidDate(tanggalSelesai)) errors.push('Tanggal selesai tidak valid (format YYYY-MM-DD).');
    if (isValidDate(tanggalMulai) && isValidDate(tanggalSelesai) && tanggalSelesai < tanggalMulai) {
      errors.push('Tanggal selesai tidak boleh sebelum tanggal mulai.');
    }
    if (!keperluan) errors.push('Keperluan wajib diisi.');

    if (errors.length) return { valid: false, errors, data: null };
    return {
      valid: true,
      errors,
      data: { jenis, fasilitas, tanggal_mulai: tanggalMulai, tanggal_selesai: tanggalSelesai, keperluan },
    };
  }

  // jenis === 'perbaikan'
  const kodeInventaris = clean(body.kode_inventaris, 60);
  const deskripsiKerusakan = clean(body.deskripsi_kerusakan, 500);

  if (!kodeInventaris) errors.push('Kode inventaris wajib diisi.');
  if (!deskripsiKerusakan) errors.push('Deskripsi kerusakan wajib diisi.');

  if (errors.length) return { valid: false, errors, data: null };
  return {
    valid: true,
    errors,
    data: { jenis, kode_inventaris: kodeInventaris, deskripsi_kerusakan: deskripsiKerusakan },
  };
}

function rowToPengajuan(row) {
  return {
    id: row.id,
    user_id: row.user_id,
    pengaju: row.pengaju_nama || null,
    pengaju_username: row.pengaju_username || null,
    jenis: row.jenis,
    fasilitas: row.fasilitas,
    tanggal_mulai: row.tanggal_mulai,
    tanggal_selesai: row.tanggal_selesai,
    keperluan: row.keperluan,
    kode_inventaris: row.kode_inventaris,
    deskripsi_kerusakan: row.deskripsi_kerusakan,
    status: row.status,
    catatan_admin: row.catatan_admin,
    diproses_oleh: row.diproses_nama || null,
    diproses_pada: row.diproses_pada,
    created_at: row.created_at,
    updated_at: row.updated_at,
  };
}

const PENGAJUAN_SELECT = `
  SELECT p.*,
         u1.nama AS pengaju_nama, u1.username AS pengaju_username,
         u2.nama AS diproses_nama
  FROM pengajuan p
  JOIN users u1 ON u1.id = p.user_id
  LEFT JOIN users u2 ON u2.id = p.diproses_oleh
`;

module.exports = {
  JENIS_PENGAJUAN,
  STATUS_MENUNGGU,
  STATUS_AKHIR,
  isValidDate,
  validatePengajuanInput,
  rowToPengajuan,
  PENGAJUAN_SELECT,
};
