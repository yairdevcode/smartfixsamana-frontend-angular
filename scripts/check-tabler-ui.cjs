/* Isolated browser QA: every API request is intercepted. No backend data is read or written. */
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const puppeteer = require('puppeteer');
const base = process.argv[2] || 'http://localhost:4200';
assert(
  ['localhost', '127.0.0.1'].includes(new URL(base).hostname),
  'Use a local development URL.',
);
const out = path.join(require('node:os').tmpdir(), 'smartfix-tabler-review');
fs.mkdirSync(out, { recursive: true });
const customer = {
  id: 1,
  name: 'Cliente',
  lastname: 'de prueba',
  phone: '3000000000',
  email: 'prueba@example.com',
};
const phone = { id: 1, brand: 'Samsung', model: 'Galaxy A54' };
const part = {
  id: 1,
  name: 'Pantalla OLED',
  description: 'Repuesto de prueba',
  partTypeId: 1,
  partTypeName: 'Pantalla',
  phoneId: 1,
  phoneBrand: phone.brand,
  phoneModel: phone.model,
  quantity: 2,
  minStock: 3,
  purchasePrice: 80000,
  salePrice: 120000,
  isLowStock: true,
};
const partType = {
  id: 1,
  name: 'Pantalla',
  description: 'Módulos de pantalla',
};
const repair = {
  id: 1,
  customer,
  phone,
  fault: 'Pantalla sin imagen',
  state: 'Pendiente',
  date: '2026-06-01',
  laborCost: 40000,
};
let repairs = Array.from({ length: 12 }, (_, i) => ({
  ...repair,
  id: i + 1,
  state: ['Pendiente', 'En Proceso', 'Completado', 'Entregado'][i % 4],
}));
const external = {
  id: 1,
  clientName: 'Cliente de prueba',
  phoneBrand: 'Samsung A54',
  solution: 'Cambio de pantalla',
  repairPrice: 180000,
  partCost: 80000,
  status: 'REPARADO',
  date: '2026-06-01',
  netProfit: 100000,
  myShare: 140000,
  storeShare: 40000,
};
const settlement = {
  id: 1,
  startDate: '2026-06-01',
  endDate: '2026-06-07',
  totalRepairPrice: 180000,
  totalPartCost: 80000,
  totalMyShare: 140000,
  totalStoreShare: 40000,
  status: 'ABIERTA',
  repairCount: 1,
};
const movement = {
  id: 1,
  partCatalog: { ...part, phone },
  movementType: 'PURCHASE',
  quantity: 2,
  reason: 'Compra',
  notes: 'Prueba aislada',
  createdAt: '2026-06-01T10:00:00',
};
const daily = {
  date: '2026-06-01',
  ownRepairsTotal: 40000,
  externalRepairsMyShare: 60000,
  total: 100000,
  ownRepairsCount: 1,
  externalRepairsCount: 1,
};
let failRepairs = false,
  failDashboard = false,
  badLogin = false;
let repairParts = [];
const mutations = [],
  errors = [],
  requests = [],
  unknown = [];
let browser;
const paged = (content, url, size = 10) => {
  const page = +(url.searchParams.get('page') || 0);
  return {
    content: content.slice(page * size, (page + 1) * size),
    number: page,
    size,
    totalElements: content.length,
    totalPages: Math.ceil(content.length / size),
  };
};
(async () => {
  browser = await puppeteer.launch({
    headless: true,
    args: ['--no-sandbox', '--disable-dev-shm-usage'],
  });
  const page = await browser.newPage();
  page.setDefaultTimeout(12000);
  page.on('pageerror', (e) => errors.push(e.message));
  await page.setRequestInterception(true);
  page.on('request', async (req) => {
    const u = new URL(req.url());
    if (u.hostname !== 'localhost' || u.port !== '8080') return req.continue();
    const p = u.pathname,
      method = req.method();
    const headers = {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Headers': '*',
      'Access-Control-Allow-Methods': 'GET,POST,PUT,PATCH,DELETE,OPTIONS',
    };
    const respond = (body, status = 200) =>
      req.respond({
        status,
        headers,
        contentType: 'application/json',
        body: JSON.stringify(body),
      });
    if (method === 'OPTIONS') return respond({});
    requests.push({ path: p, query: u.search, method });
    if (p === '/auth/login')
      return respond(
        badLogin
          ? {}
          : { token: 'isolated-ui-test', username: 'Taller', admin: true },
        badLogin ? 401 : 200,
      );
    if (method !== 'GET') {
      const data = req.postData() ? JSON.parse(req.postData()) : null;
      mutations.push({ path: p, method, data });
      if (p === '/repairs' && method === 'POST')
        repairs.push({ ...repair, ...data, id: 99 });
      if (p === '/api/repairs/1/parts' && method === 'POST')
        repairParts = [
          {
            id: 1,
            partCatalogName: part.name,
            phoneBrand: phone.brand,
            phoneModel: phone.model,
            priceCharged: data.priceCharged,
            quantity: data.quantity,
          },
        ];
      if (p === '/api/repairs/1/parts/1' && method === 'DELETE')
        repairParts = [];
      return respond({ id: 99, ...data });
    }
    if (
      (failRepairs && p === '/repairs/search') ||
      (failDashboard && p === '/repairs')
    )
      return respond({}, 503);
    if (p === '/repairs') return respond(repairs);
    if (p === '/repairs/search') {
      const q = (u.searchParams.get('keyword') || '').toLowerCase();
      return respond(
        paged(
          repairs.filter((r) =>
            (r.customer.name + ' ' + r.phone.brand).toLowerCase().includes(q),
          ),
          u,
        ),
      );
    }
    if (p === '/repairs/1') return respond(repair);
    if (p === '/api/repairs/1/parts') return respond(repairParts);
    if (p === '/customers/count') return respond(1);
    if (p === '/phones/count') return respond(1);
    if (p === '/customers/search') return respond(paged([customer], u));
    if (p === '/phones/search') return respond(paged([phone], u));
    if (p === '/customers/1') return respond(customer);
    if (p === '/phones/1') return respond(phone);
    if (p === '/phones') return respond([phone]);
    if (p === '/api/parts-catalog')
      return respond(paged([part], u, +(u.searchParams.get('size') || 10)));
    if (p === '/api/parts-catalog/1') return respond(part);
    if (p.startsWith('/api/parts-catalog/')) return respond([part]);
    if (p === '/api/part-types/1') return respond(partType);
    if (p === '/api/part-types') return respond([partType]);
    if (p === '/api/inventory-movements')
      return respond(paged([movement], u, +(u.searchParams.get('size') || 4)));
    if (p === '/api/external-repairs/1') return respond(external);
    if (p === '/api/external-repairs') return respond(paged([external], u, 20));
    if (p === '/api/settlements') return respond([settlement]);
    if (p === '/api/earnings/summary')
      return respond({
        today: daily,
        last30Days: {
          ...daily,
          startDate: '2026-05-02',
          endDate: '2026-06-01',
        },
        currentMonth: {
          ...daily,
          startDate: '2026-06-01',
          endDate: '2026-06-30',
        },
      });
    if (p === '/api/earnings/daily') return respond(daily);
    unknown.push(p);
    return respond({}, 404);
  });
  const go = async (route) => {
    await page.goto(base + route, { waitUntil: 'networkidle0' });
  };
  const text = () => page.$eval('body', (e) => e.innerText);
  const set = async (selector, value) =>
    page.$eval(
      selector,
      (e, v) => {
        e.value = v;
        e.dispatchEvent(new Event('input', { bubbles: true }));
        e.dispatchEvent(new Event('change', { bubbles: true }));
      },
      value,
    );
  const dismiss = async () => {
    if (await page.$('.swal2-confirm')) {
      await page.click('.swal2-confirm');
      await page.waitForSelector('.swal2-container', { hidden: true });
    }
  };
  const snapshot = async (name) => {
    await page.evaluate(() => {
      window.scrollTo({ top: 0, left: 0, behavior: 'instant' });
      return new Promise(resolve => requestAnimationFrame(resolve));
    });
    const overflow = await page.evaluate(
      () => document.documentElement.scrollWidth > innerWidth + 1,
    );

    await page.screenshot({
      path: path.join(out, name + '.png'),
      fullPage: true,
    });
    assert(!overflow, `${name}: page overflows horizontally`);
  };
  await page.setViewport({ width: 1440, height: 1000 });
  await go('/dashboard/repairs');
  assert(page.url().endsWith('/login'), 'Route guard');
  assert(await page.$eval('button[type=submit]', (e) => e.disabled));
  await snapshot('login-desktop');
  await set('#username', 'Taller');
  await set('#password', 'test-password');
  await page.click('[aria-label="Mostrar contraseña"]');
  await page.waitForFunction(
    () => document.querySelector('#password').type === 'text',
  );
  badLogin = true;
  await page.click('button[type=submit]');
  await page.waitForSelector('[role=alert]');
  assert((await text()).includes('Credenciales incorrectas'));
  badLogin = false;
  await page.click('button[type=submit]');
  await page.waitForSelector('app-dashboard-home');
  await dismiss();
  await page.waitForFunction(
    () => document.querySelectorAll('.metric-value').length === 4,
  );
  assert.deepEqual(
    await page.$$eval('.metric-value', (els) =>
      els.map((e) => e.textContent.trim()),
    ),
    ['12', '3', '3', '1'],
  );
  await snapshot('dashboard-desktop');
  await go('/dashboard/repairs');
  assert.equal(await page.$$eval('tbody tr', (els) => els.length), 10);
  await page.click('[aria-label="Página siguiente"]');
  await page.waitForFunction(
    () => document.querySelectorAll('tbody tr').length === 2,
  );
  await set('[aria-label="Buscar reparaciones"]', 'sin-coincidencia');
  await page.waitForFunction(() =>
    document.body.innerText.includes('Sin resultados para esta búsqueda'),
  );
  await page.click('.empty-action button');
  await page.waitForSelector('tbody tr');
  await snapshot('repairs-desktop');
  failRepairs = true;
  await go('/dashboard/repairs');
  assert((await text()).includes('No pudimos cargar'));
  await snapshot('repairs-error');
  failRepairs = false;
  await page.click('.empty-action button');
  await page.waitForSelector('tbody tr');
  await go('/dashboard/repairs/new');
  assert(await page.$eval('button[type=submit]', (e) => e.disabled));
  await page.type('app-autocomplete:first-of-type input', 'Cliente');
  await page.waitForSelector('[role=option]');
  await page.keyboard.press('ArrowDown');
  await page.keyboard.press('Enter');
  const inputs = await page.$$('app-autocomplete input');
  await inputs[1].type('Samsung');
  await page.waitForSelector('[role=option]');
  await page.keyboard.press('ArrowDown');
  await page.keyboard.press('Enter');
  await set('#fault', 'Prueba de recepción');
  await page.select('#state', 'Pendiente');
  await set('#date', '2026-06-01');
  await set('#laborCost', '40000');
  assert.equal(
    await page.$eval('button[type=submit]', (e) => e.disabled),
    false,
  );
  await snapshot('repair-form-desktop');
  await page.click('button[type=submit]');
  await page.waitForSelector('app-repair');
  await dismiss();
  const created = mutations.find(
    (r) => r.path === '/repairs' && r.method === 'POST',
  );
  assert(created);
  assert.equal(created.data.customerId, 1);
  assert.equal(created.data.phoneId, 1);
  assert(!('customer' in created.data));
  await go('/dashboard/repairs/edit/1');
  assert(
    (await inputsText(page)).every(Boolean),
    'Edit autocomplete displays selected entities',
  );
  await snapshot('repair-edit-desktop');
  await set('#fault', 'Diagnóstico actualizado');
  await page.click('button[type=submit]');
  await page.waitForSelector('app-repair');
  await dismiss();
  assert(
    mutations.some(
      (r) =>
        r.path === '/repairs/1' &&
        r.method === 'PUT' &&
        r.data.customerId === 1,
    ),
  );
  await go('/dashboard/repairs/edit/1');
  await page.click('app-repair-form .btn-outline-primary');
  await page.type(
    ".part-selector-panel input[placeholder^='Buscar']",
    'Pantalla',
  );
  await page.waitForSelector('.search-result-item');
  await page.click('.search-result-item');
  await page.waitForSelector('.selected-part-form');
  await page.click('.part-form-actions .btn-primary');
  await page.waitForSelector('.part-name');
  await dismiss();
  assert(
    mutations.some(
      (r) => r.path === '/api/repairs/1/parts' && r.method === 'POST',
    ),
  );
  await snapshot('repair-parts-desktop');
  await page.click('[aria-label="Eliminar repuesto"]');
  await page.waitForSelector('.swal2-cancel');
  await page.click('.swal2-cancel');
  await page.waitForSelector('.swal2-container', { hidden: true });
  assert(!mutations.some((r) => r.method === 'DELETE'));
  await page.click('[aria-label="Eliminar repuesto"]');
  await page.waitForSelector('.swal2-confirm');
  await page.click('.swal2-confirm');
  await page.waitForFunction(() =>
    document.body.innerText.includes('No hay repuestos agregados'),
  );
  await dismiss();
  assert(
    mutations.some(
      (r) => r.path === '/api/repairs/1/parts/1' && r.method === 'DELETE',
    ),
  );

  const routes = [
    'customers',
    'customers/new',
    'customers/edit/1',
    'phones',
    'phones/new',
    'phones/edit/1',
    'parts',
    'parts/new',
    'parts/edit/1',
    'part-types',
    'part-types/new',
    'part-types/edit/1',
    'inventory',
    'inventory/stock-entry',
    'inventory/movements',
    'external-repairs',
    'external-repairs/new',
    'external-repairs/edit/1',
    'external-repairs/settlements',
    'earnings',
  ];
  for (const route of routes) {
    await go('/dashboard/' + route);
    assert(!(await text()).includes('Página no encontrada'), route);
    await snapshot(route.replaceAll('/', '-') + '-desktop');
  }
  await go('/dashboard/inventory/stock-entry');
  assert(!await page.$eval('.part-dropdown-trigger', e => e.classList.contains('placeholder')));
  await page.click('.part-dropdown-trigger');
  await page.waitForSelector('.part-dropdown-option');
  await page.click('.part-dropdown-option:last-child');
  await page.waitForSelector('.stock-display');
  await set('[formControlName="reason"]', 'Entrada de prueba');
  await set('[formControlName="quantity"]', '3');
  await page.click('button[type=submit]');
  await page.waitForSelector('app-inventory-dashboard'); await dismiss();
  assert(mutations.some(r => r.path === '/api/inventory-movements' && r.method === 'POST' && r.data.movementType === 'PURCHASE' && r.data.partCatalogId === 1));
  await page.setViewport({ width: 834, height: 1112 });
  await go('/dashboard');
  await snapshot('dashboard-tablet');
  await page.setViewport({ width: 390, height: 844 });
  for (const route of [
    '/login',
    '/register',
    '/dashboard',
    '/dashboard/repairs',
    '/dashboard/repairs/new',
    '/dashboard/repairs/edit/1',
    '/dashboard/customers',
    '/dashboard/parts',
    '/dashboard/inventory',
    '/dashboard/inventory/stock-entry',
    '/dashboard/external-repairs',
    '/dashboard/external-repairs/new',
    '/dashboard/earnings',
  ]) {
    await go(route);
    await snapshot(route.replaceAll('/', '-').slice(1) + '-mobile');
  }
  await go('/dashboard/repairs');
  await page.click('[aria-label="Abrir navegación"]');
  assert(
    await page.$eval('.app-sidebar', (e) =>
      e.classList.contains('mobile-open'),
    ),
  );
  await snapshot('navigation-mobile');
  await page.click('.app-sidebar a[href="/dashboard/customers"]');
  await page.waitForSelector('app-customers-list');
  assert.equal(
    await page.$eval('.app-sidebar', (e) =>
      e.classList.contains('mobile-open'),
    ),
    false,
  );
  await page.click('[aria-label="Abrir navegación"]');
  await page.keyboard.press('Escape');
  assert.equal(
    await page.$eval('.app-sidebar', (e) =>
      e.classList.contains('mobile-open'),
    ),
    false,
  );
  await page.setViewport({ width: 1440, height: 1000 });
  await go('/dashboard');
  await page.click('[aria-label="Activar tema oscuro"]');
  assert.equal(await page.$eval('html', (e) => e.dataset.bsTheme), 'dark');
  await snapshot('dashboard-dark');
  await page.reload({ waitUntil: 'networkidle0' });
  assert.equal(await page.$eval('html', (e) => e.dataset.bsTheme), 'dark');
  await page.click('[aria-label="Activar tema claro"]');
  failDashboard = true;
  await go('/dashboard');
  assert((await text()).includes('Sin datos'));
  await snapshot('dashboard-partial-error');
  failDashboard = false;
  await page.evaluate(() => sessionStorage.setItem('isAdmin', 'false'));
  await go('/dashboard/repairs');
  assert.equal(await page.$('button[title="Editar"]'), null);
  assert(!(await text()).includes('Nueva reparación'));
  await go('/register');
  assert(await page.$eval('input[type=checkbox]', (e) => e.disabled));
  await set('#username', 'abc');
  await page.focus('#email');
  assert(await page.$eval('button[type=submit]', (e) => e.disabled));
  await set('#username', 'nuevo-usuario');
  await set('#email', 'prueba@example.com');
  await set('#password', 'test-password');
  await page.click('button[type=submit]');
  await page.waitForSelector('app-login');
  await dismiss();
  assert(mutations.some((r) => r.path === '/userslogin' && !r.data.admin));
  await go('/dashboard/repairs');
  await page.click('[aria-label="Cerrar sesión"]');
  await page.waitForSelector('app-login');
  assert.equal(
    await page.evaluate(() => sessionStorage.getItem('token')),
    null,
  );
  assert.deepEqual(errors, [], 'Browser JavaScript errors');
  assert.deepEqual(
    unknown,
    [],
    'Unmocked API requests: ' + JSON.stringify(unknown),
  );
  fs.writeFileSync(
    path.join(out, 'report.json'),
    JSON.stringify(
      {
        screenshots: fs.readdirSync(out).filter((n) => n.endsWith('.png'))
          .length,
        errors,
        unknown,
        mutations: mutations.map((r) => ({ path: r.path, method: r.method })),
        requests: requests.length,
      },
      null,
      2,
    ),
  );
  console.log(`UI QA passed. Screenshots and report: ${out}`);
})()
  .catch((e) => {
    console.error(e);
    process.exitCode = 1;
  })
  .finally(async () => {
    if (browser) await browser.close();
  });
async function inputsText(page) {
  return page.$$eval('app-autocomplete input', (els) =>
    els.map((e) => e.value),
  );
}
