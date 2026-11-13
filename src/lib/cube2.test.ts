import { describe, expect, it } from 'vitest';
import { applyMove, FACES, moveGeometry, STICKERS, stickerAt, type Move, type Vec } from './cube';
import {
  applyMove2,
  applyMoves2,
  BASES2,
  invertMoves2,
  moveGeometry2,
  solved2,
  STICKERS2,
  stickerAt2,
  type State2,
} from './cube2';

const dot = (a: Vec, b: Vec): number => a[0] * b[0] + a[1] * b[1] + a[2] * b[2];
const cross = (a: Vec, b: Vec): Vec => [
  a[1] * b[2] - a[2] * b[1],
  a[2] * b[0] - a[0] * b[2],
  a[0] * b[1] - a[1] * b[0],
];

const CORNER_POSITIONS: Vec[] = [
  [-1, 1, -1],
  [1, 1, -1],
  [1, 1, 1],
  [-1, 1, 1],
  [-1, -1, -1],
  [1, -1, -1],
  [1, -1, 1],
  [-1, -1, 1],
];

/** 每个角位按从外侧看顺时针排列的 3 个贴纸 id（首位固定为 U/D 贴纸位） */
const CORNER_SLOTS: [number, number, number][] = CORNER_POSITIONS.map(([x, y, z]) => {
  const n0: Vec = [0, y, 0];
  const a: Vec = [x, 0, 0];
  const b: Vec = [0, 0, z];
  const [n1, n2] = dot(cross(n0, a), b) < 0 ? [a, b] : [b, a];
  return [stickerAt2([x, y, z], n0), stickerAt2([x, y, z], n1), stickerAt2([x, y, z], n2)];
});

const STICKER_HOME_CORNER = new Map<number, number>();
for (let c = 0; c < CORNER_SLOTS.length; c++) {
  for (const id of CORNER_SLOTS[c]) {
    STICKER_HOME_CORNER.set(id, c);
  }
}

function cornerPermutationAndTwists(state: State2): { perm: number[]; twists: number[] } {
  const perm: number[] = [];
  const twists: number[] = [];
  for (let slot = 0; slot < CORNER_SLOTS.length; slot++) {
    const ids = CORNER_SLOTS[slot].map((idx) => state[idx]);
    const homeCorners = ids.map((id) => STICKER_HOME_CORNER.get(id));
    expect(homeCorners[0]).toBeDefined();
    expect(homeCorners[1]).toBe(homeCorners[0]);
    expect(homeCorners[2]).toBe(homeCorners[0]);

    // 校验该角块三张贴纸自身的外法线仍满足刚体顺时针顺序
    const ns = ids.map((id) => STICKERS2[id].n);
    expect(dot(cross(ns[0], ns[1]), ns[2])).toBe(-1);

    const home = homeCorners[0]!;
    perm.push(home);

    // 找出本块在 solved 时位于 U/D 槽的那张贴纸当前落在该槽位的第几个位置
    const udStickerId = CORNER_SLOTS[home][0];
    const twist = ids.indexOf(udStickerId);
    expect(twist).toBeGreaterThanOrEqual(0);
    twists.push(twist);
  }
  return { perm, twists };
}

function permParity(perm: number[]): 0 | 1 {
  const visited = new Array<boolean>(perm.length).fill(false);
  let parity = 0;
  for (let i = 0; i < perm.length; i++) {
    if (visited[i]) continue;
    let len = 0;
    let cur = i;
    while (!visited[cur]) {
      visited[cur] = true;
      cur = perm[cur];
      len++;
    }
    if (len > 1) parity ^= (len - 1) & 1;
  }
  return parity as 0 | 1;
}

function makeRng(seed: number): () => number {
  let s = seed >>> 0;
  return () => {
    s = (s * 1664525 + 1013904223) >>> 0;
    return s / 0x100000000;
  };
}

function randomMoves(rng: () => number, bases: string[], len: number): Move[] {
  const out: Move[] = [];
  for (let i = 0; i < len; i++) {
    const base = bases[Math.floor(rng() * bases.length)];
    const amount = (Math.floor(rng() * 3) + 1) as 1 | 2 | 3;
    out.push({ base, amount });
  }
  return out;
}

describe('cube2 2x2 engine', () => {
  it('defines 24 unique stickers at +-1 coordinates, 4 per face, 3 per corner', () => {
    expect(STICKERS2).toHaveLength(24);
    expect(STICKERS2.map((s) => s.id)).toEqual(Array.from({ length: 24 }, (_, i) => i));

    for (const f of FACES) {
      expect(STICKERS2.filter((s) => s.face === f)).toHaveLength(4);
    }

    for (const s of STICKERS2) {
      expect(Math.abs(s.p[0])).toBe(1);
      expect(Math.abs(s.p[1])).toBe(1);
      expect(Math.abs(s.p[2])).toBe(1);
      expect(dot(s.n, s.n)).toBe(1);
      expect(dot(s.p, s.n)).toBe(1);
      expect(stickerAt2(s.p, s.n)).toBe(s.id);
    }

    for (const [x, y, z] of CORNER_POSITIONS) {
      const cornerStickers = STICKERS2.filter((s) => s.p[0] === x && s.p[1] === y && s.p[2] === z);
      expect(cornerStickers).toHaveLength(3);
      expect(dot(cornerStickers[0].n, cornerStickers[1].n)).toBe(0);
      expect(dot(cornerStickers[1].n, cornerStickers[2].n)).toBe(0);
      expect(dot(cornerStickers[0].n, cornerStickers[2].n)).toBe(0);
    }

    expect(() => stickerAt2([0, 1, 0], [0, 1, 0])).toThrow();
  });

  it('matches 3x3 cube.ts on all corner stickers and moveGeometry across BASES2', () => {
    expect(BASES2).toEqual(['R', 'L', 'U', 'D', 'F', 'B', 'x', 'y', 'z']);

    const cornerIds3 = STICKERS.filter(
      (s) => Math.abs(s.p[0]) === 1 && Math.abs(s.p[1]) === 1 && Math.abs(s.p[2]) === 1,
    ).map((s) => s.id);
    expect(cornerIds3).toHaveLength(24);

    for (const base of BASES2) {
      for (const amount of [1, 2, 3] as const) {
        const move: Move = { base, amount };
        const g2 = moveGeometry2(move);
        const g3 = moveGeometry(move);
        expect(g2.axis).toBe(g3.axis);
        expect(g2.angle).toBeCloseTo(g3.angle, 10);
        expect(g2.layers).toEqual(g3.layers.filter((l) => l !== 0));

        const s2 = applyMove2(solved2(), move);
        const s3 = applyMove(
          STICKERS.map((s) => s.id),
          move,
        );

        for (const id2 of STICKERS2.map((s) => s.id)) {
          const dst2 = STICKERS2[id2];
          const src2 = STICKERS2[s2[id2]];
          const id3 = stickerAt(dst2.p, dst2.n);
          const src3 = STICKERS[s3[id3]];
          expect(src2.p).toEqual(src3.p);
          expect(src2.n).toEqual(src3.n);
        }
      }
    }

    // 整方转动等价性: x = R L', y = U D', z = F B'
    expect(applyMove2(solved2(), { base: 'x', amount: 1 })).toEqual(
      applyMoves2(solved2(), [
        { base: 'R', amount: 1 },
        { base: 'L', amount: 3 },
      ]),
    );
    expect(applyMove2(solved2(), { base: 'y', amount: 1 })).toEqual(
      applyMoves2(solved2(), [
        { base: 'U', amount: 1 },
        { base: 'D', amount: 3 },
      ]),
    );
    expect(applyMove2(solved2(), { base: 'z', amount: 1 })).toEqual(
      applyMoves2(solved2(), [
        { base: 'F', amount: 1 },
        { base: 'B', amount: 3 },
      ]),
    );
  });

  it('satisfies single-move order 4, sexy-move order 6, non-commutativity, and inverse roundtrip', () => {
    const start = solved2();
    for (const base of BASES2) {
      let cur = start;
      for (let i = 1; i <= 3; i++) {
        cur = applyMove2(cur, { base, amount: 1 });
        expect(cur).not.toEqual(start);
      }
      cur = applyMove2(cur, { base, amount: 1 });
      expect(cur).toEqual(start);

      const cur2 = applyMove2(applyMove2(start, { base, amount: 2 }), { base, amount: 2 });
      expect(cur2).toEqual(start);
    }

    const sexy: Move[] = [
      { base: 'R', amount: 1 },
      { base: 'U', amount: 1 },
      { base: 'R', amount: 3 },
      { base: 'U', amount: 3 },
    ];
    let cur = start;
    for (let i = 1; i <= 5; i++) {
      cur = applyMoves2(cur, sexy);
      expect(cur).not.toEqual(start);
    }
    cur = applyMoves2(cur, sexy);
    expect(cur).toEqual(start);

    expect(
      applyMoves2(start, [
        { base: 'R', amount: 1 },
        { base: 'U', amount: 1 },
      ]),
    ).not.toEqual(
      applyMoves2(start, [
        { base: 'U', amount: 1 },
        { base: 'R', amount: 1 },
      ]),
    );

    const rng = makeRng(20261113);
    for (let i = 0; i < 40; i++) {
      const seq = randomMoves(rng, BASES2, 35);
      const inv = invertMoves2(seq);
      expect(applyMoves2(applyMoves2(start, seq), inv)).toEqual(start);

      const baseScramble = applyMoves2(start, randomMoves(rng, BASES2, 12));
      expect(applyMoves2(applyMoves2(baseScramble, seq), inv)).toEqual(baseScramble);
    }
  });

  it('throws on unsupported 3x3 slice and wide moves', () => {
    const unsupported = ['M', 'E', 'S', 'r', 'l', 'u', 'd', 'f', 'b', 'toString'];
    for (const base of unsupported) {
      const move: Move = { base, amount: 1 };
      expect(() => applyMove2(solved2(), move)).toThrow();
      expect(() => applyMoves2(solved2(), [{ base: 'R', amount: 1 }, move])).toThrow();
      expect(() => moveGeometry2(move)).toThrow();
      expect(() => invertMoves2([move])).toThrow();
    }
  });

  it('preserves corner orientation invariants and exact permutation parity on 2x2', () => {
    const faceBases = ['R', 'L', 'U', 'D', 'F', 'B'];
    const start = solved2();

    // 单个面四分之一转会造成一个 4-循环，因此角置换奇偶性为奇（1）；整体旋转/双转/偶数次面转保持偶（0）
    for (const base of faceBases) {
      const s1 = applyMove2(start, { base, amount: 1 });
      const { perm: p1, twists: t1 } = cornerPermutationAndTwists(s1);
      expect(t1.reduce((a, b) => a + b, 0) % 3).toBe(0);
      expect(permParity(p1)).toBe(1);

      const s2 = applyMove2(start, { base, amount: 2 });
      const { perm: p2, twists: t2 } = cornerPermutationAndTwists(s2);
      expect(t2.reduce((a, b) => a + b, 0) % 3).toBe(0);
      expect(permParity(p2)).toBe(0);
    }

    for (const base of ['x', 'y', 'z']) {
      const { perm, twists } = cornerPermutationAndTwists(applyMove2(start, { base, amount: 1 }));
      expect(twists.reduce((a, b) => a + b, 0) % 3).toBe(0);
      expect(permParity(perm)).toBe(0);
    }

    // 随机 40 步序列（含 x/y/z 与面转）：检验角朝向和 mod 3 与置换奇偶性规律
    const rng = makeRng(424242);
    for (let i = 0; i < 100; i++) {
      const seq = randomMoves(rng, BASES2, 40);
      const state = applyMoves2(start, seq);
      const { perm, twists } = cornerPermutationAndTwists(state);

      // 8 个角位必为 0..7 的完整置换
      expect([...perm].sort((a, b) => a - b)).toEqual([0, 1, 2, 3, 4, 5, 6, 7]);
      expect(twists.reduce((a, b) => a + b, 0) % 3).toBe(0);

      const faceQuarterCount = seq
        .filter((m) => faceBases.includes(m.base))
        .reduce((acc, m) => acc + (m.amount === 2 ? 0 : 1), 0);
      expect(permParity(perm)).toBe((faceQuarterCount % 2) as 0 | 1);
    }
  });
});
