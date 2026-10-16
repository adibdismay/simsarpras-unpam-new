/* ============================================================
   SIMSARPRAS UNPAM — Tes API backend (tanpa dependensi)
   Menjalankan server dengan database sementara, lalu menguji:
   auth, hak akses role, validasi pengajuan, konsistensi status,
   dan regresi penyajian file statis.

   Cara pakai:  node test/api-test.js
   Keluar 0 = semua lolos; keluar 1 = ada yang gagal.
   ============================================================ */
'use strict';

const path = require('node:path');
const fs = require('node:fs');
const os = require('node:os');
const assert = require('node:assert');

const TEST_PORT = 18923;
const TEST_DB = path.join(fs.mkdtempSync(path.join(os.tmpdir(), 'simsarpras-test-')), 'test.db');

process.env.PORT = String(TEST_PORT);
process.env.SIMSARPRAS_DB = TEST_DB;

const BASE = `http://127.0.0.1:${TEST_PORT}`;
let passed = 0;
let failed = 0;
const failures = [];

async function req(method, p, { body, cookie } = {}) {
  const headers = {};
  if (cookie) headers.Cookie = cookie;
  let payload;
  if (body !== undefined) {
    headers['Content-Type'] = 'application/json';
    payload = JSON.stringify(body);
  }
  const res = await fetch(BASE + p, { method, headers, body: payload });
  const text = await res.text();
  let json = null;
  try { json = JSON.parse(text); } catch { /* bukan JSON */ }
  const setCookie = res.headers.get('set-cookie');
  const rawCookie = typeof res.headers.getSetCookie === 'function'
    ? res.headers.getSetCookie().join('; ')
    : (setCookie || '');
  return { status: res.status, json, text, cookie: setCookie ? setCookie.split(';')[0] : null, setCookieRaw: rawCookie };
}

async function test(name, fn) {
  try {
    await fn();
    passed++;
    console.log(`  ✓ ${name}`);
  } catch (err) {
    failed++;
    failures.push(name);
    console.log(`  ✗ ${name}\n    → ${err.message.split('\n')[0]}`);
  }
}

async function main() {
  require('../server.js'); // server listen di TEST_PORT
  await new Promise((r) => setTimeout(r, 400));

  console.log('== Auth ==');
  await test('health ok', async () => {
    const r = await req('GET', '/api/health');
    assert.strictEqual(r.status, 200);
    assert.strictEqual(r.json.ok, true);
  });
  await test('login kredensial salah -> 401', async () => {
    const r = await req('POST', '/api/auth/login', { body: { username: 'admin', password: 'salah' } });
    assert.strictEqual(r.status, 401);
    assert.strictEqual(r.json.ok, false);
  });
  await test('login field kosong -> 400', async () => {
    const r = await req('POST', '/api/auth/login', { body: { username: '', password: '' } });
    assert.strictEqual(r.status, 400);
  });
  let mhsCookie, adminCookie;
  await test('login mahasiswa -> 200 + cookie sesi', async () => {
    const r = await req('POST', '/api/auth/login', { body: { username: 'mahasiswa', password: 'Demo123!' } });
    assert.strictEqual(r.status, 200);
    assert.strictEqual(r.json.user.role, 'mahasiswa');
    assert.ok(r.cookie && r.cookie.includes('simsarpras.sid'), 'cookie sesi tidak ada');
    assert.ok(r.setCookieRaw.includes('HttpOnly'), 'cookie harus HttpOnly');
    mhsCookie = r.cookie;
  });
  await test('GET /api/auth/me tanpa cookie -> 401', async () => {
    const r = await req('GET', '/api/auth/me');
    assert.strictEqual(r.status, 401);
  });
  await test('GET /api/auth/me dengan cookie -> 200', async () => {
    const r = await req('GET', '/api/auth/me', { cookie: mhsCookie });
    assert.strictEqual(r.status, 200);
    assert.strictEqual(r.json.user.username, 'mahasiswa');
  });

  console.log('== Pengajuan (mahasiswa) ==');
  let idPinjam, idPerbaik;
  await test('buat peminjaman valid -> 201 status menunggu', async () => {
    const r = await req('POST', '/api/pengajuan', {
      cookie: mhsCookie,
      body: { jenis: 'peminjaman', fasilitas: 'Aula Gedung A', tanggal_mulai: '2026-11-01', tanggal_selesai: '2026-11-02', keperluan: 'Seminar' },
    });
    assert.strictEqual(r.status, 201);
    assert.strictEqual(r.json.data.status, 'menunggu');
    assert.strictEqual(r.json.data.jenis, 'peminjaman');
    idPinjam = r.json.data.id;
  });
  await test('peminjaman tanpa keperluan -> 400', async () => {
    const r = await req('POST', '/api/pengajuan', {
      cookie: mhsCookie,
      body: { jenis: 'peminjaman', fasilitas: 'X', tanggal_mulai: '2026-11-01', tanggal_selesai: '2026-11-02', keperluan: '' },
    });
    assert.strictEqual(r.status, 400);
    assert.ok(r.json.errors.length > 0);
  });
  await test('tanggal selesai < mulai -> 400', async () => {
    const r = await req('POST', '/api/pengajuan', {
      cookie: mhsCookie,
      body: { jenis: 'peminjaman', fasilitas: 'X', tanggal_mulai: '2026-11-05', tanggal_selesai: '2026-11-01', keperluan: 'Y' },
    });
    assert.strictEqual(r.status, 400);
  });
  await test('buat perbaikan valid -> 201', async () => {
    const r = await req('POST', '/api/pengajuan', {
      cookie: mhsCookie,
      body: { jenis: 'perbaikan', kode_inventaris: 'INV-LAB-001', deskripsi_kerusakan: 'PC tidak menyala' },
    });
    assert.strictEqual(r.status, 201);
    assert.strictEqual(r.json.data.jenis, 'perbaikan');
    idPerbaik = r.json.data.id;
  });
  await test('jenis tidak dikenal -> 400', async () => {
    const r = await req('POST', '/api/pengajuan', {
      cookie: mhsCookie, body: { jenis: 'aneh' },
    });
    assert.strictEqual(r.status, 400);
  });
  await test('mahasiswa hanya melihat miliknya (2 data)', async () => {
    const r = await req('GET', '/api/pengajuan', { cookie: mhsCookie });
    assert.strictEqual(r.status, 200);
    assert.strictEqual(r.json.data.length, 2);
  });
  await test('mahasiswa tidak bisa validasi -> 403', async () => {
    const r = await req('PATCH', `/api/pengajuan/${idPinjam}`, {
      cookie: mhsCookie, body: { status: 'disetujui' },
    });
    assert.strictEqual(r.status, 403);
  });

  console.log('== Validasi admin ==');
  await test('login admin -> 200', async () => {
    const r = await req('POST', '/api/auth/login', { body: { username: 'admin', password: 'Demo123!' } });
    assert.strictEqual(r.status, 200);
    assert.strictEqual(r.json.user.role, 'admin');
    adminCookie = r.cookie;
  });
  await test('admin melihat semua pengajuan', async () => {
    const r = await req('GET', '/api/pengajuan', { cookie: adminCookie });
    assert.strictEqual(r.status, 200);
    assert.ok(r.json.data.length >= 2);
  });
  await test('admin filter status=menunggu', async () => {
    const r = await req('GET', '/api/pengajuan?status=menunggu', { cookie: adminCookie });
    assert.strictEqual(r.status, 200);
    assert.ok(r.json.data.every((x) => x.status === 'menunggu'));
  });
  await test('admin setujui peminjaman -> 200', async () => {
    const r = await req('PATCH', `/api/pengajuan/${idPinjam}`, {
      cookie: adminCookie, body: { status: 'disetujui', catatan_admin: 'Kunci di petugas Lt.1' },
    });
    assert.strictEqual(r.status, 200);
    assert.strictEqual(r.json.data.status, 'disetujui');
    assert.strictEqual(r.json.data.catatan_admin, 'Kunci di petugas Lt.1');
    assert.ok(r.json.data.diproses_oleh, 'diproses_oleh harus terisi');
  });
  await test('validasi ganda -> 409', async () => {
    const r = await req('PATCH', `/api/pengajuan/${idPinjam}`, {
      cookie: adminCookie, body: { status: 'ditolak' },
    });
    assert.strictEqual(r.status, 409);
  });
  await test('status tidak valid -> 400', async () => {
    const r = await req('PATCH', `/api/pengajuan/${idPerbaik}`, {
      cookie: adminCookie, body: { status: 'oke' },
    });
    assert.strictEqual(r.status, 400);
  });
  await test('admin tolak perbaikan -> 200', async () => {
    const r = await req('PATCH', `/api/pengajuan/${idPerbaik}`, {
      cookie: adminCookie, body: { status: 'ditolak' },
    });
    assert.strictEqual(r.status, 200);
    assert.strictEqual(r.json.data.status, 'ditolak');
  });
  await test('pengajuan tidak ada -> 404', async () => {
    const r = await req('PATCH', '/api/pengajuan/99999', {
      cookie: adminCookie, body: { status: 'disetujui' },
    });
    assert.strictEqual(r.status, 404);
  });

  console.log('== Konsistensi status lintas peran ==');
  await test('mahasiswa melihat status terbaru (disetujui)', async () => {
    const r = await req('GET', `/api/pengajuan/${idPinjam}`, { cookie: mhsCookie });
    assert.strictEqual(r.status, 200);
    assert.strictEqual(r.json.data.status, 'disetujui');
    assert.strictEqual(r.json.data.catatan_admin, 'Kunci di petugas Lt.1');
  });

  console.log('== Regresi file statis ==');
  await test('GET /login.html -> 200', async () => {
    const r = await req('GET', '/login.html');
    assert.strictEqual(r.status, 200);
    assert.ok(r.text.includes('SIMSARPRAS'));
  });
  await test('GET /pengajuan.html -> 200', async () => {
    const r = await req('GET', '/pengajuan.html');
    assert.strictEqual(r.status, 200);
  });
  await test('GET /server.js -> 403 (file internal diblokir)', async () => {
    const r = await req('GET', '/server.js');
    assert.strictEqual(r.status, 403);
  });
  await test('path traversal diblokir -> 403/404', async () => {
    const r = await req('GET', '/..%2f..%2fetc%2fpasswd');
    assert.ok([403, 404].includes(r.status), `dapat ${r.status}`);
  });
  await test('logout -> 200 dan sesi hangus', async () => {
    const r = await req('POST', '/api/auth/logout', { cookie: mhsCookie });
    assert.strictEqual(r.status, 200);
    const r2 = await req('GET', '/api/auth/me', { cookie: mhsCookie });
    assert.strictEqual(r2.status, 401);
  });

  console.log(`\nHasil: ${passed} lolos, ${failed} gagal`);
  if (failed > 0) {
    console.log('Gagal pada:', failures.join(', '));
    process.exitCode = 1;
  }
}

main().then(() => process.exit(process.exitCode || 0)).catch((e) => {
  console.error('FATAL:', e);
  process.exit(1);
});
