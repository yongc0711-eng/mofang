import { type AlgCase } from '../types';

/**
 * PLL 21 种。algs[0] 决定图解，其余为备选，校验器会确认能解决同一情形。
 * 公式按 SpeedCubeDB 社区投票排序（2026-11-07 取得）：algs[0] 是票数最高且可用的公式，其后是其他高票公式；不用中途整体转动的公式。
 */
export const PLL_CASES: AlgCase[] = [
  { id: "pll-ua", set: "pll", name: "Ua", group: "只换棱", algs: ["M2 U M U2 M' U M2","R2 U' S' U2 S U' R2"], recognition: "一面是完整色条，其余三条棱循环" },
  { id: "pll-ub", set: "pll", name: "Ub", group: "只换棱", algs: ["M2 U' M U2 M' U' M2","R' U R' U' R' U' R' U R U R2","R2' U R U R' U' R3 U' R' U R'"], recognition: "一面是完整色条，其余三条棱循环（与 Ua 反向）" },
  { id: "pll-h", set: "pll", name: "H", group: "只换棱", algs: ["M2 U M2 U2 M2 U M2","M2 U' M2 U2 M2 U' M2","R2 S2 R2 U' R2 S2 R2"], recognition: "四面都是车灯，对面棱互换" },
  { id: "pll-z", set: "pll", name: "Z", group: "只换棱", algs: ["M' U' M2 U' M2 U' M' U2 M2","M2 U M2 U M' U2 M2 U2 M'","M2 U' M2 U' M' U2 M2 U2 M'","M' U M2 U M2 U M' U2 M2"], recognition: "四面都是车灯，相邻棱两两互换" },
  { id: "pll-aa", set: "pll", name: "Aa", group: "只换角", algs: ["x R' U R' D2 R U' R' D2 R2 x'","l' U R' D2 R U' R' D2 R2 x'"], recognition: "只有一面车灯，棱都已对齐，角三循环" },
  { id: "pll-ab", set: "pll", name: "Ab", group: "只换角", algs: ["x R2 D2 R U R' D2 R U' R x'","R' B' R U' R D R' U R D' R2 B R"], recognition: "只有一面车灯，棱都已对齐，角三循环（与 Aa 反向）" },
  { id: "pll-e", set: "pll", name: "E", group: "只换角", algs: ["R' U' R' D' R U' R' D R U R' D' R U R' D R2","R2 U F' R' U R U' R' U R U' R' U R U' F U' R2","x' R U' R' D R U R' D' R U R' D R U' R' D' x"], recognition: "没有车灯，棱都已对齐，角两两对换" },
  { id: "pll-t", set: "pll", name: "T", group: "相邻换角", algs: ["R U R' U' R' F R2 U' R' U' R U R' F'"], recognition: "只有一面车灯" },
  { id: "pll-f", set: "pll", name: "F", group: "相邻换角", algs: ["R' U' F' R U R' U' R' F R2 U' R' U' R U R' U R","R' F R f' R' F R2 U R' U' R' F' R2 U R' S","R' U R U' R2 F' U' F U R F R' F' R2"], recognition: "没有车灯，另有1面是完整色条" },
  { id: "pll-ja", set: "pll", name: "Ja", group: "相邻换角", algs: ["L' U' L F L' U' L U L F' L2 U L","R' U L' U2 R U' R' U2 R L","R U' L' U R' U2 L U' L' U2 L"], recognition: "没有车灯，另有1面是完整色条" },
  { id: "pll-jb", set: "pll", name: "Jb", group: "相邻换角", algs: ["R U R' F' R U R' U' R' F R2 U' R'"], recognition: "没有车灯，另有1面是完整色条" },
  { id: "pll-ra", set: "pll", name: "Ra", group: "相邻换角", algs: ["R U' R' U' R U R D R' U' R D' R' U2 R'","R U R' F' R U2 R' U2 R' F R U R U2 R'","L U2 L' U2 L F' L' U' L U L F L2"], recognition: "只有一面车灯" },
  { id: "pll-rb", set: "pll", name: "Rb", group: "相邻换角", algs: ["R' U2 R U2 R' F R U R' U' R' F' R2","R2 F R U R U' R' F' R U2 R' U2 R","R' U2 R' D' R U' R' D R U R U' R' U' R"], recognition: "只有一面车灯" },
  { id: "pll-ga", set: "pll", name: "Ga", group: "G 系列", algs: ["R2 U R' U R' U' R U' R2 D U' R' U R D'","R2 u R' U R' U' R u' R2 F' U F","R2 U R' U R' U' R U' R2 U' D R' U R D'"], recognition: "只有一面车灯" },
  { id: "pll-gb", set: "pll", name: "Gb", group: "G 系列", algs: ["D R' U' R U D' R2 U R' U R U' R U' R2","R' U' R U D' R2 U R' U R U' R U' R2 D","F' U' F R2 u R' U R U' R u' R2"], recognition: "只有一面车灯" },
  { id: "pll-gc", set: "pll", name: "Gc", group: "G 系列", algs: ["R2 U' R U' R U R' U R2 D' U R U' R' D","R2 F2 R U2 R U2 R' F R U R' U' R' F R2","D R2 U' R U' R U R' U R2 D' U R U' R'","R2 U' R U' R U R' U R2 U D' R U' R' D"], recognition: "只有一面车灯" },
  { id: "pll-gd", set: "pll", name: "Gd", group: "G 系列", algs: ["R U R' U' D R2 U' R U' R' U R' U R2 D'","D' R U R' U' D R2 U' R U' R' U R' U R2","R2 F' R U R U' R' F' R U2 R' U2 R' F2 R2"], recognition: "只有一面车灯" },
  { id: "pll-v", set: "pll", name: "V", group: "对角换角", algs: ["R' U R' U' R D' R' D R' U D' R2 U' R2 D R2","R' U R U' R' f' U' R U2 R' U' R U' R' f R","R U' R U R' D R D' R U' D R2 U R2 D' R2","R' U R' U' y R' F' R2 U' R' U R' F R F"], recognition: "没有车灯、没有色条" },
  { id: "pll-y", set: "pll", name: "Y", group: "对角换角", algs: ["F R U' R' U' R U R' F' R U R' U' R' F R F'","F R' F R2 U' R' U' R U R' F' R U R' U' F'"], recognition: "没有车灯、没有色条" },
  { id: "pll-na", set: "pll", name: "Na", group: "对角换角", algs: ["R U R' U R U R' F' R U R' U' R' F R2 U' R' U2 R U' R'","F' R U R' U' R' F R2 F U' R' U' R U F' R'","R F U' R' U R U F' R2 F' R U R U' R' F"], recognition: "没有车灯、没有色条" },
  { id: "pll-nb", set: "pll", name: "Nb", group: "对角换角", algs: ["R' U R U' R' F' U' F R U R' F R' F' R U' R","r' D' F r U' r' F' D r2 U r' U' r' F r F'","R' U L' U2 R U' L R' U L' U2 R U' L"], recognition: "没有车灯、没有色条" },
];
