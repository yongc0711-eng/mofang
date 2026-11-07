import { Quaternion, Vector3 } from 'three';
import { describe, expect, it } from 'vitest';
import { ALL_CASES } from '../data';
import { parseAlg } from './alg';
import { STICKERS, applyMove, moveGeometry, solved, stickerAt, type Move, type Vec } from './cube';
import { Timeline, easeMove } from './timeline';

const AXES = [new Vector3(1, 0, 0), new Vector3(0, 1, 0), new Vector3(0, 0, 1)];
const round = (v: Vector3): Vec => [Math.round(v.x), Math.round(v.y), Math.round(v.z)].map((n) => n + 0) as Vec;

/** 用 Three.js 的旋转算一次转动，和渲染时走的是同一套数学 */
function rotateWithThree(state: number[], move: Move): number[] {
  const { axis, layers, angle } = moveGeometry(move);
  const q = new Quaternion().setFromAxisAngle(AXES[axis], angle);
  const next = [...state];
  for (const s of STICKERS) {
    if (!layers.includes(s.p[axis])) continue;
    const p = round(new Vector3(...s.p).applyQuaternion(q));
    const n = round(new Vector3(...s.n).applyQuaternion(q));
    next[stickerAt(p, n)] = state[s.id];
  }
  return next;
}

describe('动画几何和引擎一致', () => {
  for (const base of 'RLUDFBMESrludfbxyz') {
    for (const amount of [1, 2, 3] as const) {
      it(`${base} × ${amount}`, () => {
        const m = { base, amount };
        const start = applyMove(applyMove(solved(), { base: 'R', amount: 1 }), { base: 'U', amount: 1 });
        expect(rotateWithThree(start, m)).toEqual(applyMove(start, m));
      });
    }
  }
});

describe('全部公式的播放', () => {
  it('逐步转动后回到已还原，且和引擎一致', () => {
    expect(ALL_CASES.length).toBeGreaterThan(0);
    for (const c of ALL_CASES) {
      for (const alg of c.algs) {
        const tl = new Timeline(alg);
        let st = tl.states[0];
        for (const m of tl.moves) st = rotateWithThree(st, m);
        expect(st, `${c.id}: ${alg}`).toEqual(solved());
        expect(tl.frameAt(tl.duration).state, `${c.id}: ${alg}`).toEqual(solved());
      }
    }
  });
});

describe('时间线', () => {
  const tl = new Timeline("R U2 R'");
  const [a, b, c, end] = tl.starts;
  it('步长：180° 比 90° 长，但不到两倍', () => {
    expect(c - b).toBeGreaterThan(b - a);
    expect(c - b).toBeLessThan((b - a) * 2);
  });
  it('开头、中途、边界、结尾', () => {
    expect(tl.frameAt(0)).toMatchObject({ move: null, moveIndex: -1 });
    expect(tl.frameAt(-5).moveIndex).toBe(-1);
    expect(tl.frameAt(b / 2)).toMatchObject({ moveIndex: 0, fraction: 0.5, move: parseAlg('R')[0] });
    expect(tl.frameAt(b)).toMatchObject({ move: null, moveIndex: 0, state: tl.states[1] });
    expect(tl.frameAt(c - 1).moveIndex).toBe(1);
    expect(tl.frameAt(end)).toMatchObject({ move: null, moveIndex: 2, state: solved() });
    expect(tl.frameAt(end + 100).state).toEqual(solved());
  });
  it('单步边界', () => {
    expect(tl.nextBoundary(0)).toBe(b);
    expect(tl.nextBoundary(b)).toBe(c);
    expect(tl.nextBoundary(b - 1)).toBe(b);
    expect(tl.nextBoundary(end)).toBe(end);
    expect(tl.prevBoundary(end)).toBe(c);
    expect(tl.prevBoundary(b + 1)).toBe(b);
    expect(tl.prevBoundary(0)).toBe(0);
  });
  it('空公式不出错', () => {
    const e = new Timeline('');
    expect(e.duration).toBe(0);
    expect(e.frameAt(10)).toMatchObject({ move: null, moveIndex: -1 });
  });
  it('缓动首尾精确', () => {
    expect(easeMove(0)).toBe(0);
    expect(easeMove(1)).toBe(1);
    expect(easeMove(0.5)).toBeCloseTo(0.5);
  });
});
