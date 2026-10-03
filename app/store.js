// Progress for one book on this device: where you are, how each step went, and the review
// cards for the steps you missed. Kept in localStorage; app/sync.js mirrors it to the cloud.
import { RANK } from './sync.js';

// A missed step comes back after 1 day, then 3, 8 and 21. Solving it cleanly after the
// 21-day wait makes it mature; a miss at any stage sends it back to 1 day.
export const LADDER = [1, 3, 8, 21];
export const today = () => Math.floor((Date.now() - new Date().getTimezoneOffset() * 60000) / 86400000);

export class Store {
  constructor(bookId) {
    this.bookId = bookId;
    this.key = 'chesslib:' + bookId;
    this.data = { epoch: 0, pos: null, steps: {}, rev: {} };
    this.onChange = null;           // set by Sync
    try { Object.assign(this.data, JSON.parse(localStorage.getItem(this.key) || '{}')); } catch (e) { /* private mode */ }
    this.data.rev = this.data.rev || {};
    this.data.steps = this.data.steps || {};
  }
  save(change) {
    try { localStorage.setItem(this.key, JSON.stringify(this.data)); } catch (e) { /* private mode */ }
    if (change && this.onChange) this.onChange(change);
  }
  // take the merged state that came back from the cloud
  adopt(data) { this.data = data; this.save(null); }

  mark(key, status) {
    if ((RANK[this.data.steps[key]] || 0) < RANK[status]) { this.data.steps[key] = status; this.save({ steps: { [key]: status } }); }
  }
  // remember the place; only a move the reader makes counts as "newer" for the other device
  setPos(pos) {
    this.data.pos = { ...pos, t: Date.now() };
    this.save({ pos: this.data.pos });
  }
  reset() {
    this.data = { epoch: Date.now(), pos: null, steps: {}, rev: {} };
    this.save({ reset: true });
  }

  // ---------- review cards ----------
  // a step was missed while reading: (re)start its card, due tomorrow
  miss(key) {
    const c = this.data.rev[key];
    if (c && !c.m) return;
    this.data.rev[key] = { d: today() + LADDER[0], i: 0, n: c ? c.n : 0, l: (c ? c.l : 0) + 1, m: 0, t: Date.now() };
    this.save({ rev: { [key]: this.data.rev[key] } });
  }
  // a due card was answered in review
  reviewed(key, clean) {
    const c = this.data.rev[key];
    if (!c) return;
    const next = { ...c, t: Date.now() };
    if (!clean) { next.i = 0; next.d = today() + LADDER[0]; next.l = (c.l || 0) + 1; }
    else if (c.i >= LADDER.length - 1) { next.m = 1; next.n = (c.n || 0) + 1; next.d = 0; }
    else { next.i = c.i + 1; next.n = (c.n || 0) + 1; next.d = today() + LADDER[next.i]; }
    this.data.rev[key] = next;
    this.save({ rev: { [key]: next } });
  }
  due() {
    const t = today();
    return Object.keys(this.data.rev).filter(k => !this.data.rev[k].m && this.data.rev[k].d <= t)
      .sort((a, b) => this.data.rev[a].d - this.data.rev[b].d || a.localeCompare(b, undefined, { numeric: true }));
  }
  cards() {
    const all = Object.values(this.data.rev), t = today();
    const open = all.filter(c => !c.m);
    return {
      due: open.filter(c => c.d <= t).length, learning: open.length, mature: all.length - open.length,
      nextIn: open.length ? Math.max(0, Math.min(...open.map(c => c.d)) - t) : null,
    };
  }

  frameStatus(ch, frame) {
    let worst = 'ok', tasks = 0;
    frame.steps.forEach((s, i) => {
      if (!s.task) return;
      tasks++;
      const st = this.data.steps[`${ch}.${frame.n}.${i}`];
      if (!st) worst = null;
      else if (worst && RANK[st] < RANK[worst]) worst = st;
    });
    if (!tasks) return this.data.steps[`${ch}.${frame.n}.read`] ? 'ok' : null;
    return worst;
  }
}
