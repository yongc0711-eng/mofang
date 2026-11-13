import { describe, expect, it } from 'vitest';
import { parseAlg } from '../lib/alg';
import { applyMoves2, invertMoves2, solved2, STICKERS2 } from '../lib/cube2';
import {
  algSolvesCase2,
  caseFingerprint2,
  caseState2,
  isBottomLayerSolved2,
  isMonochromeFaces2,
  isSolvedExact2,
  lintCase2,
  lintCaseAlg2,
  SET_RULES_2,
  stateFingerprint2,
} from '../lib/cases2';
import type { AlgCase } from '../types';
import { CLL_CASES, cllSet } from './cll';

describe('CLL 2x2 公式集与规则校验', () => {
  it('元信息、编号格式与分组计数精确为 6/4/6/6/6/6/6/1/1 = 42', () => {
    expect(cllSet.id).toBe('cll');
    expect(cllSet.method).toBe('2x2');
    expect(cllSet.name).toBe('CLL');
    expect(cllSet.expectedCount).toBe(42);
    expect(cllSet.complete).toBe(true);
    expect(cllSet.view).toBe('top2');
    expect(CLL_CASES).toHaveLength(42);

    const expectedIds = [
      ...Array.from({ length: 6 }, (_, i) => `cll-as-${i + 1}`),
      ...Array.from({ length: 4 }, (_, i) => `cll-h-${i + 1}`),
      ...Array.from({ length: 6 }, (_, i) => `cll-l-${i + 1}`),
      ...Array.from({ length: 6 }, (_, i) => `cll-pi-${i + 1}`),
      ...Array.from({ length: 6 }, (_, i) => `cll-s-${i + 1}`),
      ...Array.from({ length: 6 }, (_, i) => `cll-t-${i + 1}`),
      ...Array.from({ length: 6 }, (_, i) => `cll-u-${i + 1}`),
      'cll-adj-1',
      'cll-diag-1',
    ];
    expect(CLL_CASES.map((c) => c.id)).toEqual(expectedIds);

    const counts = new Map<string, number>();
    for (const c of CLL_CASES) {
      expect(c.set).toBe('cll');
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

  it('每条 CLL 公式不含 x/y/z 且所有备选公式都能从起手严格解出到 solved2', () => {
    for (const c of CLL_CASES) {
      expect(lintCase2(c), `${c.id} lint 失败`).toEqual([]);
      for (const alg of c.algs) {
        expect(lintCaseAlg2(alg), `${c.id} 公式含非法转动: ${alg}`).toBeNull();
        expect(algSolvesCase2(c, alg), `${c.id} 公式未严格还原: ${alg}`).toBe(true);
      }
    }
  });

  it('每条 CLL 起手状态满足底层四角归位定向不变量、非六面单色，且 24 个朝向最小指纹 42 条无重复', () => {
    const fps = new Map<string, string>();
    const bottomSideIds = STICKERS2.filter((s) => s.p[1] === -1 && s.face !== 'D').map((s) => s.id);
    const dFaceIds = STICKERS2.filter((s) => s.face === 'D').map((s) => s.id);

    for (const c of CLL_CASES) {
      const start = caseState2(c);
      expect(isMonochromeFaces2(start), `${c.id} 不得是六面单色`).toBe(false);
      expect(isBottomLayerSolved2(start), `${c.id} 底层四角未完整保持归位定向`).toBe(true);
      expect(SET_RULES_2.cll.preserve(start, c.id)).toBe(true);

      for (const id of dFaceIds) {
        expect(STICKERS2[start[id]].face).toBe('D');
      }
      for (const id of bottomSideIds) {
        expect(STICKERS2[start[id]].face).toBe(STICKERS2[id].face);
      }

      const fp = caseFingerprint2(c);
      expect(fps.has(fp), `${c.id} 与 ${fps.get(fp)} 指纹重复`).toBe(false);
      fps.set(fp, c.id);
    }
    expect(fps.size).toBe(42);
  });

  it('负向测试：拒绝含整体转体公式、残留整体转体、底层破坏、六面单色与重复朝向指纹', () => {
    const sune = CLL_CASES.find((c) => c.id === 'cll-s-6')!;
    // 1. 含 x / y / z 的公式被拒绝
    expect(lintCaseAlg2("y R U R' U R U2 R'")).toContain('整体转体');
    expect(algSolvesCase2(sune, "y R U R' U R U2 R' y'")).toBe(false);

    const badRotationCase: AlgCase = {
      id: 'cll-neg-rot',
      set: 'cll',
      name: 'Neg Rot',
      group: 'Sune',
      algs: ["y R U R' U R U2 R'"],
    };
    expect(lintCase2(badRotationCase).length).toBeGreaterThan(0);

    // 2. 结尾多一步 U 或残留转体均不算解出
    expect(algSolvesCase2(sune, `${sune.algs[0]} U`)).toBe(false);
    const rotatedSolved = applyMoves2(solved2(), parseAlg('y'));
    expect(isSolvedExact2(rotatedSolved)).toBe(false);
    expect(isMonochromeFaces2(rotatedSolved)).toBe(true);

    // 3. 破坏底层四角归位/定向被不变量拒绝
    const brokenBottom: AlgCase = {
      id: 'cll-neg-bottom',
      set: 'cll',
      name: 'Neg Bottom',
      group: 'Sune',
      algs: ["R U R' U'"],
    };
    expect(isBottomLayerSolved2(caseState2(brokenBottom))).toBe(false);
    expect(lintCase2(brokenBottom).length).toBeGreaterThan(0);

    const dTurnOnly: AlgCase = {
      id: 'cll-neg-dturn',
      set: 'cll',
      name: 'Neg D',
      group: 'Sune',
      algs: ['D'],
    };
    expect(isBottomLayerSolved2(caseState2(dTurnOnly))).toBe(false);
    expect(lintCase2(dTurnOnly).length).toBeGreaterThan(0);

    // 4. 六面单色 / 已还原态（例如 U2 U2 等同于 solved2）被拒绝
    const solvedCase: AlgCase = {
      id: 'cll-neg-mono',
      set: 'cll',
      name: 'Neg Mono',
      group: 'Sune',
      algs: ['U2 U2'],
    };
    expect(isMonochromeFaces2(caseState2(solvedCase))).toBe(true);
    expect(lintCase2(solvedCase).length).toBeGreaterThan(0);

    // 5. 24 个整体朝向的最小指纹能识别旋转同构的重复状态
    const suneStart = caseState2(sune);
    const rotatedStart = applyMoves2(suneStart, parseAlg('x y'));
    expect(stateFingerprint2(rotatedStart)).toBe(stateFingerprint2(suneStart));

    // 同一个 Sune 在整体旋转后若用 y' 共轭公式复原，起手不同但物理朝向同构
    const conjSune: AlgCase = {
      id: 'cll-neg-dup',
      set: 'cll',
      name: 'Neg Dup',
      group: 'Sune',
      algs: ["F U F' U F U2 F'"],
    };
    expect(caseFingerprint2(conjSune)).toBe(caseFingerprint2(sune));
    // 但不直接等于 solved2 的状态通过 invertMoves2 验证同样可检测
    expect(isSolvedExact2(applyMoves2(suneStart, invertMoves2(parseAlg(sune.algs[0]))))).toBe(false);
  });
});
