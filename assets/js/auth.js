/* ============================================================
   SIMSARPRAS UNPAM — Auth (sesi demo client-side)
   Menyimpan penanda sesi di sessionStorage, BUKAN kata sandi.
   Key: simsarpras.session.v1 (terpisah dari simsarpras.inventory.v1).
   Ini simulasi client-side, bukan autentikasi aman.
   ============================================================ */
(function () {
  "use strict";

  var SESSION_KEY = "simsarpras.session.v1";
  var LOGIN_PAGE = "login.html";
  var DASHBOARD_PAGE = "layout.html";

  /* sessionStorage tidak dapat diakses (mis. diblokir). */
  function storageUnavailable() {
    try {
      window.sessionStorage.getItem(SESSION_KEY);
      return false;
    } catch (err) {
      return true;
    }
  }

  function isAuthenticated() {
    try {
      return window.sessionStorage.getItem(SESSION_KEY) === "1";
    } catch (err) {
      return false;
    }
  }

  function signIn() {
    try {
      window.sessionStorage.setItem(SESSION_KEY, "1");
      return true;
    } catch (err) {
      return false;
    }
  }

  /* Hanya menghapus key sesi demo. Tidak memakai clear(). */
  function signOut() {
    try {
      window.sessionStorage.removeItem(SESSION_KEY);
      return true;
    } catch (err) {
      return false;
    }
  }

  function showStorageError() {
    function render() {
      if (!document.body) {
        document.addEventListener("DOMContentLoaded", render);
        return;
      }
      document.body.innerHTML =
        '<main style="min-height:100vh;display:flex;align-items:center;justify-content:center;padding:24px;background:#F7F8FA;font-family:\'Plus Jakarta Sans\',Arial,sans-serif;color:#111827;">' +
        '<div style="max-width:420px;width:100%;background:#fff;border:1px solid #e5e7eb;border-radius:12px;padding:32px;text-align:center;">' +
        '<h1 style="font-size:18px;margin:0 0 8px;font-weight:700;">Sesi tidak dapat dimuat</h1>' +
        '<p style="font-size:14px;color:#6b7280;margin:0 0 20px;line-height:20px;">Penyimpanan sesi peramban (sessionStorage) tidak tersedia atau diblokir. Aktifkan sessionStorage, lalu muat ulang halaman.</p>' +
        '<a href="' + LOGIN_PAGE + '" style="display:inline-block;padding:10px 16px;border-radius:8px;background:#2563eb;color:#fff;text-decoration:none;font-weight:600;font-size:14px;">Muat ulang</a>' +
        '</div></main>';
    }
    render();
  }

  /* Halaman terlindungi: tanpa sesi, arahkan ke login (location.replace).
     Jika sessionStorage gagal, tampilkan pesan (tanpa loop redirect). */
  function protectPage() {
    if (storageUnavailable()) {
      showStorageError();
      return;
    }
    if (!isAuthenticated()) {
      window.location.replace(LOGIN_PAGE);
      return;
    }
    // Cek ulang saat halaman dipulihkan dari cache (tombol Back setelah logout).
    window.addEventListener("pageshow", function (event) {
      if (!event.persisted) return;
      if (storageUnavailable()) {
        showStorageError();
      } else if (!isAuthenticated()) {
        window.location.replace(LOGIN_PAGE);
      }
    });
  }

  /* Halaman login: jika sesi sudah aktif, arahkan ke dashboard. */
  function redirectIfAuthenticated() {
    if (storageUnavailable()) return;
    if (isAuthenticated()) {
      window.location.replace(DASHBOARD_PAGE);
    }
  }

  /* Logout via tombol #logout-button (delegasi, aman di semua halaman). */
  document.addEventListener("click", function (event) {
    var target = event.target instanceof Element ? event.target : null;
    if (!target) return;
    var button = target.closest("#logout-button");
    if (!button) return;
    event.preventDefault();
    signOut();
    window.location.replace(LOGIN_PAGE);
  });

  window.Auth = {
    SESSION_KEY: SESSION_KEY,
    LOGIN_PAGE: LOGIN_PAGE,
    DASHBOARD_PAGE: DASHBOARD_PAGE,
    isAuthenticated: isAuthenticated,
    storageUnavailable: storageUnavailable,
    signIn: signIn,
    signOut: signOut,
    protectPage: protectPage,
    redirectIfAuthenticated: redirectIfAuthenticated
  };
})();
