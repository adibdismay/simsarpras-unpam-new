/* ============================================================
   SIMSARPRAS UNPAM — Auth (Bearer Token)
   Menggantikan flag sessionStorage demo dengan sesi server.

   Mekanisme utama: token dari /api/auth/login disimpan di
   sessionStorage, dikirim via header "Authorization: Bearer".
   Cookie httpOnly simsarpras.sid tetap didukung sebagai fallback
   (dev lokal satu origin).

   Backend di GitHub Pages menunjuk ke API eksternal via API_BASE.
   Override: window.SIMSARPRAS_API_BASE = "https://...";

   API publik window.Auth dipertahankan agar page guard di
   semua halaman tetap berfungsi tanpa perubahan besar:
     Auth.protectPage()            -> Promise, redirect ke login bila 401
     Auth.redirectIfAuthenticated()-> Promise, redirect ke dashboard bila login
     Auth.isAuthenticated()        -> Promise<boolean>
     Auth.signIn(username,password)-> Promise<{ok,user?,errors?}>
     Auth.signOut()                -> Promise<void>
     Auth.getUser()                -> objek user terakhir / null
     Auth.getToken()               -> token Bearer saat ini / null
   ============================================================ */
(function () {
  "use strict";

  var LOGIN_PAGE = "login.html";
  var DASHBOARD_PAGE = "layout.html";
  var API_BASE = window.SIMSARPRAS_API_BASE || "https://simsarpras-unpam-new.vercel.app";
  var TOKEN_KEY = "simsarpras.token";

  var ME_URL = API_BASE + "/api/auth/me";
  var LOGIN_URL = API_BASE + "/api/auth/login";
  var LOGOUT_URL = API_BASE + "/api/auth/logout";

  var cachedUser = null;      // hasil /api/auth/me terakhir
  var mePromise = null;       // deduplikasi request bersamaan

  function getToken() {
    try { return sessionStorage.getItem(TOKEN_KEY); }
    catch (e) { return null; }
  }

  function setToken(token) {
    try {
      if (token) sessionStorage.setItem(TOKEN_KEY, token);
      else sessionStorage.removeItem(TOKEN_KEY);
    } catch (e) { /* abaikan */ }
  }

  function authHeaders() {
    var headers = { "Content-Type": "application/json" };
    var token = getToken();
    if (token) headers["Authorization"] = "Bearer " + token;
    return headers;
  }

  function fetchMe() {
    if (!mePromise) {
      mePromise = fetch(ME_URL, { headers: authHeaders(), credentials: "include" })
        .then(function (res) {
          if (!res.ok) {
            if (res.status === 401) setToken(null);
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
      credentials: "include",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ username: username, password: password })
    })
      .then(function (res) {
        return res.json().catch(function () { return { ok: false }; }).then(function (data) {
          if (res.ok && data && data.ok) {
            if (data.token) setToken(data.token);
            cachedUser = data.user || null;
            mePromise = null;
            return { ok: true, user: cachedUser };
          }
          setToken(null);
          cachedUser = null;
          var errors = (data && data.errors) || ["Login gagal. Coba lagi."];
          return { ok: false, errors: errors };
        });
      })
      .catch(function () {
        setToken(null);
        cachedUser = null;
        return { ok: false, errors: ["Server tidak dapat dihubungi. Periksa koneksi atau URL backend API."] };
      });
  }

  function signOut() {
    var done = function () {
      setToken(null);
      cachedUser = null;
      mePromise = null;
    };
    var token = getToken();
    var headers = { "Content-Type": "application/json" };
    if (token) headers["Authorization"] = "Bearer " + token;
    // Logout mencabut sesi di server; token lokal selalu dibersihkan.
    return fetch(LOGOUT_URL, { method: "POST", credentials: "include", headers: headers })
      .catch(function () { /* abaikan: sesi lokal tetap dibersihkan */ })
      .then(done, done);
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
    API_BASE: API_BASE,
    isAuthenticated: isAuthenticated,
    getUser: getUser,
    getToken: getToken,
    signIn: signIn,
    signOut: signOut,
    protectPage: protectPage,
    redirectIfAuthenticated: redirectIfAuthenticated
  };
})();
