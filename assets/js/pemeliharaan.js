/**
 * SIMSARPRAS EDU - Pemeliharaan Management Module
 * Milestone 5 - Fasilitas Akademik
 */

(function(global) {
  'use strict';

  const tableBody = document.getElementById('pemeliharaan-table-body');
  const btnTambah = document.getElementById('btn-tambah');
  const modalBackdrop = document.getElementById('pemeliharaan-modal-backdrop');
  const modalTitle = document.getElementById('pemeliharaan-modal-title');
  const form = document.getElementById('pemeliharaan-form');
  const formCancel = document.getElementById('pemeliharaan-form-cancel');
  const formSubmit = document.getElementById('pemeliharaan-form-submit');
  const inventaris = document.getElementById('pemeliharaan-inventaris');
  const tanggal = document.getElementById('pemeliharaan-tanggal');
  const jenis = document.getElementById('pemeliharaan-jenis');
  const deskripsi = document.getElementById('pemeliharaan-deskripsi');
  const biaya = document.getElementById('pemeliharaan-biaya');
  const status = document.getElementById('pemeliharaan-status');
  const inventorySelect = document.getElementById('pemeliharaan-inventaris');
  const kodeError = document.getElementById('pemeliharaan-kode-error');
  const inventarisError = document.getElementById('pemeliharaan-inventaris-error');
  const tanggalError = document.getElementById('pemeliharaan-tanggal-error');
  const jenisError = document.getElementById('pemeliharaan-jenis-error');
  const deskripsiError = document.getElementById('pemeliharaan-deskripsi-error');
  const biayaError = document.getElementById('pemeliharaan-biaya-error');
  const statusError = document.getElementById('pemeliharaan-status-error');
  const deleteBackdrop = document.getElementById('pemeliharaan-delete-backdrop');
  const deleteCancel = document.getElementById('pemeliharaan-delete-cancel');
  const deleteConfirm = document.getElementById('pemeliharaan-delete-confirm');

  let deleteTargetId = null;
  let isEditing = false;
  let currentEditId = null;

  function initForm(record) {
    modalBackdrop.hidden = false;
    isEditing = !!record;
    currentEditId = record ? record.id : null;

    if (record) {
      modalTitle.textContent = 'Ubah Pemeliharaan';
      formSubmit.textContent = 'Update';
      formSubmit.classList.remove('bg-primary');
      formSubmit.classList.add('bg-primary-container');
      inventaris.value = record.inventarisId || '';
      tanggal.value = record.tanggal || '';
      jenis.value = record.jenis || 'routine';
      deskripsi.value = record.deskripsi || '';
      biaya.value = record.biaya || '';
      status.value = record.status || 'belum';
    } else {
      modalTitle.textContent = 'Tambah Pemeliharaan';
      formSubmit.textContent = 'Simpan';
      formSubmit.classList.add('bg-primary');
      formSubmit.classList.remove('bg-primary-container');
      inventaris.value = '';
      tanggal.value = '';
      jenis.value = 'routine';
      deskripsi.value = '';
      biaya.value = '';
      status.value = 'belum';
    }

    kodeError.textContent = '';
    inventarisError.textContent = '';
    tanggalError.textContent = '';
    jenisError.textContent = '';
    deskripsiError.textContent = '';
    biayaError.textContent = '';
    statusError.textContent = '';
    inventaris.classList.remove('field-input-error');
    tanggal.classList.remove('field-input-error');
    jenis.classList.remove('field-input-error');
    deskripsi.classList.remove('field-input-error');
    status.classList.remove('field-input-error');
  }

  function loadInventarisOptions() {
    const inventory = InventoryStore.getAll();
    if (!Array.isArray(inventory) || inventory.length === 0) {
      inventorySelect.innerHTML = '<option value="">Tidak ada inventaris tersedia</option>';
      return;
    }
    inventorySelect.innerHTML = '<option value="">Pilih inventaris</option>';
    inventory.forEach(item => {
      const opt = document.createElement('option');
      opt.value = item.id;
      opt.textContent = `${item.nama || 'Inventaris'} (${item.kondisi || 'unknown'})`;
      inventorySelect.appendChild(opt);
    });
  }

  function validateForm() {
    let valid = true;
    kodeError.textContent = '';
    inventarisError.textContent = '';
    tanggalError.textContent = '';
    jenisError.textContent = '';
    deskripsiError.textContent = '';
    biayaError.textContent = '';
    statusError.textContent = '';
    inventaris.classList.remove('field-input-error');
    tanggal.classList.remove('field-input-error');
    jenis.classList.remove('field-input-error');
    deskripsi.classList.remove('field-input-error');
    status.classList.remove('field-input-error');

    if (!inventaris.value) {
      inventarisError.textContent = 'Inventaris wajib dipilih';
      inventaris.classList.add('field-input-error');
      valid = false;
    }
    if (!tanggal.value) {
      tanggalError.textContent = 'Tanggal wajib diisi';
      tanggal.classList.add('field-input-error');
      valid = false;
    }
    if (!jenis.value) {
      jenisError.textContent = 'Jenis pemeliharaan wajib dipilih';
      jenis.classList.add('field-input-error');
      valid = false;
    }
    if (!deskripsi.value.trim()) {
      deskripsiError.textContent = 'Deskripsi pekerjaan wajib diisi';
      deskripsi.classList.add('field-input-error');
      valid = false;
    }
    if (!status.value) {
      statusError.textContent = 'Status wajib dipilih';
      status.classList.add('field-input-error');
      valid = false;
    }
    return valid;
  }

  function loadData() {
    const pemeliharaans = MasterStore.getMaintenance();
    loadInventarisOptions();
    renderRows(pemeliharaans);
  }

  function renderRows(pemeliharaans) {
    if (!tableBody) return;
    tableBody.innerHTML = '';

    if (!pemeliharaans || pemeliharaans.length === 0) {
      const tr = document.createElement('tr');
      tr.innerHTML = `
        <td colspan="6" class="py-12 text-center">
          <div class="flex flex-col items-center gap-3">
            <span class="material-symbols-outlined text-[48px] text-outline">build</span>
            <p class="font-label-lg text-label-lg text-on-surface-variant">Belum ada Pemeliharaan</p>
            <p class="font-body-sm text-body-sm text-on-surface-variant">Tambahkan catatan pemeliharaan pertama Anda.</p>
          </div>
        </td>
      `;
      tableBody.appendChild(tr);
      return;
    }

    pemeliharaans.forEach(pemeliharaan => {
      const tr = document.createElement('tr');
      tr.className = 'hover:bg-surface-container-low/60 transition-colors border-b border-surface-container-low';
      tr.dataset.id = pemeliharaan.id;

      const inventarisName = MasterStore.getInventoryItemById(pemeliharaan.inventarisId)?.nama || '-';
      const tanggalFormatted = pemeliharaan.tanggal ? new Date(pemeliharaan.tanggal).toLocaleDateString('id-ID') : '-';
      const statusLabel = pemeliharaan.status === 'selesai' ? 'Selesai' : pemeliharaan.status === 'sedang' ? 'Sedang Berlangsung' : 'Belum Selesai';

      tr.innerHTML = `
        <td class="py-3 px-4 text-center"><input class="row-checkbox w-4 h-4 rounded text-primary focus:ring-0 cursor-pointer" type="checkbox"></td>
        <td class="py-3 px-3 font-code-sm text-code-sm font-semibold text-primary">${pemeliharaan.id || '-'}</td>
        <td class="py-3 px-3">
          <div class="flex items-center gap-3">
            <div class="w-9 h-9 rounded-lg bg-surface-container flex items-center justify-center text-primary"><span class="material-symbols-outlined">build</span></div>
            <div><div class="font-label-md text-label-md font-semibold text-on-surface">${pemeliharaan.deskripsi || '-'}</div></div>
          </div>
        </td>
        <td class="py-3 px-3 text-on-surface-variant font-body-sm text-body-sm">${inventarisName}</td>
        <td class="py-3 px-3 text-on-surface-variant font-body-sm text-body-sm">${tanggalFormatted}</td>
        <td class="py-3 px-3">
          <span class="badge">${statusLabel}</span>
        </td>
        <td class="py-3 px-4 text-center">
          <div class="flex items-center justify-center gap-1">
            <button class="p-1.5 rounded hover:bg-surface-container text-on-surface-variant hover:text-primary transition-colors" type="button" aria-label="Detail" onclick="pemeliharaan.viewDetail('${pemeliharaan.id}')">
              <span class="material-symbols-outlined">visibility</span>
            </button>
            <button class="p-1.5 rounded hover:bg-surface-container text-primary hover:text-primary-container transition-colors" type="button" aria-label="Edit" onclick="pemeliharaan.edit('${pemeliharaan.id}')">
              <span class="material-symbols-outlined">edit</span>
            </button>
            <button class="p-1.5 rounded hover:bg-surface-container text-error hover:text-error-container transition-colors" type="button" aria-label="Hapus" onclick="pemeliharaan.confirmDelete('${pemeliharaan.id}')">
              <span class="material-symbols-outlined">delete</span>
            </button>
          </div>
        </td>
      `;
      tableBody.appendChild(tr);
    });
  }

  function confirmDelete(id) {
    if (!confirm('Hapus catatan pemeliharaan ini?')) return;
    deleteTargetId = id;
    deleteBackdrop.hidden = false;
    deleteConfirm.focus();
  }

  function handleDeleteConfirm() {
    if (!deleteTargetId) return;
    deleteConfirm.disabled = true;

    const result = MasterStore.deleteMaintenance(deleteTargetId);

    if (result.success) {
      deleteBackdrop.hidden = true;
      deleteTargetId = null;
      deleteConfirm.disabled = false;
      loadData();
    } else {
      deleteBackdrop.hidden = true;
      deleteTargetId = null;
      deleteConfirm.disabled = false;
      alert('Gagal menghapus: ' + (result.errors ? result.errors.join('. ') : 'Unknown error'));
    }
  }

  function saveForm() {
    if (!validateForm()) return;

    const data = {
      id: ''
    };

    const pemeliharaanData = {
      inventarisId: inventaris.value,
      tanggal: tanggal.value,
      jenis: jenis.value,
      deskripsi: deskripsi.value.trim(),
      biaya: biaya.value ? parseInt(biaya.value, 10) : null,
      status: status.value
    };

    if (isEditing && currentEditId) {
      pemeliharaanData.id = currentEditId;
      const result = MasterStore.updateMaintenance(currentEditId, pemeliharaanData);
      if (result.success) {
        modalBackdrop.hidden = true;
        loadData();
      } else {
        alert('Gagal menyimpan: ' + (result.errors ? result.errors.join('. ') : 'Unknown error'));
      }
    } else {
      const result = MasterStore.addMaintenance(pemeliharaanData);
      if (result.success) {
        modalBackdrop.hidden = true;
        loadData();
      } else {
        alert('Gagal menyimpan: ' + (result.errors ? result.errors.join('. ') : 'Unknown error'));
      }
    }
  }

  function edit(id) {
    const pemeliharaan = MasterStore.getMaintenanceById(id);
    if (pemeliharaan) {
      initForm(pemeliharaan);
    }
  }

  function viewDetail(id) {
    const pemeliharaan = MasterStore.getMaintenanceById(id);
    if (pemeliharaan) {
      const inventarisName = MasterStore.getInventoryItemById(pemeliharaan.inventarisId)?.nama || '-';
      alert(`Pemeliharaan: ${pemeliharaan.deskripsi}\nInventaris: ${inventarisName}\nTanggal: ${pemeliharaan.tanggal || '-'}\nJenis: ${pemeliharaan.jenis || '-'}\nBiaya: ${pemeliharaan.biaya || '-'}\nStatus: ${pemeliharaan.status || '-'}`);
    }
  }

  function initEvents() {
    btnTambah.addEventListener('click', () => initForm(null));

    formSubmit.addEventListener('click', () => {});
    form.addEventListener('submit', (e) => {
      e.preventDefault();
      saveForm();
    });

    formCancel.addEventListener('click', () => {
      modalBackdrop.hidden = true;
      form.reset();
      isEditing = false;
      currentEditId = null;
    });

    deleteCancel.addEventListener('click', () => {
      deleteBackdrop.hidden = true;
      deleteTargetId = null;
    });

    deleteConfirm.addEventListener('click', handleDeleteConfirm);
  }

  function initialize() {
    try {
      if (typeof MasterStore === 'undefined') {
        console.error('MasterStore tidak ditemukan.');
        return;
      }
      loadData();
      initEvents();
      console.log('Pemeliharaan management module ready');
    } catch (error) {
      console.error('Error saat inisialisasi:', error);
    }
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initialize);
  } else {
    initialize();
  }

  if (typeof global !== 'undefined') {
    global.pemeliharaan = { loadData, confirmDelete, handleDeleteConfirm };
  }
})(typeof globalThis !== 'undefined' ? globalThis : this);
