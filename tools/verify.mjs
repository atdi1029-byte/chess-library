// Check every lesson step against the rules of chess: node tools/verify.mjs
// Each task step carries `check`, the answer the book gives, and the engine must agree:
//   mated | stalemate | only:<move> (the single legal move) | legal:<move> (must be playable)
//   mate:<move>[,<move>] (exactly these moves mate in one) | nomate | tap | line
import fs from 'node:fs';
import path from 'node:path';
import { load, matingMoves, forcedMate } from '../app/rules.js';

const ROOT = path.resolve(path.dirname(new URL(import.meta.url).pathname), '..');
const bare = s => s.replace(/[+#]/g, '');
let bad = 0, steps = 0, frames = 0;
const fail = (where, msg) => { bad++; console.log(`FAIL ${where}: ${msg}`); };

for (const bookDir of fs.readdirSync(ROOT)) {
  const dataDir = path.join(ROOT, bookDir, 'data');
  if (!fs.existsSync(dataDir)) continue;
  for (const file of fs.readdirSync(dataDir).filter(f => f.endsWith('.js')).sort()) {
    const ch = (await import(path.join(dataDir, file))).default;
    const seen = new Set();
    for (const fr of ch.frames) {
      frames++;
      if (seen.has(fr.n)) fail(`${ch.id} frame ${fr.n}`, 'frame number used twice');
      seen.add(fr.n);
      fr.steps.forEach((st, i) => {
        steps++;
        const where = `${ch.id} frame ${fr.n} step ${i + 1}`;
        let c;
        try { c = load(st.fen); } catch (e) { return fail(where, `bad position ${st.fen}`); }
        const board = st.fen.split(' ')[0];
        for (const k of ['k', 'K']) if ((board.match(new RegExp(k, 'g')) || []).length !== 1) fail(where, `needs exactly one ${k === 'k' ? 'Black' : 'White'} King`);
        if (/[pP]/.test(board.split('/')[0] + board.split('/')[7])) fail(where, 'Pawn on the first or last row');
        // the side that just moved must not be left in check
        const flip = load(st.fen.replace(/ ([wb])/, (m, s) => ' ' + (s === 'w' ? 'b' : 'w')));
        if (flip.inCheck()) fail(where, 'the side not to move is in check');
        const legal = c.moves().map(bare);
        const say = (st.say || '') + (st.done || '') + (st.ask || '');
        if (/[—]/.test(say)) fail(where, 'em dash in text');
        if (st.task && !st.check) return fail(where, 'task without a check');
        if (!st.task) {
          if (st.demo) { const d = load(st.fen); for (const m of st.demo) { try { d.move(typeof m === 'string' ? m : m.m); } catch (e) { fail(where, `demo move ${JSON.stringify(m)} is not legal`); } } }
          return;
        }
        const k = st.check, arg = k.includes(':') ? k.split(':')[1].split(',') : [];
        if (k === 'mated') { if (!c.isCheckmate()) fail(where, `not checkmate; legal: ${legal.join(' ')}`); }
        else if (k === 'stalemate') { if (!c.isStalemate()) fail(where, `not stalemate; legal: ${legal.join(' ')}`); }
        else if (k.startsWith('only:')) { if (!c.inCheck() || legal.length !== 1 || legal[0] !== arg[0]) fail(where, `expected the only move ${arg[0]}; legal: ${legal.join(' ')} check=${c.inCheck()}`); }
        else if (k.startsWith('legal:')) { if (!legal.includes(arg[0])) fail(where, `${arg[0]} is not legal; legal: ${legal.join(' ')}`); }
        else if (k.startsWith('mate:')) { const m = matingMoves(c).map(x => bare(x.san)).sort(); if (m.join() !== [...arg].sort().join()) fail(where, `expected mate by ${arg.join(' or ')}; engine finds: ${m.join(' ') || 'none'}`); }
        else if (k === 'nomate') { const m = matingMoves(c).map(x => x.san); if (m.length) fail(where, `engine finds a mate: ${m.join(' ')}`); }
        else if (k === 'line') {
          for (const line of (Array.isArray(st.sol[0]) ? st.sol : [st.sol])) {
            const d = load(st.fen);
            for (const m of line) { try { d.move(m); } catch (e) { fail(where, `line move ${m} is not legal`); break; } }
            if (st.goal !== 'win' && !d.isCheckmate()) fail(where, `line ${line.join(' ')} does not end in mate`);
          }
          if (st.goal !== 'win') {
            const n = Math.ceil((Array.isArray(st.sol[0]) ? st.sol[0] : st.sol).length / 2);
            if (n <= 3 && !forcedMate(load(st.fen), n)) fail(where, `no forced mate in ${n}`);
            if (n > 1 && forcedMate(load(st.fen), n - 1)) fail(where, `there is a faster mate, in ${n - 1}`);
          }
        }
        else if (k !== 'tap') fail(where, `unknown check ${k}`);
        if (st.sol && st.task !== 'line') for (const m of st.sol) if (!legal.includes(bare(m))) fail(where, `sol ${m} is not legal`);
        if (st.task === 'guards') {
          for (const sq in st.labels) {
            const copy = load(st.fen), king = copy.findPiece({ type: 'k', color: copy.turn() })[0];
            copy.remove(king);
            if (!copy.attackers(sq, copy.turn() === 'w' ? 'b' : 'w').length) fail(where, `square ${st.labels[sq]} (${sq}) has no guard`);
          }
        }
        for (const a of [...(st.arrows || []), ...(st.doneArrows || [])]) if (!/^[a-h][1-8]$/.test(a[0]) || !/^[a-h][1-8]$/.test(a[1])) fail(where, `bad arrow ${a}`);
      });
    }
    console.log(`${bookDir}/${file}: ${ch.frames.length} frames`);
  }
}
console.log(bad ? `\n${bad} problem(s) in ${steps} steps` : `\nall ${steps} steps in ${frames} frames agree with the rules engine`);
process.exit(bad ? 1 : 0);
