import type { AlgCase, CaseSet } from '../types';

/** WV 27 情形，FR 相连对固定在 UFR + UR；来源及编号对照见 docs/tasks/WV.md。 */
export const WV_CASES: AlgCase[] = [
  {"id": "wv-1", "set": "wv", "name": "WV 1", "group": "3 Corners", "algs": ["U L' U2 R U R' U2 L", "L' U2 R U2 R' U2 L"]},
  {"id": "wv-2", "set": "wv", "name": "WV 2", "group": "2 Corners", "algs": ["U R U' R'", "U l F' l'"]},
  {"id": "wv-3", "set": "wv", "name": "WV 3", "group": "2 Corners", "algs": ["R' F R U R U' R' F'", "U' L U' R U L' U R'"]},
  {"id": "wv-4", "set": "wv", "name": "WV 4", "group": "2 Corners", "algs": ["U R2 D R' U' R D' R2", "U2 R' D' R U' R' D R2 U' R'"]},
  {"id": "wv-5", "set": "wv", "name": "WV 5", "group": "2 Corners", "algs": ["U R U' R' U R' U' R U' R' U2 R", "U R U' R' U2 R U2 R' U' R U' R'"]},
  {"id": "wv-6", "set": "wv", "name": "WV 6", "group": "2 Corners", "algs": ["R U' R' U2 R U' R' U2 R U R'", "U' R' D' R U2 R' D R2 U' R'"]},
  {"id": "wv-7", "set": "wv", "name": "WV 7", "group": "2 Corners", "algs": ["U R U R' U' R U' R'", "R' U' R U R U' R' U' R' U R"]},
  {"id": "wv-8", "set": "wv", "name": "WV 8", "group": "1 Corner", "algs": ["U2 R U' R' U R U2 R'", "U2 R U L' U R' U' L"]},
  {"id": "wv-9", "set": "wv", "name": "WV 9", "group": "1 Corner", "algs": ["U2 F' R U2 R' U2 R' F R", "U R U' R' U R U2 R2 U' R2 U' R2 U2 R"]},
  {"id": "wv-10", "set": "wv", "name": "WV 10", "group": "1 Corner", "algs": ["U R U R2 U' R2 U' R2 U2 R", "R' U2 R U R' U R2 U2 R'"]},
  {"id": "wv-11", "set": "wv", "name": "WV 11", "group": "1 Corner", "algs": ["U2 R' U' R2 U' R2 U2 R", "U R U' R' L' U' L U' L' U2 L"]},
  {"id": "wv-12", "set": "wv", "name": "WV 12", "group": "1 Corner", "algs": ["R' F2 R F2 U L' U L", "l' U2 l F2 U L' U L"]},
  {"id": "wv-13", "set": "wv", "name": "WV 13", "group": "1 Corner", "algs": ["U2 R U2 R2 U' R U' R' U2 R", "R' F R F' R' U' F' U F R"]},
  {"id": "wv-14", "set": "wv", "name": "WV 14", "group": "1 Corner", "algs": ["U2 R2 D R' U2 R D' R2", "U2 L' U R U' L U2 R'"]},
  {"id": "wv-15", "set": "wv", "name": "WV 15", "group": "1 Corner", "algs": ["L' U R U' R' L", "R' U R U2 R U2 R' U R' U2 R"]},
  {"id": "wv-16", "set": "wv", "name": "WV 16", "group": "1 Corner", "algs": ["U R' D' R U R' D R2 U2 R'", "U2 R U' R' U' R' F R U R U' R' F'"]},
  {"id": "wv-17", "set": "wv", "name": "WV 17", "group": "1 Corner", "algs": ["R' F' R U2 R U2 R' F", "U L' U2 R U' R' U2 L U R U' R'"]},
  {"id": "wv-18", "set": "wv", "name": "WV 18", "group": "1 Corner", "algs": ["U2 R U2 R'", "U2 l F2 l'"]},
  {"id": "wv-19", "set": "wv", "name": "WV 19", "group": "1 Corner", "algs": ["R' F2 R2 U' R' U' R U R' F2", "U R U' R D' R U2 R' D R U2 R"]},
  {"id": "wv-20", "set": "wv", "name": "WV 20", "group": "0 Corners", "algs": ["U R U' R' U' R U R' U R U2 R'", "U L' U2 L R U R' U L' U L"]},
  {"id": "wv-21", "set": "wv", "name": "WV 21", "group": "0 Corners", "algs": ["U R U' R2 U2 R U R' U R", "U2 R U' R D R' U' R D' R2"]},
  {"id": "wv-22", "set": "wv", "name": "WV 22", "group": "0 Corners", "algs": ["U R U R D R' U2 R D' R2", "U R2 D R' U R D' R' U2 R'"]},
  {"id": "wv-23", "set": "wv", "name": "WV 23", "group": "0 Corners", "algs": ["R2 U R' U R' U' R U R U2 R2", "U2 R' U L U' R2 U L' U R'"]},
  {"id": "wv-24", "set": "wv", "name": "WV 24", "group": "0 Corners", "algs": ["U2 R U' R' U R U' R' U R U2 R'", "U R U' R' U' F' r U R' U' r' F R"]},
  {"id": "wv-25", "set": "wv", "name": "WV 25", "group": "0 Corners", "algs": ["U2 R U2 R2 U2 R U R' U R", "U2 R U2 R' U R U R' U R U2 R'"]},
  {"id": "wv-26", "set": "wv", "name": "WV 26", "group": "0 Corners", "algs": ["U R U' R2 U' R U' R' U2 R", "U R U R' U F2 L' U L U' L' U' L F2"]},
  {"id": "wv-27", "set": "wv", "name": "WV 27", "group": "0 Corners", "algs": ["U R U R' U' R U R' U' R U' R'", "U R U' R' F R U R' U' R U R' U' R U R' U' F'"]},
];

export const wvSet: CaseSet = {
  id: 'wv', method: 'cfop', name: 'WV', description: '顶棱朝向完成时最后一对顺带还原顶面（27）',
  expectedCount: 27, complete: true, view: 'top', cases: WV_CASES,
};
