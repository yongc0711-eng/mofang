import { describe, expect, it } from 'vitest';
import { getSet } from '../data';
import { OLL_CASES } from '../data/oll';
import { stickerAt } from './cube';
import { type AlgCase } from '../types';
import { algSolvesCase, caseFingerprint, displayColors, lintCase, lintCaseAlg } from './cases';

const lse = (group: string, alg: string): AlgCase => ({ id: 'lse-x', set: 'lse', name: 'x', group, algs: [alg] });

describe('LSE 校验', () => {
  it('EO：只要求朝向全对，其他公式解决不了', () => {
    const c = lse('EO', "M' U M'");
    expect(lintCase(c)).toEqual([]);
    expect(algSolvesCase(c, "M' U M'")).toBe(true);
    expect(algSolvesCase(c, 'U')).toBe(false);
  });
  it('步骤放错会被发现', () => {
    expect(lintCase(lse('EO', 'M2 U2 M2 U2'))).not.toEqual([]); // 朝向没变，不是 EO
    expect(lintCase(lse('4c', "M' U M'"))).not.toEqual([]); // 朝向错
    expect(lintCase(lse('4c', "M2 U M U2 M' U M2"))).not.toEqual([]); // 动了 UL/UR
    expect(lintCase(lse('UL/UR', 'M2 U2 M2 U2'))).not.toEqual([]); // UL、UR 已归位
    expect(lintCase(lse('其他', 'M2 U2 M2 U2'))).not.toEqual([]);
  });
  it('4c：必须完全还原，只差 U 层调整也算解决', () => {
    const c = lse('4c', 'M2 U2 M2 U2');
    expect(lintCase(c)).toEqual([]);
    expect(algSolvesCase(c, 'M2 U2 M2 U2')).toBe(true);
    expect(algSolvesCase(c, 'M2 U2 M2')).toBe(true);
    expect(algSolvesCase(c, 'M2')).toBe(false);
  });
  it('只能用 M 和 U', () => {
    expect(lintCase(lse('4c', "R U R'"))).not.toEqual([]);
  });
  it('LSE 备选公式即使能还原，带 R 也必须校验失败', () => {
    const c = lse('4c', 'M2 U2 M2 U2');
    c.algs.push("M2 U2 M2 U2 R R'");
    expect(lintCase(c)).toContain('只能使用 MU 转动，出现了 R');
  });
  it('LSE 自定义公式即使能还原，带 R 也必须校验失败', () => {
    const c = lse('4c', 'M2 U2 M2 U2');
    expect(algSolvesCase(c, "M2 U2 M2 U2 R R'")).toBe(false);
  });
  it('单条公式检查供自定义公式共用，合法 M/U 公式仍通过', () => {
    const c = lse('4c', 'M2 U2 M2 U2');
    expect(lintCaseAlg(c, "M2 U2 M2 U2 R R'")).toEqual(['只能使用 MU 转动，出现了 R']);
    expect(lintCaseAlg(c, "M' U2 M U'")).toEqual([]);
    c.algs.push(c.algs[0], "M2 U2 M2 U2 R R'");
    expect(lintCase(c)).toContain('只能使用 MU 转动，出现了 R');
  });
  it('EO 指纹只看好棱坏棱，排列不同也算同一情形', () => {
    expect(caseFingerprint(lse('EO', "M' U M'"))).toBe(caseFingerprint(lse('EO', "M' U M' U2 M2 U2 M2")));
  });
});

describe('其他公式组不受影响', () => {
  it('错误公式会被拒绝', () => {
    const t: AlgCase = { id: 'pll-t', set: 'pll', name: 'T', group: 'x', algs: ["R U R' U' R' F R2 U' R' U' R U R' F'"] };
    expect(algSolvesCase(t, "R U R'")).toBe(false);
  });
});

describe('F2L 不允许前置 U', () => {
  const c = getSet('f2l')!.cases[0];
  it('定义公式本身仍能解决情形', () => {
    expect(algSolvesCase(c, c.algs[0])).toBe(true);
  });
  it("前面多一个 U' 等于换了另一个情形，不能当作解", () => {
    expect(algSolvesCase(c, "U' " + c.algs[0])).toBe(false);
  });
});

describe('OLL 显示整个顶层（T20）', () => {
  for (const c of OLL_CASES) {
    it(`${c.id}：恰好显示顶层 21 张贴纸`, () => {
      expect(displayColors(c).filter((color) => color !== null)).toHaveLength(21);
    });
    it(`${c.id}：四个侧面顶行 12 个位置逐格可见`, () => {
      const colors = displayColors(c);
      for (const t of [-1, 0, 1]) {
        expect(colors[stickerAt([t, 1, 1], [0, 0, 1])], `F ${t}`).not.toBeNull();
        expect(colors[stickerAt([t, 1, -1], [0, 0, -1])], `B ${t}`).not.toBeNull();
        expect(colors[stickerAt([1, 1, t], [1, 0, 0])], `R ${t}`).not.toBeNull();
        expect(colors[stickerAt([-1, 1, t], [-1, 0, 0])], `L ${t}`).not.toBeNull();
      }
    });
  }
});
