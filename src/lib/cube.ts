/**
 * 三阶魔方引擎：贴纸级模型。
 * 坐标系：x 向右，y 向上，z 朝向观察者（F 面）。
 * 状态 state[位置] = 该位置上的贴纸原始编号；已还原时 state[i] === i。
 * 所有转动都由几何旋转生成，不手写置换表，避免抄错。
 */
export type Vec = [number, number, number];
export type Face = 'U' | 'R' | 'F' | 'D' | 'L' | 'B';
export const FACES: Face[] = ['U', 'R', 'F', 'D', 'L', 'B'];

export interface Sticker {
  id: number;
  face: Face;
  p: Vec;
  n: Vec;
}

const facePos: Record<Face, (r: number, c: number) => Vec> = {
  U: (r, c) => [c - 1, 1, r - 1],
  D: (r, c) => [c - 1, -1, 1 - r],
  F: (r, c) => [c - 1, 1 - r, 1],
  B: (r, c) => [1 - c, 1 - r, -1],
  R: (r, c) => [1, 1 - r, 1 - c],
  L: (r, c) => [-1, 1 - r, c - 1],
};
const faceNormal: Record<Face, Vec> = {
  U: [0, 1, 0],
  D: [0, -1, 0],
  F: [0, 0, 1],
  B: [0, 0, -1],
  R: [1, 0, 0],
  L: [-1, 0, 0],
};

export const STICKERS: Sticker[] = FACES.flatMap((face, f) =>
  Array.from({ length: 9 }, (_, i) => ({
    id: f * 9 + i,
    face,
    p: facePos[face](Math.floor(i / 3), i % 3),
    n: faceNormal[face],
  })),
);

const key = (p: Vec, n: Vec) => `${p.join(',')}|${n.join(',')}`;
const INDEX = new Map(STICKERS.map((s) => [key(s.p, s.n), s.id]));

export function stickerAt(p: Vec, n: Vec): number {
  const id = INDEX.get(key(p, n));
  if (id === undefined) throw new Error(`no sticker at ${key(p, n)}`);
  return id;
}

type Axis = 0 | 1 | 2;
/** 从坐标轴正方向看，顺时针转 90° */
const ROT: Record<Axis, (v: Vec) => Vec> = {
  0: ([x, y, z]) => [x, z, -y],
  1: ([x, y, z]) => [-z, y, x],
  2: ([x, y, z]) => [y, -x, z],
};

interface MoveDef {
  axis: Axis;
  /** 从轴正方向看顺时针的次数：1 或 3 */
  dir: 1 | 3;
  layers: number[];
}
const ALL = [-1, 0, 1];
const MOVE_DEFS: Record<string, MoveDef> = {
  R: { axis: 0, dir: 1, layers: [1] },
  L: { axis: 0, dir: 3, layers: [-1] },
  U: { axis: 1, dir: 1, layers: [1] },
  D: { axis: 1, dir: 3, layers: [-1] },
  F: { axis: 2, dir: 1, layers: [1] },
  B: { axis: 2, dir: 3, layers: [-1] },
  M: { axis: 0, dir: 3, layers: [0] },
  E: { axis: 1, dir: 3, layers: [0] },
  S: { axis: 2, dir: 1, layers: [0] },
  r: { axis: 0, dir: 1, layers: [0, 1] },
  l: { axis: 0, dir: 3, layers: [-1, 0] },
  u: { axis: 1, dir: 1, layers: [0, 1] },
  d: { axis: 1, dir: 3, layers: [-1, 0] },
  f: { axis: 2, dir: 1, layers: [0, 1] },
  b: { axis: 2, dir: 3, layers: [-1, 0] },
  x: { axis: 0, dir: 1, layers: ALL },
  y: { axis: 1, dir: 1, layers: ALL },
  z: { axis: 2, dir: 1, layers: ALL },
};

/** 动画用：一次转动绕哪根轴、转哪些层、转多少弧度。amount 3 按反向转一次，不转三次 */
export function moveGeometry(move: Move): { axis: Axis; layers: number[]; angle: number } {
  const { axis, dir, layers } = MOVE_DEFS[move.base];
  const quarters = move.amount === 3 ? -1 : move.amount;
  // 从轴正方向看顺时针，按右手定则是负角度
  return { axis, layers, angle: quarters * (dir === 1 ? -1 : 1) * (Math.PI / 2) };
}

/** dest[位置 i] = 转一次后 i 处贴纸到达的位置 */
function buildPerm({ axis, dir, layers }: MoveDef): number[] {
  return STICKERS.map((s) => {
    if (!layers.includes(s.p[axis])) return s.id;
    let p = s.p;
    let n = s.n;
    for (let i = 0; i < dir; i++) {
      p = ROT[axis](p);
      n = ROT[axis](n);
    }
    return stickerAt(p, n);
  });
}
const PERMS: Record<string, number[]> = Object.fromEntries(
  Object.entries(MOVE_DEFS).map(([k, def]) => [k, buildPerm(def)]),
);

export interface Move {
  base: string;
  /** 顺时针次数：1、2 或 3（3 即逆时针） */
  amount: 1 | 2 | 3;
}

export type State = number[];
export const solved = (): State => STICKERS.map((s) => s.id);

export function applyMove(state: State, move: Move): State {
  const perm = PERMS[move.base];
  let cur = state;
  for (let t = 0; t < move.amount; t++) {
    const next = new Array<number>(54);
    for (let i = 0; i < 54; i++) next[perm[i]] = cur[i];
    cur = next;
  }
  return cur;
}

export const applyMoves = (state: State, moves: Move[]): State => moves.reduce(applyMove, state);

export const invertMoves = (moves: Move[]): Move[] =>
  [...moves].reverse().map((m) => ({ base: m.base, amount: (4 - m.amount) as Move['amount'] }));

// 24 种整体朝向，用于把带 x/y/z/d/u 等净旋转的公式结果转回标准朝向
const ROTATIONS: Move[][] = (() => {
  const found = new Map<string, Move[]>();
  const queue: Move[][] = [[]];
  found.set(solved().join(), []);
  while (queue.length) {
    const seq = queue.shift()!;
    for (const base of ['x', 'y']) {
      const next: Move[] = [...seq, { base, amount: 1 }];
      const k = applyMoves(solved(), next).join();
      if (!found.has(k)) {
        found.set(k, next);
        queue.push(next);
      }
    }
  }
  return [...found.values()];
})();

const CENTERS = STICKERS.filter((s) => s.p.filter((v) => v !== 0).length === 1).map((s) => s.id);

/** 整体转动魔方，使六个中心回到标准位置；中心无法对齐（M 层错位）时原样返回 */
export function normalizeRotation(state: State): State {
  for (const rot of ROTATIONS) {
    const next = applyMoves(state, rot);
    if (CENTERS.every((c) => next[c] === c)) return next;
  }
  return state;
}
