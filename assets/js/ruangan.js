/**
 * SIMSARPRAS UNPAM - Ruangan Module
 * Membaca InventoryStore dan merender ringkasan inventaris berdasarkan kombinasi gedung + ruangan (lokasi).
 */
(function() {
  'use strict';

  function byId(id) {
    return document.getElementById(id);
  }

  function formatNumber(n) {
    return Number(n).toLocaleString('id-ID');
  }

  function renderRooms() {
    const container = byId('room-table-wrap');
    const emptyEl = byId('room-empty');
    const errorEl = byId('room-error');
    const tableWrap = byId('room-table-wrap');
    const tbody = byId('room-tbody');
    const totalRoomEl = byId('summary-total-rooms');
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
      if (totalRoomEl) totalRoomEl.textContent = '0';
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
      const bldRaw = (item.gedung || '').trim();
      const bldName = bldRaw !== '' ? bldRaw : 'Tanpa Gedung';

      const roomRaw = (item.ruangan || item.lokasi || '').trim();
      const roomName = roomRaw !== '' ? roomRaw : 'Tanpa Lokasi';

      const key = bldName + '|||' + roomName;
      const qty = Number(item.jumlah) || 0;
      totalQtyAll += qty;

      if (!map[key]) {
        map[key] = { gedung: bldName, ruangan: roomName, count: 0, qty: 0 };
      }
      map[key].count += 1;
      map[key].qty += qty;
    });

    const rooms = Object.keys(map).map(k => map[k]).sort((a, b) => b.qty - a.qty);

    if (totalRoomEl) totalRoomEl.textContent = formatNumber(rooms.length);
    if (totalRecEl) totalRecEl.textContent = formatNumber(totalRecords);
    if (totalQtyEl) totalQtyEl.textContent = formatNumber(totalQtyAll);

    if (tbody) {
      tbody.textContent = '';
      rooms.forEach((room, index) => {
        const tr = document.createElement('tr');
        tr.className = 'border-b border-surface-container-low hover:bg-surface-container-low/50 transition-colors';

        const tdNo = document.createElement('td');
        tdNo.className = 'py-3 px-4 text-on-surface-variant font-code-sm text-code-sm';
        tdNo.textContent = String(index + 1);

        const tdGedung = document.createElement('td');
        tdGedung.className = 'py-3 px-4 font-semibold text-on-surface';
        tdGedung.textContent = room.gedung;

        const tdRuangan = document.createElement('td');
        tdRuangan.className = 'py-3 px-4 font-medium text-on-surface';
        tdRuangan.textContent = room.ruangan;

        const tdCount = document.createElement('td');
        tdCount.className = 'py-3 px-4 text-on-surface-variant';
        tdCount.textContent = formatNumber(room.count) + ' record';

        const tdQty = document.createElement('td');
        tdQty.className = 'py-3 px-4 font-bold text-primary';
        tdQty.textContent = formatNumber(room.qty) + ' unit';

        tr.appendChild(tdNo);
        tr.appendChild(tdGedung);
        tr.appendChild(tdRuangan);
        tr.appendChild(tdCount);
        tr.appendChild(tdQty);
        tbody.appendChild(tr);
      });
    }
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', renderRooms);
  } else {
    renderRooms();
  }

  window.addEventListener('pageshow', renderRooms);
})();
