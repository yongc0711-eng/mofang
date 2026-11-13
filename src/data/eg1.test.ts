import { describe, expect, it } from 'vitest';
import { parseAlg } from '../lib/alg';
import { applyMoves2, solved2, STICKERS2 } from '../lib/cube2';
import {
  algSolvesCase2,
  bottomBarCount2,
  caseFingerprint2,
  caseState2,
  CLL_RULE_2,
  EG1_RULE_2,
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
import { EG1_CASES, eg1Set } from './eg1';
import { EG2_CASES } from './eg2';

describe('EG-1 2x2 公式集与规则校验', () => {
  it('元信息、编号格式与分组计数精确为 6/4/6/6/6/6/6/1/1 = 42', () => {
    expect(eg1Set.id).toBe('eg1');
    expect(eg1Set.method).toBe('2x2');
    expect(eg1Set.name).toBe('EG-1');
    expect(eg1Set.expectedCount).toBe(42);
    expect(eg1Set.complete).toBe(true);
    expect(eg1Set.view).toBe('both2');
    expect(EG1_CASES).toHaveLength(42);

    const expectedIds = [
      ...Array.from({ length: 6 }, (_, i) => `eg1-as-${i + 1}`),
      ...Array.from({ length: 4 }, (_, i) => `eg1-h-${i + 1}`),
      ...Array.from({ length: 6 }, (_, i) => `eg1-l-${i + 1}`),
      ...Array.from({ length: 6 }, (_, i) => `eg1-pi-${i + 1}`),
      ...Array.from({ length: 6 }, (_, i) => `eg1-s-${i + 1}`),
      ...Array.from({ length: 6 }, (_, i) => `eg1-t-${i + 1}`),
      ...Array.from({ length: 6 }, (_, i) => `eg1-u-${i + 1}`),
      'eg1-adj-1',
      'eg1-diag-1',
    ];
    expect(EG1_CASES.map((c) => c.id)).toEqual(expectedIds);

    const counts = new Map<string, number>();
    for (const c of EG1_CASES) {
      expect(c.set).toBe('eg1');
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

  it('每条 EG-1 公式不含 x/y/z 且所有备选公式都能从起手严格解出到 solved2', () => {
    for (const c of EG1_CASES) {
      expect(lintCase2(c), `${c.id} lint 失败`).toEqual([]);
      for (const alg of c.algs) {
        expect(lintCaseAlg2(alg), `${c.id} 公式含非法转动: ${alg}`).toBeNull();
        expect(algSolvesCase2(c, alg), `${c.id} 公式未严格还原: ${alg}`).toBe(true);
      }
    }
  });

  it('每条 EG-1 起手均底面全定向（D 色都在 D 面）、底层恰好 1 条 bar、非六面单色，且 24 朝向最小指纹 42 条互异', () => {
    const fps = new Map<string, string>();
    const dIds = STICKERS2.filter((s) => s.face === 'D').map((s) => s.id);

    for (const c of EG1_CASES) {
      const start = caseState2(c);
      expect(isMonochromeFaces2(start), `${c.id} 不得是六面单色`).toBe(false);
      expect(isBottomOriented2(start), `${c.id} 底面四角未全部定向`).toBe(true);
      for (const id of dIds) expect(STICKERS2[start[id]].face).toBe('D');
      expect(bottomBarCount2(start), `${c.id} 底层 bar 数不是 1`).toBe(1);
      expect(SET_RULES_2.eg1.preserve(start, c.id)).toBe(true);

      const fp = caseFingerprint2(c);
      expect(fps.has(fp), `${c.id} 与 ${fps.get(fp)} 指纹重复`).toBe(false);
      fps.set(fp, c.id);
    }
    expect(fps.size).toBe(42);
  });

  it('三组 126 条（CLL 42 + EG-1 42 + EG-2 42）按 24 朝向指纹两两不同且规则严格互斥', () => {
    const all126 = [...CLL_CASES, ...EG1_CASES, ...EG2_CASES];
    expect(all126).toHaveLength(126);

    const fpOwner = new Map<string, string>();
    for (const c of all126) {
      const fp = caseFingerprint2(c);
      expect(fpOwner.has(fp), `${c.id} 与 ${fpOwner.get(fp)} 指纹冲突`).toBe(false);
      fpOwner.set(fp, c.id);
    }
    expect(fpOwner.size).toBe(126);

    for (const c of CLL_CASES) {
      const s = caseState2(c);
      expect(CLL_RULE_2.preserve(s, c.id)).toBe(true);
      expect(EG1_RULE_2.preserve(s, c.id)).toBe(false);
      expect(EG2_RULE_2.preserve(s, c.id)).toBe(false);
    }
    for (const c of EG1_CASES) {
      const s = caseState2(c);
      expect(CLL_RULE_2.preserve(s, c.id)).toBe(false);
      expect(EG1_RULE_2.preserve(s, c.id)).toBe(true);
      expect(EG2_RULE_2.preserve(s, c.id)).toBe(false);
    }
    for (const c of EG2_CASES) {
      const s = caseState2(c);
      expect(CLL_RULE_2.preserve(s, c.id)).toBe(false);
      expect(EG1_RULE_2.preserve(s, c.id)).toBe(false);
      expect(EG2_RULE_2.preserve(s, c.id)).toBe(true);
    }
  });

  it('负向测试：破坏底面定向、底层 0/4 条 bar、含转体公式、残留转体、六面单色与重复朝向', () => {
    const sample = EG1_CASES[0];
    expect(lintCaseAlg2(`y ${sample.algs[0]}`)).toContain('整体转体');
    expect(algSolvesCase2(sample, `y ${sample.algs[0]} y'`)).toBe(false);
    expect(algSolvesCase2(sample, `${sample.algs[0]} U`)).toBe(false);

    // 破坏底面定向（D 色不再都在 D 面）
    const brokenD: AlgCase = { id: 'eg1-neg-d', set: 'eg1', name: 'Neg D', group: 'H', algs: ["R U R' U'"] };
    expect(isBottomOriented2(caseState2(brokenD))).toBe(false);
    expect(lintCase2(brokenD).length).toBeGreaterThan(0);

    // 底层 4 条 bar（如单纯 T-Perm，底层已归位）被 EG-1 拒绝
    const cllAdj = CLL_CASES.find((c) => c.id === 'cll-adj-1')!;
    expect(bottomBarCount2(caseState2(cllAdj))).toBe(4);
    expect(EG1_RULE_2.preserve(caseState2(cllAdj), 'eg1-neg-4bar')).toBe(false);

    // 底层 0 条 bar（如对角换 R2 F2 R2）被 EG-1 拒绝
    const diagSwap = EG2_CASES.find((c) => c.id === 'eg2-diag-1')!;
    expect(bottomBarCount2(caseState2(diagSwap))).toBe(0);
    expect(EG1_RULE_2.preserve(caseState2(diagSwap), 'eg1-neg-0bar')).toBe(false);

    // 六面单色与残留整体转体
    expect(isSolvedExact2(applyMoves2(solved2(), parseAlg('x')))).toBe(false);
    const mono: AlgCase = { id: 'eg1-neg-mono', set: 'eg1', name: 'Neg Mono', group: 'H', algs: ['U2 U2'] };
    expect(isMonochromeFaces2(caseState2(mono))).toBe(true);
    expect(lintCase2(mono).length).toBeGreaterThan(0);

    // 24 朝向最小指纹能捕获旋转重复
    const rotStart = applyMoves2(caseState2(sample), parseAlg('x y'));
    expect(stateFingerprint2(rotStart)).toBe(caseFingerprint2(sample));
  });
});
