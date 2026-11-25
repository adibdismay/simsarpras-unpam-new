/**
 * SIMSARPRAS UNPAM — Sidebar Mobile Toggle
 * Common script for all pages that have the sidebar markup.
 * Initializes the mobile sidebar with open/close functionality,
 * overlay click, outside-click, escape key, and focus management.
 */

(function () {
  "use strict";

  // Get sidebar elements
  const sidebar = document.getElementById("app-sidebar");
  const shell = document.getElementById("app-shell");
  const openButton = document.getElementById("menu-open");
  const closeButton = document.getElementById("menu-close");
  const overlay = document.getElementById("sidebar-overlay");

  if (!sidebar || !shell || !openButton || !closeButton || !overlay) return;

  const mobile = window.matchMedia("(max-width: 1023px)");
  const initialOverflow = document.body.style.overflow;
  let menuIsOpen = false;

  function setMenu(nextOpen, restoreFocus = false) {
    menuIsOpen = mobile.matches && nextOpen;
    sidebar.inert = mobile.matches && !menuIsOpen;
    sidebar.dataset.open = String(menuIsOpen);
    overlay.dataset.open = String(menuIsOpen);
    openButton.setAttribute("aria-expanded", String(menuIsOpen));
    document.body.style.overflow = menuIsOpen ? "hidden" : initialOverflow;

    if (menuIsOpen) {
      closeButton.focus();
      shell.inert = true;
    } else {
      shell.inert = false;
      if (restoreFocus && mobile.matches) openButton.focus();
    }
  }

  // Open button click
  openButton.addEventListener("click", () => setMenu(!menuIsOpen));

  // Close button click
  closeButton.addEventListener("click", () => setMenu(false, true));

  // Overlay click
  overlay.addEventListener("click", () => setMenu(false, true));

  // Mobile breakpoint change
  mobile.addEventListener("change", () => {
    const focusWasInSidebar = sidebar.contains(document.activeElement);
    setMenu(false);
    if (mobile.matches && focusWasInSidebar) {
      openButton.focus();
    } else if (!mobile.matches && (document.activeElement === openButton || document.activeElement === closeButton)) {
      sidebar.querySelector('[aria-current="page"]')?.focus();
    }
  });

  // Sidebar navigation click
  sidebar.addEventListener("click", (event) => {
    const link = event.target.closest("a");
    if (!link) return;
    if (link.getAttribute("aria-disabled") === "true") {
      event.preventDefault();
      return;
    }
    // Close sidebar on mobile after clicking a link
    if (mobile.matches) setMenu(false);
    // Handle dashboard hash navigation
    if (link.getAttribute("href") === "#dashboard") {
      event.preventDefault();
      const main = document.getElementById("dashboard");
      if (main) {
        main.focus({ preventScroll: true });
        window.scrollTo({ top: 0 });
      }
    }
  });

  // Escape key
  document.addEventListener("keydown", (event) => {
    if (event.key === "Escape") {
      if (menuIsOpen) {
        event.preventDefault();
        setMenu(false, true);
      }
      return;
    }
    if (event.key !== "Tab" || !menuIsOpen) return;
    const focusable = Array.from(
      sidebar.querySelectorAll('a[href], button:not([disabled]), [tabindex="0"]')
    ).filter((element) => element.getClientRects().length > 0);
    if (focusable.length === 0) return;
    const first = focusable[0];
    const last = focusable[focusable.length - 1];
    if (event.shiftKey && document.activeElement === first) {
      event.preventDefault();
      last.focus();
    } else if (!event.shiftKey && document.activeElement === last) {
      event.preventDefault();
      first.focus();
    }
  });

  // Outside-click: close sidebar on mobile when clicking outside the sidebar
  document.addEventListener("click", (event) => {
    if (mobile.matches && menuIsOpen && !sidebar.contains(event.target) && !openButton.contains(event.target)) {
      setMenu(false);
    }
  });

  // Initialize on page load
  setMenu(false);
})();
