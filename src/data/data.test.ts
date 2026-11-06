import { describe, expect, it } from 'vitest';
import { algSolvesCase, caseFingerprint, caseState, cycleTypes, lintCase } from '../lib/cases';
import { parseAlg } from '../lib/alg';
import { applyMoves } from '../lib/cube';
import { ALL_CASES, SETS } from './index';

describe('全部公式数据', () => {
  it('id 全站唯一，且 id 属于所在组', () => {
    const ids = ALL_CASES.map((c) => c.id);
    expect(ids.filter((id, i) => ids.indexOf(id) !== i)).toEqual([]);
    for (const set of SETS) {
      for (const c of set.cases) {
        expect(c.set, c.id).toBe(set.id);
        expect(c.id.startsWith(`${set.id}-`), c.id).toBe(true);
      }
    }
  });
});

for (const set of SETS) {
  describe(`${set.name}（已录入 ${set.cases.length}${set.expectedCount ? ` / ${set.expectedCount}` : ''}）`, () => {
    it('数量符合标准', () => {
      if (set.expectedCount === null) return;
      if (set.complete) expect(set.cases.length).toBe(set.expectedCount);
      else expect(set.cases.length).toBeLessThanOrEqual(set.expectedCount);
    });

    for (const c of set.cases) {
      it(`${c.name}：公式合法且确实解决该情形`, () => {
        expect(c.algs.length).toBeGreaterThan(0);
        for (const alg of c.algs) expect(() => parseAlg(alg), alg).not.toThrow();
        expect(lintCase(c)).toEqual([]);
        for (const alg of c.algs) expect(algSolvesCase(c, alg), `备选公式不匹配：${alg}`).toBe(true);
      });
    }

    it('没有重复录入同一情形', () => {
      const seen = new Map<string, string>();
      const dupes: string[] = [];
      for (const c of set.cases) {
        const fp = caseFingerprint(c);
        if (seen.has(fp)) dupes.push(`${seen.get(fp)} = ${c.name}`);
        else seen.set(fp, c.name);
      }
      expect(dupes).toEqual([]);
    });
  });
}

describe('LSE 收录完整', () => {
  // 数量来自穷举 M/U 转动的全部可达状态
  const count = (group: string) => SETS.find((s) => s.id === 'lse')!.cases.filter((c) => c.group === group).length;
  it('EO 11 种', () => expect(count('EO')).toBe(11));
  it('UL/UR 46 种', () => expect(count('UL/UR')).toBe(46));
  it('4c 36 种', () => expect(count('4c')).toBe(36));
});

describe('PLL 名称校验', () => {
  // 角、棱轮换结构是各 PLL 的固定特征，能发现名称和公式对不上的情况
  const EXPECTED: Record<string, { corners: number[]; edges: number[] }> = {
    Ua: { corners: [], edges: [3] },
    Ub: { corners: [], edges: [3] },
    H: { corners: [], edges: [2, 2] },
    Z: { corners: [], edges: [2, 2] },
    Aa: { corners: [3], edges: [] },
    Ab: { corners: [3], edges: [] },
    E: { corners: [2, 2], edges: [] },
    T: { corners: [2], edges: [2] },
    F: { corners: [2], edges: [2] },
    Ja: { corners: [2], edges: [2] },
    Jb: { corners: [2], edges: [2] },
    Ra: { corners: [2], edges: [2] },
    Rb: { corners: [2], edges: [2] },
    Ga: { corners: [3], edges: [3] },
    Gb: { corners: [3], edges: [3] },
    Gc: { corners: [3], edges: [3] },
    Gd: { corners: [3], edges: [3] },
    V: { corners: [2], edges: [2] },
    Y: { corners: [2], edges: [2] },
    Na: { corners: [2], edges: [2] },
    Nb: { corners: [2], edges: [2] },
  };
  const pll = SETS.find((s) => s.id === 'pll')!;
  for (const c of pll.cases) {
    it(c.name, () => {
      // 公式末尾可能差一个 U 层调整，四种都看
      const auf = ['', 'U', 'U2', "U'"].map((a) =>
        JSON.stringify(cycleTypes(applyMoves(caseState(c), parseAlg(a)))),
      );
      expect(auf).toContain(JSON.stringify(EXPECTED[c.name]));
    });
  }
});
