/* ============================================================
   SIMSARPRAS UNPAM — Autentikasi Bearer Token (Vercel Functions)

   Mekanisme utama:  Authorization: Bearer <token>
   Fallback:        cookie simsarpras.sid (kompatibilitas dev lokal)
   Token: 32-byte random hex, TTL 12 jam, disimpan di tabel sessions.
   Logout mencabut sesi di server (DELETE), bukan sekadar hapus token.
   ============================================================ */
'use strict';

const crypto = require('node:crypto');
const { getClient, ensureReady } = require('./db');

const SESSION_TTL_MS = 12 * 60 * 60 * 1000; // 12 jam
const SESSION_COOKIE = 'simsarpras.sid';

/** Ambil token: header Authorization Bearer dulu, lalu cookie fallback. */
function extractToken(req) {
  const headers = req.headers || {};
  const authz = headers.authorization || headers.Authorization;
  if (typeof authz === 'string') {
    const m = authz.match(/^Bearer\s+(.+)$/i);
    if (m && m[1].trim()) return m[1].trim();
  }
  const cookieHeader = headers.cookie;
  if (typeof cookieHeader === 'string') {
    for (const part of cookieHeader.split(';')) {
      const i = part.indexOf('=');
      if (i === -1) continue;
      if (part.slice(0, i).trim() === SESSION_COOKIE) {
        try {
          return decodeURIComponent(part.slice(i + 1).trim());
        } catch {
          return part.slice(i + 1).trim();
        }
      }
    }
  }
  return null;
}

function createSessionToken() {
  return crypto.randomBytes(32).toString('hex');
}

async function createSession(userId) {
  const c = await ensureReady();
  const token = createSessionToken();
  const expiresAt = Date.now() + SESSION_TTL_MS;
  await c.execute({
    sql: 'INSERT INTO sessions (token, user_id, expires_at) VALUES (?, ?, ?)',
    args: [token, userId, expiresAt],
  });
  return { token, expiresAt };
}

async function revokeSession(token) {
  if (!token) return;
  const c = await ensureReady();
  await c.execute({ sql: 'DELETE FROM sessions WHERE token = ?', args: [token] });
}

/** Hapus sesi kedaluwarsa secara lazy di tiap validasi (pengganti setInterval). */
async function cleanupExpiredSessions(c) {
  try {
    await c.execute({ sql: 'DELETE FROM sessions WHERE expires_at < ?', args: [Date.now()] });
  } catch {
    /* non-fatal */
  }
}

/** Kembalikan user publik dari token, atau null bila tidak valid/kedaluwarsa. */
async function getSessionUser(req) {
  const token = extractToken(req);
  if (!token) return null;
  const c = await ensureReady();
  await cleanupExpiredSessions(c);
  const r = await c.execute({
    sql: `SELECT s.token, s.expires_at, u.id, u.username, u.nama, u.role, u.status
          FROM sessions s JOIN users u ON u.id = s.user_id WHERE s.token = ?`,
    args: [token],
  });
  const row = r.rows[0];
  if (!row) return null;
  if (Number(row.expires_at) < Date.now() || row.status !== 'aktif') {
    await revokeSession(token);
    return null;
  }
  return { id: row.id, username: row.username, nama: row.nama, role: row.role, token };
}

function publicUser(u) {
  return { id: u.id, username: u.username, nama: u.nama, role: u.role };
}

function unauthorized(res, sendJson, message) {
  sendJson(res, 401, { ok: false, errors: [message || 'Sesi berakhir atau belum login. Silakan login kembali.'] });
  return null;
}

async function requireAuth(req, res, sendJson) {
  const user = await getSessionUser(req);
  if (!user) return unauthorized(res, sendJson);
  return user;
}

async function requireAdmin(req, res, sendJson) {
  const user = await requireAuth(req, res, sendJson);
  if (!user) return null;
  if (user.role !== 'admin') {
    sendJson(res, 403, { ok: false, errors: ['Hanya admin yang dapat melakukan aksi ini.'] });
    return null;
  }
  return user;
}

module.exports = {
  SESSION_TTL_MS,
  SESSION_COOKIE,
  extractToken,
  createSession,
  revokeSession,
  getSessionUser,
  publicUser,
  requireAuth,
  requireAdmin,
};
