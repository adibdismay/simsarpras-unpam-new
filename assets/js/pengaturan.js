/**
 * SIMSARPRAS UNPAM - Pengaturan Sistem Module
 * Mengelola pilihan tema (Terang / Gelap / Ikuti Sistem) melalui Theme,
 * menyinkronkan tombol tema, dan menangani kegagalan penyimpanan tanpa crash.
 */
(function() {
  'use strict';

  function byId(id) {
    return document.getElementById(id);
  }

  function initPengaturan() {
    const lightRadio = byId('theme-light');
    const darkRadio = byId('theme-dark');
    const systemRadio = byId('theme-system');
    const statusEl = byId('theme-status');

    if (!lightRadio || !darkRadio || !systemRadio) return;

    function syncRadio() {
      if (typeof Theme === 'undefined') return;
      const stored = readStoredTheme();
      if (stored === 'dark') {
        darkRadio.checked = true;
      } else if (stored === 'light') {
        lightRadio.checked = true;
      } else {
        systemRadio.checked = true;
      }
      updateStatus();
    }

    function readStoredTheme() {
      try {
        const v = window.localStorage.getItem(Theme.STORAGE_KEY);
        return (v === 'light' || v === 'dark') ? v : null;
      } catch (e) {
        return null;
      }
    }

    function updateStatus() {
      if (!statusEl) return;
      const stored = readStoredTheme();
      let label;
      if (stored === 'dark') {
        label = 'Gelap (manual)';
      } else if (stored === 'light') {
        label = 'Terang (manual)';
      } else {
        const systemDark = Theme.current() === 'dark';
        label = systemDark ? 'Ikuti Sistem — sedang Gelap' : 'Ikuti Sistem — sedang Terang';
      }
      statusEl.textContent = label;
    }

    function applyChoice(choice) {
      if (typeof Theme === 'undefined') return;
      try {
        if (choice === 'light' || choice === 'dark') {
          window.localStorage.setItem(Theme.STORAGE_KEY, choice);
        } else {
          // Ikuti Sistem: hapus hanya preferensi tema.
          window.localStorage.removeItem(Theme.STORAGE_KEY);
        }
      } catch (e) {
        // Storage gagal: tetap menerapkan tema secara non-persisten.
      }
      Theme.apply(choice === 'dark' ? 'dark' : (choice === 'light' ? 'light' : (window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light')));
      updateStatus();
    }

    lightRadio.addEventListener('change', () => applyChoice('light'));
    darkRadio.addEventListener('change', () => applyChoice('dark'));
    systemRadio.addEventListener('change', () => applyChoice('system'));

    window.addEventListener('themechange', syncRadio);
    syncRadio();
  }

  document.addEventListener('DOMContentLoaded', initPengaturan);
})();
