import { type Move } from './cube';
import { applyMoves2, solved2, STICKERS2, type State2 } from './cube2';

// Cyclic sticker order at each corner; moves and twist deltas come from cube2 geometry.
const names = ['URF', 'UFL', 'ULB', 'UBR', 'DFR', 'DLF', 'DBL', 'DRB'];
const corners = names.map(name => {
  const p = [name.includes('R') ? 1 : -1, name.includes('U') ? 1 : -1, name.includes('F') ? 1 : -1];
  return [...name].map(face => STICKERS2.find(s => s.face === face && s.p.every((v, i) => v === p[i]))!.id);
});
const pieceOf = new Map(corners.flatMap((ids, piece) => ids.map(id => [id, piece] as const)));
function cubies(state: State2) {
  if (state.length !== 24 || new Set(state).size !== 24 || state.some(id => !Number.isInteger(id) || id < 0 || id >= 24)) throw new Error('二阶目标状态无效');
  const cp: number[] = [], co: number[] = [];
  for (const ids of corners) {
    const stickers = ids.map(id => state[id]);
    const piece = pieceOf.get(stickers[0])!;
    const twist = stickers.findIndex(id => STICKERS2[id].face === 'U' || STICKERS2[id].face === 'D');
    if (twist < 0 || stickers.some((id, i) => id !== corners[piece][(i - twist + 3) % 3])) throw new Error('二阶角块状态无效');
    cp.push(piece); co.push(twist);
  }
  if (new Set(cp).size !== 8 || co.reduce((a, b) => a + b, 0) % 3) throw new Error('二阶目标不可达');
  return { cp, co };
}
const MOVES: Move[] = [...'RLUDFB'].flatMap(base => ([1, 2, 3] as const).map(amount => ({ base, amount })));
const SEARCH_MOVES = MOVES.map((m, i) => 'RUF'.includes(m.base) ? i : -1).filter(i => i >= 0);
const effects = MOVES.map(move => cubies(applyMoves2(solved2(), [move])));
// Reorient once to fix DBL, then search only R/U/F (the 3,674,160-state pocket cube).
// Express the reorientation as opposite face turns, keeping the final setup rotation-free.
const frames: Move[][] = [[]];
const seenFrames = new Set([solved2().join()]);
for (let i = 0; i < frames.length; i++) for (const base of 'xyz') {
  const seq: Move[] = [...frames[i], { base, amount: 1 }], key = applyMoves2(solved2(), seq).join();
  if (!seenFrames.has(key)) { seenFrames.add(key); frames.push(seq); }
}
const rotationFaces = new Map<string, Move[]>();
for (const base of 'xyz') {
  const target = applyMoves2(solved2(), [{ base, amount: 1 }]).join();
  for (const [a, b] of ['RL', 'UD', 'FB']) for (const amount of [1, 3] as const) {
    const pair: Move[] = [{ base: a, amount }, { base: b, amount: amount === 1 ? 3 : 1 }];
    if (applyMoves2(solved2(), pair).join() === target) rotationFaces.set(base, pair);
  }
}
const factorial = [1, 1, 2, 6, 24, 120, 720, 5040, 40320];
function rank(p: number[]) {
  let n = 0;
  for (let i = 0; i < 8; i++) n += p.slice(i + 1).filter(v => v < p[i]).length * factorial[7 - i];
  return n;
}
function permutation(n: number) {
  const available = [0, 1, 2, 3, 4, 5, 6, 7], p: number[] = [];
  for (let i = 7; i >= 0; i--) { const j = Math.floor(n / factorial[i]); n %= factorial[i]; p.push(available.splice(j, 1)[0]); }
  return p;
}
const twistRank = (co: number[]) => co.slice(0, 7).reduce((n, v) => n * 3 + v, 0);
function twists(n: number) {
  const co = new Array<number>(8).fill(0);
  for (let i = 6; i >= 0; i--) { co[i] = n % 3; n = Math.floor(n / 3); }
  co[7] = (3 - co.reduce((a, b) => a + b, 0) % 3) % 3;
  return co;
}
function distances(table: Uint16Array, size: number) {
  const dist = new Uint8Array(size).fill(255), queue = new Uint16Array(size);
  dist[0] = 0; queue[0] = 0;
  let end = 1;
  for (let i = 0; i < end; i++) {
    const current = queue[i];
    for (const m of SEARCH_MOVES) {
      const next = table[current * 18 + m];
      if (dist[next] === 255) { dist[next] = dist[current] + 1; queue[end++] = next; }
    }
  }
  return dist;
}
let tables: { cp: Uint16Array; co: Uint16Array; pd: Uint8Array; td: Uint8Array } | undefined;
function getTables() {
  if (tables) return tables;
  const cp = new Uint16Array(40320 * 18), co = new Uint16Array(2187 * 18);
  for (let i = 0; i < 40320; i++) {
    const p = permutation(i);
    for (let m = 0; m < 18; m++) cp[i * 18 + m] = rank(effects[m].cp.map(from => p[from]));
  }
  for (let i = 0; i < 2187; i++) {
    const t = twists(i);
    for (let m = 0; m < 18; m++) co[i * 18 + m] = twistRank(effects[m].cp.map((from, j) => (t[from] + effects[m].co[j]) % 3));
  }
  tables = { cp, co, pd: distances(cp, 40320), td: distances(co, 2187) };
  return tables;
}

/** Exact fixed-frame corner solver. No teaching algorithm or 3×3 state enters the search. */
export function solve2(state: State2): Move[] {
  cubies(state); // Validate before attempting a reference-corner reorientation.
  const frame = frames.find(seq => {
    const rotated = applyMoves2(state, seq);
    return corners[6].every(id => rotated[id] === id);
  });
  if (!frame) throw new Error('二阶参考角块无效');
  const c = cubies(applyMoves2(state, frame)), p = rank(c.cp), t = twistRank(c.co);
  const { cp, co, pd, td } = getTables(), path: number[] = [];
  const search = (p: number, t: number, depth: number, previous: number): boolean => {
    if (Math.max(pd[p], td[t]) > depth) return false;
    if (!depth) return p === 0 && t === 0;
    for (const m of SEARCH_MOVES) {
      const face = Math.floor(m / 3);
      // Same faces merge; opposite faces commute, so retain one ordering.
      if (face === previous || (Math.floor(face / 2) === Math.floor(previous / 2) && face < previous)) continue;
      path.push(m);
      if (search(cp[p * 18 + m], co[t * 18 + m], depth - 1, face)) return true;
      path.pop();
    }
    return false;
  };
  for (let depth = Math.max(pd[p], td[t]); depth <= 11; depth++) {
    if (search(p, t, depth, -2)) {
      const moves = [...frame.flatMap(m => rotationFaces.get(m.base)!), ...path.map(m => MOVES[m])];
      if (!applyMoves2(state, moves).every((id, i) => id === i)) throw new Error('二阶求解校验失败');
      return moves;
    }
  }
  throw new Error('二阶目标求解失败');
}
