/**
 * SIMSARPRAS UNPAM - Inventory Store Module
 * Milestone 3 / Week 7 - Pemrograman Web 2
 * 
 * Modul penyimpanan inventaris berbasis localStorage dengan validasi lengkap
 */

const InventoryStore = (function() {
  'use strict';

  const STORAGE_KEY = 'simsarpras.inventory.v1';
  
  // Data seed dari tabel yang ada di data-master.html
  const SEED_DATA = [
    {
      id: 1,
      kode: 'INV-KLS-001',
      nama: 'LCD Proyektor Epson EB-2250U',
      deskripsi: 'WUXGA 5000 Lumens 3LCD HDMI LAN',
      icon: 'videocam',
      kategori: 'Elektronik',
      gedung: 'Gedung A',
      ruangan: 'Ruang A101',
      lokasi: 'Gedung A - Ruang A101',
      jumlah: 1,
      satuan: 'Unit',
      kondisi: 'Baik',
      tahunPengadaan: 2025,
      sumberDana: 'Belum diisi',
      status: 'Aktif',
      tanggal: '2025-01-15'
    },
    {
      id: 2,
      kode: 'INV-KLS-002',
      nama: 'Kursi Mahasiswa (Chitose)',
      deskripsi: 'Tipe Kuliah Lipat Meja Kayu',
      icon: 'chair_alt',
      kategori: 'Furnitur',
      gedung: 'Gedung A',
      ruangan: 'Ruang A101',
      lokasi: 'Gedung A - Ruang A101',
      jumlah: 40,
      satuan: 'Unit',
      kondisi: 'Baik',
      tahunPengadaan: 2024,
      sumberDana: 'Belum diisi',
      status: 'Aktif',
      tanggal: '2024-08-20'
    },
    {
      id: 3,
      kode: 'INV-LAB-001',
      nama: 'PC Lenovo ThinkCentre M70s',
      deskripsi: 'Core i7-12700 / 16GB / 512GB SSD',
      icon: 'desktop_windows',
      kategori: 'Komputer',
      gedung: 'Gedung Laboratorium',
      ruangan: 'Lab Komputer 1',
      lokasi: 'Gedung Laboratorium - Lab Komputer 1',
      jumlah: 30,
      satuan: 'Unit',
      kondisi: 'Baik',
      tahunPengadaan: 2025,
      sumberDana: 'Belum diisi',
      status: 'Aktif',
      tanggal: '2025-02-10'
    },
    {
      id: 4,
      kode: 'INV-LAB-002',
      nama: 'Monitor LED Dell 24" P2422H',
      deskripsi: 'Full HD IPS USB-C Daisy Chain',
      icon: 'monitor',
      kategori: 'Komputer',
      gedung: 'Gedung Laboratorium',
      ruangan: 'Lab Komputer 1',
      lokasi: 'Gedung Laboratorium - Lab Komputer 1',
      jumlah: 30,
      satuan: 'Unit',
      kondisi: 'Baik',
      tahunPengadaan: 2025,
      sumberDana: 'Belum diisi',
      status: 'Aktif',
      tanggal: '2025-02-10'
    },
    {
      id: 5,
      kode: 'INV-LAB-003',
      nama: 'Router Mikrotik hEX PoE',
      deskripsi: 'RB960PGS Gigabit 5-Port PoE-out',
      icon: 'router',
      kategori: 'Perangkat Jaringan',
      gedung: 'Gedung Laboratorium',
      ruangan: 'Lab Jaringan',
      lokasi: 'Gedung Laboratorium - Lab Jaringan',
      jumlah: 15,
      satuan: 'Unit',
      kondisi: 'Perlu Pemeriksaan',
      tahunPengadaan: 2024,
      sumberDana: 'Belum diisi',
      status: 'Perlu Pemeriksaan',
      tanggal: '2024-09-05'
    },
    {
      id: 6,
      kode: 'INV-PUS-001',
      nama: 'Komputer OPAC Perpustakaan',
      deskripsi: 'Anjungan Pencarian Mandiri Mahasiswa',
      icon: 'touch_app',
      kategori: 'Komputer',
      gedung: 'Gedung Perpustakaan',
      ruangan: 'Perpustakaan Lt. 5',
      lokasi: 'Gedung Perpustakaan - Perpustakaan Lt. 5',
      jumlah: 5,
      satuan: 'Unit',
      kondisi: 'Rusak Ringan',
      tahunPengadaan: 2023,
      sumberDana: 'Belum diisi',
      status: 'Aktif',
      tanggal: '2023-06-12'
    },
    {
      id: 7,
      kode: 'INV-KLS-003',
      nama: 'AC Split Daikin 2 PK',
      deskripsi: 'Inverter FTKC50SVM4 - Refrigrant R32',
      icon: 'mode_fan',
      kategori: 'Elektronik',
      gedung: 'Gedung B',
      ruangan: 'Ruang B204',
      lokasi: 'Gedung B - Ruang B204',
      jumlah: 2,
      satuan: 'Unit',
      kondisi: 'Dalam Perbaikan',
      tahunPengadaan: 2023,
      sumberDana: 'Belum diisi',
      status: 'Aktif',
      tanggal: '2023-07-20'
    },
    {
      id: 8,
      kode: 'INV-LAB-004',
      nama: 'Switch Mikrotik Cloud Router',
      deskripsi: 'CRS326-24G-2S+RM SwitchOS/RouterOS',
      icon: 'hub',
      kategori: 'Perangkat Jaringan',
      gedung: 'Gedung Laboratorium',
      ruangan: 'Lab Jaringan',
      lokasi: 'Gedung Laboratorium - Lab Jaringan',
      jumlah: 6,
      satuan: 'Unit',
      kondisi: 'Baik',
      tahunPengadaan: 2025,
      sumberDana: 'Belum diisi',
      status: 'Aktif',
      tanggal: '2025-01-28'
    },
    {
      id: 9,
      kode: 'INV-KLS-004',
      nama: 'Whiteboard Magnetik 120x240',
      deskripsi: 'List Aluminium Wall-mounted Board',
      icon: 'crop_landscape',
      kategori: 'Furnitur',
      gedung: 'Gedung A',
      ruangan: 'Ruang A102',
      lokasi: 'Gedung A - Ruang A102',
      jumlah: 1,
      satuan: 'Unit',
      kondisi: 'Baik',
      tahunPengadaan: 2024,
      sumberDana: 'Belum diisi',
      status: 'Aktif',
      tanggal: '2024-03-15'
    },
    {
      id: 10,
      kode: 'INV-PUS-002',
      nama: 'Rak Buku Baja Ganda 5 Tingkat',
      deskripsi: 'Powder Coated Heavy Duty Steel',
      icon: 'shelves',
      kategori: 'Furnitur',
      gedung: 'Gedung Perpustakaan',
      ruangan: 'Perpustakaan Lt. 5',
      lokasi: 'Gedung Perpustakaan - Perpustakaan Lt. 5',
      jumlah: 12,
      satuan: 'Unit',
      kondisi: 'Baik',
      tahunPengadaan: 2022,
      sumberDana: 'Belum diisi',
      status: 'Aktif',
      tanggal: '2022-11-08'
    }
  ];

  /**
   * Membaca data dari localStorage
   * @returns {Array} Array inventaris atau null jika terjadi error
   */
  function loadFromStorage() {
    try {
      const stored = localStorage.getItem(STORAGE_KEY);
      if (!stored) {
        return null;
      }
      const data = JSON.parse(stored);
      if (!Array.isArray(data)) {
        console.error('Data inventaris tidak valid: bukan array');
        return null;
      }
      return data;
    } catch (error) {
      console.error('Gagal membaca data inventaris:', error);
      return null;
    }
  }

  /**
   * Menyimpan data ke localStorage
   * @param {Array} data - Array inventaris yang akan disimpan
   * @returns {boolean} true jika berhasil, false jika gagal
   */
  function saveToStorage(data) {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
      return true;
    } catch (error) {
      console.error('Gagal menyimpan data inventaris:', error);
      return false;
    }
  }

  /**
   * Inisialisasi data dengan seed jika key belum ada
   * 
   * Penting: seed HANYA dilakukan bila key sama sekali belum ada di localStorage.
   * Jika key ada namun isinya rusak (JSON tidak valid / bukan array), data lama
   * TIDAK boleh ditimpa secara diam-diam.
   */
  function initializeData() {
    let rawExists = false;
    let raw = null;

    try {
      raw = localStorage.getItem(STORAGE_KEY);
      // Key dianggap ada hanya bila getItem mengembalikan string (termasuk '[]')
      rawExists = raw !== null && raw !== undefined;
    } catch (error) {
      console.error('Gagal mengakses localStorage:', error);
      return;
    }

    if (!rawExists) {
      // Belum pernah ada data -> aman untuk seed
      saveToStorage(SEED_DATA);
      console.log('Data inventaris berhasil di-seed dengan', SEED_DATA.length, 'record');
      return;
    }

    // Key sudah ada. Array kosong [] tetap dipertahankan (tidak di-seed ulang).
    const existing = loadFromStorage();
    if (existing === null) {
      // Ada key, tapi isinya tidak terbaca -> jangan timpa
      console.error(
        'Data inventaris pada key "' + STORAGE_KEY + '" rusak atau tidak valid. ' +
        'Data lama tidak ditimpa. Perbaiki atau hapus key secara manual.'
      );
    }
  }

  /**
   * Validasi data inventaris
   * @param {Object} item - Item inventaris yang akan divalidasi
   * @param {boolean} isUpdate - true jika ini operasi update
   * @param {number} updateId - ID item yang sedang di-update (untuk validasi kode unik)
   * @returns {Object} { valid: boolean, errors: Array }
   */
  function validateItem(item, isUpdate = false, updateId = null) {
    const errors = [];

    // Field wajib
    if (!item.kode || typeof item.kode !== 'string' || item.kode.trim() === '') {
      errors.push('Kode inventaris wajib diisi');
    }
    if (!item.nama || typeof item.nama !== 'string' || item.nama.trim() === '') {
      errors.push('Nama inventaris wajib diisi');
    }
    if (!item.kategori || typeof item.kategori !== 'string' || item.kategori.trim() === '') {
      errors.push('Kategori wajib diisi');
    }
    if (!item.lokasi || typeof item.lokasi !== 'string' || item.lokasi.trim() === '') {
      errors.push('Lokasi wajib diisi');
    }
    if (!item.kondisi || typeof item.kondisi !== 'string' || item.kondisi.trim() === '') {
      errors.push('Kondisi wajib diisi');
    }

    // Validasi jumlah: bilangan bulat positif.
    // Number() dipakai agar nilai desimal (mis. "3.5") dan string sampah
    // (mis. "3abc" -> NaN) ditolak, bukan dipotong oleh parseInt.
    const jumlah = Number(item.jumlah);
    if (!Number.isInteger(jumlah) || jumlah < 1) {
      errors.push('Jumlah harus bilangan bulat positif');
    }

    // Validasi kode unik (case-insensitive)
    if (item.kode && typeof item.kode === 'string') {
      const kodeTrimmed = item.kode.trim().toLowerCase();
      const allData = loadFromStorage() || [];
      const duplicate = allData.find(existing => {
        const isDifferentItem = isUpdate ? existing.id !== updateId : true;
        return isDifferentItem && existing.kode.toLowerCase() === kodeTrimmed;
      });
      if (duplicate) {
        errors.push('Kode inventaris sudah digunakan');
      }
    }

    return {
      valid: errors.length === 0,
      errors
    };
  }

  /**
   * Mengambil semua data inventaris
   * @returns {Array} Salinan array inventaris
   */
  function getAll() {
    const data = loadFromStorage();
    if (data === null) {
      return [];
    }
    // Kembalikan salinan agar pemanggil tidak bisa mengubah store langsung
    return data.map(item => ({ ...item }));
  }

  /**
   * Mengambil inventaris berdasarkan ID
   * @param {number} id - ID inventaris
   * @returns {Object|null} Salinan item atau null jika tidak ditemukan
   */
  function getById(id) {
    const data = loadFromStorage();
    if (data === null) {
      return null;
    }
    const item = data.find(inv => inv.id === id);
    return item ? { ...item } : null;
  }

  /**
   * Menambah inventaris baru
   * @param {Object} item - Item inventaris baru (tanpa ID)
   * @returns {Object} { success: boolean, data: Object|null, errors: Array }
   */
  function create(item) {
    const validation = validateItem(item, false);
    if (!validation.valid) {
      return { success: false, data: null, errors: validation.errors };
    }

    const data = loadFromStorage() || [];
    
    // Generate ID baru
    const newId = data.length > 0 ? Math.max(...data.map(inv => inv.id)) + 1 : 1;
    
    const newItem = {
      id: newId,
      kode: item.kode.trim(),
      nama: item.nama.trim(),
      deskripsi: item.deskripsi || '',
      icon: item.icon || 'inventory_2',
      kategori: item.kategori.trim(),
      gedung: item.gedung || '',
      ruangan: item.ruangan || '',
      lokasi: item.lokasi.trim(),
      jumlah: Number(item.jumlah),
      satuan: item.satuan || 'Unit',
      kondisi: item.kondisi.trim(),
      tahunPengadaan: item.tahunPengadaan || new Date().getFullYear(),
      sumberDana: item.sumberDana || 'Belum diisi',
      status: item.status || 'Aktif',
      tanggal: item.tanggal || new Date().toISOString().split('T')[0]
    };

    data.push(newItem);
    
    if (!saveToStorage(data)) {
      return { success: false, data: null, errors: ['Gagal menyimpan ke localStorage'] };
    }

    return { success: true, data: { ...newItem }, errors: [] };
  }

  /**
   * Memperbarui inventaris yang ada
   * @param {number} id - ID inventaris yang akan diupdate
   * @param {Object} updates - Data yang akan diupdate
   * @returns {Object} { success: boolean, data: Object|null, errors: Array }
   */
  function update(id, updates) {
    const data = loadFromStorage();
    if (data === null) {
      return { success: false, data: null, errors: ['Gagal membaca data'] };
    }

    const index = data.findIndex(inv => inv.id === id);
    if (index === -1) {
      return { success: false, data: null, errors: ['Inventaris tidak ditemukan'] };
    }

    const updatedItem = { ...data[index], ...updates, id }; // ID tidak boleh berubah
    
    const validation = validateItem(updatedItem, true, id);
    if (!validation.valid) {
      return { success: false, data: null, errors: validation.errors };
    }

    // Normalisasi data
    updatedItem.kode = updatedItem.kode.trim();
    updatedItem.nama = updatedItem.nama.trim();
    updatedItem.kategori = updatedItem.kategori.trim();
    updatedItem.lokasi = updatedItem.lokasi.trim();
    updatedItem.kondisi = updatedItem.kondisi.trim();
    updatedItem.jumlah = Number(updatedItem.jumlah);

    data[index] = updatedItem;

    if (!saveToStorage(data)) {
      return { success: false, data: null, errors: ['Gagal menyimpan ke localStorage'] };
    }

    return { success: true, data: { ...updatedItem }, errors: [] };
  }

  /**
   * Menghapus inventaris
   * @param {number} id - ID inventaris yang akan dihapus
   * @returns {Object} { success: boolean, errors: Array }
   */
  function remove(id) {
    const data = loadFromStorage();
    if (data === null) {
      return { success: false, errors: ['Gagal membaca data'] };
    }

    const index = data.findIndex(inv => inv.id === id);
    if (index === -1) {
      return { success: false, errors: ['Inventaris tidak ditemukan'] };
    }

    data.splice(index, 1);

    if (!saveToStorage(data)) {
      return { success: false, errors: ['Gagal menyimpan ke localStorage'] };
    }

    return { success: true, errors: [] };
  }

  /**
   * Menghapus semua data (untuk testing)
   * @returns {boolean} true jika berhasil
   */
  function clearAll() {
    try {
      localStorage.removeItem(STORAGE_KEY);
      return true;
    } catch (error) {
      console.error('Gagal menghapus data:', error);
      return false;
    }
  }

  // Inisialisasi otomatis saat modul dimuat
  initializeData();

  // Public API
  return {
    getAll,
    getById,
    create,
    update,
    remove,
    clearAll,
    // Untuk testing/debugging
    _seedData: SEED_DATA,
    _storageKey: STORAGE_KEY
  };
})();

// Export untuk digunakan di modul lain
if (typeof module !== 'undefined' && module.exports) {
  module.exports = InventoryStore;
}
