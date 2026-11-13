/**
 * 二阶 EG-1（底层一面完成且恰好带 1 条底层同色相邻 bar，一步完成剩余五面）42 条公式集。
 *
 * 编号与来源口径（42 = SpeedCubeDB EG1 40 + J Perm PBL 2）：
 * - 40 条 OLL 形态情形（AS 6 / H 4 / L 6 / Pi 6 / Sune 6 / T 6 / U 6）采用 SpeedCubeDB
 *   EG1 页面（实抓 40 条：`{ AS: 6, H: 4, L: 6, Pi: 6, S: 6, T: 6, U: 6 }`）的组内 1..6 编号；
 * - 另 2 条顶层已定向的换角情形（`EG-1 Adjacent` / `EG-1 Diagonal`）SpeedCubeDB EG1 页面未单独列出，
 *   由 J Perm 2×2 PBL 页面（`Adjacent D: Adj/Adj`）及 J Perm 2×2 EG-1 页面补齐；
 * - 注：J Perm 2×2 EG-1 页面实抓共 43 条（`L: 6, U: 6, T: 6, Pi: 6, H: 4, Antisune: 6, Sune: 6, Ortega: 3`），
 *   其 `Ortega` 组含 1 条 `Solved`（顶层已还原、底层相邻换角，整方翻转后等价于 CLL Adjacent），
 *   去掉 `Solved` 占位后精确为 42 条，与本文件 42 条在 `AUF + y` 朝向下 42/42 一一对应。
 *
 * 转体去除说明（本文件全部公式不含 x/y/z）：
 * - 对 SpeedCubeDB 中带前置 y / y' / y2 的公式（如 `eg1-as-1`: `y R' F R2 U R' F' U' R U' R'`、
 *   `eg1-as-5`: `y' R U R' ...`、`eg1-as-6`: `y2 R U' R2 ...` 等共 22 条主公式），经对应 `y` 共轭
 *   换算为等价无转体 RLUDFB 公式（例如 `y M y'` 将 R/F/L/B 依次映射为 B/R/F/L），保持相同底层 bar 朝向。
 */
import type { AlgCase } from '../types';
import type { CaseSet2 } from '../lib/cases2';

export const EG1_CASES: AlgCase[] = [
  // Antisune (6)
  {
    id: 'eg1-as-1',
    set: 'eg1',
    name: 'EG-1 AS 1',
    group: 'Antisune',
    algs: ["B' R B2 U B' R' U' B U' B'", "U' F' U' F U' R' F' U F2 R F' U"],
  },
  {
    id: 'eg1-as-2',
    set: 'eg1',
    name: 'EG-1 AS 2',
    group: 'Antisune',
    algs: ["U R U' R' F' U' F2 R U' R'", "U2 L' U' L F2 U' F' L' U' L U'"],
  },
  {
    id: 'eg1-as-3',
    set: 'eg1',
    name: 'EG-1 AS 3',
    group: 'Antisune',
    algs: ["F' R U R' U' R U R2 F' R", "U' R U' R' U2 R' F R2 U2 R' F U'"],
  },
  {
    id: 'eg1-as-4',
    set: 'eg1',
    name: 'EG-1 AS 4',
    group: 'Antisune',
    algs: ["R U' R' F' U' R U R' U' F", "U F R U' R2 F' R U F' R U R' U"],
  },
  {
    id: 'eg1-as-5',
    set: 'eg1',
    name: 'EG-1 AS 5',
    group: 'Antisune',
    algs: ["F U F' L' U' F U F' U' F U F'", "U2 B' U B U' B' U B U B L B' L'"],
  },
  {
    id: 'eg1-as-6',
    set: 'eg1',
    name: 'EG-1 AS 6',
    group: 'Antisune',
    algs: ["L U' L2 B L U' L' B L B'", "R B' R2 U R U' R' U R B'"],
  },

  // H (4)
  {
    id: 'eg1-h-1',
    set: 'eg1',
    name: 'EG-1 H 1',
    group: 'H',
    algs: ["U' R' F R2 U' R' F R U R' F'", "U R' F R2 U' R' F R U R' F' U2"],
  },
  {
    id: 'eg1-h-2',
    set: 'eg1',
    name: 'EG-1 H 2',
    group: 'H',
    algs: ["U' F' U R U' R2 F2 R U' F", "U F' U R U' R2 F2 R U' F U2"],
  },
  {
    id: 'eg1-h-3',
    set: 'eg1',
    name: 'EG-1 H 3',
    group: 'H',
    algs: ["U R' F R F' U2 F R U2 R' F", "R' U' R' F2 U F' R F'"],
  },
  {
    id: 'eg1-h-4',
    set: 'eg1',
    name: 'EG-1 H 4',
    group: 'H',
    algs: ["U' R U R' F' R U R' U' R U R' U'", "F' U R' F R F' U F2"],
  },

  // L (6)
  {
    id: 'eg1-l-1',
    set: 'eg1',
    name: 'EG-1 L 1',
    group: 'L',
    algs: ["B U' B' U B U' B2 R' B R", "U B U B' R' B U2 B' U2 B U B' U'"],
  },
  {
    id: 'eg1-l-2',
    set: 'eg1',
    name: 'EG-1 L 2',
    group: 'L',
    algs: ["U' F' L F U' F' L F2 U F' L' U2", "U2 F' L' F L' F' L' F L' F' L2 F"],
  },
  {
    id: 'eg1-l-3',
    set: 'eg1',
    name: 'EG-1 L 3',
    group: 'L',
    algs: ["B' U B2 U' B2 U' R B2 U' B'"],
  },
  {
    id: 'eg1-l-4',
    set: 'eg1',
    name: 'EG-1 L 4',
    group: 'L',
    algs: ["B' R B2 U B' R' B U2 B'", "B U2 B' R B U' B2 R' B"],
  },
  {
    id: 'eg1-l-5',
    set: 'eg1',
    name: 'EG-1 L 5',
    group: 'L',
    algs: ["L U L' B' L U L' U' B L' B' L", "U' L U L' B' U L U L' U' L U L' U'"],
  },
  {
    id: 'eg1-l-6',
    set: 'eg1',
    name: 'EG-1 L 6',
    group: 'L',
    algs: ["L' U2 B L U2 L U' L2 B", "U' R' U' R B R' U' R U B' R B R' U'"],
  },

  // Pi (6)
  {
    id: 'eg1-pi-1',
    set: 'eg1',
    name: 'EG-1 Pi 1',
    group: 'Pi',
    algs: ["U' R U' R2 F R2 U' R F2 R2 U'"],
  },
  {
    id: 'eg1-pi-2',
    set: 'eg1',
    name: 'EG-1 Pi 2',
    group: 'Pi',
    algs: ["F U' F2 L F2 U' F'", "F U F2 L' F2 U F'"],
  },
  {
    id: 'eg1-pi-3',
    set: 'eg1',
    name: 'EG-1 Pi 3',
    group: 'Pi',
    algs: ["L F' L U' L2 F U F", "L' F U2 F' L' U2 L F' L' F U'"],
  },
  {
    id: 'eg1-pi-4',
    set: 'eg1',
    name: 'EG-1 Pi 4',
    group: 'Pi',
    algs: ["F U' F' U F U' F' L F U' F'", "L' F U F' U' F U F' L' F U F' U'"],
  },
  {
    id: 'eg1-pi-5',
    set: 'eg1',
    name: 'EG-1 Pi 5',
    group: 'Pi',
    algs: ["R U' R2 F R U R U' R' U' R' F R F'", "U' R U R' U R U' R2 F' R F R' F' R"],
  },
  {
    id: 'eg1-pi-6',
    set: 'eg1',
    name: 'EG-1 Pi 6',
    group: 'Pi',
    algs: ["U' R' F' R U' R' F R2 U R' F' R U R'", "U' R' F R F' R' F R2 U R' U' R U' R'"],
  },

  // Sune (6)
  {
    id: 'eg1-s-1',
    set: 'eg1',
    name: 'EG-1 S 1',
    group: 'Sune',
    algs: ["U' R B' R2 U' R B U R' U R", "L U L' U B L U' L2 B' L U'"],
  },
  {
    id: 'eg1-s-2',
    set: 'eg1',
    name: 'EG-1 S 2',
    group: 'Sune',
    algs: ["R U R' F2 U F R U R'", "U F R' F' R F R U' R' U R' F' R U"],
  },
  {
    id: 'eg1-s-3',
    set: 'eg1',
    name: 'EG-1 S 3',
    group: 'Sune',
    algs: ["B L' B' L U L' B' L2 U L'", "B R' U' R U R' U' R L U L'"],
  },
  {
    id: 'eg1-s-4',
    set: 'eg1',
    name: 'EG-1 S 4',
    group: 'Sune',
    algs: ["U F' R' F R2 U R' U' F R' F' R U", "F' U R U' R' U F R U R'"],
  },
  {
    id: 'eg1-s-5',
    set: 'eg1',
    name: 'EG-1 S 5',
    group: 'Sune',
    algs: ["B U' B' U B U' B' U R B U' B'", "U2 F' U' F R U F' U' F U F' U' F U2"],
  },
  {
    id: 'eg1-s-6',
    set: 'eg1',
    name: 'EG-1 S 6',
    group: 'Sune',
    algs: ["R' F R2 U' R' U R U' R' F", "L' U L2 F' L' U L F' L' F"],
  },

  // T (6)
  {
    id: 'eg1-t-1',
    set: 'eg1',
    name: 'EG-1 T 1',
    group: 'T',
    algs: ["F R U' R2 F' R U R' F' R", "F L F' L2 U' L U L' U' L"],
  },
  {
    id: 'eg1-t-2',
    set: 'eg1',
    name: 'EG-1 T 2',
    group: 'T',
    algs: ["F' R' F R2 U R' U' R U R'", "U2 R U2 R' F R U' R' F' R U R' U'"],
  },
  {
    id: 'eg1-t-3',
    set: 'eg1',
    name: 'EG-1 T 3',
    group: 'T',
    algs: ["B U' B2 R B U B U2 B'", "B U2 B' U' B' R' B2 U B'"],
  },
  {
    id: 'eg1-t-4',
    set: 'eg1',
    name: 'EG-1 T 4',
    group: 'T',
    algs: ["U2 F' L F L' U F U' F' U L F U' F'", "U' F' U L F2 U' F2 U' L U' F U2"],
  },
  {
    id: 'eg1-t-5',
    set: 'eg1',
    name: 'EG-1 T 5',
    group: 'T',
    algs: ["F' L' F2 U F' L' F U F'", "U2 F U F2 L' F L F' L' F U2"],
  },
  {
    id: 'eg1-t-6',
    set: 'eg1',
    name: 'EG-1 T 6',
    group: 'T',
    algs: ["U' F U' F' U2 L F U2 F' L", "U F' U' F U L2 U' L2 F U F U"],
  },

  // U (6)
  {
    id: 'eg1-u-1',
    set: 'eg1',
    name: 'EG-1 U 1',
    group: 'U',
    algs: ["U2 B U B' U B U' B2 R' B2 U B' U", "U2 B U B' U B U B2 R B2 U' B' U"],
  },
  {
    id: 'eg1-u-2',
    set: 'eg1',
    name: 'EG-1 U 2',
    group: 'U',
    algs: ["U' R U R' F' U' R U R' U' F R' F' R"],
  },
  {
    id: 'eg1-u-3',
    set: 'eg1',
    name: 'EG-1 U 3',
    group: 'U',
    algs: ["F' U2 R U2 R' U2 F", "U2 R U' R2 F2 R F' U R U R'"],
  },
  {
    id: 'eg1-u-4',
    set: 'eg1',
    name: 'EG-1 U 4',
    group: 'U',
    algs: ["B' R B R' B' R B2 U' B'", "U2 B U' B' R B U' B2 R B U2"],
  },
  {
    id: 'eg1-u-5',
    set: 'eg1',
    name: 'EG-1 U 5',
    group: 'U',
    algs: ["U2 R U' R' U R U' R' U' F R U' R'", "U R' F R F' U R U' R' F R U' R' U'"],
  },
  {
    id: 'eg1-u-6',
    set: 'eg1',
    name: 'EG-1 U 6',
    group: 'U',
    algs: ["L' B L U' L' B L U' L U L' B' U2", "L' B L2 U' L' U B U B'"],
  },

  // Adjacent & Diagonal (2)
  {
    id: 'eg1-adj-1',
    set: 'eg1',
    name: 'EG-1 Adjacent',
    group: 'Adjacent',
    algs: ["R2 U' R2 U2 F2 U' R2"],
  },
  {
    id: 'eg1-diag-1',
    set: 'eg1',
    name: 'EG-1 Diagonal',
    group: 'Diagonal',
    algs: ["R U' R' U' R' F2 U' R U R", "U R U' R' U' R' F2 U' R U R U"],
  },
];

export const eg1Set: CaseSet2 = {
  id: 'eg1',
  method: '2x2',
  name: 'EG-1',
  description: '二阶底面一面完成且带 1 条底层同色相邻 bar 时，一次完成顶层定向与上下层归位（共 42 条，含顶层已定向的邻换与对角换）',
  expectedCount: 42,
  complete: true,
  view: 'both2',
  cases: EG1_CASES,
};
