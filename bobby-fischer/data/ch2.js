// Chapter 2: The Back-Rank Mates (frames 80-124, plus the two summary games).
// Positions are the book's diagrams; the teaching text is written for this app.
const HOLD = 'You are Black, in check on your back row. Find a defence that holds, or admit there is none.';
const POWER = 'White to move. Force mate on the back row, or say it cannot be done.';
const CAN = 'White to move. Force mate, or say it cannot be done.';
const WHY = ['White does not have enough power', 'The Black King gets a flight square', 'Black has a useful interposition'];

export default {
  id: 'ch2', n: 2, title: 'The Back-Rank Mates',
  frames: [
    { n: 80, title: 'Useful and useless blocks', steps: [
      { fen: 'R5k1/5ppp/8/1b6/8/8/7P/7K b', say: '<p>The <b>back-rank mate</b> is the most common mating attack of all: a King shut in behind his own Pawns, and a Rook or Queen landing on his back row. This chapter is about when it works and when it does not.</p><p>Start with blocking. A block only helps if the blocker survives.</p>', ask: HOLD, task: 'survive', check: 'lost', done: 'The Bishop can step in, but the Rook simply takes it and gives mate. A <b>useless</b> interposition.' },
      { fen: 'R5k1/5ppp/8/8/1b6/8/7P/7K b', say: '<p>The same check. The Bishop starts one square lower.</p>', ask: HOLD, task: 'survive', check: 'survive:Bf8', done: 'On f8 the Bishop stands next to its King, who protects it. If the Rook takes, the King takes back. A <b>useful</b> interposition.' },
      { fen: '3R3k/6pp/2p1r3/8/1p6/1P5P/2P1r1P1/6K1 b', say: '<p>Two Black Rooks on the same column.</p>', ask: HOLD, task: 'survive', check: 'survive:Re8', done: 'The front Rook blocks and the Rook behind protects it.' },
      { fen: '1R4k1/p5p1/1np2pP1/3p4/3P4/6Pb/5K1P/8 b', say: '<p>A Knight and a Bishop can both reach the blocking square.</p>', ask: HOLD, task: 'survive', check: 'survive:Bc8,Nc8', done: 'Either one blocks, and the other protects it.' },
    ] },
    { n: 81, title: 'Is there a useful block?', steps: [
      { fen: 'R5k1/1p3ppp/2b5/8/8/8/1P2rPPP/6K1 b', ask: HOLD, task: 'survive', check: 'survive:Be8,Re8', done: 'Rook or Bishop: whichever blocks, the other protects it.' },
    ] },
    { n: 82, title: 'Is there a useful block?', steps: [
      { fen: '2R4k/6p1/r2p2Pn/8/4PK2/2PP4/8/8 b', ask: HOLD, task: 'survive', check: 'survive:Ng8', done: 'The Knight blocks, protected by the King.' },
    ] },
    { n: 83, title: 'Is there a useful block?', steps: [
      { fen: '2R3k1/5ppp/5b2/4r3/8/6P1/2B2PKP/8 b', ask: HOLD, task: 'survive', n: 2, check: 'lost', done: 'Both blocks are useless. The Rook takes the first blocker with check, takes the second, and it is mate.' },
    ] },
    { n: 84, title: 'Is there a useful block?', steps: [
      { fen: '1k2Q3/ppp5/8/8/6q1/2P5/KPP1R3/5r2 b', ask: HOLD, task: 'survive', n: 2, check: 'survive:Qc8', done: 'The Queen blocks next to her King. If White trades Queens the King recaptures and steps out.' },
    ] },
    { n: 85, title: 'Find the useful block', steps: [
      { fen: '3R2k1/5qpp/8/p3r3/1bB5/1P5P/P4PP1/6K1 b', say: '<p>Two pieces can block. Only one of them is protected.</p>', ask: 'You are Black. Block the check with the piece that holds.', task: 'survive', n: 2, sol: ['Bf8'], check: 'survive:Bf8,Re8', wrong: { Re8: 'The Rook is not protected there. Your Queen is pinned by the Bishop on c4 and cannot take back, so White wins a Rook.' }, done: 'The Bishop is protected by the King. The Queen cannot help because she is pinned.' },
    ] },
    { n: 86, title: 'Find the useful block', steps: [
      { fen: 'Q5k1/5ppn/8/1q4b1/2r1B1P1/5PK1/2P4P/R7 b', say: '<p>Five different blocks are possible here.</p>', ask: 'You are Black. Block the check with the piece that holds.', task: 'survive', n: 2, sol: ['Nf8'], check: 'survive:Bd8,Nf8,Qb8,Qe8,Rc8', other: 'White just takes it, and you have given up a piece. Find the block that is protected.', done: 'The Knight on f8 is protected by the King. Every other blocker would be taken for nothing.' },
    ] },
    { n: 87, title: 'The only defence', steps: [
      { fen: 'Q5k1/2p2pp1/1n5p/6q1/8/2P1P3/2B2PP1/6K1 b', say: '<p>The White Queen checks from the corner.</p>', ask: 'You are Black. Find the one move that saves the game.', task: 'survive', n: 2, check: 'survive:Nxa8', done: 'The Knight takes the Queen. Before you block, look for a capture.' },
    ] },
    { n: 88, title: 'The combination', steps: [
      { fen: 'q1r3k1/5ppp/8/8/p1p5/1nP1Q3/4RPPP/4R1K1 w', arrows: [['e3', 'e8', 'blue']], say: '<p>White\'s Queen and two Rooks are lined up on the open column that leads to Black\'s back row. Two Black pieces guard the landing square.</p><p>Three attackers, two defenders. Play it out: land on e8 again and again until nothing is left to take back.</p>', ask: 'White to move. Mate in three, starting with the Queen.', task: 'line', sol: ['Qe8+', 'Rxe8', 'Rxe8+', 'Qxe8', 'Rxe8#'], check: 'line', hint: 'Every move is a capture on e8 with check.', done: 'Queen, Rook, Rook. Each capture came with check, so Black never had time for anything else.' },
    ] },
    { n: 89, title: 'Counting power', steps: [
      { fen: '2r3k1/5ppp/p7/1b6/2p5/4R2P/5PP1/4R1K1 w', arrows: [['e3', 'e8', 'blue'], ['c8', 'e8', 'red'], ['b5', 'e8', 'red']], say: '<p>To mate on the back row you need <b>more attackers than defenders</b> on the landing square. Count them.</p><p>Here two Rooks aim at e8. A Rook and a Bishop defend it.</p>', ask: POWER, task: 'line', n: 3, calls: ['nomate'], check: 'nomate:3', done: 'Two against two is not enough. After the captures Black still has a piece standing on e8.' },
      { fen: '2k5/2p2p1r/2P1n3/2pR4/8/1PB5/1K1R2Pr/8 w', say: '<p>Two Rooks aim at d8. The Knight and the King defend it.</p>', ask: POWER, task: 'line', n: 3, calls: ['nomate'], check: 'nomate:3', done: 'Two against two again. The King counts as a defender when the last attacker would be unprotected.' },
      { fen: '2k5/2p2p1r/2P1nB2/2pR4/8/1P6/1K1R2Pr/8 w', arrows: [['f6', 'd8', 'blue']], say: '<p>The same position with the Bishop on f6, where it also looks at d8.</p>', ask: POWER, task: 'line', sol: ['Rd8+', 'Nxd8', 'Rxd8#'], calls: ['nomate'], check: 'line', done: 'Three against two. The second Rook is protected by the Bishop, so the King cannot take it.' },
      { fen: '2r3k1/5p1p/6pP/6Q1/8/6P1/3R1P1K/q7 w', say: '<p>Queen and Rook both aim at d8. Only a Rook defends.</p>', ask: POWER, task: 'line', sol: ['Rd8+', 'Rxd8', 'Qxd8#'], calls: ['nomate'], check: 'line', done: 'Two against one.' },
      { fen: 'q2r2k1/5ppp/1p6/p5Q1/1P6/P7/5PPP/3R2K1 w', say: '<p>Queen and Rook against Queen and Rook. Count again, carefully.</p>', ask: POWER, task: 'line', sol: ['Qxd8+', 'Qxd8', 'Rxd8#'], calls: ['nomate'], check: 'line', done: 'The Black Rook stands <em>on</em> the mating square. It is captured by the first check, so it does not count as a defender. Two against one.' },
      { fen: 'r6k/q5pp/4p3/2pbBp2/5P2/PR4P1/1Q3P2/6K1 w', say: '<p>Rook, Queen and Bishop all aim at b8. Rook and Queen defend.</p>', ask: POWER, task: 'line', n: 3, calls: ['nomate'], check: 'nomate:3', done: 'The Bishop reaches b8 but would not give check from there, so it does not count. Two against two.' },
      { fen: '1k6/ppR5/8/8/8/8/PP6/K1Qq4 w', say: '<p>The White Queen is pinned by the Black Queen and cannot move up the board.</p>', ask: 'White to move. Give checkmate in one move.', task: 'mate', check: 'mate:Rc8', done: 'A pinned piece can still protect. The Queen supports the Rook along the column, so the King cannot take it.', doneArrows: [['c1', 'c8', 'green']] },
    ] },
    { n: 90, title: 'Enough power?', steps: [
      { fen: '1q1r2k1/1r4pp/p1p5/npB5/2P5/3P1Q1P/1P3RP1/5R1K w', say: '<p>Look at every piece that bears on f8, for both sides.</p>', ask: POWER, task: 'line', sol: ['Qf8+', 'Rxf8', 'Rxf8+', 'Qxf8', 'Rxf8#'], calls: ['nomate'], check: 'line', done: 'Four against three: Queen, two Rooks and the Bishop against Rook, Queen and King. The last Rook is protected by the Bishop.' },
    ] },
    { n: 91, title: 'Enough power?', steps: [
      { fen: '1k3r2/ppp1Rp1p/2b3p1/6P1/5PB1/P7/1PP4r/2K1R3 w', ask: POWER, task: 'line', n: 3, calls: ['nomate'], check: 'nomate:3', done: 'Two Rooks against a Rook and a Bishop. Two against two.' },
    ] },
    { n: 92, title: 'Enough power?', steps: [
      { fen: '2qr1r1k/6pp/p7/Pp1p4/1QpPp2P/4P1P1/1PP2R2/5R1K w', ask: POWER, task: 'line', sol: ['Qxf8+', 'Rxf8', 'Rxf8+', 'Qxf8', 'Rxf8#'], calls: ['nomate'], check: 'line', done: 'Queen and two Rooks against two defenders.' },
    ] },
    { n: 93, title: 'Enough power?', steps: [
      { fen: '1r5k/N5pp/4Bp2/pp1pp3/1n1Pb3/4P1P1/1P3P1P/2R1K3 w', ask: POWER, task: 'line', n: 2, calls: ['nomate'], check: 'nomate:2', done: 'One against one. The Bishop and Knight reach the back row but would not give check there, so they do not count.' },
    ] },
    { n: 94, title: 'Enough power?', steps: [
      { fen: '3r2k1/2rP1ppp/8/8/8/8/6PP/3RR1K1 w', ask: POWER, task: 'line', sol: ['Re8+', 'Rxe8', 'dxe8=Q#'], calls: ['nomate'], check: 'line', done: 'The Pawn counts too: it recaptures on e8 and becomes a Queen with mate.' },
    ] },
    { n: 95, title: 'Why is there no mate?', steps: [
      { fen: '3q3k/p5p1/1p5p/2p2Q2/2P5/8/PP1r2PP/5R1K w', say: '<p>In the next four positions White threatens the back row but cannot mate. Try it, then say why.</p>', ask: POWER, task: 'line', n: 2, calls: ['nomate'], check: 'nomate:2' },
      { fen: '3q3k/p5p1/1p5p/2p2Q2/2P5/8/PP1r2PP/5R1K w', ask: 'Why does the attack fail?', task: 'pick', opts: WHY, ans: 1, demo: ['Qf8+', 'Qxf8', 'Rxf8+', 'Kh7'], done: 'Once the Queens are traded, the White Queen no longer guards h7.' },
    ] },
    { n: 96, title: 'Why is there no mate?', steps: [
      { fen: '3r2k1/1q1P1ppp/2n5/2b5/p7/1p5B/P1P3PP/1K1RR3 w', ask: POWER, task: 'line', n: 2, calls: ['nomate'], check: 'nomate:2' },
      { fen: '3r2k1/1q1P1ppp/2n5/2b5/p7/1p5B/P1P3PP/1K1RR3 w', ask: 'Why does the attack fail?', task: 'pick', opts: WHY, ans: 2, demo: ['Re8+', 'Bf8'], done: 'The Bishop drops back to f8, protected by the King.' },
    ] },
    { n: 97, title: 'Why is there no mate?', steps: [
      { fen: '6k1/2q3pp/5n2/3p2N1/1R1P1b2/8/5PP1/1Q3K2 w', ask: POWER, task: 'line', n: 2, calls: ['nomate'], check: 'nomate:2' },
      { fen: '6k1/2q3pp/5n2/3p2N1/1R1P1b2/8/5PP1/1Q3K2 w', ask: 'Why does the attack fail?', task: 'pick', opts: WHY, ans: 0, demo: ['Rb8+', 'Qxb8', 'Qxb8+', 'Bxb8'], done: 'Rook and Queen attack b8, but the Black Queen and Bishop both guard it. Two against two, and Black is left with the last piece.' },
    ] },
    { n: 98, title: 'Why is there no mate?', steps: [
      { fen: '3r2k1/pp4pp/1bn5/8/1PP1R3/7P/5PP1/4R1K1 w', ask: POWER, task: 'line', n: 2, calls: ['nomate'], check: 'nomate:2' },
      { fen: '3r2k1/pp4pp/1bn5/8/1PP1R3/7P/5PP1/4R1K1 w', ask: 'Why does the attack fail?', task: 'pick', opts: WHY, ans: 1, demo: ['Re8+', 'Rxe8', 'Rxe8+', 'Kf7'], done: 'There is no Pawn on f7. The King walks out.' },
    ] },
    { n: 99, title: 'The two Queens', steps: [
      { fen: 'k2r4/pp6/8/8/2R5/8/PP2p3/K1Qq4 w', say: '<p>Rook and Queen aim at c8, and only a Rook defends it. Look at the two Queens before you count.</p>', ask: POWER, task: 'line', n: 2, calls: ['nomate'], check: 'nomate:2', done: 'The White Queen is pinned by the Black Queen. If the Rook checks, the Black Rook takes it and the Queen cannot recapture.', doneArrows: [['d1', 'c1', 'red']] },
    ] },
    { n: 100, title: 'Fischer against Bisguier', steps: [
      { fen: 'rkn5/2n4p/1pp1p3/2N1P1p1/2P5/1Q2BpP1/5P1P/q4RK1 w', arrows: [['f1', 'a1', 'blue']], say: '<p>New York, 1957. Fischer has White, and Arthur Bisguier, a former U.S. Champion, has left his Queen where the Rook can take it.</p>', ask: 'Would you take the Queen?', task: 'pick', opts: ['Yes, take it', 'No'], ans: 1, no: { 0: 'Look at White\'s own back row first.' }, demo: ['Rxa1', 'Rxa1+', 'Bc1', 'Rxc1+', 'Qd1', 'Rxd1#'], done: 'Black takes back with check, and White has nothing but useless blocks. Fischer moved his Rook to b1 instead and won.' },
    ] },
    { n: 101, title: 'Which check?', steps: [
      { fen: 'k7/pp6/1b3Q2/8/2p5/P1N3p1/1PP2n2/2KB3r w', say: '<p>The Queen has three checks. Two of them lose her.</p>', ask: 'White to move. Mate in two.', task: 'line', sol: ['Qf8+', 'Bd8', 'Qxd8#'], check: 'line', done: 'From f8 the Queen cannot be captured, and the Bishop\'s block is useless.' },
    ] },
    { n: 102, title: 'Which square?', steps: [
      { fen: 'b5k1/2P1nppp/8/2b2q2/2p5/6B1/1p3PPP/R2R2K1 w', say: '<p>White has several ways to reach the back row. One is mate at once.</p>', ask: 'White to move. Give checkmate in one move.', task: 'mate', check: 'mate:Rd8', done: 'The Rook on d8 is protected by the Pawn, and neither Bishop nor Queen can block: Black\'s own Knight and Pawn are in their way.' },
    ] },
    { n: 103, title: 'The first move', steps: [
      { fen: 'r6k/1p4RP/4NN2/4q3/p7/P7/1P4PP/1B3b1K w', ask: 'White to move. Mate in two.', task: 'line', sol: ['Rg8+', 'Rxg8', 'hxg8=Q#'], check: 'line', hint: 'Give up the Rook so the Pawn can capture.', done: 'The Rook is taken, the Pawn takes back and promotes, and the Knights hold every other square.' },
    ] },
    { n: 104, title: 'Rook or Queen?', steps: [
      { fen: '6k1/1p3ppp/2n5/1bp5/3p3q/8/1P3PPP/R3Q1K1 w', say: '<p>Both the Rook and the Queen can check on the back row.</p>', ask: 'White to move. Give checkmate in one move.', task: 'mate', check: 'mate:Qe8', done: 'The Queen mates. After a Rook check the Knight blocks on d8, protected by the Black Queen, and the Bishop then keeps the White Queen off e8.' },
    ] },
    { n: 105, title: 'Is there a combination?', steps: [
      { fen: '6k1/p5p1/1n1r2Pp/1p6/5p2/8/2R3P1/2R4K w', ask: POWER, task: 'line', sol: ['Rc8+', 'Nxc8', 'Rxc8+', 'Rd8', 'Rxd8#'], calls: ['nomate'], check: 'line', done: 'Two Rooks against one Knight, and the Rook\'s block at the end is useless. The Pawn on g6 keeps the King in.' },
    ] },
    { n: 106, title: 'Is there a combination?', steps: [
      { fen: '6k1/q3rpp1/p6p/6N1/3p1Q2/2p5/2P3PP/1R4K1 w', ask: POWER, task: 'line', sol: ['Rb8+', 'Qxb8', 'Qxb8+', 'Re8', 'Qxe8#'], calls: ['nomate'], check: 'line', done: 'Rook and Queen against the Queen alone, and the last block is useless.' },
    ] },
    { n: 107, title: 'Is there a combination?', steps: [
      { fen: '2r3k1/4P1pp/8/8/8/7P/6PK/2q1R3 w', ask: POWER, task: 'line', n: 2, calls: ['nomate'], check: 'nomate:2' },
      { fen: '2r3k1/4P1pp/8/8/8/7P/6PK/2q1R3 w', ask: 'Why does it fail?', task: 'pick', opts: WHY, ans: 1, demo: ['e8=Q+', 'Rxe8', 'Rxe8+', 'Kf7'], done: 'With no Pawn on f7, the King steps up and attacks the Rook as well.' },
    ] },
    { n: 108, title: 'Is there a combination?', steps: [
      { fen: '6k1/2p2ppp/Rnb5/2p5/2P5/7P/3r1PP1/R5K1 w', ask: POWER, task: 'line', n: 3, calls: ['nomate'], check: 'nomate:3' },
      { fen: '6k1/2p2ppp/Rnb5/2p5/2P5/7P/3r1PP1/R5K1 w', ask: 'Why does it fail?', task: 'pick', opts: WHY, ans: 0, demo: ['Ra8+', 'Nxa8', 'Rxa8+', 'Bxa8'], done: 'Two Rooks against Knight and Bishop. Two against two.' },
    ] },
    { n: 109, title: 'Is there a combination?', steps: [
      { fen: '6k1/5pbp/1q4p1/p3p3/Pp2P3/8/2Q2PPP/R5K1 w', ask: POWER, task: 'line', n: 2, calls: ['nomate'], check: 'nomate:2' },
      { fen: '6k1/5pbp/1q4p1/p3p3/Pp2P3/8/2Q2PPP/R5K1 w', ask: 'Why does it fail?', task: 'pick', opts: WHY, ans: 2, demo: ['Qc8+', 'Bf8'], done: 'The Bishop tucks in on f8.' },
    ] },
    { n: 110, title: 'Is there a combination?', steps: [
      { fen: 'q3rk2/5pp1/1b1N3p/r7/4R3/6P1/6P1/4R2K w', ask: POWER, task: 'line', sol: ['Rxe8+', 'Qxe8', 'Rxe8#'], calls: ['nomate'], check: 'line', done: 'The second Rook gives mate, protected by the Knight.' },
    ] },
    { n: 111, title: 'Mate, or no mate?', steps: [
      { fen: 'r5k1/3P1ppp/8/8/5q2/1Q6/p4PPP/3R2K1 w', say: '<p>A harder run. Some of these have a back-rank combination, some have a one-move mate of another kind, and a few have nothing. If the back-row check fails, look at the other checks.</p>', ask: CAN, task: 'line', sol: ['d8=Q+', 'Rxd8', 'Rxd8#'], calls: ['nomate'], check: 'line', done: 'The Pawn promotes with check. Black must take, and the Rook takes back with mate.' },
    ] },
    { n: 112, title: 'Mate, or no mate?', steps: [
      { fen: '6k1/1pp2pp1/5q1p/1b6/8/2P5/1PB2PPP/R2R2K1 w', ask: CAN, task: 'line', sol: ['Ra8+', 'Qd8', 'Raxd8+', 'Be8', 'Rxe8#'], calls: ['nomate'], check: 'line', done: 'Black can block with the Queen and then the Bishop, and both are useless. The Bishop on c2 guards h7, so the King never gets out.', doneArrows: [['c2', 'h7', 'green']] },
    ] },
    { n: 113, title: 'Mate, or no mate?', steps: [
      { fen: '6k1/1p3pp1/pq6/8/8/bP1B3Q/5PPP/6K1 w', ask: CAN, task: 'line', n: 2, calls: ['nomate'], check: 'nomate:2', done: 'A Queen check on the back row is blocked by the Bishop. A Queen check on h7 lets the King run.' },
    ] },
    { n: 114, title: 'Mate, or no mate?', steps: [
      { fen: '6k1/2r2ppp/8/8/Q7/7P/R4PPK/2q5 w', ask: 'White to move. Give checkmate in one move, or say there is none.', task: 'mate', calls: ['nomate'], check: 'mate:Qe8', done: 'The Queen reaches the back row along the diagonal, and the Rook on c7 cannot get there to block.' },
    ] },
    { n: 115, title: 'Mate, or no mate?', steps: [
      { fen: 'r5k1/5ppp/5n2/6r1/p5q1/8/P3RP2/1B2RK1Q w', ask: CAN, task: 'line', sol: ['Qxa8+', 'Qc8', 'Qxc8+', 'Ne8', 'Qxe8#'], calls: ['nomate'], check: 'line', done: 'The Queen takes the Rook from the far corner. Every block after that is useless.' },
    ] },
    { n: 116, title: 'Mate, or no mate?', steps: [
      { fen: '2q3k1/pp3pp1/7p/3p2n1/Q2P4/3B4/PP3PPP/2r1R1K1 w', ask: CAN, task: 'line', n: 2, calls: ['nomate'], check: 'nomate:2', done: 'White\'s Rook is pinned by the Rook on c1. It cannot go to e8, and it could not recapture there either.', doneArrows: [['c1', 'e1', 'red']] },
    ] },
    { n: 117, title: 'Mate, or no mate?', steps: [
      { fen: '2r4k/2r2pp1/1n2p3/pp2P3/8/PPpR4/2B2PPP/3R2K1 w', ask: CAN, task: 'line', sol: ['Rd8+', 'Rxd8', 'Rxd8#'], calls: ['nomate'], check: 'line', done: 'When the front Rook leaves d3 it uncovers the Bishop, which now guards h7, the King\'s only flight square.', doneArrows: [['c2', 'h7', 'green']] },
    ] },
    { n: 118, title: 'Mate, or no mate?', steps: [
      { fen: '6k1/1p3p1p/2q2Qpb/8/3B4/2P3PP/5P1K/8 w', ask: 'White to move. Give checkmate in one move, or say there is none.', task: 'mate', calls: ['nomate'], check: 'mate:Qh8', done: 'Not a back-rank mate at all: the Queen goes into the corner, protected by the Bishop.' },
    ] },
    { n: 119, title: 'Mate, or no mate?', steps: [
      { fen: '1r5k/6p1/1r2B3/1ppP4/3b1R2/8/6PP/5R1K w', ask: 'White to move. Give checkmate in one move, or say there is none.', task: 'mate', calls: ['nomate'], check: 'mate:Rh4', done: 'The Rook checks down the edge. The Bishop on e6 guards g8 and also stops the Black Rook from crossing to block.' },
    ] },
    { n: 120, title: 'Mate, or no mate?', steps: [
      { fen: '2k3r1/2p3q1/1pP5/3Q4/7p/1P4p1/7P/1K1R4 w', ask: CAN, task: 'line', n: 2, calls: ['nomate'], check: 'nomate:2', done: 'Black\'s Queen and Rook cover every check.' },
    ] },
    { n: 121, title: 'A game that might have been', steps: [
      { fen: 'r6k/p1pq1p1r/1p2p2Q/8/3P3P/5P2/PPP2P2/2K3R1 w', say: '<p>This could have happened in Fischer\'s game with the Hungarian grandmaster Bilek at Havana, 1965. Bilek steered away from it.</p>', ask: CAN, task: 'line', sol: ['Qf6+', 'Rg7', 'Qxg7#'], calls: ['nomate'], check: 'line', done: 'The Rook is forced to block, and the Queen takes it with mate, protected by the Rook on g1.' },
    ] },
    { n: 122, title: 'Mate, or no mate?', steps: [
      { fen: 'q6k/3r1p1p/1Rp2p2/2PpB3/3P4/r4P2/P5RP/1K6 w', ask: 'White to move. Give checkmate in one move, or say there is none.', task: 'mate', calls: ['nomate'], check: 'mate:Bxf6', done: 'The Bishop takes with check and the Rook holds the g column.' },
    ] },
    { n: 123, title: 'Mate, or no mate?', steps: [
      { fen: '2r2rk1/6pp/2pB3q/2P2QN1/8/6PP/4n3/5R1K w', ask: CAN, task: 'line', sol: ['Qxf8+', 'Rxf8', 'Rxf8#'], calls: ['nomate'], check: 'line', done: 'Queen takes Rook, Rook takes Queen, Rook takes Rook. The Bishop on d6 protects the last one.' },
    ] },
    { n: 124, title: 'Mate, or no mate?', steps: [
      { fen: 'k6q/pp5r/2p3p1/4Qb2/NP3P1p/6P1/6KP/R7 w', ask: 'White to move. Give checkmate in one move, or say there is none.', task: 'mate', calls: ['nomate'], check: 'mate:Nb6', done: 'The Pawn on a7 is pinned by the Rook, so it cannot take the Knight.', doneArrows: [['a1', 'a7', 'red']] },
    ] },
    { n: 'S1', title: 'Fischer against Weinstein', steps: [
      { fen: 'k6r/p4r2/2n1b2Q/1R1p4/2p1p1P1/2P3BB/2P2P1P/1R4K1 b', say: '<p>From the 1960 U.S. Championship. Fischer, with White, has just taken a Pawn with his Queen, and she seems to be hanging to the Rook on h8.</p><p>Watch what happens if Black takes her.</p>', demo: ['Rxh6', 'Rb8+', 'Nxb8', 'Rxb8#'], done: '' },
      { fen: 'k6r/p4r2/2n1b2Q/1R1p4/2p1p1P1/2P3BB/2P2P1P/1R4K1 b', say: '<p>The Rook on h8 cannot leave the back row: it is one of the two defenders of b8. And the Queen is attacking that Rook and the Bishop on e6 at once. Weinstein resigned.</p>' },
    ] },
    { n: 'S2', title: 'Fischer against Seidman', steps: [
      { fen: '4r2k/2p4p/p1P2p2/1p6/3P1Q2/2P5/Pr4PP/6K1 w', say: '<p>The same championship. It is Fischer\'s move, and the back-rank danger is his own.</p><p>Watch what happens if he takes the Pawn on c7.</p>', demo: ['Qxc7', 'Re1#'], done: '' },
      { fen: '4r2k/2p4p/p1P2p2/1p6/3P1Q2/2P5/Pr4PP/6K1 w', say: '<p>The Rook mates on the back row, and the King cannot step up to f2 because the other Rook covers it. Before you grab something, check your own back row.</p><p>That is the end of chapter 2: useful and useless blocks, counting attackers against defenders, and the flight square that spoils everything.</p>' },
    ] },
  ],
};
