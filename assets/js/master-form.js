/**
 * SIMSARPRAS EDU - Master Data Integration for Inventory Form
 * Milestone 3
 * 
 * Loads dynamic options for gedung, ruangan, and kategori dropdowns
 * from local storage into the inventory form.
 */

(function(global) {
  'use strict';

  // Wait for DOM ready
  function initMasterForm() {
    if (typeof MasterStore === 'undefined') {
      console.error('MasterStore tidak ditemukan. Pastikan storage.js dimuat terlebih dahulu.');
      return;
    }

    // Wait for form to be ready
    const form = document.getElementById('inventory-form');
    if (!form) {
      console.log('Inventory form not found yet. Will try again...');
      setTimeout(initMasterForm, 100);
      return;
    }

    loadGedungOptions();
    loadRuanganOptions();
    loadKategoriOptions();

    // Sync location field when gedung/ruangan changes
    const gedungSelect = document.getElementById('f-gedung');
    const ruanganSelect = document.getElementById('f-ruangan');
    const lokasiInput = document.getElementById('f-lokasi');

    if (gedungSelect) {
      gedungSelect.addEventListener('change', function() {
        const gedung = this.value;
        const ruangan = ruanganSelect ? ruanganSelect.value : '';
        if (lokasiInput && gedung && ruangan) {
          lokasiInput.value = `${gedung} - ${ruangan}`;
        } else if (lokasiInput && gedung) {
          lokasiInput.value = gedung;
        }
      });

      if (ruanganSelect) {
        ruanganSelect.addEventListener('change', function() {
          const gedung = gedungSelect ? gedungSelect.value : '';
          if (lokasiInput && gedung && this.value) {
            lokasiInput.value = `${gedung} - ${this.value}`;
          } else if (lokasiInput && this.value) {
            lokasiInput.value = this.value;
          }
        });
      }
    }

    console.log('Master data integration ready');
  }

  // Load gedung options into the inventory form
  function loadGedungOptions() {
    const select = document.getElementById('f-gedung');
    if (!select) return;

    // Load fresh data
    const buildings = MasterStore.getBuildings();

    // Clear existing options (keep the label)
    const currentValue = select.value;
    select.innerHTML = '<option value="">Pilih gedung</option>';

    buildings.forEach(building => {
      const option = document.createElement('option');
      option.value = building.id;
      option.textContent = building.name || `Gedung ${building.id}`;
      select.appendChild(option);
    });

    // Restore selection
    select.value = currentValue;
  }

  // Load ruangan options into the inventory form
  function loadRuanganOptions() {
    const select = document.getElementById('f-ruangan');
    if (!select) return;

    const buildings = MasterStore.getBuildings();
    const rooms = MasterStore.getRooms();

    // Build a map of room names by building
    const roomNamesByBuilding = {};
    if (buildings && typeof buildings.find === 'function') {
      buildings.forEach(building => {
        roomNamesByBuilding[building.id] = [];
      });
    }

    rooms.forEach(room => {
      const buildingId = room.buildingId;
      if (roomNamesByBuilding[buildingId] !== undefined) {
        roomNamesByBuilding[buildingId].push(room.name);
      }
    });

    // Clear existing options
    const currentValue = select.value;
    const currentBuilding = select.dataset.building;
    select.innerHTML = '<option value="">Pilih ruangan</option>';

    // Add options for buildings that exist
    buildings.forEach(building => {
      const roomsForBuilding = roomNamesByBuilding[building.id] || [];
      roomsForBuilding.forEach(roomName => {
        const option = document.createElement('option');
        option.value = roomName;
        option.textContent = `${roomName} (${building.name || building.id})`;
        select.appendChild(option);
      });
    });

    // Restore selection
    select.value = currentValue;
    if (select.dataset.building) {
      select.dataset.building = currentBuilding;
    }
  }

  // Load kategori options into the inventory form
  function loadKategoriOptions() {
    const select = document.getElementById('f-kategori');
    if (!select) return;

    const categories = MasterStore.getCategories();

    // Clear existing options (keep the label)
    const currentValue = select.value;
    select.innerHTML = '<option value="">Pilih kategori</option>';

    categories.forEach(category => {
      const option = document.createElement('option');
      option.value = category.name;
      option.textContent = category.name;
      select.appendChild(option);
    });

    // Restore selection
    select.value = currentValue;
  }

  // Initial sync on page load
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initMasterForm);
  } else {
    initMasterForm();
  }

  // Re-sync when a modal opens or data changes
  global.MasterFormSync = {
    loadGedungOptions,
    loadRuanganOptions,
    loadKategoriOptions,
    syncAll: () => {
      loadGedungOptions();
      loadRuanganOptions();
      loadKategoriOptions();
    }
  };
})(typeof globalThis !== 'undefined' ? globalThis : this);
