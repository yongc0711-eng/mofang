import { type AlgCase } from '../types';

/**
 * PLL 21 种。algs[0] 决定图解，其余为备选，校验器会确认能解决同一情形。
 * 公式按 SpeedCubeDB 社区投票排序（2026-11-07 取得）：algs[0] 是票数最高且可用的公式，其后是其他高票公式；不用中途整体转动的公式。
 *
 * recognition 的用语：车灯 = 一面上两个角的该面贴纸同色、中间棱不同色；色条 = 一面三块同色；
 * 同色对 = 角的一个面贴纸与该面中间的棱同色。“后面”指车灯或色条所在的面，人站在它的对面看；左右前后都按这个视角。
 * 特征由引擎推出，逐条见 docs/tasks/T13.md。
 */
export const PLL_CASES: AlgCase[] = [
  { id: "pll-ua", set: "pll", name: "Ua", group: "只换棱", algs: ["M2 U M U2 M' U M2","R2 U' S' U2 S U' R2"], recognition: "后面是整条色条，其余三面都是车灯；左面的棱是前面的灯色，前面的棱是右面的灯色，右面的棱是左面的灯色" },
  { id: "pll-ub", set: "pll", name: "Ub", group: "只换棱", algs: ["M2 U' M U2 M' U' M2","R' U R' U' R' U' R' U R U R2","R2' U R U R' U' R3 U' R' U R'"], recognition: "后面是整条色条，其余三面都是车灯；左面的棱是右面的灯色，前面的棱是左面的灯色，右面的棱是前面的灯色" },
  { id: "pll-h", set: "pll", name: "H", group: "只换棱", algs: ["M2 U M2 U2 M2 U M2","M2 U' M2 U2 M2 U' M2","R2 S2 R2 U' R2 S2 R2"], recognition: "四面都是车灯；前后两条棱互换，左右两条棱互换（对面互换）" },
  { id: "pll-z", set: "pll", name: "Z", group: "只换棱", algs: ["M' U' M2 U' M2 U' M' U2 M2","M2 U M2 U M' U2 M2 U2 M'","M2 U' M2 U' M' U2 M2 U2 M'","M' U M2 U M2 U M' U2 M2"], recognition: "四面都是车灯；相邻的两条棱互换，共两对" },
  { id: "pll-aa", set: "pll", name: "Aa", group: "只换角", algs: ["x R' U R' D2 R U' R' D2 R2 x'","l' U R' D2 R U' R' D2 R2 x'"], recognition: "车灯放后面；左前角的左面和前面两块，都与各自旁边的棱同色；车灯色的第三块在右面的棱上" },
  { id: "pll-ab", set: "pll", name: "Ab", group: "只换角", algs: ["x R2 D2 R U R' D2 R U' R x'","R' B' R U' R D R' U R D' R2 B R"], recognition: "车灯放后面；右前角的前面和右面两块，都与各自旁边的棱同色；车灯色的第三块在左面的棱上" },
  { id: "pll-e", set: "pll", name: "E", group: "只换角", algs: ["R' U' R' D' R U' R' D R U R' D' R U R' D R2","R2 U F' R' U R U' R' U R U' R' U R U' F U' R2","x' R U' R' D R U R' D' R U R' D R U' R' D' x"], recognition: "没有车灯、没有色条，四面都没有任何两块相邻同色" },
  { id: "pll-t", set: "pll", name: "T", group: "相邻换角", algs: ["R U R' U' R' F R2 U' R' U' R U R' F'"], recognition: "车灯放后面；左后角的左面、右后角的右面，分别与各自旁边的棱同色；车灯色的第三块在前面的棱上" },
  { id: "pll-f", set: "pll", name: "F", group: "相邻换角", algs: ["R' U' F' R U R' U' R' F R2 U' R' U' R U R' U R","R' F R f' R' F R2 U R' U' R' F' R2 U R' S","R' U R U' R2 F' U' F U R F R' F' R2"], recognition: "后面是整条色条；其余三面没有车灯，也没有相邻同色的两块" },
  { id: "pll-ja", set: "pll", name: "Ja", group: "相邻换角", algs: ["L' U' L F L' U' L U L F' L2 U L","R' U L' U2 R U' R' U2 R L","R U' L' U R' U2 L U' L' U2 L"], recognition: "后面是整条色条；另有三处同色对：左面靠后的两块、前面靠左的两块、右面靠前的两块" },
  { id: "pll-jb", set: "pll", name: "Jb", group: "相邻换角", algs: ["R U R' F' R U R' U' R' F R2 U' R'"], recognition: "后面是整条色条；另有三处同色对：左面靠前的两块、前面靠右的两块、右面靠后的两块" },
  { id: "pll-ra", set: "pll", name: "Ra", group: "相邻换角", algs: ["R U' R' U' R U R D R' U' R D' R' U2 R'","R U R' F' R U2 R' U2 R' F R U R U2 R'","L U2 L' U2 L F' L' U' L U L F L2"], recognition: "车灯放后面；左面靠后的两块同色；车灯色的第三块在右面的棱上" },
  { id: "pll-rb", set: "pll", name: "Rb", group: "相邻换角", algs: ["R' U2 R U2 R' F R U R' U' R' F' R2","R2 F R U R U' R' F' R U2 R' U2 R","R' U2 R' D' R U' R' D R U R U' R' U' R"], recognition: "车灯放后面；右面靠后的两块同色；车灯色的第三块在左面的棱上" },
  { id: "pll-ga", set: "pll", name: "Ga", group: "G 系列", algs: ["R2 U R' U R' U' R U' R2 D U' R' U R D'","R2 u R' U R' U' R u' R2 F' U F","R2 U R' U R' U' R U' R2 U' D R' U R D'"], recognition: "车灯放后面；左面靠前的两块同色；车灯色的第三块在前面的棱上" },
  { id: "pll-gb", set: "pll", name: "Gb", group: "G 系列", algs: ["D R' U' R U D' R2 U R' U R U' R U' R2","R' U' R U D' R2 U R' U R U' R U' R2 D","F' U' F R2 u R' U R U' R u' R2"], recognition: "车灯放后面；前面靠右的两块同色；车灯色的第三块在右面的棱上" },
  { id: "pll-gc", set: "pll", name: "Gc", group: "G 系列", algs: ["R2 U' R U' R U R' U R2 D' U R U' R' D","R2 F2 R U2 R U2 R' F R U R' U' R' F R2","D R2 U' R U' R U R' U R2 D' U R U' R'","R2 U' R U' R U R' U R2 U D' R U' R' D"], recognition: "车灯放后面；右面靠前的两块同色；车灯色的第三块在前面的棱上" },
  { id: "pll-gd", set: "pll", name: "Gd", group: "G 系列", algs: ["R U R' U' D R2 U' R U' R' U R' U R2 D'","D' R U R' U' D R2 U' R U' R' U R' U R2","R2 F' R U R U' R' F' R U2 R' U2 R' F2 R2"], recognition: "车灯放后面；前面靠左的两块同色；车灯色的第三块在左面的棱上" },
  { id: "pll-v", set: "pll", name: "V", group: "对角换角", algs: ["R' U R' U' R D' R' D R' U D' R2 U' R2 D R2","R' U R U' R' f' U' R U2 R' U' R U' R' f R","R U' R U R' D R D' R U' D R2 U R2 D' R2","R' U R' U' y R' F' R2 U' R' U R' F R F"], recognition: "没有车灯、没有色条；只有两处同色对，且共用同一个角（这个角的两面都与旁边的棱同色）" },
  { id: "pll-y", set: "pll", name: "Y", group: "对角换角", algs: ["F R U' R' U' R U R' F' R U R' U' R' F R F'","F R' F R2 U' R' U' R U R' F' R U R' U' F'"], recognition: "没有车灯、没有色条；只有两处同色对，分别在对角的两个角上" },
  { id: "pll-na", set: "pll", name: "Na", group: "对角换角", algs: ["R U R' U R U R' F' R U R' U' R' F R2 U' R' U2 R U' R'","F' R U R' U' R' F R2 F U' R' U' R U F' R'","R F U' R' U R U F' R2 F' R U R U' R' F"], recognition: "没有车灯、没有色条；四面都有同色对，每面都在右边两块（从外面看）" },
  { id: "pll-nb", set: "pll", name: "Nb", group: "对角换角", algs: ["R' U R U' R' F' U' F R U R' F R' F' R U' R","r' D' F r U' r' F' D r2 U r' U' r' F r F'","R' U L' U2 R U' L R' U L' U2 R U' L"], recognition: "没有车灯、没有色条；四面都有同色对，每面都在左边两块（从外面看）" },
];
