/**
 * SIMSARPRAS EDU - Ruang Kelas Management Module
 * Milestone 5 - Fasilitas Akademik
 * 
 * Handles CRUD operations for ruang kelas data
 * Uses MasterStore (storage.js) for data persistence
 */

(function(global) {
  'use strict';

  // DOM Elements
  const tableBody = document.getElementById('ruang-kelas-table-body');
  const btnTambah = document.getElementById('btn-tambah');
  const modalBackdrop = document.getElementById('ruang-kelas-modal-backdrop');
  const modalTitle = document.getElementById('ruang-kelas-modal-title');
  const form = document.getElementById('ruang-kelas-form');
  const formCancel = document.getElementById('ruang-kelas-form-cancel');
  const formSubmit = document.getElementById('ruang-kelas-form-submit');
  const kode = document.getElementById('ruang-kelas-kode');
  const gedung = document.getElementById('ruang-kelas-gedung');
  const nama = document.getElementById('ruang-kelas-nama');
  const jenis = document.getElementById('ruang-kelas-jenis');
  const capacity = document.getElementById('ruang-kelas-capacity');
  const kodeError = document.getElementById('ruang-kelas-kode-error');
  const gedungError = document.getElementById('ruang-kelas-gedung-error');
  const namaError = document.getElementById('ruang-kelas-nama-error');
  const jenisError = document.getElementById('ruang-kelas-jenis-error');
  const capacityError = document.getElementById('ruang-kelas-capacity-error');
  const deleteBackdrop = document.getElementById('ruang-kelas-delete-backdrop');
  const deletePanel = document.getElementById('ruang-kelas-delete-panel');
  const deleteCancel = document.getElementById('ruang-kelas-delete-cancel');
  const deleteConfirm = document.getElementById('ruang-kelas-delete-confirm');

  // State
  let deleteTargetId = null;
  let isEditing = false;
  let currentEditId = null;

  // Load gedung options
  function loadGedungOptions() {
    const buildings = MasterStore.getBuildings();
    const defaultOption = gedung.querySelector('option[value=""]');
    if (defaultOption) {
      gedung.innerHTML = '<option value="">Pilih gedung</option>';
    }
    buildings.forEach(building => {
      const option = document.createElement('option');
      option.value = building.id;
      const display = building.name || `Gedung ${building.id}`;
      option.textContent = display;
      gedung.appendChild(option);
    });
  }

  // Initialize form
  function initForm(record) {
    modalBackdrop.hidden = false;
    isEditing = !!record;
    currentEditId = record ? record.id : null;

    if (record) {
      modalTitle.textContent = 'Ubah Ruang Kelas';
      kode.value = record.id || '';
      gedung.value = record.buildingId || '';
      nama.value = record.name || '';
      jenis.value = record.type || 'kelas';
      capacity.value = record.capacity || '';
      formSubmit.textContent = 'Update';
      formSubmit.classList.remove('bg-primary');
      formSubmit.classList.add('bg-primary-container');
    } else {
      modalTitle.textContent = 'Tambah Ruang Kelas';
      kode.value = '';
      gedung.value = '';
      nama.value = '';
      jenis.value = 'kelas';
      capacity.value = '';
      formSubmit.textContent = 'Simpan';
      formSubmit.classList.add('bg-primary');
      formSubmit.classList.remove('bg-primary-container');
    }

    // Clear errors
    kodeError.textContent = '';
    gedungError.textContent = '';
    namaError.textContent = '';
    jenisError.textContent = '';
    capacityError.textContent = '';
    kode.classList.remove('field-input-error');
    nama.classList.remove('field-input-error');
    gedung.classList.remove('field-input-error');
  }

  // Validate form
  function validateForm() {
    let valid = true;

    // Reset errors
    kodeError.textContent = '';
    gedungError.textContent = '';
    namaError.textContent = '';
    jenisError.textContent = '';
    capacityError.textContent = '';
    kode.classList.remove('field-input-error');
    nama.classList.remove('field-input-error');
    gedung.classList.remove('field-input-error');

    // Kode
    const kodeVal = kode.value.trim();
    if (!kodeVal) {
      kodeError.textContent = 'Kode wajib diisi';
      kode.classList.add('field-input-error');
      valid = false;
    }

    // Gedung
    if (!gedung.value) {
      gedungError.textContent = 'Gedung wajib dipilih';
      gedung.classList.add('field-input-error');
      valid = false;
    }

    // Nama
    const namaVal = nama.value.trim();
    if (!namaVal) {
      namaError.textContent = 'Nama wajib diisi';
      nama.classList.add('field-input-error');
      valid = false;
    }

    // Jenis
    if (!jenis.value) {
      jenisError.textContent = 'Jenis wajib dipilih';
      jenis.classList.add('field-input-error');
      valid = false;
    }

    // Capacity
    if (capacity.value && isNaN(parseInt(capacity.value, 10))) {
      capacityError.textContent = 'Kapasitas harus angka';
      capacity.classList.add('field-input-error');
      valid = false;
    }

    return valid;
  }

  // Load and render rows
  function loadData() {
    const ruangans = MasterStore.getRooms();
    loadGedungOptions();
    renderRows(ruangans);
  }

  // Render rows
  function renderRows(ruangans) {
    if (!tableBody) return;
    tableBody.innerHTML = '';

    if (!ruangans || ruangans.length === 0) {
      const tr = document.createElement('tr');
      tr.innerHTML = `
        <td colspan="7" class="py-12 text-center">
          <div class="flex flex-col items-center gap-3">
            <span class="material-symbols-outlined text-[48px] text-outline">school</span>
            <p class="font-label-lg text-label-lg text-on-surface-variant">Belum ada Ruang Kelas</p>
            <p class="font-body-sm text-body-sm text-on-surface-variant">Tambahkan Ruang Kelas pertama Anda.</p>
          </div>
        </td>
      `;
      tableBody.appendChild(tr);
      return;
    }

    ruangans.forEach(ruangan => {
      const tr = document.createElement('tr');
      tr.className = 'hover:bg-surface-container-low/60 transition-colors border-b border-surface-container-low';
      tr.dataset.id = ruangan.id;

      const building = MasterStore.getBuildingById(ruangan.buildingId);
      const buildingName = building ? building.name : '-';

      tr.innerHTML = `
        <td class="py-3 px-4 text-center"><input class="row-checkbox w-4 h-4 rounded text-primary focus:ring-0 cursor-pointer" type="checkbox"></td>
        <td class="py-3 px-3 font-code-sm text-code-sm font-semibold text-primary">${ruangan.id}</td>
        <td class="py-3 px-3">
          <div class="flex items-center gap-3">
            <div class="w-9 h-9 rounded-lg bg-surface-container flex items-center justify-center text-primary"><span class="material-symbols-outlined">school</span></div>
            <div><div class="font-label-md text-label-md font-semibold text-on-surface">${ruangan.name || '-'}</div></div>
          </div>
        </td>
        <td class="py-3 px-3 text-on-surface-variant font-body-sm text-body-sm">${buildingName}</td>
        <td class="py-3 px-3">
          <span class="badge bg-surface-container text-primary">
            <span class="w-1.5 h-1.5 rounded-full bg-primary" aria-hidden="true"></span>
            ${ruangan.type === 'kelas' ? 'Kelas' : ruangan.type === 'lab' ? 'Lab' : ruangan.type === 'library' ? 'Perpustakaan' : 'Lainnya'}
          </span>
        </td>
        <td class="py-3 px-3 text-on-surface-variant font-body-sm text-body-sm">${ruangan.capacity || '-'}</td>
        <td class="py-3 px-4 text-center">
          <div class="flex items-center justify-center gap-1">
            <button class="p-1.5 rounded hover:bg-surface-container text-on-surface-variant hover:text-primary transition-colors" type="button" aria-label="Detail" onclick="ruang_kelas.viewDetail('${ruangan.id}')">
              <span class="material-symbols-outlined">visibility</span>
            </button>
            <button class="p-1.5 rounded hover:bg-surface-container text-primary hover:text-primary-container transition-colors" type="button" aria-label="Edit" onclick="ruang_kelas.edit('${ruangan.id}')">
              <span class="material-symbols-outlined">edit</span>
            </button>
            <button class="p-1.5 rounded hover:bg-surface-container text-error hover:text-error-container transition-colors" type="button" aria-label="Hapus" onclick="ruang_kelas.confirmDelete('${ruangan.id}')">
              <span class="material-symbols-outlined">delete</span>
            </button>
          </div>
        </td>
      `;
      tableBody.appendChild(tr);
    });
  }

  // Delete confirmation
  function confirmDelete(id) {
    if (!confirm('Hapus ruang kelas ini? Data terkait akan dihapus.')) return;
    deleteTargetId = id;
    deleteBackdrop.hidden = false;
    deleteConfirm.focus();
  }

  // Handle delete confirm
  function handleDeleteConfirm() {
    if (!deleteTargetId) return;
    deleteConfirm.disabled = true;

    // Fail-closed: pastikan InventoryStore tersedia
    if (typeof InventoryStore === 'undefined' || typeof InventoryStore.getAll !== 'function') {
      alert('Pemeriksaan referensi gagal. Harap coba lagi atau hubungi admin.');
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
      alert('Gagal menghapus ruang kelas: ada ' + inventoryReferences.length + ' data inventaris yang masih merujuk data ini.');
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

  // Save ruang kelas
  function saveForm() {
    if (!validateForm()) return;

    const data = {
      id: kode.value.trim(),
      buildingId: gedung.value,
      name: nama.value.trim(),
      type: jenis.value,
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

  // Edit
  function edit(id) {
    const ruangan = MasterStore.getRoomById(id);
    if (ruangan) {
      initForm(ruangan);
    }
  }

  // View detail
  function viewDetail(id) {
    const ruangan = MasterStore.getRoomById(id);
    if (ruangan) {
      const building = MasterStore.getBuildingById(ruangan.buildingId);
      alert(`Ruang Kelas: ${ruangan.name}\nKode: ${ruangan.id}\nGedung: ${building ? building.name : '-'}\nTipe: ${ruangan.type || '-'}\nKapasitas: ${ruangan.capacity || '-'}`);
    }
  }

  // Event Listeners
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

  // Initialize
  function initialize() {
    try {
      if (typeof MasterStore === 'undefined') {
        console.error('MasterStore tidak ditemukan.');
        return;
      }
      loadData();
      initEvents();
      console.log('Ruang Kelas management module ready');
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
    global.ruang_kelas = { loadData, confirmDelete, handleDeleteConfirm };
  }
})(typeof globalThis !== 'undefined' ? globalThis : this);
