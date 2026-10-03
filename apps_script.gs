// ============================================================
// Chess Library — progress sync (Google Apps Script web app)
// Keeps each book's progress so the phone and the computer share it.
// Deploy as Web App: Execute as "Me", Access "Anyone". There is no sheet:
// the state lives in this script's properties, so it needs no permissions.
//
//   get    book            -> {ok, ver, data}
//   ver    book            -> {ok, ver}          cheap "anything new?" check
//   merge  book, d (JSON)  -> {ok, ver}          merges a patch into the saved state
// Add t=1 to any call to use a test copy of the book's state (wipe it with action=wipe).
//
// A patch never overwrites better progress: steps keep their best result, review cards
// and the reading position keep whichever copy changed last, and a reset (a newer
// `epoch`) clears everything saved before it. Clients call with JSONP GETs.
// mergeState() must stay identical to the one in app/sync.js.
// ============================================================

var PART = 8000;            // one property holds at most 9 KB
var MAX_STATE = 300000;     // refuse to grow past this
var RANK = {ok: 3, retry: 2, shown: 1};

function doGet(e) {
  var p = (e && e.parameter) || {};
  var out;
  try {
    var book = String(p.book || '').replace(/[^\w-]/g, '').slice(0, 40);
    if (!book) throw new Error('book is required');
    if (p.t === '1') book = 'test_' + book;
    var action = String(p.action || '').toLowerCase();
    if (action === 'get') out = load(book);
    else if (action === 'ver') out = {ok: true, ver: load(book).ver};
    else if (action === 'merge') out = mergeIn(book, String(p.d || ''));
    else if (action === 'wipe' && p.t === '1') out = wipe(book);
    else out = {ok: false, error: 'Unknown action'};
  } catch (err) {
    out = {ok: false, error: String((err && err.message) || err)};
  }
  var json = JSON.stringify(out);
  if (p.callback && /^[\w$.]+$/.test(p.callback)) {
    return ContentService.createTextOutput(p.callback + '(' + json + ')')
      .setMimeType(ContentService.MimeType.JAVASCRIPT);
  }
  return ContentService.createTextOutput(json).setMimeType(ContentService.MimeType.JSON);
}

function store() { return PropertiesService.getScriptProperties(); }

function load(book) {
  var props = store().getProperties();
  var n = Number(props[book + ':n']) || 0, s = '';
  for (var i = 0; i < n; i++) s += props[book + ':' + i] || '';
  var data = null;
  if (s) { try { data = JSON.parse(s); } catch (e) { data = null; } }
  return {ok: true, ver: Number(props[book + ':ver']) || 0, data: data};
}

function save(book, data, ver) {
  var s = JSON.stringify(data);
  if (s.length > MAX_STATE) throw new Error('state too large');
  var st = store(), old = Number(st.getProperty(book + ':n')) || 0, put = {}, n = 0;
  for (var i = 0; i < s.length; i += PART) put[book + ':' + (n++)] = s.substring(i, i + PART);
  put[book + ':n'] = String(n);
  put[book + ':ver'] = String(ver);
  put[book + ':ts'] = new Date().toISOString();
  st.setProperties(put);
  for (var j = n; j < old; j++) st.deleteProperty(book + ':' + j);
}

function wipe(book) {
  var st = store(), props = st.getProperties();
  for (var k in props) if (k.indexOf(book + ':') === 0) st.deleteProperty(k);
  return {ok: true};
}

function mergeIn(book, d) {
  if (!d || d.length > 7000) throw new Error('bad patch');
  var patch = clean(JSON.parse(d));
  var lock = LockService.getScriptLock();
  lock.waitLock(20000);
  try {
    var cur = load(book);
    var before = JSON.stringify(cur.data);
    var next = mergeState(cur.data, patch);
    if (JSON.stringify(next) === before) return {ok: true, ver: cur.ver};
    save(book, next, cur.ver + 1);
    return {ok: true, ver: cur.ver + 1};
  } finally {
    lock.releaseLock();
  }
}

// Keep only well-formed entries, so a stray request cannot fill the store with junk
function clean(p) {
  var out = {epoch: Math.max(0, Number(p && p.epoch) || 0), steps: {}, rev: {}, pos: null};
  var key = /^[\w.]{1,40}$/;
  var num = function (v) { v = Number(v); return isFinite(v) ? v : 0; };
  for (var k in (p && p.steps) || {}) if (key.test(k) && RANK[p.steps[k]]) out.steps[k] = p.steps[k];
  for (var r in (p && p.rev) || {}) {
    var c = p.rev[r];
    if (key.test(r) && c && typeof c === 'object') out.rev[r] = {d: num(c.d), i: num(c.i), n: num(c.n), l: num(c.l), m: c.m ? 1 : 0, t: num(c.t)};
  }
  var q = p && p.pos;
  if (q && key.test(String(q.ch))) out.pos = {ch: String(q.ch), f: num(q.f), s: num(q.s), t: num(q.t)};
  return out;
}

// Fold `b` into `a` and return the result. Identical to mergeState() in app/sync.js.
function mergeState(a, b) {
  a = a || {};
  b = b || {};
  var ea = Number(a.epoch) || 0, eb = Number(b.epoch) || 0;
  if (eb < ea) return a;                                              // from before a reset: ignore
  if (eb > ea) a = {epoch: eb, steps: {}, rev: {}, pos: null};        // a later reset: start again from it
  var out = {epoch: Number(a.epoch) || 0, steps: {}, rev: {}, pos: a.pos || null}, k;
  for (k in a.steps || {}) out.steps[k] = a.steps[k];
  for (k in a.rev || {}) out.rev[k] = a.rev[k];
  for (k in b.steps || {}) if ((RANK[b.steps[k]] || 0) > (RANK[out.steps[k]] || 0)) out.steps[k] = b.steps[k];
  for (k in b.rev || {}) {
    var x = b.rev[k], y = out.rev[k];
    if (x && (!y || (Number(x.t) || 0) > (Number(y.t) || 0))) out.rev[k] = x;
  }
  if (b.pos && (!out.pos || (Number(b.pos.t) || 0) > (Number(out.pos.t) || 0))) out.pos = b.pos;
  return out;
}
