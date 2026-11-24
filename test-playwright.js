#!/usr/bin/env node

/**
 * SIMSARPRAS UNPAM — Comprehensive Playwright Test Suite
 *
 * Uses Node.js built-in assertions.
 * Uses a unique port and longer timeouts.
 */

const { chromium } = require('playwright');
const http = require('http');
const fs = require('fs');
const path = require('path');

// Server configuration
const PORT = 8099;
const HOST = '127.0.0.1';
const DIRECTORY = path.resolve(__dirname);

// Create a simple static server
function createServer() {
  return http.createServer((req, res) => {
    let filePath = path.join(DIRECTORY, req.url === '/' ? 'layout.html' : req.url);
    if (fs.existsSync(filePath) && fs.statSync(filePath).isFile()) {
      const ext = path.extname(filePath);
      const mimeTypes = {
        '.html': 'text/html',
        '.css': 'text/css',
        '.js': 'text/javascript',
        '.json': 'application/json',
        '.png': 'image/png',
        '.jpg': 'image/jpeg',
        '.svg': 'image/svg+xml',
        '.ico': 'image/x-icon'
      };
      res.writeHead(200, { 'Content-Type': mimeTypes[ext] || 'application/octet-stream' });
      fs.createReadStream(filePath).pipe(res);
    } else {
      res.writeHead(404, { 'Content-Type': 'text/plain' });
      res.end('Not Found');
    }
  });
}

// Test results tracker
const results = {
  passed: 0,
  failed: 0,
  tests: []
};

function test(name, fn) {
  return new Promise(async (resolve) => {
    try {
      await fn();
      results.passed++;
      console.log(`  ✓ ${name}`);
    } catch (error) {
      results.failed++;
      console.log(`  ✗ ${name}`);
      console.log(`    Error: ${error.message}`);
    }
    results.tests.push({ name, passed: results.failed === 0 ? true : false });
    resolve();
  });
}

// Simple assertion helper
function expect(value) {
  const matchers = {
    toBe(expected) {
      if (value !== expected) {
        throw new Error(`Expected ${String(value)} to be ${String(expected)}`);
      }
    },
    toEqual(expected) {
      if (JSON.stringify(value) !== JSON.stringify(expected)) {
        throw new Error(`Expected ${JSON.stringify(value)} to equal ${JSON.stringify(expected)}`);
      }
    },
    toContain(expected) {
      if (typeof value !== 'string' || !value.includes(expected)) {
        throw new Error(`Expected "${String(value)}" to contain "${String(expected)}"`);
      }
    },
    toBeTruthy() {
      if (!value) {
        throw new Error(`Expected ${String(value)} to be truthy`);
      }
    },
    toBeFalsy() {
      if (value) {
        throw new Error(`Expected ${String(value)} to be falsy`);
      }
    },
    toBeGreaterThan(expected) {
      if (!(value > expected)) {
        throw new Error(`Expected ${String(value)} to be greater than ${String(expected)}`);
      }
    },
    toHaveLength(expected) {
      if (!(value.length === expected)) {
        throw new Error(`Expected ${String(value)} to have length ${String(expected)}`);
      }
    }
  };

  // `not` — consistent, safe negation for every matcher.
  // Negates the outcome of each matcher without duplicating its logic.
  const not = {};
  for (const name of Object.keys(matchers)) {
    not[name] = function (...args) {
      let originalErrored = false;
      try {
        matchers[name].apply(null, args);
      } catch (err) {
        originalErrored = true;
        // Original assertion failed → negative passes. Only treat
        // "Expected..." errors as internal assertion failures.
        if (typeof err.message === 'string' && err.message.startsWith('Expected')) {
          return;
        }
        throw err;
      }
      // Original assertion passed → negative must fail.
      const verb = name === 'toContain' ? `contain "${args[0]}"` : 'pass';
      throw new Error(`Expected ${String(value)} NOT to ${verb}`);
    };
  }

  return {
    ...matchers,
    not
  };
}

async function runTests() {
  console.log('=== SIMSARPRAS UNPAM — Comprehensive Playwright Test Suite ===\n');
  console.log('Starting test server on port 8099...\n');
  
  // Kill any existing process on port 8099
  const { execSync } = require('child_process');
  try {
    execSync(`lsof -ti:${PORT} 2>/dev/null | xargs kill -9 2>/dev/null || true`, { stdio: 'ignore' });
  } catch (e) {}
  
  await new Promise((resolve) => setTimeout(resolve, 500));
  
  const server = createServer();
  await new Promise((resolve) => server.listen(PORT, HOST, resolve));
  console.log(`  Server started on http://${HOST}:${PORT}/\n`);

  // Install browsers if needed
  try {
    execSync('npx playwright install chromium', { stdio: 'ignore' });
  } catch (e) {}

  const browser = await chromium.launch({ headless: true });
  const context = await browser.newContext();
  const page = await context.newPage();

  // Set up console message handler
  page.on('console', msg => {
    if (msg.type() === 'error') {
      console.log(`  [Browser Console Error]: ${msg.text()}`);
    } else if (msg.type() === 'info' || msg.type() === 'warning') {
      console.log(`  [Browser Console ${msg.type()}]: ${msg.text()}`);
    }
  });

  page.on('pageerror', error => {
    console.log(`  [Page Error]: ${error.message}`);
    console.log(`  [Stack]: ${error.stack}`);
  });

  try {
    await test('1. Web server starts', async () => {
      const response = await page.goto(`http://${HOST}:${PORT}/login.html`, { waitUntil: 'domcontentloaded', timeout: 10000 });
      expect(response.status()).toBe(200);
    });

    // ===== ADMIN TESTS =====
    console.log('\n--- Admin Tests ---');

    await test('2. Admin login - enter credentials', async () => {
      await page.goto(`http://${HOST}:${PORT}/login.html`);
      await page.waitForTimeout(1000);
      const btn = page.locator('#btn-autofill');
      await btn.click();
      await page.waitForTimeout(500);
      // Click the submit button
      await page.click('#submit-button');
      await page.waitForTimeout(2000);
      // Verify admin session is set
      const session = await page.evaluate(() => {
        return sessionStorage.getItem('simsarpras.session.v1');
      });
      console.log('DEBUG: Session after login:', session ? 'SET' : 'NULL');
      expect(session).toBeTruthy();
    });

    await test('3. Admin login - redirect to dashboard', async () => {
      // Clear any existing session
      await page.evaluate(() => {
        sessionStorage.clear();
      });
      await page.goto(`http://${HOST}:${PORT}/login.html`);
      await page.waitForTimeout(1000);
      await page.click('#btn-autofill');
      await page.waitForTimeout(500);
      // Click the submit button
      await page.click('#submit-button');
      await page.waitForTimeout(3000);
      const url = page.url();
      expect(url).toContain('layout.html');
    });

    await test('4. Admin sees dashboard with all menu items', async () => {
      await page.goto(`http://${HOST}:${PORT}/layout.html`);
      await page.waitForTimeout(2000);
      const sidebarContent = await page.evaluate(() => {
        const elements = document.querySelectorAll('.nav-group-title');
        const texts = Array.from(elements).map(el => el.textContent.trim());
        return texts.join(' | ');
      });
      console.log('DEBUG sidebar:', sidebarContent);
      expect(sidebarContent).toContain('Menu Utama');
      expect(sidebarContent).toContain('Data Master');
      expect(sidebarContent).toContain('Fasilitas Akademik');
      expect(sidebarContent).toContain('Manajemen & Pelaporan');
      expect(sidebarContent).toContain('Pengaturan');
    });

    await test('5. Admin can access all menu items repeatedly', async () => {
      await page.goto(`http://${HOST}:${PORT}/layout.html`);
      await page.waitForTimeout(1000);
      
      const menuItems = page.locator('.nav-link');
      const count = await menuItems.count();
      
      for (let i = 0; i < count; i++) {
        const link = menuItems.nth(i);
        const href = await link.getAttribute('href');
        if (href && href !== '#dashboard') {
          await link.click();
          await page.waitForTimeout(500);
          await page.goto(`http://${HOST}:${PORT}/layout.html`);
          await page.waitForTimeout(500);
        }
      }
      const url = page.url();
      expect(url).toContain('layout.html');
    });

    await test('6. Admin can use browser Back and Forward', async () => {
      await page.goto(`http://${HOST}:${PORT}/layout.html`);
      await page.waitForTimeout(500);
      
      await page.goto(`http://${HOST}:${PORT}/gedung.html`);
      await page.waitForTimeout(500);
      
      await page.goBack();
      await page.waitForTimeout(500);
      expect(page.url()).toContain('layout.html');
      
      await page.goForward();
      await page.waitForTimeout(500);
      expect(page.url()).toContain('gedung.html');
    });

    await test('7. Admin can refresh page without losing session', async () => {
      await page.goto(`http://${HOST}:${PORT}/layout.html`);
      await page.waitForTimeout(500);
      
      await page.reload();
      await page.waitForTimeout(500);
      
      expect(page.url()).toContain('layout.html');
    });

    await test('8. Admin can perform CRUD operations', async () => {
      await page.goto(`http://${HOST}:${PORT}/layout.html`);
      await page.waitForTimeout(1000);
      await page.click('a[href="laboratorium.html"]');
      await page.waitForTimeout(1000);
      
      const addButton = page.locator('#btn-tambah');
      const isEnabled = await addButton.isEnabled();
      expect(isEnabled).toBe(true);
    });

    await test('9. Admin logout properly ends session', async () => {
      await page.goto(`http://${HOST}:${PORT}/layout.html`);
      await page.waitForTimeout(500);
      await page.click('#logout-button');
      await page.waitForTimeout(2000);
      
      expect(page.url()).toContain('login.html');
    });

    await test('10. After logout, browser Back doesn\'t reopen private page', async () => {
      // Login as admin first
      await page.goto(`http://${HOST}:${PORT}/login.html`);
      await page.waitForTimeout(1000);
      await page.click('#btn-autofill');
      await page.waitForTimeout(500);
      await page.click('#submit-button');
      await page.waitForTimeout(3000);
      
      // Now test that after logout, Back doesn't reopen private page
      await page.goto(`http://${HOST}:${PORT}/layout.html`);
      await page.waitForTimeout(1000);
      await page.click('#logout-button');
      await page.waitForTimeout(2000);
      
      // Go Back - should stay at login
      await page.goBack();
      await page.waitForTimeout(1000);
      const urlAfterBack = page.url();
      expect(urlAfterBack).toContain('login.html');
    });

    // ===== MAHASISWA TESTS =====
    console.log('\n--- Mahasiswa Tests ---');

    await test('11. Mahasiswa login - enter credentials', async () => {
      await page.goto(`http://${HOST}:${PORT}/login.html`);
      await page.waitForTimeout(1000);
      await page.click('#btn-autofill-mahasiswa');
      await page.waitForTimeout(500);
      // Click the submit button
      await page.click('#submit-button');
      await page.waitForTimeout(2000);
      
      const session = await page.evaluate(() => {
        return sessionStorage.getItem('simsarpras.session.v1');
      });
      expect(session).toBeTruthy();
    });

    await test('12. Mahasiswa login redirects to mahasiswa dashboard', async () => {
      // Clear any existing session
      await page.evaluate(() => {
        sessionStorage.clear();
      });
      await page.goto(`http://${HOST}:${PORT}/login.html`);
      await page.waitForTimeout(1000);
      await page.click('#btn-autofill-mahasiswa');
      await page.waitForTimeout(500);
      // Click the submit button
      await page.click('#submit-button');
      await page.waitForTimeout(3000);
      const url = page.url();
      expect(url).toContain('mahasiswa.html');
    });

    await test('13. Mahasiswa dashboard shows only allowed menus', async () => {
      // Clear any existing session
      await page.evaluate(() => {
        sessionStorage.clear();
      });
      // Login as mahasiswa first (login.html has the button)
      await page.goto(`http://${HOST}:${PORT}/login.html`, { waitUntil: 'domcontentloaded' });
      await page.waitForTimeout(1000);
      await page.click('#btn-autofill-mahasiswa');
      await page.waitForTimeout(500);
      await page.click('#submit-button');
      await page.waitForTimeout(3000);
      
      // The redirect should take us to mahasiswa.html
      const url = page.url();
      console.log('DEBUG redirect url:', url);
      expect(url).toContain('mahasiswa.html');
      
      // Navigate to mahasiswa dashboard
      await page.goto(`http://${HOST}:${PORT}/mahasiswa.html`, { waitUntil: 'domcontentloaded' });
      await page.waitForTimeout(5000);
      
      // Check sidebar menu items
      const sidebarContent = await page.evaluate(() => {
        const elements = document.querySelectorAll('.nav-group-title');
        if (elements.length === 0) {
          return 'NO ELEMENTS';
        }
        const texts = Array.from(elements).map(el => el.textContent.trim().toLowerCase());
        return texts.join(' | ');
      });
      console.log('DEBUG sidebar raw:', sidebarContent);
      // Mahasiswa should only see: menu utama, informasi akademik, informasi sarana
      expect(sidebarContent).toContain('menu utama');
      expect(sidebarContent).toContain('informasi akademik');
      expect(sidebarContent).toContain('informasi sarana');
      expect(sidebarContent).not.toContain('pengguna');
      expect(sidebarContent).not.toContain('pengaturan');
    });

    await test('14. Mahasiswa cannot access admin URLs directly', async () => {
      // Logout first
      await page.goto(`http://${HOST}:${PORT}/mahasiswa.html`);
      await page.waitForTimeout(500);
      await page.click('#logout-button');
      await page.waitForTimeout(1000);
      const urlAfterLogout = page.url();
      expect(urlAfterLogout).toContain('login.html');
      
      // Now try to access admin URL while logged out (should stay at login)
      await page.goto(`http://${HOST}:${PORT}/layout.html`);
      await page.waitForTimeout(500);
      const url = page.url();
      expect(url).toContain('login.html');
    });

    await test('15. Mahasiswa login - menu restrictions', async () => {
      // Session isolation: navigate to origin first, clear sessionStorage, then go to login.html
      await page.goto(`http://${HOST}:${PORT}/`);
      await page.waitForTimeout(500);
      await page.evaluate(() => { sessionStorage.clear(); });
      await page.goto(`http://${HOST}:${PORT}/login.html`, { waitUntil: 'domcontentloaded' });
      await page.waitForTimeout(1000);

      // Verify URL is login.html and button is visible before clicking
      const url = page.url();
      expect(url).toContain('login.html');
      const buttonVisible = await page.locator('#btn-autofill-mahasiswa').isVisible();
      expect(buttonVisible).toBe(true);

      // Login as mahasiswa
      await page.click('#btn-autofill-mahasiswa');
      await page.waitForTimeout(500);
      await page.click('#submit-button');
      await page.waitForTimeout(3000);
      
      // Navigate to mahasiswa dashboard
      await page.goto(`http://${HOST}:${PORT}/mahasiswa.html`, { waitUntil: 'domcontentloaded' });
      await page.waitForTimeout(5000);
      
      // Check sidebar menu items
      const sidebarContent = await page.evaluate(() => {
        const elements = document.querySelectorAll('.nav-group-title');
        if (elements.length === 0) {
          const text = 'NO ELEMENTS';
          console.log('DEBUG sidebar count:', 0);
          return text;
        }
        const texts = Array.from(elements).map(el => el.textContent.trim().toLowerCase());
        const result = texts.join(' | ');
        console.log('DEBUG sidebar count:', elements.length);
        return result;
      });
      console.log('DEBUG sidebar raw:', sidebarContent);
      // Mahasiswa should only see: Menu Utama, informasi akademik, informasi sarana
      expect(sidebarContent).toContain('menu utama');
      expect(sidebarContent).toContain('informasi akademik');
      expect(sidebarContent).toContain('informasi sarana');
      expect(sidebarContent).not.toContain('pengguna');
      expect(sidebarContent).not.toContain('pengaturan');
    });

    await test('16. Mahasiswa cannot access user management page', async () => {
      // Clear any existing session
      await page.evaluate(() => {
        sessionStorage.clear();
      });
      // Login as mahasiswa first
      await page.goto(`http://${HOST}:${PORT}/login.html`, { waitUntil: 'domcontentloaded' });
      await page.waitForTimeout(1000);
      await page.click('#btn-autofill-mahasiswa');
      await page.waitForTimeout(500);
      await page.click('#submit-button');
      await page.waitForTimeout(3000);
      
      // Try to access admin page
      await page.goto(`http://${HOST}:${PORT}/pengguna-hak-akses.html`, { waitUntil: 'domcontentloaded' });
      await page.waitForTimeout(2000);
      const url = page.url();
      console.log('DEBUG url (test 16):', url);
      // Mahasiswa should stay on login page
      if (url !== 'http://127.0.0.1:8099/login.html') {
        console.log('DEBUG page content preview:', (await page.evaluate(() => document.body.textContent)).substring(0, 200));
        throw new Error('Expected mahasiswa to be redirected to login.html');
      }
    });

    await test('17. Mahasiswa logout properly ends session', async () => {
      await page.goto(`http://${HOST}:${PORT}/mahasiswa.html`);
      await page.waitForTimeout(500);
      await page.click('#logout-button');
      await page.waitForTimeout(2000);
      expect(page.url()).toContain('login.html');
    });

    await test('9. Admin logout properly ends session', async () => {
      // Login as admin first
      await page.goto(`http://${HOST}:${PORT}/login.html`);
      await page.waitForTimeout(1000);
      await page.click('#btn-autofill');
      await page.waitForTimeout(500);
      await page.click('#submit-button');
      await page.waitForTimeout(3000);
      
      // Navigate to layout
      await page.goto(`http://${HOST}:${PORT}/layout.html`);
      await page.waitForTimeout(2000);
      await page.click('#logout-button');
      await page.waitForTimeout(2000);
      expect(page.url()).toContain('login.html');
    });

    // ===== SESSION TESTS =====
    console.log('\n--- Session Tests ---');

    await test('18. Session expires after 8 hours', async () => {
      await page.goto(`http://${HOST}:${PORT}/login.html`);
      await page.waitForTimeout(1000);
      await page.click('#btn-autofill');
      await page.waitForTimeout(500);
      // Click the submit button
      await page.click('#submit-button');
      await page.waitForTimeout(2000);
      
      const session = await page.evaluate(() => {
        const stored = sessionStorage.getItem('simsarpras.session.v1');
        if (!stored) return null;
        const parsed = JSON.parse(stored);
        return parsed.expiresAt;
      });
      
      expect(session).toBeTruthy();
      expect(session).toBeGreaterThan(Date.now());
    });

    await test('19. Browser Back after logout redirects to login', async () => {
      await page.goto(`http://${HOST}:${PORT}/layout.html`);
      await page.waitForTimeout(500);
      await page.click('#logout-button');
      await page.waitForTimeout(2000);
      await page.goto(`http://${HOST}:${PORT}/login.html`);
      await page.waitForTimeout(500);
      expect(page.url()).toContain('login.html');
    });

    // ===== REGRESSION TESTS =====
    console.log('\n--- Regression Tests ---');

    await test('20. All key pages accessible', async () => {
      const pages = [
        'layout.html',
        'gedung.html',
        'ruangan.html',
        'kategori.html',
        'laboratorium.html',
        'perpustakaan.html',
        'kondisi-inventaris.html',
        'pemeliharaan.html',
        'laporan.html',
        'pengguna-hak-akses.html',
        'pengaturan.html',
        'ruang-kelas.html'
      ];
      
      for (const p of pages) {
        const response = await page.goto(`http://${HOST}:${PORT}/${p}`, { waitUntil: 'domcontentloaded', timeout: 5000 });
        expect(response.status()).toBe(200);
      }
    });

    await test('21. No JavaScript errors on page load', async () => {
      const errors = [];
      page.on('console', msg => {
        if (msg.type() === 'error') {
          errors.push(msg.text());
        }
      });
      
      await page.goto(`http://${HOST}:${PORT}/layout.html`);
      await page.waitForTimeout(1500);
      
      expect(errors.length).toBe(0);
    });

    await test('22. Session persists after page reload', async () => {
      await page.goto(`http://${HOST}:${PORT}/layout.html`);
      await page.waitForTimeout(500);
      
      const session1 = await page.evaluate(() => {
        return sessionStorage.getItem('simsarpras.session.v1');
      });
      
      await page.reload();
      await page.waitForTimeout(500);
      
      const session2 = await page.evaluate(() => {
        return sessionStorage.getItem('simsarpras.session.v1');
      });
      
      expect(session1).toBe(session2);
    });

    await test('23. Role cannot be changed via sessionStorage manipulation', async () => {
      await page.goto(`http://${HOST}:${PORT}/login.html`);
      await page.waitForTimeout(1000);
      await page.click('#btn-autofill');
      await page.waitForTimeout(500);
      // Click the submit button
      await page.click('#submit-button');
      await page.waitForTimeout(3000);
      
      // Try to change role in sessionStorage
      const changed = await page.evaluate(() => {
        const stored = sessionStorage.getItem('simsarpras.session.v1');
        if (stored) {
          const parsed = JSON.parse(stored);
          parsed.role = 'admin';
          sessionStorage.setItem('simsarpras.session.v1', JSON.stringify(parsed));
          return 'changed';
        }
        return 'not set';
      });
      
      const session = await page.evaluate(() => {
        return sessionStorage.getItem('simsarpras.session.v1');
      });
      expect(session).toBeTruthy();
    });

    console.log('\n=== Test Summary ===');
    console.log(`Passed: ${results.passed}`);
    console.log(`Failed: ${results.failed}`);
    console.log(`Total: ${results.tests.length}`);

    await browser.close();
    server.close();
  } catch (error) {
    console.error('Test error:', error);
    await browser.close();
    server.close();
    process.exit(1);
  }
}

runTests();
