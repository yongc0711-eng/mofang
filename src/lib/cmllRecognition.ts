import { CMLL_CASES } from '../data/cmll';
import type { AlgCase } from '../types';
import { caseState } from './cases';
import { FACE_COLOR, paletteFace, type Palette } from './colorScheme';
import { applyMove, STICKERS, type Face, type State } from './cube';
import { COLOR_NAME_ZH } from './recognition';

export const CMLL_CORNER_STICKERS = STICKERS.filter(({ p: [x, y, z] }) => y === 1 && x !== 0 && z !== 0);
const direction: Record<Face, string> = { U: '上', D: '下', F: '前', B: '后', R: '右', L: '左' };
const opposite: Record<Face, Face> = { U: 'D', D: 'U', F: 'B', B: 'F', R: 'L', L: 'R' };
const visibility: Record<Face, number> = { U: 0, D: 3, F: 0, R: 1, L: 1, B: 2 };
const corner = ([x, , z]: readonly number[]) => `${x < 0 ? '左' : '右'}${z > 0 ? '前' : '后'}角`;
const relation = (a: Face, b: Face) => a === b ? '同色' : opposite[a] === b ? '对色' : '相邻色';
const colorsAtCorners = (state: State) => CMLL_CORNER_STICKERS.map(({ id }) => STICKERS[state[id]].face);
const orientation = (faces: Face[]) => faces.map(face => face === 'U' ? '1' : '0').join('');
const uTurns = [1, 2, 3] as const;

let references: { id: string; pattern: string; colors: Face[] }[] | undefined;
function referenceCorners() {
  return references ??= CMLL_CASES.flatMap(c => {
    const state = caseState(c);
    return [state, ...uTurns.map(amount => applyMove(state, { base: 'U', amount }))].map(hold => {
      const colors = colorsAtCorners(hold);
      return { id: c.id, colors, pattern: orientation(colors) };
    });
  });
}

type Cue = { a: number; b: number; kind: ReturnType<typeof relation> };
/** Pick a short sequence of comparisons that rules out all other cases in this hold. */
export function cmllColorCues(id: string, state: State): Cue[] {
  const colors = colorsAtCorners(state);
  const pattern = orientation(colors);
  const rivals = referenceCorners().filter(ref => ref.id !== id && ref.pattern === pattern);
  const candidates: Cue[] = [];
  for (let a = 0; a < colors.length; a++) {
    if (colors[a] === 'U') continue;
    for (let b = a + 1; b < colors.length; b++) {
      if (colors[b] !== 'U') candidates.push({ a, b, kind: relation(colors[a], colors[b]) });
    }
  }
  const matches = (cue: Cue, faces: Face[]) => relation(faces[cue.a], faces[cue.b]) === cue.kind;
  const cost = (cue: Cue) => {
    const a = CMLL_CORNER_STICKERS[cue.a].face, b = CMLL_CORNER_STICKERS[cue.b].face;
    return visibility[a] + visibility[b] + Number(a !== b) + Number(cue.kind === '相邻色');
  };
  candidates.sort((a, b) => cost(a) - cost(b));
  const one = candidates.find(cue => rivals.every(ref => !matches(cue, ref.colors)));
  if (one) return [one];
  for (const [index, a] of candidates.entries()) {
    const b = candidates.slice(index + 1).find(cue => rivals.every(ref => !matches(a, ref.colors) || !matches(cue, ref.colors)));
    if (b) return [a, b];
  }
  return [];
}

const position = (index: number) => {
  const { face, p } = CMLL_CORNER_STICKERS[index];
  return face === 'U' ? `顶面${corner(p)}` : `${corner(p)}的${direction[face]}侧`;
};

export function cmllRecognition(c: AlgCase, palette: Palette) {
  const state = caseState(c);
  const colors = colorsAtCorners(state);
  const name = (id: number) => COLOR_NAME_ZH[FACE_COLOR[paletteFace(id, palette)]];
  const topColor = COLOR_NAME_ZH[FACE_COLOR[palette.U]];
  const top = CMLL_CORNER_STICKERS.filter(({ face }, i) => face === 'U' && colors[i] === 'U');
  const side = CMLL_CORNER_STICKERS.filter(({ face }, i) => face !== 'U' && colors[i] === 'U');
  const shape = top.length === 4 ? `四角的${topColor}色都朝上。` : [
    top.length === 0 ? `没有${topColor}色角贴纸朝上` : `${topColor}色朝上的角在${top.map(({ p }) => corner(p)).join('、')}`,
    `其余${topColor}色贴纸在${side.map(({ p, face }) => `${corner(p)}的${direction[face]}侧`).join('、')}`,
  ].join('。') + '。';

  if (top.length === 4) {
    const bars = (['F', 'R', 'B', 'L'] as const).flatMap(face => {
      const [a, b] = CMLL_CORNER_STICKERS.filter(sticker => sticker.face === face);
      return STICKERS[state[a.id]].face === STICKERS[state[b.id]].face ? [`${direction[face]}侧两角同为${name(state[a.id])}色。`] : [];
    });
    return { shape, cues: bars.length ? bars : ['四个侧面的两枚顶角贴纸都不同色。'] };
  }
  const cues = cmllColorCues(c.id, state).map(({ a, b, kind }) => {
    const left = name(state[CMLL_CORNER_STICKERS[a].id]);
    const right = name(state[CMLL_CORNER_STICKERS[b].id]);
    const pair = left === right ? `${left}色` : `${left}色与${right}色`;
    return `${position(a)}与${position(b)}为${kind}（${pair}）。`;
  });
  return { shape, cues };
}
