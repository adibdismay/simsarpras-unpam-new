/**
 * SIMSARPRAS EDU - Perpustakaan Management Module
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

  const tableBody = document.getElementById('perpustakaan-table-body');
  const btnTambah = document.getElementById('btn-tambah');
  const modalBackdrop = document.getElementById('perpustakaan-modal-backdrop');
  const modalTitle = document.getElementById('perpustakaan-modal-title');
  const form = document.getElementById('perpustakaan-form');
  const formCancel = document.getElementById('perpustakaan-form-cancel');
  const formSubmit = document.getElementById('perpustakaan-form-submit');
  const kode = document.getElementById('perpustakaan-kode');
  const gedung = document.getElementById('perpustakaan-gedung');
  const nama = document.getElementById('perpustakaan-nama');
  const lokasi = document.getElementById('perpustakaan-lokasi');
  const capacity = document.getElementById('perpustakaan-capacity');
  const kodeError = document.getElementById('perpustakaan-kode-error');
  const gedungError = document.getElementById('perpustakaan-gedung-error');
  const namaError = document.getElementById('perpustakaan-nama-error');
  const lokasiError = document.getElementById('perpustakaan-lokasi-error');
  const capacityError = document.getElementById('perpustakaan-capacity-error');
  const deleteBackdrop = document.getElementById('perpustakaan-delete-backdrop');
  const deletePanel = document.getElementById('perpustakaan-delete-panel');
  const deleteCancel = document.getElementById('perpustakaan-delete-cancel');
  const deleteConfirm = document.getElementById('perpustakaan-delete-confirm');

  let deleteTargetId = null;
  let isEditing = false;
  let currentEditId = null;

  function loadGedungOptions() {
    const buildings = MasterStore.getBuildings();
    const defaultOption = gedung.querySelector('option[value=""]');
    if (defaultOption) {
      gedung.innerHTML = '<option value="">Pilih gedung</option>';
    }
    buildings.forEach(building => {
      const option = document.createElement('option');
      option.value = building.id;
      option.textContent = building.name || `Gedung ${building.id}`;
      gedung.appendChild(option);
    });
  }

  function initForm(record) {
    modalBackdrop.hidden = false;
    isEditing = !!record;
    currentEditId = record ? record.id : null;

    if (record) {
      modalTitle.textContent = 'Ubah Perpustakaan';
      kode.value = record.id || '';
      gedung.value = record.buildingId || '';
      nama.value = record.name || '';
      lokasi.value = record.lokasi || '';
      capacity.value = record.capacity || '';
      formSubmit.textContent = 'Update';
      formSubmit.classList.remove('bg-primary');
      formSubmit.classList.add('bg-primary-container');
    } else {
      modalTitle.textContent = 'Tambah Perpustakaan';
      kode.value = '';
      gedung.value = '';
      nama.value = '';
      lokasi.value = '';
      capacity.value = '';
      formSubmit.textContent = 'Simpan';
      formSubmit.classList.add('bg-primary');
      formSubmit.classList.remove('bg-primary-container');
    }

    kodeError.textContent = '';
    gedungError.textContent = '';
    namaError.textContent = '';
    lokasiError.textContent = '';
    capacityError.textContent = '';
    kode.classList.remove('field-input-error');
    nama.classList.remove('field-input-error');
    gedung.classList.remove('field-input-error');
  }

  function validateForm() {
    let valid = true;
    kodeError.textContent = '';
    gedungError.textContent = '';
    namaError.textContent = '';
    lokasiError.textContent = '';
    capacityError.textContent = '';
    kode.classList.remove('field-input-error');
    nama.classList.remove('field-input-error');
    gedung.classList.remove('field-input-error');
    lokasi.classList.remove('field-input-error');
    capacity.classList.remove('field-input-error');

    if (!kode.value.trim()) {
      kodeError.textContent = 'Kode wajib diisi';
      kode.classList.add('field-input-error');
      valid = false;
    }
    if (!gedung.value) {
      gedungError.textContent = 'Gedung wajib dipilih';
      gedung.classList.add('field-input-error');
      valid = false;
    }
    if (!nama.value.trim()) {
      namaError.textContent = 'Nama wajib diisi';
      nama.classList.add('field-input-error');
      valid = false;
    }
    if (!lokasi.value.trim()) {
      lokasiError.textContent = 'Lokasi wajib diisi';
      lokasi.classList.add('field-input-error');
      valid = false;
    }
    if (capacity.value && isNaN(parseInt(capacity.value, 10))) {
      capacityError.textContent = 'Kapasitas harus angka';
      capacity.classList.add('field-input-error');
      valid = false;
    }
    return valid;
  }

  function loadData() {
    const perpustakaans = MasterStore.getPerpustakaan();
    loadGedungOptions();
    renderRows(perpustakaans);
  }

  function renderRows(perpustakaans) {
    if (!tableBody) return;
    tableBody.innerHTML = '';

    if (!perpustakaans || perpustakaans.length === 0) {
      const tr = document.createElement('tr');
      tr.innerHTML = `
        <td colspan="7" class="py-12 text-center">
          <div class="flex flex-col items-center gap-3">
            <span class="material-symbols-outlined text-[48px] text-outline">local_library</span>
            <p class="font-label-lg text-label-lg text-on-surface-variant">Belum ada Perpustakaan</p>
            <p class="font-body-sm text-body-sm text-on-surface-variant">Tambahkan Perpustakaan pertama Anda.</p>
          </div>
        </td>
      `;
      tableBody.appendChild(tr);
      return;
    }

    perpustakaans.forEach(perpustakaan => {
      const tr = document.createElement('tr');
      tr.className = 'hover:bg-surface-container-low/60 transition-colors border-b border-surface-container-low';
      tr.dataset.id = perpustakaan.id;

      const building = MasterStore.getBuildingById(perpustakaan.buildingId);
      const buildingName = building ? building.name : '-';

      tr.innerHTML = `
        <td class="py-3 px-4 text-center"><input class="row-checkbox w-4 h-4 rounded text-primary focus:ring-0 cursor-pointer" type="checkbox"></td>
        <td class="py-3 px-3 font-code-sm text-code-sm font-semibold text-primary">${perpustakaan.id}</td>
        <td class="py-3 px-3">
          <div class="flex items-center gap-3">
            <div class="w-9 h-9 rounded-lg bg-surface-container flex items-center justify-center text-primary"><span class="material-symbols-outlined">local_library</span></div>
            <div><div class="font-label-md text-label-md font-semibold text-on-surface">${perpustakaan.name || '-'}</div></div>
          </div>
        </td>
        <td class="py-3 px-3 text-on-surface-variant font-body-sm text-body-sm">${buildingName}</td>
        <td class="py-3 px-3">
          <span class="badge bg-surface-container text-primary">
            <span class="w-1.5 h-1.5 rounded-full bg-primary" aria-hidden="true"></span>
            Perpustakaan
          </span>
        </td>
        <td class="py-3 px-3 text-on-surface-variant font-body-sm text-body-sm">${perpustakaan.capacity || '-'}</td>
        <td class="py-3 px-4 text-center">
          <div class="flex items-center justify-center gap-1">
            <button class="p-1.5 rounded hover:bg-surface-container text-on-surface-variant hover:text-primary transition-colors" type="button" aria-label="Detail" onclick="perpustakaan.viewDetail('${perpustakaan.id}')">
              <span class="material-symbols-outlined">visibility</span>
            </button>
            <button class="p-1.5 rounded hover:bg-surface-container text-primary hover:text-primary-container transition-colors" type="button" aria-label="Edit" onclick="perpustakaan.edit('${perpustakaan.id}')">
              <span class="material-symbols-outlined">edit</span>
            </button>
            <button class="p-1.5 rounded hover:bg-surface-container text-error hover:text-error-container transition-colors" type="button" aria-label="Hapus" onclick="perpustakaan.confirmDelete('${perpustakaan.id}')">
              <span class="material-symbols-outlined">delete</span>
            </button>
          </div>
        </td>
      `;
      tableBody.appendChild(tr);
    });
  }

  function confirmDelete(id) {
    if (!confirm('Hapus perpustakaan ini? Data terkait akan dihapus.')) return;
    deleteTargetId = id;
    deleteBackdrop.hidden = false;
    deleteConfirm.focus();
  }

  function handleDeleteConfirm() {
    if (!deleteTargetId) return;
    deleteConfirm.disabled = true;

    if (typeof InventoryStore === 'undefined' || typeof InventoryStore.getAll !== 'function') {
      alert('Pemeriksaan referensi gagal. Harap coba lagi.');
      deleteConfirm.disabled = false;
      return;
    }

    try {
      const inventory = InventoryStore.getAll();
      if (!Array.isArray(inventory)) throw new Error('Struktur data tidak valid');
    } catch (e) {
      alert('Gagal membaca data inventaris. Penghapusan dibatalkan.');
      deleteConfirm.disabled = false;
      return;
    }

    const targetName = MasterStore.getRoomById(deleteTargetId)?.name || '';
    const targetNameLower = targetName.trim().toLowerCase();

    let inventoryReferences = inventory.filter(item => {
      if (!item.ruangan) return false;
      const itemValue = item.ruangan.toString().trim();
      return itemValue === deleteTargetId || itemValue.toLowerCase() === targetNameLower;
    });

    if (inventoryReferences.length > 0) {
      alert('Gagal menghapus perpustakaan: ada ' + inventoryReferences.length + ' data inventaris yang masih merujuk data ini.');
      deleteBackdrop.hidden = true;
      deleteTargetId = null;
      deleteConfirm.disabled = false;
      return;
    }

    const result = MasterStore.deleteRoom(deleteTargetId);

    if (result.success) {
      deleteBackdrop.hidden = true;
      deleteTargetId = null;
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
      buildingId: gedung.value,
      name: nama.value.trim(),
      type: 'library',
      lokasi: lokasi.value.trim(),
      capacity: capacity.value ? parseInt(capacity.value, 10) : null
    };

    let result;
    if (isEditing) {
      result = MasterStore.updateRoom(currentEditId, data);
    } else {
      result = MasterStore.addRoom(data);
    }

    if (result.success) {
      modalBackdrop.hidden = true;
      loadData();
    } else {
      alert('Gagal menyimpan: ' + (result.errors ? result.errors.join('. ') : 'Unknown error'));
    }
  }

  function edit(id) {
    const perpustakaan = MasterStore.getRoomById(id);
    if (perpustakaan) {
      initForm(perpustakaan);
    }
  }

  function viewDetail(id) {
    const perpustakaan = MasterStore.getRoomById(id);
    if (perpustakaan) {
      const building = MasterStore.getBuildingById(perpustakaan.buildingId);
      alert(`Perpustakaan: ${perpustakaan.name}\nKode: ${perpustakaan.id}\nGedung: ${building ? building.name : '-'}\nLokasi: ${perpustakaan.lokasi || '-'}\nKapasitas: ${perpustakaan.capacity || '-'}`);
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
      console.log('Perpustakaan management module ready');
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
    global.perpustakaan = { loadData, confirmDelete, handleDeleteConfirm };
  }
})(typeof globalThis !== 'undefined' ? globalThis : this);
