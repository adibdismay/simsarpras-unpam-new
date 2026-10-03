/**
 * SIMSARPRAS UNPAM - Profile Dropdown Module
 * Mengubah area profil header menjadi tombol interaktif dengan panel info akun demo.
 */
(function() {
  'use strict';

  function initProfile() {
    const oldProfileContainer = document.querySelector('header .header-actions > div:has(.header-profile-text)') || 
                                document.querySelector('header .header-actions .flex.items-center.gap-2:has(.header-profile-text)');
    if (!oldProfileContainer) return;

    const wrapper = document.createElement('div');
    wrapper.className = 'relative inline-block';

    const btn = document.createElement('button');
    btn.type = 'button';
    btn.className = 'flex items-center gap-2 p-1 rounded-lg hover:bg-surface-container transition-colors';
    btn.setAttribute('aria-label', 'Menu Profil');
    btn.setAttribute('aria-expanded', 'false');
    btn.setAttribute('aria-controls', 'profile-panel');
    btn.title = 'Profil Pengguna';

    const avatar = document.createElement('span');
    avatar.className = 'w-8 h-8 rounded-full bg-primary text-white flex items-center justify-center flex-shrink-0';
    avatar.setAttribute('aria-hidden', 'true');
    const personIcon = document.createElement('span');
    personIcon.className = 'material-symbols-outlined text-sm';
    personIcon.textContent = 'person';
    avatar.appendChild(personIcon);
    btn.appendChild(avatar);

    const textDiv = document.createElement('div');
    textDiv.className = 'header-profile-text text-label-sm text-left';
    
    const nameP = document.createElement('p');
    nameP.className = 'font-bold text-on-surface';
    nameP.textContent = 'Admin Sarpras';
    textDiv.appendChild(nameP);

    const subP = document.createElement('p');
    subP.className = 'text-on-surface-variant';
    subP.textContent = 'Universitas Pamulang - Viktor';
    textDiv.appendChild(subP);

    btn.appendChild(textDiv);

    const chevron = document.createElement('span');
    chevron.className = 'material-symbols-outlined text-outline header-profile-chevron';
    chevron.setAttribute('aria-hidden', 'true');
    chevron.textContent = 'expand_more';
    btn.appendChild(chevron);

    const panel = document.createElement('div');
    panel.id = 'profile-panel';
    panel.className = 'absolute right-0 mt-2 w-64 bg-white dark:bg-slate-900 border border-outline-variant rounded-xl shadow-xl z-50 p-4 hidden';
    panel.setAttribute('role', 'region');
    panel.setAttribute('aria-label', 'Panel Profil');

    const titleEl = document.createElement('p');
    titleEl.className = 'font-bold text-body-md text-on-surface';
    titleEl.textContent = 'Admin Sarpras';
    panel.appendChild(titleEl);

    const roleEl = document.createElement('p');
    roleEl.className = 'text-label-sm text-on-surface-variant mt-0.5';
    roleEl.textContent = 'Akun demo';
    panel.appendChild(roleEl);

    wrapper.appendChild(btn);
    wrapper.appendChild(panel);

    oldProfileContainer.replaceWith(wrapper);

    function setOpen(open) {
      panel.classList.toggle('hidden', !open);
      btn.setAttribute('aria-expanded', String(open));
      
      // Tutup panel notifikasi jika ada
      if (open) {
        const notifPanel = document.getElementById('notification-panel');
        if (notifPanel) notifPanel.classList.add('hidden');
        const notifBtn = document.querySelector('button[aria-controls="notification-panel"]');
        if (notifBtn) notifBtn.setAttribute('aria-expanded', 'false');
      }
    }

    btn.addEventListener('click', (e) => {
      e.stopPropagation();
      const isOpen = !panel.classList.contains('hidden');
      setOpen(!isOpen);
    });

    document.addEventListener('click', (e) => {
      if (!wrapper.contains(e.target)) {
        setOpen(false);
      }
    });

    document.addEventListener('keydown', (e) => {
      if (e.key === 'Escape' && !panel.classList.contains('hidden')) {
        setOpen(false);
        btn.focus();
      }
    });

    // Event listener untuk menutup profil jika panel notifikasi dibuka
    document.addEventListener('click', (e) => {
      const notifBtn = document.querySelector('button[aria-controls="notification-panel"]');
      if (notifBtn && notifBtn.contains(e.target)) {
        setOpen(false);
      }
    });
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initProfile);
  } else {
    initProfile();
  }
})();
