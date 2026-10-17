/* SIMSARPRAS UNPAM — GET /api/auth/me */
'use strict';

const { ensureReady } = require('../../lib/db');
const { applyCors } = require('../../lib/cors');
const { applySecurity, sendJson } = require('../../lib/security');
const { getSessionUser, publicUser } = require('../../lib/auth');

module.exports = async function handler(req, res) {
  applySecurity(res);
  if (applyCors(req, res)) return;
  try {
    if (req.method !== 'GET') {
      return sendJson(res, 405, { ok: false, errors: ['Metode tidak didukung.'] });
    }
    await ensureReady();
    const user = await getSessionUser(req);
    if (!user) return sendJson(res, 401, { ok: false, errors: ['Belum login.'] });
    return sendJson(res, 200, { ok: true, user: publicUser(user) });
  } catch (err) {
    console.error('[api/auth/me] error:', err);
    if (!res.headersSent) {
      sendJson(res, 500, { ok: false, errors: ['Terjadi kesalahan pada server.'] });
    }
  }
};
