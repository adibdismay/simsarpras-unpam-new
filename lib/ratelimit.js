/* ============================================================
   SIMSARPRAS UNPAM — Rate limit login berbasis Turso.
   Pengganti Map in-memory di server.js (tidak bertahan di serverless).
   Aturan: maks 10 percobaan GAGAL per IP tiap 15 menit -> 429.
   ============================================================ */
'use strict';

const { ensureReady } = require('./db');

const WINDOW_MS = 15 * 60 * 1000;
const MAX_FAILS = 10;
const RETRY_AFTER_SEC = 900;

/** Kembalikan { limited, retryAfter }. Membuat/mereset window bila perlu. */
async function loginRateLimitStatus(ip) {
  const c = await ensureReady();
  const now = Date.now();
  const r = await c.execute({
    sql: 'SELECT gagal_count, reset_at FROM login_attempts WHERE ip = ?',
    args: [ip],
  });
  const row = r.rows[0];
  if (!row || Number(row.reset_at) <= now) {
    await c.execute({
      sql: 'INSERT OR REPLACE INTO login_attempts (ip, gagal_count, reset_at) VALUES (?, 0, ?)',
      args: [ip, now + WINDOW_MS],
    });
    return { limited: false, retryAfter: 0 };
  }
  if (Number(row.gagal_count) >= MAX_FAILS) {
    const retryAfter = Math.max(1, Math.ceil((Number(row.reset_at) - now) / 1000));
    return { limited: true, retryAfter };
  }
  return { limited: false, retryAfter: 0 };
}

async function loginRateLimitFail(ip) {
  const c = await ensureReady();
  const now = Date.now();
  const r = await c.execute({
    sql: 'SELECT gagal_count, reset_at FROM login_attempts WHERE ip = ?',
    args: [ip],
  });
  const row = r.rows[0];
  if (!row || Number(row.reset_at) <= now) {
    await c.execute({
      sql: 'INSERT OR REPLACE INTO login_attempts (ip, gagal_count, reset_at) VALUES (?, 1, ?)',
      args: [ip, now + WINDOW_MS],
    });
    return;
  }
  await c.execute({
    sql: 'UPDATE login_attempts SET gagal_count = gagal_count + 1 WHERE ip = ?',
    args: [ip],
  });
}

/** Dipanggil saat login sukses: hapus catatan gagal IP tersebut. */
async function loginRateLimitReset(ip) {
  const c = await ensureReady();
  await c.execute({ sql: 'DELETE FROM login_attempts WHERE ip = ?', args: [ip] });
}

module.exports = {
  loginRateLimitStatus,
  loginRateLimitFail,
  loginRateLimitReset,
  LOGIN_RL_MAX_FAILS: MAX_FAILS,
  LOGIN_RL_RETRY_AFTER: RETRY_AFTER_SEC,
};
