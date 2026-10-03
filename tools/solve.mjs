// What does the rules engine say about a position?  node tools/solve.mjs "<fen> <side>" [max mate depth]
// Also used as a module by the checks: analyse(fen, n).
import { load, forcedMate } from '../app/rules.js';
const bare = s => s.replace(/[+#]/g, '');

// all first moves that force mate within n own moves, each with one full line
export function winners(fen, n) {
  const c = load(fen), out = [];
  for (const m of c.moves({ verbose: true })) {
    c.move(m);
    let ok = c.isCheckmate(), line = [m.san];
    if (!ok && n > 1 && !c.isStalemate()) {
      const replies = c.moves({ verbose: true });
      ok = replies.length > 0;
      let longest = null;
      for (const r of replies) {
        c.move(r);
        let w = null, depth = 0;
        for (let d = 1; d < n && !w; d++) { w = forcedMate(c, d); depth = d; }
        c.undo();
        if (!w) { ok = false; break; }
        if (!longest || depth > longest.depth) longest = { r, depth };
      }
      if (ok && longest) line = [m.san, longest.r.san, '...'];
    }
    c.undo();
    if (ok) out.push(line.join(' '));
  }
  return out;
}
export function mateDepth(fen, max) {
  for (let n = 1; n <= max; n++) { const w = winners(fen, n); if (w.length) return { n, first: w }; }
  return null;
}
// for a side in trouble: which moves avoid a mate within n?
export function savers(fen, n) {
  const c = load(fen), out = [];
  for (const m of c.moves({ verbose: true })) {
    c.move(m);
    let lost = false;
    for (let d = 1; d <= n && !lost; d++) lost = !!forcedMate(c, d);
    c.undo();
    if (!lost) out.push(bare(m.san));
  }
  return out;
}
if (process.argv[1].endsWith('solve.mjs') && process.argv[2]) {
  const fen = process.argv[2], max = +(process.argv[3] || 3);
  const c = load(fen);
  console.log('check:', c.inCheck(), '| legal:', c.moves().join(' '));
  console.log('mate:', JSON.stringify(mateDepth(fen, max)));
}

// One full line of a forced mate in n: the attacker's mating moves against the longest defence.
export function mainLine(fen, n) {
  const c = load(fen), line = [];
  for (let left = n; left >= 1; left--) {
    let m = null;
    for (let d = 1; d <= left && !m; d++) m = forcedMate(c, d);
    if (!m) return null;
    line.push(c.move(m).san);
    if (c.isCheckmate()) return line;
    let best = null;
    for (const r of c.moves({ verbose: true })) {
      c.move(r);
      let depth = 0;
      for (let d = 1; d < left; d++) if (forcedMate(c, d)) { depth = d; break; }
      c.undo();
      const capture = r.captured ? 1 : 0;
      if (!best || depth > best.depth || (depth === best.depth && capture > best.capture)) best = { r, depth, capture };
    }
    line.push(c.move(best.r).san);
  }
  return line;
}
