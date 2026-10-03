// The lesson player: one board, one frame of the book at a time.
// A chapter is a list of frames; a frame is one or more steps on the same board.
// Step fields (all optional except fen):
//   fen     position, e.g. "7k/6pQ/8/5B2/8/8/8/4K3 b" (side to move after the board)
//   say     teaching text (html)          ask   the instruction line
//   task    'escape' get out of check, or call mate/stalemate
//           'survive' answer a check so that no mate follows within n moves, or call it lost
//           'mate'   give checkmate in one (calls: ['nomate'] adds a "no mate here" button)
//           'line'   play a line; sol = [mine, reply, mine, ...] or a list of such lines;
//                    without sol there is no forced mate in n moves (calls: ['nomate'])
//           'pick'   choose from opts, ans = index of the right one
//           'tap'    tap the right square(s): squares, need
//           'guards' name the piece guarding each lettered square (labels)
//           none     just read; Next goes on
//   sol     moves the lesson accepts      hint  a nudge
//   done    explanation once solved       doneArrows  arrows shown once solved
//   demo    moves played out on the board once solved (or at once on a reading step)
//   arrows, marks, labels   drawn from the start
import { Board } from './board.js';
import {
  Chess, load, pieceMap, kingSquare, explainIllegal, escapeKind, bestEscape,
  describeEscape, matingMoves, forcedMate, spoiler, NAME,
} from './rules.js';

const sleep = ms => new Promise(r => setTimeout(r, ms));
const bare = san => san.replace(/[+#?!]/g, '');
const sideName = c => (c === 'w' ? 'White' : 'Black');
const RANK = { ok: 3, retry: 2, shown: 1 };

class Store {
  constructor(bookId) {
    this.key = 'chesslib:' + bookId;
    this.data = { pos: null, steps: {} };
    try { Object.assign(this.data, JSON.parse(localStorage.getItem(this.key) || '{}')); } catch (e) { /* private mode */ }
  }
  save() { try { localStorage.setItem(this.key, JSON.stringify(this.data)); } catch (e) { /* private mode */ } }
  mark(key, status) {
    if ((RANK[this.data.steps[key]] || 0) < RANK[status]) { this.data.steps[key] = status; this.save(); }
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

export class Player {
  constructor(book, base, host) {
    this.book = book;
    this.base = base;
    this.store = new Store(book.id);
    this.chapters = {};
    this.run = 0;
    host.innerHTML = `
      <header class="bar">
        <a class="bar-home" href="../index.html" aria-label="Back to the library"><img src="../icons/logo-96.png" alt=""></a>
        <div class="bar-title"><div class="bar-book"></div><div class="bar-chapter"></div></div>
        <button class="bar-count" type="button" aria-label="Contents"></button>
      </header>
      <div class="progress"><div class="progress-fill"></div></div>
      <main class="stage">
        <section class="board-wrap"><div class="board-frame"><div id="board"></div></div><div class="turn"></div></section>
        <section class="card">
          <div class="card-scroll">
            <div class="eyebrow"><span class="seal"></span><span class="kind"></span><span class="pips"></span></div>
            <h1 class="title"></h1>
            <div class="say"></div>
            <div class="ask"></div>
            <div class="choices"></div>
            <div class="feedback" hidden></div>
          </div>
          <nav class="nav">
            <button class="btn ghost back" type="button">Back</button>
            <button class="btn ghost hint" type="button">Hint</button>
            <button class="btn ghost show" type="button">Show me</button>
            <button class="btn next" type="button">Next</button>
          </nav>
        </section>
      </main>
      <div class="drawer" hidden><div class="drawer-panel">
        <div class="drawer-head"><h2>Contents</h2><button class="btn ghost drawer-close" type="button">Close</button></div>
        <div class="drawer-body"></div>
      </div></div>`;
    const q = s => host.querySelector(s);
    this.ui = {
      book: q('.bar-book'), chapter: q('.bar-chapter'), count: q('.bar-count'), fill: q('.progress-fill'),
      turn: q('.turn'), seal: q('.seal'), kind: q('.kind'), pips: q('.pips'), title: q('.title'), say: q('.say'),
      ask: q('.ask'), choices: q('.choices'), feedback: q('.feedback'), scroll: q('.card-scroll'),
      back: q('.back'), hint: q('.hint'), show: q('.show'), next: q('.next'),
      drawer: q('.drawer'), drawerBody: q('.drawer-body'),
    };
    this.board = new Board(q('#board'));
    this.ui.book.textContent = book.title;
    this.ui.back.onclick = () => this.go(-1);
    this.ui.next.onclick = () => this.go(1);
    this.ui.hint.onclick = () => this.hint();
    this.ui.show.onclick = () => this.reveal();
    this.ui.count.onclick = () => this.openDrawer();
    q('.drawer-close').onclick = () => { this.ui.drawer.hidden = true; };
    this.ui.drawer.onclick = e => { if (e.target === this.ui.drawer) this.ui.drawer.hidden = true; };
    document.addEventListener('keydown', e => {
      if (e.target.closest('input, textarea')) return;
      if (e.key === 'ArrowRight') this.go(1);
      if (e.key === 'ArrowLeft') this.go(-1);
    });
  }

  async start() {
    const pos = this.store.data.pos;
    const first = this.book.chapters.find(c => c.file);
    const ch = pos && this.book.chapters.find(c => c.id === pos.ch && c.file) ? pos.ch : first.id;
    await this.open(ch, pos && pos.ch === ch ? pos.f : 0, pos && pos.ch === ch ? pos.s : 0);
  }

  async chapter(id) {
    if (!this.chapters[id]) {
      const meta = this.book.chapters.find(c => c.id === id);
      this.chapters[id] = (await import(new URL(meta.file, this.base).href)).default;
    }
    return this.chapters[id];
  }

  async open(chId, f = 0, s = 0) {
    this.ch = await this.chapter(chId);
    this.f = Math.max(0, Math.min(f, this.ch.frames.length - 1));
    this.s = Math.max(0, Math.min(s, this.frame.steps.length - 1));
    this.ended = false;
    this.enter();
  }
  get frame() { return this.ch.frames[this.f]; }
  get step() { return this.frame.steps[this.s]; }
  get stepKey() { return `${this.ch.id}.${this.frame.n}.${this.s}`; }

  // ---------- moving through the book ----------
  go(dir) {
    if (this.ended) {
      if (dir < 0) { this.ended = false; this.enter(); }
      return;
    }
    if (dir > 0 && !this.step.task) this.store.mark(`${this.ch.id}.${this.frame.n}.read`, 'ok');
    let f = this.f, s = this.s + dir;
    if (s >= this.frame.steps.length) { f++; s = 0; }
    if (s < 0) { f--; s = f >= 0 ? this.ch.frames[f].steps.length - 1 : 0; }
    if (f < 0) return;
    if (f >= this.ch.frames.length) return this.endOfChapter();
    this.f = f; this.s = s;
    this.enter();
  }

  enter() {
    this.run++;
    const step = this.step;
    this.chess = load(step.fen);
    this.home = this.chess.fen();   // where a wrong try goes back to
    this.ply = 0;
    this.lines = step.task === 'line' && step.sol ? (Array.isArray(step.sol[0]) ? step.sol : [step.sol]) : null;
    this.mistakes = 0;
    this.solved = false;
    this.revealed = false;
    this.busy = false;
    this.last = null;
    this.found = new Set();
    this.kept = [];                 // arrows earned so far (guards task)
    this.gi = 0;
    this.hinted = false;
    this.board.locked = false;
    this.board.set(pieceMap(this.chess), { animate: true });
    this.decorate();
    this.bind();
    this.paint();
    this.store.data.pos = { ch: this.ch.id, f: this.f, s: this.s };
    this.store.save();
    if (!step.task && step.demo) this.demo(step.demo);
  }

  decorate(extraArrows, extraMarks) {
    const step = this.step, marks = {};
    const add = (sq, kind) => { marks[sq] = marks[sq] ? marks[sq] + ' ' + kind : kind; };
    for (const sq in step.marks || {}) add(sq, step.marks[sq]);
    if (this.last) { add(this.last.from, 'last'); add(this.last.to, 'last'); }
    if (this.chess.inCheck()) { const k = kingSquare(this.chess, this.chess.turn()); if (k) add(k, 'check'); }
    for (const sq of this.found) add(sq, 'good');
    for (const sq in extraMarks || {}) add(sq, extraMarks[sq]);
    this.board.marks(marks);
    this.board.labels(step.labels);
    const solvedArrows = this.solved ? step.doneArrows || [] : [];
    const opening = this.last ? [] : step.arrows || [];   // pointers drawn for the starting position only
    this.board.arrows([...opening, ...this.kept, ...solvedArrows, ...(extraArrows || [])]);
    const t = this.chess.turn();
    this.ui.turn.innerHTML = `<span class="turn-dot ${t}"></span>${sideName(t)} to move`;
  }

  paint() {
    const step = this.step, frame = this.frame, ui = this.ui;
    ui.chapter.textContent = `${this.ch.n ? 'Chapter ' + this.ch.n + ' · ' : ''}${this.ch.title}`;
    ui.count.textContent = `${this.f + 1} / ${this.ch.frames.length}`;
    ui.fill.style.width = `${((this.f + (this.s + 1) / frame.steps.length) / this.ch.frames.length) * 100}%`;
    ui.seal.textContent = frame.n;
    ui.kind.textContent = { escape: 'Your move', survive: 'Your move', mate: 'Your move', line: 'Your move', pick: 'Question', tap: 'Find it', guards: 'Find it' }[step.task] || 'Read';
    ui.pips.innerHTML = frame.steps.length > 1
      ? frame.steps.map((_, i) => `<i class="${i === this.s ? 'on' : i < this.s ? 'past' : ''}"></i>`).join('') : '';
    ui.title.textContent = step.title || frame.title || '';
    ui.say.innerHTML = step.say || '';
    ui.ask.innerHTML = this.askText();
    ui.ask.hidden = !ui.ask.innerHTML;
    this.feedback(null);
    this.paintChoices();
    ui.back.disabled = this.f === 0 && this.s === 0;
    ui.hint.hidden = ui.show.hidden = !step.task;
    ui.hint.disabled = ui.show.disabled = false;
    this.paintNext();
    ui.scroll.scrollTop = 0;
  }
  askText() {
    const step = this.step;
    if (step.task === 'guards' && !this.solved) {
      const [letter] = this.letters()[this.gi];
      return `${step.ask ? step.ask + ' ' : ''}Tap the ${sideName(this.guardColour())} piece that guards square <b>${letter}</b>.`;
    }
    return step.ask || '';
  }
  paintNext() {
    const ui = this.ui, ready = this.solved || !this.step.task;
    ui.next.classList.toggle('ready', ready);
    const lastStep = this.f === this.ch.frames.length - 1 && this.s === this.frame.steps.length - 1;
    ui.next.textContent = ready ? (lastStep ? 'Finish' : 'Next') : 'Skip';
  }
  feedback(kind, html) {
    const box = this.ui.feedback;
    box.hidden = !kind;
    if (!kind) return;
    box.className = 'feedback ' + kind;
    box.innerHTML = html;
    box.scrollIntoView({ block: 'nearest', behavior: 'smooth' });
  }

  // ---------- the tasks ----------
  bind() {
    const t = this.step.task, h = this.board.handlers = {};
    if (t === 'escape' || t === 'survive' || t === 'mate' || t === 'line') {
      h.canPick = sq => { const p = this.chess.get(sq); return !this.busy && !this.solved && !!p && p.color === this.chess.turn(); };
      h.targetsFor = sq => {
        const seen = new Set();
        return this.chess.moves({ square: sq, verbose: true }).filter(m => !seen.has(m.to) && seen.add(m.to)).map(m => ({ to: m.to }));
      };
      h.onMove = (from, to) => this.tryMove(from, to);
    } else if (t === 'tap' || t === 'guards') {
      h.onTap = sq => { if (!this.solved && !this.busy) (t === 'tap' ? this.tapSquare(sq) : this.tapGuard(sq)); };
    }
  }

  paintChoices() {
    const step = this.step, box = this.ui.choices;
    box.innerHTML = '';
    const button = (label, fn, cls = '') => {
      const b = document.createElement('button');
      b.type = 'button';
      b.className = 'choice ' + cls;
      b.innerHTML = label;
      b.onclick = () => fn(b);
      box.appendChild(b);
      return b;
    };
    if (step.task === 'pick') {
      step.opts.forEach((o, i) => button(o, b => this.pick(i, b)));
    } else if (step.task === 'escape') {
      const calls = step.calls || (this.chess.inCheck() ? ['mate'] : ['stalemate']);
      if (calls.includes('mate')) button('No way out. It is checkmate.', b => this.call('mate', b), 'call');
      if (calls.includes('stalemate')) button('No legal move. It is stalemate.', b => this.call('stalemate', b), 'call');
    } else if (step.task === 'survive') {
      button(`Nothing helps. ${sideName(this.chess.turn() === 'w' ? 'b' : 'w')} mates whatever I play.`, b => this.call('lost', b), 'call');
    } else if (step.task === 'mate' && (step.calls || []).includes('nomate')) {
      button('There is no mate in one here.', b => this.call('nomate', b), 'call');
    } else if (step.task === 'line' && (step.calls || []).includes('nomate')) {
      button(`${sideName(this.chess.turn())} cannot force mate here.`, b => this.call('nomate', b), 'call');
    }
  }

  async tryMove(from, to) {
    if (this.busy || this.solved) return;
    const options = this.chess.moves({ square: from, verbose: true }).filter(m => m.to === to);
    if (!options.length) {
      const why = explainIllegal(this.chess, from, to);
      if (why) {
        this.board.shake(from);
        this.decorate(why.arrows, { [to]: 'bad' });
        this.feedback('no', why.text);
      }
      return;
    }
    let move = options[0];
    if (options.length > 1) {
      const piece = await this.board.promote(this.chess.turn());
      if (!piece) return;
      move = options.find(m => m.promotion === piece);
    }
    const run = this.run, step = this.step;
    const made = this.make(move);
    const san = bare(made.san);

    if (step.task === 'escape') {
      if (step.sol && !step.sol.map(bare).includes(san)) {
        this.mistakes++;
        this.feedback('no', (step.wrong && step.wrong[san]) || step.other || 'That does get out of check. But this lesson is after a different way. Look again.');
        return this.takeBack(run, 1500);
      }
      const how = {
        'king-takes': 'The King captures the attacker.', flee: 'The King steps out of the line of fire.',
        'piece-takes': `The ${NAME[made.piece]} captures the attacker.`, block: `The ${NAME[made.piece]} blocks the check.`,
      }[escapeKind(made)];
      return this.finish(this.chess.isCheckmate() ? 'Out of check, and it is checkmate the other way.' : how);
    }

    if (step.task === 'survive') {
      if (step.sol && !step.sol.map(bare).includes(san)) {
        // it avoids mate, but the lesson wants the defence that costs nothing
        this.mistakes++;
        this.feedback('no', (step.wrong && step.wrong[san]) || step.other || 'That loses material for nothing. Find the defence that is protected.');
        const grab = this.chess.moves({ verbose: true }).find(m => m.to === made.to && m.captured);
        if (grab) {
          this.busy = true;
          await sleep(700);
          if (run !== this.run) return;
          this.make(grab, [[grab.from, grab.to, 'red']]);
        }
        return this.takeBack(run, 1800);
      }
      const killer = this.mateWithin(step.n || 1);
      if (!killer) return this.finish(`That holds. ${sideName(this.chess.turn())} has no mate.`);
      this.mistakes++;
      this.feedback('no', `That does not help: ${sideName(this.chess.turn())} plays <b>${bare(killer.san)}</b>${killer.san.includes('#') ? ', mate.' : ' and mate follows.'}`);
      this.busy = true;
      await sleep(700);
      if (run !== this.run) return;
      this.make(killer, [[killer.from, killer.to, 'red']]);
      return this.takeBack(run, 1800);
    }

    if (step.task === 'mate') {
      if (this.chess.isCheckmate()) return this.finish('Checkmate.');
      this.mistakes++;
      if (this.chess.isStalemate()) {
        this.feedback('no', `Stalemate. ${sideName(this.chess.turn())} has no legal move and is not in check, so the game is a draw.`);
      } else if (!this.chess.inCheck()) {
        this.feedback('no', 'That is not check, so it cannot be mate.');
      } else {
        const esc = bestEscape(this.chess);
        this.feedback('no', `Check, but not mate: ${describeEscape(esc)}`);
        this.busy = true;
        await sleep(700);
        if (run !== this.run) return;
        this.make(esc, [[esc.from, esc.to, 'red']]);
      }
      return this.takeBack(run, 1700);
    }

    if (step.task === 'line') {
      const live = (this.lines || []).filter(l => l[this.ply] && bare(l[this.ply]) === san);
      const total = this.lines ? Math.max(...this.lines.map(l => l.length)) : (step.n || 1) * 2 - 1;
      const left = Math.ceil((total - this.ply) / 2); // my moves left, this one included
      const mateGoal = step.goal !== 'win';
      if (mateGoal && this.chess.isCheckmate()) return this.finish('Checkmate.');
      if (live.length) {
        this.lines = live;
        if (this.ply + 1 >= live[0].length) return this.finish(step.goal === 'win' ? 'That is the move.' : 'Checkmate.');
        return this.answer(run, live[0][this.ply + 1], 'Yes. Keep going.');
      }
      // off the book line: is it still a forced mate? (only checked when it is quick to work out)
      let reply = step.bad && step.bad[san];
      if (!reply && mateGoal && left - 1 <= 2) {
        if (left - 1 === 2) { this.busy = true; this.feedback('info', 'Checking that...'); await sleep(30); if (run !== this.run) return; this.busy = false; }
        const r = spoiler(this.chess, left - 1);
        if (!r && this.chess.moves().length && this.lines) {
          this.lines = [[...Array(this.ply + 1).fill('?'), this.chess.moves()[0], ...Array(Math.max(0, (left - 1) * 2 - 1)).fill('*')]];
          return this.answer(run, this.chess.moves()[0], 'That works too. Finish it off.');
        }
        reply = r && r.san;
      }
      this.mistakes++;
      if (reply) {
        this.feedback('no', `${sideName(this.chess.turn())} answers <b>${bare(reply)}</b>, and the attack is over.`);
        this.busy = true;
        await sleep(700);
        if (run !== this.run) return;
        const r = this.chess.moves({ verbose: true }).find(m => bare(m.san) === bare(reply));
        if (r) this.make(r, [[r.from, r.to, 'red']]);
      } else {
        this.feedback('no', step.other || 'Not this time. Take it back and look again.');
      }
      return this.takeBack(run, 1700);
    }
  }

  // play the other side's reply in a line, then hand the move back
  async answer(run, san, note) {
    this.busy = true;
    this.feedback('info', note);
    await sleep(600);
    if (run !== this.run) return;
    const reply = this.chess.moves({ verbose: true }).find(m => bare(m.san) === bare(san)) || this.chess.moves({ verbose: true })[0];
    this.make(reply);
    this.ply += 2;
    this.home = this.chess.fen();
    this.busy = false;
    // after leaving the book line, any forced mate is accepted
    if (this.lines[0][this.ply] === '*') this.lines = [[...this.lines[0]]];
  }

  // the mate (first move) the side to move can force within n moves, if any
  mateWithin(n) {
    for (let d = 1; d <= n; d++) { const m = forcedMate(this.chess, d); if (m) return m; }
    return null;
  }
  // moves for the side in trouble after which no mate follows within n
  savers(n) {
    const out = [];
    for (const m of this.chess.moves({ verbose: true })) {
      this.chess.move(m);
      if (!this.mateWithin(n)) out.push(m);
      this.chess.undo();
    }
    return out;
  }

  make(move, arrows) {
    const made = this.chess.move(move);
    this.last = { from: made.from, to: made.to };
    this.board.set(pieceMap(this.chess), { move: this.last });
    this.decorate(arrows);
    return made;
  }
  async takeBack(run, wait) {
    this.busy = true;
    await sleep(wait);
    if (run !== this.run) return;
    this.chess = new Chess(this.home, { skipValidation: true });
    this.last = null;
    this.board.set(pieceMap(this.chess));
    this.decorate();
    this.busy = false;
  }

  call(what, btn) {
    if (this.solved || this.busy) return;
    const step = this.step;
    const truth = what === 'mate' ? this.chess.isCheckmate()
      : what === 'stalemate' ? this.chess.isStalemate()
      : what === 'lost' ? this.savers(step.n || 1).length === 0
      : step.task === 'line' ? !step.sol : matingMoves(this.chess).length === 0;
    if (truth) {
      btn.classList.add('right');
      return this.finish({ mate: 'Checkmate. There is no capture, no block and no safe square.', stalemate: 'Stalemate. No legal move, and no check: the game is a draw.', nomate: 'Right. There is no mate here.', lost: 'Right. Nothing saves the King.' }[what]);
    }
    this.mistakes++;
    btn.classList.add('wrong');
    btn.disabled = true;
    this.feedback('no', {
      mate: this.chess.inCheck() ? 'Not mate. There is a way out of this check. Find it on the board.' : 'The King is not in check, so it cannot be checkmate.',
      stalemate: this.chess.inCheck() ? 'The King is in check, so this cannot be stalemate.' : 'There is a legal move. Find it on the board.',
      nomate: 'There is a mate. Look at every check.',
      lost: 'There is a defence. Find the move that holds.',
    }[what]);
  }

  pick(i, btn) {
    if (this.solved) return;
    const step = this.step;
    if (i === step.ans) { btn.classList.add('right'); return this.finish(''); }
    this.mistakes++;
    btn.classList.add('wrong');
    btn.disabled = true;
    this.feedback('no', (step.no && step.no[i]) || 'Not quite. Look at the board again.');
  }

  tapSquare(sq) {
    const step = this.step;
    if (this.found.has(sq)) return;
    if (step.squares.includes(sq)) {
      this.found.add(sq);
      this.decorate();
      if (this.found.size >= (step.need || step.squares.length)) return this.finish('');
      return this.feedback('info', `Yes. ${(step.need || step.squares.length) - this.found.size} more.`);
    }
    this.mistakes++;
    this.decorate(null, { [sq]: 'bad' });
    this.feedback('no', (step.no && step.no[sq]) || step.other || 'Not that square.');
  }

  letters() { return Object.entries(this.step.labels).map(([sq, l]) => [l, sq]).sort((a, b) => a[0].localeCompare(b[0])); }
  guardColour() { return this.step.by || (this.chess.turn() === 'w' ? 'b' : 'w'); }
  guardsOf(sq) {
    const copy = new Chess(this.chess.fen(), { skipValidation: true });
    const k = kingSquare(copy, this.chess.turn());
    if (k) copy.remove(k);      // the King cannot hide behind himself
    return copy.attackers(sq, this.guardColour());
  }
  tapGuard(sq) {
    const p = this.chess.get(sq), [letter, target] = this.letters()[this.gi];
    if (!p || p.color !== this.guardColour()) return;
    if (!this.guardsOf(target).includes(sq)) {
      this.mistakes++;
      this.board.shake(sq);
      return this.feedback('no', `The ${NAME[p.type]} on ${sq} does not reach square ${letter}.`);
    }
    this.kept.push([sq, target, 'green']);
    this.gi++;
    if (this.gi >= this.letters().length) { this.decorate(); return this.finish(''); }
    this.decorate(null, { [this.letters()[this.gi][1]]: 'ring' });
    this.ui.ask.innerHTML = this.askText();
    this.feedback('info', `Yes, the ${NAME[p.type]} guards ${letter}.`);
  }

  // ---------- solved, hints, answers ----------
  finish(lead) {
    const step = this.step;
    this.solved = true;
    this.busy = false;
    this.store.mark(this.stepKey, this.revealed ? 'shown' : this.mistakes ? 'retry' : 'ok');
    this.decorate();
    this.board.select(null);
    const text = [lead, step.done].filter(Boolean).join(' ');
    this.feedback(this.revealed ? 'info' : 'yes', text || 'Right.');
    this.ui.hint.disabled = this.ui.show.disabled = true;
    this.ui.choices.querySelectorAll('button').forEach(b => { b.disabled = true; });
    this.ui.ask.innerHTML = this.askText();
    this.ui.ask.hidden = !this.ui.ask.innerHTML;
    this.paintNext();
    if (step.demo) this.demo(step.demo);
  }

  hint() {
    if (this.solved || this.busy) return;
    const step = this.step;
    this.hinted = true;
    const auto = {
      escape: 'Three ways out of check: capture the checking piece, block the line, or move the King. Try each one on the board.',
      survive: 'A block only helps if the blocker is protected, or if taking it does not give mate. Try each defence and watch the reply.',
      mate: 'Look at every check. Then ask whether the King can capture, block or run.',
      line: 'Start with a check the other side can only answer one way.',
      pick: 'Work it out on the board before you choose.',
      tap: 'Check the squares one by one.',
      guards: 'Follow each piece along its lines to the lettered square.',
    }[step.task];
    this.feedback('info', step.hint || auto);
  }

  async reveal() {
    if (this.solved || this.busy) return;
    const step = this.step, run = ++this.run;
    this.revealed = true;
    this.chess = new Chess(this.home, { skipValidation: true });
    this.last = null;
    this.board.set(pieceMap(this.chess));
    this.decorate();
    this.busy = true;
    const find = san => this.chess.moves({ verbose: true }).find(m => bare(m.san) === bare(san));
    if (step.task === 'mate') {
      const m = matingMoves(this.chess)[0];
      if (!m) return this.finish('There is no mate in one here.');
      this.make(m, [[m.from, m.to, 'gold']]);
      return this.finish(`${bare(m.san)} is checkmate.`);
    }
    if (step.task === 'escape') {
      const m = step.sol ? find(step.sol[0]) : bestEscape(this.chess);
      if (!m) return this.finish(this.chess.inCheck() ? 'It is checkmate: no capture, no block, no safe square.' : 'It is stalemate: no legal move, and no check.');
      this.make(m, [[m.from, m.to, 'gold']]);
      return this.finish(`${bare(m.san)} gets out.`);
    }
    if (step.task === 'survive') {
      const m = step.sol ? find(step.sol[0]) : this.savers(step.n || 1)[0];
      if (!m) return this.finish('Nothing saves the King here.');
      this.make(m, [[m.from, m.to, 'gold']]);
      return this.finish(`${bare(m.san)} holds.`);
    }
    if (step.task === 'line' && !this.lines) return this.finish('There is no forced mate here.');
    if (step.task === 'line') {
      for (const san of this.lines[0].slice(this.ply)) {
        const m = find(san);
        if (!m) break;
        this.make(m, [[m.from, m.to, 'gold']]);
        await sleep(900);
        if (run !== this.run) return;
      }
      return this.finish('That is the line.');
    }
    if (step.task === 'pick') {
      this.ui.choices.querySelectorAll('button')[step.ans].classList.add('right');
      return this.finish('');
    }
    if (step.task === 'tap') { step.squares.forEach(s => this.found.add(s)); return this.finish(''); }
    if (step.task === 'guards') {
      this.kept = this.letters().map(([, sq]) => [this.guardsOf(sq)[0], sq, 'green']).filter(a => a[0]);
      this.gi = this.letters().length - 1;
      return this.finish('');
    }
  }

  // play moves out on the board: ['Kxg8', {m: 'Qh7', say: '...'}, {fen: '...'}]
  async demo(list) {
    const run = this.run;
    for (const item of list) {
      await sleep(850);
      if (run !== this.run) return;
      const it = typeof item === 'string' ? { m: item } : item;
      if (it.fen) {
        this.chess = load(it.fen);
        this.last = null;
        this.board.set(pieceMap(this.chess));
        this.decorate(it.arrows);
      } else {
        const m = this.chess.moves({ verbose: true }).find(x => bare(x.san) === bare(it.m));
        if (!m) return;
        this.make(m, it.arrows || [[m.from, m.to, 'gold']]);
      }
      if (it.say) this.feedback(this.solved && !this.revealed ? 'yes' : 'info', it.say);
    }
  }

  // ---------- chapter end and contents ----------
  tally(ch) {
    const out = { ok: 0, retry: 0, shown: 0, open: 0, missed: [] };
    ch.frames.forEach((fr, i) => {
      if (!fr.steps.some(s => s.task)) return;
      const st = this.store.frameStatus(ch.id, fr);
      out[st || 'open']++;
      if (st !== 'ok') out.missed.push(i);
    });
    return out;
  }
  endOfChapter() {
    this.run++;
    this.ended = true;
    const t = this.tally(this.ch), ui = this.ui;
    const idx = this.book.chapters.findIndex(c => c.id === this.ch.id);
    const nextCh = this.book.chapters.slice(idx + 1).find(c => c.file);
    ui.kind.textContent = 'Chapter complete';
    ui.seal.textContent = '✓';
    ui.pips.innerHTML = '';
    ui.title.textContent = this.ch.title;
    ui.say.innerHTML = `<p>You have worked through every frame of this chapter.</p>
      <ul class="tally"><li><b>${t.ok}</b> solved first try</li><li><b>${t.retry}</b> solved after a miss</li>
      <li><b>${t.shown}</b> shown</li>${t.open ? `<li><b>${t.open}</b> skipped</li>` : ''}</ul>`;
    ui.ask.hidden = true;
    this.feedback(null);
    ui.choices.innerHTML = '';
    const add = (label, fn) => {
      const b = document.createElement('button');
      b.type = 'button'; b.className = 'choice'; b.textContent = label; b.onclick = fn;
      ui.choices.appendChild(b);
    };
    if (t.missed.length) add(`Go back over the ${t.missed.length} you missed`, () => { this.ended = false; this.f = t.missed[0]; this.s = 0; this.enter(); });
    if (nextCh) add(`Start chapter ${nextCh.n}: ${nextCh.title}`, () => this.open(nextCh.id));
    add('Back to the library', () => { location.href = '../index.html'; });
    ui.hint.hidden = ui.show.hidden = true;
    ui.next.classList.remove('ready');
    ui.next.textContent = 'Next';
    ui.fill.style.width = '100%';
  }

  async openDrawer() {
    const body = this.ui.drawerBody;
    body.innerHTML = '';
    for (const meta of this.book.chapters) {
      const sec = document.createElement('section');
      sec.className = 'toc-chapter';
      sec.innerHTML = `<h3>${meta.n ? `<span>${meta.n}</span>` : ''}${meta.title}</h3>`;
      if (!meta.file) {
        sec.insertAdjacentHTML('beforeend', '<p class="toc-soon">Not built yet.</p>');
      } else {
        const ch = await this.chapter(meta.id);
        const grid = document.createElement('div');
        grid.className = 'toc-grid';
        ch.frames.forEach((fr, i) => {
          const b = document.createElement('button');
          b.type = 'button';
          const st = this.store.frameStatus(ch.id, fr);
          b.className = 'toc-frame ' + (st || '') + (ch.id === this.ch.id && i === this.f ? ' here' : '');
          b.textContent = fr.n;
          b.title = fr.title || '';
          b.onclick = () => { this.ui.drawer.hidden = true; this.open(ch.id, i, 0); };
          grid.appendChild(b);
        });
        sec.appendChild(grid);
      }
      body.appendChild(sec);
    }
    const legend = document.createElement('div');
    legend.className = 'toc-legend';
    legend.innerHTML = '<span><i class="ok"></i>first try</span><span><i class="retry"></i>after a miss</span><span><i class="shown"></i>shown</span>';
    body.appendChild(legend);
    const reset = document.createElement('button');
    reset.type = 'button';
    reset.className = 'btn ghost toc-reset';
    reset.textContent = 'Reset my progress in this book';
    reset.onclick = () => {
      if (reset.dataset.armed) {
        this.store.data = { pos: null, steps: {} };
        this.store.save();
        this.ui.drawer.hidden = true;
        this.open(this.book.chapters.find(c => c.file).id);
      } else { reset.dataset.armed = '1'; reset.textContent = 'Tap again to erase all progress'; }
    };
    body.appendChild(reset);
    this.ui.drawer.hidden = false;
    const here = body.querySelector('.here');
    if (here) here.scrollIntoView({ block: 'center' });
  }
}

export async function start(book, base) {
  const player = new Player(book, base, document.getElementById('app'));
  window.player = player;
  await player.start();
  return player;
}
