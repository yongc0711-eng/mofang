import { describe, expect, it } from 'vitest';
import { parseAlg } from '../lib/alg';
import { applyMoves2, solved2, STICKERS2 } from '../lib/cube2';
import {
  algSolvesCase2,
  bottomBarCount2,
  caseFingerprint2,
  caseState2,
  EG2_RULE_2,
  isBottomOriented2,
  isMonochromeFaces2,
  isSolvedExact2,
  lintCase2,
  lintCaseAlg2,
  SET_RULES_2,
  stateFingerprint2,
} from '../lib/cases2';
import type { AlgCase } from '../types';
import { CLL_CASES } from './cll';
import { EG1_CASES } from './eg1';
import { EG2_CASES, eg2Set } from './eg2';

describe('EG-2 2x2 公式集与规则校验', () => {
  it('元信息、编号格式与分组计数精确为 6/4/6/6/6/6/6/1/1 = 42', () => {
    expect(eg2Set.id).toBe('eg2');
    expect(eg2Set.method).toBe('2x2');
    expect(eg2Set.name).toBe('EG-2');
    expect(eg2Set.expectedCount).toBe(42);
    expect(eg2Set.complete).toBe(true);
    expect(eg2Set.view).toBe('both2');
    expect(EG2_CASES).toHaveLength(42);

    const expectedIds = [
      ...Array.from({ length: 6 }, (_, i) => `eg2-as-${i + 1}`),
      ...Array.from({ length: 4 }, (_, i) => `eg2-h-${i + 1}`),
      ...Array.from({ length: 6 }, (_, i) => `eg2-l-${i + 1}`),
      ...Array.from({ length: 6 }, (_, i) => `eg2-pi-${i + 1}`),
      ...Array.from({ length: 6 }, (_, i) => `eg2-s-${i + 1}`),
      ...Array.from({ length: 6 }, (_, i) => `eg2-t-${i + 1}`),
      ...Array.from({ length: 6 }, (_, i) => `eg2-u-${i + 1}`),
      'eg2-adj-1',
      'eg2-diag-1',
    ];
    expect(EG2_CASES.map((c) => c.id)).toEqual(expectedIds);

    const counts = new Map<string, number>();
    for (const c of EG2_CASES) {
      expect(c.set).toBe('eg2');
      counts.set(c.group, (counts.get(c.group) ?? 0) + 1);
    }
    expect(Object.fromEntries(counts)).toEqual({
      Antisune: 6,
      H: 4,
      L: 6,
      Pi: 6,
      Sune: 6,
      T: 6,
      U: 6,
      Adjacent: 1,
      Diagonal: 1,
    });
  });

  it('每条 EG-2 公式不含 x/y/z 且所有备选公式都能从起手严格解出到 solved2', () => {
    for (const c of EG2_CASES) {
      expect(lintCase2(c), `${c.id} lint 失败`).toEqual([]);
      for (const alg of c.algs) {
        expect(lintCaseAlg2(alg), `${c.id} 公式含非法转动: ${alg}`).toBeNull();
        expect(algSolvesCase2(c, alg), `${c.id} 公式未严格还原: ${alg}`).toBe(true);
      }
    }
  });

  it('每条 EG-2 起手均底面全定向（D 色都在 D 面）、底层 0 条 bar、非六面单色，且 24 朝向最小指纹 42 条互异', () => {
    const fps = new Map<string, string>();
    const dIds = STICKERS2.filter((s) => s.face === 'D').map((s) => s.id);

    for (const c of EG2_CASES) {
      const start = caseState2(c);
      expect(isMonochromeFaces2(start), `${c.id} 不得是六面单色`).toBe(false);
      expect(isBottomOriented2(start), `${c.id} 底面四角未全部定向`).toBe(true);
      for (const id of dIds) expect(STICKERS2[start[id]].face).toBe('D');
      expect(bottomBarCount2(start), `${c.id} 底层 bar 数不是 0`).toBe(0);
      expect(SET_RULES_2.eg2.preserve(start, c.id)).toBe(true);

      const fp = caseFingerprint2(c);
      expect(fps.has(fp), `${c.id} 与 ${fps.get(fp)} 指纹重复`).toBe(false);
      fps.set(fp, c.id);
    }
    expect(fps.size).toBe(42);
  });

  it('负向测试：破坏底面定向、底层 1/4 条 bar、含转体公式、残留转体、六面单色与重复朝向', () => {
    const sample = EG2_CASES[0];
    expect(lintCaseAlg2(`z ${sample.algs[0]}`)).toContain('整体转体');
    expect(algSolvesCase2(sample, `y' ${sample.algs[0]} y`)).toBe(false);
    expect(algSolvesCase2(sample, `${sample.algs[0]} U'`)).toBe(false);

    // 破坏底面定向（D 色未全在 D 面）
    const brokenD: AlgCase = { id: 'eg2-neg-d', set: 'eg2', name: 'Neg D', group: 'H', algs: ["R U R' U'"] };
    expect(isBottomOriented2(caseState2(brokenD))).toBe(false);
    expect(lintCase2(brokenD).length).toBeGreaterThan(0);

    // 底层 1 条 bar（EG-1 邻换）被 EG-2 拒绝
    const eg1Adj = EG1_CASES.find((c) => c.id === 'eg1-adj-1')!;
    expect(bottomBarCount2(caseState2(eg1Adj))).toBe(1);
    expect(EG2_RULE_2.preserve(caseState2(eg1Adj), 'eg2-neg-1bar')).toBe(false);

    // 底层 4 条 bar（CLL 顶层换角）被 EG-2 拒绝
    const cllDiag = CLL_CASES.find((c) => c.id === 'cll-diag-1')!;
    expect(bottomBarCount2(caseState2(cllDiag))).toBe(4);
    expect(EG2_RULE_2.preserve(caseState2(cllDiag), 'eg2-neg-4bar')).toBe(false);

    // 六面单色与残留转体
    expect(isSolvedExact2(applyMoves2(solved2(), parseAlg('z')))).toBe(false);
    const mono: AlgCase = { id: 'eg2-neg-mono', set: 'eg2', name: 'Neg Mono', group: 'H', algs: ["R R'"] };
    expect(isMonochromeFaces2(caseState2(mono))).toBe(true);
    expect(lintCase2(mono).length).toBeGreaterThan(0);

    // 24 朝向最小指纹能捕获旋转重复
    const rotStart = applyMoves2(caseState2(sample), parseAlg('z y2'));
    expect(stateFingerprint2(rotStart)).toBe(caseFingerprint2(sample));
  });
});
