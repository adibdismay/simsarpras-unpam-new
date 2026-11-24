/**
 * SIMSARPRAS EDU - Master Data Storage Module
 * Version 1.0.0
 * 
 * Storage for Gedung, Ruangan, Kategori, Maintenance, and Users
 * Uses versioned localStorage keys per spec
 */

(function(global) {
  'use strict';

  // Storage key constants (versioned per specification)
  const STORAGE_KEYS = {
    BUILDINGS: 'simsarpras.buildings.v1',
    ROOMS: 'simsarpras.rooms.v1',
    CATEGORIES: 'simsarpras.categories.v1'
  };

  // Master data entities
  const Entities = {
    BUILDING: 'gedung',
    ROOM: 'ruangan',
    CATEGORY: 'kategori',
    MAINTENANCE: 'pemeliharaan',
    USER: 'pengguna',
    KONDISI_INVEN: 'kondisi_inventaris'
  };

  // Default seed data for master modules
  const DEFAULT_DATA = {
    buildings: [
      { id: 'gedung-a', name: 'Gedung A', code: 'GA', address: 'Jl. Raya Puspitek No. 46, Pondok Catur, Pondok Aren, Tangerang Selatan, Banten 15418', facilities: ['A101', 'A102', 'A103', 'A201'] },
      { id: 'gedung-b', name: 'Gedung B', code: 'GB', address: 'Jl. Raya Puspitek No. 46, Pondok Catur, Pondok Aren, Tangerang Selatan, Banten 15418', facilities: ['B201', 'B202', 'B301', 'B302'] },
      { id: 'gedung-lab', name: 'Gedung Laboratorium', code: 'GL', address: 'Jl. Raya Puspitek No. 46, Pondok Catur, Pondok Aren, Tangerang Selatan, Banten 15418', facilities: ['Lab Komputer 1', 'Lab Komputer 2', 'Lab Jaringan', 'Lab Multimedia'] },
      { id: 'gedung-lib', name: 'Gedung Perpustakaan', code: 'GPL', address: 'Jl. Raya Puspitek No. 46, Pondok Catur, Pondok Aren, Tangerang Selatan, Banten 15418', facilities: ['Perpustakaan Lt. 5', 'Arsip', 'Prabekwara'] }
    ],
    rooms: [
      { id: 'ruang-a101', buildingId: 'gedung-a', name: 'Ruang A101', code: 'A-101', type: 'kelas', capacity: 40 },
      { id: 'ruang-a102', buildingId: 'gedung-a', name: 'Ruang A102', code: 'A-102', type: 'kelas', capacity: 40 },
      { id: 'ruang-a103', buildingId: 'gedung-a', name: 'Ruang A103', code: 'A-103', type: 'kelas', capacity: 40 },
      { id: 'ruang-b201', buildingId: 'gedung-b', name: 'Ruang B201', code: 'B-201', type: 'kelas', capacity: 30 },
      { id: 'ruang-b202', buildingId: 'gedung-b', name: 'Ruang B202', code: 'B-202', type: 'kelas', capacity: 30 },
      { id: 'ruang-b301', buildingId: 'gedung-b', name: 'Ruang B301', code: 'B-301', type: 'lab', capacity: 25 },
      { id: 'ruang-b302', buildingId: 'gedung-b', name: 'Ruang B302', code: 'B-302', type: 'kelas', capacity: 30 },
      { id: 'ruang-lab1', buildingId: 'gedung-lab', name: 'Lab Komputer 1', code: 'LAB-101', type: 'lab', capacity: 25 },
      { id: 'ruang-lab2', buildingId: 'gedung-lab', name: 'Lab Komputer 2', code: 'LAB-102', type: 'lab', capacity: 25 },
      { id: 'ruang-labj', buildingId: 'gedung-lab', name: 'Lab Jaringan', code: 'LAB-103', type: 'lab', capacity: 20 },
      { id: 'ruang-labm', buildingId: 'gedung-lab', name: 'Lab Multimedia', code: 'LAB-104', type: 'lab', capacity: 20 },
      { id: 'ruang-lib', buildingId: 'gedung-lib', name: 'Perpustakaan Lt. 5', code: 'PLT5', type: 'library', capacity: 50 }
    ],
    categories: [
      { id: 'kategori-elektronik', name: 'Elektronik', icon: 'desktop_windows' },
      { id: 'kategori-furniture', name: 'Furnitur', icon: 'chair_alt' },
      { id: 'kategori-komputer', name: 'Komputer', icon: 'desktop_windows' },
      { id: 'kategori-jaringan', name: 'Perangkat Jaringan', icon: 'router' },
      { id: 'kategori-laboratorium', name: 'Laboratorium', icon: 'science' },
      { id: 'kategori-peralatan', name: 'Peralatan Olahraga', icon: 'sports_football' },
      { id: 'kategori-buku', name: 'Buku & Majalah', icon: 'local_library' }
    ],
    laboratories: [
      { id: 'lab-lab1', buildingId: 'gedung-lab', name: 'Lab Komputer 1', code: 'LAB-101', jenis: 'lab-komputer', capacity: 25, fasilitas: ['proyektor', 'klima'] },
      { id: 'lab-lab2', buildingId: 'gedung-lab', name: 'Lab Komputer 2', code: 'LAB-102', jenis: 'lab-komputer', capacity: 25, fasilitas: ['proyektor', 'klima'] },
      { id: 'lab-labj', buildingId: 'gedung-lab', name: 'Lab Jaringan', code: 'LAB-103', jenis: 'lab-jaringan', capacity: 20, fasilitas: ['switch', 'router'] },
      { id: 'lab-labm', buildingId: 'gedung-lab', name: 'Lab Multimedia', code: 'LAB-104', jenis: 'lab-multimedia', capacity: 20, fasilitas: ['speaker', 'klima'] }
    ],
    maintenance: [
      { id: 'pemeliharaan-001', inventarisId: 'inv-001', tanggal: '2026-11-01', jenis: 'preventif', deskripsi: 'Pembersihan rutin filter udara', biaya: null, status: 'selesai' }
    ],
    users: [
      { id: 'user-admin', nama: 'Admin SIMSARPRAS', username: 'admin', role: 'admin', status: 'aktif', buildingId: 'gedung-a', hakAkses: 'gestor++,master_crud' }
    ],
    kondisiInventaris: [
      { id: 'kondisi-001', inventarisId: 'inv-001', kondisi: 'baik', deskripsi: 'Kondisi baik', action: 'Referensi' }
    ]
  };

  // Storage instance per entity type
  function Storage(entityType, defaultValue) {
    this.entityType = entityType;
    this.defaultValue = defaultValue || [];
    this.key = null;
    this._initKey();
  }

  Storage.prototype._initKey = function() {
    if (this.entityType === Entities.BUILDING) {
      this.key = STORAGE_KEYS.BUILDINGS;
    } else if (this.entityType === Entities.ROOM) {
      this.key = STORAGE_KEYS.ROOMS;
    } else if (this.entityType === Entities.CATEGORY) {
      this.key = STORAGE_KEYS.CATEGORIES;
    } else if (this.entityType === Entities.MAINTENANCE) {
      this.key = 'simsarpras.maintenance.v1';
    } else if (this.entityType === Entities.USER) {
      this.key = 'simsarpras.users.v1';
    } else if (this.entityType === Entities.KONDISI_INVEN) {
      this.key = 'simsarpras.kondisi_inventaris.v1';
    }
  };

  Storage.prototype._getStorage = function() {
    try {
      const stored = localStorage.getItem(this.key);
      if (stored === null) return null;
      return JSON.parse(stored);
    } catch (e) {
      console.warn('Gagal membaca storage ' + this.key + ': ' + e.message);
      return null;
    }
  };

  Storage.prototype._setStorage = function(data) {
    try {
      localStorage.setItem(this.key, JSON.stringify(data));
      return true;
    } catch (e) {
      console.error('Gagal menyimpan data ' + this.key + ': ' + e.message);
      return false;
    }
  };

  Storage.prototype.getAll = function() {
    const data = this._getStorage();
    return data && Array.isArray(data) ? data : (this.defaultValue || []);
  };

  Storage.prototype.getById = function(id) {
    const all = this.getAll();
    return all.find(item => item.id === id) || null;
  };

  Storage.prototype.add = function(data) {
    const all = this.getAll();
    const newItem = {
      id: data.id,
      buildingId: data.buildingId || null,
      name: data.name || '',
      type: data.type || '',
      capacity: data.capacity || null,
      deskripsi: data.deskripsi || '',
      action: data.action || null,
      tanggal: data.tanggal || null,
      inventarisId: data.inventarisId || null,
      kondisi: data.kondisi || 'baik',
      status: data.status || 'belum',
      biaya: data.biaya || null,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };
    
    all.push(newItem);
    if (!this._setStorage(all)) {
      all.pop();
      return { success: false, errors: ['Gagal menyimpan data'] };
    }
    return { success: true };
  };

  Storage.prototype.update = function(id, data) {
    const all = this.getAll();
    const index = all.findIndex(item => item.id === id);
    if (index === -1) {
      return { success: false, errors: ['Data tidak ditemukan'] };
    }
    
    all[index] = {
      ...all[index],
      ...data,
      updatedAt: new Date().toISOString()
    };
    
    if (!this._setStorage(all)) {
      all[index] = all[index] || {};
      return { success: false, errors: ['Gagal menyimpan data'] };
    }
    return { success: true };
  };

  Storage.prototype.remove = function(id) {
    const all = this.getAll();
    const index = all.findIndex(item => item.id === id);
    if (index === -1) {
      return { success: false, errors: ['Data tidak ditemukan'] };
    }
    all.splice(index, 1);
    if (!this._setStorage(all)) {
      return { success: false, errors: ['Gagal menghapus data'] };
    }
    return { success: true };
  };

  Storage.prototype.canDelete = function(id, recordType) {
    const all = this.getAll();
    const item = all.find(i => i.id === id);
    if (!item) return { success: true };
    
    // Check if any inventory item references this
    const inventory = typeof InventoryStore !== 'undefined' ? InventoryStore.getAll() : [];
    if (Array.isArray(inventory)) {
      const refs = inventory.filter(inv => inv.ruangan === id || inv.ruanganId === id);
      if (refs.length > 0) {
        return { success: false, message: 'Data ini masih digunakan oleh ' + refs.length + ' item inventaris' };
      }
    }
    
    // Check if any maintenance item references this
    const maintenance = MasterStore.getMaintenance ? MasterStore.getMaintenance() : [];
    if (Array.isArray(maintenance)) {
      const refs = maintenance.filter(m => m.inventarisId === id);
      if (refs.length > 0) {
        return { success: false, message: 'Data ini masih digunakan oleh ' + refs.length + ' catatan pemeliharaan' };
      }
    }
    
    return { success: true };
  };

  // Duplicate validation with case-insensitive and whitespace normalization
  Storage.prototype.validateDuplicate = function(data, recordType, excludeId = null) {
    const all = this.getAll();
    const normalize = (val) => (val || '').toString().trim().toLowerCase();
    
    for (const item of all) {
      // Skip the item being edited
      if (excludeId && item.id === excludeId) continue;
      
      // Check code (id) match
      if (normalize(data.id) === normalize(item.id)) {
        return {
          success: false,
          errors: [`Kode ${recordType} sudah ada: ${item.id}`]
        };
      }
      
      // Check name match
      const dataName = normalize(data.name || '');
      const itemName = normalize(item.name || '');
      if (dataName && dataName === itemName) {
        return {
          success: false,
          errors: [`Nama ${recordType} sudah ada: ${item.name}`]
        };
      }
    }
    
    return { success: true };
  };

  // Public API
  const MasterStore = {
    BUILDING: new Storage(Entities.BUILDING, DEFAULT_DATA.buildings),
    ROOM: new Storage(Entities.ROOM, DEFAULT_DATA.rooms),
    CATEGORY: new Storage(Entities.CATEGORY, DEFAULT_DATA.categories),
    _maintenance: new Storage(Entities.MAINTENANCE, DEFAULT_DATA.maintenance),
    _users: new Storage(Entities.USER, DEFAULT_DATA.users),
    _kondisiInventaris: new Storage(Entities.KONDISI_INVEN, DEFAULT_DATA.kondisiInventaris),

    // Buildings
    getBuildings: () => MasterStore.BUILDING.getAll(),
    getBuildingById: id => MasterStore.BUILDING.getById(id),
    addBuilding: data => MasterStore.BUILDING.add(data),
    updateBuilding: (id, data) => MasterStore.BUILDING.update(id, data),
    deleteBuilding: (id) => {
      const building = MasterStore.BUILDING.getById(id);
      if (!building) return { success: false, errors: ['Gedung tidak ditemukan'] };
      const deleteCheck = MasterStore.BUILDING.canDelete(id, 'building');
      if (!deleteCheck.success) return { success: false, errors: [deleteCheck.message] };
      return MasterStore.BUILDING.remove(id);
    },

    // Labs
    LABORATORY: new Storage(Entities.LABORATORY, DEFAULT_DATA.laboratories),
    getLaboratories: () => MasterStore.LABORATORY.getAll(),
    getLaboratoryById: id => MasterStore.LABORATORY.getById(id),
    addLaboratory: data => MasterStore.LABORATORY.add(data),
    updateLaboratory: (id, data) => MasterStore.LABORATORY.update(id, data),
    deleteLaboratory: (id) => {
      const laboratory = MasterStore.LABORATORY.getById(id);
      if (!laboratory) return { success: false, errors: ['Laboratorium tidak ditemukan'] };
      return MasterStore.LABORATORY.remove(id);
    },

    // Rooms
    getRooms: () => MasterStore.ROOM.getAll(),
    getRoomById: id => MasterStore.ROOM.getById(id),
    addRoom: data => MasterStore.ROOM.add(data),
    updateRoom: (id, data) => MasterStore.ROOM.update(id, data),
    deleteRoom: (id) => {
      const room = MasterStore.ROOM.getById(id);
      if (!room) return { success: false, errors: ['Ruangan tidak ditemukan'] };
      const deleteCheck = MasterStore.ROOM.canDelete(id, 'room');
      if (!deleteCheck.success) return { success: false, errors: [deleteCheck.message] };
      return MasterStore.ROOM.remove(id);
    },

    // Categories
    getCategories: () => MasterStore.CATEGORY.getAll(),
    getCategoryById: id => MasterStore.CATEGORY.getById(id),
    addCategory: data => MasterStore.CATEGORY.add(data),
    updateCategory: (id, data) => MasterStore.CATEGORY.update(id, data),
    deleteCategory: (id) => {
      const category = MasterStore.CATEGORY.getById(id);
      if (!category) return { success: false, errors: ['Kategori tidak ditemukan'] };
      const deleteCheck = MasterStore.CATEGORY.canDelete(id, 'category');
      if (!deleteCheck.success) return { success: false, errors: [deleteCheck.message] };
      return MasterStore.CATEGORY.remove(id);
    },

    // Libraries (library rooms)
    getPerpustakaan: () => MasterStore.ROOM.getAll().filter(r => r.type === 'library'),
    getPerpustakaanById: id => MasterStore.ROOM.getById(id),
    addPerpustakaan: data => MasterStore.ROOM.add(data),
    updatePerpustakaan: (id, data) => MasterStore.ROOM.update(id, data),
    deletePerpustakaan: (id) => {
      const library = MasterStore.ROOM.getById(id);
      if (!library) return { success: false, errors: ['Perpustakaan tidak ditemukan'] };
      return MasterStore.ROOM.remove(id);
    },

    // Maintenance
    getMaintenance: () => MasterStore._maintenance.getAll(),
    getMaintenanceById: id => MasterStore._maintenance.getById(id),
    addMaintenance: data => MasterStore._maintenance.add(data),
    updateMaintenance: (id, data) => MasterStore._maintenance.update(id, data),
    deleteMaintenance: (id) => {
      const maintenance = MasterStore._maintenance.getById(id);
      if (!maintenance) return { success: false, errors: ['Pemeliharaan tidak ditemukan'] };
      return MasterStore._maintenance.remove(id);
    },

    // Users
    getUsers: () => MasterStore._users.getAll(),
    getUserById: id => MasterStore._users.getById(id),
    addUser: data => MasterStore._users.add(data),
    updateUser: (id, data) => MasterStore._users.update(id, data),
    deleteUser: (id) => {
      const user = MasterStore._users.getById(id);
      if (!user) return { success: false, errors: ['Pengguna tidak ditemukan'] };
      return MasterStore._users.remove(id);
    },

    // Kondisi Inventaris
    getKondisiInventaris: () => MasterStore._kondisiInventaris.getAll(),
    getKondisiInventarisById: id => MasterStore._kondisiInventaris.getById(id),
    addKondisiInventaris: data => MasterStore._kondisiInventaris.add(data),
    updateKondisiInventaris: (id, data) => MasterStore._kondisiInventaris.update(id, data),
    deleteKondisiInventaris: (id) => {
      const kondisi = MasterStore._kondisiInventaris.getById(id);
      if (!kondisi) return { success: false, errors: ['Kondisi inventaris tidak ditemukan'] };
      return MasterStore._kondisiInventaris.remove(id);
    },

    // List all entities
    getAll: () => ({
      buildings: MasterStore.BUILDING.getAll(),
      rooms: MasterStore.ROOM.getAll(),
      categories: MasterStore.CATEGORY.getAll(),
      maintenance: MasterStore._maintenance.getAll(),
      users: MasterStore._users.getAll(),
      kondisiInventaris: MasterStore._kondisiInventaris.getAll()
    })
  };

  // Export to global scope
  if (typeof globalThis !== 'undefined') {
    globalThis.MasterStore = MasterStore;
  }
})(typeof globalThis !== 'undefined' ? globalThis : this);
