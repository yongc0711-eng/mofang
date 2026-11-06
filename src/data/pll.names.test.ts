import { describe, expect, it } from 'vitest';
import { algSolvesCase } from '../lib/cases';
import { PLL_CASES } from './pll';

// 第二份资料：SpeedCubeDB 各名称的标准公式（2026-11-06 取得）。
// 轮换结构校验分不清镜像对（Aa/Ab、Ja/Jb 等），这里能分清。
const SPEEDCUBEDB: Record<string, string> = {
  Aa: "x (R' U R') D2 (R U' R') D2 R2 x'",
  Ab: "x R2 D2 (R U R') D2 (R U' R) x'",
  E: "y x' (R U' R' D) (R U R' D') (R U R' D) (R U' R' D') x",
  F: "y (R' U' F') (R U R' U') R' F R2 (U' R' U') (R U R' U) R",
  Ga: "R2 (U R' U R' U' R U') R2 D (U' R' U R) D'",
  Gb: "(R' U' R U) D' R2 (U R' U R U' R U') R2 D",
  Gc: "R2 (U' R U' R U R' U) R2 D' (U R U' R') D",
  Gd: "(R U R' U') D R2 (U' R U' R' U R' U) R2 D'",
  H: "(M2 U' M2) U2 (M2 U' M2)",
  Ja: "y (R' U L') U2 (R U' R') U2 R L",
  Jb: "(R U R' F') (R U R' U') R' F R2 U' R'",
  Na: "(R U R' U) (R U R' F') (R U R' U') R' F R2 U' R' U2 (R U' R')",
  Nb: "(R' U R U' R') (F' U' F) (R U R') (F R' F') (R U' R)",
  Ra: "y (R U' R' U') (R U R D) (R' U' R D') (R' U2 R')",
  Rb: "(R' U2) (R U2) (R' F R) (U R' U' R') F' R2",
  T: "(R U R' U') (R' F R2) (U' R' U') (R U R' F')",
  Ua: "y2 (M2 U M) U2 (M' U M2)",
  Ub: "y2 (M2 U' M) U2 (M' U' M2)",
  V: "(R' U R' U') (R D' R' D) (R' U D') (R2 U' R2) D R2",
  Y: "F R (U' R' U') (R U R' F') (R U R' U') (R' F R F')",
  Z: "(M2 U) (M2 U) (M' U2) M2 (U2 M')",
};

describe('PLL 名称与第二份资料一致', () => {
  for (const c of PLL_CASES) {
    it(c.name, () => expect(algSolvesCase(c, SPEEDCUBEDB[c.name])).toBe(true));
  }
});
