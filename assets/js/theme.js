/* ============================================================
   SIMSARPRAS UNPAM — Pengelola tema terang/gelap bersama.
   Key localStorage: simsarpras.theme.v1 ("light" / "dark").
   Atribut: data-theme pada <html>.
   Diterapkan sejak <head> untuk mengurangi kilatan warna.
   ============================================================ */
(function () {
  "use strict";

  var STORAGE_KEY = "simsarpras.theme.v1";
  var DARK = "dark";
  var LIGHT = "light";
  var root = document.documentElement;

  function readStored() {
    try {
      var v = window.localStorage.getItem(STORAGE_KEY);
      return (v === LIGHT || v === DARK) ? v : null;
    } catch (e) {
      return null;
    }
  }

  function writeStored(theme) {
    try {
      window.localStorage.setItem(STORAGE_KEY, theme);
    } catch (e) {
      /* storage tidak tersedia — toggle tetap berfungsi (tidak persisten) */
    }
  }

  function systemDark() {
    try {
      return window.matchMedia("(prefers-color-scheme: dark)").matches;
    } catch (e) {
      return false;
    }
  }

  function current() {
    return root.getAttribute("data-theme") === DARK ? DARK : LIGHT;
  }

  function apply(theme) {
    if (theme !== DARK) theme = LIGHT;
    root.setAttribute("data-theme", theme);
    try { root.style.colorScheme = theme; } catch (e) {}
    try {
      window.dispatchEvent(new CustomEvent("themechange", { detail: { theme: theme } }));
    } catch (e) {}
  }

  function toggle() {
    var next = current() === DARK ? LIGHT : DARK;
    apply(next);
    writeStored(next);
    return next;
  }

  // Terapkan sejak awal (pilihan manual diutamakan, lalu ikut sistem).
  apply(readStored() || (systemDark() ? DARK : LIGHT));

  // Ikuti perubahan sistem hanya bila belum ada pilihan manual.
  var mq = null;
  try { mq = window.matchMedia("(prefers-color-scheme: dark)"); } catch (e) {}
  if (mq && typeof mq.addEventListener === "function") {
    mq.addEventListener("change", function (e) {
      if (readStored() === null) apply(e.matches ? DARK : LIGHT);
    });
  }

  // Auto-bind tombol tema (id="theme-toggle") + label aksesibel.
  function bindToggle() {
    var btn = document.getElementById("theme-toggle");
    if (!btn) return;
    function sync() {
      var dark = current() === DARK;
      var label = dark ? "Aktifkan mode terang" : "Aktifkan mode gelap";
      btn.setAttribute("aria-label", label);
      btn.setAttribute("title", label);
    }
    btn.addEventListener("click", function () {
      toggle();
      sync();
    });
    window.addEventListener("themechange", sync);
    sync();
  }

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", bindToggle);
  } else {
    bindToggle();
  }

  window.Theme = {
    STORAGE_KEY: STORAGE_KEY,
    DARK: DARK,
    LIGHT: LIGHT,
    current: current,
    apply: apply,
    toggle: toggle,
    isDark: function () { return current() === DARK; }
  };
})();
