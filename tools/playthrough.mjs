// Drive the real app in a headless browser through every frame of a chapter, answering each
// step the way the book does, and fail if the player rejects an answer or logs an error.
//   node tools/playthrough.mjs [chapter-id] [screenshot-dir]
import path from 'node:path';
import { serve, launch, openPage, sleep, tap, text } from './browser.mjs';
import { load, matingMoves } from '../app/rules.js';

const ROOT = path.resolve(path.dirname(new URL(import.meta.url).pathname), '..');
const chId = process.argv[2] || 'ch1', shots = process.argv[3];
const ch = (await import(path.join(ROOT, 'bobby-fischer', 'data', chId + '.js'))).default;
const bare = s => s.replace(/[+#]/g, '');
const { server, url } = await serve();
const browser = await launch();
let problems = 0;
try {
  const page = await openPage(browser, url + '/bobby-fischer/index.html', { width: 412, height: 915, deviceScaleFactor: 1 });
  await page.evaluate(id => window.player.open(id, 0, 0), chId);
  await sleep(300);
  const playMove = async san => {
    const fen = await page.evaluate(() => window.player.chess.fen());
    const c = load(fen.split(' ').slice(0, 2).join(' '));
    const m = c.moves({ verbose: true }).find(x => bare(x.san) === bare(san));
    if (!m) throw new Error(`move ${san} not available in ${fen}`);
    await tap(page, m.from); await tap(page, m.to);
    if (m.promotion) {
      await page.waitForSelector('.promo:not([hidden])');
      await page.click(`.promo-row button[aria-label="${{ q: 'Queen', r: 'Rook', b: 'Bishop', n: 'Knight' }[m.promotion]}"]`);
    }
    await sleep(380);
  };
  for (const fr of ch.frames) {
    for (let i = 0; i < fr.steps.length; i++) {
      const st = fr.steps[i], where = `frame ${fr.n} step ${i + 1}`;
      const shown = await page.evaluate(() => `${window.player.frame.n}.${window.player.s}`);
      if (shown !== `${fr.n}.${i}`) { problems++; console.log(`FAIL ${where}: the app is showing ${shown}`); }
      try {
        const k = st.check || '';
        if (!st.task) { if (st.demo) await sleep(900 * st.demo.length + 400); }
        else if (st.task === 'guards') { /* answered below */ }
        else if (k === 'mated') await page.click('.choice.call');
        else if (k === 'stalemate' && st.task === 'escape') await page.$$eval('.choice.call', b => b[b.length - 1].click());
        else if (k === 'nomate' || k === 'lost' || k.startsWith('nomate:')) await page.click('.choice.call');
        else if (st.task === 'tap') for (const sq of st.squares) await tap(page, sq);
        else if (st.task === 'pick') await page.$$eval('.choice', (b, i) => b[i].click(), st.ans);
        else if (st.task === 'line') {
          const line = Array.isArray(st.sol[0]) ? st.sol[0] : st.sol;
          for (let p = 0; p < line.length; p += 2) { await playMove(line[p]); await sleep(900); }
        }
        else if (st.task === 'escape' || st.task === 'mate' || st.task === 'survive') await playMove(st.sol ? st.sol[0] : k.split(':')[1].split(',')[0]);
        if (st.task === 'guards') {
          const c = load(st.fen), king = c.findPiece({ type: 'k', color: c.turn() })[0];
          c.remove(king);
          for (const [sq] of Object.entries(st.labels).sort((a, b) => a[1].localeCompare(b[1]))) {
            await tap(page, c.attackers(sq, c.turn() === 'w' ? 'b' : 'w')[0]);
          }
        }
        await sleep(120);
        const state = await page.evaluate(() => ({ solved: window.player.solved, mistakes: window.player.mistakes, next: document.querySelector('.next').className }));
        if (st.task && (!state.solved || state.mistakes || !state.next.includes('ready'))) {
          problems++;
          console.log(`FAIL ${where}: not accepted (${JSON.stringify(state)}) feedback: ${await text(page, '.feedback').catch(() => '')}`);
        }
        if (shots && [4, 20, 44, 50, 54, 63, 79].includes(fr.n) && i === fr.steps.length - 1) await page.screenshot({ path: `${shots}/f${fr.n}.png` });
      } catch (e) { problems++; console.log(`FAIL ${where}: ${e.message}`); }
      await page.click('.next');
      await sleep(260);
    }
  }
  const end = await text(page, '.say');
  console.log('end screen:', end.replace(/\s+/g, ' '));
  if (page.errors.length) { problems += page.errors.length; console.log('page errors:', page.errors); }
} finally { await browser.cleanup(); server.close(); }
console.log(problems ? `${problems} problem(s)` : `played ${ch.frames.length} frames of ${chId} through the real app with no problems`);
process.exit(problems ? 1 : 0);
