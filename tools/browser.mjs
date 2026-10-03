// Headless browser helpers for checking the app. Uses Chrome for Testing only
// (never the Chrome app: a second copy of it would take over AppleScript meant for the real one).
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import http from 'node:http';
import { createRequire } from 'node:module';

const ROOT = path.resolve(path.dirname(new URL(import.meta.url).pathname), '..');
const require = createRequire(process.env.PUPPETEER_FROM || path.join(os.homedir(), 'Books/tests/'));
const puppeteer = require('puppeteer-core');

function chromeBin() {
  const root = path.join(os.homedir(), '.cache', 'puppeteer', 'chrome');
  for (const d of fs.readdirSync(root).filter(x => x.startsWith('mac')).sort().reverse()) {
    for (const sub of ['chrome-mac-arm64', 'chrome-mac-x64']) {
      const p = path.join(root, d, sub, 'Google Chrome for Testing.app', 'Contents', 'MacOS', 'Google Chrome for Testing');
      if (fs.existsSync(p)) return p;
    }
  }
  throw new Error('Chrome for Testing is not installed (npx @puppeteer/browsers install chrome@stable --path ~/.cache/puppeteer)');
}

const TYPES = { '.html': 'text/html', '.js': 'text/javascript', '.css': 'text/css', '.json': 'application/json', '.png': 'image/png', '.jpg': 'image/jpeg', '.svg': 'image/svg+xml' };
export function serve() {
  return new Promise(resolve => {
    const server = http.createServer((req, res) => {
      let p = decodeURIComponent(req.url.split('?')[0]);
      if (p.endsWith('/')) p += 'index.html';
      const file = path.join(ROOT, p);
      if (!file.startsWith(ROOT) || !fs.existsSync(file) || fs.statSync(file).isDirectory()) { res.writeHead(404); return res.end('not found'); }
      res.writeHead(200, { 'Content-Type': TYPES[path.extname(file)] || 'application/octet-stream', 'Cache-Control': 'no-store' });
      fs.createReadStream(file).pipe(res);
    });
    server.listen(0, '127.0.0.1', () => resolve({ server, url: `http://127.0.0.1:${server.address().port}` }));
  });
}

export async function launch() {
  const profile = fs.mkdtempSync(path.join(os.tmpdir(), 'chess-test-'));
  const browser = await puppeteer.launch({
    executablePath: chromeBin(), headless: true, userDataDir: profile,
    args: ['--no-first-run', '--no-default-browser-check', '--host-resolver-rules=MAP * ~NOTFOUND , EXCLUDE 127.0.0.1'],
  });
  browser.cleanup = async () => { await browser.close(); fs.rmSync(profile, { recursive: true, force: true }); };
  return browser;
}

export async function openPage(browser, url, viewport) {
  const page = await browser.newPage();
  await page.setViewport(viewport);
  page.errors = [];
  page.on('pageerror', e => page.errors.push(String(e)));
  page.on('console', m => { if (m.type() === 'error' && !/Failed to load resource/.test(m.text())) page.errors.push(m.text()); });
  await page.goto(url, { waitUntil: 'load' });
  await page.waitForSelector('.board svg .piece');
  return page;
}

export const sleep = ms => new Promise(r => setTimeout(r, ms));

// centre of a square on screen, white at the bottom
export async function squarePoint(page, sq) {
  const box = await page.$eval('.board svg', e => { const r = e.getBoundingClientRect(); return { x: r.left, y: r.top, w: r.width }; });
  const f = 'abcdefgh'.indexOf(sq[0]), r = +sq[1], u = box.w / 8;
  return [box.x + (f + 0.5) * u, box.y + (8 - r + 0.5) * u];
}
export async function tap(page, sq) {
  const [x, y] = await squarePoint(page, sq);
  await page.mouse.click(x, y);
  await sleep(60);
}
export async function move(page, from, to) { await tap(page, from); await tap(page, to); await sleep(350); }
export async function drag(page, from, to) {
  const [x1, y1] = await squarePoint(page, from), [x2, y2] = await squarePoint(page, to);
  await page.mouse.move(x1, y1); await page.mouse.down();
  await page.mouse.move((x1 + x2) / 2, (y1 + y2) / 2, { steps: 4 }); await page.mouse.move(x2, y2, { steps: 4 });
  await page.mouse.up(); await sleep(350);
}
export const text = (page, sel) => page.$eval(sel, e => e.innerText.trim());
