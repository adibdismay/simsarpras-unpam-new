/**
 * SIMSARPRAS UNPAM - Form Inventaris Module
 * Milestone 3 / Week 7 - Pemrograman Web 2
 *
 * Menangani mode tambah dan edit data inventaris.
 * URL:
 *   - Tambah: form-inventaris.html
 *   - Edit:   form-inventaris.html?id=ID_RECORD
 */

(function() {
  'use strict';

  const fieldIds = ['kode', 'nama', 'kategori', 'gedung', 'ruangan', 'lokasi', 'jumlah', 'satuan', 'kondisi', 'status', 'tahun', 'sumber', 'deskripsi'];

  let form;
  let formArea;
  let notFoundArea;
  let formTitle;
  let formSubtitle;
  let btnSave;
  let btnSaveLabel;
  let editingId = null;
  let submitting = false;

  function el(id) {
    return document.getElementById(id);
  }

  function getQueryId() {
    const params = new URLSearchParams(window.location.search);
    const raw = params.get('id');
    if (raw === null || raw === '') return null;
    const id = Number(raw);
    return Number.isInteger(id) && id > 0 ? id : null;
  }

  function field(name) {
    return el('f-' + name);
  }

  function setError(name, message) {
    const errEl = el('err-' + name);
    const inputEl = field(name);
    if (errEl) {
      errEl.textContent = message || '';
      errEl.classList.toggle('hidden', !message);
    }
    if (inputEl) {
      inputEl.classList.toggle('field-input-error', !!message);
    }
  }

  function clearErrors() {
    fieldIds.forEach(name => setError(name, ''));
  }

  function readValue(name) {
    const inputEl = field(name);
    if (!inputEl) return '';
    if (inputEl.type === 'number') {
      return inputEl.value;
    }
    return inputEl.value.trim();
  }

  function validate() {
    const errors = {};

    const kode = readValue('kode');
    if (!kode) errors.kode = 'Kode inventaris wajib diisi';
    else {
      const dupe = InventoryStore.getAll().find(item =>
        item.kode.trim().toLowerCase() === kode.toLowerCase() && item.id !== editingId
      );
      if (dupe) errors.kode = 'Kode inventaris sudah digunakan';
    }

    if (!readValue('nama')) errors.nama = 'Nama inventaris wajib diisi';
    if (!readValue('kategori')) errors.kategori = 'Kategori wajib dipilih';
    if (!readValue('lokasi')) errors.lokasi = 'Lokasi wajib diisi';
    if (!readValue('kondisi')) errors.kondisi = 'Kondisi wajib dipilih';

    const jumlahRaw = readValue('jumlah');
    const jumlah = Number(jumlahRaw);
    if (jumlahRaw === '' || !Number.isInteger(jumlah) || jumlah < 1) {
      errors.jumlah = 'Jumlah harus bilangan bulat positif';
    }

    return errors;
  }

  function buildPayload() {
    const jumlah = Number(readValue('jumlah'));
    return {
      kode: readValue('kode'),
      nama: readValue('nama'),
      kategori: readValue('kategori'),
      gedung: readValue('gedung'),
      ruangan: readValue('ruangan'),
      lokasi: readValue('lokasi'),
      jumlah: jumlah,
      satuan: readValue('satuan') || 'Unit',
      kondisi: readValue('kondisi'),
      status: readValue('status') || 'Aktif',
      tahunPengadaan: readValue('tahun') ? Number(readValue('tahun')) : new Date().getFullYear(),
      sumberDana: readValue('sumber') || 'Belum diisi',
      deskripsi: readValue('deskripsi')
    };
  }

  function showErrors(errors) {
    Object.keys(errors).forEach(name => setError(name, errors[name]));
  }

  function setSubmitting(state) {
    submitting = state;
    btnSave.disabled = state;
    btnSaveLabel.textContent = state ? 'Menyimpan...' : 'Simpan';
  }

  function fillForm(item) {
    field('kode').value = item.kode || '';
    field('nama').value = item.nama || '';
    field('kategori').value = item.kategori || '';
    field('gedung').value = item.gedung || '';
    field('ruangan').value = item.ruangan || '';
    field('lokasi').value = item.lokasi || '';
    field('jumlah').value = item.jumlah != null ? item.jumlah : 1;
    field('satuan').value = item.satuan || 'Unit';
    field('kondisi').value = item.kondisi || '';
    field('status').value = item.status || 'Aktif';
    field('tahun').value = item.tahunPengadaan != null ? item.tahunPengadaan : new Date().getFullYear();
    field('sumber').value = item.sumberDana || 'Belum diisi';
    field('deskripsi').value = item.deskripsi || '';
  }

  function showNotFound() {
    formArea.classList.add('hidden');
    notFoundArea.classList.remove('hidden');
  }

  function syncLokasi() {
    const gedung = readValue('gedung');
    const ruangan = readValue('ruangan');
    if (gedung && ruangan) {
      field('lokasi').value = gedung + ' - ' + ruangan;
    }
  }

  function handleSubmit(event) {
    event.preventDefault();
    if (submitting) return;

    clearErrors();
    const errors = validate();
    if (Object.keys(errors).length > 0) {
      showErrors(errors);
      return;
    }

    setSubmitting(true);
    const payload = buildPayload();

    const result = editingId !== null
      ? InventoryStore.update(editingId, payload)
      : InventoryStore.create(payload);

    if (result && result.success) {
      window.location.href = 'data-master.html';
    } else {
      setSubmitting(false);
      const storeErrors = (result && result.errors) || ['Gagal menyimpan data inventaris'];
      showErrorsFromStore(storeErrors);
    }
  }

  function showErrorsFromStore(errors) {
    // Petakan pesan store ke field bila memungkinkan, sisanya tampilkan di dekat tombol simpan.
    let handled = false;
    errors.forEach(message => {
      const lower = message.toLowerCase();
      if (lower.indexOf('kode') !== -1) { setError('kode', message); handled = true; }
      else if (lower.indexOf('nama') !== -1) { setError('nama', message); handled = true; }
      else if (lower.indexOf('kategori') !== -1) { setError('kategori', message); handled = true; }
      else if (lower.indexOf('lokasi') !== -1) { setError('lokasi', message); handled = true; }
      else if (lower.indexOf('kondisi') !== -1) { setError('kondisi', message); handled = true; }
      else if (lower.indexOf('jumlah') !== -1) { setError('jumlah', message); handled = true; }
    });
    if (!handled) {
      setError('kode', errors.join('. '));
    }
  }

  function init() {
    form = el('inventory-form');
    formArea = el('form-area');
    notFoundArea = el('not-found');
    formTitle = el('form-title');
    formSubtitle = el('form-subtitle');
    btnSave = el('btn-save');
    btnSaveLabel = el('btn-save-label');

    if (typeof InventoryStore === 'undefined') {
      formArea.classList.add('hidden');
      notFoundArea.classList.remove('hidden');
      return;
    }

    editingId = getQueryId();

    if (editingId !== null) {
      const item = InventoryStore.getById(editingId);
      if (!item) {
        showNotFound();
        return;
      }
      fillForm(item);
      formTitle.textContent = 'Edit Inventaris';
      formSubtitle.textContent = 'Perbarui data inventaris yang telah tersimpan.';
      el('crumb-current').textContent = 'Edit Inventaris';
    }

    form.addEventListener('submit', handleSubmit);

    const gedungEl = field('gedung');
    const ruanganEl = field('ruangan');
    if (gedungEl) gedungEl.addEventListener('change', syncLokasi);
    if (ruanganEl) ruanganEl.addEventListener('change', syncLokasi);
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }
})();
