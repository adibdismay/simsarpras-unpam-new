/**
 * SIMSARPRAS UNPAM - Kondisi Inventaris Module
 * Membaca InventoryStore dan merender ringkasan kondisi inventaris.
 */
(function() {
  'use strict';

  function byId(id) {
    return document.getElementById(id);
  }

  function formatNumber(n) {
    return Number(n).toLocaleString('id-ID');
  }

  function capitalizeWords(str) {
    return str.replace(/\w\S*/g, (txt) => txt.charAt(0).toUpperCase() + txt.substr(1).toLowerCase());
  }

  function renderConditions() {
    const container = byId('condition-table-wrap');
    const emptyEl = byId('condition-empty');
    const errorEl = byId('condition-error');
    const tableWrap = byId('condition-table-wrap');
    const tbody = byId('condition-tbody');
    const totalCondEl = byId('summary-total-conditions');
    const totalRecEl = byId('summary-total-records');
    const totalQtyEl = byId('summary-total-qty');

    if (!container) return;

    if (typeof InventoryStore === 'undefined') {
      if (tableWrap) tableWrap.classList.add('hidden');
      if (emptyEl) emptyEl.classList.add('hidden');
      if (errorEl) errorEl.classList.remove('hidden');
      return;
    }

    let data;
    try {
      data = InventoryStore.getAll();
    } catch (e) {
      if (tableWrap) tableWrap.classList.add('hidden');
      if (emptyEl) emptyEl.classList.add('hidden');
      if (errorEl) errorEl.classList.remove('hidden');
      return;
    }

    if (!Array.isArray(data)) {
      if (tableWrap) tableWrap.classList.add('hidden');
      if (emptyEl) emptyEl.classList.add('hidden');
      if (errorEl) errorEl.classList.remove('hidden');
      return;
    }

    if (data.length === 0) {
      if (tableWrap) tableWrap.classList.add('hidden');
      if (errorEl) errorEl.classList.add('hidden');
      if (emptyEl) emptyEl.classList.remove('hidden');
      if (totalCondEl) totalCondEl.textContent = '0';
      if (totalRecEl) totalRecEl.textContent = '0';
      if (totalQtyEl) totalQtyEl.textContent = '0';
      return;
    }

    if (errorEl) errorEl.classList.add('hidden');
    if (emptyEl) emptyEl.classList.add('hidden');
    if (tableWrap) tableWrap.classList.remove('hidden');

    const map = {};
    let totalRecords = data.length;
    let totalQtyAll = 0;

    data.forEach(item => {
      const condRaw = (item.kondisi || '').trim();
      const condName = condRaw !== '' ? capitalizeWords(condRaw) : 'Tidak Diketahui';
      const qty = Number(item.jumlah) || 0;
      totalQtyAll += qty;

      if (!map[condName]) {
        map[condName] = { count: 0, qty: 0 };
      }
      map[condName].count += 1;
      map[condName].qty += qty;
    });

    const conditions = Object.keys(map).map(name => ({
      name: name,
      count: map[name].count,
      qty: map[name].qty
    })).sort((a, b) => b.qty - a.qty);

    if (totalCondEl) totalCondEl.textContent = formatNumber(conditions.length);
    if (totalRecEl) totalRecEl.textContent = formatNumber(totalRecords);
    if (totalQtyEl) totalQtyEl.textContent = formatNumber(totalQtyAll);

    if (tbody) {
      tbody.textContent = '';
      conditions.forEach((cond, index) => {
        const tr = document.createElement('tr');
        tr.className = 'border-b border-surface-container-low hover:bg-surface-container-low/50 transition-colors';

        const tdNo = document.createElement('td');
        tdNo.className = 'py-3 px-4 text-on-surface-variant font-mono text-sm';
        tdNo.textContent = index + 1;

        const tdName = document.createElement('td');
        tdName.className = 'py-3 px-4 font-semibold text-on-surface';
        tdName.textContent = cond.name;

        const tdCount = document.createElement('td');
        tdCount.className = 'py-3 px-4 text-on-surface-variant';
        tdCount.textContent = formatNumber(cond.count);

        const tdQty = document.createElement('td');
        tdQty.className = 'py-3 px-4 text-on-surface-variant font-semibold';
        tdQty.textContent = formatNumber(cond.qty);

        const tdPct = document.createElement('td');
        tdPct.className = 'py-3 px-4 text-on-surface-variant';
        const pct = totalQtyAll > 0 ? ((cond.qty / totalQtyAll) * 100).toFixed(1) + '%' : '0%';
        tdPct.textContent = pct;

        tr.appendChild(tdNo);
        tr.appendChild(tdName);
        tr.appendChild(tdCount);
        tr.appendChild(tdQty);
        tr.appendChild(tdPct);

        tbody.appendChild(tr);
      });
    }
  }

  document.addEventListener('DOMContentLoaded', renderConditions);
})();
