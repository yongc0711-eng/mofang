import { FACES, type Face, type Move, type Vec } from './cube';

type Axis = 0 | 1 | 2;

export interface Sticker2 {
  id: number;
  face: Face;
  p: Vec;
  n: Vec;
}

const FACE_NORMAL2: Record<Face, Vec> = {
  U: [0, 1, 0],
  D: [0, -1, 0],
  F: [0, 0, 1],
  B: [0, 0, -1],
  R: [1, 0, 0],
  L: [-1, 0, 0],
};

function facePos2(face: Face, r: number, c: number): Vec {
  switch (face) {
    case 'U':
      return [c * 2 - 1, 1, r * 2 - 1];
    case 'D':
      return [c * 2 - 1, -1, 1 - r * 2];
    case 'F':
      return [c * 2 - 1, 1 - r * 2, 1];
    case 'B':
      return [1 - c * 2, 1 - r * 2, -1];
    case 'R':
      return [1, 1 - r * 2, 1 - c * 2];
    case 'L':
      return [-1, 1 - r * 2, c * 2 - 1];
  }
}

export const STICKERS2: Sticker2[] = (() => {
  const out: Sticker2[] = [];
  for (const face of FACES) {
    const n = FACE_NORMAL2[face];
    for (let r = 0; r < 2; r++) {
      for (let c = 0; c < 2; c++) {
        out.push({ id: out.length, face, p: facePos2(face, r, c), n });
      }
    }
  }
  return out;
})();

const key2 = (p: Vec, n: Vec): string => `${p[0]},${p[1]},${p[2]}|${n[0]},${n[1]},${n[2]}`;
const POS_MAP2 = new Map<string, number>(STICKERS2.map((s) => [key2(s.p, s.n), s.id]));

export function stickerAt2(p: Vec, n: Vec): number {
  const id = POS_MAP2.get(key2(p, n));
  if (id === undefined) throw new Error(`No 2x2 sticker at p=${p} n=${n}`);
  return id;
}

/** 围绕轴正向顺时针 90 度（与 cube.ts 保持完全一致的右手坐标系约定） */
const ROT2: Record<Axis, (v: Vec) => Vec> = {
  0: ([x, y, z]) => [x, z, -y],
  1: ([x, y, z]) => [-z, y, x],
  2: ([x, y, z]) => [y, -x, z],
};

function rotN2(axis: Axis, times: number, v: Vec): Vec {
  let out = v;
  const n = ((times % 4) + 4) % 4;
  for (let i = 0; i < n; i++) out = ROT2[axis](out);
  return out;
}

interface MoveDef2 {
  axis: Axis;
  dir: 1 | 3;
  layers: number[];
}

const MOVE_DEFS2: Record<string, MoveDef2> = {
  R: { axis: 0, dir: 1, layers: [1] },
  L: { axis: 0, dir: 3, layers: [-1] },
  U: { axis: 1, dir: 1, layers: [1] },
  D: { axis: 1, dir: 3, layers: [-1] },
  F: { axis: 2, dir: 1, layers: [1] },
  B: { axis: 2, dir: 3, layers: [-1] },
  x: { axis: 0, dir: 1, layers: [-1, 1] },
  y: { axis: 1, dir: 1, layers: [-1, 1] },
  z: { axis: 2, dir: 1, layers: [-1, 1] },
};

export const BASES2: string[] = Object.keys(MOVE_DEFS2);

function getMoveDef2(base: string): MoveDef2 {
  if (!Object.prototype.hasOwnProperty.call(MOVE_DEFS2, base)) {
    throw new Error(`Unsupported 2x2 move base: ${base}`);
  }
  return MOVE_DEFS2[base];
}

export function moveGeometry2(move: Move): { axis: 0 | 1 | 2; layers: number[]; angle: number } {
  const { axis, dir, layers } = getMoveDef2(move.base);
  const quarters = move.amount === 3 ? -1 : move.amount;
  return { axis, layers, angle: quarters * (dir === 1 ? -1 : 1) * (Math.PI / 2) };
}

function buildPerm2(base: string, amount: 1 | 2 | 3): number[] {
  const def = getMoveDef2(base);
  const times = (def.dir * amount) % 4;
  const perm = new Array<number>(24);
  for (const s of STICKERS2) {
    if (def.layers.includes(s.p[def.axis])) {
      const targetId = stickerAt2(rotN2(def.axis, times, s.p), rotN2(def.axis, times, s.n));
      perm[targetId] = s.id;
    } else {
      perm[s.id] = s.id;
    }
  }
  return perm;
}

const PERMS2 = new Map<string, number[]>();
for (const base of BASES2) {
  for (const amount of [1, 2, 3] as const) {
    PERMS2.set(`${base}${amount}`, buildPerm2(base, amount));
  }
}

export type State2 = number[];

export const solved2 = (): State2 => STICKERS2.map((s) => s.id);

export function applyMove2(state: State2, move: Move): State2 {
  getMoveDef2(move.base);
  const perm = PERMS2.get(`${move.base}${move.amount}`);
  if (!perm) throw new Error(`Unknown 2x2 move: ${move.base}${move.amount}`);
  return perm.map((from) => state[from]);
}

export function applyMoves2(state: State2, moves: Move[]): State2 {
  return moves.reduce(applyMove2, state);
}

export function invertMoves2(moves: Move[]): Move[] {
  return moves
    .slice()
    .reverse()
    .map((m) => {
      getMoveDef2(m.base);
      return {
        base: m.base,
        amount: m.amount === 2 ? 2 : m.amount === 1 ? 3 : 1,
      };
    });
}
