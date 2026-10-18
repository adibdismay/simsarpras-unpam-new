/**
 * SIMSARPRAS UNPAM - Kategori Inventaris Module
 * Membaca InventoryStore dan merender ringkasan kategori inventaris.
 */
(function() {
  'use strict';

  function byId(id) {
    return document.getElementById(id);
  }

  function formatNumber(n) {
    return Number(n).toLocaleString('id-ID');
  }

  function renderCategories() {
    const container = byId('category-table-wrap');
    const emptyEl = byId('category-empty');
    const errorEl = byId('category-error');
    const tableWrap = byId('category-table-wrap');
    const tbody = byId('category-tbody');
    const totalCatEl = byId('summary-total-categories');
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
      if (totalCatEl) totalCatEl.textContent = '0';
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
      const katRaw = (item.kategori || '').trim();
      const katName = katRaw !== '' ? katRaw : 'Tanpa Kategori';
      const qty = Number(item.jumlah) || 0;
      totalQtyAll += qty;

      if (!map[katName]) {
        map[katName] = { count: 0, qty: 0 };
      }
      map[katName].count += 1;
      map[katName].qty += qty;
    });

    const categories = Object.keys(map).map(name => ({
      name: name,
      count: map[name].count,
      qty: map[name].qty
    })).sort((a, b) => b.qty - a.qty);

    if (totalCatEl) totalCatEl.textContent = formatNumber(categories.length);
    if (totalRecEl) totalRecEl.textContent = formatNumber(totalRecords);
    if (totalQtyEl) totalQtyEl.textContent = formatNumber(totalQtyAll);

    if (tbody) {
      tbody.textContent = '';
      categories.forEach((cat, index) => {
        const tr = document.createElement('tr');
        tr.className = 'border-b border-surface-container-low hover:bg-surface-container-low/50 transition-colors';

        const tdNo = document.createElement('td');
        tdNo.className = 'py-3 px-4 text-on-surface-variant font-code-sm text-code-sm';
        tdNo.textContent = String(index + 1);

        const tdName = document.createElement('td');
        tdName.className = 'py-3 px-4 font-semibold text-on-surface';
        tdName.textContent = cat.name;

        const tdCount = document.createElement('td');
        tdCount.className = 'py-3 px-4 text-on-surface-variant';
        tdCount.textContent = formatNumber(cat.count) + ' record';

        const tdQty = document.createElement('td');
        tdQty.className = 'py-3 px-4 font-bold text-primary';
        tdQty.textContent = formatNumber(cat.qty) + ' unit';

        tr.appendChild(tdNo);
        tr.appendChild(tdName);
        tr.appendChild(tdCount);
        tr.appendChild(tdQty);
        tbody.appendChild(tr);
      });
    }
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', renderCategories);
  } else {
    renderCategories();
  }

  window.addEventListener('pageshow', renderCategories);
})();
