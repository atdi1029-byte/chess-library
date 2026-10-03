// Cloud sync for progress: one Google Apps Script web app (apps_script.gs) keeps each
// book's state so the phone and the computer share it.
//  - pull on load and whenever the app comes back to the front
//  - push two seconds after any change, and only after the first pull has landed
//  - a push is a merge on the server, never an overwrite; nothing is sent when there is nothing new
// Requests are JSONP GETs (a POST to Apps Script fails on phones and behind ad blockers).

// The app's own endpoint. Hardcoded on purpose: a wiped cache must not lose it.
export const DEFAULT_SYNC_URL = 'https://script.google.com/macros/s/AKfycbwueRflx3fHg1fHyPExLjOL9ZXhKQah6j0cFUABSbMOl3heIgeGvWyNIcKi0IvS7hSG/exec';
export function getSyncUrl() {
  try { return localStorage.getItem('chesslib:syncUrl') || DEFAULT_SYNC_URL; } catch (e) { return DEFAULT_SYNC_URL; }
}

export const RANK = { ok: 3, retry: 2, shown: 1 };

// Fold `b` into `a` and return the result. Identical to mergeState() in apps_script.gs.
export function mergeState(a, b) {
  a = a || {};
  b = b || {};
  const ea = Number(a.epoch) || 0, eb = Number(b.epoch) || 0;
  if (eb < ea) return a;                                              // from before a reset: ignore
  if (eb > ea) a = { epoch: eb, steps: {}, rev: {}, pos: null };      // a later reset: start again from it
  const out = { epoch: Number(a.epoch) || 0, steps: {}, rev: {}, pos: a.pos || null };
  for (const k in a.steps || {}) out.steps[k] = a.steps[k];
  for (const k in a.rev || {}) out.rev[k] = a.rev[k];
  for (const k in b.steps || {}) if ((RANK[b.steps[k]] || 0) > (RANK[out.steps[k]] || 0)) out.steps[k] = b.steps[k];
  for (const k in b.rev || {}) {
    const x = b.rev[k], y = out.rev[k];
    if (x && (!y || (Number(x.t) || 0) > (Number(y.t) || 0))) out.rev[k] = x;
  }
  if (b.pos && (!out.pos || (Number(b.pos.t) || 0) > (Number(out.pos.t) || 0))) out.pos = b.pos;
  return out;
}

// What `local` has that `remote` lacks: the patch that would bring the server up to date.
export function diff(local, remote) {
  remote = remote || {};
  const el = Number(local.epoch) || 0, er = Number(remote.epoch) || 0;
  const patch = { epoch: el, steps: {}, rev: {}, pos: null };
  if (el < er) return patch;
  const base = el > er ? {} : remote;
  for (const k in local.steps || {}) if ((RANK[local.steps[k]] || 0) > (RANK[(base.steps || {})[k]] || 0)) patch.steps[k] = local.steps[k];
  for (const k in local.rev || {}) {
    const x = local.rev[k], y = (base.rev || {})[k];
    if (!y || (Number(x.t) || 0) > (Number(y.t) || 0)) patch.rev[k] = x;
  }
  if (local.pos && (!base.pos || (Number(local.pos.t) || 0) > (Number(base.pos.t) || 0))) patch.pos = local.pos;
  return patch;
}
const isEmpty = (p, remoteEpoch) => !Object.keys(p.steps).length && !Object.keys(p.rev).length && !p.pos && !(p.epoch > remoteEpoch);

// Cut a patch into parts small enough for a GET
function pieces(patch) {
  const out = [];
  let cur = { epoch: patch.epoch, steps: {}, rev: {}, pos: patch.pos || null }, size = 120;
  const add = (kind, k, v) => {
    const cost = k.length + JSON.stringify(v).length + 6;
    if (size + cost > 1500) { out.push(cur); cur = { epoch: patch.epoch, steps: {}, rev: {}, pos: null }; size = 60; }
    cur[kind][k] = v; size += cost;
  };
  for (const k in patch.steps) add('steps', k, patch.steps[k]);
  for (const k in patch.rev) add('rev', k, patch.rev[k]);
  out.push(cur);
  return out;
}

let seq = 0;
function jsonp(params, timeout = 25000) {
  return new Promise((resolve, reject) => {
    const name = '__chesslib_cb' + Date.now() + '_' + (seq++);
    const script = document.createElement('script');
    const done = (fn, v) => { clearTimeout(timer); delete window[name]; script.remove(); fn(v); };
    // given up on: an answer that still arrives later must find something to call
    const timer = setTimeout(() => { window[name] = () => { delete window[name]; script.remove(); }; reject(new Error('sync timed out')); }, timeout);
    window[name] = data => done(resolve, data);
    script.onerror = () => done(reject, new Error('sync unreachable'));
    script.src = getSyncUrl() + '?' + new URLSearchParams({ ...params, callback: name }).toString();
    document.head.appendChild(script);
  });
}

export class Sync {
  constructor(store) {
    this.store = store;
    this.ready = false;          // set by the first successful pull; nothing is pushed before it
    this.pending = { steps: {}, rev: {}, pos: null, reset: false };
    this.timer = null;
    this.busy = null;
    this.remoteEpoch = 0;
    this.status = 'idle';        // idle | syncing | ok | offline
    this.onStatus = null;
    this.params = { book: store.bookId };
    try { if (localStorage.getItem('chesslib:syncTest') === '1') this.params.t = '1'; } catch (e) { /* private mode */ }
    store.onChange = change => this.queue(change);
    if (typeof document !== 'undefined') {
      document.addEventListener('visibilitychange', () => { if (document.visibilityState === 'hidden') this.fireNow(); });
      window.addEventListener('pagehide', () => this.fireNow());
    }
  }
  set(status) { this.status = status; if (this.onStatus) this.onStatus(status); }

  // Fetch the saved state, fold it into this device's, and send back anything the server lacks.
  // Resolves to {posMoved} (the other device is further along) or null when the server could not be reached.
  async pull() {
    this.set('syncing');
    clearTimeout(this.retry);
    let res;
    try { res = await jsonp({ ...this.params, action: 'get' }); } catch (e) { res = null; }
    if (!res || !res.ok) {
      // try again by itself: after 10s, then 30s, then every minute
      this.fails = (this.fails || 0) + 1;
      this.retry = setTimeout(() => this.pull().then(r => r && this.onCatchUp && this.onCatchUp(r)), [10000, 30000, 60000][Math.min(this.fails - 1, 2)]);
      this.set('offline');
      return null;
    }
    this.fails = 0;
    const remote = res.data || {};
    this.remoteEpoch = Number(remote.epoch) || 0;
    const before = this.store.data.pos;
    this.store.adopt(mergeState(this.store.data, remote));
    this.ready = true;
    const after = this.store.data.pos;
    const patch = diff(this.store.data, remote);
    if (!isEmpty(patch, this.remoteEpoch)) await this.send(patch); else this.set('ok');
    return { posMoved: !!after && (!before || after.ch !== before.ch || after.f !== before.f || after.s !== before.s) };
  }

  // A change made on this device: remember it and push shortly
  queue(change) {
    Object.assign(this.pending.steps, change.steps || {});
    Object.assign(this.pending.rev, change.rev || {});
    if (change.pos) this.pending.pos = change.pos;
    if (change.reset) { this.pending = { steps: {}, rev: {}, pos: null, reset: true }; }
    clearTimeout(this.timer);
    this.timer = setTimeout(() => this.flush(), change.reset ? 0 : 2000);
  }
  async flush() {
    if (this.busy) { await this.busy; }
    if (!this.ready) {                                 // the pull sends whatever is missing once it lands
      if (await this.pull() && this.status === 'ok') this.pending = { steps: {}, rev: {}, pos: null, reset: false };
      return;
    }
    const p = this.pending;
    const patch = { epoch: this.store.data.epoch || 0, steps: p.steps, rev: p.rev, pos: p.pos };
    if (isEmpty(patch, p.reset ? -1 : patch.epoch)) return;
    this.pending = { steps: {}, rev: {}, pos: null, reset: false };
    const ok = await this.send(patch);
    if (ok) { this.pushFails = 0; return; }
    // keep it for the next try (newer changes win) and try again by itself: 10s, 30s, then every minute.
    // Sending the same patch twice is harmless: the server merges.
    this.pending.steps = { ...patch.steps, ...this.pending.steps };
    this.pending.rev = { ...patch.rev, ...this.pending.rev };
    this.pending.pos = this.pending.pos || patch.pos;
    this.pending.reset = this.pending.reset || p.reset;
    this.pushFails = (this.pushFails || 0) + 1;
    clearTimeout(this.timer);
    this.timer = setTimeout(() => this.flush(), [10000, 30000, 60000][Math.min(this.pushFails - 1, 2)]);
  }

  // The page is being put away with changes not yet sent: fire them off without waiting for an
  // answer (an image request still goes out while the page closes). The next pull squares things up.
  fireNow() {
    const p = this.pending;
    if (!this.ready || (!Object.keys(p.steps).length && !Object.keys(p.rev).length && !p.pos)) return;
    for (const piece of pieces({ epoch: this.store.data.epoch || 0, steps: p.steps, rev: p.rev, pos: p.pos })) {
      new Image().src = getSyncUrl() + '?' + new URLSearchParams({ ...this.params, action: 'merge', d: JSON.stringify(piece) }).toString();
    }
  }

  // Send a patch, in parts, and wait for each answer
  async send(patch) {
    const run = async () => {
      this.set('syncing');
      try {
        for (const piece of pieces(patch)) {
          const res = await jsonp({ ...this.params, action: 'merge', d: JSON.stringify(piece) });
          if (!res || !res.ok) throw new Error((res && res.error) || 'sync failed');
        }
        this.remoteEpoch = Math.max(this.remoteEpoch, patch.epoch || 0);
        this.set('ok');
        return true;
      } catch (e) { this.set('offline'); return false; }
    };
    this.busy = run();
    const ok = await this.busy;
    this.busy = null;
    return ok;
  }
}
