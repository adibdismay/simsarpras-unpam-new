/* ============================================================
   SIMSARPRAS UNPAM — Backend terpadu (tanpa dependensi npm)
   Node.js stdlib saja: node:http + node:sqlite + node:crypto.

   Menjalankan:
     node server.js            # http://localhost:3000
     PORT=8080 node server.js
     SIMSARPRAS_DB=/path/ke/db.sqlite node server.js

   Tanggung jawab:
   - Menyajikan frontend statis (satu origin dengan API).
   - Autentikasi sesi (cookie httpOnly) + hak akses role.
   - API pengajuan: mahasiswa mengajukan (peminjaman/perbaikan),
     admin memvalidasi (setujui/tolak). Status konsisten di SQLite.

   Data gedung/ruangan/fasilitas (inventaris) SENGAJA tetap
   menjadi data dummy di localStorage frontend (keputusan proyek).
   ============================================================ */
'use strict';

const http = require('node:http');
const path = require('node:path');
const fs = require('node:fs');
const crypto = require('node:crypto');
const { DatabaseSync } = require('node:sqlite');

const ROOT_DIR = __dirname;
const PORT = Number(process.env.PORT || 3000);
const DB_PATH = process.env.SIMSARPRAS_DB || path.join(ROOT_DIR, 'data', 'simsarpras.db');
const SESSION_TTL_MS = 12 * 60 * 60 * 1000; // 12 jam
const SESSION_COOKIE = 'simsarpras.sid';
const MAX_BODY_BYTES = 256 * 1024; // 256 KB

// Lingkungan: 'production' menonaktifkan akun demo & mengharuskan bootstrap admin via env.
const NODE_ENV = process.env.NODE_ENV || 'development';
const IS_PROD = NODE_ENV === 'production';

const JENIS_PENGAJUAN = ['peminjaman', 'perbaikan'];
const STATUS_MENUNGGU = 'menunggu';
const STATUS_AKHIR = ['disetujui', 'ditolak'];

/* ---------------- Database ---------------- */

function openDatabase() {
  fs.mkdirSync(path.dirname(DB_PATH), { recursive: true });
  const db = new DatabaseSync(DB_PATH);
  db.exec('PRAGMA journal_mode = WAL;');
  db.exec(`
    CREATE TABLE IF NOT EXISTS users (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      username TEXT UNIQUE NOT NULL,
      password_hash TEXT NOT NULL,
      nama TEXT NOT NULL,
      role TEXT NOT NULL CHECK (role IN ('admin', 'mahasiswa')),
      status TEXT NOT NULL DEFAULT 'aktif',
      created_at TEXT NOT NULL
    );
    CREATE TABLE IF NOT EXISTS pengajuan (
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
    );
    CREATE TABLE IF NOT EXISTS sessions (
      token TEXT PRIMARY KEY,
      user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
      expires_at INTEGER NOT NULL
    );
    CREATE INDEX IF NOT EXISTS idx_pengajuan_user ON pengajuan(user_id);
    CREATE INDEX IF NOT EXISTS idx_pengajuan_status ON pengajuan(status);
    CREATE INDEX IF NOT EXISTS idx_sessions_expires ON sessions(expires_at);
  `);
  return db;
}

/* scrypt tanpa dependensi: format "saltHex:hashHex" */
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

function seedUsers(db) {
  const now = new Date().toISOString();
  const insert = db.prepare(
    'INSERT OR IGNORE INTO users (username, password_hash, nama, role, status, created_at) VALUES (?, ?, ?, ?, ?, ?)'
  );
  if (IS_PROD) {
    // Produksi: JANGAN pernah seed akun demo. Bootstrap admin hanya dari env,
    // dan hanya saat tabel users masih kosong. Password tidak pernah dicetak ke log.
    const existing = db.prepare('SELECT COUNT(*) AS c FROM users').get().c;
    if (existing > 0) return;
    const adminUser = (process.env.ADMIN_USERNAME || '').trim();
    const adminPass = process.env.ADMIN_PASSWORD || '';
    if (!adminUser || !adminPass) {
      console.warn(
        '[server] PRODUKSI: tabel users kosong dan ADMIN_USERNAME/ADMIN_PASSWORD tidak diset. ' +
        'Tidak ada akun yang dibuat. Set kedua env var lalu restart server.'
      );
      return;
    }
    if (adminPass.length < 12) {
      console.warn('[server] PERINGATAN: ADMIN_PASSWORD kurang dari 12 karakter. Gunakan password yang lebih kuat.');
    }
    insert.run(adminUser, hashPassword(adminPass), 'Administrator', 'admin', 'aktif', now);
    console.log(`[server] akun admin awal "${adminUser}" dibuat dari environment variables.`);
    return;
  }
  // Dev/test: akun demo untuk kemudahan pengujian lokal.
  const seeds = [
    { username: 'admin', password: 'Demo123!', nama: 'Administrator', role: 'admin' },
    { username: 'mahasiswa', password: 'Demo123!', nama: 'Mahasiswa Demo', role: 'mahasiswa' },
  ];
  for (const s of seeds) {
    insert.run(s.username, hashPassword(s.password), s.nama, s.role, 'aktif', now);
  }
}

const db = openDatabase();
seedUsers(db);

/* ---------------- Util HTTP ---------------- */

const MIME = {
  '.html': 'text/html; charset=utf-8',
  '.css': 'text/css; charset=utf-8',
  '.js': 'text/javascript; charset=utf-8',
  '.json': 'application/json; charset=utf-8',
  '.png': 'image/png',
  '.jpg': 'image/jpeg',
  '.jpeg': 'image/jpeg',
  '.svg': 'image/svg+xml',
  '.ico': 'image/x-icon',
  '.woff': 'font/woff',
  '.woff2': 'font/woff2',
  '.ttf': 'font/ttf',
  '.map': 'application/json; charset=utf-8',
};

function sendJson(res, status, obj, extraHeaders) {
  const body = JSON.stringify(obj);
  res.writeHead(status, {
    'Content-Type': 'application/json; charset=utf-8',
    'Content-Length': Buffer.byteLength(body),
    ...(extraHeaders || {}),
  });
  res.end(body);
}

function readBody(req) {
  return new Promise((resolve, reject) => {
    let size = 0;
    const chunks = [];
    req.on('data', (c) => {
      size += c.length;
      if (size > MAX_BODY_BYTES) {
        reject(new Error('Body terlalu besar'));
        req.destroy();
        return;
      }
      chunks.push(c);
    });
    req.on('end', () => resolve(Buffer.concat(chunks).toString('utf8')));
    req.on('error', reject);
  });
}

async function readJsonBody(req) {
  const text = await readBody(req);
  if (!text) return {};
  try {
    const parsed = JSON.parse(text);
    if (parsed === null || typeof parsed !== 'object' || Array.isArray(parsed)) {
      throw new Error('bukan objek');
    }
    return parsed;
  } catch {
    throw new Error('Body bukan JSON yang valid');
  }
}

function parseCookies(req) {
  const out = {};
  const header = req.headers.cookie;
  if (!header) return out;
  for (const part of header.split(';')) {
    const i = part.indexOf('=');
    if (i === -1) continue;
    out[part.slice(0, i).trim()] = decodeURIComponent(part.slice(i + 1).trim());
  }
  return out;
}

function isHttpsRequest(req) {
  // Railway & reverse proxy sejenis menghentikan TLS di edge dan meneruskan
  // 'x-forwarded-proto: https'. Override eksplisit via COOKIE_SECURE=1/0.
  if (process.env.COOKIE_SECURE === '1') return true;
  if (process.env.COOKIE_SECURE === '0') return false;
  const proto = req.headers['x-forwarded-proto'];
  return typeof proto === 'string' && proto.split(',')[0].trim().toLowerCase() === 'https';
}

function sessionCookieHeader(token, maxAgeSec, secure) {
  // httpOnly: tidak bisa dibaca JS (anti XSS); SameSite=Lax cukup untuk satu origin.
  // Secure hanya saat HTTPS agar pengujian lokal via HTTP tidak rusak.
  return `${SESSION_COOKIE}=${token}; Path=/; HttpOnly; SameSite=Lax; Max-Age=${maxAgeSec}${secure ? '; Secure' : ''}`;
}

function clearSessionCookieHeader(secure) {
  return `${SESSION_COOKIE}=; Path=/; HttpOnly; SameSite=Lax; Max-Age=0${secure ? '; Secure' : ''}`;
}

/* ---------------- Rate limiting login ---------------- */
// Sederhana & in-memory: maks 10 percobaan gagal per IP tiap 15 menit.
// Cukup untuk menghambat brute force pada satu instance.
const LOGIN_RL_WINDOW_MS = 15 * 60 * 1000;
const LOGIN_RL_MAX_FAILS = 10;
const loginFailures = new Map(); // ip -> { count, resetAt }

function loginRateLimitStatus(ip) {
  const now = Date.now();
  const rec = loginFailures.get(ip);
  if (!rec || now >= rec.resetAt) {
    loginFailures.set(ip, { count: 0, resetAt: now + LOGIN_RL_WINDOW_MS });
    return { limited: false, remaining: LOGIN_RL_MAX_FAILS };
  }
  return { limited: rec.count >= LOGIN_RL_MAX_FAILS, remaining: Math.max(0, LOGIN_RL_MAX_FAILS - rec.count) };
}

function loginRateLimitFail(ip) {
  const now = Date.now();
  let rec = loginFailures.get(ip);
  if (!rec || now >= rec.resetAt) rec = { count: 0, resetAt: now + LOGIN_RL_WINDOW_MS };
  rec.count += 1;
  loginFailures.set(ip, rec);
}

function loginRateLimitReset(ip) {
  loginFailures.delete(ip);
}

function clientIp(req) {
  const fwd = req.headers['x-forwarded-for'];
  if (typeof fwd === 'string' && fwd.length > 0) return fwd.split(',')[0].trim();
  return (req.socket && req.socket.remoteAddress) || 'unknown';
}

// Bersihkan entri kedaluwarsa tiap 5 menit agar Map tidak membesar.
setInterval(() => {
  const now = Date.now();
  for (const [ip, rec] of loginFailures) {
    if (now >= rec.resetAt) loginFailures.delete(ip);
  }
}, 5 * 60 * 1000).unref();

/* ---------------- Sesi & auth ---------------- */

function createSession(userId) {
  const token = crypto.randomBytes(32).toString('hex');
  const expiresAt = Date.now() + SESSION_TTL_MS;
  db.prepare('INSERT INTO sessions (token, user_id, expires_at) VALUES (?, ?, ?)')
    .run(token, userId, expiresAt);
  return { token, expiresAt };
}

function destroySession(token) {
  if (token) db.prepare('DELETE FROM sessions WHERE token = ?').run(token);
}

function getSessionUser(req) {
  const { [SESSION_COOKIE]: token } = parseCookies(req);
  if (!token) return null;
  const row = db
    .prepare(
      `SELECT s.token, s.expires_at, u.id, u.username, u.nama, u.role, u.status
       FROM sessions s JOIN users u ON u.id = s.user_id WHERE s.token = ?`
    )
    .get(token);
  if (!row) return null;
  if (row.expires_at < Date.now() || row.status !== 'aktif') {
    destroySession(token);
    return null;
  }
  return { id: row.id, username: row.username, nama: row.nama, role: row.role, token };
}

function publicUser(u) {
  return { id: u.id, username: u.username, nama: u.nama, role: u.role };
}

function requireAuth(req, res) {
  const user = getSessionUser(req);
  if (!user) {
    sendJson(res, 401, { ok: false, errors: ['Sesi berakhir atau belum login. Silakan login kembali.'] });
    return null;
  }
  return user;
}

function requireAdmin(req, res) {
  const user = requireAuth(req, res);
  if (!user) return null;
  if (user.role !== 'admin') {
    sendJson(res, 403, { ok: false, errors: ['Hanya admin yang dapat melakukan aksi ini.'] });
    return null;
  }
  return user;
}

/* ---------------- Validasi pengajuan ---------------- */

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

/* ---------------- Handler API ---------------- */

async function handleApi(req, res, url) {
  const method = req.method;
  const pathname = url.pathname;

  // --- health ---
  if (pathname === '/api/health' && method === 'GET') {
    return sendJson(res, 200, { ok: true, time: new Date().toISOString() });
  }

  // --- login ---
  if (pathname === '/api/auth/login' && method === 'POST') {
    const ip = clientIp(req);
    const rl = loginRateLimitStatus(ip);
    if (rl.limited) {
      return sendJson(res, 429, { ok: false, errors: ['Terlalu banyak percobaan login. Coba lagi nanti.'] }, { 'Retry-After': '900' });
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
    const user = db.prepare('SELECT * FROM users WHERE username = ?').get(username);
    if (!user || user.status !== 'aktif' || !verifyPassword(password, user.password_hash)) {
      loginRateLimitFail(ip);
      return sendJson(res, 401, { ok: false, errors: ['Username atau kata sandi salah.'] });
    }
    loginRateLimitReset(ip);
    const { token } = createSession(user.id);
    const secure = isHttpsRequest(req);
    return sendJson(
      res,
      200,
      { ok: true, user: publicUser(user) },
      { 'Set-Cookie': sessionCookieHeader(token, Math.floor(SESSION_TTL_MS / 1000), secure) }
    );
  }

  // --- logout ---
  if (pathname === '/api/auth/logout' && method === 'POST') {
    const { [SESSION_COOKIE]: token } = parseCookies(req);
    destroySession(token);
    return sendJson(res, 200, { ok: true }, { 'Set-Cookie': clearSessionCookieHeader(isHttpsRequest(req)) });
  }

  // --- me ---
  if (pathname === '/api/auth/me' && method === 'GET') {
    const user = getSessionUser(req);
    if (!user) return sendJson(res, 401, { ok: false, errors: ['Belum login.'] });
    return sendJson(res, 200, { ok: true, user: publicUser(user) });
  }

  // --- daftar pengajuan ---
  if (pathname === '/api/pengajuan' && method === 'GET') {
    const user = requireAuth(req, res);
    if (!user) return;
    const status = url.searchParams.get('status');
    const jenis = url.searchParams.get('jenis');
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
    const rows = db
      .prepare(`${PENGAJUAN_SELECT} ${where} ORDER BY p.created_at DESC, p.id DESC`)
      .all(...params);
    return sendJson(res, 200, { ok: true, data: rows.map(rowToPengajuan) });
  }

  // --- buat pengajuan ---
  if (pathname === '/api/pengajuan' && method === 'POST') {
    const user = requireAuth(req, res);
    if (!user) return;
    let body;
    try {
      body = await readJsonBody(req);
    } catch (e) {
      return sendJson(res, 400, { ok: false, errors: [e.message] });
    }
    const { valid, errors, data } = validatePengajuanInput(body);
    if (!valid) return sendJson(res, 400, { ok: false, errors });
    const now = new Date().toISOString();
    const info = db
      .prepare(
        `INSERT INTO pengajuan
           (user_id, jenis, fasilitas, tanggal_mulai, tanggal_selesai, keperluan,
            kode_inventaris, deskripsi_kerusakan, status, created_at, updated_at)
         VALUES (?, ?, ?, ?, ?, ?, ?, ?, 'menunggu', ?, ?)`
      )
      .run(
        user.id,
        data.jenis,
        data.fasilitas || null,
        data.tanggal_mulai || null,
        data.tanggal_selesai || null,
        data.keperluan || null,
        data.kode_inventaris || null,
        data.deskripsi_kerusakan || null,
        now,
        now
      );
    const row = db.prepare(`${PENGAJUAN_SELECT} WHERE p.id = ?`).get(Number(info.lastInsertRowid));
    return sendJson(res, 201, { ok: true, data: rowToPengajuan(row) });
  }

  // --- detail / validasi satu pengajuan ---
  const idMatch = pathname.match(/^\/api\/pengajuan\/(\d+)$/);
  if (idMatch) {
    const id = Number(idMatch[1]);

    if (method === 'GET') {
      const user = requireAuth(req, res);
      if (!user) return;
      const row = db.prepare(`${PENGAJUAN_SELECT} WHERE p.id = ?`).get(id);
      if (!row) return sendJson(res, 404, { ok: false, errors: ['Pengajuan tidak ditemukan.'] });
      if (user.role !== 'admin' && row.user_id !== user.id) {
        return sendJson(res, 403, { ok: false, errors: ['Tidak berhak melihat pengajuan ini.'] });
      }
      return sendJson(res, 200, { ok: true, data: rowToPengajuan(row) });
    }

    if (method === 'PATCH') {
      const admin = requireAdmin(req, res);
      if (!admin) return;
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
        return sendJson(res, 400, {
          ok: false,
          errors: ['Status harus "disetujui" atau "ditolak".'],
        });
      }
      const row = db.prepare('SELECT * FROM pengajuan WHERE id = ?').get(id);
      if (!row) return sendJson(res, 404, { ok: false, errors: ['Pengajuan tidak ditemukan.'] });
      if (row.status !== STATUS_MENUNGGU) {
        return sendJson(res, 409, {
          ok: false,
          errors: [`Pengajuan sudah diproses sebelumnya (status: ${row.status}).`],
        });
      }
      const now = new Date().toISOString();
      db.prepare(
        `UPDATE pengajuan SET status = ?, catatan_admin = ?, diproses_oleh = ?,
         diproses_pada = ?, updated_at = ? WHERE id = ?`
      ).run(status, catatanAdmin || null, admin.id, now, now, id);
      const updated = db.prepare(`${PENGAJUAN_SELECT} WHERE p.id = ?`).get(id);
      return sendJson(res, 200, { ok: true, data: rowToPengajuan(updated) });
    }

    return sendJson(res, 405, { ok: false, errors: ['Metode tidak didukung.'] });
  }

  return sendJson(res, 404, { ok: false, errors: ['Endpoint API tidak ditemukan.'] });
}

/* ---------------- File statis ---------------- */

const BLOCKED_PREFIXES = ['/.git/', '/data/', '/test/', '/node_modules/'];
const BLOCKED_FILES = new Set(['/server.js', '/.gitignore']);

function serveStatic(req, res, url) {
  let pathname = decodeURIComponent(url.pathname);
  if (pathname.endsWith('/')) pathname += 'index.html';

  const normalized = path.normalize(pathname).replace(/^(\.\.[/\\])+/, '');
  const filePath = path.join(ROOT_DIR, normalized);

  // Cegah path traversal + file internal.
  if (!filePath.startsWith(ROOT_DIR + path.sep)) {
    res.writeHead(403, { 'Content-Type': 'text/plain; charset=utf-8' });
    return res.end('Forbidden');
  }
  const rel = '/' + path.relative(ROOT_DIR, filePath).replace(/\\/g, '/');
  if (BLOCKED_FILES.has(rel) || BLOCKED_PREFIXES.some((p) => rel.startsWith(p))) {
    res.writeHead(403, { 'Content-Type': 'text/plain; charset=utf-8' });
    return res.end('Forbidden');
  }

  fs.stat(filePath, (err, stat) => {
    if (err || !stat.isFile()) {
      res.writeHead(404, { 'Content-Type': 'text/plain; charset=utf-8' });
      return res.end('Not found');
    }
    const ext = path.extname(filePath).toLowerCase();
    res.writeHead(200, {
      'Content-Type': MIME[ext] || 'application/octet-stream',
      'Content-Length': stat.size,
      'Cache-Control': 'no-store',
    });
    fs.createReadStream(filePath).pipe(res);
  });
}

/* ---------------- Security headers ---------------- */
function securityHeaders(req) {
  const h = {
    'X-Content-Type-Options': 'nosniff',
    'X-Frame-Options': 'DENY',
    'Referrer-Policy': 'no-referrer',
  };
  // HSTS hanya saat HTTPS (jangan di localhost HTTP agar tidak mengunci browser).
  if (isHttpsRequest(req)) {
    h['Strict-Transport-Security'] = 'max-age=31536000; includeSubDomains';
  }
  return h;
}

/* ---------------- Server ---------------- */

const server = http.createServer(async (req, res) => {
  try {
    for (const [k, v] of Object.entries(securityHeaders(req))) res.setHeader(k, v);
    const url = new URL(req.url, `http://${req.headers.host || 'localhost'}`);
    if (url.pathname === '/api' || url.pathname.startsWith('/api/')) {
      await handleApi(req, res, url);
    } else {
      serveStatic(req, res, url);
    }
  } catch (err) {
    console.error('[server] error:', err);
    if (!res.headersSent) {
      sendJson(res, 500, { ok: false, errors: ['Terjadi kesalahan pada server.'] });
    } else {
      res.end();
    }
  }
});

// Bersihkan sesi kedaluwarsa tiap jam.
setInterval(() => {
  try {
    db.prepare('DELETE FROM sessions WHERE expires_at < ?').run(Date.now());
  } catch (err) {
    console.error('[server] cleanup sesi gagal:', err.message);
  }
}, 60 * 60 * 1000).unref();

server.listen(PORT, () => {
  console.log(`SIMSARPRAS UNPAM berjalan di http://localhost:${PORT}`);
  console.log(`Database: ${DB_PATH}`);
});

module.exports = { server, db };
