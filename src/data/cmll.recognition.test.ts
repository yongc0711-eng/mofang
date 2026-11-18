import { expect, it } from 'vitest';
import { CMLL_CASES } from './cmll';
import { caseState, viewCaseFor } from '../lib/cases';
import { CMLL_CORNER_STICKERS, cmllColorCues, cmllRecognition } from '../lib/cmllRecognition';
import { BOTTOM_COLORS, FACE_COLOR, PAIRS, rouxPalette, validPairs } from '../lib/colorScheme';
import { applyMove, STICKERS, type State } from '../lib/cube';
import { COLOR_NAME_ZH } from '../lib/recognition';

const variants = (state: State) => [state, ...([1, 2, 3] as const).map(amount => applyMove(state, { base: 'U', amount }))];
const colors = (state: State) => CMLL_CORNER_STICKERS.map(({ id }) => STICKERS[state[id]]);
const shape = (state: State) => colors(state).map(({ face }) => face === 'U');
const compare = (state: State, a: number, b: number) => {
  const corners = colors(state);
  const left = corners[a].n, right = corners[b].n;
  const dot = left.reduce((sum, v, axis) => sum + v * right[axis], 0);
  return dot === 1 ? '同色' : dot === -1 ? '对色' : '相邻色';
};
const bars = (state: State) => ['F', 'R', 'B', 'L'].filter(face => {
  const [a, b] = CMLL_CORNER_STICKERS.filter(s => s.face === face);
  return STICKERS[state[a.id]].face === STICKERS[state[b.id]].face;
});
const references = CMLL_CASES.flatMap(c => variants(caseState(c)).map(state => ({ id: c.id, state, pattern: shape(state) })));
const palettes = BOTTOM_COLORS.flatMap(bottomColor => validPairs(bottomColor).flatMap(bridgePair =>
  PAIRS[bridgePair].map(leftColor => rouxPalette({ bottomColor, bridgePair, leftColor }))));

it('识别覆盖 42 个情形和 24 种桥式配色，读取 12 张顶角贴纸', () => {
  expect(CMLL_CASES).toHaveLength(42);
  expect(CMLL_CORNER_STICKERS).toHaveLength(12);
  expect(new Set(palettes.map(p => Object.values(p).join())).size).toBe(24);
});

it.each(CMLL_CASES)('$name：每个公式起手的提示排除其它情形，并使用桥式配色', c => {
  for (const alg of c.algs) {
    const view = viewCaseFor(c, alg);
    expect(view.algs[0]).toBe(alg);
    const state = caseState(view);
    const cues = cmllColorCues(c.id, state);
    const isOriented = c.group === 'O';
    for (const hold of variants(state)) {
      const pattern = shape(hold);
      const rivals = references.filter(ref => ref.id !== c.id && ref.pattern.every((on, i) => on === pattern[i]));
      if (isOriented) {
        expect(bars(hold)).toHaveLength(c.id === 'cmll-o-1' ? 1 : 0);
        expect(rivals.filter(ref => bars(ref.state).length === bars(hold).length)).toEqual([]);
      } else {
        const comparisons = cmllColorCues(c.id, hold);
        expect(comparisons.length, alg).toBeGreaterThan(0);
        expect(comparisons.length, alg).toBeLessThanOrEqual(2);
        expect(rivals.filter(ref => comparisons.every(cue => compare(ref.state, cue.a, cue.b) === cue.kind))).toEqual([]);
      }
    }
    for (const palette of palettes) {
      const hint = cmllRecognition(view, palette);
      const name = (face: keyof typeof palette) => COLOR_NAME_ZH[FACE_COLOR[palette[face]]];
      expect(hint.shape).toContain(`${name('U')}色`);
      expect(hint.cues).toHaveLength(isOriented ? 1 : cues.length);
      if (!isOriented) for (const [i, cue] of cues.entries()) {
        expect(compare(state, cue.a, cue.b)).toBe(cue.kind);
        const a = name(colors(state)[cue.a].face), b = name(colors(state)[cue.b].face);
        expect(hint.cues[i]).toContain(a === b ? `（${a}色）` : `（${a}色与${b}色）`);
      }
    }
  }
});
