/**
 * SIMSARPRAS UNPAM - Laporan Module
 * Milestone 3 / Week 7 - Pemrograman Web 2
 *
 * Membaca InventoryStore dan merender laporan inventaris.
 */

(function() {
  'use strict';

  function byId(id) {
    return document.getElementById(id);
  }

  function formatNumber(n) {
    return Number(n).toLocaleString('id-ID');
  }

  function renderError() {
    byId('report-table-wrap').classList.add('hidden');
    byId('report-empty').classList.add('hidden');
    byId('report-error').classList.remove('hidden');
  }

  function renderEmpty() {
    byId('report-table-wrap').classList.add('hidden');
    byId('report-error').classList.add('hidden');
    byId('report-empty').classList.remove('hidden');
  }

  function renderSummary(records, totalQty) {
    byId('report-records').textContent = formatNumber(records);
    byId('report-qty').textContent = formatNumber(totalQty);
    byId('report-date').textContent = new Date().toLocaleDateString('id-ID', {
      day: 'numeric', month: 'long', year: 'numeric'
    });
  }

  function renderRows(data) {
    const tbody = byId('report-tbody');
    tbody.textContent = '';

    data.forEach(function(item) {
      const tr = document.createElement('tr');
      tr.className = 'border-b border-surface-container-low';

      const cells = [
        { cls: 'py-3 px-4 font-code-sm text-code-sm font-semibold text-primary', value: item.kode || '' },
        { cls: 'py-3 px-3 font-medium', value: item.nama || '' },
        { cls: 'py-3 px-3 text-on-surface-variant font-body-sm text-body-sm', value: item.kategori || '' },
        { cls: 'py-3 px-3 text-on-surface-variant font-body-sm text-body-sm', value: item.lokasi || '' },
        { cls: 'py-3 px-3 text-on-surface-variant font-body-sm text-body-sm', value: item.kondisi || '' },
        { cls: 'py-3 px-3 text-center font-code-sm text-code-sm', value: formatNumber(Number(item.jumlah) || 0) }
      ];

      cells.forEach(function(cell) {
        const td = document.createElement('td');
        td.className = cell.cls;
        td.textContent = cell.value;
        tr.appendChild(td);
      });

      tbody.appendChild(tr);
    });
  }

  function loadReport() {
    if (typeof InventoryStore === 'undefined') {
      renderError();
      return;
    }

    let storageAccessible = true;
    try {
      // Deteksi kegagalan akses localStorage (mis. dinonaktifkan).
      window.localStorage.getItem(InventoryStore._storageKey);
    } catch (error) {
      storageAccessible = false;
    }

    let data;
    try {
      data = InventoryStore.getAll();
    } catch (error) {
      data = null;
    }

    if (!storageAccessible || !Array.isArray(data)) {
      renderError();
      return;
    }

    if (data.length === 0) {
      renderEmpty();
      renderSummary(0, 0);
      return;
    }

    const totalQty = data.reduce(function(sum, item) {
      return sum + (Number(item.jumlah) || 0);
    }, 0);

    byId('report-error').classList.add('hidden');
    byId('report-empty').classList.add('hidden');
    byId('report-table-wrap').classList.remove('hidden');
    renderSummary(data.length, totalQty);
    renderRows(data);
  }

  function init() {
    const printBtn = byId('btn-print');
    if (printBtn) {
      printBtn.addEventListener('click', function() {
        window.print();
      });
    }
    loadReport();
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }
})();
