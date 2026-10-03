// The one board. It draws a position, animates between positions, and reports
// taps and drags. It knows nothing about the rules of chess: the lesson player
// tells it which pieces may be picked up and what to do with a move.
import { PIECES } from './pieces.js';

const NS = 'http://www.w3.org/2000/svg';
const FILES = 'abcdefgh';
const U = 100; // one square, in drawing units

function el(name, attrs, parent) {
  const e = document.createElementNS(NS, name);
  for (const k in attrs || {}) e.setAttribute(k, attrs[k]);
  if (parent) parent.appendChild(e);
  return e;
}

export class Board {
  constructor(host) {
    this.host = host;
    this.orient = 'w';
    this.pieces = new Map(); // square -> {code, node}
    this.selected = null;
    this.handlers = {};      // canPick(sq), targetsFor(sq), onMove(from,to), onTap(sq)
    this.locked = false;

    host.classList.add('board');
    const svg = this.svg = el('svg', { viewBox: '0 0 800 800', role: 'img', 'aria-label': 'Chess board' }, host);
    svg.innerHTML = `<defs>
      <marker id="ah-gold" viewBox="0 0 10 10" refX="6.5" refY="5" markerWidth="3.4" markerHeight="3.4" orient="auto"><path d="M0 0L10 5L0 10z" class="ah gold"/></marker>
      <marker id="ah-red" viewBox="0 0 10 10" refX="6.5" refY="5" markerWidth="3.4" markerHeight="3.4" orient="auto"><path d="M0 0L10 5L0 10z" class="ah red"/></marker>
      <marker id="ah-green" viewBox="0 0 10 10" refX="6.5" refY="5" markerWidth="3.4" markerHeight="3.4" orient="auto"><path d="M0 0L10 5L0 10z" class="ah green"/></marker>
      <marker id="ah-blue" viewBox="0 0 10 10" refX="6.5" refY="5" markerWidth="3.4" markerHeight="3.4" orient="auto"><path d="M0 0L10 5L0 10z" class="ah blue"/></marker>
      <radialGradient id="check-glow"><stop offset="0" stop-color="#e2452c" stop-opacity=".95"/><stop offset=".55" stop-color="#e2452c" stop-opacity=".5"/><stop offset="1" stop-color="#e2452c" stop-opacity="0"/></radialGradient>
    </defs>`;
    this.gSquares = el('g', { class: 'squares' }, svg);
    this.gMarks = el('g', { class: 'marks' }, svg);
    this.gCoords = el('g', { class: 'coords' }, svg);
    this.gLabels = el('g', { class: 'labels' }, svg);
    this.gPieces = el('g', { class: 'pieces' }, svg);
    this.gDots = el('g', { class: 'dots' }, svg);
    this.gArrows = el('g', { class: 'arrows' }, svg);
    this.promoBox = document.createElement('div');
    this.promoBox.className = 'promo';
    this.promoBox.hidden = true;
    host.appendChild(this.promoBox);

    this.drawSquares();
    svg.addEventListener('pointerdown', e => this.down(e));
    svg.addEventListener('pointermove', e => this.moveDrag(e));
    svg.addEventListener('pointerup', e => this.up(e));
    svg.addEventListener('pointercancel', () => this.cancelDrag());
  }

  // ---------- geometry ----------
  xy(sq) {
    const f = FILES.indexOf(sq[0]), r = +sq[1];
    return this.orient === 'w' ? [f * U, (8 - r) * U] : [(7 - f) * U, (r - 1) * U];
  }
  centre(sq) { const [x, y] = this.xy(sq); return [x + U / 2, y + U / 2]; }
  squareAt(e) {
    const box = this.svg.getBoundingClientRect();
    const x = (e.clientX - box.left) / box.width * 8, y = (e.clientY - box.top) / box.height * 8;
    if (x < 0 || y < 0 || x >= 8 || y >= 8) return null;
    const cx = Math.floor(x), cy = Math.floor(y);
    return this.orient === 'w' ? FILES[cx] + (8 - cy) : FILES[7 - cx] + (cy + 1);
  }
  point(e) {
    const box = this.svg.getBoundingClientRect();
    return [(e.clientX - box.left) / box.width * 800, (e.clientY - box.top) / box.height * 800];
  }

  drawSquares() {
    this.gSquares.textContent = '';
    this.gCoords.textContent = '';
    for (let r = 1; r <= 8; r++) for (let f = 0; f < 8; f++) {
      const sq = FILES[f] + r, [x, y] = this.xy(sq);
      el('rect', { x, y, width: U, height: U, class: (f + r) % 2 ? 'sq dark' : 'sq light' }, this.gSquares);
    }
    for (let i = 0; i < 8; i++) {
      const file = this.orient === 'w' ? FILES[i] : FILES[7 - i];
      const rank = this.orient === 'w' ? 8 - i : i + 1;
      const tf = el('text', { x: i * U + U - 7, y: 800 - 7, class: 'coord ' + (i % 2 ? 'on-light' : 'on-dark'), 'text-anchor': 'end' }, this.gCoords);
      tf.textContent = file;
      const tr = el('text', { x: 6, y: i * U + 19, class: 'coord ' + (i % 2 ? 'on-dark' : 'on-light') }, this.gCoords);
      tr.textContent = rank;
    }
  }

  // ---------- position ----------
  // map: {e4: 'wp', ...}. Pieces slide to their new squares where they can;
  // the rest fade out or in, so two positions can be compared on one board.
  set(map, opts = {}) {
    const animate = opts.animate !== false;
    if (opts.orient && opts.orient !== this.orient) {
      this.orient = opts.orient;
      this.drawSquares();
      for (const [sq, p] of this.pieces) this.place(p.node, sq, false);
    }
    const old = this.pieces, next = new Map(), free = [];
    for (const [sq, p] of old) {
      if (map[sq] === p.code) next.set(sq, p); else free.push([sq, p]);
    }
    const hint = opts.move; // {from, to}: the piece on `from` is the one that lands on `to`
    for (const sq in map) {
      if (next.has(sq)) continue;
      const code = map[sq];
      let pick = -1;
      if (hint && hint.to === sq) pick = free.findIndex(([s]) => s === hint.from);
      if (pick < 0) {
        let best = 1e9;
        free.forEach(([s, p], i) => {
          if (p.code !== code) return;
          const d = Math.abs(FILES.indexOf(s[0]) - FILES.indexOf(sq[0])) + Math.abs(s[1] - sq[1]);
          if (d < best) { best = d; pick = i; }
        });
      }
      if (pick >= 0) {
        const [, p] = free.splice(pick, 1)[0];
        if (p.code !== code) this.dress(p.node, code); // a pawn that promoted
        p.code = code;
        this.gPieces.appendChild(p.node);
        this.place(p.node, sq, animate);
        next.set(sq, p);
      } else {
        const node = el('g', { class: 'piece' }, this.gPieces);
        this.dress(node, code);
        this.place(node, sq, false);
        if (animate) { node.classList.add('arrive'); setTimeout(() => node.classList.remove('arrive'), 420); }
        next.set(sq, { code, node });
      }
    }
    for (const [, p] of free) {
      if (animate) { p.node.classList.add('leave'); setTimeout(() => p.node.remove(), 260); } else p.node.remove();
    }
    this.pieces = next;
    this.select(null);
  }
  dress(node, code) {
    node.dataset.code = code;
    node.innerHTML = `<g transform="scale(${U / 45})">${PIECES[code]}</g>`;
  }
  place(node, sq, animate) {
    const [x, y] = this.xy(sq);
    node.classList.toggle('no-anim', !animate);
    node.style.transform = `translate(${x}px, ${y}px)`;
    if (!animate) { node.getBoundingClientRect(); node.classList.remove('no-anim'); }
  }

  // ---------- decorations ----------
  // marks: {sq: 'last' | 'check' | 'good' | 'bad' | 'ring' | 'sel' | 'ask'}
  marks(map) {
    this.gMarks.textContent = '';
    for (const sq in map || {}) {
      const [x, y] = this.xy(sq);
      for (const kind of String(map[sq]).split(' ')) {
        if (kind === 'check') el('circle', { cx: x + U / 2, cy: y + U / 2, r: U * 0.62, fill: 'url(#check-glow)', class: 'mark check' }, this.gMarks);
        else if (kind === 'ring') el('rect', { x: x + 4, y: y + 4, width: U - 8, height: U - 8, rx: 6, class: 'mark ring' }, this.gMarks);
        else el('rect', { x, y, width: U, height: U, class: 'mark ' + kind }, this.gMarks);
      }
    }
  }
  labels(map) {
    this.gLabels.textContent = '';
    for (const sq in map || {}) {
      const [cx, cy] = this.centre(sq);
      el('circle', { cx, cy, r: 27, class: 'label-disc' }, this.gLabels);
      const t = el('text', { x: cx, y: cy + 14, class: 'label', 'text-anchor': 'middle' }, this.gLabels);
      t.textContent = map[sq];
    }
  }
  // arrows: [[from, to, colour]] with colour gold | red | green | blue
  arrows(list) {
    this.gArrows.textContent = '';
    for (const [from, to, colour = 'gold'] of list || []) {
      const [x1, y1] = this.centre(from), [x2, y2] = this.centre(to);
      const len = Math.hypot(x2 - x1, y2 - y1) || 1, ux = (x2 - x1) / len, uy = (y2 - y1) / len;
      el('line', {
        x1: x1 + ux * 30, y1: y1 + uy * 30, x2: x2 - ux * 34, y2: y2 - uy * 34,
        class: 'arrow ' + colour, 'marker-end': `url(#ah-${colour})`,
      }, this.gArrows);
    }
  }
  dots(targets) {
    this.gDots.textContent = '';
    for (const t of targets || []) {
      const [cx, cy] = this.centre(t.to);
      if (this.pieces.has(t.to)) el('circle', { cx, cy, r: 44, class: 'ring-dot' }, this.gDots);
      else el('circle', { cx, cy, r: 15, class: 'dot' }, this.gDots);
    }
  }
  select(sq) {
    this.selected = sq;
    this.gSquares.querySelectorAll('.picked').forEach(n => n.classList.remove('picked'));
    this.dots(sq && this.handlers.targetsFor ? this.handlers.targetsFor(sq) : []);
    if (sq) {
      const [x, y] = this.xy(sq);
      for (const r of this.gSquares.children) if (+r.getAttribute('x') === x && +r.getAttribute('y') === y) r.classList.add('picked');
    }
  }
  shake(sq) {
    const p = this.pieces.get(sq);
    if (!p) return;
    const inner = p.node.firstChild;
    inner.classList.remove('shake');
    inner.getBoundingClientRect();
    inner.classList.add('shake');
  }

  // ---------- input ----------
  down(e) {
    if (this.locked) return;
    const sq = this.squareAt(e);
    if (!sq) return;
    const mine = this.handlers.canPick && this.handlers.canPick(sq);
    if (mine) {
      if (this.selected !== sq) this.select(sq);
      const p = this.pieces.get(sq);
      this.drag = { sq, node: p.node, start: this.point(e), moved: false, id: e.pointerId };
      try { this.svg.setPointerCapture(e.pointerId); } catch (err) { /* synthetic events */ }
      e.preventDefault();
      return;
    }
    if (this.selected) {
      const from = this.selected;
      this.select(null);
      this.handlers.onMove && this.handlers.onMove(from, sq);
    } else if (this.handlers.onTap) this.handlers.onTap(sq);
  }
  moveDrag(e) {
    const d = this.drag;
    if (!d) return;
    const [x, y] = this.point(e);
    if (!d.moved && Math.hypot(x - d.start[0], y - d.start[1]) < 14) return;
    if (!d.moved) { d.moved = true; d.node.classList.add('dragging'); this.gPieces.appendChild(d.node); }
    d.node.style.transform = `translate(${x - U / 2}px, ${y - U / 2}px)`;
  }
  up(e) {
    const d = this.drag;
    if (!d) return;
    this.drag = null;
    d.node.classList.remove('dragging');
    const sq = this.squareAt(e);
    if (!d.moved) return;                 // a tap: the piece stays picked up
    this.place(d.node, d.sq, true);       // back home; an accepted move re-places it
    if (sq && sq !== d.sq) {
      this.select(null);
      this.handlers.onMove && this.handlers.onMove(d.sq, sq);
    }
  }
  cancelDrag() {
    if (!this.drag) return;
    this.drag.node.classList.remove('dragging');
    this.place(this.drag.node, this.drag.sq, true);
    this.drag = null;
  }

  // Ask which piece a pawn becomes. Resolves to 'q' | 'r' | 'b' | 'n', or null if dismissed.
  promote(colour) {
    return new Promise(done => {
      const box = this.promoBox;
      box.innerHTML = '<div class="promo-title">Promote to</div>';
      const row = document.createElement('div');
      row.className = 'promo-row';
      for (const t of ['q', 'n', 'r', 'b']) {
        const b = document.createElement('button');
        b.type = 'button';
        b.setAttribute('aria-label', { q: 'Queen', n: 'Knight', r: 'Rook', b: 'Bishop' }[t]);
        b.innerHTML = `<svg viewBox="0 0 45 45">${PIECES[colour + t]}</svg>`;
        b.onclick = () => { box.hidden = true; done(t); };
        row.appendChild(b);
      }
      box.appendChild(row);
      const cancel = document.createElement('button');
      cancel.type = 'button';
      cancel.className = 'promo-cancel';
      cancel.textContent = 'Cancel';
      cancel.onclick = () => { box.hidden = true; done(null); };
      box.appendChild(cancel);
      box.hidden = false;
    });
  }
}
