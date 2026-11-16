import type { AlgCase } from '../types';
import { getSet } from '../data';
import { caseState2, is2x2Set } from './cases2';
import { applyMoves2, STICKERS2, type State2 } from './cube2';
import { type Face, type Move } from './cube';
import { FACE_COLOR, type Palette } from './colorScheme';
import { COLOR_NAME_ZH } from './recognition';

// Method prerequisites: https://jperm.net/2x2/faster and https://jperm.net/algs/2x2/eg-1.
// Exact positions/cues below are our geometric observations, not quotations or source numbering.
const OPPOSITE: Record<Face, Face> = { U: 'D', D: 'U', F: 'B', B: 'F', R: 'L', L: 'R' };
const SIDE: Record<Face, string> = { U: '上', D: '下', F: '前', B: '后', R: '右', L: '左' };
const TOP = STICKERS2.filter(s => s.p[1] === 1);
const SIDES = ['F', 'R', 'B', 'L'] as const;
export type ColorRelation2 = 'same' | 'opposite' | 'adjacent';
export interface RecognitionCue2 { a: number; b: number; relation: ColorRelation2 }
export interface RecognitionFacts2 {
  state: State2;
  top: Face[];
  bars: Face[];
  topBars: Face[];
  orientation: string;
}
const relation = (a: Face, b: Face): ColorRelation2 => a === b ? 'same' : OPPOSITE[a] === b ? 'opposite' : 'adjacent';
const name = (face: Face, palette: Palette) => COLOR_NAME_ZH[FACE_COLOR[palette[face]]];
const corner = (x: number, z: number) => `${x === -1 ? '左' : '右'}${z === 1 ? '前' : '后'}`;

function layerBars(state: State2, level: 1 | -1): Face[] {
  return SIDES.filter(face => {
    const ids = STICKERS2.filter(s => s.face === face && s.p[1] === level);
    return STICKERS2[state[ids[0].id]].face === STICKERS2[state[ids[1].id]].face;
  });
}
export function recognitionFacts2(state: State2): RecognitionFacts2 {
  const top = TOP.map(s => STICKERS2[state[s.id]].face);
  return { state, top, bars: layerBars(state, -1), topBars: layerBars(state, 1), orientation: top.map(f => f === 'U' ? '1' : '0').join('') };
}
interface Reference { id: string; facts: RecognitionFacts2 }
const references = new Map<string, Reference[]>();
function referencesFor(set: AlgCase['set']): Reference[] {
  let entries = references.get(set);
  if (entries) return entries;
  entries = getSet(set)!.cases.flatMap(c => {
    const state = caseState2(c);
    return [0, 1, 2, 3].flatMap(u => [0, 1, 2, 3].map(y => {
      const moves: Move[] = [];
      if (u) moves.push({ base: 'U', amount: u as 1 | 2 | 3 });
      if (y) moves.push({ base: 'y', amount: y as 1 | 2 | 3 });
      return { id: c.id, facts: recognitionFacts2(applyMoves2(state, moves)) };
    }));
  });
  references.set(set, entries);
  return entries;
}
function cueCost(a: number, b: number) {
  const visible = (i: number) => ({ U: 0, F: 0, R: 1, L: 2, B: 3, D: 4 })[TOP[i].face];
  return visible(a) + visible(b) + (TOP[a].face === TOP[b].face ? 0 : 1);
}
const cachedCues = new Map<string, RecognitionCue2[]>();
/** Cues must distinguish other IDs even after AUF/y; orientation and bottom bar are prerequisites. */
export function recognitionCues2(c: AlgCase, facts = recognitionFacts2(caseState2(c))): RecognitionCue2[] {
  const key = `${c.set}/${c.id}/${facts.state.join(',')}`;
  const cached = cachedCues.get(key);
  if (cached) return cached;
  let rivals = referencesFor(c.set).filter(r => r.id !== c.id && r.facts.orientation === facts.orientation && r.facts.bars.join() === facts.bars.join());
  const cues: RecognitionCue2[] = [];
  while (rivals.length) {
    let best: { a: number; b: number; relation: ColorRelation2; removed: number; cost: number } | undefined;
    for (let a = 0; a < TOP.length; a++) for (let b = a + 1; b < TOP.length; b++) {
      if (facts.top[a] === 'U' || facts.top[b] === 'U') continue;
      const value = relation(facts.top[a], facts.top[b]);
      // Positive same/opposite relationships are easier to use than “neither”.
      if (value === 'adjacent') continue;
      const removed = rivals.filter(r => relation(r.facts.top[a], r.facts.top[b]) !== value).length;
      const cost = cueCost(a, b);
      if (!best || removed > best.removed || (removed === best.removed && cost < best.cost)) best = { a, b, relation: value, removed, cost };
    }
    if (!best?.removed) throw new Error(`${c.id} 的识别关系无法区分相似情形`);
    cues.push({ a: TOP[best.a].id, b: TOP[best.b].id, relation: best.relation });
    const chosen = best;
    rivals = rivals.filter(r => relation(r.facts.top[chosen.a], r.facts.top[chosen.b]) === chosen.relation);
  }
  cachedCues.set(key, cues);
  return cues;
}
export function stickerLabel2(id: number): string {
  const s = STICKERS2[id];
  return s.face === 'U' ? `顶面${corner(s.p[0], s.p[2])}角` : `${corner(s.p[0], s.p[2])}角${SIDE[s.face]}侧`;
}
function pairLabel(a: number, b: number): string {
  const left = STICKERS2[a], right = STICKERS2[b];
  if (left.face === right.face && left.face !== 'U') return `${SIDE[left.face]}侧顶层两格`;
  if (left.face === 'U' && right.face === 'U') {
    if (left.p[0] === right.p[0]) return `顶面${left.p[0] === -1 ? '左' : '右'}列两格`;
    if (left.p[2] === right.p[2]) return `顶面${left.p[2] === 1 ? '前' : '后'}排两格`;
  }
  return `${stickerLabel2(a)}与${stickerLabel2(b)}`;
}
export interface RecognitionText2 { bottom: string; orientation: string; cues: string[]; guide: string }
/** Same state and palette as the visible diagram; no hardcoded yellow/white case descriptions. */
export function recognitionText2(c: AlgCase, palette: Palette): RecognitionText2 {
  if (!is2x2Set(c.set)) throw new Error('二阶识别提示只接受二阶情形');
  const state = caseState2(c), facts = recognitionFacts2(state), bottomColor = name('D', palette), topColor = name('U', palette);
  let bottom: string;
  if (c.set === 'cll') bottom = `${bottomColor}色底层已还原，四个侧面底行都同色。`;
  else if (c.set === 'eg1') {
    const bar = facts.bars[0];
    const sticker = STICKERS2.find(s => s.face === bar && s.p[1] === -1)!;
    const color = name(STICKERS2[state[sticker.id]].face, palette);
    bottom = `${bottomColor}色底面已完成；底层唯一同色边在${SIDE[bar]}侧（${color}色），先对齐这条边。`;
  } else bottom = `${bottomColor}色底面已完成；底层四个侧面都没有同色边。`;
  const up = TOP.filter((s, i) => s.face === 'U' && facts.top[i] === 'U').map(s => corner(s.p[0], s.p[2]));
  const side = TOP.filter((s, i) => s.face !== 'U' && facts.top[i] === 'U').map(s => `${corner(s.p[0], s.p[2])}朝${SIDE[s.face]}`);
  const orientation = up.length === 4 ? `顶面四角均为${topColor}色。` :
    `${up.length ? `顶面${topColor}角在${up.join('、')}` : `顶面没有${topColor}角`}；侧面${topColor}贴纸：${side.join('、')}。`;
  const cues = recognitionCues2(c, facts).map(cue => {
    const a = STICKERS2[state[cue.a]].face, b = STICKERS2[state[cue.b]].face;
    const colors = cue.relation === 'same' ? `${name(a, palette)}色` : `${name(a, palette)} / ${name(b, palette)}`;
    return `${pairLabel(cue.a, cue.b)}：${cue.relation === 'same' ? '同色' : '对色'}（${colors}）。`;
  });
  if (up.length === 4) {
    const bar = facts.topBars[0];
    const sticker = STICKERS2.find(s => s.face === bar && s.p[1] === 1);
    const cue = sticker ? `顶层唯一同色边在${SIDE[bar]}侧（${name(STICKERS2[state[sticker.id]].face, palette)}色）。` : '顶层四个侧面都没有同色边。';
    cues.splice(0, cues.length, cue);
  }
  return { bottom, orientation, cues, guide: `先按图持方再比色；顶视图前侧在下${c.set === 'cll' ? '' : '，底视图前侧在上'}。${up.length === 4 ? '' : '对色指一对相对的颜色。'}` };
}
