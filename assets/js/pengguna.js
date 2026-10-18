/**
 * SIMSARPRAS UNPAM - Pengguna & Hak Akses Module
 * Menampilkan profil Admin Sarpras dan daftar akses yang tersedia (read-only).
 */
(function() {
  'use strict';

  function byId(id) {
    return document.getElementById(id);
  }

  function initPengguna() {
    const nameEl = byId('profile-name');
    if (!nameEl) return;

    // Sesi demo: nama pengguna tetap "Admin Sarpras" (lokal, tanpa autentikasi server).
    nameEl.textContent = 'Admin Sarpras';
  }

  document.addEventListener('DOMContentLoaded', initPengguna);
})();
