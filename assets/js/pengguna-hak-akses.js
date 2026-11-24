/**
 * SIMSARPRAS EDU - Pengguna & Hak Akses Module
 * Milestone 5 - Admin & Configuration
 */

(function(global) {
  'use strict';

  const tableBody = document.getElementById('pengguna-table-body');
  const btnTambah = document.getElementById('btn-tambah');
  const modalBackdrop = document.getElementById('pengguna-hak-akses-modal-backdrop');
  const modalTitle = document.getElementById('pengguna-hak-akses-modal-title');
  const form = document.getElementById('pengguna-hak-akses-form');
  const formCancel = document.getElementById('pengguna-hak-akses-form-cancel');
  const formSubmit = document.getElementById('pengguna-hak-akses-form-submit');
  const nama = document.getElementById('pengguna-hak-akses-nama');
  const username = document.getElementById('pengguna-hak-akses-username');
  const role = document.getElementById('pengguna-hak-akses-role');
  const kantor = document.getElementById('pengguna-hak-akses-kantor');
  const status = document.getElementById('pengguna-hak-akses-status');
  const hak = document.getElementById('pengguna-hak-akses-hak');
  const gedungSelect = document.getElementById('pengguna-hak-akses-kantor');
  const kodeError = document.getElementById('pengguna-hak-akses-kode-error');
  const namaError = document.getElementById('pengguna-hak-akses-nama-error');
  const usernameError = document.getElementById('pengguna-hak-akses-username-error');
  const roleError = document.getElementById('pengguna-hak-akses-role-error');
  const kantorError = document.getElementById('pengguna-hak-akses-kantor-error');
  const statusError = document.getElementById('pengguna-hak-akses-status-error');
  const hakError = document.getElementById('pengguna-hak-akses-hak-error');
  const deleteBackdrop = document.getElementById('pengguna-hak-akses-delete-backdrop');
  const deleteCancel = document.getElementById('pengguna-hak-akses-delete-cancel');
  const deleteConfirm = document.getElementById('pengguna-hak-akses-delete-confirm');

  let deleteTargetId = null;
  let isEditing = false;
  let currentEditId = null;

  function loadGedungOptions() {
    const buildings = MasterStore.getBuildings();
    gedungSelect.innerHTML = '<option value="">Pilih gedung</option>';
    buildings.forEach(building => {
      const opt = document.createElement('option');
      opt.value = building.id;
      opt.textContent = building.name || `Gedung ${building.id}`;
      gedungSelect.appendChild(opt);
    });
  }

  function initForm(record) {
    modalBackdrop.hidden = false;
    isEditing = !!record;
    currentEditId = record ? record.id : null;

    if (record) {
      modalTitle.textContent = 'Ubah Pengguna';
      formSubmit.textContent = 'Update';
      formSubmit.classList.remove('bg-primary');
      formSubmit.classList.add('bg-primary-container');
      nama.value = record.nama || '';
      username.value = record.username || '';
      role.value = record.role || 'pengguna';
      status.value = record.status || 'aktif';
      kantor.value = record.buildingId || '';
      hak.value = record.hakAkses || '';
    } else {
      modalTitle.textContent = 'Tambah Pengguna';
      formSubmit.textContent = 'Simpan';
      formSubmit.classList.add('bg-primary');
      formSubmit.classList.remove('bg-primary-container');
      nama.value = '';
      username.value = '';
      role.value = 'pengguna';
      status.value = 'aktif';
      kantor.value = '';
      hak.value = '';
    }

    kodeError.textContent = '';
    namaError.textContent = '';
    usernameError.textContent = '';
    roleError.textContent = '';
    kantorError.textContent = '';
    statusError.textContent = '';
    hakError.textContent = '';
    nama.classList.remove('field-input-error');
    username.classList.remove('field-input-error');
    role.classList.remove('field-input-error');
    kantor.classList.remove('field-input-error');
    status.classList.remove('field-input-error');
    hak.classList.remove('field-input-error');
  }

  function validateForm() {
    let valid = true;
    kodeError.textContent = '';
    namaError.textContent = '';
    usernameError.textContent = '';
    roleError.textContent = '';
    kantorError.textContent = '';
    statusError.textContent = '';
    hakError.textContent = '';
    nama.classList.remove('field-input-error');
    username.classList.remove('field-input-error');
    role.classList.remove('field-input-error');
    kantor.classList.remove('field-input-error');
    status.classList.remove('field-input-error');
    hak.classList.remove('field-input-error');

    if (!nama.value.trim()) {
      namaError.textContent = 'Nama lengkap wajib diisi';
      nama.classList.add('field-input-error');
      valid = false;
    }
    if (!username.value.trim()) {
      usernameError.textContent = 'Username wajib diisi';
      username.classList.add('field-input-error');
      valid = false;
    }
    if (!role.value) {
      roleError.textContent = 'Role wajib dipilih';
      role.classList.add('field-input-error');
      valid = false;
    }
    if (!kantor.value) {
      kantorError.textContent = 'Gedung wajib dipilih';
      kantor.classList.add('field-input-error');
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
    const pengguna = MasterStore.getUsers();
    loadGedungOptions();
    renderRows(pengguna);
  }

  function renderRows(pengguna) {
    if (!tableBody) return;
    tableBody.innerHTML = '';

    if (!pengguna || pengguna.length === 0) {
      const tr = document.createElement('tr');
      tr.innerHTML = `
        <td colspan="6" class="py-12 text-center">
          <div class="flex flex-col items-center gap-3">
            <span class="material-symbols-outlined text-[48px] text-outline">manage_accounts</span>
            <p class="font-label-lg text-label-lg text-on-surface-variant">Belum ada Pengguna</p>
            <p class="font-body-sm text-body-sm text-on-surface-variant">Tambahkan pengguna demo pertama Anda.</p>
          </div>
        </td>
      `;
      tableBody.appendChild(tr);
      return;
    }

    pengguna.forEach(user => {
      const tr = document.createElement('tr');
      tr.className = 'hover:bg-surface-container-low/60 transition-colors border-b border-surface-container-low';
      tr.dataset.id = user.id;

      const building = MasterStore.getBuildingById(user.buildingId);
      const buildingName = building ? building.name : '-';
      const roleLabel = user.role === 'admin' ? 'Admin' : user.role === 'staff' ? 'Staff' : 'Pengguna';
      const statusLabel = user.status === 'aktif' ? 'Aktif' : 'Non-Aktif';

      tr.innerHTML = `
        <td class="py-3 px-4 text-center"><input class="row-checkbox w-4 h-4 rounded text-primary focus:ring-0 cursor-pointer" type="checkbox"></td>
        <td class="py-3 px-3 font-code-sm text-code-sm font-semibold text-primary">${user.id || '-'}</td>
        <td class="py-3 px-3">
          <div class="flex items-center gap-3">
            <div class="w-9 h-9 rounded-lg bg-surface-container flex items-center justify-center text-primary"><span class="material-symbols-outlined">manage_accounts</span></div>
            <div><div class="font-label-md text-label-md font-semibold text-on-surface">${user.nama || '-'}</div></div>
          </div>
        </td>
        <td class="py-3 px-3 text-on-surface-variant font-body-sm text-body-sm">${user.username || '-'}</td>
        <td class="py-3 px-3">
          <span class="badge">${roleLabel}</span>
        </td>
        <td class="py-3 px-3 text-on-surface-variant font-body-sm text-body-sm">${buildingName}</td>
        <td class="py-3 px-3">
          <span class="badge">${statusLabel}</span>
        </td>
        <td class="py-3 px-4 text-center">
          <div class="flex items-center justify-center gap-1">
            <button class="p-1.5 rounded hover:bg-surface-container text-on-surface-variant hover:text-primary transition-colors" type="button" aria-label="Detail" onclick="pengguna.viewDetail('${user.id}')">
              <span class="material-symbols-outlined">visibility</span>
            </button>
            <button class="p-1.5 rounded hover:bg-surface-container text-primary hover:text-primary-container transition-colors" type="button" aria-label="Edit" onclick="pengguna.edit('${user.id}')">
              <span class="material-symbols-outlined">edit</span>
            </button>
            <button class="p-1.5 rounded hover:bg-surface-container text-error hover:text-error-container transition-colors" type="button" aria-label="Hapus" onclick="pengguna.confirmDelete('${user.id}')">
              <span class="material-symbols-outlined">delete</span>
            </button>
          </div>
        </td>
      `;
      tableBody.appendChild(tr);
    });
  }

  function confirmDelete(id) {
    if (!confirm('Hapus pengguna ini? Penghapusan tidak dapat dibatalkan.')) return;
    deleteTargetId = id;
    deleteBackdrop.hidden = false;
    deleteConfirm.focus();
  }

  function handleDeleteConfirm() {
    if (!deleteTargetId) return;
    deleteConfirm.disabled = true;

    const result = MasterStore.deleteUser(deleteTargetId);

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
      id: '',
      nama: nama.value.trim(),
      username: username.value.trim(),
      role: role.value,
      status: status.value,
      buildingId: kantor.value,
      hakAkses: hak.value.trim()
    };

    if (isEditing && currentEditId) {
      data.id = currentEditId;
      const result = MasterStore.updateUser(currentEditId, data);
      if (result.success) {
        modalBackdrop.hidden = true;
        loadData();
      } else {
        alert('Gagal menyimpan: ' + (result.errors ? result.errors.join('. ') : 'Unknown error'));
      }
    } else {
      const result = MasterStore.addUser(data);
      if (result.success) {
        modalBackdrop.hidden = true;
        loadData();
      } else {
        alert('Gagal menyimpan: ' + (result.errors ? result.errors.join('. ') : 'Unknown error'));
      }
    }
  }

  function edit(id) {
    const user = MasterStore.getUserById(id);
    if (user) {
      initForm(user);
    }
  }

  function viewDetail(id) {
    const user = MasterStore.getUserById(id);
    if (user) {
      const building = MasterStore.getBuildingById(user.buildingId);
      alert(`Pengguna: ${user.nama}\nUsername: ${user.username}\nRole: ${user.role || '-'}\nGedung: ${building ? building.name : '-'}\nStatus: ${user.status || '-'}\nHak Akses: ${user.hakAkses || '-'}`);
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
      console.log('Pengguna & Hak Akses module ready');
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
    global.pengguna = { loadData, confirmDelete, handleDeleteConfirm };
  }
})(typeof globalThis !== 'undefined' ? globalThis : this);
