/* ============================================================
   SIMSARPRAS UNPAM — Lapisan database (Vercel Functions)
   @libsql/client: Turso remote di produksi, file lokal untuk dev/test.

   Env:
     TURSO_DATABASE_URL  - mis. libsql://xxx.turso.io (produksi)
     TURSO_AUTH_TOKEN    - token Turso (produksi, JANGAN di-commit)
     LIBSQL_LOCAL_PATH   - override path file lokal (dev/test)
   Tanpa TURSO_DATABASE_URL -> pakai file lokal data/simsarpras.db
   (atau LIBSQL_LOCAL_PATH bila diset).
   ============================================================ */
'use strict';

const path = require('node:path');
const crypto = require('node:crypto');
const { createClient } = require('@libsql/client');

const ROOT_DIR = path.join(__dirname, '..', '..');
const IS_PROD = (process.env.NODE_ENV || 'development') === 'production';

let client = null;
let readyPromise = null;

function resolveUrl() {
  const remote = (process.env.TURSO_DATABASE_URL || '').trim();
  if (remote) return { url: remote, authToken: process.env.TURSO_AUTH_TOKEN || '' };
  const localPath =
    process.env.LIBSQL_LOCAL_PATH || path.join(ROOT_DIR, 'data', 'simsarpras.db');
  return { url: 'file:' + localPath };
}

/** Singleton client libSQL (lazy). */
function getClient() {
  if (!client) {
    const { url, authToken } = resolveUrl();
    client = createClient(authToken ? { url, authToken } : { url });
  }
  return client;
}

/* scrypt tanpa dependensi: format "saltHex:hashHex" (disalin dari server.js) */
function hashPassword(password) {
  const salt = crypto.randomBytes(16).toString('hex');
  const hash = crypto.scryptSync(String(password), salt, 64).toString('hex');
  return `${salt}:${hash}`;
}

function verifyPassword(password, stored) {
  try {
    const [salt, hash] = String(stored).split(':');
    if (!salt || !hash) return false;
    const check = crypto.scryptSync(String(password), salt, 64).toString('hex');
    return crypto.timingSafeEqual(Buffer.from(check, 'hex'), Buffer.from(hash, 'hex'));
  } catch {
    return false;
  }
}

const SCHEMA_STATEMENTS = [
  `CREATE TABLE IF NOT EXISTS users (
     id INTEGER PRIMARY KEY AUTOINCREMENT,
     username TEXT UNIQUE NOT NULL,
     password_hash TEXT NOT NULL,
     nama TEXT NOT NULL,
     role TEXT NOT NULL CHECK (role IN ('admin', 'mahasiswa')),
     status TEXT NOT NULL DEFAULT 'aktif',
     created_at TEXT NOT NULL
   )`,
  `CREATE TABLE IF NOT EXISTS pengajuan (
     id INTEGER PRIMARY KEY AUTOINCREMENT,
     user_id INTEGER NOT NULL REFERENCES users(id),
     jenis TEXT NOT NULL CHECK (jenis IN ('peminjaman', 'perbaikan')),
     fasilitas TEXT,
     tanggal_mulai TEXT,
     tanggal_selesai TEXT,
     keperluan TEXT,
     kode_inventaris TEXT,
     deskripsi_kerusakan TEXT,
     status TEXT NOT NULL DEFAULT 'menunggu'
       CHECK (status IN ('menunggu', 'disetujui', 'ditolak')),
     catatan_admin TEXT,
     diproses_oleh INTEGER REFERENCES users(id),
     diproses_pada TEXT,
     created_at TEXT NOT NULL,
     updated_at TEXT NOT NULL
   )`,
  `CREATE TABLE IF NOT EXISTS sessions (
     token TEXT PRIMARY KEY,
     user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
     expires_at INTEGER NOT NULL
   )`,
  // Rate limit login serverless (pengganti Map in-memory di server.js).
  `CREATE TABLE IF NOT EXISTS login_attempts (
     ip TEXT PRIMARY KEY,
     gagal_count INTEGER NOT NULL DEFAULT 0,
     reset_at INTEGER NOT NULL
   )`,
  'CREATE INDEX IF NOT EXISTS idx_pengajuan_user ON pengajuan(user_id)',
  'CREATE INDEX IF NOT EXISTS idx_pengajuan_status ON pengajuan(status)',
  'CREATE INDEX IF NOT EXISTS idx_sessions_expires ON sessions(expires_at)',
];

async function seedUsers(c) {
  const now = new Date().toISOString();
  if (IS_PROD) {
    // Produksi: JANGAN seed akun demo. Bootstrap admin hanya dari env,
    // dan hanya saat tabel users masih kosong. Password tidak pernah di-log.
    const countRow = await c.execute('SELECT COUNT(*) AS c FROM users');
    if (Number(countRow.rows[0].c) > 0) return;
    const adminUser = (process.env.ADMIN_USERNAME || '').trim();
    const adminPass = process.env.ADMIN_PASSWORD || '';
    if (!adminUser || !adminPass) {
      console.warn(
        '[db] PRODUKSI: tabel users kosong dan ADMIN_USERNAME/ADMIN_PASSWORD tidak diset. ' +
          'Tidak ada akun yang dibuat. Set kedua env var lalu coba lagi.'
      );
      return;
    }
    if (adminPass.length < 12) {
      console.warn('[db] PERINGATAN: ADMIN_PASSWORD kurang dari 12 karakter.');
    }
    await c.execute({
      sql: 'INSERT OR IGNORE INTO users (username, password_hash, nama, role, status, created_at) VALUES (?, ?, ?, ?, ?, ?)',
      args: [adminUser, hashPassword(adminPass), 'Administrator', 'admin', 'aktif', now],
    });
    console.log(`[db] akun admin awal "${adminUser}" dibuat dari environment variables.`);
    const mhsUser = (process.env.MAHASISWA_USERNAME || '').trim();
    const mhsPass = process.env.MAHASISWA_PASSWORD || '';
    if (mhsUser && mhsPass) {
      await c.execute({
        sql: 'INSERT OR IGNORE INTO users (username, password_hash, nama, role, status, created_at) VALUES (?, ?, ?, ?, ?, ?)',
        args: [mhsUser, hashPassword(mhsPass), 'Mahasiswa Demo', 'mahasiswa', 'aktif', now],
      });
      console.log(`[db] akun mahasiswa demo "${mhsUser}" dibuat dari environment variables.`);
    }
    return;
  }
  // Dev/test: akun demo untuk kemudahan pengujian lokal (sama seperti server.js).
  const seeds = [
    { username: 'admin', password: 'Demo123!', nama: 'Administrator', role: 'admin' },
    { username: 'mahasiswa', password: 'Demo123!', nama: 'Mahasiswa Demo', role: 'mahasiswa' },
  ];
  for (const s of seeds) {
    await c.execute({
      sql: 'INSERT OR IGNORE INTO users (username, password_hash, nama, role, status, created_at) VALUES (?, ?, ?, ?, ?, ?)',
      args: [s.username, hashPassword(s.password), s.nama, s.role, 'aktif', now],
    });
  }
}

/**
 * Pastikan skema + seed siap. Aman dipanggil di setiap invocation
 * (idempotent; batch CREATE TABLE IF NOT EXISTS murah di Turso).
 */
async function ensureReady() {
  if (!readyPromise) {
    readyPromise = (async () => {
      const c = getClient();
      await c.batch(SCHEMA_STATEMENTS.map((sql) => ({ sql, args: [] })), 'write');
      await seedUsers(c);
      return c;
    })().catch((err) => {
      readyPromise = null; // izinkan retry di invocation berikutnya
      throw err;
    });
  }
  return readyPromise;
}

/** Untuk pengujian: reset singleton antar skenario. */
function _resetForTest() {
  if (client) {
    try { client.close(); } catch { /* abaikan */ }
  }
  client = null;
  readyPromise = null;
}

module.exports = { getClient, ensureReady, hashPassword, verifyPassword, _resetForTest };
