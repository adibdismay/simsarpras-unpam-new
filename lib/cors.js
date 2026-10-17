/* ============================================================
   SIMSARPRAS UNPAM — CORS untuk Vercel Functions
   Whitelist exact origin. JANGAN pernah pakai '*' bila kredensial
   dipakai. CORS bukan pengganti autentikasi/otorisasi.
   ============================================================ */
'use strict';

const ALLOWED_ORIGINS = new Set([
  'https://adibdismay.github.io', // frontend produksi (GitHub Pages)
  'http://localhost:3000', // dev lokal
  'http://127.0.0.1:3000', // dev lokal
]);

// Origin tambahan via env (koma-dipisah), mis. untuk staging.
function extraOrigins() {
  const raw = process.env.CORS_EXTRA_ORIGINS || '';
  return raw
    .split(',')
    .map((s) => s.trim())
    .filter(Boolean);
}

function isAllowedOrigin(origin) {
  if (!origin) return false;
  if (ALLOWED_ORIGINS.has(origin)) return true;
  return extraOrigins().includes(origin);
}

/**
 * Terapkan header CORS. Kembalikan true bila request preflight OPTIONS
 * sudah ditangani (panggil lalu return dari handler).
 */
function applyCors(req, res) {
  const origin = req.headers && req.headers.origin;
  if (isAllowedOrigin(origin)) {
    res.setHeader('Access-Control-Allow-Origin', origin);
    res.setHeader('Vary', 'Origin');
    res.setHeader('Access-Control-Allow-Credentials', 'true');
  }
  if (req.method === 'OPTIONS') {
    res.setHeader('Access-Control-Allow-Methods', 'GET, POST, PATCH, OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');
    res.setHeader('Access-Control-Max-Age', '86400');
    res.writeHead(204);
    res.end();
    return true;
  }
  return false;
}

module.exports = { ALLOWED_ORIGINS, isAllowedOrigin, applyCors };
