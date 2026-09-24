/**
 * SIMSARPRAS UNPAM - Data Inventaris Module
 * Milestone 3 / Week 7 - Pemrograman Web 2
 * 
 * Modul untuk render tabel inventaris dari localStorage
 */

(function() {
  'use strict';

  // Elemen DOM
  let tbody;
  let resultCountElement;
  let searchInput;
  let searchClear;
  let filterKategori;
  let filterGedung;
  let filterRuangan;
  let filterKondisi;
  let filterStatus;
  let btnReset;
  let selectAllCheckbox;
  let bulkBar;
  let selectedCountBadge;
  let selectedCountText;
  let footerSelectedCount;

  /**
   * Inisialisasi elemen DOM
   */
  function initializeElements() {
    tbody = document.getElementById('inventory-table-body');
    resultCountElement = document.getElementById('result-count');
    searchInput = document.getElementById('search-input');
    searchClear = document.getElementById('search-clear');
    filterKategori = document.getElementById('filter-kategori');
    filterGedung = document.getElementById('filter-gedung');
    filterRuangan = document.getElementById('filter-ruangan');
    filterKondisi = document.getElementById('filter-kondisi');
    filterStatus = document.getElementById('filter-status');
    btnReset = document.getElementById('btn-reset-filter');
    selectAllCheckbox = document.getElementById('th-select-all');
    bulkBar = document.getElementById('bulk-bar');
    selectedCountBadge = document.getElementById('selected-count-badge');
    selectedCountText = document.getElementById('selected-count-text');
    footerSelectedCount = document.getElementById('footer-selected-count');
  }

  /**
   * Mendapatkan kelas badge berdasarkan kondisi
   */
  function getBadgeClass(kondisi) {
    const kondisiLower = kondisi.toLowerCase();
    if (kondisiLower === 'baik') return 'badge-good';
    if (kondisiLower === 'rusak ringan') return 'badge-warning';
    if (kondisiLower === 'dalam perbaikan') return 'badge-error';
    if (kondisiLower === 'perlu pemeriksaan') return 'badge-check';
    return 'badge-good';
  }

  /**
   * Mendapatkan kelas status berdasarkan nilai status
   */
  function getStatusClass(status) {
    const statusLower = status.toLowerCase();
    if (statusLower === 'aktif') return 'bg-primary-fixed text-primary';
    if (statusLower === 'perlu pemeriksaan') return 'bg-secondary-fixed text-on-secondary-fixed';
    return 'bg-primary-fixed text-primary';
  }

  /**
   * Render satu baris tabel
   */
  function renderRow(item) {
    const tr = document.createElement('tr');
    tr.className = 'hover:bg-surface-container-low/60 transition-colors border-b border-surface-container-low';
    tr.dataset.gedung = item.gedung || '';
    tr.dataset.kategori = item.kategori || '';
    tr.dataset.kondisi = item.kondisi || '';
    tr.dataset.ruangan = item.ruangan || '';
    tr.dataset.status = item.status || '';

    const badgeClass = getBadgeClass(item.kondisi);
    const statusClass = getStatusClass(item.status);

    tr.innerHTML = `
      <td class="py-3 px-4 text-center">
        <input class="row-checkbox w-4 h-4 rounded text-primary focus:ring-0 cursor-pointer" type="checkbox" aria-label="Pilih ${item.kode}">
      </td>
      <td class="py-3 px-3 font-code-sm text-code-sm font-semibold text-primary"></td>
      <td class="py-3 px-3">
        <div class="flex items-center gap-2.5">
          <div class="w-8 h-8 rounded-lg bg-surface-container flex items-center justify-center text-primary">
            <span class="material-symbols-outlined text-[18px]"></span>
          </div>
          <div class="flex flex-col">
            <span class="font-label-md text-label-md font-semibold text-on-surface"></span>
            <span class="font-body-sm text-body-sm text-on-surface-variant"></span>
          </div>
        </div>
      </td>
      <td class="py-3 px-3 text-on-surface-variant font-body-sm text-body-sm"></td>
      <td class="py-3 px-3 text-on-surface-variant font-body-sm text-body-sm"></td>
      <td class="py-3 px-3 font-medium text-body-sm"></td>
      <td class="py-3 px-3 text-center font-code-sm text-code-sm font-semibold"></td>
      <td class="py-3 px-3">
        <span class="badge ${badgeClass} whitespace-nowrap">
          <span class="hidden"></span> 
        </span>
      </td>
      <td class="py-3 px-3 text-center font-code-sm text-code-sm text-on-surface-variant"></td>
      <td class="py-3 px-3 text-body-sm text-on-surface-variant"></td>
      <td class="py-3 px-3">
        <span class="inline-flex items-center px-2 py-0.5 rounded-full ${statusClass} font-label-sm text-label-sm font-bold">
        </span>
      </td>
      <td class="py-3 px-4 text-center sticky right-0 bg-surface-container-lowest shadow-[-4px_0_6px_rgba(0,0,0,0.02)]">
        <div class="flex items-center justify-center gap-1">
          <button class="p-1.5 rounded hover:bg-surface-container text-on-surface-variant hover:text-primary transition-colors" type="button" disabled title="Fitur belum tersedia pada Milestone 2" aria-label="visibility">
            <span class="material-symbols-outlined text-[18px]">visibility</span>
          </button>
          <button class="p-1.5 rounded hover:bg-surface-container text-on-surface-variant hover:text-primary transition-colors" type="button" disabled title="Fitur belum tersedia pada Milestone 2" aria-label="edit">
            <span class="material-symbols-outlined text-[18px]">edit</span>
          </button>
          <button class="p-1.5 rounded hover:bg-surface-container text-on-surface-variant hover:text-surface-tint transition-colors" type="button" disabled title="Fitur belum tersedia pada Milestone 2" aria-label="build">
            <span class="material-symbols-outlined text-[18px]">build</span>
          </button>
        </div>
      </td>
    `;

    // Isi data menggunakan textContent untuk keamanan
    const cells = tr.querySelectorAll('td');
    cells[1].textContent = item.kode || '';
    
    const iconSpan = cells[2].querySelector('.material-symbols-outlined');
    iconSpan.textContent = item.icon || 'inventory_2';
    
    const namaSpan = cells[2].querySelector('.font-label-md');
    namaSpan.textContent = item.nama || '';
    
    const deskripsiSpan = cells[2].querySelector('.font-body-sm');
    deskripsiSpan.textContent = item.deskripsi || '';
    
    cells[3].textContent = item.kategori || '';
    cells[4].textContent = item.gedung || '';
    cells[5].textContent = item.ruangan || '';
    cells[6].textContent = `${item.jumlah || 0} ${item.satuan || 'Unit'}`;
    
    const badgeSpan = cells[7].querySelector('.badge');
    badgeSpan.childNodes[2].textContent = item.kondisi || '';
    
    cells[8].textContent = item.tahunPengadaan || '';
    cells[9].textContent = item.sumberDana || 'Belum diisi';
    
    const statusSpan = cells[10].querySelector('span');
    statusSpan.textContent = item.status || '';

    return tr;
  }

  /**
   * Render tabel inventaris
   */
  function renderTable(data) {
    if (!tbody) {
      console.error('Elemen tbody tidak ditemukan');
      return;
    }

    // Hapus konten lama
    tbody.innerHTML = '';

    if (!data || data.length === 0) {
      // Tampilkan pesan kosong
      const tr = document.createElement('tr');
      tr.innerHTML = `
        <td colspan="12" class="py-12 text-center">
          <div class="flex flex-col items-center gap-3">
            <span class="material-symbols-outlined text-[48px] text-outline">inventory_2</span>
            <p class="font-label-lg text-label-lg text-on-surface-variant">Tidak ada data inventaris</p>
            <p class="font-body-sm text-body-sm text-on-surface-variant">Data inventaris kosong atau belum dimuat</p>
          </div>
        </td>
      `;
      tbody.appendChild(tr);
      updateResultCount(0);
      updateSelection();
      return;
    }

    // Render setiap baris
    data.forEach(item => {
      const row = renderRow(item);
      tbody.appendChild(row);
    });

    updateResultCount(data.length);

    // Pasang ulang event listener checkbox
    attachCheckboxListeners();

    // Sinkronkan status seleksi
    updateSelection();
  }

  /**
   * Update jumlah hasil
   */
  function updateResultCount(count) {
    const total = typeof InventoryStore !== 'undefined' ? InventoryStore.getAll().length : count;
    if (resultCountElement) {
      resultCountElement.textContent = `Menampilkan ${count} dari ${total} baris`;
    }
  }

  /**
   * Perbarui status seleksi: bulk-bar, counter, dan select-all.
   */
  function updateSelection() {
    const checkboxes = Array.from(document.querySelectorAll('.row-checkbox'));
    const visible = checkboxes.filter(cb => !cb.closest('tr').hidden);
    const checked = visible.filter(cb => cb.checked);
    const count = checked.length;

    if (bulkBar) bulkBar.classList.toggle('hidden', count === 0);
    if (selectedCountBadge) selectedCountBadge.textContent = count;
    if (selectedCountText) selectedCountText.textContent = count;
    if (footerSelectedCount) footerSelectedCount.textContent = count + ' item terpilih';

    if (selectAllCheckbox) {
      selectAllCheckbox.checked = visible.length > 0 && count === visible.length;
      selectAllCheckbox.indeterminate = count > 0 && count < visible.length;
      selectAllCheckbox.disabled = visible.length === 0;
    }
  }

  /**
   * Filter data berdasarkan search dan filter
   */
  function filterData() {
    const allData = InventoryStore.getAll();
    
    const searchTerm = searchInput ? searchInput.value.toLowerCase().trim() : '';
    const kategoriValue = filterKategori ? filterKategori.value : '';
    const gedungValue = filterGedung ? filterGedung.value : '';
    const ruanganValue = filterRuangan ? filterRuangan.value : '';
    const kondisiValue = filterKondisi ? filterKondisi.value : '';
    const statusValue = filterStatus ? filterStatus.value : '';

    let filtered = allData;

    // Filter search
    if (searchTerm) {
      filtered = filtered.filter(item => {
        return (
          (item.kode && item.kode.toLowerCase().includes(searchTerm)) ||
          (item.nama && item.nama.toLowerCase().includes(searchTerm)) ||
          (item.deskripsi && item.deskripsi.toLowerCase().includes(searchTerm)) ||
          (item.kategori && item.kategori.toLowerCase().includes(searchTerm)) ||
          (item.lokasi && item.lokasi.toLowerCase().includes(searchTerm))
        );
      });
    }

    // Filter kategori
    if (kategoriValue) {
      filtered = filtered.filter(item => item.kategori === kategoriValue);
    }

    // Filter gedung
    if (gedungValue) {
      filtered = filtered.filter(item => item.gedung === gedungValue);
    }

    // Filter ruangan
    if (ruanganValue) {
      filtered = filtered.filter(item => item.ruangan === ruanganValue);
    }

    // Filter kondisi
    if (kondisiValue) {
      filtered = filtered.filter(item => item.kondisi === kondisiValue);
    }

    // Filter status
    if (statusValue) {
      filtered = filtered.filter(item => item.status === statusValue);
    }

    if (searchClear) {
      searchClear.classList.toggle('hidden', searchTerm.length === 0);
    }

    renderTable(filtered);
  }

  /**
   * Reset semua filter
   */
  function resetFilters() {
    if (searchInput) searchInput.value = '';
    if (filterKategori) filterKategori.value = '';
    if (filterGedung) filterGedung.value = '';
    if (filterRuangan) filterRuangan.value = '';
    if (filterKondisi) filterKondisi.value = '';
    if (filterStatus) filterStatus.value = '';
    
    filterData();
  }

  /**
   * Pasang event listener checkbox per baris (dipanggil ulang setiap render)
   */
  function attachCheckboxListeners() {
    // Individual checkboxes
    const checkboxes = document.querySelectorAll('.row-checkbox');
    checkboxes.forEach(cb => {
      cb.addEventListener('change', function() {
        updateSelection();
      });
    });
  }

  /**
   * Inisialisasi event listeners
   */
  function initializeEventListeners() {
    // Search input dengan debounce
    let searchTimeout;
    if (searchInput) {
      searchInput.addEventListener('input', function() {
        clearTimeout(searchTimeout);
        searchTimeout = setTimeout(filterData, 300);
      });
    }

    // Filter dropdowns
    if (filterKategori) filterKategori.addEventListener('change', filterData);
    if (filterGedung) filterGedung.addEventListener('change', filterData);
    if (filterRuangan) filterRuangan.addEventListener('change', filterData);
    if (filterKondisi) filterKondisi.addEventListener('change', filterData);
    if (filterStatus) filterStatus.addEventListener('change', filterData);

    // Reset button
    if (btnReset) {
      btnReset.addEventListener('click', resetFilters);
    }

    // Select all (dipasang sekali; elemen statis di thead)
    if (selectAllCheckbox) {
      selectAllCheckbox.addEventListener('change', function() {
        const checkboxes = Array.from(document.querySelectorAll('.row-checkbox'));
        checkboxes.forEach(cb => {
          if (!cb.closest('tr').hidden) {
            cb.checked = this.checked;
          }
        });
        updateSelection();
      });
    }

    // Tombol hapus pencarian
    if (searchClear) {
      searchClear.addEventListener('click', function() {
        if (searchInput) searchInput.value = '';
        filterData();
        if (searchInput) searchInput.focus();
      });
    }
  }

  /**
   * Inisialisasi halaman
   */
  function initialize() {
    try {
      initializeElements();
      
      // Cek ketersediaan InventoryStore
      if (typeof InventoryStore === 'undefined') {
        console.error('InventoryStore tidak ditemukan. Pastikan inventory-store.js dimuat terlebih dahulu.');
        if (tbody) {
          tbody.innerHTML = `
            <tr>
              <td colspan="12" class="py-12 text-center">
                <div class="flex flex-col items-center gap-3">
                  <span class="material-symbols-outlined text-[48px] text-error">error</span>
                  <p class="font-label-lg text-label-lg text-error">Error: Modul penyimpanan tidak ditemukan</p>
                  <p class="font-body-sm text-body-sm text-on-surface-variant">Pastikan inventory-store.js dimuat dengan benar</p>
                </div>
              </td>
            </tr>
          `;
        }
        return;
      }

      // Load dan render data
      const data = InventoryStore.getAll();
      renderTable(data);

      // Pasang event listeners
      initializeEventListeners();

      console.log('Data inventaris berhasil dimuat:', data.length, 'record');
    } catch (error) {
      console.error('Error saat inisialisasi data inventaris:', error);
      if (tbody) {
        tbody.innerHTML = `
          <tr>
            <td colspan="12" class="py-12 text-center">
              <div class="flex flex-col items-center gap-3">
                <span class="material-symbols-outlined text-[48px] text-error">error</span>
                <p class="font-label-lg text-label-lg text-error">Error saat memuat data</p>
                <p class="font-body-sm text-body-sm text-on-surface-variant">${error.message}</p>
              </div>
            </td>
          </tr>
        `;
      }
    }
  }

  // Jalankan inisialisasi saat DOM ready
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initialize);
  } else {
    initialize();
  }

  // Export untuk testing
  if (typeof window !== 'undefined') {
    window.DataInventaris = {
      renderTable,
      filterData,
      resetFilters
    };
  }
})();
