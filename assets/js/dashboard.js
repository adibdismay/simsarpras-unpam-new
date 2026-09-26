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

  function byId(id) {
    return document.getElementById(id);
  }

  function formatNumber(n) {
    return Number(n).toLocaleString('id-ID');
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
    const byCondition = {};

    data.forEach(function(item) {
      const jumlah = Number(item.jumlah) || 0;
      const kondisi = (item.kondisi || '').trim().toLowerCase() || 'tidak diketahui';
      totalQty += jumlah;
      if (kondisi === 'baik') qtyBaik += jumlah;
      byCondition[kondisi] = (byCondition[kondisi] || 0) + jumlah;
    });

    return {
      records: data.length,
      totalQty: totalQty,
      qtyBaik: qtyBaik,
      qtyNonBaik: totalQty - qtyBaik,
      byCondition: byCondition
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

  function init() {
    const data = readData();
    const stats = compute(data);
    renderCards(stats);
    renderConditionList(stats.byCondition);
    renderChart(stats.byCondition);
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
