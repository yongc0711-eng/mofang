import { describe, expect, it } from 'vitest';
import { parseAlg } from '../lib/alg';
import type { Move } from '../lib/cube';
import { applyMoves2, invertMoves2, solved2, STICKERS2, type State2 } from '../lib/cube2';
import { CLL_CASES } from './cll';

/**
 * 外部权威来源对照数据（2026-04 实抓离线固化，避免测试依赖网络或临时目录）：
 * 1) J Perm (https://jperm.net/lib/2x2cll.js) — 完整 42 条（40 条 OLL 分类 + PLL Adjacent/Diagonal）
 * 2) SpeedCubeDB (https://speedcubedb.com/a/2x2/CLL) — 40 条（AS/H/L/Pi/Sune/T/U，不含 Adjacent/Diagonal）
 */

interface JpRef {
  name: string;
  group: string;
  alg: string;
}

const JP_REFS: JpRef[] = [
  { name: 'L1', group: 'L', alg: "R' U R' U2 R U' R' U R U' R2" },
  { name: 'L2', group: 'L', alg: "R U2 R2 F2 R U R' F2 R F'" },
  { name: 'L3', group: 'L', alg: "R U2 R' F' R U2 R' U R' F2 R" },
  { name: 'L4', group: 'L', alg: "F R' F' R U R U' R'" },
  { name: 'L5', group: 'L', alg: "F R U' R' U' R U R' F'" },
  { name: 'L6', group: 'L', alg: "R U2 R' R' F R F' R U2 R'" },
  { name: 'U1', group: 'U', alg: "R2 F2 R U R' F R2 U2 R' U' R" },
  { name: 'U2', group: 'U', alg: "R U2 R U' R' F R' F2 U' F" },
  { name: 'U3', group: 'U', alg: "R' U R' F R F' R U2 R' U R" },
  { name: 'U4', group: 'U', alg: "F R' F' R U' R U' R' U2 R U' R'" },
  { name: 'U5', group: 'U', alg: "R U' R' R' F R F' R U R' U' R U R'" },
  { name: 'U6', group: 'U', alg: "F R U R' U' F'" },
  { name: 'T1', group: 'T', alg: "R' U R U2 R2 F' R U' R' F2 R2" },
  { name: 'T2', group: 'T', alg: "R' U R U2 R' R' F R F' R" },
  { name: 'T3', group: 'T', alg: "y L' U' L U L F' L' F" },
  { name: 'T4', group: 'T', alg: "F R U R' U' R U' R' U' R U R' F'" },
  { name: 'T5', group: 'T', alg: "R U R' U' R' F R F'" },
  { name: 'T6', group: 'T', alg: "F U' R U2 R' U' F2 R U R'" },
  { name: 'P1', group: 'Pi', alg: "R U' R2 U R2 U R2 U' R" },
  { name: 'P2', group: 'Pi', alg: "R' F2 R F' U2 R U' R' U' F" },
  { name: 'P3', group: 'Pi', alg: "F R2 U' R2 U R2 U R2 F'" },
  { name: 'P4', group: 'Pi', alg: "R U2 R' U' R U R' U2 R' F R F'" },
  { name: 'P5', group: 'Pi', alg: "R U' R' F R' F R U R' F R" },
  { name: 'P6', group: 'Pi', alg: "R' U' R' F R F' R U' R' U2 R" },
  { name: 'H1', group: 'H', alg: 'R2 U2 R\' U2 R2' },
  { name: 'H2', group: 'H', alg: "F R2 U' R2 U' R2 U R2 F'" },
  { name: 'H3', group: 'H', alg: "R U R' U R U L' U R' U' L" },
  { name: 'H4', group: 'H', alg: "x' U2 R U2 R2 F2 R U2 x" },
  { name: 'AS1', group: 'Antisune', alg: "L' U' L U' L' U2 L" },
  { name: 'AS2', group: 'Antisune', alg: "L' U' L U L F' L' F L' U' L U' L' U2 L" },
  { name: 'AS3', group: 'Antisune', alg: "F' L F L' U2 L' U2 L" },
  { name: 'AS4', group: 'Antisune', alg: "R U2 R' U2 R' F R F'" },
  { name: 'AS5', group: 'Antisune', alg: "R' F R F' R U R'" },
  { name: 'AS6', group: 'Antisune', alg: "R' U R U' R2 F R F' R U R' U' R" },
  { name: 'S1', group: 'Sune', alg: "R U R' U R U2 R'" },
  { name: 'S2', group: 'Sune', alg: "L' U2 L U2 L F' L' F" },
  { name: 'S3', group: 'Sune', alg: "F R' F' R U2 R U2 R'" },
  { name: 'S4', group: 'Sune', alg: "R U R' U' R' F R F' R U R' U R U2 R'" },
  { name: 'S5', group: 'Sune', alg: "L F' L' F L' U' L" },
  { name: 'S6', group: 'Sune', alg: "R U R' U R' F R F' R U2 R'" },
  { name: 'Adjacent', group: 'PLL', alg: "R U R' U' R' F R2 U' R' U' R U R' F'" },
  { name: 'Diagonal', group: 'PLL', alg: "F R U' R' U' R U R' F' R U R' U' R' F R F'" },
];

interface ScdbRef {
  name: string;
  group: string;
  alg: string;
}

const SCDB_REFS: ScdbRef[] = [
  { name: 'CLL AS 1', group: 'Antisune', alg: "y R U2 R' U' R U' R'" },
  { name: 'CLL AS 2', group: 'Antisune', alg: "R U2 R' F R' F' R U' R U' R'" },
  { name: 'CLL AS 3', group: 'Antisune', alg: "y2 F' L F L' U2 L' U2 L" },
  { name: 'CLL AS 4', group: 'Antisune', alg: "y2 R' F R F' R U R'" },
  { name: 'CLL AS 5', group: 'Antisune', alg: "y2 R U2 R' U2 R' F R F'" },
  { name: 'CLL AS 6', group: 'Antisune', alg: "y' R U2 R' U' R U' R' F R' F' R U R U' R' U'" },
  { name: 'CLL H 1', group: 'H', alg: "F R2 U' R2 U' R2 U R2 F'" },
  { name: 'CLL H 2', group: 'H', alg: "R U R' U R U R' F R' F' R" },
  { name: 'CLL H 3', group: 'H', alg: "R U' R' F R' F' R2 U' R' F R' F' R" },
  { name: 'CLL H 4', group: 'H', alg: "y R2 U2 R' U2 R2" },
  { name: 'CLL L 1', group: 'L', alg: "y R U2 R' F' R U2 R' U R' F2 R" },
  { name: 'CLL L 2', group: 'L', alg: "y2 R U2 R2 F2 R U R' F2 R F'" },
  { name: 'CLL L 3', group: 'L', alg: "y2 R' U R' U2 R U' R' U R U' R2" },
  { name: 'CLL L 4', group: 'L', alg: "y R U2 R2 F R F' R U2 R'" },
  { name: 'CLL L 5', group: 'L', alg: "y F R' F' R U R U' R'" },
  { name: 'CLL L 6', group: 'L', alg: "y F R U' R' U' R U R' F'" },
  { name: 'CLL Pi 1', group: 'Pi', alg: "R' F2 R F' U2 R U' R' U' F" },
  { name: 'CLL Pi 2', group: 'Pi', alg: "R U2 R' U' R U R' U2 R' F R F'" },
  { name: 'CLL Pi 3', group: 'Pi', alg: "y F R2 U' R2 U R2 U R2 F'" },
  { name: 'CLL Pi 4', group: 'Pi', alg: "R U' R' F R' F R U R' F R" },
  { name: 'CLL Pi 5', group: 'Pi', alg: "y' R' U' R' F R F' R U' R' U2 R" },
  { name: 'CLL Pi 6', group: 'Pi', alg: "R U' R2 U R2 U R2 U' R" },
  { name: 'CLL Sune 1', group: 'Sune', alg: "L' U2 L U2 L F' L' F" },
  { name: 'CLL Sune 2', group: 'Sune', alg: "R U R' U' R' F R F' R U R' U R U2 R'" },
  { name: 'CLL Sune 3', group: 'Sune', alg: "R U' R' F R' F' R" },
  { name: 'CLL Sune 4', group: 'Sune', alg: "F R' F' R U2 R U2 R'" },
  { name: 'CLL Sune 5', group: 'Sune', alg: "y2 R U R' U R' F R F' R U2 R'" },
  { name: 'CLL Sune 6', group: 'Sune', alg: "R U R' U R U2 R'" },
  { name: 'CLL T 1', group: 'T', alg: "y' R U R' U' R' F R F'" },
  { name: 'CLL T 2', group: 'T', alg: "y L' U' L U L F' L' F" },
  { name: 'CLL T 3', group: 'T', alg: "F U' R U2 R' U' F2 R U R'" },
  { name: 'CLL T 4', group: 'T', alg: "R' U R U2 R2 F' R U' R' F2 R2" },
  { name: 'CLL T 5', group: 'T', alg: "y2 F R U R' U' R U' R' U' R U R' F'" },
  { name: 'CLL T 6', group: 'T', alg: "R' U R U2 R2 F R F' R" },
  { name: 'CLL U 1', group: 'U', alg: "y' F R U R' U' F'" },
  { name: 'CLL U 2', group: 'U', alg: "R' U' R2 U R' U2 R U2 R' U R'" },
  { name: 'CLL U 3', group: 'U', alg: "y' R U2 R U' R' F R' F2 U' F" },
  { name: 'CLL U 4', group: 'U', alg: "y' F R' F' R U' R U' R' U2 R U' R'" },
  { name: 'CLL U 5', group: 'U', alg: "R U' R2 F R F' R U R' U' R U R'" },
  { name: 'CLL U 6', group: 'U', alg: "R' U R' F R F' R U2 R' U R" },
];

const U_AUF_VARIANTS: Move[][] = [
  [],
  [{ base: 'U', amount: 1 }],
  [{ base: 'U', amount: 2 }],
  [{ base: 'U', amount: 3 }],
];

const Y_ROTATIONS: Move[][] = [
  [],
  [{ base: 'y', amount: 1 }],
  [{ base: 'y', amount: 2 }],
  [{ base: 'y', amount: 3 }],
];

function canonicalYPattern2(state: State2): string {
  const map = new Map<string, string>();
  const labels = '012345';
  let out = '';
  for (let i = 0; i < 24; i++) {
    const face = STICKERS2[state[i]].face;
    let code = map.get(face);
    if (code === undefined) {
      code = labels[map.size];
      map.set(face, code);
    }
    out += code;
  }
  return out;
}

/** 保持底层在 D，仅对绕 U/D 轴的 4 个 y 朝向与前/后 U AUF 取最小指纹，用于跨来源同态对账 */
function aufNormalizedFingerprint2(alg: string): string {
  const inv = invertMoves2(parseAlg(alg));
  let best: string | null = null;
  for (const preU of U_AUF_VARIANTS) {
    for (const postU of U_AUF_VARIANTS) {
      const state = applyMoves2(solved2(), [...preU, ...inv, ...postU]);
      for (const yRot of Y_ROTATIONS) {
        const fp = canonicalYPattern2(applyMoves2(state, yRot));
        if (best === null || fp < best) best = fp;
      }
    }
  }
  return best!;
}

describe('CLL 来源交叉核对（42 = SpeedCubeDB 40 + J Perm 2）', () => {
  it('CLL_CASES 42 条在 AUF + 24 朝向下依然互不冲突', () => {
    const fps = new Map<string, string>();
    for (const c of CLL_CASES) {
      const fp = aufNormalizedFingerprint2(c.algs[0]);
      expect(fps.has(fp), `${c.id} 与 ${fps.get(fp)} AUF 同构冲突`).toBe(false);
      fps.set(fp, c.id);
    }
    expect(fps.size).toBe(42);
  });

  it('40 条 OLL 形态情形与 SpeedCubeDB 一一对应且组别/序号完全一致', () => {
    expect(SCDB_REFS).toHaveLength(40);
    const byFp = new Map(CLL_CASES.map((c) => [aufNormalizedFingerprint2(c.algs[0]), c]));
    const matchedIds = new Set<string>();

    for (const ref of SCDB_REFS) {
      const fp = aufNormalizedFingerprint2(ref.alg);
      const local = byFp.get(fp);
      expect(local, `SpeedCubeDB ${ref.name} 未在本地 CLL 中找到匹配`).toBeDefined();
      expect(local!.group).toBe(ref.group);
      // 名称序号（如 CLL AS 1 / CLL S 1 <- CLL Sune 1）严格对齐
      const expectedLocalName = ref.name.replace('CLL Sune ', 'CLL S ');
      expect(local!.name).toBe(expectedLocalName);
      matchedIds.add(local!.id);
    }

    expect(matchedIds.size).toBe(40);
    const missingFromScdb = CLL_CASES.filter((c) => !matchedIds.has(c.id)).map((c) => c.id);
    expect(missingFromScdb).toEqual(['cll-adj-1', 'cll-diag-1']);
  });

  it('全部 42 条情形与 J Perm 42 条 CLL（含 Adjacent / Diagonal）逐条一一对应', () => {
    expect(JP_REFS).toHaveLength(42);
    const byFp = new Map(CLL_CASES.map((c) => [aufNormalizedFingerprint2(c.algs[0]), c]));
    const matchedIds = new Set<string>();

    for (const ref of JP_REFS) {
      const fp = aufNormalizedFingerprint2(ref.alg);
      const local = byFp.get(fp);
      expect(local, `J Perm ${ref.name} (${ref.group}) 未在本地 CLL 中找到匹配`).toBeDefined();
      if (ref.group === 'PLL') {
        expect(local!.group).toBe(ref.name);
        expect(local!.name).toBe(`CLL ${ref.name}`);
      } else {
        expect(local!.group).toBe(ref.group);
      }
      matchedIds.add(local!.id);
    }

    expect(matchedIds.size).toBe(42);
  });
});
