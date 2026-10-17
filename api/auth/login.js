/* SIMSARPRAS UNPAM — POST /api/auth/login (Vercel Function, Node runtime)
   Mengembalikan Bearer token di body JSON (mekanisme utama).
   Cookie httpOnly juga di-set sebagai fallback kompatibilitas. */
'use strict';

const { ensureReady, verifyPassword } = require('../../lib/db');
const { applyCors } = require('../../lib/cors');
const { applySecurity, sendJson, readJsonBody, clientIp } = require('../../lib/security');
const { createSession, publicUser, SESSION_COOKIE, SESSION_TTL_MS } = require('../../lib/auth');
const {
  loginRateLimitStatus,
  loginRateLimitFail,
  loginRateLimitReset,
} = require('../../lib/ratelimit');

function isHttps(req) {
  const proto = req.headers && req.headers['x-forwarded-proto'];
  return typeof proto === 'string' && proto.split(',')[0].trim().toLowerCase() === 'https';
}

module.exports = async function handler(req, res) {
  applySecurity(res);
  if (applyCors(req, res)) return;
  try {
    if (req.method !== 'POST') {
      return sendJson(res, 405, { ok: false, errors: ['Metode tidak didukung.'] });
    }
    await ensureReady();
    const { getClient } = require('../../lib/db');
    const c = getClient();

    const ip = clientIp(req);
    const rl = await loginRateLimitStatus(ip);
    if (rl.limited) {
      return sendJson(
        res,
        429,
        { ok: false, errors: ['Terlalu banyak percobaan login. Coba lagi nanti.'] },
        { 'Retry-After': String(rl.retryAfter || 900) }
      );
    }

    let body;
    try {
      body = await readJsonBody(req);
    } catch (e) {
      return sendJson(res, 400, { ok: false, errors: [e.message] });
    }
    const username = typeof body.username === 'string' ? body.username.trim() : '';
    const password = typeof body.password === 'string' ? body.password : '';
    if (!username || !password) {
      return sendJson(res, 400, { ok: false, errors: ['Username dan kata sandi wajib diisi.'] });
    }

    const r = await c.execute({ sql: 'SELECT * FROM users WHERE username = ?', args: [username] });
    const user = r.rows[0];
    if (!user || user.status !== 'aktif' || !verifyPassword(password, user.password_hash)) {
      await loginRateLimitFail(ip);
      return sendJson(res, 401, { ok: false, errors: ['Username atau kata sandi salah.'] });
    }
    await loginRateLimitReset(ip);

    const { token } = await createSession(user.id);
    const secure = isHttps(req);
    const headers = {
      // Fallback cookie (dev lokal same-origin). Mekanisme utama tetap token di body.
      'Set-Cookie': `${SESSION_COOKIE}=${token}; Path=/; HttpOnly; SameSite=Lax; Max-Age=${Math.floor(
        SESSION_TTL_MS / 1000
      )}${secure ? '; Secure' : ''}`,
    };
    return sendJson(res, 200, { ok: true, token, user: publicUser(user) }, headers);
  } catch (err) {
    console.error('[api/auth/login] error:', err);
    if (!res.headersSent) {
      sendJson(res, 500, { ok: false, errors: ['Terjadi kesalahan pada server.'] });
    }
  }
};
