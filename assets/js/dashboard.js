/**
 * SIMSARPRAS UNPAM - Dashboard Module
 * Milestone 3 / Week 7 - Pemrograman Web 2
 *
 * Menghubungkan Dashboard (layout.html) ke InventoryStore:
 * kartu ringkasan dan grafik kondisi (Chart.js).
 */

(function() {
  'use strict';

  const CONDITION_COLORS = {
    'baik': '#16A34A',
    'rusak ringan': '#D97706',
    'dalam perbaikan': '#2563EB',
    'rusak berat': '#DC2626',
    'perlu pemeriksaan': '#7C3AED'
  };
  const CONDITION_BADGE = {
    'baik': 'badge-good',
    'rusak ringan': 'badge-warning',
    'dalam perbaikan': 'badge-info',
    'rusak berat': 'badge-danger',
    'perlu pemeriksaan': 'badge-warning'
  };
  const DEFAULT_COLOR = '#6B7280';
  const DEFAULT_BADGE = 'badge-info';

  // Peta tampilan per kategori (key lowercase) + fallback kategori tak dikenal.
  const CATEGORY_META = {
    'furnitur': { icon: 'chair', color: 'text-primary', bar: 'bg-primary-container' },
    'elektronik': { icon: 'memory', color: 'text-secondary', bar: 'bg-secondary-container' },
    'komputer': { icon: 'desktop_windows', color: 'text-surface-tint', bar: 'bg-surface-tint' },
    'perangkat jaringan': { icon: 'lan', color: 'text-outline', bar: 'bg-outline' },
    'perpustakaan': { icon: 'local_library', color: 'text-secondary', bar: 'bg-secondary-container' }
  };
  const CATEGORY_FALLBACK = { icon: 'inventory_2', color: 'text-outline', bar: 'bg-outline' };

  // Urutan tingkat keparahan untuk tabel "Perlu Perhatian".
  const CONDITION_SEVERITY = {
    'rusak berat': 0,
    'rusak ringan': 1,
    'dalam perbaikan': 2,
    'perlu pemeriksaan': 3
  };
  const TINDAK_LANJUT = {
    'rusak ringan': 'Jadwalkan pemeriksaan',
    'rusak berat': 'Evaluasi perbaikan',
    'dalam perbaikan': 'Pantau progres servis',
    'perlu pemeriksaan': 'Lakukan pemeriksaan'
  };

  function byId(id) {
    return document.getElementById(id);
  }

  function formatNumber(n) {
    return Number(n).toLocaleString('id-ID');
  }

  function formatPercent(v) {
    return Number(v).toFixed(1).replace('.', ',');
  }

  function capitalize(s) {
    return s.replace(/\b\w/g, function(c) { return c.toUpperCase(); });
  }

  function badgeLabel(kondisi) {
    switch (kondisi) {
      case 'baik': return 'Siap Pakai';
      case 'rusak ringan': return 'Perlu Servis';
      case 'dalam perbaikan': return 'Ditangani';
      case 'rusak berat': return 'Karantina';
      case 'perlu pemeriksaan': return 'Perlu Periksa';
      default: return 'Tidak Diketahui';
    }
  }

  function readData() {
    if (typeof InventoryStore === 'undefined') return [];
    try {
      const data = InventoryStore.getAll();
      return Array.isArray(data) ? data : [];
    } catch (error) {
      return [];
    }
  }

  function compute(data) {
    let totalQty = 0;
    let qtyBaik = 0;
    let qtyAktif = 0;
    const byCondition = {};
    const byCategory = {};

    data.forEach(function(item) {
      const jumlah = Number(item.jumlah) || 0;
      const kondisi = (item.kondisi || '').trim().toLowerCase() || 'tidak diketahui';
      const kategoriKey = (item.kategori || '').trim().toLowerCase() || 'tidak diketahui';
      totalQty += jumlah;
      if (kondisi === 'baik') qtyBaik += jumlah;
      if ((item.status || '').trim().toLowerCase() === 'aktif') qtyAktif += jumlah;
      byCondition[kondisi] = (byCondition[kondisi] || 0) + jumlah;

      if (!byCategory[kategoriKey]) {
        byCategory[kategoriKey] = { qty: 0, records: 0, baik: 0, perlu: 0 };
      }
      byCategory[kategoriKey].qty += jumlah;
      byCategory[kategoriKey].records += 1;
      if (kondisi === 'baik') {
        byCategory[kategoriKey].baik += jumlah;
      } else {
        byCategory[kategoriKey].perlu += jumlah;
      }
    });

    return {
      records: data.length,
      totalQty: totalQty,
      qtyBaik: qtyBaik,
      qtyNonBaik: totalQty - qtyBaik,
      qtyAktif: qtyAktif,
      byCondition: byCondition,
      byCategory: byCategory
    };
  }

  function renderCards(stats) {
    const cards = {
      'stat-records': stats.records,
      'stat-qty': stats.totalQty,
      'stat-baik': stats.qtyBaik,
      'stat-nonbaik': stats.qtyNonBaik
    };
    Object.keys(cards).forEach(function(id) {
      const el = byId(id);
      if (el) el.textContent = formatNumber(cards[id]);
    });
  }

  function renderConditionList(byCondition) {
    const list = byId('condition-list');
    if (!list) return;
    list.textContent = '';

    const entries = Object.keys(byCondition).sort(function(a, b) {
      return byCondition[b] - byCondition[a];
    });

    if (entries.length === 0) {
      const row = document.createElement('div');
      row.className = 'condition-row';
      row.textContent = 'Belum ada data kondisi';
      list.appendChild(row);
      return;
    }

    entries.forEach(function(kondisi) {
      const row = document.createElement('div');
      row.className = 'condition-row';

      const label = document.createElement('span');
      label.className = 'font-semibold';
      label.textContent = capitalize(kondisi);

      const count = document.createElement('span');
      count.className = 'font-mono';
      count.textContent = formatNumber(byCondition[kondisi]) + ' Unit';

      const badge = document.createElement('span');
      badge.className = 'badge ' + (CONDITION_BADGE[kondisi] || DEFAULT_BADGE);
      badge.textContent = badgeLabel(kondisi);

      row.appendChild(label);
      row.appendChild(count);
      row.appendChild(badge);
      list.appendChild(row);
    });
  }

  function chartTextColor() {
    return document.documentElement.getAttribute('data-theme') === 'dark' ? '#e2e8f0' : '#111827';
  }

  function renderChart(byCondition) {
    const canvas = byId('condition-chart');
    const fallback = byId('chart-fallback');
    if (!canvas) return;

    const entries = Object.keys(byCondition);
    if (typeof Chart === 'undefined' || entries.length === 0) {
      if (fallback) fallback.classList.remove('hidden');
      return;
    }

    const labels = [];
    const values = [];
    const colors = [];
    entries.forEach(function(kondisi) {
      labels.push(capitalize(kondisi));
      values.push(byCondition[kondisi]);
      colors.push(CONDITION_COLORS[kondisi] || DEFAULT_COLOR);
    });

    try {
      if (window.__conditionChart) window.__conditionChart.destroy();
      window.__conditionChart = new Chart(canvas, {
        type: 'doughnut',
        data: {
          labels: labels,
          datasets: [{
            data: values,
            backgroundColor: colors,
            borderWidth: 0
          }]
        },
        options: {
          responsive: true,
          maintainAspectRatio: true,
          cutout: '70%',
          plugins: {
            legend: {
              position: 'bottom',
              labels: { usePointStyle: true, boxWidth: 8, color: chartTextColor() }
            },
            tooltip: {
              titleColor: chartTextColor(),
              bodyColor: chartTextColor(),
              callbacks: {
                label: function(ctx) {
                  const total = ctx.dataset.data.reduce(function(a, b) { return a + b; }, 0);
                  const pct = total ? Math.round((ctx.parsed / total) * 1000) / 10 : 0;
                  return ' ' + ctx.label + ': ' + formatNumber(ctx.parsed) + ' Unit (' + pct + '%)';
                }
              }
            }
          }
        }
      });
      if (fallback) fallback.classList.add('hidden');
    } catch (error) {
      if (fallback) fallback.classList.remove('hidden');
    }
  }

  function renderCategoryDistribution(stats) {
    const container = byId('category-distribution');
    if (!container) return;
    container.textContent = '';

    const byCategory = stats.byCategory || {};
    const totalQty = stats.totalQty || 0;
    const keys = Object.keys(byCategory).sort(function(a, b) {
      return byCategory[b].qty - byCategory[a].qty;
    });

    if (keys.length === 0) {
      const empty = document.createElement('p');
      empty.className = 'panel-description';
      empty.textContent = 'Belum ada data inventaris.';
      container.appendChild(empty);
      return;
    }

    keys.forEach(function(key) {
      const cat = byCategory[key];
      const meta = CATEGORY_META[key] || CATEGORY_FALLBACK;
      const pct = totalQty ? (cat.qty / totalQty) * 100 : 0;

      const block = document.createElement('div');

      const head = document.createElement('div');
      head.className = 'flex flex-wrap justify-between gap-2 text-label-md mb-2';

      const nameP = document.createElement('p');
      nameP.className = 'flex items-center gap-2 font-bold';
      const iconSpan = document.createElement('span');
      iconSpan.className = 'material-symbols-outlined ' + meta.color;
      iconSpan.setAttribute('aria-hidden', 'true');
      iconSpan.textContent = meta.icon;
      nameP.appendChild(iconSpan);
      nameP.appendChild(document.createTextNode(capitalize(key)));

      const valP = document.createElement('p');
      const qtySpan = document.createElement('span');
      qtySpan.className = 'font-bold ' + meta.color;
      qtySpan.textContent = formatNumber(cat.qty) + ' item';
      const pctSpan = document.createElement('span');
      pctSpan.className = 'font-mono text-on-surface-variant';
      pctSpan.textContent = '(' + formatPercent(pct) + '%)';
      valP.appendChild(qtySpan);
      valP.appendChild(document.createTextNode(' '));
      valP.appendChild(pctSpan);

      head.appendChild(nameP);
      head.appendChild(valP);

      const barWrap = document.createElement('div');
      barWrap.className = 'h-3 rounded-full bg-surface-container overflow-hidden';
      barWrap.setAttribute('aria-hidden', 'true');
      const bar = document.createElement('div');
      bar.className = 'h-full rounded-full ' + meta.bar;
      // CSS butuh titik desimal; teks tetap pakai formatPercent (koma).
      bar.style.width = Number(pct).toFixed(1) + '%';
      barWrap.appendChild(bar);

      const desc = document.createElement('p');
      desc.className = 'panel-description mt-2';
      desc.textContent =
        formatNumber(cat.records) + ' record · kondisi baik ' + formatNumber(cat.baik) +
        ' unit · perlu perhatian ' + formatNumber(cat.perlu) + ' unit';

      block.appendChild(head);
      block.appendChild(barWrap);
      block.appendChild(desc);
      container.appendChild(block);
    });
  }

  function renderAttention(data) {
    const tbody = byId('attention-tbody');
    const badge = byId('attention-badge');
    const all = Array.isArray(data) ? data : [];

    const nonBaikCount = all.filter(function(item) {
      return (item.kondisi || '').trim().toLowerCase() !== 'baik';
    }).length;

    const list = all.filter(function(item) {
      const k = (item.kondisi || '').trim().toLowerCase();
      return Object.prototype.hasOwnProperty.call(CONDITION_SEVERITY, k);
    });

    if (badge) {
      badge.textContent = nonBaikCount === 0 ? 'Semua kondisi baik' : formatNumber(nonBaikCount) + ' inventaris';
    }

    if (!tbody) return;
    tbody.textContent = '';

    if (list.length === 0) {
      const tr = document.createElement('tr');
      const td = document.createElement('td');
      td.colSpan = 4;
      td.className = 'text-on-surface-variant text-body-sm';
      td.textContent = 'Seluruh inventaris dalam kondisi baik.';
      tr.appendChild(td);
      tbody.appendChild(tr);
      return;
    }

    list.sort(function(a, b) {
      const ka = (a.kondisi || '').trim().toLowerCase();
      const kb = (b.kondisi || '').trim().toLowerCase();
      const diff = CONDITION_SEVERITY[ka] - CONDITION_SEVERITY[kb];
      if (diff !== 0) return diff;
      return String(a.nama || '').localeCompare(String(b.nama || ''), 'id');
    });

    list.forEach(function(item) {
      const kondisi = (item.kondisi || '').trim().toLowerCase();

      const tr = document.createElement('tr');

      const th = document.createElement('th');
      th.setAttribute('scope', 'row');
      th.className = 'font-semibold';
      th.textContent = item.nama || '';

      const tdLokasi = document.createElement('td');
      tdLokasi.textContent = item.lokasi || item.ruangan || item.gedung || '-';

      const tdKondisi = document.createElement('td');
      const badgeSpan = document.createElement('span');
      badgeSpan.className = 'badge ' + (CONDITION_BADGE[kondisi] || DEFAULT_BADGE) + ' whitespace-nowrap';
      badgeSpan.textContent = capitalize(kondisi);
      tdKondisi.appendChild(badgeSpan);

      const tdTindak = document.createElement('td');
      tdTindak.textContent = TINDAK_LANJUT[kondisi] || '-';

      tr.appendChild(th);
      tr.appendChild(tdLokasi);
      tr.appendChild(tdKondisi);
      tr.appendChild(tdTindak);
      tbody.appendChild(tr);
    });
  }

  function renderCapacityPct(stats) {
    const el = byId('capacity-pct');
    if (!el) return;
    const totalQty = stats.totalQty || 0;
    const pct = totalQty ? ((stats.qtyAktif || 0) / totalQty) * 100 : 0;
    el.textContent = 'Kapasitas fasilitas terpakai ' + formatPercent(pct) + '% dari total alokasi inventaris aktif.';
  }

  function init() {
    const data = readData();
    const stats = compute(data);
    renderCards(stats);
    renderConditionList(stats.byCondition);
    renderChart(stats.byCondition);
    renderCategoryDistribution(stats);
    renderAttention(data);
    renderCapacityPct(stats);
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }

  // Perbarui warna teks/legend/tooltip chart saat tema berubah (tanpa instance baru).
  window.addEventListener('themechange', function () {
    if (!window.__conditionChart) return;
    var c = chartTextColor();
    window.__conditionChart.options.plugins.legend.labels.color = c;
    window.__conditionChart.options.plugins.tooltip.titleColor = c;
    window.__conditionChart.options.plugins.tooltip.bodyColor = c;
    window.__conditionChart.update();
  });
})();
