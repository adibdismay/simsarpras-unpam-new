/**
 * SIMSARPRAS UNPAM - Laporan Module
 * Milestone 3 / Week 7 - Pemrograman Web 2
 *
 * Membaca InventoryStore dan merender laporan inventaris dengan filter.
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

  function populateFilters(data) {
    const gedungSet = new Set();
    const kategoriSet = new Set();
    
    data.forEach(function(item) {
      if (item.gedung) gedungSet.add(item.gedung);
      if (item.kategori) kategoriSet.add(item.kategori);
    });
    
    const gedungSelect = byId('report-filter-gedung');
    const kategoriSelect = byId('report-filter-kategori');
    
    if (gedungSelect) {
      Array.from(gedungSet).sort().forEach(function(g) {
        const opt = document.createElement('option');
        opt.value = g;
        opt.textContent = g;
        gedungSelect.appendChild(opt);
      });
    }
    
    if (kategoriSelect) {
      Array.from(kategoriSet).sort().forEach(function(k) {
        const opt = document.createElement('option');
        opt.value = k;
        opt.textContent = k;
        kategoriSelect.appendChild(opt);
      });
    }
  }

  function getFilteredData(data) {
    const gedung = byId('report-filter-gedung')?.value || '';
    const kategori = byId('report-filter-kategori')?.value || '';
    const kondisi = byId('report-filter-kondisi')?.value || '';
    
    return data.filter(function(item) {
      if (gedung && item.gedung !== gedung) return false;
      if (kategori && item.kategori !== kategori) return false;
      if (kondisi && item.kondisi !== kondisi) return false;
      return true;
    });
  }

  function loadReport() {
    if (typeof InventoryStore === 'undefined') {
      renderError();
      return;
    }

    let storageAccessible = true;
    try {
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

    // Populate filter dropdowns on first load
    if (!byId('report-filter-gedung')?.options.length > 1) {
      populateFilters(data);
    }

    const filteredData = getFilteredData(data);
    renderFilteredReport(filteredData);

    // Attach filter event listeners
    ['report-filter-gedung', 'report-filter-kategori', 'report-filter-kondisi'].forEach(function(id) {
      const el = byId(id);
      if (el && !el.dataset.listenerAttached) {
        el.addEventListener('change', function() {
          const filtered = getFilteredData(data);
          renderFilteredReport(filtered);
        });
        el.dataset.listenerAttached = 'true';
      }
    });
  }

  function renderFilteredReport(data) {
    if (data.length === 0) {
      renderEmpty();
      renderSummary(0, 0);
      updatePrintHeader('', '', '');
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
    
    // Update print header with current filters
    const gedung = byId('report-filter-gedung')?.value || '';
    const kategori = byId('report-filter-kategori')?.value || '';
    const kondisi = byId('report-filter-kondisi')?.value || '';
    updatePrintHeader(gedung, kategori, kondisi);
  }

  function updatePrintHeader(gedung, kategori, kondisi) {
    const dateEl = byId('print-report-date');
    const filtersEl = byId('print-report-filters');
    if (dateEl) {
      dateEl.textContent = 'Dicetak pada: ' + new Date().toLocaleDateString('id-ID', {
        day: 'numeric', month: 'long', year: 'numeric', hour: '2-digit', minute: '2-digit'
      });
    }
    if (filtersEl) {
      const parts = [];
      if (gedung) parts.push('Gedung: ' + gedung);
      if (kategori) parts.push('Kategori: ' + kategori);
      if (kondisi) parts.push('Kondisi: ' + kondisi);
      filtersEl.textContent = parts.length ? 'Filter: ' + parts.join(' | ') : 'Filter: Semua data';
    }
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
