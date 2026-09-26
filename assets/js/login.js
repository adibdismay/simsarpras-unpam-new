/* ============================================================
   SIMSARPRAS UNPAM — Logika login demo (client-side)
   Akun demo: admin / Demo123!
   Tidak menyimpan kata sandi ke storage apa pun.
   ============================================================ */
(function () {
  "use strict";

  const DEMO_USERNAME = "admin";
  const DEMO_PASSWORD = "Demo123!";
  const TARGET_PAGE = "layout.html";

  const usernameInput = document.getElementById("username");
  const passwordInput = document.getElementById("password");
  const togglePassword = document.getElementById("toggle-password");
  const eyeOpen = document.getElementById("eye-open");
  const eyeClosed = document.getElementById("eye-closed");
  const form = document.getElementById("login-form");
  const submitButton = document.getElementById("submit-button");
  const submitLabel = document.getElementById("submit-label");
  const alertBox = document.getElementById("login-alert");
  const alertText = document.getElementById("login-alert-text");
  const robotMessage = document.getElementById("robot-message");
  const autofillButton = document.getElementById("btn-autofill");

  const DEFAULT_MESSAGE = "Sistem Inventaris Siap • Silakan Masuk";

  /* ---------- Umpan balik ---------- */
  function showAlert(type, message) {
    alertBox.hidden = false;
    alertBox.dataset.type = type;
    alertText.textContent = message;
  }

  function clearAlert() {
    alertBox.hidden = true;
    alertBox.removeAttribute("data-type");
    alertText.textContent = "";
  }

  function setInvalid(input, invalid) {
    if (invalid) {
      input.setAttribute("aria-invalid", "true");
    } else {
      input.removeAttribute("aria-invalid");
    }
  }

  /* ---------- Tampilkan / sembunyikan kata sandi ---------- */
  if (togglePassword && passwordInput) {
    togglePassword.addEventListener("click", function () {
      const isPassword = passwordInput.getAttribute("type") === "password";
      passwordInput.setAttribute("type", isPassword ? "text" : "password");
      eyeOpen.hidden = !isPassword;
      eyeClosed.hidden = isPassword;
      togglePassword.setAttribute("aria-pressed", String(isPassword));
      togglePassword.setAttribute(
        "aria-label",
        isPassword ? "Sembunyikan kata sandi" : "Tampilkan kata sandi"
      );
      passwordInput.focus();
    });
  }

  /* ---------- Isi otomatis akun demo ---------- */
  if (autofillButton) {
    autofillButton.addEventListener("click", function () {
      usernameInput.value = DEMO_USERNAME;
      passwordInput.value = DEMO_PASSWORD;
      setInvalid(usernameInput, false);
      setInvalid(passwordInput, false);
      clearAlert();
      robotMessage.textContent = "Kredensial demo diisikan. Silakan masuk!";
      usernameInput.focus();
    });
  }

  /* Hapus tanda error saat pengguna mengetik ulang. */
  [usernameInput, passwordInput].forEach(function (input) {
    input.addEventListener("input", function () {
      setInvalid(input, false);
    });
  });

  /* ---------- Validasi & pengiriman ---------- */
  if (form) {
    form.addEventListener("submit", function (event) {
      event.preventDefault();

      const username = usernameInput.value.trim();
      const password = passwordInput.value;

      let invalidField = null;

      if (!username && !password) {
        showAlert("error", "Masukkan username dan kata sandi terlebih dahulu.");
        invalidField = usernameInput;
      } else if (!username) {
        showAlert("error", "Username wajib diisi.");
        invalidField = usernameInput;
      } else if (!password) {
        showAlert("error", "Kata sandi wajib diisi.");
        invalidField = passwordInput;
      } else if (username !== DEMO_USERNAME || password !== DEMO_PASSWORD) {
        showAlert("error", "Username atau kata sandi salah. Gunakan akun demo (admin / Demo123!).");
        invalidField = usernameInput;
      }

      if (invalidField) {
        setInvalid(invalidField, true);
        if (invalidField === usernameInput) setInvalid(passwordInput, false);
        invalidField.focus();
        robotMessage.textContent = "Ups! Periksa kembali kredensial Anda.";
        return;
      }

      // Kredensial cocok — simpan penanda sesi, lalu arahkan.
      setInvalid(usernameInput, false);
      setInvalid(passwordInput, false);

      if (typeof Auth === "undefined" || !Auth.signIn()) {
        showAlert("error", "Penyimpanan sesi (sessionStorage) tidak tersedia. Aktifkan sessionStorage, lalu coba lagi.");
        robotMessage.textContent = "Ups! Sesi tidak dapat disimpan.";
        return;
      }

      showAlert("success", "Autentikasi berhasil! Mengalihkan ke Dashboard…");
      robotMessage.textContent = "Akses diterima. Selamat datang!";

      submitButton.disabled = true;
      submitLabel.textContent = "Memverifikasi…";

      setTimeout(function () {
        window.location.replace(TARGET_PAGE);
      }, 900);
    });
  }

  /* ---------- Animasi robot (dekoratif) ---------- */
  (function initRobotAnimation() {
    const robotSvg = document.getElementById("robot-svg");
    const mascot = robotSvg ? robotSvg.closest(".mascot") : null;
    const pupils = document.querySelectorAll(".robot-pupil");
    const reducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

    let eyesClosed = false;
    let pointerX = null;
    let pointerY = null;
    let pendingFrame = false;
    let faceRect = null;

    function setEyes(closed) {
      if (mascot) mascot.classList.toggle("eyes-closed", closed);
    }

    function updateFaceRect() {
      if (robotSvg) faceRect = robotSvg.getBoundingClientRect();
    }

    function applyTracking() {
      pendingFrame = false;
      if (!pupils.length) return;

      if (pointerX === null || pointerY === null || !faceRect) {
        pupils.forEach(function (p) { p.style.transform = "translate(0px, 0px)"; });
        return;
      }

      const centerX = faceRect.left + faceRect.width / 2;
      const centerY = faceRect.top + faceRect.height / 2;
      const dx = pointerX - centerX;
      const dy = pointerY - centerY;
      const angle = Math.atan2(dy, dx);
      const dist = Math.min(Math.hypot(dx, dy) / 40, 4.5);
      const mx = Math.cos(angle) * dist;
      const my = Math.sin(angle) * dist;
      const t = "translate(" + mx.toFixed(2) + "px, " + my.toFixed(2) + "px)";
      pupils.forEach(function (p) { p.style.transform = t; });
    }

    function trackPointer(x, y) {
      pointerX = x;
      pointerY = y;
      if (!pendingFrame) {
        pendingFrame = true;
        requestAnimationFrame(applyTracking);
      }
    }

    function resetPupils() {
      pointerX = null;
      pointerY = null;
      if (!pendingFrame) {
        pendingFrame = true;
        requestAnimationFrame(applyTracking);
      }
    }

    function scheduleBlink() {
      if (reducedMotion) return;
      setTimeout(function () {
        if (eyesClosed) {
          scheduleBlink();
          return;
        }
        setEyes(true);
        setTimeout(function () {
          if (!eyesClosed) setEyes(false);
          scheduleBlink();
        }, 170);
      }, 3000 + Math.random() * 3000);
    }

    // Kelopak: menutup saat kata sandi fokus, terbuka saat fokus keluar.
    if (passwordInput) {
      passwordInput.addEventListener("focus", function () {
        eyesClosed = true;
        setEyes(true);
      });
      passwordInput.addEventListener("blur", function (event) {
        // Fokus pindah ke tombol tampilkan sandi — biarkan mata tetap tertutup.
        if (event.relatedTarget === togglePassword) return;
        eyesClosed = false;
        setEyes(false);
      });
    }

    // Pelacakan pointer (nonaktif saat reduced-motion / perangkat sentuh).
    if (!reducedMotion && robotSvg) {
      updateFaceRect();
      window.addEventListener("resize", updateFaceRect);
      window.addEventListener("pointermove", function (event) {
        if (event.pointerType === "touch") return;
        trackPointer(event.clientX, event.clientY);
      });
      document.addEventListener("mouseleave", resetPupils);
      window.addEventListener("blur", resetPupils);
    }

    // Kedipan sesekali saat idle.
    if (!reducedMotion) scheduleBlink();
  })();
})();
