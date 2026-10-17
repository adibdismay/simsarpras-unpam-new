/* SIMSARPRAS UNPAM — POST /api/auth/logout
   Mencabut sesi di server (bukan sekadar hapus token di browser). */
'use strict';

const { ensureReady } = require('../../lib/db');
const { applyCors } = require('../../lib/cors');
const { applySecurity, sendJson } = require('../../lib/security');
const { extractToken, revokeSession, SESSION_COOKIE } = require('../../lib/auth');

module.exports = async function handler(req, res) {
  applySecurity(res);
  if (applyCors(req, res)) return;
  try {
    if (req.method !== 'POST') {
      return sendJson(res, 405, { ok: false, errors: ['Metode tidak didukung.'] });
    }
    await ensureReady();
    const token = extractToken(req);
    await revokeSession(token);
    return sendJson(
      res,
      200,
      { ok: true },
      { 'Set-Cookie': `${SESSION_COOKIE}=; Path=/; HttpOnly; SameSite=Lax; Max-Age=0` }
    );
  } catch (err) {
    console.error('[api/auth/logout] error:', err);
    if (!res.headersSent) {
      sendJson(res, 500, { ok: false, errors: ['Terjadi kesalahan pada server.'] });
    }
  }
};
