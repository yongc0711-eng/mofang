import { describe, expect, it } from 'vitest';
import { COLL_CASES } from './coll';
import { COLL_U_CORNER_TOP_LOCS, algSolvesCase, caseState, lintCase } from '../lib/cases';
import { STICKERS } from '../lib/cube';

// Independent J Perm reference, fetched 2026-11-12:
// https://www.jperm.net/lib/coll.js?v=20190924-1156
// L5 retains the source's x rotation; normalization is tested rather than rewriting the reference.
const JPERM_COLL_REF: Record<string, string> = {
  "coll-l-1": "R' U2 (R U R' U') R U R' U' R U R' U R",
  "coll-l-2": "R' U2 R' D' R U2 R' D R2",
  "coll-l-3": "R U2 R D R' U2 R D' R2",
  "coll-l-4": "F R' F' r U R U' r'",
  "coll-l-5": "x R' U R D' R' U' R D",
  "coll-l-6": "R' U' (R U R') F' R U R' U' R' F R2",
  "coll-u-1": "R' U' R U' R' U2 R R U R' U R U2 R'",
  "coll-u-2": "R' F R U' R' U' R U R' F' R U R' U' R' F R F' R",
  "coll-u-3": "R2 D R' U2 R D' R' U2 R'",
  "coll-u-4": "F R U' R' U R U R' U R U' R' F'",
  "coll-u-5": "R2 D' R U2 R' D R U2 R",
  "coll-u-6": "R2 D' R U R' D R U R U' R' U' R",
  "coll-t-1": "R U2 R' U' R U' R' R' U2 R U R' U R",
  "coll-t-2": "R' U R U2 R' L' U R U' L",
  "coll-t-3": "y l' U' L U l F' L' F",
  "coll-t-4": "y2 F R U R' U' R U' R' U' R U R' F'",
  "coll-t-5": "y' r U R' U' r' F R F'",
  "coll-t-6": "R' U R2 D r' U2 r D' R2 U' R",
  "coll-pi-1": "R U2 (R2 U' R2 U' R2) U2 R",
  "coll-pi-2": "R' F2 R U2 R U2 R' F2 U' R U' R'",
  "coll-pi-3": "R' U' F' R U R' U' R' F R2 U2 R' U2 R",
  "coll-pi-4": "R U R' U' R' F R2 U R' U' R U R' U' F'",
  "coll-pi-5": "R U' L' U R' U L U L' U L",
  "coll-pi-6": "R2 D' R U R' D R U R U' R' U R U R' U R",
  "coll-h-1": "R U R' U R U' R' U R U2 R'",
  "coll-h-2": "F R U' R' U R U2 R' U' R U R' U' F'",
  "coll-h-3": "R U R' U R U L' U R' U' L",
  "coll-h-4": "F R U R' U' R U R' U' R U R' U' F'",
  "coll-as-1": "L' U' L U' L' U2 L",
  "coll-as-2": "R' U2 F' R U R' U' R' F R2 U R' U R",
  "coll-as-3": "R2 D R' U2 R D' R2 U' R U' R'",
  "coll-as-4": "R' U' R U' R2 D' R U2 R' D R2",
  "coll-as-5": "L' U R U' L U R'",
  "coll-as-6": "y2 R U' R' U2 R U' R' U2 R' D' R U R' D R",
  "coll-s-1": "R U R' U R U2 R'",
  "coll-s-2": "L' U2 L U2 R U' L' U L R'",
  "coll-s-3": "R2 D' R U2 R' D R2 U R' U R",
  "coll-s-4": "y' R U R' U R U' R D R' U' R D' R2",
  "coll-s-5": "R U' L' U R' U' L",
  "coll-s-6": "F' R U2 R' U2 R' F2 R U R U' R' F'"
};

// CubeSkills PDF: page 1 Sune/Anti-Sune, page 2 L/T/U, page 3 Pi/H;
// row-major, left then right. Transcribed after rendering all three pages.
// https://www.cubeskills.com/uploads/pdf/tutorials/coll-algorithms.pdf
const CUBESKILLS_COLL_REF = [
  "R U R' U R U2' R'",
  "F' (R U2' R' U2) R' F2 (R U R U') R' F'",
  "R U' L' U R' U' L",
  "L' (R U R' U') L (U2 R U2' R')",
  "(L' U2 L U2') R (U' L' U L) R'",
  "y' (R U R' U) (R U' R D) (R' U' R D') R2'",
  "y R U2' R' U' R U' R'",
  "(R U' R' U2) (R U' R' U2) (R' D' R) U (R' D R)",
  "y2 L' U R U' L U R'",
  "y2 R (L' U' L U) R' (U2' L' U2 L)",
  "y2 (R U2 R' U2') L' (U R U' R') L",
  "y (R' U' R U') (R' U R' D') (R U R' D) R2",
  "y (R U R' U) (R U' R' U) (R U' R' U) R U2' R'",
  "y' r U2' (R2' F R F') R U2' r'",
  "y' (R U2 R D) (R' U2 R D') R2'",
  "y2 (R' U2 R' D') (R U2 R' D) R2",
  "y' (F R' F' r) (U R U' r')",
  "F' (r U R' U') (r' F R)",
  "(R U2' R' U' R U' R2') (U2' R U R' U R)",
  "y2 F (R U R' U') (R U' R' U') (R U R' F')",
  "(R' U R) U2' L' (R' U R U') L",
  "(R' U R2 D) (r' U2 r) (D' R2' U' R)",
  "y (l' U' L U) (R U' r' F)",
  "y' (r U R' U') (r' F R F')",
  "y2 (R U R' U R U2' R2') (U' R U' R' U2 R)",
  "F (R U' R' U) (R U R' U) (R U' R' F')",
  "y2 R2 D (R' U2 R) D' (R' U2 R')",
  "R2' D' (R U2 R') D (R U2 R)",
  "R' F (R U' R' U') (R U R' F') (R U R' U') (R' F R F' R)",
  "(R' U2 R) F (U' R' U' R) U F'",
  "R U2' R2' U' R2 U' R2' U2' R",
  "(R U D') (R U R' D) (R2 U' R' U') R2' U2' R",
  "y F (U R U' R') (U R U' R2') F' R (U R U' R')",
  "(R U R' U') R' F (R2 U R' U') (R U R' U') F'",
  "y' (R U R' U) F' (R U2' R' U2') (R' F R)",
  "y F (U R U' R') (U R U2' R') (U' R U R') F'",
  "(R U R' U) (R U' R' U) R U2' R'",
  "y F (R U R' U') (R U R' U') (R U R' U') F'",
  "F (R U' R' U) (R U2 R' U') (R U R' U') F'",
  "(R U R' U) (R U L' U) R' U' L",
];

describe('COLL 独立编号与收录范围', () => {
  it('40 个稳定 ID 和七组精确数量，不含 O / PLL', () => {
    expect(COLL_CASES).toHaveLength(40);
    expect(COLL_CASES.map((c) => c.id).sort()).toEqual(Object.keys(JPERM_COLL_REF).sort());
    expect(Object.fromEntries(['Antisune', 'Sune', 'L', 'U', 'T', 'Pi', 'H'].map(
      (group) => [group, COLL_CASES.filter((c) => c.group === group).length],
    ))).toEqual({ Antisune: 6, Sune: 6, L: 6, U: 6, T: 6, Pi: 6, H: 4 });
  });

  for (const c of COLL_CASES) {
    it(`${c.id} 与 J Perm 同号情形相符`, () => {
      expect(algSolvesCase(c, JPERM_COLL_REF[c.id])).toBe(true);
      const [, prefix, n] = c.id.split('-');
      expect(c.name).toBe(`${prefix === 'as' ? 'AS' : prefix === 'pi' ? 'Pi' : prefix.toUpperCase()} ${n}`);
    });

    it(`${c.id} 分类符合独立顶角几何特征`, () => {
      const st = caseState(c);
      const up = COLL_U_CORNER_TOP_LOCS.filter((loc) => STICKERS[st[loc]].face === 'U').map((loc) => STICKERS[loc]);
      // Locate the four U-colored corner stickers on their actual faces, independent of the formula text.
      const sideFaces = STICKERS.filter((s) => s.p[1] === 1 && s.p.every(Boolean) && st[s.id] !== undefined &&
        STICKERS[st[s.id]].face === 'U' && s.face !== 'U').map((s) => s.face);
      if (c.group === 'Sune' || c.group === 'Antisune') {
        expect(up).toHaveLength(1);
        // Right-handed corner normals distinguish Sune's twist direction from Anti-Sune's.
        const loc = STICKERS.find((s) => s.p.every(Boolean) && s.p[1] === 1 && s.face !== 'U' && STICKERS[st[s.id]].face === 'U')!;
        const [x, , z] = loc.p;
        const twist = x * loc.n[2] - z * loc.n[0];
        expect(twist).toBe(c.group === 'Sune' ? 1 : -1);
      } else if (c.group === 'L' || c.group === 'U' || c.group === 'T') {
        expect(up).toHaveLength(2);
        const diagonal = up[0].p[0] !== up[1].p[0] && up[0].p[2] !== up[1].p[2];
        expect(diagonal).toBe(c.group === 'L');
        if (c.group === 'U') expect(new Set(sideFaces).size).toBe(1);
        if (c.group === 'T') {
          expect(new Set(sideFaces).size).toBe(2);
          const normals = sideFaces.map((face) => STICKERS.find((s) => s.face === face)!.n);
          expect(normals[0].every((v, i) => v === -normals[1][i])).toBe(true);
        }
      } else {
        expect(['Pi', 'H']).toContain(c.group);
        expect(up).toHaveLength(0);
        expect(new Set(sideFaces).size).toBe(c.group === 'H' ? 2 : 3);
      }
    });
  }

  const matches = CUBESKILLS_COLL_REF.map((alg) => COLL_CASES.filter((c) => algSolvesCase(c, alg)).map((c) => c.id));
  it('CubeSkills 原表 40 条参考算法逐条且一对一覆盖全部 40 个情形', () => {
    expect(CUBESKILLS_COLL_REF).toHaveLength(40);
    for (let i = 0; i < matches.length; i++) expect(matches[i], CUBESKILLS_COLL_REF[i]).toHaveLength(1);
    expect(matches.flat().sort()).toEqual(COLL_CASES.map((c) => c.id).sort());
  });

  it('拒绝翻顶棱、破坏 F2L、PLL 和只对 CO 不对 CP 的备选公式', () => {
    const base = COLL_CASES[0];
    expect(lintCase({ ...base, algs: ["U' F' L F L' U2 L' U2 L"] })).toContain(`${base.id}: COLL prerequisite violated — U-layer edges are not oriented`);
    expect(lintCase({ ...base, algs: ["U r U' r' F R' F' R"] })).toContain('定义公式破坏了本该保持不动的块');
    expect(lintCase({ ...base, algs: ["R U R' U' R' F R2 U' R' U' R U R' F'"] })).toContain(`${base.id}: COLL state has all 4 U-corners already oriented (PLL/O case)`);
    expect(algSolvesCase(COLL_CASES.find((c) => c.id === 'coll-s-2')!, "R U R' U R U2 R'")).toBe(false);
  });
});
