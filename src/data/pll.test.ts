import { describe, expect, it } from 'vitest';
import { caseState, cycleTypes } from '../lib/cases';
import { applyMoves, STICKERS, stickerAt, type Face, type State, type Vec } from '../lib/cube';
import { PLL_CASES } from './pll';

/**
 * 车灯：侧面 F/R/B/L 的 U 层两角贴纸同色、中棱不同色。
 * 色条：该侧面 U 层三张贴纸同色。
 * 同色对：该面角贴纸与中棱同色；从该面外侧看，左角/右角分别记。
 * 角/棱轮换：cycleTypes(caseState(c))，不从公式字符串猜测。
 * AUF：仅枚举四个 U 转动，取完整特征 JSON 的字典序最小值；不按 y 归一化。
 * 描述的“后面”通过 U 转动让色条/车灯所在位置到 B，不改颜色或整体朝向。
 *
 * 下表先于提取函数编写：数目、位置来自 recognition 文字；轮换来自
 * 只换棱/只换角/相邻换角/对角换角及标准 PLL 名称对应的轮换含义。
 * 色条贡献两个同色对，文字中的“另有”三处不包含色条的两处。
 * V/Y 文字没有指定绝对侧面，所以分别断言共用同角/两个对角。
 */
type Expected = { id: string; heads: number; bars: number; pairs: string[] | 'shared' | 'diagonal'; corners: number[]; edges: number[]; words: string[] };
const expected: Expected[] = [
  { id: 'ua', heads: 3, bars: 1, pairs: ['B.l', 'B.r'], corners: [], edges: [3], words: ['其余三面都是车灯', '左面的棱是前面的灯色'] },
  { id: 'ub', heads: 3, bars: 1, pairs: ['B.l', 'B.r'], corners: [], edges: [3], words: ['其余三面都是车灯', '左面的棱是右面的灯色'] },
  { id: 'h', heads: 4, bars: 0, pairs: [], corners: [], edges: [2, 2], words: ['四面都是车灯', '对面互换'] },
  { id: 'z', heads: 4, bars: 0, pairs: [], corners: [], edges: [2, 2], words: ['四面都是车灯', '相邻的两条棱互换'] },
  { id: 'aa', heads: 1, bars: 0, pairs: ['F.l', 'L.r'], corners: [3], edges: [], words: ['左前角的左面和前面两块', '第三块在右面的棱上'] },
  { id: 'ab', heads: 1, bars: 0, pairs: ['F.r', 'R.l'], corners: [3], edges: [], words: ['右前角的前面和右面两块', '第三块在左面的棱上'] },
  { id: 'e', heads: 0, bars: 0, pairs: [], corners: [2, 2], edges: [], words: ['没有车灯、没有色条', '没有任何两块相邻同色'] },
  { id: 't', heads: 1, bars: 0, pairs: ['L.l', 'R.r'], corners: [2], edges: [2], words: ['左后角的左面、右后角的右面', '第三块在前面的棱上'] },
  { id: 'f', heads: 0, bars: 1, pairs: ['B.l', 'B.r'], corners: [2], edges: [2], words: ['后面是整条色条', '其余三面没有车灯'] },
  { id: 'ja', heads: 0, bars: 1, pairs: ['B.l', 'B.r', 'F.l', 'L.l', 'R.l'], corners: [2], edges: [2], words: ['左面靠后的两块、前面靠左的两块、右面靠前的两块'] },
  { id: 'jb', heads: 0, bars: 1, pairs: ['B.l', 'B.r', 'F.r', 'L.r', 'R.r'], corners: [2], edges: [2], words: ['左面靠前的两块、前面靠右的两块、右面靠后的两块'] },
  { id: 'ra', heads: 1, bars: 0, pairs: ['L.l'], corners: [2], edges: [2], words: ['左面靠后的两块同色', '第三块在右面的棱上'] },
  { id: 'rb', heads: 1, bars: 0, pairs: ['R.r'], corners: [2], edges: [2], words: ['右面靠后的两块同色', '第三块在左面的棱上'] },
  { id: 'ga', heads: 1, bars: 0, pairs: ['L.r'], corners: [3], edges: [3], words: ['左面靠前的两块同色', '第三块在前面的棱上'] },
  { id: 'gb', heads: 1, bars: 0, pairs: ['F.r'], corners: [3], edges: [3], words: ['前面靠右的两块同色', '第三块在右面的棱上'] },
  { id: 'gc', heads: 1, bars: 0, pairs: ['R.l'], corners: [3], edges: [3], words: ['右面靠前的两块同色', '第三块在前面的棱上'] },
  { id: 'gd', heads: 1, bars: 0, pairs: ['F.l'], corners: [3], edges: [3], words: ['前面靠左的两块同色', '第三块在左面的棱上'] },
  { id: 'v', heads: 0, bars: 0, pairs: 'shared', corners: [2], edges: [2], words: ['只有两处同色对', '共用同一个角'] },
  { id: 'y', heads: 0, bars: 0, pairs: 'diagonal', corners: [2], edges: [2], words: ['只有两处同色对', '对角的两个角上'] },
  { id: 'na', heads: 0, bars: 0, pairs: ['B.r', 'F.r', 'L.r', 'R.r'], corners: [2], edges: [2], words: ['每面都在右边两块'] },
  { id: 'nb', heads: 0, bars: 0, pairs: ['B.l', 'F.l', 'L.l', 'R.l'], corners: [2], edges: [2], words: ['每面都在左边两块'] },
];

// Cross-face clauses are also literal expectations, not generated from states.
const lampEdge: Record<string, Face> = {
  aa: 'R', ab: 'L', t: 'F', ra: 'R', rb: 'L', ga: 'F', gb: 'R', gc: 'F', gd: 'L',
};
const uEdgeSources: Record<string, Record<string, Face>> = {
  ua: { L: 'F', F: 'R', R: 'L' }, ub: { L: 'R', F: 'L', R: 'F' },
};
const sides: Face[] = ['F', 'R', 'B', 'L'];
function rowPositions(face: Face): Vec[] {
  // Left to right when looking at each side from outside (not SVG order).
  switch (face) {
    case 'F': return [[-1, 1, 1], [0, 1, 1], [1, 1, 1]];
    case 'R': return [[1, 1, 1], [1, 1, 0], [1, 1, -1]];
    case 'B': return [[1, 1, -1], [0, 1, -1], [-1, 1, -1]];
    case 'L': return [[-1, 1, -1], [-1, 1, 0], [-1, 1, 1]];
    default: throw new Error('not a side');
  }
}
const normals: Record<string, Vec> = { F: [0, 0, 1], R: [1, 0, 0], B: [0, 0, -1], L: [-1, 0, 0] };
function features(state: State) {
  const heads: string[] = [], bars: string[] = [], pairs: string[] = [];
  for (const face of sides) {
    const [l, e, r] = rowPositions(face).map((p) => STICKERS[state[stickerAt(p, normals[face])]].face);
    if (l === r && l !== e) heads.push(face);
    if (l === e && e === r) bars.push(face);
    if (l === e) pairs.push(`${face}.l`);
    if (r === e) pairs.push(`${face}.r`);
  }
  return { heads: heads.sort(), bars: bars.sort(), pairs: pairs.sort(), ...cycleTypes(state) };
}
function aufStates(state: State) {
  return [state, ...([1, 2, 3] as const).map((amount) => applyMoves(state, [{ base: 'U', amount }]))];
}
const signature = (state: State) => aufStates(state).map((s) => JSON.stringify(features(s))).sort()[0];

function pairTopology(pairs: string[]) {
  const positions = pairs.map((pair) => {
    const [face, side] = pair.split('.');
    return rowPositions(face as Face)[side === 'l' ? 0 : 2];
  });
  if (positions.length !== 2) return 'other';
  const [a, b] = positions;
  if (a[0] === b[0] && a[2] === b[2]) return 'shared';
  return a[0] === -b[0] && a[2] === -b[2] ? 'diagonal' : 'other';
}

describe('PLL recognition 特征（T18）', () => {
  it('期望表恰好覆盖全部 21 条', () => {
    expect(expected.map((e) => `pll-${e.id}`).sort()).toEqual(PLL_CASES.map((c) => c.id).sort());
  });
  for (const e of expected) {
    it(`${e.id}：文字推导的数目、同色对位置及轮换一致`, () => {
      const c = PLL_CASES.find((c) => c.id === `pll-${e.id}`)!;
      for (const word of e.words) expect(c.recognition).toContain(word);
      const state = caseState(c);
      const candidates = aufStates(state).map(features);
      const anchored = candidates.filter((f) => e.bars === 1 ? f.bars.includes('B') : e.heads === 1 ? f.heads.includes('B') : true);
      expect(anchored.some((f) => f.heads.length === e.heads && f.bars.length === e.bars &&
        (typeof e.pairs === 'string' ? pairTopology(f.pairs) === e.pairs : JSON.stringify(f.pairs) === JSON.stringify([...e.pairs].sort()))), JSON.stringify(candidates)).toBe(true);
      if (lampEdge[e.id] || uEdgeSources[e.id] || e.id === 'h' || e.id === 'z') {
        expect(aufStates(state).some((s) => {
          const f = features(s);
          const rows = Object.fromEntries(sides.map((face) => [face,
            rowPositions(face).map((p) => STICKERS[s[stickerAt(p, normals[face])]].face),
          ]));
          if (lampEdge[e.id]) {
            return f.heads.includes('B') && rows[lampEdge[e.id]][1] === rows.B[0];
          }
          if (uEdgeSources[e.id]) {
            return f.bars.includes('B') && Object.entries(uEdgeSources[e.id]).every(([face, source]) => rows[face][1] === rows[source][0]);
          }
          const sources = sides.map((face) => sides.findIndex((source) => rows[face][1] === rows[source][0]));
          if (e.id === 'h') return sources.every((source, i) => source === (i + 2) % 4);
          return sources.every((source, i) => (source === (i + 1) % 4 || source === (i + 3) % 4) && sources[source] === i);
        }), '跨面灯色/棱的对应关系与文字一致').toBe(true);
      }
      // A formula may include a final AUF. Compare the named permutation in its
      // U orbit rather than confusing an unadjusted U layer with a new PLL.
      expect(candidates.map((f) => ({ corners: f.corners, edges: f.edges }))).toContainEqual({ corners: e.corners, edges: e.edges });
    });
  }
  it('每条特征签名对四种 AUF 不变', () => {
    for (const c of PLL_CASES) {
      const state = caseState(c);
      expect(new Set(aufStates(state).map(signature)).size, c.id).toBe(1);
    }
  });
  it('21 条 AUF 特征签名两两不同', () => {
    const groups = new Map<string, string[]>();
    for (const c of PLL_CASES) {
      const key = signature(caseState(c));
      groups.set(key, [...(groups.get(key) ?? []), c.id]);
    }
    expect([...groups.values()].filter((ids) => ids.length > 1)).toEqual([]);
    expect(groups.size).toBe(21);
  });
});
