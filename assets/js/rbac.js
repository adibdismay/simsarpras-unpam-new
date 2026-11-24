/* ============================================================
   SIMSARPRAS UNPAM — RBAC shim (client-side enforcement)
   Provides:
     - Auth.isAdmin()
     - Auth.isMahasiswa()
     - Auth.canManageData()
     - Auth.canManageUsers()
     - Auth.canManageSettings()
     - Auth.protectPage(redirectToLogin?)
     - Auth.redirectIfAuthenticated()
     - Auth.getRole()
     - Auth.getUserId()
     - Auth.getUsername()
     - Auth.signIn()
     - Auth.signOut()
     - Auth.invalidateSession()
     - Auth.isAuthenticated()
     - Auth.SESSION_EXPIRY
     - Auth.SESSION_KEY
     - Auth.LOGIN_PAGE
     - Auth.ADMIN_DASHBOARD
     - Auth.MAHASISWA_DASHBOARD
     - Auth.CAN_MANAGE_DATA (read-only alias)
     - Auth.CAN_MANAGE_USERS (read-only alias)
     - Auth.CAN_MANAGE_SETTINGS (read-only alias)
     - Auth.CAN_ACCESS_ADMIN (read-only alias)
     - Auth.canAccess(role, allowedRoles)
   ============================================================ */
(function () {
  "use strict";

  var SESSION_KEY = "simsarpras.session.v1";
  var LOGIN_PAGE = "login.html";
  var ADMIN_DASHBOARD = "layout.html";
  var MAHASISWA_DASHBOARD = "mahasiswa.html";
  var SESSION_EXPIRY = 8 * 60 * 60 * 1000; // 8 jam

  /* sessionStorage tidak dapat diakses. */
  function storageUnavailable() {
    try {
      window.sessionStorage.getItem(SESSION_KEY);
      return false;
    } catch (err) {
      return true;
    }
  }

  /* Parse session dari sessionStorage. */
  function getSession() {
    try {
      var data = window.sessionStorage.getItem(SESSION_KEY);
      return data ? JSON.parse(data) : null;
    } catch (err) {
      return null;
    }
  }

  function isAuthenticated() {
    try {
      var session = getSession();
      if (!session) return false;
      if (session.expiresAt && Date.now() > session.expiresAt) {
        signOut();
        return false;
      }
      return true;
    } catch (err) {
      return false;
    }
  }

  function getRole() {
    var session = getSession();
    return session ? session.role : null;
  }

  function getUserId() {
    var session = getSession();
    return session ? session.userId : null;
  }

  function getUsername() {
    var session = getSession();
    return session ? session.username : null;
  }

  function getDisplayName() {
    var session = getSession();
    return session ? session.displayName : null;
  }

  /* Sign in with full user context. */
  function signIn(userId, username, role, displayName) {
    try {
      var session = {
        userId: userId,
        username: username,
        role: role,
        displayName: displayName,
        loggedAt: Date.now(),
        expiresAt: Date.now() + SESSION_EXPIRY
      };
      window.sessionStorage.setItem(SESSION_KEY, JSON.stringify(session));
      return true;
    } catch (err) {
      return false;
    }
  }

  /* Sign out: clear session. */
  function signOut() {
    try {
      window.sessionStorage.removeItem(SESSION_KEY);
    } catch (err) {}
  }

  /* Invalidate session (same as signOut). */
  function invalidateSession() {
    try {
      window.sessionStorage.removeItem(SESSION_KEY);
    } catch (err) {}
  }

  /* Show storage error message. */
  function showStorageError() {
    function render() {
      if (!document.body) {
        document.addEventListener("DOMContentLoaded", render);
        return;
      }
      document.body.innerHTML =
        '<main style="min-height:100vh;display:flex;align-items:center;justify-content:center;padding:24px;background:#F7F8FA;font-family:\'Plus Jakarta Sans\',Arial,sans-serif;color:#111827;">' +
        '<div style="max-width:420px;width:100%;background:#fff;border:1px solid #e5e7eb;border-radius:12px;padding:32px;text-align:center;">' +
        '<h1 style="font-size:18px;margin:0 0 8px;font-weight:700;">Sesi tidak dapat dimuat</h1>' +
        '<p style="font-size:14px;color:#6b7280;margin:0 0 20px;line-height:20px;">Penyimpanan sesi peramban (sessionStorage) tidak tersedia atau diblokir. Aktifkan sessionStorage, lalu muat ulang halaman.</p>' +
        '<a href="' + LOGIN_PAGE + '" style="display:inline-block;padding:10px 16px;border-radius:8px;background:#2563eb;color:#fff;text-decoration:none;font-weight:600;font-size:14px;">Muat ulang</a>' +
        '</div></main>';
    }
    render();
  }

  /* Protect page: redirect to login if not authenticated.
   * @param {boolean} redirectToLogin - default true.
   */
  /* Halaman terlindungi: tanpa sesi, arahkan ke login (location.replace).
     Jika sessionStorage gagal, tampilkan pesan (tanpa loop redirect).
     allowedRole opsional: jika provided, hanya role yang cocok yang boleh mengakses. */
  function protectPage(redirectToLogin, allowedRole) {
    if (redirectToLogin === undefined) redirectToLogin = true;
    if (storageUnavailable()) {
      showStorageError();
      return;
    }
    console.log('DEBUG Auth.protectPage called, session:', isAuthenticated(), 'role:', getRole(), 'allowedRole:', allowedRole);
    if (!isAuthenticated()) {
      if (redirectToLogin) {
        window.location.replace(LOGIN_PAGE);
      }
      return;
    }
    // Cek role bila allowedRole diberikan
    if (allowedRole !== undefined && allowedRole !== null) {
      var userRole = getRole();
      console.log('DEBUG protectPage role check: userRole:', userRole, 'allowedRole:', allowedRole, 'match:', userRole === allowedRole);
      if (userRole !== allowedRole) {
        if (redirectToLogin) {
          window.location.replace(LOGIN_PAGE);
        }
        return;
      }
    }
    // Revalidate on browser Back cache recovery.
    window.addEventListener("pageshow", function (event) {
      if (!event.persisted) return;
      if (storageUnavailable()) {
        showStorageError();
      } else if (!isAuthenticated()) {
        window.location.replace(LOGIN_PAGE);
      }
    });
  }

  /* Redirect authenticated users to the correct dashboard. */
  function redirectIfAuthenticated() {
    if (storageUnavailable()) return;
    if (!isAuthenticated()) return;
    var role = getRole();
    if (role === "admin") {
      window.location.replace(ADMIN_DASHBOARD);
    } else if (role === "mahasiswa") {
      window.location.replace(MAHASISWA_DASHBOARD);
    } else {
      window.location.replace(LOGIN_PAGE);
    }
  }

  /* --- RBAC enforcement helpers --- */

  /* Check if current user is admin. */
  function isAdmin() {
    return getRole() === "admin";
  }

  /* Check if current user is mahasiswa. */
  function isMahasiswa() {
    return getRole() === "mahasiswa";
  }

  /* Check if user can manage data (admin only). */
  function canManageData() {
    return isAdmin();
  }

  /* Alias for canManageData. */
  function canManageDataAlias() {
    return canManageData();
  }

  /* Check if user can manage users (admin only). */
  function canManageUsers() {
    return isAdmin();
  }

  /* Alias for canManageUsers. */
  function canManageUsersAlias() {
    return canManageUsers();
  }

  /* Check if user can manage settings (admin only). */
  function canManageSettings() {
    return isAdmin();
  }

  /* Alias for canManageSettings. */
  function canManageSettingsAlias() {
    return canManageSettings();
  }

  /* Check if user can access admin pages (admin only). */
  function canAccessAdmin() {
    return isAdmin();
  }

  /* Alias for canAccessAdmin. */
  function canAccessAdminAlias() {
    return canAccessAdmin();
  }

  /* Generic role access check. */
  function canAccess(userRole, allowedRoles) {
    if (typeof allowedRoles === "string") {
      allowedRoles = [allowedRoles];
    }
    return allowedRoles.indexOf(userRole) !== -1;
  }

  /* --- Override browser history to prevent access after logout. --- */

  var originalPushState = history.pushState;
  var originalReplaceState = history.replaceState;
  var isAfterLogout = false;

  window.pushState = function () {
    if (isAfterLogout) {
      window.location.replace(LOGIN_PAGE);
      return;
    }
    return originalPushState.apply(this, arguments);
  };

  window.replaceState = function () {
    if (isAfterLogout) {
      window.location.replace(LOGIN_PAGE);
      return;
    }
    return originalReplaceState.apply(this, arguments);
  };

  window.addEventListener("popstate", function (event) {
    if (isAfterLogout) {
      window.location.replace(LOGIN_PAGE);
      return;
    }
    if (isAuthenticated()) {
      var role = getRole();
      if (role === "admin") {
        window.location.replace(ADMIN_DASHBOARD);
      } else if (role === "mahasiswa") {
        window.location.replace(MAHASISWA_DASHBOARD);
      }
    }
  });

  /* Attach global logout handler (optional; can be overridden per page). */
  // This is handled per-page via the logout event delegation.

  window.Auth = {
    SESSION_KEY: SESSION_KEY,
    LOGIN_PAGE: LOGIN_PAGE,
    ADMIN_DASHBOARD: ADMIN_DASHBOARD,
    MAHASISWA_DASHBOARD: MAHASISWA_DASHBOARD,
    SESSION_EXPIRY: SESSION_EXPIRY,
    getSession: getSession,
    isAuthenticated: isAuthenticated,
    getRole: getRole,
    getUserId: getUserId,
    getUsername: getUsername,
    getDisplayName: getDisplayName,
    signIn: signIn,
    signOut: signOut,
    invalidateSession: invalidateSession,
    storageUnavailable: storageUnavailable,
    protectPage: protectPage,
    redirectIfAuthenticated: redirectIfAuthenticated,
    isAdmin: isAdmin,
    isMahasiswa: isMahasiswa,
    canManageData: canManageData,
    canManageDataAlias: canManageDataAlias,
    canManageUsers: canManageUsers,
    canManageUsersAlias: canManageUsersAlias,
    canManageSettings: canManageSettings,
    canManageSettingsAlias: canManageSettingsAlias,
    canAccessAdmin: canAccessAdmin,
    canAccessAdminAlias: canAccessAdminAlias,
    canAccess: canAccess
  };

  // Expose to global for backward compatibility
  if (typeof window !== "undefined") {
    window.Auth = window.Auth || {};
    Object.assign(window.Auth, {
      SESSION_KEY: SESSION_KEY,
      LOGIN_PAGE: LOGIN_PAGE,
      ADMIN_DASHBOARD: ADMIN_DASHBOARD,
      MAHASISWA_DASHBOARD: MAHASISWA_DASHBOARD,
      SESSION_EXPIRY: SESSION_EXPIRY,
      getSession: getSession,
      isAuthenticated: isAuthenticated,
      getRole: getRole,
      getUserId: getUserId,
      getUsername: getUsername,
      getDisplayName: getDisplayName,
      signIn: signIn,
      signOut: signOut,
      invalidateSession: invalidateSession,
      storageUnavailable: storageUnavailable,
      protectPage: protectPage,
      redirectIfAuthenticated: redirectIfAuthenticated,
      isAdmin: isAdmin,
      isMahasiswa: isMahasiswa,
      canManageData: canManageData,
      canManageDataAlias: canManageDataAlias,
      canManageUsers: canManageUsers,
      canManageUsersAlias: canManageUsersAlias,
      canManageSettings: canManageSettings,
      canManageSettingsAlias: canManageSettingsAlias,
      canAccessAdmin: canAccessAdmin,
      canAccessAdminAlias: canAccessAdminAlias,
      canAccess: canAccess
    });
  }
})();
