/* SIMSARPRAS UNPAM — GET /api/health (Vercel Function, Node runtime) */
'use strict';

const { applyCors } = require('../lib/cors');
const { applySecurity, sendJson } = require('../lib/security');

module.exports = async function handler(req, res) {
  applySecurity(res);
  if (applyCors(req, res)) return;
  if (req.method !== 'GET') {
    return sendJson(res, 405, { ok: false, errors: ['Metode tidak didukung.'] });
  }
  return sendJson(res, 200, { ok: true, time: new Date().toISOString() });
};
