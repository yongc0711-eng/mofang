/**
 * 二阶 EG-2（底层一面完成且呈对角互换、底层 0 条同色相邻 bar，一步完成剩余五面）42 条公式集。
 *
 * 编号与来源口径（42 = SpeedCubeDB EG2 40 + J Perm PBL 2）：
 * - 40 条 OLL 形态情形（AS 6 / H 4 / L 6 / Pi 6 / Sune 6 / T 6 / U 6）采用 SpeedCubeDB
 *   EG2 页面（实抓 40 条：`{ AS: 6, H: 4, L: 6, Pi: 6, S: 6, T: 6, U: 6 }`）的组内 1..6 编号；
 * - 另 2 条顶层已定向、底层呈对角互换的情形（`EG-2 Adjacent` / `EG-2 Diagonal`）由 J Perm 2×2 PBL
 *   页面（`Diagonal D: Adj/Diag` 与 `Diagonal D: Diag/Diag`）补齐，合计 42 条。
 *
 * 转体去除说明（本文件全部公式不含 x/y/z）：
 * - 对 SpeedCubeDB 中带前置 y / y' / y2 的公式（`eg2-h-4`、`eg2-l-4`、`eg2-l-5`、`eg2-l-6`、
 *   `eg2-t-1`、`eg2-u-2` 共 6 条主公式），经对应 `y` 共轭换算为等价无转体 RLUDFB 公式，
 *   且保持起手底层四角全部定向在 D 面（4 个 D 色均在 D 面）。
 */
import type { AlgCase } from '../types';
import type { CaseSet2 } from '../lib/cases2';

export const EG2_CASES: AlgCase[] = [
  // Antisune (6)
  {
    id: 'eg2-as-1',
    set: 'eg2',
    name: 'EG-2 AS 1',
    group: 'Antisune',
    algs: ["F R2 U R' U2 R U R2 U F'", "U2 R' U2 R2 U' R' U R' F R F R2 U"],
  },
  {
    id: 'eg2-as-2',
    set: 'eg2',
    name: 'EG-2 AS 2',
    group: 'Antisune',
    algs: ["R' U' R U' R' U2 R' F2 R2", "U2 R' F' R U' R' F2 R' F2 R2 U2"],
  },
  {
    id: 'eg2-as-3',
    set: 'eg2',
    name: 'EG-2 AS 3',
    group: 'Antisune',
    algs: ["U2 R' F R F' R U R B2 R2", "U2 L' U R U' L U R B2 R2"],
  },
  {
    id: 'eg2-as-4',
    set: 'eg2',
    name: 'EG-2 AS 4',
    group: 'Antisune',
    algs: ["U2 F' L F L' U2 L' U2 L' B2 L2", "B' L U L' U2 L' B2 L' B2 L2 U2"],
  },
  {
    id: 'eg2-as-5',
    set: 'eg2',
    name: 'EG-2 AS 5',
    group: 'Antisune',
    algs: ["R' U' R U' R' U' R' F2 R F' R", "B L B' U L2 B' L U' L"],
  },
  {
    id: 'eg2-as-6',
    set: 'eg2',
    name: 'EG-2 AS 6',
    group: 'Antisune',
    algs: ["R2 F2 R U L U' R U L'", "L2 B2 L B L B' L U L'"],
  },

  // H (4)
  {
    id: 'eg2-h-1',
    set: 'eg2',
    name: 'EG-2 H 1',
    group: 'H',
    algs: ["R2 F U2 F2 R2 F' R2", "U2 R2 F U2 F2 R2 F' R2 U2"],
  },
  {
    id: 'eg2-h-2',
    set: 'eg2',
    name: 'EG-2 H 2',
    group: 'H',
    algs: ["U R2 U2 R' U2 F2 R2", "B2 L2 U2 B' U2 B2 U"],
  },
  {
    id: 'eg2-h-3',
    set: 'eg2',
    name: 'EG-2 H 3',
    group: 'H',
    algs: ["R' U' R U2 R2 F' R U' F R", "L U L' U L U L' B L' B' L' B2 L2 U'"],
  },
  {
    id: 'eg2-h-4',
    set: 'eg2',
    name: 'EG-2 H 4',
    group: 'H',
    algs: ["F U2 R2 F' U F U' R F'", "B L2 U' L2 U' L2 U L2 B L2 B2"],
  },

  // L (6)
  {
    id: 'eg2-l-1',
    set: 'eg2',
    name: 'EG-2 L 1',
    group: 'L',
    algs: ["U L2 B2 L U' L' U L F' L F", "B2 L2 B2 R B' R' B U B U' B' U'"],
  },
  {
    id: 'eg2-l-2',
    set: 'eg2',
    name: 'EG-2 L 2',
    group: 'L',
    algs: ["U2 F' R U R' U' R' F R U R' F R' F2 R U' R", "B2 L2 B L U L' U' L' B L U"],
  },
  {
    id: 'eg2-l-3',
    set: 'eg2',
    name: 'EG-2 L 3',
    group: 'L',
    algs: ["U2 F' R U R' U' R' F2 R' F2 R U' R", "L2 U' L U2 L' U2 L U' B2 L2 U"],
  },
  {
    id: 'eg2-l-4',
    set: 'eg2',
    name: 'EG-2 L 4',
    group: 'L',
    algs: ["B U2 B2 R B R' B U2 B L2 B2"],
  },
  {
    id: 'eg2-l-5',
    set: 'eg2',
    name: 'EG-2 L 5',
    group: 'L',
    algs: ["R B' R' B U B U' B L2 B2"],
  },
  {
    id: 'eg2-l-6',
    set: 'eg2',
    name: 'EG-2 L 6',
    group: 'L',
    algs: ["B' L U L' U' L' B L' B2 L2"],
  },

  // Pi (6)
  {
    id: 'eg2-pi-1',
    set: 'eg2',
    name: 'EG-2 Pi 1',
    group: 'Pi',
    algs: ["F U' R U2 R U' R' U R' F'", "R' F' U' F U' R U R' U R' F2 R2 U'"],
  },
  {
    id: 'eg2-pi-2',
    set: 'eg2',
    name: 'EG-2 Pi 2',
    group: 'Pi',
    algs: ["R U2 R2 U R' F2 R2 F'", "R U' R2 U R2 U R2 U' R' F2 R2"],
  },
  {
    id: 'eg2-pi-3',
    set: 'eg2',
    name: 'EG-2 Pi 3',
    group: 'Pi',
    algs: ["U F R2 U' R2 U R2 U R2 F R2 F2 U2", "L' B' U L' B L2 U2 L' U L"],
  },
  {
    id: 'eg2-pi-4',
    set: 'eg2',
    name: 'EG-2 Pi 4',
    group: 'Pi',
    algs: ["U R U' F U' F' R F2 U2 R' U", "L' B L B' L U' L' U' L U' L B2 L2 U2"],
  },
  {
    id: 'eg2-pi-5',
    set: 'eg2',
    name: 'EG-2 Pi 5',
    group: 'Pi',
    algs: ["U' R' F' R' F2 R2 U R' U2 R U", "U F U R U' R' U R U' R2 F' R U R U' R F2 R2 U'"],
  },
  {
    id: 'eg2-pi-6',
    set: 'eg2',
    name: 'EG-2 Pi 6',
    group: 'Pi',
    algs: ["U R' U2 R U' R2 F2 R F R U'", "R U2 R' U' R U R' U2 R' F R F' R2 F2 R2"],
  },

  // Sune (6)
  {
    id: 'eg2-s-1',
    set: 'eg2',
    name: 'EG-2 S 1',
    group: 'Sune',
    algs: ["R2 F2 R U R U' R' F R' F' R2 U R' U' R", "F' L F2 L' U' F' U' F2 U F R2 F2 U2"],
  },
  {
    id: 'eg2-s-2',
    set: 'eg2',
    name: 'EG-2 S 2',
    group: 'Sune',
    algs: ["R U R' U R U2 R B2 R2", "F2 L2 F U2 F U F' U F"],
  },
  {
    id: 'eg2-s-3',
    set: 'eg2',
    name: 'EG-2 S 3',
    group: 'Sune',
    algs: ["R U' R' F R' F' R' F2 R2", "R U' R' F2 R2 F' L' U' L"],
  },
  {
    id: 'eg2-s-4',
    set: 'eg2',
    name: 'EG-2 S 4',
    group: 'Sune',
    algs: ["F R' F' R U2 R U2 R B2 R2", "R B2 R' B2 R' B U' B U2"],
  },
  {
    id: 'eg2-s-5',
    set: 'eg2',
    name: 'EG-2 S 5',
    group: 'Sune',
    algs: ["R' U R' F R2 U' F R' F'", "L' B L' B2 L U L U L' U L"],
  },
  {
    id: 'eg2-s-6',
    set: 'eg2',
    name: 'EG-2 S 6',
    group: 'Sune',
    algs: ["R2 B2 R' U' R' F R' F' R", "R2 B2 R' U' L' U R' U' L"],
  },

  // T (6)
  {
    id: 'eg2-t-1',
    set: 'eg2',
    name: 'EG-2 T 1',
    group: 'T',
    algs: ["B' R' B U B U' B' R' B2 R2"],
  },
  {
    id: 'eg2-t-2',
    set: 'eg2',
    name: 'EG-2 T 2',
    group: 'T',
    algs: ["U F R' U2 R' U' R U2 F' U"],
  },
  {
    id: 'eg2-t-3',
    set: 'eg2',
    name: 'EG-2 T 3',
    group: 'T',
    algs: ["R' U R U2 R2 F' R U' R", "R U2 R' U' R U' R2 U2 R U R' U R' F2 R2 U"],
  },
  {
    id: 'eg2-t-4',
    set: 'eg2',
    name: 'EG-2 T 4',
    group: 'T',
    algs: ["R2 F2 R U' F R' F' R U R", "U R U2 R2 F R F' R U' R' U R U2 R F2 R2 U"],
  },
  {
    id: 'eg2-t-5',
    set: 'eg2',
    name: 'EG-2 T 5',
    group: 'T',
    algs: ["R' U R U2 R2 F R F' R' F2 R2"],
  },
  {
    id: 'eg2-t-6',
    set: 'eg2',
    name: 'EG-2 T 6',
    group: 'T',
    algs: ["U R' U2 R' F2 R F2 R U", "U R' U' F R U2 R' U' F R U"],
  },

  // U (6)
  {
    id: 'eg2-u-1',
    set: 'eg2',
    name: 'EG-2 U 1',
    group: 'U',
    algs: ["R2 U2 R U R' U F' R U' R"],
  },
  {
    id: 'eg2-u-2',
    set: 'eg2',
    name: 'EG-2 U 2',
    group: 'U',
    algs: ["R U B U' B' R B2 R2", "L F U F' U' L F2 L2"],
  },
  {
    id: 'eg2-u-3',
    set: 'eg2',
    name: 'EG-2 U 3',
    group: 'U',
    algs: ["R' F' U' R U2 R' U F R", "L' U' L U L' B2 L U' L' U L"],
  },
  {
    id: 'eg2-u-4',
    set: 'eg2',
    name: 'EG-2 U 4',
    group: 'U',
    algs: ["R' F' U' F U2 L' U2 R U' L", "F R U R' U' F R U R' U' F R U R F2 R2 U2"],
  },
  {
    id: 'eg2-u-5',
    set: 'eg2',
    name: 'EG-2 U 5',
    group: 'U',
    algs: ["U2 R2 B2 R' U R' U' R' F R F' U2", "L2 F2 L' U L' U' L' B L B'"],
  },
  {
    id: 'eg2-u-6',
    set: 'eg2',
    name: 'EG-2 U 6',
    group: 'U',
    algs: ["R U' R2 F R F' R U R' U' R U R F2 R2", "L2 B2 L B' L U R B' R' B"],
  },

  // Adjacent & Diagonal (2)
  {
    id: 'eg2-adj-1',
    set: 'eg2',
    name: 'EG-2 Adjacent',
    group: 'Adjacent',
    algs: ["R U' R F2 R' U R'"],
  },
  {
    id: 'eg2-diag-1',
    set: 'eg2',
    name: 'EG-2 Diagonal',
    group: 'Diagonal',
    algs: ["R2 F2 R2"],
  },
];

export const eg2Set: CaseSet2 = {
  id: 'eg2',
  method: '2x2',
  name: 'EG-2',
  description: '二阶底面一面完成且呈对角互换（0 条底层 bar）时，一次完成顶层定向与上下层归位（共 42 条，含顶层已定向的邻换与对角换）',
  expectedCount: 42,
  complete: true,
  view: 'both2',
  cases: EG2_CASES,
};
