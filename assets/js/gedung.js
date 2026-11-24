/**
 * SIMSARPRAS EDU - Gedung Management Module
 * Milestone 3 - Master Data
 * 
 * Handles CRUD operations for buildings (Gedung)
 * Uses MasterStore (storage.js) for data persistence
 */

(function(global) {
  'use strict';

  // DOM Elements
  const gedungTableBody = document.getElementById('gedung-table-body');
  const btnTambah = document.getElementById('btn-tambah');
  const gedungModalBackdrop = document.getElementById('gedung-modal-backdrop');
  const gedungModalTitle = document.getElementById('gedung-modal-title');
  const gedungForm = document.getElementById('gedung-form');
  const gedungFormCancel = document.getElementById('gedung-form-cancel');
  const gedungFormSubmit = document.getElementById('gedung-form-submit');
  const gedungKode = document.getElementById('gedung-kode');
  const gedungNama = document.getElementById('gedung-nama');
  const gedungAlamat = document.getElementById('gedung-alamat');
  const gedungFasilitas = document.getElementById('gedung-fasilitas');
  const gedungKodeError = document.getElementById('gedung-kode-error');
  const gedungNamaError = document.getElementById('gedung-nama-error');
  const gedungDeleteBackdrop = document.getElementById('gedung-delete-backdrop');
  const gedungDeletePanel = document.getElementById('gedung-delete-panel');
  const gedungDeleteCancel = document.getElementById('gedung-delete-cancel');
  const gedungDeleteConfirm = document.getElementById('gedung-delete-confirm');

  // State
  let deleteTargetId = null;
  let isEditing = false;
  let currentEditId = null;

  // Initialize Gedung form
  function initGedungForm(record) {
    gedungModalBackdrop.hidden = false;
    isEditing = !!record;
    currentEditId = record ? record.id : null;

    if (record) {
      gedungModalTitle.textContent = 'Ubah Gedung';
      gedungKode.value = record.id || '';
      gedungNama.value = record.name || '';
      gedungAlamat.value = record.address || '';
      gedungFasilitas.value = record.facilities ? record.facilities.join(', ') : '';
      gedungFormSubmit.textContent = 'Update';
      gedungFormSubmit.classList.remove('bg-primary');
      gedungFormSubmit.classList.add('bg-primary-container');
    } else {
      gedungModalTitle.textContent = 'Tambah Gedung';
      gedungKode.value = '';
      gedungNama.value = '';
      gedungAlamat.value = '';
      gedungFasilitas.value = '';
      gedungFormSubmit.textContent = 'Simpan';
      gedungFormSubmit.classList.add('bg-primary');
      gedungFormSubmit.classList.remove('bg-primary-container');
    }

    // Clear errors
    gedungKodeError.textContent = '';
    gedungNamaError.textContent = '';
    gedungKode.classList.remove('field-input-error');
    gedungNama.classList.remove('field-input-error');
  }

  // Validate Gedung form
  function validateGedungForm() {
    let valid = true;

    // Reset errors
    gedungKodeError.textContent = '';
    gedungNamaError.textContent = '';
    gedungKode.classList.remove('field-input-error');
    gedungNama.classList.remove('field-input-error');

    // Validate Kode
    const kode = gedungKode.value.trim();
    if (!kode) {
      gedungKodeError.textContent = 'Kode gedung wajib diisi';
      gedungKode.classList.add('field-input-error');
      valid = false;
    } else if (kode.length < 2) {
      gedungKodeError.textContent = 'Kode gedung minimal 2 karakter';
      gedungKode.classList.add('field-input-error');
      valid = false;
    }

    // Validate Nama
    const nama = gedungNama.value.trim();
    if (!nama) {
      gedungNamaError.textContent = 'Nama gedung wajib diisi';
      gedungNama.classList.add('field-input-error');
      valid = false;
    }

    return valid;
  }

  // Render Gedung rows
  function renderGedungRows(gedungs) {
    if (!gedungTableBody) return;

    gedungTableBody.innerHTML = '';

    if (!gedungs || gedungs.length === 0) {
      const tr = document.createElement('tr');
      tr.innerHTML = `
        <td colspan="6" class="py-12 text-center">
          <div class="flex flex-col items-center gap-3">
            <span class="material-symbols-outlined text-[48px] text-outline">apartment</span>
            <p class="font-label-lg text-label-lg text-on-surface-variant">Belum ada gedung</p>
            <p class="font-body-sm text-body-sm text-on-surface-variant">Tambahkan gedung pertama Anda.</p>
          </div>
        </td>
      `;
      gedungTableBody.appendChild(tr);
      return;
    }

    gedungs.forEach(gedung => {
      const tr = document.createElement('tr');
      tr.className = 'hover:bg-surface-container-low/60 transition-colors border-b border-surface-container-low';
      tr.dataset.id = gedung.id;

      const facilities = gedung.facilities ? gedung.facilities.slice(0, 3).join(', ') : '—';
      const facilitiesMore = gedung.facilities && gedung.facilities.length > 3 ? ` +${gedung.facilities.length - 3}` : '';

      tr.innerHTML = `
        <td class="py-3 px-4 text-center">
          <input class="row-checkbox w-4 h-4 rounded text-primary focus:ring-0 cursor-pointer" type="checkbox">
        </td>
        <td class="py-3 px-3 font-code-sm text-code-sm font-semibold text-primary">${gedung.id}</td>
        <td class="py-3 px-3">
          <div class="flex items-center gap-3">
            <div class="w-9 h-9 rounded-lg bg-surface-container flex items-center justify-center text-primary">
              <span class="material-symbols-outlined">apartment</span>
            </div>
            <div>
              <div class="font-label-md text-label-md font-semibold text-on-surface">${gedung.name || '-'}</div>
            </div>
          </div>
        </td>
        <td class="py-3 px-3 text-on-surface-variant font-body-sm text-body-sm">${gedung.address || '-'}</td>
        <td class="py-3 px-3">
          <span class="text-body-sm text-on-surface-variant">${facilities}${facilitiesMore !== '' ? ` <span class="text-body-xs text-on-surface-variant">(+${facilitiesMore})</span>` : ''}</span>
        </td>
        <td class="py-3 px-4 text-center">
          <div class="flex items-center justify-center gap-1">
            <button class="p-1.5 rounded hover:bg-surface-container text-on-surface-variant hover:text-primary transition-colors" type="button" aria-label="Detail gedung" onclick="gedung.viewDetail('${gedung.id}')">
              <span class="material-symbols-outlined">visibility</span>
            </button>
            <button class="p-1.5 rounded hover:bg-surface-container text-primary hover:text-primary-container transition-colors" type="button" aria-label="Edit gedung" onclick="gedung.edit('${gedung.id}')">
              <span class="material-symbols-outlined">edit</span>
            </button>
            <button class="p-1.5 rounded hover:bg-surface-container text-error hover:text-error-container transition-colors" type="button" aria-label="Hapus gedung" onclick="gedung.confirmDelete('${gedung.id}')">
              <span class="material-symbols-outlined">delete</span>
            </button>
          </div>
        </td>
      `;
      gedungTableBody.appendChild(tr);
    });
  }

  // Load and render all gedungs
  function loadGedungs() {
    const gedungs = MasterStore.getBuildings();
    renderGedungRows(gedungs);
  }

  // Delete confirmation
  function confirmDelete(id) {
    if (!confirm('Hapus gedung ini? Data yang terkait juga akan dihapus.')) return;
    deleteTargetId = id;
    gedungDeleteBackdrop.hidden = false;
    gedungDeleteConfirm.focus();
  }

  // Handle delete confirm
  function handleGedungDeleteConfirm() {
    if (!deleteTargetId) return;
    gedungDeleteConfirm.disabled = true;

    // Cek referensi ruangan
    let roomReferences = [];
    if (MasterStore && MasterStore.getRooms) {
      const rooms = MasterStore.getRooms();
      if (rooms) {
        roomReferences = rooms.filter(room => room.buildingId === deleteTargetId);
      }
    }

// Cek referensi inventaris (gedung field)
    let inventory = [];
    let inventoryValid = false;
    
    // Fail-closed: pastikan InventoryStore tersedia dan getAll adalah fungsi
    if (typeof InventoryStore === 'undefined' || typeof InventoryStore.getAll !== 'function') {
      alert('Pemeriksaan referensi gagal. Harap coba lagi atau hubungi admin.');
      gedungDeleteConfirm.disabled = false;
      return;
    }
    
    try {
      inventory = InventoryStore.getAll();
      if (!Array.isArray(inventory)) throw new Error('Struktur data tidak valid');
      inventoryValid = true;
    } catch (e) {
      alert('Gagal membaca data inventaris. Penghapusan dibatalkan.');
      gedungDeleteConfirm.disabled = false;
      return;
    }
    
    if (!inventoryValid) {
      alert('Data inventaris tidak valid. Penghapusan dibatalkan.');
      gedungDeleteConfirm.disabled = false;
      return;
    }

    const targetBuildingName = MasterStore.getBuildingById(deleteTargetId)?.name || '';
    const targetBuildingNameLower = targetBuildingName.trim().toLowerCase();

    // Cek referensi inventaris
    let inventoryReferences = inventory.filter(item => {
      if (!item.gedung) return false;
      const itemValue = item.gedung.toString().trim();
      // True if the reference matches the building ID or the building name
      return itemValue === deleteTargetId || itemValue.toLowerCase() === targetBuildingNameLower;
    });

    if (roomReferences.length > 0 || inventoryReferences.length > 0) {
      let message = 'Gagal menghapus gedung: ada data yang masih merujuk gedung ini. Mohon hapus atau pindahkan data terlebih dahulu.';
      if (roomReferences.length > 0) {
        message += '\n- ' + roomReferences.length + ' ruangan masih merujkan gedung ini.';
      }
      if (inventoryReferences.length > 0) {
        message += '\n- ' + inventoryReferences.length + ' data inventaris masih merujuk gedung ini.';
      }
      alert(message);
      gedungDeleteBackdrop.hidden = true;
      deleteTargetId = null;
      gedungDeleteConfirm.disabled = false;
      return;
    }

    const result = MasterStore.deleteBuilding(deleteTargetId);

    if (result.success) {
      gedungDeleteBackdrop.hidden = true;
      deleteTargetId = null;
      loadGedungs();
    } else {
      gedungDeleteBackdrop.hidden = true;
      deleteTargetId = null;
      gedungDeleteConfirm.disabled = false;
      alert('Gagal menghapus: ' + (result.errors ? result.errors.join('. ') : 'Unknown error'));
    }
  }

  // Save gedung
  function saveGedung() {
    if (!validateGedungForm()) return;

    const kode = gedungKode.value.trim();
    const nama = gedungNama.value.trim();
    const alamat = gedungAlamat.value.trim();
    const fasilitas = gedungFasilitas.value.split(',').map(f => f.trim()).filter(Boolean);

    const data = {
      id: kode,
      name: nama,
      address: alamat,
      facilities: fasilitas
    };

    let result;
    if (isEditing) {
      result = MasterStore.updateBuilding(currentEditId, data);
    } else {
      result = MasterStore.addBuilding(data);
    }

    if (result.success) {
      gedungModalBackdrop.hidden = true;
      loadGedungs();
    } else {
      alert('Gagal menyimpan: ' + (result.errors ? result.errors.join('. ') : 'Unknown error'));
    }
  }

  // Edit gedung
  function edit(id) {
    const gedung = MasterStore.getBuildingById(id);
    if (gedung) {
      initGedungForm(gedung);
    }
  }

  // View detail
  function viewDetail(id) {
    const gedung = MasterStore.getBuildingById(id);
    if (gedung) {
      alert(`Gedung: ${gedung.name}

Kode: ${gedung.id}
Alamat: ${gedung.address || '-'}
Fasilitas: ${gedung.facilities ? gedung.facilities.join(', ') : '-'}`);
    }
  }

  // Event Listeners
  function initGedungEvents() {
    btnTambah.addEventListener('click', () => initGedungForm(null));

    gedungFormSubmit.addEventListener('click', (e) => {
      // Let enter key submit naturally
    });
    gedungForm.addEventListener('submit', (e) => {
      e.preventDefault();
      saveGedung();
    });

    gedungFormCancel.addEventListener('click', () => {
      gedungModalBackdrop.hidden = true;
      gedungForm.reset();
      isEditing = false;
      currentEditId = null;
    });

    gedungDeleteCancel.addEventListener('click', () => {
      gedungDeleteBackdrop.hidden = true;
      deleteTargetId = null;
    });

    gedungDeleteConfirm.addEventListener('click', handleGedungDeleteConfirm);

    var gedungFormReset = () => {
      gedungForm.reset();
      isEditing = false;
      currentEditId = null;
      gedungModalBackdrop.hidden = true;
    };
  }

  // Initialize
  function initialize() {
    try {
      if (typeof MasterStore === 'undefined') {
        console.error('MasterStore tidak ditemukan. Pastikan storage.js dimuat terlebih dahulu.');
        return;
      }

      loadGedungs();
      initGedungEvents();

      console.log('Gedung management module ready');
    } catch (error) {
      console.error('Error saat inisialisasi gedung:', error);
    }
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initialize);
  } else {
    initialize();
  }

  // Export
  if (typeof global !== 'undefined') {
    global.gedung = { loadGedungs, viewDetail, edit, confirmDelete, handleGedungDeleteConfirm };
  }
})(typeof globalThis !== 'undefined' ? globalThis : this);
