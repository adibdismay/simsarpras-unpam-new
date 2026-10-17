/* SIMSARPRAS UNPAM — /api/pengajuan (GET daftar, POST buat)
   Vercel Function, Node runtime. */
'use strict';

const { ensureReady, getClient } = require('../../lib/db');
const { applyCors } = require('../../lib/cors');
const { applySecurity, sendJson, readJsonBody } = require('../../lib/security');
const { requireAuth } = require('../../lib/auth');
const {
  JENIS_PENGAJUAN,
  STATUS_MENUNGGU,
  STATUS_AKHIR,
  validatePengajuanInput,
  rowToPengajuan,
  PENGAJUAN_SELECT,
} = require('../../lib/pengajuan');

async function handleGet(req, res) {
  const user = await requireAuth(req, res, sendJson);
  if (!user) return;
  const c = getClient();
  const q = req.query || {};
  const status = q.status;
  const jenis = q.jenis;
  const conds = [];
  const params = [];
  if (user.role !== 'admin') {
    conds.push('p.user_id = ?');
    params.push(user.id);
  }
  if (status) {
    if (![STATUS_MENUNGGU, ...STATUS_AKHIR].includes(status)) {
      return sendJson(res, 400, { ok: false, errors: ['Filter status tidak valid.'] });
    }
    conds.push('p.status = ?');
    params.push(status);
  }
  if (jenis) {
    if (!JENIS_PENGAJUAN.includes(jenis)) {
      return sendJson(res, 400, { ok: false, errors: ['Filter jenis tidak valid.'] });
    }
    conds.push('p.jenis = ?');
    params.push(jenis);
  }
  const where = conds.length ? 'WHERE ' + conds.join(' AND ') : '';
  const r = await c.execute({
    sql: `${PENGAJUAN_SELECT} ${where} ORDER BY p.created_at DESC, p.id DESC`,
    args: params,
  });
  return sendJson(res, 200, { ok: true, data: r.rows.map(rowToPengajuan) });
}

async function handlePost(req, res) {
  const user = await requireAuth(req, res, sendJson);
  if (!user) return;
  const c = getClient();
  let body;
  try {
    body = await readJsonBody(req);
  } catch (e) {
    return sendJson(res, 400, { ok: false, errors: [e.message] });
  }
  const { valid, errors, data } = validatePengajuanInput(body);
  if (!valid) return sendJson(res, 400, { ok: false, errors });
  const now = new Date().toISOString();
  // INSERT ... RETURNING id: pengganti info.lastInsertRowid (tidak andal di @libsql/client).
  const ins = await c.execute({
    sql: `INSERT INTO pengajuan
            (user_id, jenis, fasilitas, tanggal_mulai, tanggal_selesai, keperluan,
             kode_inventaris, deskripsi_kerusakan, status, created_at, updated_at)
          VALUES (?, ?, ?, ?, ?, ?, ?, ?, 'menunggu', ?, ?)
          RETURNING id`,
    args: [
      user.id,
      data.jenis,
      data.fasilitas || null,
      data.tanggal_mulai || null,
      data.tanggal_selesai || null,
      data.keperluan || null,
      data.kode_inventaris || null,
      data.deskripsi_kerusakan || null,
      now,
      now,
    ],
  });
  const newId = ins.rows[0].id;
  const row = await c.execute({ sql: `${PENGAJUAN_SELECT} WHERE p.id = ?`, args: [newId] });
  return sendJson(res, 201, { ok: true, data: rowToPengajuan(row.rows[0]) });
}

module.exports = async function handler(req, res) {
  applySecurity(res);
  if (applyCors(req, res)) return;
  try {
    await ensureReady();
    if (req.method === 'GET') return handleGet(req, res);
    if (req.method === 'POST') return handlePost(req, res);
    return sendJson(res, 405, { ok: false, errors: ['Metode tidak didukung.'] });
  } catch (err) {
    console.error('[api/pengajuan] error:', err);
    if (!res.headersSent) {
      sendJson(res, 500, { ok: false, errors: ['Terjadi kesalahan pada server.'] });
    }
  }
};
