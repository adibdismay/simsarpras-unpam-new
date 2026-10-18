/**
 * SIMSARPRAS UNPAM - Pemeliharaan Module
 * Membaca InventoryStore, memfilter inventaris berdasarkan kondisi aktual yang memerlukan pemeliharaan
 * (Perlu Pemeriksaan, Rusak Ringan, Rusak Berat, Dalam Perbaikan), dan merender tabel serta ringkasan.
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
    if (k === 'perlu pemeriksaan') return 'bg-rose-100 text-rose-800 dark:bg-rose-950 dark:text-rose-300';
    if (k === 'rusak ringan') return 'bg-amber-100 text-amber-800 dark:bg-amber-950 dark:text-amber-300';
    if (k === 'rusak berat') return 'bg-red-100 text-red-800 dark:bg-red-950 dark:text-red-300';
    if (k === 'dalam perbaikan') return 'bg-blue-100 text-blue-800 dark:bg-blue-950 dark:text-blue-300';
    return 'bg-slate-100 text-slate-800 dark:bg-slate-800 dark:text-slate-300';
  }

  const MAINTENANCE_CONDITIONS = ['perlu pemeriksaan', 'rusak ringan', 'rusak berat', 'dalam perbaikan'];

  function initPemeliharaan() {
    const tableWrap = byId('maint-table-wrap');
    const tbody = byId('maint-tbody');
    const emptyEl = byId('maint-empty');
    const errorEl = byId('maint-error');
    const searchInput = byId('search-input');
    const filterKondisi = byId('filter-kondisi');
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

    // Filter inventaris yang memerlukan pemeliharaan (kondisi aktual)
    const maintItems = allData.filter(item => {
      const k = (item.kondisi || '').trim().toLowerCase();
      return MAINTENANCE_CONDITIONS.includes(k);
    });

    function render() {
      const searchTerm = (searchInput ? searchInput.value : '').trim().toLowerCase();
      const selectedCondition = (filterKondisi ? filterKondisi.value : '').trim().toLowerCase();

      const filtered = maintItems.filter(item => {
        const k = (item.kondisi || '').trim().toLowerCase();
        if (selectedCondition && k !== selectedCondition) {
          return false;
        }
        if (searchTerm) {
          const kode = (item.kode || '').toLowerCase();
          const nama = (item.nama || '').toLowerCase();
          if (!kode.includes(searchTerm) && !nama.includes(searchTerm)) {
            return false;
          }
        }
        return true;
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

        const tdLokasi = document.createElement('td');
        tdLokasi.className = 'py-3 px-4 text-on-surface-variant';
        const loc = item.lokasi || ((item.gedung || '') + (item.ruangan ? ' - ' + item.ruangan : ''));
        tdLokasi.textContent = loc !== '' ? loc : '-';

        const tdKondisi = document.createElement('td');
        tdKondisi.className = 'py-3 px-4';
        const badge = document.createElement('span');
        badge.className = 'inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold ' + getBadgeClass(item.kondisi);
        badge.textContent = item.kondisi || '-';
        tdKondisi.appendChild(badge);

        const tdJumlah = document.createElement('td');
        tdJumlah.className = 'py-3 px-4 font-semibold text-on-surface';
        tdJumlah.textContent = formatNumber(item.jumlah || 0);

        const tdAksi = document.createElement('td');
        tdAksi.className = 'py-3 px-4';
        const actionLink = document.createElement('a');
        actionLink.className = 'inline-flex items-center gap-1 p-1.5 rounded hover:bg-surface-container text-primary hover:text-primary-container font-label-sm text-label-sm font-semibold transition-colors';
        actionLink.href = 'form-inventaris.html?id=' + encodeURIComponent(item.id);
        actionLink.textContent = 'Perbarui Kondisi';
        tdAksi.appendChild(actionLink);

        tr.appendChild(tdNo);
        tr.appendChild(tdKode);
        tr.appendChild(tdNama);
        tr.appendChild(tdLokasi);
        tr.appendChild(tdKondisi);
        tr.appendChild(tdJumlah);
        tr.appendChild(tdAksi);

        tbody.appendChild(tr);
      });
    }

    render();

    if (searchInput) {
      searchInput.addEventListener('input', render);
    }
    if (filterKondisi) {
      filterKondisi.addEventListener('change', render);
    }
  }

  document.addEventListener('DOMContentLoaded', initPemeliharaan);
})();
