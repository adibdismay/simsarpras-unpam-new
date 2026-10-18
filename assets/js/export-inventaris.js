/**
 * SIMSARPRAS UNPAM - Export CSV Module
 * Mengaktifkan tombol Ekspor CSV pada data-master.html.
 */
(function() {
  'use strict';

  function sanitizeCell(val) {
    if (val === null || val === undefined) return '""';
    let str = String(val);
    
    // Lindungi dari formula injection (=, +, -, @, tab, carriage return)
    if (/^[=+\-@\t\r]/.test(str)) {
      str = "'" + str;
    }

    // Escaping kutip ganda dan bungkus dengan kutip
    str = str.replace(/"/g, '""');
    return '"' + str + '"';
  }

  function handleExport() {
    if (typeof InventoryStore === 'undefined') {
      alert('Gagal mengekspor: InventoryStore tidak ditemukan.');
      return;
    }

    let data;
    try {
      data = InventoryStore.getAll();
    } catch (e) {
      alert('Gagal membaca data inventaris dari penyimpanan.');
      return;
    }

    if (!Array.isArray(data) || data.length === 0) {
      alert('Tidak ada data inventaris untuk diekspor.');
      return;
    }

    const headers = ['Kode', 'Nama', 'Kategori', 'Gedung', 'Lokasi', 'Kondisi', 'Jumlah'];
    const rows = [headers.map(sanitizeCell).join(',')];

    data.forEach(item => {
      const rowVals = [
        item.kode || '',
        item.nama || '',
        item.kategori || '',
        item.gedung || '',
        item.lokasi || '',
        item.kondisi || '',
        item.jumlah !== undefined && item.jumlah !== null ? item.jumlah : ''
      ];
      rows.push(rowVals.map(sanitizeCell).join(','));
    });

    const csvContent = '\uFEFF' + rows.join('\r\n');
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);

    const today = new Date().toISOString().split('T')[0];
    const a = document.createElement('a');
    a.href = url;
    a.download = 'inventaris-' + today + '.csv';
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);

    setTimeout(() => {
      URL.revokeObjectURL(url);
    }, 1000);
  }

  function initExport() {
    const btn = document.getElementById('btn-export');
    if (!btn) return;

    btn.removeAttribute('disabled');
    btn.title = 'Ekspor seluruh data inventaris ke format CSV';
    
    // Ubah teks tombol menjadi "Ekspor Semua CSV" sesuai ketentuan
    const span = btn.querySelector('span:not(.material-symbols-outlined)');
    if (span) {
      span.textContent = 'Ekspor Semua CSV';
    }

    btn.addEventListener('click', handleExport);
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initExport);
  } else {
    initExport();
  }
})();
