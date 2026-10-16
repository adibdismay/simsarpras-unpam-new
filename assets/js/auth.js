/* ============================================================
   SIMSARPRAS UNPAM — Auth (sesi backend)
   Menggantikan flag sessionStorage demo dengan sesi server
   (cookie httpOnly `simsarpras.sid`, diverifikasi via /api).

   API publik window.Auth dipertahankan agar page guard di
   semua halaman tetap berfungsi tanpa perubahan besar:
     Auth.protectPage()            -> Promise, redirect ke login bila 401
     Auth.redirectIfAuthenticated()-> Promise, redirect ke dashboard bila login
     Auth.isAuthenticated()        -> Promise<boolean>
     Auth.signIn(username,password)-> Promise<{ok,user?,errors?}>
     Auth.signOut()                -> Promise<void>
     Auth.getUser()                -> objek user terakhir / null
   ============================================================ */
(function () {
  "use strict";

  var LOGIN_PAGE = "login.html";
  var DASHBOARD_PAGE = "layout.html";
  var ME_URL = "/api/auth/me";
  var LOGIN_URL = "/api/auth/login";
  var LOGOUT_URL = "/api/auth/logout";

  var cachedUser = null;      // hasil /api/auth/me terakhir
  var mePromise = null;       // deduplikasi request bersamaan

  function fetchMe() {
    if (!mePromise) {
      mePromise = fetch(ME_URL, { credentials: "same-origin" })
        .then(function (res) {
          if (!res.ok) {
            cachedUser = null;
            return null;
          }
          return res.json().then(function (data) {
            cachedUser = data && data.ok ? data.user : null;
            return cachedUser;
          });
        })
        .catch(function () {
          cachedUser = null;
          return null;
        })
        .finally(function () {
          mePromise = null;
        });
    }
    return mePromise;
  }

  function isAuthenticated() {
    return fetchMe().then(function (user) { return !!user; });
  }

  function getUser() {
    return cachedUser;
  }

  function signIn(username, password) {
    return fetch(LOGIN_URL, {
      method: "POST",
      credentials: "same-origin",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ username: username, password: password })
    })
      .then(function (res) {
        return res.json().catch(function () { return { ok: false }; }).then(function (data) {
          if (res.ok && data && data.ok) {
            cachedUser = data.user || null;
            mePromise = null;
            return { ok: true, user: cachedUser };
          }
          cachedUser = null;
          var errors = (data && data.errors) || ["Login gagal. Coba lagi."];
          return { ok: false, errors: errors };
        });
      })
      .catch(function () {
        cachedUser = null;
        return { ok: false, errors: ["Server tidak dapat dihubungi. Pastikan backend (node server.js) berjalan."] };
      });
  }

  function signOut() {
    cachedUser = null;
    mePromise = null;
    return fetch(LOGOUT_URL, { method: "POST", credentials: "same-origin" })
      .catch(function () { /* abaikan: sesi lokal tetap dibersihkan */ })
      .then(function () { cachedUser = null; });
  }

  /* Halaman terlindungi: tanpa sesi server, arahkan ke login. */
  function protectPage() {
    return fetchMe().then(function (user) {
      if (!user) {
        window.location.replace(LOGIN_PAGE);
        return false;
      }
      return true;
    });
  }

  /* Halaman login: jika sesi sudah aktif, arahkan ke dashboard. */
  function redirectIfAuthenticated() {
    return fetchMe().then(function (user) {
      if (user) window.location.replace(DASHBOARD_PAGE);
    });
  }

  /* Logout via tombol #logout-button (delegasi, aman di semua halaman). */
  document.addEventListener("click", function (event) {
    var target = event.target instanceof Element ? event.target : null;
    if (!target) return;
    var button = target.closest("#logout-button");
    if (!button) return;
    event.preventDefault();
    signOut().then(function () {
      window.location.replace(LOGIN_PAGE);
    });
  });

  window.Auth = {
    LOGIN_PAGE: LOGIN_PAGE,
    DASHBOARD_PAGE: DASHBOARD_PAGE,
    isAuthenticated: isAuthenticated,
    getUser: getUser,
    signIn: signIn,
    signOut: signOut,
    protectPage: protectPage,
    redirectIfAuthenticated: redirectIfAuthenticated
  };
})();
