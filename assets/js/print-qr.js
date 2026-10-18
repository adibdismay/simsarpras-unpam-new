/**
 * SIMSARPRAS UNPAM - Print QR Module
 * Mengaktifkan tombol Cetak Barcode/QR (btn-print-qr) untuk item terpilih di data-master.html.
 */
(function() {
  'use strict';

  function sanitize(str) {
    if (!str) return '';
    return String(str)
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;')
      .replace(/'/g, '&#039;');
  }

  function handlePrintQR() {
    if (typeof InventoryStore === 'undefined') {
      alert('Gagal mencetak QR: InventoryStore tidak ditemukan.');
      return;
    }

    if (typeof qrcode === 'undefined') {
      console.error('Library qrcode belum dimuat.');
      alert('Gagal mencetak QR: Library qrcode belum dimuat.');
      return;
    }

    const checkboxes = Array.from(document.querySelectorAll('.row-checkbox:checked'));
    if (checkboxes.length === 0) {
      alert('Pilih minimal satu inventaris untuk mencetak QR.');
      return;
    }

    const selectedIds = checkboxes.map(cb => {
      const raw = cb.getAttribute('data-id');
      const id = Number(raw);
      return Number.isInteger(id) && id > 0 ? id : null;
    }).filter(Boolean);

    if (selectedIds.length === 0) {
      alert('Pilih minimal satu inventaris untuk mencetak QR.');
      return;
    }

    const itemsToPrint = [];
    selectedIds.forEach(id => {
      const record = InventoryStore.getById(id);
      if (record && record.kode) {
        itemsToPrint.push(record);
      }
    });

    if (itemsToPrint.length === 0) {
      alert('Data inventaris terpilih tidak valid atau tidak ditemukan di penyimpanan.');
      return;
    }

    // Generate HTML card untuk setiap record di parent page
    let labelsHtml = '';
    itemsToPrint.forEach(item => {
      let qrSvg = '';
      try {
        const qr = qrcode(0, 'M');
        qr.addData(item.kode);
        qr.make();
        // Buat SVG tag dengan cell size 3, margin 4
        qrSvg = qr.createSvgTag(3, 4);
      } catch (e) {
        qrSvg = '<p>Gagal QR</p>';
      }

      labelsHtml += `
        <div class="qr-label">
          <div class="qr-box">${qrSvg}</div>
          <div class="code">${sanitize(item.kode)}</div>
          <div class="name">${sanitize(item.nama)}</div>
          <div class="brand">SIMSARPRAS UNPAM</div>
        </div>
      `;
    });

    // Buka popup dan tulis konten yang sudah siap render
    const printWindow = window.open('', '_blank', 'width=800,height=600');
    if (!printWindow) {
      alert('Popup diblokir oleh peramban. Izinkan popup untuk mencetak label QR.');
      return;
    }

    printWindow.document.write(`
      <!DOCTYPE html>
      <html lang="id">
      <head>
        <meta charset="UTF-8">
        <title>Cetak Label QR Inventaris</title>
        <style>
          body { font-family: sans-serif; margin: 0; padding: 20px; background: #fff; color: #000; }
          .label-container { display: flex; flex-wrap: wrap; gap: 16px; justify-content: center; }
          .qr-label { border: 2px dashed #999; border-radius: 8px; padding: 16px; width: 220px; text-align: center; background: #fff; page-break-inside: avoid; break-inside: avoid; box-sizing: border-box; }
          .qr-box { margin: 0 auto 12px auto; display: flex; justify-content: center; background: #fff; }
          .qr-box svg { display: block; background: #fff; }
          .code { font-family: monospace; font-weight: bold; font-size: 14px; margin-bottom: 4px; word-break: break-all; }
          .name { font-size: 12px; margin-bottom: 8px; display: -webkit-box; -webkit-line-clamp: 2; -webkit-box-orient: vertical; overflow: hidden; height: 32px; }
          .brand { font-size: 10px; font-weight: bold; text-transform: uppercase; color: #555; border-top: 1px solid #ddd; margin-top: 4px; padding-top: 4px; }
          .no-print { margin-bottom: 20px; text-align: center; }
          .btn { padding: 10px 20px; background: #2563eb; color: #fff; border: none; border-radius: 6px; font-weight: bold; cursor: pointer; margin-right: 10px; }
          .btn-close { background: #6b7280; }
          @media print {
            .no-print { display: none; }
            body { padding: 0; }
            .qr-label { border: 1px solid #000; }
          }
        </style>
      </head>
      <body>
        <div class="no-print">
          <button class="btn" onclick="window.print()">Cetak Label</button>
          <button class="btn btn-close" onclick="window.close()">Tutup</button>
        </div>
        <div class="label-container">
          ${labelsHtml}
        </div>
        <script>
          window.addEventListener('load', () => {
            setTimeout(() => {
              window.print();
            }, 300);
          });
        <\/script>
      </body>
      </html>
    `);
    printWindow.document.close();
  }

  function initPrintQR() {
    const btn = document.getElementById('btn-print-qr');
    if (!btn) return;

    btn.removeAttribute('disabled');
    btn.title = 'Cetak label QR untuk item terpilih';
    btn.addEventListener('click', handlePrintQR);
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initPrintQR);
  } else {
    initPrintQR();
  }
})();
