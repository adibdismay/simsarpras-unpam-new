/**
 * SIMSARPRAS EDU - Pengaturan System Module
 * Milestone 5 - Admin & Configuration
 */

(function(global) {
  'use strict';

  const modalBackdrop = document.getElementById('pengaturan-modal-backdrop');
  const modalTitle = document.getElementById('pengaturan-modal-title');
  const form = document.getElementById('pengaturan-form');
  const formCancel = document.getElementById('pengaturan-form-cancel');
  const formSubmit = document.getElementById('pengaturan-form-submit');
  const key = document.getElementById('pengaturan-key');
  const value = document.getElementById('pengaturan-value');
  const keyError = document.getElementById('pengaturan-key-error');
  const valueError = document.getElementById('pengaturan-value-error');

  let isEditing = false;
  let currentEditKey = null;

  function initForm() {
    modalBackdrop.hidden = false;
    isEditing = false;
    currentEditKey = null;
    modalTitle.textContent = 'Tambah Pengaturan';
    formSubmit.textContent = 'Simpan';
    formSubmit.classList.add('bg-primary');
    formSubmit.classList.remove('bg-primary-container');
    key.value = '';
    value.value = '';
    keyError.textContent = '';
    valueError.textContent = '';
    key.classList.remove('field-input-error');
    value.classList.remove('field-input-error');
  }

  function validateForm() {
    let valid = true;
    keyError.textContent = '';
    valueError.textContent = '';
    key.classList.remove('field-input-error');
    value.classList.remove('field-input-error');

    const keyTrim = key.value.trim();

    if (!keyTrim) {
      keyError.textContent = 'Kunci wajib diisi';
      key.classList.add('field-input-error');
      valid = false;
    } else if (/[^a-zA-Z0-9_-]/.test(keyTrim)) {
      keyError.textContent = 'Hanya huruf, angka, underscore, dan dash yang diperbolehkan';
      key.classList.add('field-input-error');
      valid = false;
    }

    if (value.value.trim() === '') {
      valueError.textContent = 'Nilai wajib diisi';
      value.classList.add('field-input-error');
      valid = false;
    }
    return valid;
  }

  function saveForm() {
    if (!validateForm()) return;

    const keyTrim = key.value.trim();
    const valueTrim = value.value.trim();

    const result = ConfigStore.setSetting(keyTrim, valueTrim);

    if (result.success) {
      modalBackdrop.hidden = true;
      form.reset();
      location.reload();
    } else {
      alert('Gagal menyimpan: ' + (result.errors ? result.errors.join('. ') : 'Unknown error'));
    }
  }

  function initEvents() {
    formSubmit.addEventListener('click', () => {});
    form.addEventListener('submit', (e) => {
      e.preventDefault();
      saveForm();
    });

    formCancel.addEventListener('click', () => {
      modalBackdrop.hidden = true;
      form.reset();
      isEditing = false;
      currentEditKey = null;
    });
  }

  function initialize() {
    try {
      if (typeof ConfigStore === 'undefined') {
        console.error('ConfigStore tidak ditemukan.');
        return;
      }
      initEvents();
      console.log('Pengaturan management module ready');
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
    global.pengaturan = { initForm, saveForm };
  }
})(typeof globalThis !== 'undefined' ? globalThis : this);
