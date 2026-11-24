/**
 * SIMSARPRAS EDU - Kategori Management Module
 * Milestone 3 - Master Data
 * 
 * Handles CRUD operations for categories (Kategori Inventaris)
 * Uses MasterStore (storage.js) for data persistence
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

  // DOM Elements
  const kategoriTableBody = document.getElementById('kategori-table-body');
  const btnTambah = document.getElementById('btn-tambah');
  const kategoriModalBackdrop = document.getElementById('kategori-modal-backdrop');
  const kategoriModalTitle = document.getElementById('kategori-modal-title');
  const kategoriForm = document.getElementById('kategori-form');
  const kategoriFormCancel = document.getElementById('kategori-form-cancel');
  const kategoriFormSubmit = document.getElementById('kategori-form-submit');
  const kategoriKode = document.getElementById('kategori-kode');
  const kategoriNama = document.getElementById('kategori-nama');
  const kategoriIcon = document.getElementById('kategori-icon');
  const kategoriKodeError = document.getElementById('kategori-kode-error');
  const kategoriNamaError = document.getElementById('kategori-nama-error');
  const kategoriDeleteBackdrop = document.getElementById('kategori-delete-backdrop');
  const kategoriDeletePanel = document.getElementById('kategori-delete-panel');
  const kategoriDeleteCancel = document.getElementById('kategori-delete-cancel');
  const kategoriDeleteConfirm = document.getElementById('kategori-delete-confirm');

  // State
  let deleteTargetId = null;
  let isEditing = false;
  let currentEditId = null;

  // Initialize Kategori form
  function initKategoriForm(record) {
    kategoriModalBackdrop.hidden = false;
    isEditing = !!record;
    currentEditId = record ? record.id : null;

    if (record) {
      kategoriModalTitle.textContent = 'Ubah Kategori';
      kategoriKode.value = record.id || '';
      kategoriNama.value = record.name || '';
      kategoriIcon.value = record.icon || '';
      kategoriFormSubmit.textContent = 'Update';
      kategoriFormSubmit.classList.remove('bg-primary');
      kategoriFormSubmit.classList.add('bg-primary-container');
    } else {
      kategoriModalTitle.textContent = 'Tambah Kategori';
      kategoriKode.value = '';
      kategoriNama.value = '';
      kategoriIcon.value = '';
      kategoriFormSubmit.textContent = 'Simpan';
      kategoriFormSubmit.classList.add('bg-primary');
      kategoriFormSubmit.classList.remove('bg-primary-container');
    }

    // Clear errors
    kategoriKodeError.textContent = '';
    kategoriNamaError.textContent = '';
    kategoriKode.classList.remove('field-input-error');
    kategoriNama.classList.remove('field-input-error');
  }

  // Validate Kategori form
  function validateKategoriForm() {
    let valid = true;

    kategoriKodeError.textContent = '';
    kategoriNamaError.textContent = '';
    kategoriKode.classList.remove('field-input-error');
    kategoriNama.classList.remove('field-input-error');

    const kode = kategoriKode.value.trim();
    if (!kode) {
      kategoriKodeError.textContent = 'Kode kategori wajib diisi';
      kategoriKode.classList.add('field-input-error');
      valid = false;
    }

    const nama = kategoriNama.value.trim();
    if (!nama) {
      kategoriNamaError.textContent = 'Nama kategori wajib diisi';
      kategoriNama.classList.add('field-input-error');
      valid = false;
    }

    return valid;
  }

  // Render Kategori rows
  function renderKategoriRows(kategoris) {
    if (!kategoriTableBody) return;

    kategoriTableBody.innerHTML = '';

    if (!kategoris || kategoris.length === 0) {
      const tr = document.createElement('tr');
      tr.innerHTML = `
        <td colspan="5" class="py-12 text-center">
          <div class="flex flex-col items-center gap-3">
            <span class="material-symbols-outlined text-[48px] text-outline">category</span>
            <p class="font-label-lg text-label-lg text-on-surface-variant">Belum ada kategori</p>
            <p class="font-body-sm text-body-sm text-on-surface-variant">Tambahkan kategori pertama Anda.</p>
          </div>
        </td>
      `;
      kategoriTableBody.appendChild(tr);
      return;
    }

    kategoris.forEach(kategori => {
      const tr = document.createElement('tr');
      tr.className = 'hover:bg-surface-container-low/60 transition-colors border-b border-surface-container-low';
      tr.dataset.id = kategori.id;

      tr.innerHTML = `
        <td class="py-3 px-4 text-center">
          <input class="row-checkbox w-4 h-4 rounded text-primary focus:ring-0 cursor-pointer" type="checkbox">
        </td>
        <td class="py-3 px-3 font-code-sm text-code-sm font-semibold text-primary">${kategori.id}</td>
        <td class="py-3 px-3">
          <div class="flex items-center gap-3">
            <div class="w-9 h-9 rounded-lg bg-surface-container flex items-center justify-center text-primary">
              <span class="material-symbols-outlined">${kategori.icon || 'category'}</span>
            </div>
            <div>
              <div class="font-label-md text-label-md font-semibold text-on-surface">${kategori.name || '-'}</div>
            </div>
          </div>
        </td>
        <td class="py-3 px-3">
          <span class="text-body-sm text-on-surface-variant">${kategori.icon || '-'}</span>
        </td>
        <td class="py-3 px-4 text-center">
          <div class="flex items-center justify-center gap-1">
            <button class="p-1.5 rounded hover:bg-surface-container text-on-surface-variant hover:text-primary transition-colors" type="button" aria-label="Detail kategori" onclick="kategori.viewDetail('${kategori.id}')">
              <span class="material-symbols-outlined">visibility</span>
            </button>
            <button class="p-1.5 rounded hover:bg-surface-container text-primary hover:text-primary-container transition-colors" type="button" aria-label="Edit kategori" onclick="kategori.edit('${kategori.id}')">
              <span class="material-symbols-outlined">edit</span>
            </button>
            <button class="p-1.5 rounded hover:bg-surface-container text-error hover:text-error-container transition-colors" type="button" aria-label="Hapus kategori" onclick="kategori.confirmDelete('${kategori.id}')">
              <span class="material-symbols-outlined">delete</span>
            </button>
          </div>
        </td>
      `;
      kategoriTableBody.appendChild(tr);
    });
  }

  // Load and render all kategori
  function loadKategori() {
    const kategoris = MasterStore.getCategories();
    renderKategoriRows(kategoris);
  }

  // Delete confirmation
  function confirmDelete(id) {
    if (!confirm('Hapus kategori ini? Data inventaris yang menggunakan kategori ini akan kehilangan referensi.')) return;
    deleteTargetId = id;
    kategoriDeleteBackdrop.hidden = false;
    kategoriDeleteConfirm.focus();
  }

  // Handle delete confirm
  function handleKategoriDeleteConfirm() {
    if (!deleteTargetId) return;
    kategoriDeleteConfirm.disabled = true;

    // Cek referensi inventaris (kategori field)
    let inventory = [];
    let inventoryValid = false;
    
    // Fail-closed: pastikan InventoryStore tersedia dan getAll adalah fungsi
    if (typeof InventoryStore === 'undefined' || typeof InventoryStore.getAll !== 'function') {
      alert('Pemeriksaan referensi gagal. Harap coba lagi atau hubungi admin.');
      kategoriDeleteConfirm.disabled = false;
      return;
    }
    
    try {
      inventory = InventoryStore.getAll();
      if (!Array.isArray(inventory)) throw new Error('Struktur data tidak valid');
      inventoryValid = true;
    } catch (e) {
      alert('Gagal membaca data inventaris. Penghapusan dibatalkan.');
      kategoriDeleteConfirm.disabled = false;
      return;
    }
    
    if (!inventoryValid) {
      alert('Data inventaris tidak valid. Penghapusan dibatalkan.');
      kategoriDeleteConfirm.disabled = false;
      return;
    }
    
    // Cek referensi inventaris
    const targetCategoryName = MasterStore.getCategoryById(deleteTargetId)?.name || '';
    const targetCategoryNameLower = targetCategoryName.trim().toLowerCase();
    
    let inventoryReferences = inventory.filter(item => {
      if (!item.kategori) return false;
      const itemValue = item.kategori.toString().trim();
      return itemValue === deleteTargetId || itemValue.toLowerCase() === targetCategoryNameLower;
    });

    if (inventoryReferences.length > 0) {
      const message = 'Gagal menghapus kategori: ada ' + inventoryReferences.length + ' data inventaris yang masih menggunakan kategori ini. Harap hapus atau pindahkan data inventaris terlebih dahulu.';
      alert(message);
      kategoriDeleteBackdrop.hidden = true;
      deleteTargetId = null;
      kategoriDeleteConfirm.disabled = false;
      return;
    }

    const result = MasterStore.deleteCategory(deleteTargetId);

    if (result.success) {
      kategoriDeleteBackdrop.hidden = true;
      deleteTargetId = null;
      loadKategori();
    } else {
      kategoriDeleteBackdrop.hidden = true;
      deleteTargetId = null;
      kategoriDeleteConfirm.disabled = false;
      alert('Gagal menghapus: ' + (result.errors ? result.errors.join('. ') : 'Unknown error'));
    }
  }

  // Save kategori
  function saveKategori() {
    if (!validateKategoriForm()) return;

    const kode = kategoriKode.value.trim();
    const nama = kategoriNama.value.trim();
    const icon = kategoriIcon.value.trim();

    const data = {
      id: kode,
      name: nama,
      icon: icon || 'category'
    };

    let result;
    if (isEditing) {
      result = MasterStore.updateCategory(currentEditId, data);
    } else {
      result = MasterStore.addCategory(data);
    }

    if (result.success) {
      kategoriModalBackdrop.hidden = true;
      loadKategori();
    } else {
      alert('Gagal menyimpan: ' + (result.errors ? result.errors.join('. ') : 'Unknown error'));
    }
  }

  // Edit kategori
  function edit(id) {
    const kategori = MasterStore.getCategoryById(id);
    if (kategori) {
      initKategoriForm(kategori);
    }
  }

  // View detail
  function viewDetail(id) {
    const kategori = MasterStore.getCategoryById(id);
    if (kategori) {
      alert(`Kategori: ${kategori.name}

Kode: ${kategori.id}
Icon: ${kategori.icon || '-'}`);
    }
  }

  // Event Listeners
  function initKategoriEvents() {
    btnTambah.addEventListener('click', () => initKategoriForm(null));

    kategoriFormSubmit.addEventListener('click', (e) => {
      // Let enter key submit naturally
    });
    kategoriForm.addEventListener('submit', (e) => {
      e.preventDefault();
      saveKategori();
    });

    kategoriFormCancel.addEventListener('click', () => {
      kategoriModalBackdrop.hidden = true;
      kategoriForm.reset();
      isEditing = false;
      currentEditId = null;
    });

    kategoriDeleteCancel.addEventListener('click', () => {
      kategoriDeleteBackdrop.hidden = true;
      deleteTargetId = null;
    });

    kategoriDeleteConfirm.addEventListener('click', handleKategoriDeleteConfirm);
  }

  // Initialize
  function initialize() {
    try {
      if (typeof MasterStore === 'undefined') {
        console.error('MasterStore tidak ditemukan. Pastikan storage.js dimuat terlebih dahulu.');
        return;
      }

      loadKategori();
      initKategoriEvents();

      console.log('Kategori management module ready');
    } catch (error) {
      console.error('Error saat inisialisasi kategori:', error);
    }
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initialize);
  } else {
    initialize();
  }

  // Export
  if (typeof global !== 'undefined') {
    global.kategori = { loadKategori, confirmDelete, handleKategoriDeleteConfirm };
  }
})(typeof globalThis !== 'undefined' ? globalThis : this);
