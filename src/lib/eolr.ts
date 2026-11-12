import { parseAlg } from './alg';
import { applyMoves, solved, STICKERS, stickerAt, type State, type Vec } from './cube';
import type { AlgCase } from '../types';

export const EOLR_SLOTS = [
  ['UF', [0, 1, 1]], ['UB', [0, 1, -1]], ['UL', [-1, 1, 0]],
  ['UR', [1, 1, 0]], ['DF', [0, -1, 1]], ['DB', [0, -1, -1]],
] as const;
export const isRouxBlockSticker = (id: number) => Math.abs(STICKERS[id].p[0]) === 1 && STICKERS[id].p[1] <= 0;
/** 两桥 26 + 活动棱 12 + 活动中心 4；顶角留作独立对齐检查。 */
export const isEolrMask = (id: number) => !(STICKERS[id].p[1] === 1 && STICKERS[id].p.every(v => v !== 0));
const cornerIds = STICKERS.filter(s => s.p.every(v => v !== 0) && s.p[1] === 1).map(s => s.id);
const centerU = stickerAt([0, 1, 0], [0, 1, 0]);
const centerF = stickerAt([0, 0, 1], [0, 0, 1]);
const cornerSide = stickerAt([-1, 1, 1], [-1, 0, 0]);

export function inspectEolr(state: Readonly<State>) {
  const badSlots: string[] = [];
  let ulSlot = '', urSlot = '';
  const edges = EOLR_SLOTS.map(([slot, coordinates]) => {
    const p = [...coordinates] as Vec;
    const ids = STICKERS.filter(s => s.p.every((v, i) => v === p[i])).map(s => s.id);
    const ud = stickerAt(p, [0, p[1], 0]);
    const oriented = 'UD'.includes(STICKERS[state[ud]].face);
    if (!oriented) badSlots.push(slot);
    const faces = ids.map(id => STICKERS[state[id]].face).sort().join('');
    if (faces === 'LU') ulSlot = slot;
    if (faces === 'RU') urSlot = slot;
    return { slot, p, ids, oriented, lr: faces === 'LU' || faces === 'RU' };
  });
  const u = STICKERS[state[centerU]].face, f = STICKERS[state[centerF]].face;
  const centerPhase = ['UF', 'BU', 'DB', 'FD'].indexOf(u + f);
  const flat = centerPhase === 0 || centerPhase === 2;
  const blocks = state.every((id, loc) => !isRouxBlockSticker(loc) || id === loc);
  const corners = cornerIds.every(id => state[id] === id);
  const eo = flat && badSlots.length === 0;
  const tier3 = blocks && eo && corners && ulSlot === 'UL' && urSlot === 'UR';
  const tier2 = blocks && eo && [ulSlot, urSlot].sort().join(',') === 'DB,DF';
  const key = [badSlots.slice().sort().join(','), ulSlot, urSlot, centerPhase, STICKERS[state[cornerSide]].face].join('|');
  return { edges, badSlots, ulSlot, urSlot, centerPhase, flat, blocks, corners, eo, tier2, tier3, key };
}

export type EolrRef = Pick<AlgCase, 'algs'> & Partial<Pick<AlgCase, 'setup' | 'targetTier' | 'reductionKey' | 'continuationAlg'>>;
export function eolrGoal(c: EolrRef, state: Readonly<State>): boolean {
  const result = inspectEolr(state);
  if (!result.blocks) return false;
  if (c.targetTier === 'tier3') return result.tier3;
  if (c.targetTier === 'tier2') return result.tier2;
  return c.targetTier === 'tier1' && !!c.reductionKey && result.key === c.reductionKey;
}

export function preservesEolrBlocks(start: State, alg: string): boolean {
  let state = start;
  if (!inspectEolr(state).blocks) return false;
  for (const move of parseAlg(alg)) {
    state = applyMoves(state, [move]);
    if (!inspectEolr(state).blocks) return false;
  }
  return true;
}

/** 校验从独立起手开始，不能用短公式的逆代替。 */
export function lintEolr(c: EolrRef): string[] {
  const errors: string[] = [];
  if (!c.setup?.trim() || !c.targetTier) return ['EOLR 缺少独立起手或终点层级'];
  const start = applyMoves(solved(), parseAlg(c.setup));
  if (!preservesEolrBlocks(solved(), c.setup) || inspectEolr(start).centerPhase < 0) errors.push('EOLR 起手破坏两桥或中心不属于 MU 相位');
  for (const alg of c.algs) {
    if (!preservesEolrBlocks(start, alg)) errors.push('EOLR 主公式破坏两桥');
    if (!eolrGoal(c, applyMoves(start, parseAlg(alg)))) errors.push('EOLR 主公式未达到声明终点');
  }
  if (c.targetTier !== 'tier3' && !c.continuationAlg?.trim()) errors.push('EOLR 中间态和底槽终点必须提供接续');
  const full = [c.algs[0], c.continuationAlg].filter(Boolean).join(' ');
  if (!preservesEolrBlocks(start, full) || !inspectEolr(applyMoves(start, parseAlg(full))).tier3) errors.push('EOLR 接续未达到严格 EOLRb');
  return errors;
}
