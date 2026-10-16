/* Tes keamanan produksi SIMSARPRAS.
   Menjalankan server sebagai subprocess dengan berbagai env.
   Keluar 0 = semua lolos; keluar 1 = ada yang gagal. */
'use strict';
const { spawn } = require('node:child_process');
const fs = require('node:fs');

const ROOT = '/home/hatch/workspace/simsarpras';
let passed = 0, failed = 0;
async function test(name, fn) {
  try { await fn(); passed++; console.log('  OK  ' + name); }
  catch (e) { failed++; console.log('  FAIL ' + name + ' — ' + e.message); }
}
function assert(c, msg) { if (!c) throw new Error(msg || 'assert gagal'); }

function startServer(env, port) {
  return new Promise((resolve, reject) => {
    const child = spawn('node', ['server.js'], {
      cwd: ROOT, env: { ...process.env, PORT: String(port), ...env },
      stdio: ['ignore', 'pipe', 'pipe'],
    });
    let out = '', err = '';
    child.stdout.on('data', d => { out += d; });
    child.stderr.on('data', d => { err += d; });
    const timer = setTimeout(() => { child.kill(); reject(new Error('timeout start')); }, 15000);
    const check = setInterval(async () => {
      try {
        const r = await fetch(`http://127.0.0.1:${port}/api/health`);
        if (r.ok) { clearInterval(check); clearTimeout(timer); resolve({ child, logs: () => out + err }); }
      } catch {}
    }, 200);
    child.on('exit', () => { clearInterval(check); clearTimeout(timer); reject(new Error('server exit prematur: ' + err.slice(0, 200))); });
  });
}
async function req(port, method, path, opts = {}) {
  const r = await fetch(`http://127.0.0.1:${port}${path}`, {
    method, headers: { 'Content-Type': 'application/json', ...(opts.headers || {}) },
    body: opts.body ? JSON.stringify(opts.body) : undefined,
  });
  const text = await r.text();
  let json = null; try { json = JSON.parse(text); } catch {}
  return { status: r.status, json, headers: r.headers };
}
const sleep = ms => new Promise(r => setTimeout(r, ms));

(async () => {
  console.log('== A. Rate limiting login ==');
  {
    const db = '/tmp/sec-rl.db'; try { fs.unlinkSync(db); } catch {}
    const { child } = await startServer({ SIMSARPRAS_DB: db }, 18940);
    try {
      let last = 0;
      for (let i = 0; i < 11; i++) {
        const r = await req(18940, 'POST', '/api/auth/login', { body: { username: 'admin', password: 'salah' + i } });
        last = r.status;
      }
      await test('11x login gagal -> 429 pada percobaan ke-11', async () => assert(last === 429, 'status=' + last));
      const r2 = await req(18940, 'POST', '/api/auth/login', { body: { username: 'admin', password: 'Demo123!' } });
      await test('login benar ikut diblokir saat rate-limited (429)', async () => assert(r2.status === 429, 'status=' + r2.status));
    } finally { child.kill(); await sleep(500); }
  }

  console.log('== B. Cookie Secure ==');
  {
    const db = '/tmp/sec-cookie.db'; try { fs.unlinkSync(db); } catch {}
    const { child } = await startServer({ SIMSARPRAS_DB: db }, 18941);
    try {
      const r1 = await req(18941, 'POST', '/api/auth/login', { body: { username: 'admin', password: 'Demo123!' } });
      const c1 = r1.headers.get('set-cookie') || '';
      await test('tanpa x-forwarded-proto: cookie TANPA Secure', async () => assert(!c1.includes('Secure'), c1.slice(0, 80)));
      const r2 = await req(18941, 'POST', '/api/auth/login', {
        body: { username: 'admin', password: 'Demo123!' },
        headers: { 'x-forwarded-proto': 'https' },
      });
      const c2 = r2.headers.get('set-cookie') || '';
      await test('dengan x-forwarded-proto https: cookie ADA Secure', async () => assert(c2.includes('Secure'), c2.slice(0, 80)));
      await test('cookie tetap HttpOnly + SameSite=Lax', async () => assert(c2.includes('HttpOnly') && c2.includes('SameSite=Lax')));
    } finally { child.kill(); await sleep(500); }
  }

  console.log('== C. Security headers ==');
  {
    const db = '/tmp/sec-hdr.db'; try { fs.unlinkSync(db); } catch {}
    const { child } = await startServer({ SIMSARPRAS_DB: db }, 18942);
    try {
      const r1 = await req(18942, 'GET', '/api/health');
      await test('X-Content-Type-Options: nosniff', async () => assert(r1.headers.get('x-content-type-options') === 'nosniff'));
      await test('X-Frame-Options: DENY', async () => assert(r1.headers.get('x-frame-options') === 'DENY'));
      await test('tanpa HTTPS: tidak ada HSTS', async () => assert(!r1.headers.get('strict-transport-security')));
      const r2 = await req(18942, 'GET', '/api/health', { headers: { 'x-forwarded-proto': 'https' } });
      await test('dengan HTTPS: ada HSTS', async () => assert((r2.headers.get('strict-transport-security') || '').includes('max-age=31536000')));
      const r3 = await req(18942, 'GET', '/login.html');
      await test('halaman statis juga dapat security headers', async () => assert(r3.headers.get('x-frame-options') === 'DENY'));
    } finally { child.kill(); await sleep(500); }
  }

  console.log('== D. Bootstrap admin produksi ==');
  {
    // D1: produksi tanpa env -> tidak ada user, ada warning, password tidak di log
    const db1 = '/tmp/sec-prod1.db'; try { fs.unlinkSync(db1); } catch {}
    const s1 = await startServer({ SIMSARPRAS_DB: db1, NODE_ENV: 'production' }, 18943);
    try {
      const r = await req(18943, 'POST', '/api/auth/login', { body: { username: 'admin', password: 'Demo123!' } });
      await test('produksi tanpa ADMIN_*: login demo -> 401', async () => assert(r.status === 401, 'status=' + r.status));
      const r2 = await req(18943, 'POST', '/api/auth/login', { body: { username: 'mahasiswa', password: 'Demo123!' } });
      await test('produksi tanpa ADMIN_*: login mahasiswa demo -> 401', async () => assert(r2.status === 401, 'status=' + r2.status));
      await test('log memuat peringatan (tanpa password)', async () => {
        const logs = s1.logs();
        assert(logs.includes('ADMIN_USERNAME'), 'tidak ada warning di log');
        assert(!logs.includes('Demo123!'), 'password bocor di log!');
      });
    } finally { s1.child.kill(); await sleep(500); }

    // D2: produksi dengan env -> admin dibuat, bisa login, demo tidak ada
    const db2 = '/tmp/sec-prod2.db'; try { fs.unlinkSync(db2); } catch {}
    const s2 = await startServer({ SIMSARPRAS_DB: db2, NODE_ENV: 'production', ADMIN_USERNAME: 'superadmin', ADMIN_PASSWORD: 'KuatSekali123!#' }, 18944);
    try {
      const logs = s2.logs();
      await test('password admin tidak dicetak ke log', async () => assert(!logs.includes('KuatSekali123!#'), 'password bocor!'));
      await test('username admin boleh dicetak ke log', async () => assert(logs.includes('superadmin')));
      const r = await req(18944, 'POST', '/api/auth/login', { body: { username: 'superadmin', password: 'KuatSekali123!#' } });
      await test('login admin bootstrap -> 200 + role admin', async () => {
        assert(r.status === 200, 'status=' + r.status);
        assert(r.json.user.role === 'admin', 'role=' + r.json.user.role);
      });
      const r2 = await req(18944, 'POST', '/api/auth/login', { body: { username: 'admin', password: 'Demo123!' } });
      await test('akun demo admin TIDAK ada di produksi', async () => assert(r2.status === 401, 'status=' + r2.status));
    } finally { s2.child.kill(); await sleep(500); }
  }

  console.log('== E. Persistensi setelah restart ==');
  {
    const db = '/tmp/sec-restart.db'; try { fs.unlinkSync(db); } catch {}
    const s1 = await startServer({ SIMSARPRAS_DB: db }, 18945);
    let cookie = '';
    try {
      const lr = await req(18945, 'POST', '/api/auth/login', { body: { username: 'mahasiswa', password: 'Demo123!' } });
      cookie = (lr.headers.get('set-cookie') || '').split(';')[0];
      const pr = await req(18945, 'POST', '/api/pengajuan', {
        body: { jenis: 'peminjaman', fasilitas: 'Aula Tes', tanggal_mulai: '2026-11-01', tanggal_selesai: '2026-11-02', keperluan: 'Uji restart' },
        headers: { Cookie: cookie },
      });
      assert(pr.status === 201, 'buat pengajuan status=' + pr.status);
    } finally { s1.child.kill(); await sleep(800); }
    const s2 = await startServer({ SIMSARPRAS_DB: db }, 18945);
    try {
      const lr = await req(18945, 'POST', '/api/auth/login', { body: { username: 'admin', password: 'Demo123!' } });
      cookie = (lr.headers.get('set-cookie') || '').split(';')[0];
      const gr = await req(18945, 'GET', '/api/pengajuan', { headers: { Cookie: cookie } });
      await test('pengajuan tetap ada setelah restart', async () => {
        assert(gr.status === 200, 'status=' + gr.status);
        const found = (gr.json.data || []).some(p => p.fasilitas === 'Aula Tes');
        assert(found, 'pengajuan hilang setelah restart');
      });
    } finally { s2.child.kill(); await sleep(500); }
  }

  console.log(`\nHasil: ${passed} lolos, ${failed} gagal`);
  for (const f of ['/tmp/sec-rl.db', '/tmp/sec-cookie.db', '/tmp/sec-hdr.db', '/tmp/sec-prod1.db', '/tmp/sec-prod2.db', '/tmp/sec-restart.db']) {
    try { fs.unlinkSync(f); } catch {}
  }
  process.exit(failed ? 1 : 0);
})().catch(e => { console.error('FATAL:', e.message); process.exit(2); });
