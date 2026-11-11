import { type AlgCase, type CaseSet, type MethodId, type SetId } from '../types';
import { CMLL_CASES } from './cmll';
import { COLL_CASES } from './coll';
import { F2L_CASES } from './f2l';
import { LSE_CASES } from './lse';
import { OLL_CASES } from './oll';
import { PLL_CASES } from './pll';

export const SETS: CaseSet[] = [
  { id: 'f2l', method: 'cfop', name: 'F2L', description: '前两层', expectedCount: 41, complete: true, view: 'iso', cases: F2L_CASES },
  { id: 'oll', method: 'cfop', name: 'OLL', description: '顶层朝向', expectedCount: 57, complete: true, view: 'top', cases: OLL_CASES },
  { id: 'pll', method: 'cfop', name: 'PLL', description: '顶层排列', expectedCount: 21, complete: true, view: 'top', cases: PLL_CASES },
  { id: 'coll', method: 'cfop', name: 'COLL', description: '顶棱色相完成时一次还原顶角（40）', expectedCount: 40, complete: true, view: 'top', cases: COLL_CASES },
  { id: 'cmll', method: 'roux', name: 'CMLL', description: '顶层四角', expectedCount: 42, complete: true, view: 'top', cases: CMLL_CASES },
  { id: 'lse', method: 'roux', name: 'LSE', description: '最后六棱', expectedCount: null, complete: true, view: 'lse', cases: LSE_CASES },
];

export const METHODS: { id: MethodId; name: string; hint: string }[] = [
  { id: 'cfop', name: 'CFOP', hint: '十字 → F2L → OLL → PLL' },
  { id: 'roux', name: '桥式 Roux', hint: '两侧方块 → CMLL → LSE' },
];

export const ALL_CASES: AlgCase[] = SETS.flatMap((s) => s.cases);
const BY_ID = new Map(ALL_CASES.map((c) => [c.id, c]));

export const getCase = (id: string) => BY_ID.get(id);
export const getSet = (id: SetId | string) => SETS.find((s) => s.id === id);
