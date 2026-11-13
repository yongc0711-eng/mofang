/**
 * 二阶 CLL（Corners of the Last Layer，底层完成后一次完成顶层定向与归位）42 条公式集。
 *
 * 编号与来源口径（42 = 40 + 2）：
 * - 40 条 OLL 形态情形（Antisune 6 / H 4 / L 6 / Pi 6 / Sune 6 / T 6 / U 6）采用 SpeedCubeDB
 *   的组内 1..6 编号，并与 J Perm 2x2 CLL 页面同态一一对应（无冲突、无遗漏）。
 * - 另 2 条顶层已完成定向的换角情形（Adjacent / Diagonal）来自 J Perm 2x2 CLL（SpeedCubeDB 未在
 *   CLL 分类下重复列出这两条 OLL-Skip/PLL 情形），合计 42 条。
 *
 * 转体去除说明（本文件全部公式不含 x/y/z）：
 * - SpeedCubeDB/J Perm 中的前置 y/y'/y2（如 CLL AS 1 "y R U2 R' U' R U' R'"、CLL L 1 "y R U2..."）
 *   对应在相同朝向起手上等价去掉整体前置 y，或用等价 U 前/后 AUF 配平后的 RLUDBF 公式；
 * - CLL T 2 原公式 "y L' U' L U L F' L' F" 经 y 共轭变换为 "F' U' F U F R' F' R"；
 * - CLL H 3 原 J Perm 公式 "x' U2 R U2 R2 F2 R U2 x" 取用 SpeedCubeDB 无转体等价公式
 *   "R U' R' F R' F' R2 U' R' F R' F' R"。
 */
import type { AlgCase } from '../types';
import type { CaseSet2 } from '../lib/cases2';

export const CLL_CASES: AlgCase[] = [
  // Antisune (6)
  {
    id: 'cll-as-1',
    set: 'cll',
    name: 'CLL AS 1',
    group: 'Antisune',
    algs: ["L' U' L U' L' U2 L", "U2 R' U' R U' R' U2 R U2"],
  },
  {
    id: 'cll-as-2',
    set: 'cll',
    name: 'CLL AS 2',
    group: 'Antisune',
    algs: ["R' U R U' R2 F R F' R U R' U' R", "U2 R U2 R' F R' F' R U' R U' R'"],
  },
  {
    id: 'cll-as-3',
    set: 'cll',
    name: 'CLL AS 3',
    group: 'Antisune',
    algs: ["F' L F L' U2 L' U2 L"],
  },
  {
    id: 'cll-as-4',
    set: 'cll',
    name: 'CLL AS 4',
    group: 'Antisune',
    algs: ["R' F R F' R U R'", "L' U R U' L U R'"],
  },
  {
    id: 'cll-as-5',
    set: 'cll',
    name: 'CLL AS 5',
    group: 'Antisune',
    algs: ["R U2 R' U2 R' F R F'"],
  },
  {
    id: 'cll-as-6',
    set: 'cll',
    name: 'CLL AS 6',
    group: 'Antisune',
    algs: ["L' U' L U L F' L' F L' U' L U' L' U2 L", "U2 R2 F' U' R2 F' R2 U F R2 U'"],
  },

  // H (4)
  {
    id: 'cll-h-1',
    set: 'cll',
    name: 'CLL H 1',
    group: 'H',
    algs: ["F R2 U' R2 U' R2 U R2 F'", "F R U' R' U R U2 R' U' R U R' U' F'"],
  },
  {
    id: 'cll-h-2',
    set: 'cll',
    name: 'CLL H 2',
    group: 'H',
    algs: ["R U R' U R U L' U R' U' L", "R U R' U R U R' F R' F' R"],
  },
  {
    id: 'cll-h-3',
    set: 'cll',
    name: 'CLL H 3',
    group: 'H',
    algs: ["R U' R' F R' F' R2 U' R' F R' F' R"],
  },
  {
    id: 'cll-h-4',
    set: 'cll',
    name: 'CLL H 4',
    group: 'H',
    algs: ["R2 U2 R' U2 R2", "R2 U2 R U2 R2 U2"],
  },

  // L (6)
  {
    id: 'cll-l-1',
    set: 'cll',
    name: 'CLL L 1',
    group: 'L',
    algs: ["R U2 R' F' R U2 R' U R' F2 R", "U' R' F' R U R' U' R' F R2 U' R' U2 R U2"],
  },
  {
    id: 'cll-l-2',
    set: 'cll',
    name: 'CLL L 2',
    group: 'L',
    algs: ["R U2 R2 F2 R U R' F2 R F'", "U2 R U' R' U R U' R' F R' F' R2 U R' U2"],
  },
  {
    id: 'cll-l-3',
    set: 'cll',
    name: 'CLL L 3',
    group: 'L',
    algs: ["R' U R' U2 R U' R' U R U' R2"],
  },
  {
    id: 'cll-l-4',
    set: 'cll',
    name: 'CLL L 4',
    group: 'L',
    algs: ["R U2 R2 F R F' R U2 R'", "U' R U2 R' F R' F' R2 U2 R' U'"],
  },
  {
    id: 'cll-l-5',
    set: 'cll',
    name: 'CLL L 5',
    group: 'L',
    algs: ["F R' F' R U R U' R'"],
  },
  {
    id: 'cll-l-6',
    set: 'cll',
    name: 'CLL L 6',
    group: 'L',
    algs: ["F R U' R' U' R U R' F'", "U' R U R U' R' F R' F'"],
  },

  // Pi (6)
  {
    id: 'cll-pi-1',
    set: 'cll',
    name: 'CLL Pi 1',
    group: 'Pi',
    algs: ["R' F2 R F' U2 R U' R' U' F", "U F U R U' R' U R U' R2 F' R U R U' R' U'"],
  },
  {
    id: 'cll-pi-2',
    set: 'cll',
    name: 'CLL Pi 2',
    group: 'Pi',
    algs: ["R U2 R' U' R U R' U2 R' F R F'", "R U R' U' R' F R2 U R' U' R U R' U' F'"],
  },
  {
    id: 'cll-pi-3',
    set: 'cll',
    name: 'CLL Pi 3',
    group: 'Pi',
    algs: ["F R2 U' R2 U R2 U R2 F'", "U2 R U' R U' R' U R' F R2 F' U2"],
  },
  {
    id: 'cll-pi-4',
    set: 'cll',
    name: 'CLL Pi 4',
    group: 'Pi',
    algs: ["R U' R' F R' F R U R' F R", "R U' R' F L' U L U L' U L"],
  },
  {
    id: 'cll-pi-5',
    set: 'cll',
    name: 'CLL Pi 5',
    group: 'Pi',
    algs: ["R' U' R' F R F' R U' R' U2 R", "U R2 U R' U' F R F' R U' R2 U'"],
  },
  {
    id: 'cll-pi-6',
    set: 'cll',
    name: 'CLL Pi 6',
    group: 'Pi',
    algs: ["R U' R2 U R2 U R2 U' R", "R U2 R2 U' R2 U' R2 U2 R"],
  },

  // Sune (6)
  {
    id: 'cll-s-1',
    set: 'cll',
    name: 'CLL S 1',
    group: 'Sune',
    algs: ["L' U2 L U2 L F' L' F", "R' F2 R U2 R U' R' F"],
  },
  {
    id: 'cll-s-2',
    set: 'cll',
    name: 'CLL S 2',
    group: 'Sune',
    algs: ["R U R' U' R' F R F' R U R' U R U2 R'", "R U2 R' F R U2 R' U R U' R' F U2"],
  },
  {
    id: 'cll-s-3',
    set: 'cll',
    name: 'CLL S 3',
    group: 'Sune',
    algs: ["L F' L' F L' U' L", "R U' R' F R' F' R"],
  },
  {
    id: 'cll-s-4',
    set: 'cll',
    name: 'CLL S 4',
    group: 'Sune',
    algs: ["F R' F' R U2 R U2 R'"],
  },
  {
    id: 'cll-s-5',
    set: 'cll',
    name: 'CLL S 5',
    group: 'Sune',
    algs: ["R U R' U R' F R F' R U2 R'", "U2 R U R' U' R' F R F' R U' R' F R' F' R U"],
  },
  {
    id: 'cll-s-6',
    set: 'cll',
    name: 'CLL S 6',
    group: 'Sune',
    algs: ["R U R' U R U2 R'", "R U R2 U' R2 U R U"],
  },

  // T (6)
  {
    id: 'cll-t-1',
    set: 'cll',
    name: 'CLL T 1',
    group: 'T',
    algs: ["R U R' U' R' F R F'"],
  },
  {
    id: 'cll-t-2',
    set: 'cll',
    name: 'CLL T 2',
    group: 'T',
    algs: ["F' U' F U F R' F' R"],
  },
  {
    id: 'cll-t-3',
    set: 'cll',
    name: 'CLL T 3',
    group: 'T',
    algs: ["F U' R U2 R' U' F2 R U R'"],
  },
  {
    id: 'cll-t-4',
    set: 'cll',
    name: 'CLL T 4',
    group: 'T',
    algs: ["R' U R U2 R2 F' R U' R' F2 R2"],
  },
  {
    id: 'cll-t-5',
    set: 'cll',
    name: 'CLL T 5',
    group: 'T',
    algs: ["F R U R' U' R U' R' U' R U R' F'"],
  },
  {
    id: 'cll-t-6',
    set: 'cll',
    name: 'CLL T 6',
    group: 'T',
    algs: ["R' U R U2 R2 F R F' R"],
  },

  // U (6)
  {
    id: 'cll-u-1',
    set: 'cll',
    name: 'CLL U 1',
    group: 'U',
    algs: ["F R U R' U' F'", "U R' F' U' F U R U'"],
  },
  {
    id: 'cll-u-2',
    set: 'cll',
    name: 'CLL U 2',
    group: 'U',
    algs: ["R2 F2 R U R' F R2 U2 R' U' R", "U R' U' R2 U R' U2 R U2 R' U R'"],
  },
  {
    id: 'cll-u-3',
    set: 'cll',
    name: 'CLL U 3',
    group: 'U',
    algs: ["R U2 R U' R' F R' F2 U' F", "U R' F R U' R' U' R U R' F' R U R' U' R' F R F' R U2"],
  },
  {
    id: 'cll-u-4',
    set: 'cll',
    name: 'CLL U 4',
    group: 'U',
    algs: ["F R' F' R U' R U' R' U2 R U' R'", "U F R U' R' U R U R' U R U' R' F' U'"],
  },
  {
    id: 'cll-u-5',
    set: 'cll',
    name: 'CLL U 5',
    group: 'U',
    algs: ["R U' R2 F R F' R U R' U' R U R'", "R2 D' R U2 R' D R U2 R"],
  },
  {
    id: 'cll-u-6',
    set: 'cll',
    name: 'CLL U 6',
    group: 'U',
    algs: ["R' U R' F R F' R U2 R' U R", "L' U L2 F' L' F L' U' L U L' U' L U2"],
  },

  // Adjacent & Diagonal (2)
  {
    id: 'cll-adj-1',
    set: 'cll',
    name: 'CLL Adjacent',
    group: 'Adjacent',
    algs: ["R U R' U' R' F R2 U' R' U' R U R' F'", "R U R' F' R U R' U' R' F R2 U' R' U'"],
  },
  {
    id: 'cll-diag-1',
    set: 'cll',
    name: 'CLL Diagonal',
    group: 'Diagonal',
    algs: ["F R U' R' U' R U R' F' R U R' U' R' F R F'", "R' U R' F2 R F' U R' F2 R F' R U"],
  },
];

export const cllSet: CaseSet2 = {
  id: 'cll',
  method: '2x2',
  name: 'CLL',
  description: '二阶底层完成后一步完成顶层四角定向与归位（共 42 条，含邻角换与对角换）',
  expectedCount: 42,
  complete: true,
  view: 'top2',
  cases: CLL_CASES,
};
