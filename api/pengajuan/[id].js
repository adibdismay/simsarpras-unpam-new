/* SIMSARPRAS UNPAM — /api/pengajuan/:id (GET detail, PATCH validasi admin)
   Vercel Function, Node runtime. */
'use strict';

const { ensureReady, getClient } = require('../../lib/db');
const { applyCors } = require('../../lib/cors');
const { applySecurity, sendJson, readJsonBody } = require('../../lib/security');
const { requireAuth, requireAdmin } = require('../../lib/auth');
const { STATUS_MENUNGGU, STATUS_AKHIR, rowToPengajuan, PENGAJUAN_SELECT } = require('../../lib/pengajuan');

function resolveId(req) {
  const q = req.query || {};
  if (q.id !== undefined) {
    const n = Number(q.id);
    return Number.isInteger(n) && n > 0 ? n : null;
  }
  const m = String(req.url || '').match(/\/api\/pengajuan\/(\d+)/);
  return m ? Number(m[1]) : null;
}

async function handleGet(req, res, id) {
  const user = await requireAuth(req, res, sendJson);
  if (!user) return;
  const c = getClient();
  const r = await c.execute({ sql: `${PENGAJUAN_SELECT} WHERE p.id = ?`, args: [id] });
  const row = r.rows[0];
  if (!row) return sendJson(res, 404, { ok: false, errors: ['Pengajuan tidak ditemukan.'] });
  if (user.role !== 'admin' && Number(row.user_id) !== user.id) {
    return sendJson(res, 403, { ok: false, errors: ['Tidak berhak melihat pengajuan ini.'] });
  }
  return sendJson(res, 200, { ok: true, data: rowToPengajuan(row) });
}

async function handlePatch(req, res, id) {
  const admin = await requireAdmin(req, res, sendJson);
  if (!admin) return;
  const c = getClient();
  let body;
  try {
    body = await readJsonBody(req);
  } catch (e) {
    return sendJson(res, 400, { ok: false, errors: [e.message] });
  }
  const status = typeof body.status === 'string' ? body.status.trim() : '';
  const catatanAdmin =
    typeof body.catatan_admin === 'string' ? body.catatan_admin.trim().slice(0, 500) : null;
  if (!STATUS_AKHIR.includes(status)) {
    return sendJson(res, 400, { ok: false, errors: ['Status harus "disetujui" atau "ditolak".'] });
  }
  const r = await c.execute({ sql: 'SELECT * FROM pengajuan WHERE id = ?', args: [id] });
  const row = r.rows[0];
  if (!row) return sendJson(res, 404, { ok: false, errors: ['Pengajuan tidak ditemukan.'] });
  if (row.status !== STATUS_MENUNGGU) {
    return sendJson(res, 409, {
      ok: false,
      errors: [`Pengajuan sudah diproses sebelumnya (status: ${row.status}).`],
    });
  }
  const now = new Date().toISOString();
  await c.execute({
    sql: `UPDATE pengajuan SET status = ?, catatan_admin = ?, diproses_oleh = ?,
          diproses_pada = ?, updated_at = ? WHERE id = ?`,
    args: [status, catatanAdmin || null, admin.id, now, now, id],
  });
  const updated = await c.execute({ sql: `${PENGAJUAN_SELECT} WHERE p.id = ?`, args: [id] });
  return sendJson(res, 200, { ok: true, data: rowToPengajuan(updated.rows[0]) });
}

module.exports = async function handler(req, res) {
  applySecurity(res);
  if (applyCors(req, res)) return;
  try {
    await ensureReady();
    const id = resolveId(req);
    if (!id) return sendJson(res, 400, { ok: false, errors: ['ID pengajuan tidak valid.'] });
    if (req.method === 'GET') return handleGet(req, res, id);
    if (req.method === 'PATCH') return handlePatch(req, res, id);
    return sendJson(res, 405, { ok: false, errors: ['Metode tidak didukung.'] });
  } catch (err) {
    console.error('[api/pengajuan/[id]] error:', err);
    if (!res.headersSent) {
      sendJson(res, 500, { ok: false, errors: ['Terjadi kesalahan pada server.'] });
    }
  }
};
