// Chapter 1: Elements of Checkmate (frames 1-79).
// Positions are the book's diagrams; the teaching text is written for this app.
// `check` is what the rules engine must agree with (tools/verify.mjs); the player ignores it.
const START = 'rnbqkbnr/pppppppp/8/8/8/8/PPPPPPPP/RNBQKBNR w';
const OUT = 'You are Black, and you are in check. Get out of it on the board, or call it checkmate.';
const MATE1 = 'White to move. Give checkmate in one move.';
const MATE_OR_NOT = 'White to move. Give checkmate in one move, or say there is none.';

export default {
  id: 'ch1', n: 1, title: 'Elements of Checkmate',
  frames: [
    { n: 1, title: 'How this works', steps: [
      { fen: START, say: '<p>This is the book, played instead of read. Every numbered frame is a position on this one board, and you answer by <b>moving the pieces</b>.</p><p>Tap a piece to see where it can go, then tap the square. Dragging works too. If a move is not allowed, the board tells you why. That is where most of the learning happens.</p><p><b>Hint</b> nudges you, <b>Show me</b> plays the answer, and the counter at the top right opens the contents.</p>' },
    ] },
    { n: 2, title: 'Reading the board', steps: [
      { fen: START, say: '<p>White always starts at the bottom and moves up the board. Black starts at the top and moves down.</p><p>Columns are lettered <b>a</b> to <b>h</b>, rows are numbered <b>1</b> to <b>8</b>, so every square has a name: the White King starts on <b>e1</b>.</p>', ask: 'Tap the White King.', task: 'tap', squares: ['e1'], check: 'tap', other: 'That is not the King. He is the tall piece with the cross, on e1.' },
      { fen: START, say: '<p>The Queen stands next to her King, and always starts on a square of her own colour.</p>', ask: 'Tap the Black Queen.', task: 'tap', squares: ['d8'], check: 'tap', other: 'The Black Queen is on d8, on the top row.' },
    ] },
    { n: 3, title: 'If you already play', steps: [
      { fen: START, say: '<p>The first part of this chapter is for someone who has never been checkmated on purpose. If you already know what checkmate is, open the contents (top right) and jump to <b>frame 39</b>, where the real testing starts.</p><p>If frame 39 feels hard, come back to frame 5.</p>' },
    ] },

    { n: 4, title: 'The object of the game', steps: [
      { fen: '8/8/8/K5p1/5b2/8/6r1/2R4k b', arrows: [['c1', 'h1', 'red']], say: '<p>The aim of chess is to attack the enemy King so that he cannot avoid capture.</p><p>Here the White Rook attacks the Black King along the bottom row. That is <b>check</b>. A King in check must get out of it at once, and there are exactly <b>three ways</b>. You will play all three.</p>' },
      { fen: '8/8/8/K5p1/5b2/8/6r1/2R4k b', title: 'Way one: capture', ask: 'You are Black. Capture the Rook that is giving check.', task: 'escape', sol: ['Bxc1'], check: 'legal:Bxc1', other: 'That does get out of check, but this time take the Rook. One Black piece can reach it.', hint: 'Bishops move on diagonals. Follow the one from f4 down to the left.', done: 'The checking piece is gone, so the check is gone.' },
      { fen: '8/8/8/K5p1/5b2/8/6r1/2R4k b', title: 'Way two: block', ask: 'Same check. This time block it: put a piece between the Rook and your King.', task: 'escape', sol: ['Rg1'], check: 'legal:Rg1', other: 'That works, but now block the line instead. Your Rook can step in between.', hint: 'Your Rook on g2 can drop one square.', done: 'Putting a piece in the way is called <b>interposing</b>.' },
      { fen: '8/8/8/K5p1/5b2/8/6r1/2R4k b', title: 'Way three: run', ask: 'Same check again. This time move the King out of it.', task: 'escape', sol: ['Kh2'], check: 'legal:Kh2', other: 'That works, but now move the King himself to a safe square.', hint: 'The Rook attacks the whole bottom row. Step off it.', done: 'Capture, block or run. Those are the only three ways out of any check.' },
      { fen: '8/1K6/8/8/6Qk/8/8/6R1 b', title: 'When nothing works', say: '<p>Now the White Queen gives check from the next square.</p>', ask: 'Try all three ways out. If none of them works, call it.', task: 'escape', check: 'mated', done: 'Capture? The Rook on g1 protects the Queen. Block? There is no square in between. Run? The Queen covers every square the King could reach. No way out is <b>checkmate</b>, and the game is over.', doneArrows: [['g1', 'g4', 'green']] },
      { fen: '8/8/8/4K2p/7P/6Q1/8/7k b', title: 'No check, no move', say: '<p>A different trap. Black is <b>not</b> in check here.</p>', ask: 'You are Black. Find a legal move, or say what this is.', task: 'escape', calls: ['mate', 'stalemate'], check: 'stalemate', done: 'Every square next to the King is covered by the Queen, and the Pawn is blocked. With no legal move and no check the game is a <b>draw</b>. Never stalemate an opponent you are beating.' },
    ] },

    { n: 5, title: 'Check or checkmate?', steps: [
      { fen: '4Rk2/5ppp/8/8/8/8/6KP/8 b', say: '<p>The whole difference between a check and a checkmate often comes down to one detail. Six positions, in pairs. Watch what changes.</p>', ask: OUT, task: 'escape', check: 'only:Kxe8', done: 'Nothing protects the Rook, so the King simply takes it.' },
      { fen: '4R1k1/5ppp/8/8/8/8/6KP/8 b', say: '<p>The same check, but your King stands one square further away.</p>', ask: OUT, task: 'escape', check: 'mated', done: 'The King moves only one square, so the Rook is out of reach. His own Pawns block the way forward. Checkmate.' },
      { fen: '8/8/8/kQ6/8/6K1/8/8 b', say: '<p>The Queen has cornered your King against the edge.</p>', ask: OUT, task: 'escape', check: 'only:Kxb5', done: 'A Queen that checks from the next square, with nothing behind her, is just a free Queen.' },
      { fen: '4B3/8/8/kQ6/8/6K1/8/8 b', say: '<p>The same Queen check, with a White Bishop added far away.</p>', ask: OUT, task: 'escape', check: 'mated', done: 'The Bishop protects the Queen along the diagonal, so the King cannot take her. Checkmate.', doneArrows: [['e8', 'b5', 'green']] },
      { fen: 'k7/1Q6/p7/5K2/8/8/8/8 b', say: '<p>Again the Queen checks from right next to your King.</p>', ask: OUT, task: 'escape', check: 'only:Kxb7', done: 'Unprotected, so the King takes.' },
      { fen: 'k7/1Q6/p7/5K2/8/8/8/1R6 b', say: '<p>One more piece on the board: a White Rook at the bottom of the same column.</p>', ask: OUT, task: 'escape', check: 'mated', done: 'Now the Rook protects the Queen all the way up the column. Before you take a checking piece, always ask: <b>is it protected?</b>', doneArrows: [['b1', 'b7', 'green']] },
    ] },

    { n: 6, title: 'Can the King take it?', steps: [
      { fen: '7k/6pQ/8/5B2/8/8/8/4K3 b', say: '<p>The White Queen is giving check.</p>', ask: OUT, task: 'escape', check: 'mated', done: 'The Bishop on f5 protects the Queen, so the King cannot capture. He has no safe square either.', doneArrows: [['f5', 'h7', 'green']] },
    ] },
    { n: 7, title: 'Can the King take it?', steps: [
      { fen: 'k7/Q7/8/8/2B5/8/8/4K3 b', say: '<p>Queen and Bishop again. Look at where the Bishop is pointing.</p>', ask: OUT, task: 'escape', check: 'only:Kxa7', done: 'The Bishop is on the wrong diagonal. It does not protect the Queen, so the King takes her.' },
    ] },
    { n: 8, title: 'Rook and Knight', steps: [
      { fen: '6Rk/7p/8/5N2/8/8/8/6K1 b', say: '<p>The Rook checks. A White Knight stands nearby.</p>', ask: OUT, task: 'escape', check: 'only:Kxg8', done: 'From f5 the Knight does not reach g8. The Rook was not protected.' },
    ] },
    { n: 9, title: 'Rook and Knight', steps: [
      { fen: '6Rk/4N2p/8/8/8/8/8/4K3 b', say: '<p>The same Rook check, with the Knight on a different square.</p>', ask: OUT, task: 'escape', check: 'mated', done: 'From e7 the Knight protects the Rook. The King cannot take it, and his own Pawn fills the only other square.', doneArrows: [['e7', 'g8', 'green']] },
    ] },
    { n: 10, title: 'Rook in the corner', steps: [
      { fen: 'R7/kp6/1p6/8/8/8/1K6/8 b', say: '<p>The Rook checks from the corner, right next to your King.</p>', ask: OUT, task: 'escape', check: 'only:Kxa8', done: 'Nothing protects it. The King takes the Rook.' },
    ] },
    { n: 11, title: 'Out of reach', steps: [
      { fen: 'k1R5/pp6/8/8/8/4K3/8/8 b', say: '<p>Nothing protects this Rook either.</p>', ask: OUT, task: 'escape', check: 'mated', done: 'The Rook is two squares away and the King moves only one. Hemmed in by his own Pawns, he is mated.' },
    ] },

    { n: 12, title: 'Flight squares', steps: [
      { fen: 'kr6/1pN5/p7/8/8/1P6/PK6/8 b', say: '<p>Sometimes the King escapes by stepping to a safe square, a <b>flight square</b>. Three more pairs.</p><p>The Knight gives check. A Knight check can never be blocked.</p>', ask: OUT, task: 'escape', check: 'only:Ka7', done: 'One free square is enough.' },
      { fen: 'kr6/ppN5/8/8/8/1P6/PK6/8 b', say: '<p>The same check. Black has one more Pawn, and it stands on the square the King needs.</p>', ask: OUT, task: 'escape', check: 'mated', done: 'This is a <b>smothered mate</b>: the King is boxed in by his own pieces, and a single Knight finishes him.' },
      { fen: '2Q2k2/5ppp/8/8/8/6PP/5PK1/q7 b', say: '<p>The White Queen checks along the back row.</p>', ask: OUT, task: 'escape', check: 'only:Ke7', done: 'The King steps up and out.' },
      { fen: '3Q1k2/5ppp/8/8/8/6PP/5PK1/q7 b', say: '<p>The Queen checks from one square closer.</p>', ask: OUT, task: 'escape', check: 'mated', done: 'From d8 the Queen gives check and also covers the flight square e7. Checkmate.', doneArrows: [['d8', 'e7', 'green']] },
      { fen: 'R5k1/5p1p/6p1/8/8/5P2/8/6K1 b', say: '<p>A Rook check on the back row. The Pawn on g6 has moved up and left a hole behind it.</p>', ask: OUT, task: 'escape', check: 'only:Kg7', done: 'The hole at g7 is a flight square.' },
      { fen: 'R5k1/5p1p/6p1/8/3B4/5P2/8/6K1 b', say: '<p>The same check, with a White Bishop added.</p>', ask: OUT, task: 'escape', check: 'mated', done: 'The Bishop covers g7 from across the board. One piece checks, another takes away the flight square.', doneArrows: [['d4', 'g7', 'green']] },
    ] },

    { n: 13, title: 'Capture, run, or neither', steps: [
      { fen: '7k/7p/8/3B4/3B4/6K1/8/8 b', say: '<p>From here on you decide for yourself: can the King capture the attacker, can he run, or is it mate?</p>', ask: OUT, task: 'escape', check: 'mated', done: 'One Bishop checks along the long diagonal and the other covers g8. Two Bishops side by side sweep the whole corner.', doneArrows: [['d5', 'g8', 'green']] },
    ] },
    { n: 14, title: 'Capture, run, or neither', steps: [
      { fen: '4k2q/2pp1Q2/8/1b2N3/p7/8/3P1PP1/4K3 b', say: '<p>A busier board. Look at every square around your King.</p>', ask: OUT, task: 'escape', check: 'only:Kd8', done: 'The Knight protects the Queen, so she cannot be taken. But d8 is free.' },
    ] },
    { n: 15, title: 'Capture, run, or neither', steps: [
      { fen: '4R1k1/6p1/6Pp/8/8/8/6K1/8 b', ask: OUT, task: 'escape', check: 'mated', done: 'The White Pawn on g6 covers both f7 and h7. A Pawn can shut a King in as well as any piece.', doneArrows: [['g6', 'f7', 'green'], ['g6', 'h7', 'green']] },
    ] },
    { n: 16, title: 'Capture, run, or neither', steps: [
      { fen: '7k/4N1pR/8/8/8/8/3K4/8 b', ask: OUT, task: 'escape', check: 'only:Kxh7', done: 'The Knight on e7 guards g8 but not h7. The Rook was unprotected.' },
    ] },
    { n: 17, title: 'Check from a Pawn', steps: [
      { fen: 'rk6/1pP5/1P2Q3/8/8/8/8/7K b', say: '<p>This time the check comes from a Pawn.</p>', ask: OUT, task: 'escape', check: 'mated', done: 'The Pawn on c7 is protected by the Pawn behind it, and the Queen covers c8. Mated by a Pawn.' },
    ] },
    { n: 18, title: 'Capture, run, or neither', steps: [
      { fen: '5Rk1/6pp/3Q4/8/8/8/6K1/8 b', ask: OUT, task: 'escape', check: 'mated', done: 'The Queen protects the Rook along the diagonal. The King cannot take it and has nowhere to go.', doneArrows: [['d6', 'f8', 'green']] },
    ] },
    { n: 19, title: 'Fischer against Keres', steps: [
      { fen: '8/8/2P5/3K1k2/2R3p1/2q5/8/8 b', say: '<p>Now you give the mate. This position is from a real game: Bled, 1959. Fischer had the Black pieces against Paul Keres, one of the best players in the world.</p>', ask: 'Black to move. Give checkmate in one move.', task: 'mate', check: 'mate:Qe5', hint: 'The Black King can protect his own Queen.', done: 'The Queen checks from next door, protected by her King, and covers every square the White King could run to.' },
    ] },
    { n: 20, title: 'Who guards what?', steps: [
      { fen: '2R3k1/8/6P1/5N2/6K1/8/8/8 b', labels: { f8: 'A', f7: 'B', g7: 'C', h7: 'D', h8: 'E' }, say: '<p>The Rook has checked and Black is mated. Every square the King might use is guarded by some White piece.</p>', task: 'guards', check: 'mated', done: 'Rook, Pawn, Knight, Pawn, Rook. A mate is a net: every piece holds part of it. (The Rook guards E because once the King steps there, nothing stands between them.)' },
    ] },
    { n: 21, title: 'Who guards what?', steps: [
      { fen: '2B1k3/6P1/6K1/Q2N4/8/8/8/8 b', labels: { d8: 'A', d7: 'B', e7: 'C', f7: 'D', f8: 'E' }, say: '<p>Five squares around the Black King, five different guards.</p>', task: 'guards', check: 'stalemate', done: 'Queen, Bishop, Knight, King, Pawn. Now look again: which White piece is giving check?' },
      { fen: '2B1k3/6P1/6K1/Q2N4/8/8/8/8 b', title: 'So what is it?', ask: 'Black to move. Find a legal move, or say what this is.', task: 'escape', calls: ['mate', 'stalemate'], check: 'stalemate', done: 'No White piece attacks the King. Every square is guarded but there is no check, so this is a draw. White had five pieces more and threw the win away.' },
    ] },
    { n: 22, title: 'Fischer against Larsen', steps: [
      { fen: '3r1k2/1q1P2b1/7Q/p3p2p/1p6/1B3P2/PPP5/1K1R4 w', say: '<p>From Fischer\'s game with Bent Larsen at Portoroz, 1958. Fischer has White.</p>', ask: MATE1, task: 'mate', check: 'mate:Qd6', hint: 'The Bishop on b3 already guards two of the King\'s squares. The Pawn on d7 guards another.', done: 'The Queen checks along the diagonal. The Bishop on b3 covers f7 and g8, the Pawn covers e8, and no Black piece can get in between.' },
    ] },
    { n: 23, title: 'The one safe square', steps: [
      { fen: 'Q2k4/8/2P5/1KB5/8/8/8/8 b', say: '<p>Black is in check, and there is exactly one square the King can go to.</p>', ask: 'You are Black. Find the flight square.', task: 'escape', check: 'only:Kc7', done: 'Each wrong square showed you its guard. Only c7 is uncovered.' },
    ] },
    { n: 24, title: 'The one safe square', steps: [
      { fen: '6k1/8/4KN1P/8/8/B7/8/8 b', ask: 'You are Black. Find the flight square.', task: 'escape', check: 'only:Kh8', done: 'King, Knight, Pawn and Bishop cover four squares between them. The corner is left.' },
    ] },
    { n: 25, title: 'An unusual way out', steps: [
      { fen: '8/8/8/2K4k/6R1/8/8/7Q b', say: '<p>This looks like mate. It is not.</p>', ask: OUT, task: 'escape', check: 'only:Kxg4', done: 'The only square left to the King has a White Rook on it, and the Rook is unprotected. So the King escapes by capturing it.' },
    ] },
    { n: 26, title: 'Can the King take the Rook?', steps: [
      { fen: 'K1q5/1r6/8/8/4k3/8/8/8 w', say: '<p>The other way round: now you are <b>White</b>, in check from the Queen. The Black Rook is right next to your King.</p>', ask: 'You are White. Get out of check, or call it checkmate.', task: 'escape', check: 'mated', done: 'The Queen gives check and protects the Rook at the same time.' },
    ] },
    { n: 27, title: 'The King helps', steps: [
      { fen: '7k/5K2/8/8/8/7R/8/8 b', say: '<p>One King can help trap the other. Late in a game, with few pieces left, the King is a strong attacking piece.</p>', ask: OUT, task: 'escape', check: 'mated', done: 'The Rook checks down the edge while the White King guards g7 and g8.', doneArrows: [['f7', 'g7', 'green'], ['f7', 'g8', 'green']] },
      { fen: '8/8/7k/5K2/8/8/7R/8 b', say: '<p>Almost the same picture, lower down the board.</p>', ask: OUT, task: 'escape', check: 'only:Kg7', done: 'Here the White King covers g5 and g6 but cannot reach g7.' },
    ] },
    { n: 28, title: 'Queen and King', steps: [
      { fen: '4k3/4Q3/3K4/8/8/8/8/8 b', ask: OUT, task: 'escape', check: 'mated', done: 'The Queen covers every flight square and her King protects her. This is the most common mate there is.' },
    ] },

    { n: 29, title: 'Other pieces can capture', steps: [
      { fen: '6kQ/5p2/5np1/8/8/7R/5K2/8 b', say: '<p>The King is not the only defender. Any piece that can capture the checker saves him. Three more pairs.</p>', ask: OUT, task: 'escape', check: 'mated', done: 'The Rook protects the Queen, and the Knight cannot reach her.' },
      { fen: '6kQ/5p2/5bp1/8/8/7R/5K2/8 b', say: '<p>The same position with a Bishop where the Knight was.</p>', ask: OUT, task: 'escape', check: 'only:Bxh8', done: 'The Bishop takes the Queen. It does not matter that she was protected: the check is over.' },
      { fen: '3qk3/3p1Q2/8/3B4/8/8/3P4/4K3 b', ask: OUT, task: 'escape', check: 'mated', done: 'The Bishop protects the White Queen, and the Black Queen cannot get at her.' },
      { fen: '3nk3/3p1Q2/8/3B4/8/8/3P4/4K3 b', say: '<p>A Knight instead of the Black Queen.</p>', ask: OUT, task: 'escape', check: 'only:Nxf7', done: 'A Knight on d8 reaches f7. Here the small piece is worth more than a Queen.' },
      { fen: 'r1b1R1k1/5ppp/8/8/8/6P1/5PKP/8 b', ask: OUT, task: 'escape', check: 'mated', done: 'Black\'s Rook would love to take, but his own Bishop stands in the way.' },
      { fen: 'r3R1k1/5ppp/8/5b2/8/6P1/5PKP/8 b', say: '<p>The Bishop has moved off the back row.</p>', ask: OUT, task: 'escape', check: 'only:Rxe8', done: 'With the row clear, Rook takes Rook.' },
    ] },
    { n: 30, title: 'What is the defence?', steps: [
      { fen: '5rk1/5ppQ/8/8/4B3/6P1/5P2/6K1 b', say: '<p>Four possibilities now: the King takes, the King runs, another piece takes, or it is mate.</p>', ask: OUT, task: 'escape', check: 'mated', done: 'The Bishop protects the Queen and the King\'s own Rook fills the square he needs.' },
    ] },
    { n: 31, title: 'What is the defence?', steps: [
      { fen: '6Rk/6p1/5N1n/8/8/8/8/2K5 b', ask: OUT, task: 'escape', check: 'only:Nxg8', done: 'The King cannot take a protected Rook. The Knight can.' },
    ] },
    { n: 32, title: 'What is the defence?', steps: [
      { fen: '8/8/1pn5/k7/R1P5/8/1P2K3/8 b', ask: OUT, task: 'escape', check: 'only:Kxa4', done: 'Nothing protects the Rook.' },
    ] },
    { n: 33, title: 'What is the defence?', steps: [
      { fen: '4rk1r/5pQ1/8/8/8/1K6/8/6R1 b', ask: OUT, task: 'escape', check: 'only:Ke7', done: 'The Queen is protected by the Rook behind her, but e7 is open.' },
    ] },
    { n: 34, title: 'What is the defence?', steps: [
      { fen: '5n1k/5pBp/7P/8/8/5P2/5K2/8 b', ask: OUT, task: 'escape', check: 'only:Kg8', done: 'The Pawn protects the Bishop, so the King steps aside.' },
    ] },
    { n: 35, title: 'What is the defence?', steps: [
      { fen: '7k/7p/5PN1/3B3P/8/5K2/8/8 b', ask: OUT, task: 'escape', check: 'only:hxg6', done: 'The Pawn takes the Knight. Even the smallest piece can be the defender.' },
    ] },

    { n: 36, title: 'Blocking the check', steps: [
      { fen: '1r6/kp6/1p6/5b2/3P4/1PK5/2P5/R7 b', say: '<p>The third way out: <b>interpose</b>. Put a piece on the line between the checker and the King.</p><p>First, a position where nothing can.</p>', ask: OUT, task: 'escape', check: 'mated', done: 'The Rook checks down the open column and no Black piece can reach it.' },
      { fen: '1r6/kp6/1p6/5r2/3P4/1PK5/2P5/R7 b', say: '<p>The same position with a Black Rook in place of the Bishop.</p>', ask: OUT, task: 'escape', check: 'only:Ra5', done: 'The Rook slides across and stands in the way.' },
      { fen: '3R2k1/5ppp/8/2b5/8/8/P5K1/8 b', say: '<p>A back-row check. This time a Bishop is the blocker.</p>', ask: OUT, task: 'escape', check: 'only:Bf8', done: 'The Bishop drops back in front of its King.' },
      { fen: '2R3k1/5ppp/6n1/8/4PP2/8/5K2/8 b', say: '<p>And here a Knight.</p>', ask: OUT, task: 'escape', check: 'only:Nf8', done: 'Any piece can interpose. Only a check from a Knight, or from the next square, cannot be blocked.' },
    ] },
    { n: 37, title: 'Which piece defends?', steps: [
      { fen: '2R4k/q5pp/7n/4b3/8/5KP1/8/8 b', say: '<p>The Rook is checking. One Black piece can deal with it.</p>', ask: OUT, task: 'escape', check: 'only:Ng8', done: 'The Knight interposes.' },
    ] },
    { n: 38, title: 'Which piece defends?', steps: [
      { fen: 'k7/1pqN4/Q1b5/8/8/1PP5/2KP4/8 b', say: '<p>The White Queen checks from a6.</p>', ask: OUT, task: 'escape', check: 'only:bxa6', done: 'The Pawn captures the Queen.' },
    ] },
    { n: 39, title: 'Mate, or a defence?', steps: [
      { fen: '3q3k/4Np1p/5B2/8/5nr1/8/7P/4R2K b', say: '<p>The real testing starts here. In some of these positions Black is mated. In others he can capture, run or block.</p>', ask: OUT, task: 'escape', check: 'only:Rg7', done: 'The Rook drops back and blocks the Bishop.' },
    ] },
    { n: 40, title: 'Mate, or a defence?', steps: [
      { fen: '3nk2Q/7p/3P4/3K1Bp1/5q2/8/7r/8 b', ask: OUT, task: 'escape', check: 'only:Kf7', done: 'One flight square, on f7.' },
    ] },
    { n: 41, title: 'A tricky one', steps: [
      { fen: '6k1/5Pp1/4n1Nq/4P1NP/6K1/8/8/8 b', say: '<p>Look at the whole board before you decide. The check comes from the Pawn.</p>', ask: OUT, task: 'escape', check: 'mated', done: 'One Knight protects the Pawn, the other guards f8 and h8, and h7 is covered too. Always count the Knights.' },
    ] },
    { n: 42, title: 'Another tricky one', steps: [
      { fen: '4Q2k/6p1/7p/5Bnq/3KP3/8/8/8 b', ask: OUT, task: 'escape', check: 'only:Qxe8', done: 'The Black Queen takes the White Queen from the far side of the board. Long diagonals are easy to miss.' },
    ] },
    { n: 43, title: 'Every piece counts', steps: [
      { fen: '6b1/1q4pk/1p1b2p1/r7/1npPn3/2P3P1/1P6/1KQ4R b', say: '<p>The positions get more crowded. The Rook checks down the edge.</p>', ask: OUT, task: 'escape', check: 'only:Rh5', done: 'The Rook on a5 crosses the whole board to block.' },
    ] },
    { n: 44, title: 'Fischer against Gligorich', steps: [
      { fen: 'r1b2rk1/1p1q4/p2N2pp/2pP4/2PbN3/3Q1Pn1/PP2B1KP/R4R2 w', say: '<p>Bled, 1961. Fischer has Black against Svetozar Gligorich, many times champion of Yugoslavia. A Black Knight sits on g3, in front of the White King.</p><p>Suppose White takes it with the Pawn. Watch.</p>', demo: ['hxg3'] },
      { fen: 'r1b2rk1/1p1q4/p2N2pp/2pP4/2PbN3/3Q1PP1/PP2B1K1/R4R2 b', ask: 'Black to move. Give checkmate in one move.', task: 'mate', check: 'mate:Qh3', hint: 'The Bishop on c8 looks all the way down a diagonal.', done: 'The Queen is protected by the Bishop on c8, and the Bishop on d4 covers f2 and g1. (In the game Gligorich did not take the Knight, and it ended in a draw.)' },
    ] },
    { n: 45, title: 'Watch the whole board', steps: [
      { fen: '5k2/r4pQ1/2q4p/8/1p3n2/p4P1P/PbP4K/4R1R1 b', say: '<p>The Queen gives check, protected by the Rook behind her.</p>', ask: OUT, task: 'escape', check: 'only:Bxg7', done: 'The Bishop comes from the opposite corner to take her.' },
    ] },
    { n: 46, title: 'A protected Rook', steps: [
      { fen: 'kr6/pp6/7r/8/8/6b1/6PP/R5BK w', say: '<p>Your turn to attack.</p>', ask: MATE1, task: 'mate', check: 'mate:Rxa7', done: 'The Rook takes the Pawn with check, and the Bishop in the far corner protects it.', doneArrows: [['g1', 'a7', 'green']] },
    ] },
    { n: 47, title: 'A famous mate', steps: [
      { fen: 'r2q1bnr/ppp1kBpp/2np4/3NN3/8/7P/PPPP1PP1/R1BbK2R b', say: '<p>White gave up his Queen to reach this. That is her on d1, taken by the Black Bishop.</p>', ask: OUT, task: 'escape', check: 'mated', done: 'Bishop and two Knights do the job. A Queen is worth giving up for a King.' },
    ] },
    { n: 48, title: 'Fischer against Letelier', steps: [
      { fen: '6k1/pp4bp/2n2np1/5p2/2P2K2/5BN1/PP5P/RQ6 b', say: '<p>Leipzig, 1960. Fischer, with Black, has just given up his Queen to drag the White King out to f4.</p>', ask: 'Black to move. Give checkmate in one move.', task: 'mate', check: 'mate:Bh6', done: 'A quiet Bishop move ends it. Letelier resigned rather than let it be played.' },
    ] },

    { n: 49, title: 'Pins', steps: [
      { fen: '4R1k1/5qpp/1p6/8/8/rP1B4/5bPP/7K b', say: '<p>A piece is <b>pinned</b> when moving it would expose its own King. A pinned piece loses most of its power. Three pairs.</p>', ask: 'You are Black, in check. Capture the Rook.', task: 'escape', sol: ['Qxe8'], check: 'legal:Qxe8', other: 'That gets out of check too. But take the Rook: the Queen can.', done: 'The Queen is free to capture.' },
      { fen: '4R1k1/5qpp/1p6/8/2B5/rP6/5bPP/7K b', say: '<p>The same check. The White Bishop has moved to c4.</p>', ask: OUT, task: 'escape', check: 'mated', done: 'The Bishop pins the Queen to her King. She cannot capture and she cannot block.', doneArrows: [['c4', 'f7', 'red']] },
      { fen: '5n1k/1q4p1/8/p7/1b6/1Br2P2/P5K1/7R b', say: '<p>The Rook checks down the edge.</p>', ask: OUT, task: 'escape', check: 'only:Nh7', done: 'The Knight interposes.' },
      { fen: '3Q1n1k/1q4p1/8/p7/1b6/1Br2P2/P5K1/7R b', say: '<p>The same check with a White Queen added on the back row.</p>', ask: OUT, task: 'escape', check: 'mated', done: 'The Queen pins the Knight along the back row, so it cannot step in front of the Rook.', doneArrows: [['d8', 'f8', 'red']] },
      { fen: '1k6/ppp5/5p1r/6p1/6P1/P4P2/1PP4r/2KQ4 w', say: '<p>Pins work against the attacker too.</p>', ask: MATE1, task: 'mate', check: 'mate:Qd8', done: 'The Queen runs up the open column to the back row.' },
      { fen: '1k6/ppp5/5p1r/6p1/6P1/P4P2/1PP5/2KQ3r w', say: '<p>The same position, but a Black Rook has reached your back row.</p>', ask: MATE_OR_NOT, task: 'mate', calls: ['nomate'], check: 'nomate', done: 'Your Queen is pinned by the Rook on h1. She cannot leave the row, so the mate is gone.', doneArrows: [['h1', 'd1', 'red']] },
    ] },
    { n: 50, title: 'Three pins at once', steps: [
      { fen: '2k1R3/1nbq3r/B4N2/p3P1p1/1p3P2/3P2PQ/1P6/1KR5 b', say: '<p>Black has a Queen, a Bishop and a Knight next to his King. Any one of them looks able to deal with the Rook.</p>', ask: 'You are Black. Try each defender in turn, then decide.', task: 'escape', check: 'mated', hint: 'Try taking the Rook with the Queen. Then try blocking with the Bishop, and with the Knight.', done: 'All three are pinned: the Queen by the White Queen, the Bishop by the Rook on c1, the Knight by the Bishop on a6.', doneArrows: [['h3', 'd7', 'red'], ['c1', 'c7', 'red'], ['a6', 'b7', 'red']] },
    ] },
    { n: 51, title: 'Several checks, one mate', steps: [
      { fen: '6rk/p5qp/7Q/1pr5/2p2N2/b1B5/2K5/8 w', say: '<p>White can check in several ways. Only one is mate.</p>', ask: MATE1, task: 'mate', check: 'mate:Ng6', done: 'The Black Queen is pinned by the Bishop and the Pawn on h7 is pinned by the Queen, so neither can take the Knight. Look at pins carefully: many combinations grow out of them.', doneArrows: [['c3', 'g7', 'red'], ['h6', 'h7', 'red']] },
    ] },
    { n: 52, title: 'Queen check or Rook check?', steps: [
      { fen: '7k/rbp3q1/6P1/5p2/8/1BB3K1/1P3P2/r3QR2 w', say: '<p>Two checks tempt you: the Queen up the board or the Rook across it.</p>', ask: MATE1, task: 'mate', check: 'mate:Qe8', done: 'The Black Queen is pinned and cannot block the Queen check. The Rook check fails because the Bishop on b7 takes the Rook.' },
    ] },
    { n: 53, title: 'Why not?', steps: [
      { fen: '1k6/pnq4r/8/8/5B2/6P1/2P5/1RKQ3r w', say: '<p>Black\'s Queen and Knight are both pinned. The White Queen would love to go up the board.</p>', ask: MATE_OR_NOT, task: 'mate', calls: ['nomate'], check: 'nomate', hint: 'Try the Queen check and read what the board says.', done: 'The White Queen is pinned herself, by the Rook on h1.', doneArrows: [['h1', 'd1', 'red']] },
    ] },
    { n: 54, title: 'Pawn promotion', steps: [
      { fen: '1k6/pp1PK3/2b5/8/8/5p2/8/8 w', say: '<p>A Pawn that reaches the far end of the board becomes a Queen, Rook, Bishop or Knight. You choose.</p>', ask: 'White to move. Promote the Pawn and give checkmate.', task: 'mate', check: 'mate:d8=Q', done: 'A Queen also covers c7. A Rook would give check but let the King out that way. A Queen is nearly always the right choice.' },
    ] },
    { n: 55, title: 'Nearly always', steps: [
      { fen: '6b1/5P1k/7p/4B3/3K4/8/p7/8 w', say: '<p>Believe it or not, White mates here.</p>', ask: 'White to move. Promote the Pawn and give checkmate.', task: 'mate', check: 'mate:f8=N', hint: 'A new Queen would not give check, and Black would then promote his own Pawn with check. Which piece checks from f8?', done: 'A Knight, not a Queen. Taking a lesser piece is called <b>underpromotion</b>, and now and then it is the only move.' },
    ] },
    { n: 56, title: 'Promote and mate', steps: [
      { fen: '2r1n2k/2p2Ppp/4P3/2p3P1/1P4K1/8/4R3/8 w', say: '<p>The Pawn can go straight on, or capture the Knight.</p>', ask: 'White to move. Promote the Pawn and give checkmate.', task: 'mate', check: 'mate:f8=Q,f8=R', done: 'Straight ahead, to a Queen or a Rook. Capturing the Knight lets the Black Rook take back.' },
    ] },
    { n: 57, title: 'Review', steps: [
      { fen: 'q5rk/5Qpp/pb6/1pp2P2/P6N/1P6/4P3/5K1R w', say: '<p>The Queen has checks. So has the Knight.</p>', ask: MATE1, task: 'mate', check: 'mate:Ng6', done: 'The Pawn on h7 is pinned by the Rook on h1, so it cannot take the Knight. Neither Queen check is mate.', doneArrows: [['h1', 'h7', 'red']] },
    ] },
    { n: 58, title: 'Four Queen checks', steps: [
      { fen: '7k/4N1p1/8/3Q2p1/8/1bp3K1/q4P2/8 w', arrows: [['d5', 'a8', 'blue'], ['d5', 'd8', 'blue'], ['d5', 'g8', 'blue'], ['d5', 'h1', 'blue']], say: '<p>The Queen can check on four squares. One of them is mate.</p>', ask: MATE1, task: 'mate', check: 'mate:Qh1', done: 'From h1 the Queen checks down the edge, the Knight guards g8, and nothing can block.' },
    ] },
    { n: 59, title: 'Queen or Knight?', steps: [
      { fen: 'kr6/pp6/8/QN2P3/6p1/1P2q3/KP6/8 w', ask: MATE1, task: 'mate', check: 'mate:Nc7', done: 'A smothered mate. Black\'s own Rook and Pawns leave the King no square.' },
    ] },
    { n: 60, title: 'Pawn, Queen or Rook?', steps: [
      { fen: '7k/1qn2ppp/5P2/3P4/7B/8/1rrP2QP/4R1K1 w', say: '<p>The Pawn, the Queen and the Rook can all give check.</p>', ask: MATE1, task: 'mate', check: 'mate:Qxg7', done: 'The Queen takes on g7, protected by the Pawn on f6.' },
    ] },
    { n: 61, title: 'Pawn or Queen?', steps: [
      { fen: '5Qrk/2b4p/3qp1P1/p6P/8/1B3R2/P5K1/8 w', ask: MATE1, task: 'mate', check: 'mate:g7', done: 'The Black Rook is pinned by the Queen, so it cannot take the Pawn. Any Queen check would release the pin and let the Rook block.' },
    ] },
    { n: 62, title: 'Leave no flight square', steps: [
      { fen: '1k6/p4Q2/1pp1pp2/4q3/8/PP4P1/K1P2P1R/4r3 w', say: '<p>Pick the check that leaves the King nowhere to go.</p>', ask: MATE1, task: 'mate', check: 'mate:Rh8', done: 'The Rook checks on the back row while the Queen keeps hold of b7 and c7. A Queen check would have let go of both.' },
    ] },
    { n: 63, title: 'Discovered check', steps: [
      { fen: 'r7/6bk/8/6P1/4R3/3B2K1/p7/8 w', arrows: [['d3', 'e4', 'blue']], say: '<p>The White Rook stands between its own Bishop and the Black King. When the Rook moves away, the Bishop gives check. That is a <b>discovered check</b>.</p><p>The Rook can go anywhere while the Bishop does the checking. Use it to shut the King in.</p>', ask: MATE1, task: 'mate', check: 'mate:Re8', done: 'The Bishop checks, the Rook covers g8 and h8, the Pawn covers h6. Black cannot even take the Rook, because that would not stop the Bishop\'s check.' },
    ] },
    { n: 64, title: 'Four checks, one mate', steps: [
      { fen: 'r6k/2p2ppp/6q1/6N1/1p1b1P2/1P4P1/2P5/1K2R2Q w', say: '<p>Be exact. Black is threatening mate as well.</p>', ask: MATE1, task: 'mate', check: 'mate:Qxa8', done: 'The Queen goes the whole length of the long diagonal. Black\'s Queen cannot get back to block because her own Pawn is in the way.' },
    ] },
    { n: 65, title: 'Find the mate', steps: [
      { fen: '7k/6r1/2p4q/5p2/4b3/1Q6/BB4rP/K6R w', ask: MATE1, task: 'mate', check: 'mate:Qg8', done: 'One Bishop pins the Rook on g7, the other protects the Queen. Going straight down to b8 would have left the King a flight square.', doneArrows: [['b2', 'g7', 'red'], ['a2', 'g8', 'green']] },
    ] },
    { n: 66, title: 'Mate, or no mate?', steps: [
      { fen: '1kbQ4/p7/Bp3p2/5pq1/8/2P2P2/1KP5/4r3 w', say: '<p>A run of positions now. In some White mates in one. In others he has checks but no mate, and you have to say so.</p>', ask: MATE_OR_NOT, task: 'mate', calls: ['nomate'], check: 'mate:Qxc8', done: 'The Queen takes the Bishop, protected by her own Bishop on a6.' },
    ] },
    { n: 67, title: 'Mate, or no mate?', steps: [
      { fen: '1q3r1k/5p1p/2p2p2/b7/3B3P/P7/2P2P2/K5R1 w', ask: MATE_OR_NOT, task: 'mate', calls: ['nomate'], check: 'mate:Bxf6', done: 'The Bishop checks on the long diagonal and the Rook holds the whole g column.' },
    ] },
    { n: 68, title: 'Mate, or no mate?', steps: [
      { fen: '1kn4q/1pp5/p7/1NQ5/PP6/KP1p4/8/8 w', ask: MATE_OR_NOT, task: 'mate', calls: ['nomate'], check: 'nomate', done: 'Every check can be answered. Not every attack has a mate in it.' },
    ] },
    { n: 69, title: 'Fischer against Otteson', steps: [
      { fen: '5r2/5k1p/6p1/3pQ3/6N1/6P1/4PPKP/2q5 w', say: '<p>From a game of Fischer\'s in 1957. His opponent has White.</p>', ask: MATE_OR_NOT, task: 'mate', calls: ['nomate'], check: 'nomate', done: 'The Knight check looks deadly, but the Black Queen takes the Knight from the other end of the diagonal.' },
    ] },
    { n: 70, title: 'Mate, or no mate?', steps: [
      { fen: '5qk1/5p1p/4bQp1/8/3B4/6P1/5PKP/8 w', ask: MATE_OR_NOT, task: 'mate', calls: ['nomate'], check: 'mate:Qh8', done: 'The corner, not g7: the Black Queen defends g7 but not h8.' },
    ] },
    { n: 71, title: 'Mate, or no mate?', steps: [
      { fen: '6k1/5n2/p5p1/1q2Qn2/8/p1B5/K1PR4/6r1 w', ask: MATE_OR_NOT, task: 'mate', calls: ['nomate'], check: 'nomate', done: 'Any White piece that checks is simply captured.' },
    ] },
    { n: 72, title: 'Mate, or no mate?', steps: [
      { fen: '4r1rk/5p2/3p4/R7/6R1/7P/7b/2BK4 w', ask: MATE_OR_NOT, task: 'mate', calls: ['nomate'], check: 'mate:Rh5', done: 'One Rook keeps the King shut in on the g column. The other swings across to give mate.' },
    ] },
    { n: 73, title: 'A three-move game', steps: [
      { fen: 'rnbqkbnr/ppppp2p/5p2/6p1/3PP3/8/PPP2PPP/RNBQKBNR w', say: '<p>Black has made just two moves, both with the Pawns in front of his King.</p>', ask: MATE_OR_NOT, task: 'mate', calls: ['nomate'], check: 'mate:Qh5', done: 'Those two Pawn moves opened the diagonal to the King, and nothing can block or capture. The whole game took three moves.' },
    ] },
    { n: 74, title: 'Mate, or no mate?', steps: [
      { fen: '6rk/p5p1/1q2Q3/3p4/6P1/8/2b2PK1/4R3 w', ask: MATE_OR_NOT, task: 'mate', calls: ['nomate'], check: 'nomate', done: 'The Queen checks on the edge are met by a block or a capture.' },
    ] },
    { n: 75, title: 'Fischer against Surgies', steps: [
      { fen: '4r1k1/1p3p1p/2pR1RpB/p7/P1P5/1P4Pb/5K1P/4r3 b', say: '<p>Another of Fischer\'s games. He has Black, and it is his move.</p>', ask: 'Black to move. Give checkmate in one move, or say there is none.', task: 'mate', calls: ['nomate'], check: 'mate:Rf1', done: 'The Rook checks from next to the King, protected by the Bishop on h3, while the other Rook holds the e column.' },
    ] },
    { n: 76, title: 'Mate, or no mate?', steps: [
      { fen: '6k1/p4ppp/1p1R2r1/4Pb2/1b6/6P1/5P2/2R3K1 w', ask: MATE_OR_NOT, task: 'mate', calls: ['nomate'], check: 'nomate', done: 'Each back-row check is answered by a Bishop: one captures, the other blocks.' },
    ] },
    { n: 77, title: 'Mate, or no mate?', steps: [
      { fen: '2R3qk/p5p1/8/1p1b2NP/8/4p2K/P1Q2p1P/4r3 w', ask: MATE_OR_NOT, task: 'mate', calls: ['nomate'], check: 'mate:Qh7', done: 'The Black Queen is pinned by the Rook and cannot take.', doneArrows: [['c8', 'g8', 'red']] },
    ] },
    { n: 78, title: 'A pinned piece that pins', steps: [
      { fen: '7k/4RP1p/1pN2r2/1Pb5/8/1KB4r/8/8 w', ask: 'White to move. Give checkmate in one move, or say there is none.', task: 'mate', calls: ['nomate'], check: 'mate:f8=Q,f8=R', done: 'The Pawn promotes with mate. White\'s Bishop is pinned to its own King, and still it pins the Black Rook on f6, which cannot capture.', doneArrows: [['c3', 'f6', 'red']] },
    ] },
    { n: 79, title: 'The pin wins again', steps: [
      { fen: '2Q2qkr/1P1p1ppp/2n4b/3N1P2/8/1r5P/7K/6R1 w', ask: MATE_OR_NOT, task: 'mate', calls: ['nomate'], check: 'mate:Nf6', done: 'The Pawn on g7 is pinned by the Rook, so it cannot take the Knight. That is the end of chapter 1: checks, the three ways out, protection, flight squares, pins, promotion and discovered check.', doneArrows: [['g1', 'g7', 'red']] },
    ] },
  ],
};
