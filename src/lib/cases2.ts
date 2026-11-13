import { parseAlg } from './alg';
import type { AlgCase, SetId } from '../types';
import {
  STICKERS2,
  applyMove2,
  applyMoves2,
  invertMoves2,
  solved2,
  type State2,
  type Sticker2,
} from './cube2';

export type SetId2 = Extract<SetId, 'cll'> | 'eg1' | 'eg2';

export interface CaseSet2 {
  id: SetId2;
  method: '2x2';
  name: string;
  description: string;
  expectedCount: number | null;
  complete: boolean;
  view: 'top2' | 'both2';
  cases: AlgCase[];
}

export interface SetRule2 {
  display: (s: Sticker2) => boolean;
  solve: (s: State2) => boolean;
  preserve: (s: State2, caseId: string) => boolean;
  normalize: boolean;
}

const ROTATION_BASES = new Set(['x', 'y', 'z']);

const BOTTOM_STICKERS = STICKERS2.filter((s) => s.p[1] === -1);

const FACE_STICKER_GROUPS: number[][] = (() => {
  const byFace = new Map<string, number[]>();
  for (const s of STICKERS2) {
    const arr = byFace.get(s.face) ?? [];
    arr.push(s.id);
    byFace.set(s.face, arr);
  }
  return [...byFace.values()];
})();

/** 24 个整体朝向（由 x / y 生成的正六面体旋转群）各自在 solved2 上的置换动作 */
const WHOLE_CUBE_ROTATIONS_2: string[][] = (() => {
  const seen = new Set<string>();
  const queue: { state: State2; moves: string[] }[] = [{ state: solved2(), moves: [] }];
  seen.add(queue[0].state.join(','));
  const result: string[][] = [];

  for (let i = 0; i < queue.length; i++) {
    const cur = queue[i];
    result.push(cur.moves);
    for (const base of ['x', 'y'] as const) {
      const next = applyMove2(cur.state, { base, amount: 1 });
      const key = next.join(',');
      if (!seen.has(key)) {
        seen.add(key);
        queue.push({ state: next, moves: [...cur.moves, base] });
      }
    }
  }
  return result;
})();

/** 逐元素严格等于已解态（不允许残留整体转体 x / y / z） */
export function isSolvedExact2(state: State2): boolean {
  if (state.length !== 24) return false;
  for (let i = 0; i < 24; i++) {
    if (state[i] !== i) return false;
  }
  return true;
}

/** 是否六个面各自贴纸颜色全相同（即 solved2 或其任意整体朝向） */
export function isMonochromeFaces2(state: State2): boolean {
  if (state.length !== 24) return false;
  for (const group of FACE_STICKER_GROUPS) {
    const face = STICKERS2[state[group[0]]].face;
    for (let i = 1; i < group.length; i++) {
      if (STICKERS2[state[group[i]]].face !== face) return false;
    }
  }
  return true;
}

/** CLL 不变量：底层四角全部归位且定向（D 面为 D 色，底层侧色与所在面一致） */
export function isBottomLayerSolved2(state: State2): boolean {
  if (state.length !== 24) return false;
  for (const s of BOTTOM_STICKERS) {
    const piece = state[s.id];
    if (piece !== s.id) return false;
    if (STICKERS2[piece].face !== s.face) return false;
  }
  return true;
}

export const CLL_RULE_2: SetRule2 = {
  display: () => true,
  solve: isSolvedExact2,
  preserve: (state) => isBottomLayerSolved2(state) && !isMonochromeFaces2(state),
  normalize: true,
};

export const SET_RULES_2: Record<SetId2, SetRule2> = {
  cll: CLL_RULE_2,
  eg1: {
    display: () => true,
    solve: isSolvedExact2,
    preserve: () => true,
    normalize: true,
  },
  eg2: {
    display: () => true,
    solve: isSolvedExact2,
    preserve: () => true,
    normalize: true,
  },
};

function getRule2(setId: string): SetRule2 {
  if (setId === 'cll' || setId === 'eg1' || setId === 'eg2') {
    return SET_RULES_2[setId];
  }
  throw new Error(`Unsupported 2x2 set: ${setId}`);
}

/** 校验二阶公式字符串是否合法且不含整体转体 x/y/z */
export function lintCaseAlg2(alg: string): string | null {
  try {
    const moves = parseAlg(alg);
    if (moves.length === 0) return '公式为空';
    for (const m of moves) {
      if (ROTATION_BASES.has(m.base)) {
        return `不允许包含整体转体 ${m.base}`;
      }
    }
    invertMoves2(moves);
    return null;
  } catch (err) {
    return err instanceof Error ? err.message : String(err);
  }
}

/** 由主公式的逆推导出二阶情形起手状态 */
export function caseState2(c: Pick<AlgCase, 'algs'>): State2 {
  if (!c.algs.length) throw new Error('Case has no algs');
  const err = lintCaseAlg2(c.algs[0]);
  if (err) throw new Error(err);
  return applyMoves2(solved2(), invertMoves2(parseAlg(c.algs[0])));
}

/** 校验单条公式能否从起手状态严格解出情形（不允许整体转体或残留转体） */
export function algSolvesCase2(c: Pick<AlgCase, 'set' | 'algs'>, alg: string): boolean {
  if (lintCaseAlg2(alg) !== null) return false;
  if (lintCaseAlg2(c.algs[0]) !== null) return false;
  const rule = getRule2(c.set);
  const start = caseState2(c);
  const end = applyMoves2(start, parseAlg(alg));
  return rule.solve(end);
}

/** 把状态按 0..23 贴纸面的首次出现顺序规范化成无绝对配色的指纹串 */
function canonicalFacePattern2(state: State2): string {
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

/** 按 24 个整体朝向取最小指纹（同构于整方在空间中旋转的同一个物理状态） */
export function stateFingerprint2(state: State2): string {
  let best: string | null = null;
  for (const rotNames of WHOLE_CUBE_ROTATIONS_2) {
    const rotated = applyMoves2(
      state,
      rotNames.map((base) => ({ base, amount: 1 })),
    );
    const key = canonicalFacePattern2(rotated);
    if (best === null || key < best) best = key;
  }
  return best ?? canonicalFacePattern2(state);
}

export function caseFingerprint2(c: Pick<AlgCase, 'algs'>): string {
  return stateFingerprint2(caseState2(c));
}

/** 校验一条二阶情形及其全部公式，返回错误描述数组 */
export function lintCase2(c: AlgCase): string[] {
  const errs: string[] = [];
  if (!c.algs.length) {
    errs.push(`${c.id}: 缺少公式`);
    return errs;
  }
  for (let i = 0; i < c.algs.length; i++) {
    const msg = lintCaseAlg2(c.algs[i]);
    if (msg) errs.push(`${c.id} alg[${i}]: ${msg}`);
  }
  if (errs.length > 0) return errs;

  const rule = getRule2(c.set);
  const start = caseState2(c);
  if (isMonochromeFaces2(start)) {
    errs.push(`${c.id}: 起手状态不能是六面单色`);
  }
  if (!rule.preserve(start, c.id)) {
    errs.push(`${c.id}: 起手状态违反 ${c.set} 不变量`);
  }
  for (let i = 0; i < c.algs.length; i++) {
    if (!algSolvesCase2(c, c.algs[i])) {
      errs.push(`${c.id} alg[${i}] 无法严格还原情形: ${c.algs[i]}`);
    }
  }
  return errs;
}
