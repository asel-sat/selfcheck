// Прогон файлов через страницу tests/ в Playwright и вывод найденных замечаний (JSON).
//   LIBS=<папка с распакованными npm-пакетами> node run.js <папка сайта> <файл> [<файл> ...]
// В LIBS ожидаются: mammoth-1.8.0, pdfjs-dist-3.11.174, jszip-3.10.1, xlsx-0.18.5, jspdf-2.5.1, jspdf-autotable-3.8.2
// (каждый — результат `npm pack <пакет>@<версия>` и `tar xzf` в одноименную папку). CDN подменяется локальными копиями.
const { chromium } = require('playwright');
const path = require('path');
const fs = require('fs');

const LIBS = process.env.LIBS;
const MAP = [
  [/mammoth\.browser\.min\.js$/, 'mammoth-1.8.0/package/mammoth.browser.min.js'],
  [/pdf\.worker\.min\.js$/, 'pdfjs-dist-3.11.174/package/build/pdf.worker.min.js'],
  [/pdf\.min\.js$/, 'pdfjs-dist-3.11.174/package/build/pdf.min.js'],
  [/jszip\.min\.js$/, 'jszip-3.10.1/package/dist/jszip.min.js'],
  [/xlsx\.full\.min\.js$/, 'xlsx-0.18.5/package/dist/xlsx.full.min.js'],
  [/jspdf\.umd\.min\.js$/, 'jspdf-2.5.1/package/dist/jspdf.umd.min.js'],
  [/jspdf\.plugin\.autotable\.min\.js$/, 'jspdf-autotable-3.8.2/package/dist/jspdf.plugin.autotable.min.js'],
];

(async () => {
  const [site, ...files] = process.argv.slice(2);
  const browser = await chromium.launch();
  const page = await browser.newPage();
  await page.route(/^https:\/\/(cdnjs\.cloudflare\.com|cdn\.jsdelivr\.net|fonts\.googleapis\.com|fonts\.gstatic\.com)\//, (route) => {
    const url = route.request().url();
    const hit = MAP.find(([re]) => re.test(url));
    if (!hit || !LIBS) return route.abort();
    route.fulfill({ body: fs.readFileSync(path.join(LIBS, hit[1])), contentType: 'application/javascript' });
  });
  if (process.env.DEBUG) page.on('requestfailed', (r) => console.error('failed:', r.url().slice(0, 120)));
  if (process.env.DEBUG) page.on('console', (m) => console.error('console:', m.text()));
  page.on('pageerror', (e) => console.error('page error:', e.message));
  // the site is served from a fake origin so that pdf.js can start its worker from the same origin
  await page.route(/^http:\/\/regress\.local\//, (route) => {
    const rel = decodeURIComponent(new URL(route.request().url()).pathname).replace(/^\/+/, '');
    if (rel === '__pdf.worker.min.js') return route.fulfill({ body: fs.readFileSync(path.join(LIBS, MAP[1][1])), contentType: 'application/javascript' });
    const file = path.resolve(site, rel);
    if (!file.startsWith(path.resolve(site)) || !fs.existsSync(file)) return route.fulfill({ status: 404, body: '' });
    const type = file.endsWith('.html') ? 'text/html' : file.endsWith('.js') ? 'application/javascript' : 'application/octet-stream';
    route.fulfill({ body: fs.readFileSync(file), contentType: type });
  });
  await page.goto('http://regress.local/tests/index.html');
  // pdf.js: run the worker code in the page itself (fake worker), no separate Worker needed
  await page.addScriptTag({ content: fs.readFileSync(path.join(LIBS, MAP[1][1]), 'utf8') });
  // the page keeps its state inside a closure: capture each check() result instead
  await page.evaluate(() => { const orig = TestCore.check; TestCore.check = (p) => { const r = orig(p); window.__last = { p, r }; return r; }; });
  const out = {};
  for (const f of files) {
    const name = path.basename(path.dirname(f)) + '/' + path.basename(f);
    await page.setInputFiles('#file', f);
    await page.waitForFunction(() => window.__last, null, { timeout: +(process.env.WAIT || 120000) }).catch(() => {});
    out[name] = await page.evaluate(() => { const L = window.__last; window.__last = null; return L ? {
      questions: L.p.questions.length,
      issues: L.r.issues.map((i) => `${i.sev} ${i.code} ${i.nums.join(',')}`),
      texts: L.p.questions.map((q) => q.num + ') ' + q.text + ' || ' + q.options.map((o) => o.text).join(' | ')),
    } : { questions: 0, issues: ['NO RESULT: ' + document.querySelector('#status').textContent], texts: [] }; });
  }
  console.log(JSON.stringify(out, null, 1));
  await browser.close();
})();
