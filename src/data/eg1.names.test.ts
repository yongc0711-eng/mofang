import { describe, expect, it } from 'vitest';
import { parseAlg } from '../lib/alg';
import type { Move } from '../lib/cube';
import { applyMoves2, invertMoves2, solved2, STICKERS2, type State2 } from '../lib/cube2';
import { EG1_CASES } from './eg1';

/**
 * 外部权威来源对照数据（2026-11 实抓离线固化，避免测试依赖网络或临时目录）：
 * 1) SpeedCubeDB (https://speedcubedb.com/a/2x2/EG1)
 *    - 实抓总数：40 条；分组计数：{ AS: 6, H: 4, L: 6, Pi: 6, S: 6, T: 6, U: 6 }（缺 Adjacent / Diagonal）
 * 2) J Perm PBL (https://jperm.net/lib/2x2pbl.js)
 *    - 实抓总数：5 条；其中 `Adjacent D: Adj/Adj`（R2 U' B2 U2 R2 U' R2）对应 EG-1 Adjacent；
 *      合计口径：42 = SpeedCubeDB EG1 40 + J Perm PBL / EG-1 Adjacent 与 Diagonal 2。
 * 3) J Perm EG-1 (https://jperm.net/lib/2x2eg-1.js)
 *    - 实抓总数：43 条；分组计数：{ L: 6, U: 6, T: 6, Pi: 6, H: 4, Antisune: 6, Sune: 6, Ortega: 3 }；
 *    - 其中 `Ortega` 含 `Solved` 占位（顶层已还原、底层相邻换角，整方翻转后等价 CLL Adjacent）与 `Adjacent`、`Diagonal`；
 *      去掉 `Solved` 占位后精确得到 42 条，与本地 42 条一一对应。
 */

interface RefEntry {
  name: string;
  group: string;
  alg: string;
}

const SCDB_EG1_REFS: RefEntry[] = [
  { name: 'EG1 AS 1', group: 'Antisune', alg: "y U2 B U' R2 F2 U' F" },
  { name: 'EG1 AS 2', group: 'Antisune', alg: "U R U' R' F' U' F2 R U' R'" },
  { name: 'EG1 AS 3', group: 'Antisune', alg: "F' R U R' U' R U R2 F' R" },
  { name: 'EG1 AS 4', group: 'Antisune', alg: "R U' R' F' U' R U R' U' F" },
  { name: 'EG1 AS 5', group: 'Antisune', alg: "y' R U R' F' U' R U R' U' R U R'" },
  { name: 'EG1 AS 6', group: 'Antisune', alg: "y2 R U' R2 F R U' R' F R F'" },
  { name: 'EG1 H 1', group: 'H', alg: "U' R' F R2 U' R' F R U R' F'" },
  { name: 'EG1 H 2', group: 'H', alg: "U' F' U R U' R2 F2 R U' F" },
  { name: 'EG1 H 3', group: 'H', alg: "U R' F R F' U2 F R U2 R' F" },
  { name: 'EG1 H 4', group: 'H', alg: "U' R U R' F' R U R' U' R U R' U'" },
  { name: 'EG1 L 1', group: 'L', alg: "y R U' R' U R U' R2 F' R F" },
  { name: 'EG1 L 2', group: 'L', alg: "y' U' R' F R U' R' F R2 U R' F' U2" },
  { name: 'EG1 L 3', group: 'L', alg: "y R' U R2 U' R2 U' F R2 U' R'" },
  { name: 'EG1 L 4', group: 'L', alg: "y R' F R2 U R' F' R U2 R'" },
  { name: 'EG1 L 5', group: 'L', alg: "y2 R U R' F' R U R' U' F R' F' R" },
  { name: 'EG1 L 6', group: 'L', alg: "y2 R' U2 F R U2 R U' R2 F" },
  { name: 'EG1 Pi 1', group: 'Pi', alg: "y2 U' F U' R' F R U' F2 R U R'" },
  { name: 'EG1 Pi 2', group: 'Pi', alg: "y' R U' R2 F R2 U' R'" },
  { name: 'EG1 Pi 3', group: 'Pi', alg: "y' F R' F U' F2 R U R" },
  { name: 'EG1 Pi 4', group: 'Pi', alg: "y' R U' R' U R U' R' F R U' R'" },
  { name: 'EG1 Pi 5', group: 'Pi', alg: "R U' R2 F R U R U' R' U' R' F R F'" },
  { name: 'EG1 Pi 6', group: 'Pi', alg: "U' R' F' R U' R' F R2 U R' F' R U R'" },
  { name: 'EG1 S 1', group: 'Sune', alg: "y2 U' L F' L2 U' L F U L' U L" },
  { name: 'EG1 S 2', group: 'Sune', alg: "R U R' F2 U F R U R'" },
  { name: 'EG1 S 3', group: 'Sune', alg: "y2 F R' F' R U R' F' R2 U R'" },
  { name: 'EG1 S 4', group: 'Sune', alg: "U F' R' F R2 U R' U' F R' F' R U" },
  { name: 'EG1 S 5', group: 'Sune', alg: "y R U' R' U R U' R' U F R U' R'" },
  { name: 'EG1 S 6', group: 'Sune', alg: "R' F R2 U' R' U R U' R' F" },
  { name: 'EG1 T 1', group: 'T', alg: "F R U' R2 F' R U R' F' R" },
  { name: 'EG1 T 2', group: 'T', alg: "F' R' F R2 U R' U' R U R'" },
  { name: 'EG1 T 3', group: 'T', alg: "y R U' R2 F R U R U2 R'" },
  { name: 'EG1 T 4', group: 'T', alg: "y' U2 R' F R F' U R U' R' U F R U' R'" },
  { name: 'EG1 T 5', group: 'T', alg: "y' R' F' R2 U R' F' R U R'" },
  { name: 'EG1 T 6', group: 'T', alg: "y' U' R U' R' U2 F R U2 R' F" },
  { name: 'EG1 U 1', group: 'U', alg: "y U2 R U R' U R U' R2 F' R2 U R' U" },
  { name: 'EG1 U 2', group: 'U', alg: "U2 y R' U R' U' R U' R' U' F2 R2" },
  { name: 'EG1 U 3', group: 'U', alg: "F' U2 R U2 R' U2 F" },
  { name: 'EG1 U 4', group: 'U', alg: "y R' F R F' R' F R2 U' R'" },
  { name: 'EG1 U 5', group: 'U', alg: "U2 R U' R' U R U' R' U' F R U' R'" },
  { name: 'EG1 U 6', group: 'U', alg: "y2 R' F R U' R' F R U' R U R' F' U2" },
];

const JP_EG1_REFS: RefEntry[] = [
  { name: 'L1', group: 'L', alg: "R U' R' U R U' R2 F' R F" },
  { name: 'L2', group: 'L', alg: "L' U L U' L' U L2 F L' F'" },
  { name: 'L3', group: 'L', alg: "L' U' L F L' U' L U F' L F L'" },
  { name: 'L4', group: 'L', alg: "R U R' F' R U R' U' F R' F' R" },
  { name: 'L5', group: 'L', alg: "R' U R2 U' R2 U' F R2 U' R'" },
  { name: 'L6', group: 'L', alg: "R' F R2 U R' F' R U2 R'" },
  { name: 'U1', group: 'U', alg: "F R U' R' F x F' L' U' L' U x'" },
  { name: 'U2', group: 'U', alg: "R U' R2 F R2 U R' U' R U' R'" },
  { name: 'U3', group: 'U', alg: "L F' L' F L F' L2 U L" },
  { name: 'U4', group: 'U', alg: "F' U2 R U2 R' U2 F" },
  { name: 'U5', group: 'U', alg: "F' U L F2 L' F U2 F" },
  { name: 'U6', group: 'U', alg: "F U' R' F2 R F' U2 F'" },
  { name: 'T1', group: 'T', alg: "R2 B2 U' R' U' R U' R' U R'" },
  { name: 'T2', group: 'T', alg: "L' U L2 F' L' U' L' U2 L" },
  { name: 'T3', group: 'T', alg: "R' F' R2 U R' F' R U R'" },
  { name: 'T4', group: 'T', alg: "R U R' F R U R' F U' R U' R'" },
  { name: 'T5', group: 'T', alg: "F L F' L2 U' L U L' U' L" },
  { name: 'T6', group: 'T', alg: "F' R' F R2 U R' U' R U R'" },
  { name: 'P1', group: 'Pi', alg: "F U' R' F R U' F2 R U R'" },
  { name: 'P2', group: 'Pi', alg: "R' F R2 U' R2 F R" },
  { name: 'P3', group: 'Pi', alg: "F R' F U' F2 R U R" },
  { name: 'P4', group: 'Pi', alg: "R U' R' U R U' R' F R U' R'" },
  { name: 'P5', group: 'Pi', alg: "L F' L' F L F' L2 U' L U L' U L" },
  { name: 'P6', group: 'Pi', alg: "R' F R F' R' F R2 U R' U' R U' R'" },
  { name: 'H1', group: 'H', alg: "R' F R2 U' R' F R U R' F'" },
  { name: 'H2', group: 'H', alg: "F' U R U' R2 F2 R U' F" },
  { name: 'H3', group: 'H', alg: "R U R' F' R U R' U' R U R'" },
  { name: 'H4', group: 'H', alg: "R' F R F' U2 F R U2 R' F" },
  { name: 'AS1', group: 'Antisune', alg: "R' F R2 U R' F' U' R U' R'" },
  { name: 'AS2', group: 'Antisune', alg: "R U' R' F' U' F2 R U' R'" },
  { name: 'AS3', group: 'Antisune', alg: "F L F' L2 U' L U F' L F L'" },
  { name: 'AS4', group: 'Antisune', alg: "F' R U R' U' R U R2 F' R" },
  { name: 'AS5', group: 'Antisune', alg: "R U' R2 F R U' R' F R F'" },
  { name: 'AS6', group: 'Antisune', alg: "L' U L U' L' U L U L F L' F'" },
  { name: 'S1', group: 'Sune', alg: "L F' L2 U' L F U L' U L" },
  { name: 'S2', group: 'Sune', alg: "L' U L F U F2 L' U L" },
  { name: 'S3', group: 'Sune', alg: "F' R' F R2 U R' U' F R' F' R" },
  { name: 'S4', group: 'Sune', alg: "F L' U' L U L' U' L2 F L'" },
  { name: 'S5', group: 'Sune', alg: "L' U L2 F' L' U L F' L' F" },
  { name: 'S6', group: 'Sune', alg: "R U' R' U R U' R' U' R' F' R F" },
  { name: 'Solved', group: 'Ortega', alg: "R' U R' U' R' F R2 U' R' U' R U R' F' R2" },
  { name: 'Adjacent', group: 'Ortega', alg: "R2 U' R2 U2 F2 U' R2" },
  { name: 'Diagonal', group: 'Ortega', alg: "R U' R' U' R' F2 U' R U R" },
];

const JP_PBL_ADJ_ADJ = "R2 U' B2 U2 R2 U' R2";

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

const D_IDS = STICKERS2.filter((s) => s.face === 'D').map((s) => s.id);
const FLIP_VARIANTS: Move[][] = [[], [{ base: 'x', amount: 2 }]];

/** 将整面单色底面保持在 D 面（若公式自身将 D 翻到 U，等价补尾步 x2 归正），再在 4 个 y 朝向与前/后 U AUF 下取最小指纹 */
function aufNormalizedFingerprint2(alg: string): string {
  const inv = invertMoves2(parseAlg(alg));
  let best: string | null = null;
  for (const preU of U_AUF_VARIANTS) {
    for (const flip of FLIP_VARIANTS) {
      const baseState = applyMoves2(solved2(), [...preU, ...flip, ...inv]);
      if (!D_IDS.every((id) => STICKERS2[baseState[id]].face === 'D')) continue;
      for (const postU of U_AUF_VARIANTS) {
        const state = applyMoves2(baseState, postU);
        for (const yRot of Y_ROTATIONS) {
          const fp = canonicalYPattern2(applyMoves2(state, yRot));
          if (best === null || fp < best) best = fp;
        }
      }
    }
  }
  return best!;
}

describe('EG-1 来源交叉核对（42 = SpeedCubeDB EG1 40 + J Perm PBL 2；J Perm EG-1 43 去 Solved 得 42）', () => {
  it('EG1_CASES 42 条在 AUF + y 朝向下互不冲突', () => {
    const fps = new Map<string, string>();
    for (const c of EG1_CASES) {
      const fp = aufNormalizedFingerprint2(c.algs[0]);
      expect(fps.has(fp), `${c.id} 与 ${fps.get(fp)} AUF 同构冲突`).toBe(false);
      fps.set(fp, c.id);
    }
    expect(fps.size).toBe(42);
  });

  it('40 条 OLL 形态情形与 SpeedCubeDB EG1 一一对应且组别/序号一致，另 2 条对齐 J Perm PBL / Ortega', () => {
    expect(SCDB_EG1_REFS).toHaveLength(40);
    const byFp = new Map(EG1_CASES.map((c) => [aufNormalizedFingerprint2(c.algs[0]), c]));
    const matchedIds = new Set<string>();

    for (const ref of SCDB_EG1_REFS) {
      const local = byFp.get(aufNormalizedFingerprint2(ref.alg));
      expect(local, `SpeedCubeDB ${ref.name} 未在本地 EG-1 中找到匹配`).toBeDefined();
      expect(local!.group).toBe(ref.group);
      expect(local!.name).toBe(ref.name.replace('EG1 ', 'EG-1 '));
      matchedIds.add(local!.id);
    }

    expect(matchedIds.size).toBe(40);
    const missingFromScdb = EG1_CASES.filter((c) => !matchedIds.has(c.id)).map((c) => c.id);
    expect(missingFromScdb).toEqual(['eg1-adj-1', 'eg1-diag-1']);

    expect(byFp.get(aufNormalizedFingerprint2(JP_PBL_ADJ_ADJ))?.id).toBe('eg1-adj-1');
  });

  it('J Perm EG-1 实际 43 条含 Ortega:Solved，去掉 Solved 后与本地 42 条 EG-1 完全一一对应', () => {
    expect(JP_EG1_REFS).toHaveLength(43);
    const groupCounts = new Map<string, number>();
    for (const r of JP_EG1_REFS) groupCounts.set(r.group, (groupCounts.get(r.group) ?? 0) + 1);
    expect(Object.fromEntries(groupCounts)).toEqual({
      L: 6,
      U: 6,
      T: 6,
      Pi: 6,
      H: 4,
      Antisune: 6,
      Sune: 6,
      Ortega: 3,
    });

    const filtered = JP_EG1_REFS.filter((r) => !(r.group === 'Ortega' && r.name === 'Solved'));
    expect(filtered).toHaveLength(42);

    const byFp = new Map(EG1_CASES.map((c) => [aufNormalizedFingerprint2(c.algs[0]), c]));
    const matchedIds = new Set<string>();
    for (const ref of filtered) {
      const local = byFp.get(aufNormalizedFingerprint2(ref.alg));
      expect(local, `J Perm EG-1 ${ref.group}:${ref.name} 未匹配`).toBeDefined();
      if (ref.group === 'Ortega') {
        expect(local!.group).toBe(ref.name);
        expect(local!.name).toBe(`EG-1 ${ref.name}`);
      } else {
        expect(local!.group).toBe(ref.group);
      }
      matchedIds.add(local!.id);
    }
    expect(matchedIds.size).toBe(42);
  });
});
