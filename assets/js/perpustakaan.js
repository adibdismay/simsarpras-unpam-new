/**
 * SIMSARPRAS UNPAM - Perpustakaan Module
 * Membaca InventoryStore, memfilter inventaris perpustakaan menggunakan kata utuh "perpustakaan" 
 * atau prefix INV-PUS- (dengan pengecekan konflik jika lokasi eksplisit non-perpustakaan), dan merender tabel serta ringkasan.
 */
(function() {
  'use strict';

  function byId(id) {
    return document.getElementById(id);
  }

  function formatNumber(n) {
    return Number(n).toLocaleString('id-ID');
  }

  function getBadgeClass(kondisi) {
    const k = (kondisi || '').trim().toLowerCase();
    if (k === 'baik') return 'bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300';
    if (k === 'rusak ringan') return 'bg-amber-100 text-amber-800 dark:bg-amber-950 dark:text-amber-300';
    if (k === 'dalam perbaikan') return 'bg-blue-100 text-blue-800 dark:bg-blue-950 dark:text-blue-300';
    if (k === 'perlu pemeriksaan') return 'bg-rose-100 text-rose-800 dark:bg-rose-950 dark:text-rose-300';
    return 'bg-slate-100 text-slate-800 dark:bg-slate-800 dark:text-slate-300';
  }

  const perpusRegex = /\bperpustakaan\b/i;
  const nonPerpusRoomRegex = /^ruang\s+/i;

  function initPerpustakaan() {
    const tableWrap = byId('perpus-table-wrap');
    const tbody = byId('perpus-tbody');
    const emptyEl = byId('perpus-empty');
    const errorEl = byId('perpus-error');
    const searchInput = byId('search-input');
    const totalRecEl = byId('summary-total-records');
    const totalQtyEl = byId('summary-total-qty');

    if (!tbody) return;

    if (typeof InventoryStore === 'undefined') {
      if (tableWrap) tableWrap.classList.add('hidden');
      if (emptyEl) emptyEl.classList.add('hidden');
      if (errorEl) errorEl.classList.remove('hidden');
      return;
    }

    let allData = [];
    try {
      allData = InventoryStore.getAll();
    } catch (e) {
      if (tableWrap) tableWrap.classList.add('hidden');
      if (emptyEl) emptyEl.classList.add('hidden');
      if (errorEl) errorEl.classList.remove('hidden');
      return;
    }

    if (!Array.isArray(allData)) {
      if (tableWrap) tableWrap.classList.add('hidden');
      if (emptyEl) emptyEl.classList.add('hidden');
      if (errorEl) errorEl.classList.remove('hidden');
      return;
    }

    // Filter khusus perpustakaan: kata utuh "perpustakaan" pada ruangan/lokasi atau prefix INV-PUS- (tanpa konflik dengan ruangan non-perpustakaan)
    const perpusItems = allData.filter(item => {
      const kode = (item.kode || '').toUpperCase();
      const ruangan = (item.ruangan || '').trim();
      const lokasi = (item.lokasi || '').trim();
      const hasPerpusCode = kode.startsWith('INV-PUS');
      const hasPerpusText = perpusRegex.test(ruangan) || perpusRegex.test(lokasi);

      if (hasPerpusCode && !hasPerpusText && nonPerpusRoomRegex.test(ruangan)) {
        console.warn('Konflik pemetaan perpustakaan terdeteksi untuk item:', item.kode, 'di ruangan:', ruangan);
        return false;
      }
      return hasPerpusCode || hasPerpusText;
    });

    function render(searchTerm = '') {
      const term = searchTerm.trim().toLowerCase();
      const filtered = perpusItems.filter(item => {
        if (!term) return true;
        const kode = (item.kode || '').toLowerCase();
        const nama = (item.nama || '').toLowerCase();
        return kode.includes(term) || nama.includes(term);
      });

      if (filtered.length === 0) {
        if (tableWrap) tableWrap.classList.add('hidden');
        if (errorEl) errorEl.classList.add('hidden');
        if (emptyEl) emptyEl.classList.remove('hidden');
        if (totalRecEl) totalRecEl.textContent = '0';
        if (totalQtyEl) totalQtyEl.textContent = '0';
        return;
      }

      if (errorEl) errorEl.classList.add('hidden');
      if (emptyEl) emptyEl.classList.add('hidden');
      if (tableWrap) tableWrap.classList.remove('hidden');

      let totalQty = 0;
      filtered.forEach(item => {
        totalQty += Number(item.jumlah) || 0;
      });

      if (totalRecEl) totalRecEl.textContent = formatNumber(filtered.length);
      if (totalQtyEl) totalQtyEl.textContent = formatNumber(totalQty);

      tbody.textContent = '';
      filtered.forEach((item, index) => {
        const tr = document.createElement('tr');
        tr.className = 'border-b border-surface-container-low hover:bg-surface-container-low/50 transition-colors';

        const tdNo = document.createElement('td');
        tdNo.className = 'py-3 px-4 text-on-surface-variant font-mono text-sm';
        tdNo.textContent = index + 1;

        const tdKode = document.createElement('td');
        tdKode.className = 'py-3 px-4 font-mono font-semibold text-primary';
        tdKode.textContent = item.kode || '-';

        const tdNama = document.createElement('td');
        tdNama.className = 'py-3 px-4 font-semibold text-on-surface';
        tdNama.textContent = item.nama || '-';

        const tdGedung = document.createElement('td');
        tdGedung.className = 'py-3 px-4 text-on-surface-variant';
        tdGedung.textContent = item.gedung || '-';

        const tdRuangan = document.createElement('td');
        tdRuangan.className = 'py-3 px-4 text-on-surface-variant';
        tdRuangan.textContent = item.ruangan || '-';

        const tdKondisi = document.createElement('td');
        tdKondisi.className = 'py-3 px-4';
        const badge = document.createElement('span');
        badge.className = 'inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold ' + getBadgeClass(item.kondisi);
        badge.textContent = item.kondisi || 'Baik';
        tdKondisi.appendChild(badge);

        const tdJumlah = document.createElement('td');
        tdJumlah.className = 'py-3 px-4 font-semibold text-on-surface';
        tdJumlah.textContent = formatNumber(item.jumlah || 0);

        tr.appendChild(tdNo);
        tr.appendChild(tdKode);
        tr.appendChild(tdNama);
        tr.appendChild(tdGedung);
        tr.appendChild(tdRuangan);
        tr.appendChild(tdKondisi);
        tr.appendChild(tdJumlah);

        tbody.appendChild(tr);
      });
    }

    render();

    if (searchInput) {
      searchInput.addEventListener('input', (e) => {
        render(e.target.value);
      });
    }
  }

  document.addEventListener('DOMContentLoaded', initPerpustakaan);
})();
