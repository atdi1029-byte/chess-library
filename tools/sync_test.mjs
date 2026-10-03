// Two "devices" (separate browser storage) sharing one sync endpoint: progress, the reading
// place, review cards and a reset must all travel between them.   node tools/sync_test.mjs
// The endpoint is the real apps_script.gs running locally with stand-ins for Google's services.
import { serve, launch, openPage, sleep, move, text } from './browser.mjs';

const { server, url } = await serve();
const browser = await launch();
let bad = 0;
const check = (name, ok, detail = '') => { if (!ok) bad++; console.log(`${ok ? 'ok  ' : 'FAIL'} ${name}${detail ? ' — ' + detail : ''}`); };
const state = page => page.evaluate(() => JSON.parse(JSON.stringify(window.player.store.data)));
const waitSynced = async page => { for (let i = 0; i < 60; i++) { if (await page.evaluate(() => window.player.sync.status === 'ok' && !window.player.sync.timer?._destroyed && !Object.keys(window.player.sync.pending.steps).length && !Object.keys(window.player.sync.pending.rev).length && !window.player.sync.pending.pos)) return; await sleep(150); } };
try {
  const view = { width: 412, height: 780, deviceScaleFactor: 1 };
  const opts = async () => ({ syncUrl: url + '/sync', context: await browser.createBrowserContext() });
  const A = await openPage(browser, url + '/bobby-fischer/index.html', view, await opts());
  await sleep(300);

  // device A: frame 6 solved cleanly, frame 7 solved after a wrong call (a miss)
  await A.evaluate(() => window.player.open('ch1', 5, 0));
  await sleep(300);
  await A.click('.choice.call');
  await A.click('.next'); await sleep(300);
  await A.click('.choice.call');                    // wrong: frame 7 is not mate
  await move(A, 'a8', 'a7');
  check('A: the miss is announced', /come back tomorrow/.test(await text(A, '.feedback')));
  await sleep(2600); await waitSynced(A);
  const a1 = await state(A);
  check('A: results recorded', a1.steps['ch1.6.0'] === 'ok' && a1.steps['ch1.7.0'] === 'retry', JSON.stringify(a1.steps));
  check('A: a review card was made for the miss', !!a1.rev['ch1.7.0'] && !a1.rev['ch1.6.0']);

  // device B opens the book for the first time
  const B = await openPage(browser, url + '/bobby-fischer/index.html', view, await opts());
  await sleep(600);
  const b1 = await state(B);
  check('B: has A\'s results', b1.steps['ch1.6.0'] === 'ok' && b1.steps['ch1.7.0'] === 'retry');
  check('B: opened where A left off', (await B.evaluate(() => window.player.frame.n)) === 7, 'frame ' + await B.evaluate(() => window.player.frame.n));
  check('B: has the review card', !!b1.rev['ch1.7.0'] && b1.rev['ch1.7.0'].i === 0);
  check('B: nothing due yet (it is due tomorrow)', (await B.$eval('.due', e => e.hidden)) === true);

  // tomorrow on B: the card is due; review it cleanly
  await B.evaluate(() => { const s = window.player.store, c = s.data.rev['ch1.7.0']; s.data.rev['ch1.7.0'] = { ...c, d: c.d - 1, t: Date.now() }; s.save({ rev: { 'ch1.7.0': s.data.rev['ch1.7.0'] } }); window.player.paintDue(); });
  check('B: the review line appears', (await B.$eval('.due', e => e.hidden)) === false, await text(B, '.due'));
  await B.click('.due'); await sleep(400);
  check('B: review mode', /^Review 1 \/ 1/.test(await text(B, '.bar-count')) && /review/i.test(await text(B, '.kind')), await text(B, '.kind'));
  await move(B, 'a8', 'a7');
  check('B: clean review moves the card on', /comes back in 3 days/.test(await text(B, '.feedback')), await text(B, '.feedback'));
  await B.click('.next'); await sleep(300);
  check('B: review summary', /review/i.test(await text(B, '.title')) && /1\s*clean/.test((await text(B, '.say')).replace(/\n/g, ' ')));
  await sleep(2600); await waitSynced(B);

  // back on A
  await A.evaluate(() => window.player.refresh()); await sleep(500);
  const a2 = await state(A);
  check('A: sees the card at stage 2', a2.rev['ch1.7.0'] && a2.rev['ch1.7.0'].i === 1, JSON.stringify(a2.rev['ch1.7.0']));

  // B reads on; A follows when it comes back to the front
  await B.evaluate(() => window.player.open('ch1', 11, 0)); await sleep(2600); await waitSynced(B);
  await A.evaluate(() => window.player.refresh()); await sleep(600);
  check('A: follows B to the new place', (await A.evaluate(() => window.player.frame.n)) === 12, 'frame ' + await A.evaluate(() => window.player.frame.n));

  // a miss in review goes back to stage 1 and is asked again today
  await A.evaluate(() => { const s = window.player.store, c = s.data.rev['ch1.7.0']; s.data.rev['ch1.7.0'] = { ...c, d: 0, t: Date.now() }; window.player.startReview(); });
  await sleep(400);
  await A.click('.choice.call');                    // wrong again
  await move(A, 'a8', 'a7');
  check('A: a miss in review resets the card', (await state(A)).rev['ch1.7.0'].i === 0 && /once more at the end/i.test(await text(A, '.feedback')), await text(A, '.feedback'));
  await A.click('.next'); await sleep(300);
  check('A: the missed card is asked again', /^Review 2 \/ 2/.test(await text(A, '.bar-count')), await text(A, '.bar-count'));
  await move(A, 'a8', 'a7');
  await A.click('.next'); await sleep(300);

  // reset on B clears A as well
  await sleep(2600); await waitSynced(A);
  await B.evaluate(() => window.player.store.reset()); await sleep(1200); await waitSynced(B);
  await A.evaluate(() => window.player.refresh()); await sleep(600);
  const a3 = await state(A);
  check('A: a reset on B clears A', Object.keys(a3.steps).length === 0 && Object.keys(a3.rev).length === 0, JSON.stringify(a3).slice(0, 120));

  // the library page shows the shared numbers
  await B.evaluate(() => window.player.open('ch1', 5, 0)); await sleep(300);
  await B.click('.choice.call'); await sleep(2600); await waitSynced(B);
  const shelf = await (await opts()).context.newPage();
  await shelf.evaluateOnNewDocument(u => localStorage.setItem('chesslib:syncUrl', u), url + '/sync');
  await shelf.goto(url + '/index.html'); await sleep(900);
  check('library page shows synced progress', /^1 of \d+ frames done/.test(await text(shelf, '#bf-status')), await text(shelf, '#bf-status'));
  for (const p of [A, B]) if (p.errors.length) { bad += p.errors.length; console.log('page errors:', p.errors); }
} finally { await browser.cleanup(); server.close(); }
console.log(bad ? `${bad} problem(s)` : 'sync and review work across two devices');
process.exit(bad ? 1 : 0);
