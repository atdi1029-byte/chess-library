// The app's merge (app/sync.js) and the server's (apps_script.gs) must behave the same,
// and pushing diff(local, remote) must bring the server level with this device.
//   node tools/merge_check.mjs
import fs from 'node:fs';
import vm from 'node:vm';
import path from 'node:path';
import { mergeState, diff } from '../app/sync.js';

const ROOT = path.resolve(path.dirname(new URL(import.meta.url).pathname), '..');
const server = {};
vm.createContext(server);
vm.runInContext(fs.readFileSync(path.join(ROOT, 'apps_script.gs'), 'utf8'), server);
const copy = x => JSON.parse(JSON.stringify(x));
const rnd = n => Math.floor(Math.random() * n), results = ['ok', 'retry', 'shown'];
const state = () => {
  const s = { epoch: [0, 0, 0, 5, 9][rnd(5)], steps: {}, rev: {}, pos: rnd(3) ? { ch: 'ch1', f: rnd(9), s: 0, t: rnd(1000) } : null };
  for (let i = 0; i < rnd(8); i++) s.steps['ch1.' + rnd(9) + '.0'] = results[rnd(3)];
  for (let i = 0; i < rnd(5); i++) s.rev['ch1.' + rnd(9) + '.0'] = { d: rnd(30), i: rnd(4), n: rnd(3), l: 1, m: 0, t: rnd(1000) };
  return s;
};
let bad = 0;
for (let i = 0; i < 5000; i++) {
  const a = state(), b = state();
  if (JSON.stringify(mergeState(a, b)) !== JSON.stringify(server.mergeState(copy(a), copy(b)))) { bad++; if (bad < 3) console.log('merge differs', JSON.stringify({ a, b })); }
  const local = mergeState(a, b);            // this device after a pull of b
  const pushed = server.mergeState(copy(b), server.clean(copy(diff(local, b))));
  if (JSON.stringify(pushed) !== JSON.stringify(mergeState(b, local))) { bad++; if (bad < 3) console.log('push leaves server behind', JSON.stringify({ a, b })); }
}
console.log(bad ? `${bad} disagreement(s)` : 'app and server merges agree on 5000 random cases, and a push brings the server level');
process.exit(bad ? 1 : 0);
