/* ============================================================
   SIMSARPRAS UNPAM — Security headers untuk respons API.
   API hanya mengembalikan JSON: CSP dibatasi ketat (tidak
   memengaruhi aset halaman frontend yang disajikan Pages).
   ============================================================ */
'use strict';

function securityHeaders() {
  return {
    'X-Content-Type-Options': 'nosniff',
    'X-Frame-Options': 'DENY',
    'Referrer-Policy': 'no-referrer',
    // Di Vercel, API selalu diakses via HTTPS.
    'Strict-Transport-Security': 'max-age=31536000; includeSubDomains',
    // API JSON-only: tidak ada script/style/frame yang sah.
    'Content-Security-Policy': "default-src 'none'; frame-ancestors 'none'; base-uri 'none'",
  };
}

function applySecurity(res) {
  const h = securityHeaders();
  for (const [k, v] of Object.entries(h)) res.setHeader(k, v);
}

function sendJson(res, status, obj, extraHeaders) {
  const body = JSON.stringify(obj);
  const headers = {
    'Content-Type': 'application/json; charset=utf-8',
    'Content-Length': Buffer.byteLength(body),
    ...(extraHeaders || {}),
  };
  res.writeHead(status, headers);
  res.end(body);
}

const MAX_BODY_BYTES = 256 * 1024; // 256 KB (sama seperti server.js)

function readBody(req) {
  return new Promise((resolve, reject) => {
    // Vercel sudah mem-parse JSON body ke req.body.
    if (req.body !== undefined) {
      if (typeof req.body === 'string') {
        resolve(req.body);
      } else {
        resolve(JSON.stringify(req.body === null ? {} : req.body));
      }
      return;
    }
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
  if (req.body !== undefined && req.body !== null && typeof req.body === 'object') {
    return req.body;
  }
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

/** IP klien: hormati x-forwarded-for (Vercel selalu menyetujuinya). */
function clientIp(req) {
  const fwd = req.headers && req.headers['x-forwarded-for'];
  if (typeof fwd === 'string' && fwd.length > 0) return fwd.split(',')[0].trim();
  return (req.socket && req.socket.remoteAddress) || 'unknown';
}

module.exports = { securityHeaders, applySecurity, sendJson, readJsonBody, clientIp, MAX_BODY_BYTES };
