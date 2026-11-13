import { describe, expect, it } from 'vitest';
import { parseAlg } from '../lib/alg';
import type { Move } from '../lib/cube';
import { applyMoves2, invertMoves2, solved2, STICKERS2, type State2 } from '../lib/cube2';
import { EG2_CASES } from './eg2';

/**
 * 外部权威来源对照数据（2026-11 实抓离线固化，避免测试依赖网络或临时目录）：
 * 1) SpeedCubeDB (https://speedcubedb.com/a/2x2/EG2)
 *    - 实抓总数：40 条；分组计数：{ AS: 6, H: 4, L: 6, Pi: 6, S: 6, T: 6, U: 6 }（缺 Adjacent / Diagonal）
 * 2) J Perm PBL (https://jperm.net/lib/2x2pbl.js)
 *    - 实抓总数：5 条；其中两条底层对角换、顶面已定向的情形：
 *      - `Diagonal D: Adj/Diag` -> `R U' R F2 R' U R'`（`EG-2 Adjacent`）
 *      - `Diagonal D: Diag/Diag` -> `R2 F2 R2`（`EG-2 Diagonal`）
 *    - 合计口径：42 = SpeedCubeDB EG2 40 + J Perm PBL 2（Adj/Diag、Diag/Diag）。
 */

interface RefEntry {
  name: string;
  group: string;
  alg: string;
}

const SCDB_EG2_REFS: RefEntry[] = [
  { name: 'EG2 AS 1', group: 'Antisune', alg: "F R2 U R' U2 R U R2 U F'" },
  { name: 'EG2 AS 2', group: 'Antisune', alg: "R' U' R U' R' U2 R' F2 R2" },
  { name: 'EG2 AS 3', group: 'Antisune', alg: "U2 R' F R F' R U R B2 R2" },
  { name: 'EG2 AS 4', group: 'Antisune', alg: "U2 F' L F L' U2 L' U2 L' B2 L2" },
  { name: 'EG2 AS 5', group: 'Antisune', alg: "R' U' R U' R' U' R' F2 R F' R" },
  { name: 'EG2 AS 6', group: 'Antisune', alg: "y2 R2 F2 R F R F' R U R'" },
  { name: 'EG2 H 1', group: 'H', alg: "R2 F U2 F2 R2 F' R2" },
  { name: 'EG2 H 2', group: 'H', alg: "y R2 B2 U2 R' U2 R2" },
  { name: 'EG2 H 3', group: 'H', alg: "R' U' R U2 R2 F' R U' F R" },
  { name: 'EG2 H 4', group: 'H', alg: "y' R U2 B2 R' U R U' B R'" },
  { name: 'EG2 L 1', group: 'L', alg: "U L2 B2 L U' L' U L F' L F" },
  { name: 'EG2 L 2', group: 'L', alg: "y2 F2 R2 F R U R' U' R' F R" },
  { name: 'EG2 L 3', group: 'L', alg: "y2 R2 U' R U2 R' U2 R U' F2 R2" },
  { name: 'EG2 L 4', group: 'L', alg: "y' R' U L' U2 R' F R U' R' U' F' x2" },
  { name: 'EG2 L 5', group: 'L', alg: "y F R' F' R U R U' R B2 R2" },
  { name: 'EG2 L 6', group: 'L', alg: "y2 F' R U R' U' R' F R' F2 R2" },
  { name: 'EG2 Pi 1', group: 'Pi', alg: "F U' R U2 R U' R' U R' F'" },
  { name: 'EG2 Pi 2', group: 'Pi', alg: "R U2 R2 U R' F2 R2 F'" },
  { name: 'EG2 Pi 3', group: 'Pi', alg: "U F R2 U' R2 U R2 U R2 F R2 F2 U2" },
  { name: 'EG2 Pi 4', group: 'Pi', alg: "y2 R' F R F' R U' R' U' R U' R F2 R2" },
  { name: 'EG2 Pi 5', group: 'Pi', alg: "U' R' F' R' F2 R2 U R' U2 R U" },
  { name: 'EG2 Pi 6', group: 'Pi', alg: "U R' U2 R U' R2 F2 R F R U'" },
  { name: 'EG2 S 1', group: 'Sune', alg: "R2 F2 R U R U' R' F R' F' R2 U R' U' R" },
  { name: 'EG2 S 2', group: 'Sune', alg: "R U R' U R U2 R B2 R2" },
  { name: 'EG2 S 3', group: 'Sune', alg: "R U' R' F R' F' R' F2 R2" },
  { name: 'EG2 S 4', group: 'Sune', alg: "F R' F' R U2 R U2 R B2 R2" },
  { name: 'EG2 S 5', group: 'Sune', alg: "R' U R' F R2 U' F R' F'" },
  { name: 'EG2 S 6', group: 'Sune', alg: "R2 B2 R' U' R' F R' F' R" },
  { name: 'EG2 T 1', group: 'T', alg: "U R' F' R U R U' R' F' R2 B2 U" },
  { name: 'EG2 T 2', group: 'T', alg: "y' F U' R2 U' R' U R2 F'" },
  { name: 'EG2 T 3', group: 'T', alg: "R' U R U2 R2 F' R U' R" },
  { name: 'EG2 T 4', group: 'T', alg: "R2 F2 R U' F R' F' R U R" },
  { name: 'EG2 T 5', group: 'T', alg: "y' R' U2 R U' R' F R' F R F' R" },
  { name: 'EG2 T 6', group: 'T', alg: "y R' U2 R' F2 R F2 R" },
  { name: 'EG2 U 1', group: 'U', alg: "R2 U2 R U R' U F' R U' R" },
  { name: 'EG2 U 2', group: 'U', alg: "y' F R U R' U' F R2 B2" },
  { name: 'EG2 U 3', group: 'U', alg: "R' F' U' R U2 R' U F R" },
  { name: 'EG2 U 4', group: 'U', alg: "R' F' U' F U2 L' U2 R U' L" },
  { name: 'EG2 U 5', group: 'U', alg: "y2 R2 B2 R' U R' U' R' F R F'" },
  { name: 'EG2 U 6', group: 'U', alg: "y2 R2 F2 R F' R U L F' L' F" },
];

const JP_PBL_EG2_REFS: RefEntry[] = [
  { name: 'EG-2 Adjacent', group: 'Adjacent', alg: "R U' R F2 R' U R'" },
  { name: 'EG-2 Diagonal', group: 'Diagonal', alg: 'R2 F2 R2' },
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

describe('EG-2 来源交叉核对（42 = SpeedCubeDB EG2 40 + J Perm PBL 2）', () => {
  it('EG2_CASES 42 条在 AUF + y 朝向下互不冲突', () => {
    const fps = new Map<string, string>();
    for (const c of EG2_CASES) {
      const fp = aufNormalizedFingerprint2(c.algs[0]);
      expect(fps.has(fp), `${c.id} 与 ${fps.get(fp)} AUF 同构冲突`).toBe(false);
      fps.set(fp, c.id);
    }
    expect(fps.size).toBe(42);
  });

  it('40 条 OLL 形态情形与 SpeedCubeDB EG2 一一对应且组别/序号一致', () => {
    expect(SCDB_EG2_REFS).toHaveLength(40);
    const byFp = new Map(EG2_CASES.map((c) => [aufNormalizedFingerprint2(c.algs[0]), c]));
    const matchedIds = new Set<string>();

    for (const ref of SCDB_EG2_REFS) {
      const local = byFp.get(aufNormalizedFingerprint2(ref.alg));
      expect(local, `SpeedCubeDB ${ref.name} 未在本地 EG-2 中找到匹配`).toBeDefined();
      expect(local!.group).toBe(ref.group);
      expect(local!.name).toBe(ref.name.replace('EG2 ', 'EG-2 '));
      matchedIds.add(local!.id);
    }

    expect(matchedIds.size).toBe(40);
    const missingFromScdb = EG2_CASES.filter((c) => !matchedIds.has(c.id)).map((c) => c.id);
    expect(missingFromScdb).toEqual(['eg2-adj-1', 'eg2-diag-1']);
  });

  it('另 2 条与 J Perm PBL Diagonal D（Adj/Diag 与 Diag/Diag）精确对应，合计 42', () => {
    const byFp = new Map(EG2_CASES.map((c) => [aufNormalizedFingerprint2(c.algs[0]), c]));
    const matchedExtras = JP_PBL_EG2_REFS.map((ref) => {
      const local = byFp.get(aufNormalizedFingerprint2(ref.alg));
      expect(local, `J Perm PBL ${ref.name} 未匹配`).toBeDefined();
      expect(local!.group).toBe(ref.group);
      expect(local!.name).toBe(ref.name);
      return local!.id;
    });
    expect(matchedExtras).toEqual(['eg2-adj-1', 'eg2-diag-1']);
  });
});
