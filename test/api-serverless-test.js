/* ============================================================
   SIMSARPRAS UNPAM — Tes API serverless (Vercel Functions)
   Menguji handler di api/ secara langsung (mock req/res) dengan
   database libSQL file lokal sementara — tanpa Turso, tanpa server HTTP.

   Cara pakai:  node test/api-serverless-test.js
   Keluar 0 = semua lolos; keluar 1 = ada yang gagal.

   Cakupan: health, CORS preflight + origin jahat, login admin/mhs,
   token Bearer, validasi pengajuan, hak akses role, approval admin,
   409 double-validasi, logout mencabut sesi, sesi kedaluwarsa,
   rate limit login 429, cookie fallback, kebocoran secret.
   ============================================================ */
'use strict';

const path = require('node:path');
const fs = require('node:fs');
const os = require('node:os');
const assert = require('node:assert');

const TEST_DB = path.join(fs.mkdtempSync(path.join(os.tmpdir(), 'simsarpras-sls-')), 'test.db');
process.env.LIBSQL_LOCAL_PATH = TEST_DB;
process.env.NODE_ENV = 'development'; // seed akun demo admin/mahasiswa
delete process.env.TURSO_DATABASE_URL;

const ROOT = path.join(__dirname, '..');
const health = require('../api/health');
const login = require('../api/auth/login');
const logout = require('../api/auth/logout');
const me = require('../api/auth/me');
const pengajuanIndex = require('../api/pengajuan/index');
const pengajuanById = require('../api/pengajuan/[id]');
const { getClient, ensureReady, hashPassword } = require('../lib/db');

let passed = 0;
let failed = 0;
const failures = [];

async function test(name, fn) {
  try {
    await fn();
    passed++;
    console.log('  OK  ' + name);
  } catch (e) {
    failed++;
    failures.push(name + ' — ' + e.message);
    console.log('  FAIL ' + name + ' — ' + e.message);
  }
}

/* ---------- mock req/res ---------- */

function mockRes() {
  const res = {
    statusCode: 200,
    headers: {},
    body: '',
    headersSent: false,
    setHeader(k, v) { this.headers[k.toLowerCase()] = v; },
    getHeader(k) { return this.headers[k.toLowerCase()]; },
    writeHead(status, headers) {
      this.statusCode = status;
      this.headersSent = true;
      for (const [k, v] of Object.entries(headers || {})) this.headers[k.toLowerCase()] = v;
    },
    end(body) { this.body = body || ''; },
  };
  return res;
}

function mockReq({ method = 'GET', headers = {}, query = {}, body, url = '/', ip = '127.0.0.1' } = {}) {
  const req = {
    method,
    headers: Object.fromEntries(Object.entries(headers).map(([k, v]) => [k.toLowerCase(), v])),
    query,
    url,
    socket: { remoteAddress: ip },
  };
  if (body !== undefined) req.body = body;
  return req;
}

function json(res) {
  try { return JSON.parse(res.body); } catch { return null; }
}

/** Panggil handler; kembalikan { res, data }. */
async function call(handler, opts) {
  const req = mockReq(opts);
  const res = mockRes();
  await handler(req, res);
  return { res, data: json(res) };
}

const bearer = (token) => ({ authorization: 'Bearer ' + token });
const PAGES_ORIGIN = 'https://adibdismay.github.io';

/** Pastikan tidak ada secret bocor di body respons. */
function assertNoLeak(res) {
  const text = res.body || '';
  assert(!text.includes('password_hash'), 'respons membocorkan password_hash');
  assert(!text.includes('TURSO_AUTH_TOKEN'), 'respons membocorkan token Turso');
}

async function main() {
  await ensureReady();
  const c = getClient();

  // Akun mahasiswa kedua untuk uji isolasi antar-user.
  const now = new Date().toISOString();
  await c.execute({
    sql: "INSERT OR IGNORE INTO users (username, password_hash, nama, role, status, created_at) VALUES (?, ?, ?, 'mahasiswa', 'aktif', ?)",
    args: ['mahasiswa2', hashPassword('Demo123!'), 'Mahasiswa Dua', now],
  });

  let adminToken, mhsToken, mhs2Token, pengajuanId, pengajuanId2;

  /* ---- health & security headers ---- */
  await test('health: GET /api/health -> 200 {ok:true}', async () => {
    const { res, data } = await call(health, { method: 'GET' });
    assert.strictEqual(res.statusCode, 200);
    assert(data && data.ok === true && typeof data.time === 'string');
    assertNoLeak(res);
  });

  await test('security headers terpasang di respons API', async () => {
    const { res } = await call(health, { method: 'GET' });
    assert.strictEqual(res.headers['x-content-type-options'], 'nosniff');
    assert.strictEqual(res.headers['x-frame-options'], 'DENY');
    assert.strictEqual(res.headers['referrer-policy'], 'no-referrer');
    assert.ok(res.headers['strict-transport-security'], 'HSTS hilang');
    assert.ok(res.headers['content-security-policy'], 'CSP hilang');
  });

  await test('CORS preflight dari origin Pages -> 204 + Allow-Origin exact', async () => {
    const { res } = await call(login, {
      method: 'OPTIONS',
      headers: { origin: PAGES_ORIGIN, 'access-control-request-method': 'POST' },
    });
    assert.strictEqual(res.statusCode, 204);
    assert.strictEqual(res.headers['access-control-allow-origin'], PAGES_ORIGIN);
    assert.ok((res.headers['access-control-allow-headers'] || '').toLowerCase().includes('authorization'));
  });

  await test('CORS: origin jahat tidak mendapat Allow-Origin', async () => {
    const { res } = await call(me, { method: 'GET', headers: { origin: 'https://evil.com' } });
    assert.strictEqual(res.statusCode, 401); // tetap 401 tanpa token
    assert.strictEqual(res.headers['access-control-allow-origin'], undefined);
  });

  /* ---- login ---- */
  await test('login admin sukses -> token + user tanpa password_hash', async () => {
    const { res, data } = await call(login, {
      method: 'POST',
      body: { username: 'admin', password: 'Demo123!' },
      ip: '10.0.0.1',
    });
    assert.strictEqual(res.statusCode, 200);
    assert(data.ok === true && typeof data.token === 'string' && data.token.length >= 32);
    assert.strictEqual(data.user.role, 'admin');
    assertNoLeak(res);
    adminToken = data.token;
  });

  await test('login password salah -> 401', async () => {
    const { res, data } = await call(login, {
      method: 'POST', body: { username: 'admin', password: 'salah' }, ip: '10.0.0.2',
    });
    assert.strictEqual(res.statusCode, 401);
    assert.ok(data.errors.length > 0);
  });

  await test('login field kosong -> 400', async () => {
    const { res } = await call(login, { method: 'POST', body: { username: '', password: '' }, ip: '10.0.0.3' });
    assert.strictEqual(res.statusCode, 400);
  });

  await test('login body bukan JSON valid -> 400', async () => {
    const req = mockReq({ method: 'POST', ip: '10.0.0.4' });
    req.body = undefined;
    // simulasi stream body rusak via EventEmitter tidak tersedia di mock;
    // sebagai gantinya uji readJsonBody lewat body string mentah:
    const { readJsonBody } = require('../lib/security');
    const badReq = mockReq({ method: 'POST' });
    badReq.body = '{bukan json';
    await assert.rejects(readJsonBody(badReq), /bukan JSON/);
    void req;
  });

  /* ---- sesi / me ---- */
  await test('me dengan Bearer token valid -> 200', async () => {
    const { res, data } = await call(me, { method: 'GET', headers: bearer(adminToken) });
    assert.strictEqual(res.statusCode, 200);
    assert.strictEqual(data.user.username, 'admin');
    assertNoLeak(res);
  });

  await test('me tanpa token -> 401', async () => {
    const { res } = await call(me, { method: 'GET' });
    assert.strictEqual(res.statusCode, 401);
  });

  await test('me dengan token sampah -> 401', async () => {
    const { res } = await call(me, { method: 'GET', headers: bearer('token-tidak-valid') });
    assert.strictEqual(res.statusCode, 401);
  });

  await test('cookie fallback simsarpras.sid tetap didukung', async () => {
    const { res, data } = await call(me, {
      method: 'GET',
      headers: { cookie: 'simsarpras.sid=' + adminToken },
    });
    assert.strictEqual(res.statusCode, 200);
    assert.strictEqual(data.user.username, 'admin');
  });

  /* ---- pengajuan: mahasiswa ---- */
  await test('login mahasiswa sukses', async () => {
    const { data } = await call(login, {
      method: 'POST', body: { username: 'mahasiswa', password: 'Demo123!' }, ip: '10.0.0.5',
    });
    assert(data.ok === true && data.user.role === 'mahasiswa');
    mhsToken = data.token;
    const r2 = await call(login, {
      method: 'POST', body: { username: 'mahasiswa2', password: 'Demo123!' }, ip: '10.0.0.6',
    });
    mhs2Token = r2.data.token;
  });

  await test('mahasiswa: daftar pengajuan awal kosong', async () => {
    const { res, data } = await call(pengajuanIndex, { method: 'GET', headers: bearer(mhsToken) });
    assert.strictEqual(res.statusCode, 200);
    assert.deepStrictEqual(data.data, []);
  });

  await test('mahasiswa: buat peminjaman valid -> 201 menunggu', async () => {
    const { res, data } = await call(pengajuanIndex, {
      method: 'POST',
      headers: bearer(mhsToken),
      body: {
        jenis: 'peminjaman', fasilitas: 'Ruang Rapat A',
        tanggal_mulai: '2026-11-01', tanggal_selesai: '2026-11-02',
        keperluan: 'Rapat koordinasi',
      },
    });
    assert.strictEqual(res.statusCode, 201);
    assert.strictEqual(data.data.status, 'menunggu');
    assert.strictEqual(data.data.fasilitas, 'Ruang Rapat A');
    assert.ok(data.data.id > 0);
    pengajuanId = data.data.id;
  });

  await test('validasi: tanggal selesai sebelum mulai -> 400', async () => {
    const { res, data } = await call(pengajuanIndex, {
      method: 'POST',
      headers: bearer(mhsToken),
      body: {
        jenis: 'peminjaman', fasilitas: 'Aula',
        tanggal_mulai: '2026-11-05', tanggal_selesai: '2026-11-01',
        keperluan: 'Acara',
      },
    });
    assert.strictEqual(res.statusCode, 400);
    assert.ok(data.errors.length > 0);
  });

  await test('validasi: perbaikan tanpa kode inventaris -> 400', async () => {
    const { res } = await call(pengajuanIndex, {
      method: 'POST',
      headers: bearer(mhsToken),
      body: { jenis: 'perbaikan', kode_inventaris: '', deskripsi_kerusakan: 'Rusak' },
    });
    assert.strictEqual(res.statusCode, 400);
  });

  await test('mahasiswa: buat perbaikan valid -> 201', async () => {
    const { res, data } = await call(pengajuanIndex, {
      method: 'POST',
      headers: bearer(mhsToken),
      body: { jenis: 'perbaikan', kode_inventaris: 'INV-001', deskripsi_kerusakan: 'Layar retak' },
    });
    assert.strictEqual(res.statusCode, 201);
    assert.strictEqual(data.data.jenis, 'perbaikan');
    pengajuanId2 = data.data.id;
  });

  await test('filter ?status=menunggu & ?jenis=perbaikan', async () => {
    const { data } = await call(pengajuanIndex, {
      method: 'GET', headers: bearer(mhsToken), query: { status: 'menunggu' },
    });
    assert.strictEqual(data.data.length, 2);
    const { data: d2 } = await call(pengajuanIndex, {
      method: 'GET', headers: bearer(mhsToken), query: { jenis: 'perbaikan' },
    });
    assert.strictEqual(d2.data.length, 1);
    const { res } = await call(pengajuanIndex, {
      method: 'GET', headers: bearer(mhsToken), query: { status: 'ngawur' },
    });
    assert.strictEqual(res.statusCode, 400);
  });

  /* ---- isolasi antar user & role ---- */
  await test('mahasiswa lain tidak bisa lihat detail milik orang -> 403', async () => {
    const { res } = await call(pengajuanById, {
      method: 'GET', headers: bearer(mhs2Token), query: { id: String(pengajuanId) },
    });
    assert.strictEqual(res.statusCode, 403);
  });

  await test('admin bisa lihat semua + detail milik siapa pun -> 200', async () => {
    const { res, data } = await call(pengajuanIndex, { method: 'GET', headers: bearer(adminToken) });
    assert.strictEqual(res.statusCode, 200);
    assert.strictEqual(data.data.length, 2);
    const { res: r2, data: d2 } = await call(pengajuanById, {
      method: 'GET', headers: bearer(adminToken), query: { id: String(pengajuanId) },
    });
    assert.strictEqual(r2.statusCode, 200);
    assert.strictEqual(d2.data.pengaju_username, 'mahasiswa');
  });

  await test('mahasiswa PATCH (validasi) -> 403', async () => {
    const { res } = await call(pengajuanById, {
      method: 'PATCH', headers: bearer(mhsToken),
      query: { id: String(pengajuanId) }, body: { status: 'disetujui' },
    });
    assert.strictEqual(res.statusCode, 403);
  });

  await test('tanpa token: GET daftar -> 401, POST -> 401', async () => {
    const { res: r1 } = await call(pengajuanIndex, { method: 'GET' });
    const { res: r2 } = await call(pengajuanIndex, { method: 'POST', body: { jenis: 'peminjaman' } });
    assert.strictEqual(r1.statusCode, 401);
    assert.strictEqual(r2.statusCode, 401);
  });

  /* ---- approval admin ---- */
  await test('admin setujui pengajuan -> 200 disetujui + pencatat', async () => {
    const { res, data } = await call(pengajuanById, {
      method: 'PATCH', headers: bearer(adminToken),
      query: { id: String(pengajuanId) }, body: { status: 'disetujui', catatan_admin: 'Silakan pakai' },
    });
    assert.strictEqual(res.statusCode, 200);
    assert.strictEqual(data.data.status, 'disetujui');
    assert.strictEqual(data.data.catatan_admin, 'Silakan pakai');
    assert.ok(data.data.diproses_pada);
    assert.strictEqual(data.data.diproses_oleh, 'Administrator');
  });

  await test('validasi ganda -> 409', async () => {
    const { res, data } = await call(pengajuanById, {
      method: 'PATCH', headers: bearer(adminToken),
      query: { id: String(pengajuanId) }, body: { status: 'ditolak' },
    });
    assert.strictEqual(res.statusCode, 409);
    assert.ok(data.errors.join(' ').includes('disetujui'));
  });

  await test('admin tolak pengajuan kedua -> 200 ditolak', async () => {
    const { res, data } = await call(pengajuanById, {
      method: 'PATCH', headers: bearer(adminToken),
      query: { id: String(pengajuanId2) }, body: { status: 'ditolak', catatan_admin: 'Stok habis' },
    });
    assert.strictEqual(res.statusCode, 200);
    assert.strictEqual(data.data.status, 'ditolak');
  });

  await test('PATCH status tidak valid -> 400; ID tidak ada -> 404', async () => {
    // buat satu pengajuan baru khusus uji ini
    const { data: created } = await call(pengajuanIndex, {
      method: 'POST', headers: bearer(mhs2Token),
      body: {
        jenis: 'peminjaman', fasilitas: 'Lab', tanggal_mulai: '2026-12-01',
        tanggal_selesai: '2026-12-02', keperluan: 'Praktikum',
      },
    });
    const { res: r1 } = await call(pengajuanById, {
      method: 'PATCH', headers: bearer(adminToken),
      query: { id: String(created.data.id) }, body: { status: 'mungkin' },
    });
    assert.strictEqual(r1.statusCode, 400);
    const { res: r2 } = await call(pengajuanById, {
      method: 'PATCH', headers: bearer(adminToken),
      query: { id: '999999' }, body: { status: 'disetujui' },
    });
    assert.strictEqual(r2.statusCode, 404);
    const { res: r3 } = await call(pengajuanById, {
      method: 'GET', headers: bearer(adminToken), query: { id: '999999' },
    });
    assert.strictEqual(r3.statusCode, 404);
  });

  /* ---- logout & sesi kedaluwarsa ---- */
  await test('logout mencabut sesi di server -> token lama 401', async () => {
    const { res } = await call(logout, { method: 'POST', headers: bearer(mhs2Token) });
    assert.strictEqual(res.statusCode, 200);
    const { res: r2 } = await call(me, { method: 'GET', headers: bearer(mhs2Token) });
    assert.strictEqual(r2.statusCode, 401);
    // sesi benar-benar terhapus dari DB
    const r = await c.execute({ sql: 'SELECT * FROM sessions WHERE token = ?', args: [mhs2Token] });
    assert.strictEqual(r.rows.length, 0);
  });

  await test('sesi kedaluwarsa ditolak + dibersihkan (lazy cleanup)', async () => {
    const expiredToken = 'expired-' + Date.now();
    await c.execute({
      sql: 'INSERT INTO sessions (token, user_id, expires_at) VALUES (?, (SELECT id FROM users WHERE username = ?), ?)',
      args: [expiredToken, 'mahasiswa', Date.now() - 1000],
    });
    const { res } = await call(me, { method: 'GET', headers: bearer(expiredToken) });
    assert.strictEqual(res.statusCode, 401);
    const r = await c.execute({ sql: 'SELECT * FROM sessions WHERE token = ?', args: [expiredToken] });
    assert.strictEqual(r.rows.length, 0);
  });

  /* ---- rate limit ---- */
  await test('11x login gagal dari 1 IP -> 429 + Retry-After', async () => {
    const ip = '10.9.9.9';
    let last;
    for (let i = 0; i < 11; i++) {
      last = await call(login, {
        method: 'POST', body: { username: 'admin', password: 'salah' }, ip,
      });
      if (i < 10) assert.strictEqual(last.res.statusCode, 401, 'percobaan ' + (i + 1) + ' harus 401');
    }
    assert.strictEqual(last.res.statusCode, 429);
    assert.ok(last.res.headers['retry-after'], 'header Retry-After hilang');
    // IP lain tidak terdampak
    const { res } = await call(login, {
      method: 'POST', body: { username: 'admin', password: 'Demo123!' }, ip: '10.9.9.10',
    });
    assert.strictEqual(res.statusCode, 200);
  });

  await test('login sukses me-reset hitungan gagal IP tersebut', async () => {
    const ip = '10.8.8.8';
    for (let i = 0; i < 3; i++) {
      await call(login, { method: 'POST', body: { username: 'admin', password: 'salah' }, ip });
    }
    const { res } = await call(login, {
      method: 'POST', body: { username: 'admin', password: 'Demo123!' }, ip,
    });
    assert.strictEqual(res.statusCode, 200);
    const r = await c.execute({ sql: 'SELECT * FROM login_attempts WHERE ip = ?', args: [ip] });
    assert.strictEqual(r.rows.length, 0);
  });

  console.log(`\n${passed} lolos, ${failed} gagal.`);
  if (failed > 0) {
    console.log('Kegagalan:\n - ' + failures.join('\n - '));
    process.exit(1);
  }
}

main().catch((err) => {
  console.error('FATAL:', err);
  process.exit(1);
});
