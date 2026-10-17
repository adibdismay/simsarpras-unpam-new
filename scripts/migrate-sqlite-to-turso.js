/* ============================================================
   SIMSARPRAS UNPAM — Migrasi SQLite lokal -> Turso (libSQL)
   JALANKAN MANUAL SATU KALI, HANYA SETELAH PERSETUJUAN TERPISAH.

   Cara pakai:
     node scripts/migrate-sqlite-to-turso.js              # dry-run (default): hitung baris, TANPA menulis
     node scripts/migrate-sqlite-to-turso.js --execute    # tulis sungguhan ke Turso

   Env yang dibutuhkan (mode --execute):
     TURSO_DATABASE_URL   - mis. libsql://xxx.turso.io
     TURSO_AUTH_TOKEN     - token Turso (JANGAN di-commit)
     SIMSARPRAS_DB        - path SQLite lokal (default: data/simsarpras.db)

   Database lokal TIDAK dihapus/dimodifikasi oleh skrip ini.
   Tabel dibuat IF NOT EXISTS; baris disalin dengan INSERT OR REPLACE
   berdasarkan primary key (id/token/ip) agar aman dijalankan ulang.
   ============================================================ */
'use strict';

const path = require('node:path');
const fs = require('node:fs');
const { DatabaseSync } = require('node:sqlite');

const ROOT_DIR = path.join(__dirname, '..');
const EXECUTE = process.argv.includes('--execute');
const LOCAL_DB = process.env.SIMSARPRAS_DB || path.join(ROOT_DIR, 'data', 'simsarpras.db');

// Kolom per tabel (urutan sesuai skema server.js / lib/db.js).
const TABLES = {
  users: ['id', 'username', 'password_hash', 'nama', 'role', 'status', 'created_at'],
  pengajuan: [
    'id', 'user_id', 'jenis', 'fasilitas', 'tanggal_mulai', 'tanggal_selesai',
    'keperluan', 'kode_inventaris', 'deskripsi_kerusakan', 'status',
    'catatan_admin', 'diproses_oleh', 'diproses_pada', 'created_at', 'updated_at',
  ],
  sessions: ['token', 'user_id', 'expires_at'],
  login_attempts: ['ip', 'gagal_count', 'reset_at'],
};

async function main() {
  if (!fs.existsSync(LOCAL_DB)) {
    console.error(`[migrate] database lokal tidak ditemukan: ${LOCAL_DB}`);
    process.exit(1);
  }

  const local = new DatabaseSync(LOCAL_DB);
  const dump = {};
  for (const [table, cols] of Object.entries(TABLES)) {
    try {
      dump[table] = local.prepare(`SELECT ${cols.join(', ')} FROM ${table}`).all();
    } catch (e) {
      console.warn(`[migrate] tabel "${table}" tidak ada di DB lokal — dilewati (${e.message})`);
      dump[table] = [];
    }
  }
  local.close();

  const total = Object.values(dump).reduce((n, rows) => n + rows.length, 0);
  console.log('[migrate] === DRY-RUN: ringkasan database lokal ===');
  for (const [table, rows] of Object.entries(dump)) {
    console.log(`[migrate]   ${table}: ${rows.length} baris`);
  }
  console.log(`[migrate]   TOTAL: ${total} baris dari ${LOCAL_DB}`);

  if (!EXECUTE) {
    console.log('[migrate] Mode dry-run: TIDAK ada data yang ditulis.');
    console.log('[migrate] Untuk migrasi sungguhan: set TURSO_DATABASE_URL + TURSO_AUTH_TOKEN, lalu jalankan dengan --execute');
    return;
  }

  const url = (process.env.TURSO_DATABASE_URL || '').trim();
  const authToken = process.env.TURSO_AUTH_TOKEN || '';
  if (!url || !authToken) {
    console.error('[migrate] --execute butuh TURSO_DATABASE_URL dan TURSO_AUTH_TOKEN di environment.');
    process.exit(1);
  }
  const { createClient } = require('@libsql/client');
  const remote = createClient({ url, authToken });

  // Pastikan skema ada (idempotent).
  const { ensureReady } = require('../lib/db');
  await ensureReady();

  for (const [table, cols] of Object.entries(TABLES)) {
    const rows = dump[table];
    if (!rows.length) continue;
    const placeholders = cols.map(() => '?').join(', ');
    // INSERT OR REPLACE agar idempotent bila dijalankan ulang.
    const stmts = rows.map((r) => ({
      sql: `INSERT OR REPLACE INTO ${table} (${cols.join(', ')}) VALUES (${placeholders})`,
      args: cols.map((c) => (r[c] === undefined ? null : r[c])),
    }));
    // Batch per 200 baris agar payload tetap wajar.
    for (let i = 0; i < stmts.length; i += 200) {
      await remote.batch(stmts.slice(i, i + 200), 'write');
    }
    console.log(`[migrate]   ${table}: ${rows.length} baris ditulis ke Turso`);
  }
  remote.close();
  console.log('[migrate] SELESAI. Verifikasi jumlah baris di dashboard Turso sebelum memakai database baru.');
  console.log('[migrate] Database lokal TIDAK diubah.');
}

main().catch((err) => {
  console.error('[migrate] GAGAL:', err.message);
  process.exit(1);
});
