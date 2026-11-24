/**
 * SIMSARPRAS EDU - Kondisi Inventaris Management Module
 * Milestone 5 - Fasilitas Akademik
 */

(function(global) {
  'use strict';

  // RBAC Check: only admin can manage data
  function canPerformAction() {
    return Auth && Auth.canManageData() === true;
  }

  // Guard function to block mahasiswa access
  function requireAdmin() {
    if (!canPerformAction()) {
      alert('Akses ditolak: Anda tidak memiliki wewenang untuk melakukan tindakan ini.');
      return false;
    }
    return true;
  }

  const tableBody = document.getElementById('kondisi-inventaris-table-body');
  const btnTambah = document.getElementById('btn-tambah');
  const modalBackdrop = document.getElementById('kondisi-inventaris-modal-backdrop');
  const modalTitle = document.getElementById('kondisi-inventaris-modal-title');
  const form = document.getElementById('kondisi-inventaris-form');
  const formCancel = document.getElementById('kondisi-inventaris-form-cancel');
  const formSubmit = document.getElementById('kondisi-inventaris-form-submit');
  const kode = document.getElementById('kondisi-inventaris-kode');
  const inventaris = document.getElementById('kondisi-inventaris-inventaris');
  const kondisi = document.getElementById('kondisi-inventaris-kondisi');
  const deskripsi = document.getElementById('kondisi-inventaris-deskripsi');
  const action = document.getElementById('kondisi-inventaris-action');
  const inventorySelect = document.getElementById('kondisi-inventaris-inventaris');
  const kodeError = document.getElementById('kondisi-inventaris-kode-error');
  const inventarisError = document.getElementById('kondisi-inventaris-inventaris-error');
  const kondisiError = document.getElementById('kondisi-inventaris-kondisi-error');
  const deskripsiError = document.getElementById('kondisi-inventaris-deskripsi-error');
  const actionError = document.getElementById('kondisi-inventaris-action-error');
  const deleteBackdrop = document.getElementById('kondisi-inventaris-delete-backdrop');
  const deleteCancel = document.getElementById('kondisi-inventaris-delete-cancel');
  const deleteConfirm = document.getElementById('kondisi-inventaris-delete-confirm');

  let deleteTargetId = null;
  let isEditing = false;
  let currentEditId = null;

  function initForm(record) {
    modalBackdrop.hidden = false;
    isEditing = !!record;
    currentEditId = record ? record.id : null;

    if (record) {
      modalTitle.textContent = 'Ubah Kondisi Inventaris';
      formSubmit.textContent = 'Update';
      formSubmit.classList.remove('bg-primary');
      formSubmit.classList.add('bg-primary-container');
      kode.value = record.id || '';
      inventaris.value = record.inventarisId || '';
      kondisi.value = record.kondisi || 'baik';
      deskripsi.value = record.deskripsi || '';
      action.value = record.action || '';
    } else {
      modalTitle.textContent = 'Tambah Kondisi Inventaris';
      formSubmit.textContent = 'Simpan';
      formSubmit.classList.add('bg-primary');
      formSubmit.classList.remove('bg-primary-container');
      kode.value = '';
      inventaris.value = '';
      kondisi.value = 'baik';
      deskripsi.value = '';
      action.value = '';
    }

    kodeError.textContent = '';
    inventarisError.textContent = '';
    kondisiError.textContent = '';
    deskripsiError.textContent = '';
    actionError.textContent = '';
    inventaris.classList.remove('field-input-error');
    kondisi.classList.remove('field-input-error');
    deskripsi.classList.remove('field-input-error');
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
    kondisiError.textContent = '';
    deskripsiError.textContent = '';
    actionError.textContent = '';
    kode.classList.remove('field-input-error');
    inventaris.classList.remove('field-input-error');
    kondisi.classList.remove('field-input-error');
    deskripsi.classList.remove('field-input-error');

    if (!kode.value.trim()) {
      kodeError.textContent = 'Kode wajib diisi';
      kode.classList.add('field-input-error');
      valid = false;
    }
    if (!inventaris.value) {
      inventarisError.textContent = 'Inventaris wajib dipilih';
      inventaris.classList.add('field-input-error');
      valid = false;
    }
    if (!kondisi.value) {
      kondisiError.textContent = 'Kondisi wajib dipilih';
      kondisi.classList.add('field-input-error');
      valid = false;
    }
    if (!deskripsi.value.trim()) {
      deskripsiError.textContent = 'Deskripsi wajib diisi';
      deskripsi.classList.add('field-input-error');
      valid = false;
    }
    return valid;
  }

  function loadData() {
    const kondisiInventaris = MasterStore.getKondisiInventaris();
    loadInventarisOptions();
    renderRows(kondisiInventaris);
  }

  function renderRows(kondisiInventaris) {
    if (!tableBody) return;
    tableBody.innerHTML = '';

    if (!kondisiInventaris || kondisiInventaris.length === 0) {
      const tr = document.createElement('tr');
      tr.innerHTML = `
        <td colspan="6" class="py-12 text-center">
          <div class="flex flex-col items-center gap-3">
            <span class="material-symbols-outlined text-[48px] text-outline">fact_check</span>
            <p class="font-label-lg text-label-lg text-on-surface-variant">Belum ada Kondisi Inventaris</p>
            <p class="font-body-sm text-body-sm text-on-surface-variant">Tambahkan kondisi inventaris pertama Anda.</p>
          </div>
        </td>
      `;
      tableBody.appendChild(tr);
      return;
    }

    kondisiInventaris.forEach(kondisi => {
      const tr = document.createElement('tr');
      tr.className = 'hover:bg-surface-container-low/60 transition-colors border-b border-surface-container-low';
      tr.dataset.id = kondisi.id;

      const inventarisName = MasterStore.getInventoryItemById(kondisi.inventarisId)?.nama || '-';
      const kondisiLabel = kondisi.kondisi === 'buruk' ? 'Buruk' : kondisi.kondisi === 'rusak' ? 'Rusak' : 'Baik';

      tr.innerHTML = `
        <td class="py-3 px-4 text-center"><input class="row-checkbox w-4 h-4 rounded text-primary focus:ring-0 cursor-pointer" type="checkbox"></td>
        <td class="py-3 px-3 font-code-sm text-code-sm font-semibold text-primary">${kondisi.id || '-'}</td>
        <td class="py-3 px-3">
          <div class="flex items-center gap-3">
            <div class="w-9 h-9 rounded-lg bg-surface-container flex items-center justify-center text-primary"><span class="material-symbols-outlined">fact_check</span></div>
            <div><div class="font-label-md text-label-md font-semibold text-on-surface">${kondisi.deskripsi || '-'}</div></div>
          </div>
        </td>
        <td class="py-3 px-3 text-on-surface-variant font-body-sm text-body-sm">${inventarisName}</td>
        <td class="py-3 px-3">
          <span class="badge">${kondisiLabel}</span>
        </td>
        <td class="py-3 px-3 text-on-surface-variant font-body-sm text-body-sm">${kondisi.action || '-'}</td>
        <td class="py-3 px-4 text-center">
          <div class="flex items-center justify-center gap-1">
            <button class="p-1.5 rounded hover:bg-surface-container text-on-surface-variant hover:text-primary transition-colors" type="button" aria-label="Detail" onclick="kondisiInventaris.viewDetail('${kondisi.id}')">
              <span class="material-symbols-outlined">visibility</span>
            </button>
            <button class="p-1.5 rounded hover:bg-surface-container text-primary hover:text-primary-container transition-colors" type="button" aria-label="Edit" onclick="kondisiInventaris.edit('${kondisi.id}')">
              <span class="material-symbols-outlined">edit</span>
            </button>
            <button class="p-1.5 rounded hover:bg-surface-container text-error hover:text-error-container transition-colors" type="button" aria-label="Hapus" onclick="kondisiInventaris.confirmDelete('${kondisi.id}')">
              <span class="material-symbols-outlined">delete</span>
            </button>
          </div>
        </td>
      `;
      tableBody.appendChild(tr);
    });
  }

  function confirmDelete(id) {
    if (!confirm('Hapus catatan kondisi inventaris ini?')) return;
    deleteTargetId = id;
    deleteBackdrop.hidden = false;
    deleteConfirm.focus();
  }

  function handleDeleteConfirm() {
    if (!deleteTargetId) return;
    deleteConfirm.disabled = true;

    const result = MasterStore.deleteKondisiInventaris(deleteTargetId);

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
      id: kode.value.trim(),
      inventarisId: inventaris.value,
      kondisi: kondisi.value,
      deskripsi: deskripsi.value.trim(),
      action: action.value.trim() || null
    };

    if (isEditing && currentEditId) {
      data.id = currentEditId;
      const result = MasterStore.updateKondisiInventaris(currentEditId, data);
      if (result.success) {
        modalBackdrop.hidden = true;
        loadData();
      } else {
        alert('Gagal menyimpan: ' + (result.errors ? result.errors.join('. ') : 'Unknown error'));
      }
    } else {
      const result = MasterStore.addKondisiInventaris(data);
      if (result.success) {
        modalBackdrop.hidden = true;
        loadData();
      } else {
        alert('Gagal menyimpan: ' + (result.errors ? result.errors.join('. ') : 'Unknown error'));
      }
    }
  }

  function edit(id) {
    const kondisi = MasterStore.getKondisiInventarisById(id);
    if (kondisi) {
      initForm(kondisi);
    }
  }

  function viewDetail(id) {
    const kondisi = MasterStore.getKondisiInventarisById(id);
    if (kondisi) {
      const inventarisName = MasterStore.getInventoryItemById(kondisi.inventarisId)?.nama || '-';
      alert(`Kondisi Inventaris: ${kondisi.deskripsi}\nInventaris: ${inventarisName}\nKondisi: ${kondisi.kondisi}\nAksi: ${kondisi.action || '-'}`);
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
      console.log('Kondisi Inventaris module ready');
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
    global.kondisiInventaris = { loadData, confirmDelete, handleDeleteConfirm };
  }
})(typeof globalThis !== 'undefined' ? globalThis : this);
