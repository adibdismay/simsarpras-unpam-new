/* ============================================================
   SIMSARPRAS UNPAM — Halaman Pengajuan (terintegrasi backend)
   - Mahasiswa: form peminjaman/perbaikan + daftar pengajuan sendiri.
   - Admin:     daftar semua pengajuan + validasi (setujui/tolak).
   Data inventaris untuk saran (datalist) tetap memakai
   InventoryStore (dummy localStorage) sesuai keputusan proyek.
   ============================================================ */
(function () {
  "use strict";

  // Backend API eksternal (Vercel). Override: window.SIMSARPRAS_API_BASE = "https://...";
  var API_BASE = window.SIMSARPRAS_API_BASE || "https://simsarpras-unpam-new.vercel.app";
  var API = API_BASE + "/api/pengajuan";

  var STATUS_BADGE = {
    menunggu: "badge-warning",
    disetujui: "badge-good",
    ditolak: "badge-danger"
  };
  var STATUS_LABEL = {
    menunggu: "Menunggu",
    disetujui: "Disetujui",
    ditolak: "Ditolak"
  };
  var JENIS_LABEL = {
    peminjaman: "Peminjaman",
    perbaikan: "Perbaikan"
  };

  function el(id) { return document.getElementById(id); }

  function esc(s) {
    return String(s == null ? "" : s)
      .replace(/&/g, "&amp;").replace(/</g, "&lt;")
      .replace(/>/g, "&gt;").replace(/"/g, "&quot;")
      .replace(/'/g, "&#39;");
  }

  function fmtDate(iso) {
    if (!iso) return "-";
    var d = new Date(iso.length === 10 ? iso + "T00:00:00" : iso);
    if (isNaN(d.getTime())) return esc(iso);
    return d.toLocaleDateString("id-ID", { day: "numeric", month: "short", year: "numeric" });
  }

  function fmtDateTime(iso) {
    if (!iso) return "-";
    var d = new Date(iso);
    if (isNaN(d.getTime())) return "-";
    return d.toLocaleDateString("id-ID", { day: "numeric", month: "short", year: "numeric" }) +
      " " + d.toLocaleTimeString("id-ID", { hour: "2-digit", minute: "2-digit" });
  }

  function toast(kind, message) {
    var area = el("toast-area");
    var t = document.createElement("div");
    t.className = "toast " + (kind === "error" ? "toast-error" : "toast-success");
    t.textContent = message;
    area.appendChild(t);
    setTimeout(function () { t.remove(); }, 4200);
  }

  function showAlert(message) {
    var box = el("alert-area");
    box.hidden = false;
    box.textContent = message;
  }

  function authHeader() {
    try {
      var token = sessionStorage.getItem("simsarpras.token");
      if (token) return { "Authorization": "Bearer " + token };
    } catch (e) { /* abaikan */ }
    return {};
  }

  function api(path, options) {
    options = options || {};
    options.credentials = "include";
    options.headers = Object.assign(
      { "Content-Type": "application/json" }, authHeader(), options.headers || {});
    return fetch(path, options).then(function (res) {
      return res.json().catch(function () { return { ok: false }; }).then(function (data) {
        if (res.ok && data && data.ok) return data;
        var errors = (data && data.errors) || ["Terjadi kesalahan (" + res.status + ")."];
        var err = new Error(errors.join(" "));
        err.status = res.status;
        err.errors = errors;
        throw err;
      });
    }).catch(function (err) {
      if (err instanceof TypeError) {
        throw new Error("Server tidak dapat dihubungi. Periksa koneksi atau URL backend API.");
      }
      throw err;
    });
  }

  function detailText(p) {
    if (p.jenis === "peminjaman") {
      return esc(p.fasilitas) + "<br><span class=\"text-on-surface-variant\">" +
        fmtDate(p.tanggal_mulai) + " → " + fmtDate(p.tanggal_selesai) + "<br>" +
        esc(p.keperluan) + "</span>";
    }
    return "<span class=\"font-mono\">" + esc(p.kode_inventaris) + "</span><br>" +
      "<span class=\"text-on-surface-variant\">" + esc(p.deskripsi_kerusakan) + "</span>";
  }

  function statusBadge(status) {
    return '<span class="badge ' + (STATUS_BADGE[status] || "badge-info") + '">' +
      esc(STATUS_LABEL[status] || status) + "</span>";
  }

  /* ---------- Saran dummy dari InventoryStore ---------- */
  function fillDatalists() {
    try {
      if (typeof InventoryStore === "undefined") return;
      var items = InventoryStore.getAll() || [];
      var ruangan = {};
      var dlF = el("dl-fasilitas");
      var dlI = el("dl-inventaris");
      items.forEach(function (it) {
        var r = (it.ruangan || "").trim();
        if (r && !ruangan[r]) {
          ruangan[r] = true;
          var o1 = document.createElement("option");
          o1.value = r;
          dlF.appendChild(o1);
        }
        var o2 = document.createElement("option");
        o2.value = it.kode;
        o2.label = it.nama;
        dlI.appendChild(o2);
      });
    } catch (e) { /* saran opsional; abaikan */ }
  }

  /* ---------- Tampilan mahasiswa ---------- */
  function renderMine(rows) {
    var tbody = el("tabel-mine").querySelector("tbody");
    tbody.innerHTML = "";
    el("empty-mine").hidden = rows.length > 0;
    rows.forEach(function (p) {
      var tr = document.createElement("tr");
      tr.innerHTML =
        "<td class=\"font-mono\">#" + p.id + "</td>" +
        "<td>" + esc(JENIS_LABEL[p.jenis] || p.jenis) + "</td>" +
        "<td>" + detailText(p) + "</td>" +
        "<td class=\"whitespace-nowrap\">" + fmtDateTime(p.created_at) + "</td>" +
        "<td>" + statusBadge(p.status) + "</td>" +
        "<td class=\"text-on-surface-variant\">" + esc(p.catatan_admin || "-") + "</td>";
      tbody.appendChild(tr);
    });
  }

  function loadMine() {
    return api(API).then(function (data) { renderMine(data.data); });
  }

  function submitForm(formId, payload, btnId) {
    var btn = el(btnId);
    btn.disabled = true;
    return api(API, { method: "POST", body: JSON.stringify(payload) })
      .then(function () {
        toast("success", "Pengajuan berhasil dikirim. Menunggu validasi admin.");
        el(formId).reset();
        return loadMine();
      })
      .catch(function (err) {
        toast("error", err.message);
      })
      .finally(function () { btn.disabled = false; });
  }

  function initMahasiswa() {
    el("view-mahasiswa").hidden = false;
    el("page-subtitle").textContent = "Ajukan peminjaman fasilitas atau perbaikan inventaris.";
    fillDatalists();

    var tabPinjam = el("tab-peminjaman");
    var tabPerbaik = el("tab-perbaikan");
    var formPinjam = el("form-peminjaman");
    var formPerbaik = el("form-perbaikan");

    function selectTab(which) {
      var isPinjam = which === "peminjaman";
      tabPinjam.setAttribute("aria-selected", String(isPinjam));
      tabPerbaik.setAttribute("aria-selected", String(!isPinjam));
      formPinjam.hidden = !isPinjam;
      formPerbaik.hidden = isPinjam;
    }
    tabPinjam.addEventListener("click", function () { selectTab("peminjaman"); });
    tabPerbaik.addEventListener("click", function () { selectTab("perbaikan"); });

    formPinjam.addEventListener("submit", function (e) {
      e.preventDefault();
      submitForm("form-peminjaman", {
        jenis: "peminjaman",
        fasilitas: el("f-fasilitas").value,
        tanggal_mulai: el("f-tgl-mulai").value,
        tanggal_selesai: el("f-tgl-selesai").value,
        keperluan: el("f-keperluan").value
      }, "btn-kirim-peminjaman");
    });

    formPerbaik.addEventListener("submit", function (e) {
      e.preventDefault();
      submitForm("form-perbaikan", {
        jenis: "perbaikan",
        kode_inventaris: el("f-kode").value,
        deskripsi_kerusakan: el("f-kerusakan").value
      }, "btn-kirim-perbaikan");
    });

    loadMine().catch(function (err) { showAlert(err.message); });
  }

  /* ---------- Tampilan admin ---------- */
  var pendingAction = null; // {id, status}

  function renderAdmin(rows) {
    var tbody = el("tabel-admin").querySelector("tbody");
    tbody.innerHTML = "";
    el("empty-admin").hidden = rows.length > 0;
    rows.forEach(function (p) {
      var tr = document.createElement("tr");
      var aksi = p.status === "menunggu"
        ? '<div class="flex gap-2">' +
          '<button type="button" class="button button-success" data-act="setujui" data-id="' + p.id + '">Setujui</button>' +
          '<button type="button" class="button button-danger" data-act="tolak" data-id="' + p.id + '">Tolak</button>' +
          "</div>"
        : '<span class="text-on-surface-variant text-[12px]">Diproses oleh ' +
          esc(p.diproses_oleh || "-") + "<br>" + fmtDateTime(p.diproses_pada) + "</span>";
      tr.innerHTML =
        "<td class=\"font-mono\">#" + p.id + "</td>" +
        "<td>" + esc(p.pengaju || "-") + "<br><span class=\"text-on-surface-variant text-[12px]\">@" +
        esc(p.pengaju_username || "-") + "</span></td>" +
        "<td>" + esc(JENIS_LABEL[p.jenis] || p.jenis) + "</td>" +
        "<td>" + detailText(p) + "</td>" +
        "<td class=\"whitespace-nowrap\">" + fmtDateTime(p.created_at) + "</td>" +
        "<td>" + statusBadge(p.status) +
        (p.catatan_admin ? '<br><span class="text-on-surface-variant text-[12px]">' + esc(p.catatan_admin) + "</span>" : "") +
        "</td>" +
        "<td>" + aksi + "</td>";
      tbody.appendChild(tr);
    });
  }

  function loadAdmin() {
    var q = [];
    var st = el("flt-status").value;
    var jn = el("flt-jenis").value;
    if (st) q.push("status=" + encodeURIComponent(st));
    if (jn) q.push("jenis=" + encodeURIComponent(jn));
    return api(API + (q.length ? "?" + q.join("&") : "")).then(function (data) {
      renderAdmin(data.data);
    });
  }

  function openModal(id, status) {
    pendingAction = { id: id, status: status };
    el("modal-desc").textContent =
      "Pengajuan #" + id + " akan di" + (status === "disetujui" ? "setujui" : "tolak") + ".";
    el("m-catatan").value = "";
    var okBtn = el("m-ok");
    okBtn.textContent = status === "disetujui" ? "Setujui" : "Tolak";
    okBtn.className = "button " + (status === "disetujui" ? "button-success" : "button-danger");
    el("modal-backdrop").hidden = false;
    el("m-catatan").focus();
  }

  function closeModal() {
    el("modal-backdrop").hidden = true;
    pendingAction = null;
  }

  function initAdmin() {
    el("view-admin").hidden = false;
    el("page-subtitle").textContent = "Validasi pengajuan yang masuk dari mahasiswa.";

    el("btn-refresh").addEventListener("click", function () {
      loadAdmin().catch(function (err) { toast("error", err.message); });
    });
    el("flt-status").addEventListener("change", function () {
      loadAdmin().catch(function (err) { toast("error", err.message); });
    });
    el("flt-jenis").addEventListener("change", function () {
      loadAdmin().catch(function (err) { toast("error", err.message); });
    });

    el("tabel-admin").addEventListener("click", function (e) {
      var btn = e.target.closest("button[data-act]");
      if (!btn) return;
      openModal(Number(btn.getAttribute("data-id")),
        btn.getAttribute("data-act") === "setujui" ? "disetujui" : "ditolak");
    });

    el("m-batal").addEventListener("click", closeModal);
    el("modal-backdrop").addEventListener("click", function (e) {
      if (e.target === el("modal-backdrop")) closeModal();
    });
    document.addEventListener("keydown", function (e) {
      if (e.key === "Escape" && !el("modal-backdrop").hidden) closeModal();
    });

    el("m-ok").addEventListener("click", function () {
      if (!pendingAction) return;
      var btn = el("m-ok");
      btn.disabled = true;
      api(API + "/" + pendingAction.id, {
        method: "PATCH",
        body: JSON.stringify({
          status: pendingAction.status,
          catatan_admin: el("m-catatan").value
        })
      }).then(function () {
        var doneId = pendingAction.id;
        closeModal();
        toast("success", "Pengajuan #" + doneId + " berhasil diproses.");
        return loadAdmin();
      }).catch(function (err) {
        toast("error", err.message);
      }).finally(function () { btn.disabled = false; });
    });

    loadAdmin().catch(function (err) { showAlert(err.message); });
  }

  /* ---------- Init ---------- */
  function init() {
    if (typeof Auth === "undefined" || typeof Auth.isAuthenticated !== "function") {
      showAlert("Modul autentikasi tidak termuat. Muat ulang halaman.");
      return;
    }
    // Tunggu hasil /api/auth/me (protectPage di <head> mungkin masih in-flight).
    Auth.isAuthenticated().then(function (ok) {
      if (!ok) {
        // protectPage() sudah mengarahkan ke login; ini pengaman tambahan.
        showAlert("Sesi tidak ditemukan. Silakan login kembali.");
        return;
      }
      var user = Auth.getUser();
      if (!user) {
        showAlert("Sesi tidak ditemukan. Silakan login kembali.");
        return;
      }
      var chip = el("user-chip");
      chip.textContent = user.nama + " • " + (user.role === "admin" ? "Admin" : "Mahasiswa");

      if (user.role === "admin") initAdmin();
      else initMahasiswa();
    }).catch(function (err) {
      showAlert(err && err.message ? err.message : "Gagal memuat sesi.");
    });
  }

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", init);
  } else {
    init();
  }
})();
