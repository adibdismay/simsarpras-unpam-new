/**
 * SIMSARPRAS UNPAM - Dynamic Notifications Module
 * Menampilkan daftar inventaris yang memerlukan pemeriksaan (kondisi "perlu pemeriksaan").
 */
(function() {
  'use strict';

  function initNotifications() {
    const wrapper = document.createElement('div');
    wrapper.className = 'relative inline-block';

    const btn = document.createElement('button');
    btn.type = 'button';
    btn.className = 'icon-button relative';
    btn.setAttribute('aria-label', 'Notifikasi inventaris');
    btn.setAttribute('aria-expanded', 'false');
    btn.setAttribute('aria-controls', 'notification-panel');
    btn.title = 'Notifikasi Inventaris';

    const icon = document.createElement('span');
    icon.className = 'material-symbols-outlined';
    icon.setAttribute('aria-hidden', 'true');
    icon.textContent = 'notifications';
    btn.appendChild(icon);

    const badge = document.createElement('span');
    badge.className = 'absolute top-0 right-0 w-4 h-4 rounded-full bg-error text-white text-[10px] flex items-center justify-center hidden';
    badge.id = 'notif-badge';
    btn.appendChild(badge);

    const panel = document.createElement('div');
    panel.id = 'notification-panel';
    panel.className = 'absolute right-0 mt-2 w-80 max-w-[calc(100vw-32px)] bg-white dark:bg-slate-900 border border-outline-variant rounded-xl shadow-xl z-50 p-4 hidden';
    panel.setAttribute('role', 'region');
    panel.setAttribute('aria-label', 'Daftar Notifikasi');

    const headerEl = document.createElement('div');
    headerEl.className = 'flex items-center justify-between pb-3 border-b border-outline-variant mb-3';
    
    const titleEl = document.createElement('h3');
    titleEl.className = 'font-semibold text-body-md text-on-surface';
    titleEl.textContent = 'Perlu Pemeriksaan';
    headerEl.appendChild(titleEl);

    const countEl = document.createElement('span');
    countEl.id = 'notif-count-label';
    countEl.className = 'text-label-sm text-on-surface-variant';
    headerEl.appendChild(countEl);

    panel.appendChild(headerEl);

    const contentEl = document.createElement('div');
    contentEl.id = 'notif-content';
    contentEl.className = 'max-h-64 overflow-y-auto space-y-2';
    panel.appendChild(contentEl);

    wrapper.appendChild(btn);
    wrapper.appendChild(panel);

    // Cari placeholder lonceng lama di layout.html
    const oldContainer = document.querySelector('header .relative > button[aria-label*="Notifikasi"]')?.parentElement;
    if (oldContainer) {
      oldContainer.replaceWith(wrapper);
    } else {
      // Fallback jika struktur berbeda
      const headerActions = document.querySelector('.header-actions');
      if (headerActions) headerActions.prepend(wrapper);
    }

    function getData() {
      if (typeof InventoryStore === 'undefined') {
        return { error: true, items: [] };
      }
      try {
        const all = InventoryStore.getAll();
        if (!Array.isArray(all)) return { error: true, items: [] };
        const items = all.filter(item => item.kondisi && item.kondisi.trim().toLowerCase() === 'perlu pemeriksaan');
        return { error: false, items: items };
      } catch (e) {
        return { error: true, items: [] };
      }
    }

    function updateBadge() {
      const res = getData();
      if (res.error) {
        badge.classList.add('hidden');
        return;
      }
      const count = res.items.length;
      if (count > 0) {
        badge.textContent = count > 99 ? '99+' : count;
        badge.classList.remove('hidden');
      } else {
        badge.classList.add('hidden');
      }
    }

    function renderPanel() {
      contentEl.textContent = '';
      const res = getData();

      if (res.error) {
        const errP = document.createElement('p');
        errP.className = 'text-body-sm text-error py-2 text-center';
        errP.textContent = 'Gagal memuat data inventaris.';
        contentEl.appendChild(errP);
        countEl.textContent = 'Error';
        return;
      }

      const items = res.items;
      countEl.textContent = items.length + ' item';

      if (items.length === 0) {
        const emptyP = document.createElement('p');
        emptyP.className = 'text-body-sm text-on-surface-variant py-4 text-center';
        emptyP.textContent = 'Tidak ada inventaris yang perlu diperiksa';
        contentEl.appendChild(emptyP);
        return;
      }

      items.forEach(item => {
        const row = document.createElement('div');
        row.className = 'p-2 rounded-lg bg-surface-container-low flex items-center justify-between gap-2';

        const info = document.createElement('div');
        info.className = 'min-w-0';

        const codeP = document.createElement('p');
        codeP.className = 'font-mono text-label-sm font-semibold text-primary';
        codeP.textContent = item.kode || '-';
        info.appendChild(codeP);

        const nameP = document.createElement('p');
        nameP.className = 'text-body-sm text-on-surface truncate';
        nameP.textContent = item.nama || '-';
        info.appendChild(nameP);

        row.appendChild(info);

        const editBtn = document.createElement('a');
        editBtn.href = 'form-inventaris.html?id=' + item.id;
        editBtn.className = 'button button-secondary text-label-sm px-2.5 py-1.5 h-auto flex-shrink-0';
        editBtn.textContent = 'Edit';
        row.appendChild(editBtn);

        contentEl.appendChild(row);
      });
    }

    function setPanelOpen(open) {
      panel.classList.toggle('hidden', !open);
      btn.setAttribute('aria-expanded', String(open));
      if (open) {
        renderPanel();
      }
    }

    btn.addEventListener('click', (e) => {
      e.stopPropagation();
      const isOpen = !panel.classList.contains('hidden');
      setPanelOpen(!isOpen);
    });

    document.addEventListener('click', (e) => {
      if (!wrapper.contains(e.target)) {
        setPanelOpen(false);
      }
    });

    document.addEventListener('keydown', (e) => {
      if (e.key === 'Escape') {
        setPanelOpen(false);
      }
    });

    window.addEventListener('pageshow', () => {
      updateBadge();
    });

    updateBadge();
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initNotifications);
  } else {
    initNotifications();
  }
})();
