// Chess reasoning for the lessons, built on chess.js: why a move is illegal,
// how a King got out of check, why a check is not mate, and a small mate finder.
import { Chess } from './vendor/chess.js';

export { Chess };
export const NAME = { p: 'Pawn', n: 'Knight', b: 'Bishop', r: 'Rook', q: 'Queen', k: 'King' };
const FILES = 'abcdefgh';
const other = c => (c === 'w' ? 'b' : 'w');
const side = c => (c === 'w' ? 'White' : 'Black');

// "7k/6pQ/8/5B2/8/8/8/4K3 b" -> a full FEN. Lesson positions never involve castling rights.
export function fullFen(short) {
  const parts = short.trim().split(/\s+/);
  return [parts[0], parts[1] || 'w', parts[2] || '-', parts[3] || '-', '0', '1'].join(' ');
}
// Lesson diagrams may leave out a King, so positions are loaded without the legality check.
export function load(short) {
  return new Chess(fullFen(short), { skipValidation: true });
}
export function pieceMap(chess) {
  const map = {};
  for (const row of chess.board()) for (const p of row) if (p) map[p.square] = p.color + p.type;
  return map;
}
export function kingSquare(chess, colour) {
  return chess.findPiece({ type: 'k', color: colour })[0] || null;
}

// Squares a piece could go to if checks did not matter.
function reach(chess, from) {
  const p = chess.get(from);
  if (!p) return [];
  const f = FILES.indexOf(from[0]), r = +from[1], out = [];
  const at = (df, dr) => {
    const nf = f + df, nr = r + dr;
    return nf < 0 || nf > 7 || nr < 1 || nr > 8 ? null : FILES[nf] + nr;
  };
  const step = (df, dr) => {
    const sq = at(df, dr);
    if (!sq) return;
    const t = chess.get(sq);
    if (!t || t.color !== p.color) out.push(sq);
  };
  const slide = (df, dr) => {
    for (let i = 1; i < 8; i++) {
      const sq = at(df * i, dr * i);
      if (!sq) return;
      const t = chess.get(sq);
      if (t) { if (t.color !== p.color) out.push(sq); return; }
      out.push(sq);
    }
  };
  const ORTH = [[1, 0], [-1, 0], [0, 1], [0, -1]], DIAG = [[1, 1], [1, -1], [-1, 1], [-1, -1]];
  if (p.type === 'k') [...ORTH, ...DIAG].forEach(d => step(...d));
  if (p.type === 'n') [[1, 2], [2, 1], [-1, 2], [-2, 1], [1, -2], [2, -1], [-1, -2], [-2, -1]].forEach(d => step(...d));
  if (p.type === 'r' || p.type === 'q') ORTH.forEach(d => slide(...d));
  if (p.type === 'b' || p.type === 'q') DIAG.forEach(d => slide(...d));
  if (p.type === 'p') {
    const dir = p.color === 'w' ? 1 : -1, home = p.color === 'w' ? 2 : 7;
    const one = at(0, dir);
    if (one && !chess.get(one)) {
      out.push(one);
      const two = at(0, 2 * dir);
      if (r === home && two && !chess.get(two)) out.push(two);
    }
    for (const df of [-1, 1]) {
      const sq = at(df, dir);
      const t = sq && chess.get(sq);
      if (t && t.color !== p.color) out.push(sq);
    }
  }
  return out;
}

// Why can't this piece go there? Returns {text, arrows} or null when there is nothing useful to say.
export function explainIllegal(chess, from, to) {
  const p = chess.get(from);
  if (!p || p.color !== chess.turn()) return null;
  const me = p.color, foe = other(me), target = chess.get(to);
  if (target && target.color === me) return null;
  if (!reach(chess, from).includes(to)) {
    if (p.type === 'k') return { text: 'The King moves just one square at a time.', arrows: [] };
    if (p.type === 'p' && from[0] === to[0] && target) return { text: 'A Pawn is blocked by the piece in front of it. It captures only diagonally.', arrows: [] };
    return { text: `A ${NAME[p.type]} can't move like that.`, arrows: [] };
  }
  // play it on a copy and see who would be hitting the King
  const copy = new Chess(chess.fen(), { skipValidation: true });
  copy.remove(from);
  if (target) copy.remove(to);
  copy.put(p, to);
  const king = p.type === 'k' ? to : kingSquare(chess, me);
  if (!king) return null;
  const hitters = copy.attackers(king, foe);
  if (!hitters.length) return null;
  const h = hitters[0], hp = copy.get(h);
  const arrows = hitters.map(s => [s, king, 'red']);
  if (p.type === 'k') {
    if (target) {
      return { text: `You can't take the ${NAME[target.type]}: it is protected by the ${NAME[hp.type]} on ${h}.`, arrows };
    }
    if (hp.type === 'k') return { text: `${to} is next to the enemy King. Two Kings can never stand side by side.`, arrows };
    return { text: `${to} is not safe. The ${NAME[hp.type]} on ${h} covers it.`, arrows };
  }
  if (chess.inCheck()) {
    return { text: `You are in check from the ${NAME[hp.type]} on ${h}, and that move doesn't stop it.`, arrows };
  }
  return { text: `That ${NAME[p.type]} is pinned. If it moves, the ${NAME[hp.type]} on ${h} attacks your King.`, arrows };
}

// How did this (already played) move get the King out of check?
export function escapeKind(move) {
  if (move.piece === 'k') return move.captured ? 'king-takes' : 'flee';
  return move.captured ? 'piece-takes' : 'block';
}

// The side to move is in check but not mated: the escape that best shows why.
export function bestEscape(chess) {
  const moves = chess.moves({ verbose: true });
  const rank = m => ({ 'piece-takes': 0, 'king-takes': 1, block: 2, flee: 3 }[escapeKind(m)]);
  moves.sort((a, b) => rank(a) - rank(b));
  return moves[0] || null;
}
export function describeEscape(move) {
  const who = side(move.color);
  switch (escapeKind(move)) {
    case 'piece-takes': return `${who}'s ${NAME[move.piece]} captures the ${NAME[move.captured]} on ${move.to}.`;
    case 'king-takes': return `the ${NAME[move.captured]} on ${move.to} is not protected, so the King takes it.`;
    case 'block': return `${who}'s ${NAME[move.piece]} blocks on ${move.to}.`;
    default: return `the King steps away to ${move.to}.`;
  }
}

export function matingMoves(chess) {
  const out = [];
  for (const m of chess.moves({ verbose: true })) {
    chess.move(m);
    if (chess.isCheckmate()) out.push(m);
    chess.undo();
  }
  return out;
}

// Can the side to move force mate within n of its own moves? Returns the first move of a way, or null.
export function forcedMate(chess, n) {
  const moves = chess.moves({ verbose: true });
  moves.sort((a, b) => (b.san.includes('+') || b.san.includes('#') ? 1 : 0) - (a.san.includes('+') || a.san.includes('#') ? 1 : 0));
  for (const m of moves) {
    chess.move(m);
    let ok = chess.isCheckmate();
    if (!ok && n > 1 && !chess.isStalemate()) {
      const replies = chess.moves({ verbose: true });
      ok = replies.length > 0;
      for (const r of replies) {
        chess.move(r);
        const win = forcedMate(chess, n - 1);
        chess.undo();
        if (!win) { ok = false; break; }
      }
    }
    chess.undo();
    if (ok) return m;
  }
  return null;
}

// After a wrong try: the reply that spoils a mate in n more moves (null if every reply still loses).
export function spoiler(chess, n) {
  const replies = chess.moves({ verbose: true });
  const rank = m => (m.captured ? 0 : m.piece === 'k' ? 2 : 1);
  replies.sort((a, b) => rank(a) - rank(b));
  for (const r of replies) {
    chess.move(r);
    const win = n > 0 ? forcedMate(chess, n) : null;
    chess.undo();
    if (!win) return r;
  }
  return null;
}
