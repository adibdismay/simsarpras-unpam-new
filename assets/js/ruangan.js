/**
 * SIMSARPRAS EDU - Ruangan Management Module
 * Milestone 3 - Master Data
 * 
 * Handles CRUD operations for rooms (Ruangan)
 * Uses MasterStore (storage.js) for data persistence
 * Associates each room with a building from Gedung data
 */

(function(global) {
  'use strict';

  // DOM Elements
  const ruanganTableBody = document.getElementById('ruangan-table-body');
  const btnTambah = document.getElementById('btn-tambah');
  const ruanganModalBackdrop = document.getElementById('ruangan-modal-backdrop');
  const ruanganModalTitle = document.getElementById('ruangan-modal-title');
  const ruanganForm = document.getElementById('ruangan-form');
  const ruanganFormCancel = document.getElementById('ruangan-form-cancel');
  const ruanganFormSubmit = document.getElementById('ruangan-form-submit');
  const ruanganKode = document.getElementById('ruangan-kode');
  const ruanganGedung = document.getElementById('ruangan-gedung');
  const ruanganNama = document.getElementById('ruangan-nama');
  const ruanganJenis = document.getElementById('ruangan-jenis');
  const ruanganCapacity = document.getElementById('ruangan-capacity');
  const ruanganKodeError = document.getElementById('ruangan-kode-error');
  const ruanganGedungError = document.getElementById('ruangan-gedung-error');
  const ruanganNamaError = document.getElementById('ruangan-nama-error');
  const ruanganDeleteBackdrop = document.getElementById('ruangan-delete-backdrop');
  const ruanganDeletePanel = document.getElementById('ruangan-delete-panel');
  const ruanganDeleteCancel = document.getElementById('ruangan-delete-cancel');
  const ruanganDeleteConfirm = document.getElementById('ruangan-delete-confirm');

  // State
  let deleteTargetId = null;
  let isEditing = false;
  let currentEditId = null;

  // Load buildings into the gedung dropdown
  function loadGedungOptions() {
    const buildings = MasterStore.getBuildings();
    const select = ruanganGedung;

    // Clear existing options (keep "Pilih gedung")
    const defaultOption = select.querySelector('option[value=""]');
    if (defaultOption) {
      select.innerHTML = '<option value="">Pilih gedung</option>';
    }

    buildings.forEach(building => {
      const option = document.createElement('option');
      option.value = building.id;
      const display = building.name || `Gedung ${building.id}`;
      option.textContent = display;
      select.appendChild(option);
    });
  }

  // Initialize Ruangan form
  function initRuanganForm(record) {
    ruanganModalBackdrop.hidden = false;
    isEditing = !!record;
    currentEditId = record ? record.id : null;

    if (record) {
      ruanganModalTitle.textContent = 'Ubah Ruangan';
      ruanganKode.value = record.id || '';
      ruanganGedung.value = record.buildingId || '';
      ruanganNama.value = record.name || '';
      ruanganJenis.value = record.type || 'kelas';
      ruanganCapacity.value = record.capacity || '';

      // Load buildings if not done

      ruanganFormSubmit.textContent = 'Update';
      ruanganFormSubmit.classList.remove('bg-primary');
      ruanganFormSubmit.classList.add('bg-primary-container');
    } else {
      ruanganModalTitle.textContent = 'Tambah Ruangan';
      ruanganKode.value = '';
      ruanganGedung.value = '';
      ruanganNama.value = '';
      ruanganJenis.value = 'kelas';
      ruanganCapacity.value = '';
      ruanganFormSubmit.textContent = 'Simpan';
      ruanganFormSubmit.classList.add('bg-primary');
      ruanganFormSubmit.classList.remove('bg-primary-container');
    }

    // Clear errors
    ruanganKodeError.textContent = '';
    ruanganGedungError.textContent = '';
    ruanganNamaError.textContent = '';
    ruanganKode.classList.remove('field-input-error');
    ruanganNama.classList.remove('field-input-error');
  }

  // Validate Ruangan form
  function validateRuanganForm() {
    let valid = true;

    // Reset errors
    ruanganKodeError.textContent = '';
    ruanganGedungError.textContent = '';
    ruanganNamaError.textContent = '';
    ruanganKode.classList.remove('field-input-error');
    ruanganNama.classList.remove('field-input-error');
    ruanganGedung.classList.remove('field-input-error');

    // Validate Kode
    const kode = ruanganKode.value.trim();
    if (!kode) {
      ruanganKodeError.textContent = 'Kode ruangan wajib diisi';
      ruanganKode.classList.add('field-input-error');
      valid = false;
    }

    // Validate Gedung
    const gedung = ruanganGedung.value;
    if (!gedung) {
      ruanganGedungError.textContent = 'Gedung wajib dipilih';
      ruanganGedung.classList.add('field-input-error');
      valid = false;
    }

    // Validate Nama
    const nama = ruanganNama.value.trim();
    if (!nama) {
      ruanganNamaError.textContent = 'Nama ruangan wajib diisi';
      ruanganNama.classList.add('field-input-error');
      valid = false;
    }

    return valid;
  }

  // Render Ruangan rows
  function renderRuanganRows(ruangans) {
    if (!ruanganTableBody) return;

    ruanganTableBody.innerHTML = '';

    if (!ruangans || ruangans.length === 0) {
      const tr = document.createElement('tr');
      tr.innerHTML = `
        <td colspan="7" class="py-12 text-center">
          <div class="flex flex-col items-center gap-3">
            <span class="material-symbols-outlined text-[48px] text-outline">meeting_room</span>
            <p class="font-label-lg text-label-lg text-on-surface-variant">Belum ada ruangan</p>
            <p class="font-body-sm text-body-sm text-on-surface-variant">Tambahkan ruangan pertama Anda.</p>
          </div>
        </td>
      `;
      ruanganTableBody.appendChild(tr);
      return;
    }

    ruangans.forEach(ruangan => {
      const tr = document.createElement('tr');
      tr.className = 'hover:bg-surface-container-low/60 transition-colors border-b border-surface-container-low';
      tr.dataset.id = ruangan.id;

      const building = MasterStore.getBuildingById(ruangan.buildingId);
      const buildingName = building ? building.name : '—';
      const jenisLabel = ruangan.type === 'lab' ? 'Lab' : ruangan.type === 'library' ? 'Perpustakaan' : 'Kelas';

      tr.innerHTML = `
        <td class="py-3 px-4 text-center">
          <input class="row-checkbox w-4 h-4 rounded text-primary focus:ring-0 cursor-pointer" type="checkbox">
        </td>
        <td class="py-3 px-3 font-code-sm text-code-sm font-semibold text-primary">${ruangan.id}</td>
        <td class="py-3 px-3">
          <div class="flex items-center gap-3">
            <div class="w-9 h-9 rounded-lg bg-surface-container flex items-center justify-center text-primary">
              <span class="material-symbols-outlined">meeting_room</span>
            </div>
            <div>
              <div class="font-label-md text-label-md font-semibold text-on-surface">${ruangan.name || '-'}</div>
            </div>
          </div>
        </td>
        <td class="py-3 px-3 text-on-surface-variant font-body-sm text-body-sm">${buildingName}</td>
        <td class="py-3 px-3">
          <span class="badge bg-surface-container text-primary">
            <span class="w-1.5 h-1.5 rounded-full bg-primary" aria-hidden="true"></span>
            ${jenisLabel}
          </span>
        </td>
        <td class="py-3 px-3 text-on-surface-variant font-body-sm text-body-sm">${ruangan.capacity || '-'}</td>
        <td class="py-3 px-4 text-center">
          <div class="flex items-center justify-center gap-1">
            <button class="p-1.5 rounded hover:bg-surface-container text-on-surface-variant hover:text-primary transition-colors" type="button" aria-label="Detail ruangan" onclick="ruangan.viewDetail('${ruangan.id}')">
              <span class="material-symbols-outlined">visibility</span>
            </button>
            <button class="p-1.5 rounded hover:bg-surface-container text-primary hover:text-primary-container transition-colors" type="button" aria-label="Edit ruangan" onclick="ruangan.edit('${ruangan.id}')">
              <span class="material-symbols-outlined">edit</span>
            </button>
            <button class="p-1.5 rounded hover:bg-surface-container text-error hover:text-error-container transition-colors" type="button" aria-label="Hapus ruangan" onclick="ruangan.confirmDelete('${ruangan.id}')">
              <span class="material-symbols-outlined">delete</span>
            </button>
          </div>
        </td>
      `;
      ruanganTableBody.appendChild(tr);
    });
  }

  // Load and render all ruangans
  function loadRuangan() {
    const ruangans = MasterStore.getRooms();
    // Always reload buildings for dropdown
    loadGedungOptions();
    renderRuanganRows(ruangans);
  }

  // Delete confirmation
  function confirmDelete(id) {
    if (!confirm('Hapus ruangan ini? Data yang terkait juga akan dihapus.')) return;
    deleteTargetId = id;
    ruanganDeleteBackdrop.hidden = false;
    ruanganDeleteConfirm.focus();
  }

  // Handle delete confirm
  function handleRuanganDeleteConfirm() {
    if (!deleteTargetId) return;
    ruanganDeleteConfirm.disabled = true;

    // Cek referensi inventaris (ruangan field)
    let inventory = [];
    let inventoryValid = false;
    
    // Fail-closed: pastikan InventoryStore tersedia dan getAll adalah fungsi
    if (typeof InventoryStore === 'undefined' || typeof InventoryStore.getAll !== 'function') {
      alert('Pemeriksaan referensi gagal. Harap coba lagi atau hubungi admin.');
      ruanganDeleteConfirm.disabled = false;
      return;
    }
    
    try {
      inventory = InventoryStore.getAll();
      if (!Array.isArray(inventory)) throw new Error('Struktur data tidak valid');
      inventoryValid = true;
    } catch (e) {
      alert('Gagal membaca data inventaris. Penghapusan dibatalkan.');
      ruanganDeleteConfirm.disabled = false;
      return;
    }
    
    if (!inventoryValid) {
      alert('Data inventaris tidak valid. Penghapusan dibatalkan.');
      ruanganDeleteConfirm.disabled = false;
      return;
    }
    
    // Cek referensi inventaris
    const targetRoomName = MasterStore.getRoomById(deleteTargetId)?.name || '';
    const targetRoomNameLower = targetRoomName.trim().toLowerCase();
    
    let inventoryReferences = inventory.filter(item => {
      if (!item.ruangan) return false;
      const itemValue = item.ruangan.toString().trim();
      return itemValue === deleteTargetId || itemValue.toLowerCase() === targetRoomNameLower;
    });

    if (inventoryReferences.length > 0) {
      const message = 'Gagal menghapus ruangan: ada ' + inventoryReferences.length + ' data inventaris yang masih merujuk ruangan ini. Harap hapus atau pindahkan data inventaris terlebih dahulu.';
      alert(message);
      ruanganDeleteBackdrop.hidden = true;
      deleteTargetId = null;
      ruanganDeleteConfirm.disabled = false;
      return;
    }

    const result = MasterStore.deleteRoom(deleteTargetId);

    if (result.success) {
      ruanganDeleteBackdrop.hidden = true;
      deleteTargetId = null;
      loadRuangan();
    } else {
      ruanganDeleteBackdrop.hidden = true;
      deleteTargetId = null;
      ruanganDeleteConfirm.disabled = false;
      alert('Gagal menghapus: ' + (result.errors ? result.errors.join('. ') : 'Unknown error'));
    }
  }

  // Save ruangan
  function saveRuangan() {
    if (!validateRuanganForm()) return;

    const kode = ruanganKode.value.trim();
    const gedung = ruanganGedung.value;
    const nama = ruanganNama.value.trim();
    const jenis = ruanganJenis.value;
    const capacity = ruanganCapacity.value ? parseInt(ruanganCapacity.value, 10) : null;

    const data = {
      id: kode,
      buildingId: gedung,
      name: nama,
      type: jenis,
      capacity: capacity
    };

    let result;
    if (isEditing) {
      result = MasterStore.updateRoom(currentEditId, data);
    } else {
      result = MasterStore.addRoom(data);
    }

    if (result.success) {
      ruanganModalBackdrop.hidden = true;
      loadRuangan();
    } else {
      alert('Gagal menyimpan: ' + (result.errors ? result.errors.join('. ') : 'Unknown error'));
    }
  }

  // Edit ruangan
  function edit(id) {
    const ruangan = MasterStore.getRoomById(id);
    if (ruangan) {
      initRuanganForm(ruangan);
    }
  }

  // View detail
  function viewDetail(id) {
    const ruangan = MasterStore.getRoomById(id);
    if (ruangan) {
      const building = MasterStore.getBuildingById(ruangan.buildingId);
      const buildingName = building ? building.name : '—';
      alert(`Ruangan: ${ruangan.name}

Kode: ${ruangan.id}
Gedung: ${buildingName}
Tipe: ${ruangan.type || '-'}
Kapasitas: ${ruangan.capacity || '-'}`);
    }
  }

  // Event Listeners
  function initRuanganEvents() {
    btnTambah.addEventListener('click', () => initRuanganForm(null));

    ruanganFormSubmit.addEventListener('click', (e) => {
      // Let enter key submit naturally
    });
    ruanganForm.addEventListener('submit', (e) => {
      e.preventDefault();
      saveRuangan();
    });

    ruanganFormCancel.addEventListener('click', () => {
      ruanganModalBackdrop.hidden = true;
      ruanganForm.reset();
      isEditing = false;
      currentEditId = null;
    });

    ruanganDeleteCancel.addEventListener('click', () => {
      ruanganDeleteBackdrop.hidden = true;
      deleteTargetId = null;
    });

    ruanganDeleteConfirm.addEventListener('click', handleRuanganDeleteConfirm);
  }

  // Initialize
  function initialize() {
    try {
      if (typeof MasterStore === 'undefined') {
        console.error('MasterStore tidak ditemukan. Pastikan storage.js dimuat terlebih dahulu.');
        return;
      }

      loadRuangan();
      initRuanganEvents();

      console.log('Ruangan management module ready');
    } catch (error) {
      console.error('Error saat inisialisasi ruangan:', error);
    }
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initialize);
  } else {
    initialize();
  }

  // Export
  if (typeof global !== 'undefined') {
    global.ruangan = { loadRuangan, confirmDelete, handleRuanganDeleteConfirm };
  }
})(typeof globalThis !== 'undefined' ? globalThis : this);
