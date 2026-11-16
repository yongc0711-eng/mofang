import { describe, expect, it } from 'vitest';
import { renderToStaticMarkup } from 'react-dom/server';
import { SETS, getCase } from '../data';
import { parseAlg } from './alg';
import { applyMoves2, invertMoves2, solved2, STICKERS2 } from './cube2';
import type { Move } from './cube';
import { BOTTOM_COLORS, bottomPalette, FACE_COLOR } from './colorScheme';
import { COLOR_NAME_ZH } from './recognition';
import { recognitionCues2, recognitionFacts2, recognitionText2 } from './recognition2';
import { Recognition2 } from '../components/Recognition2';

const sets = SETS.filter(s => s.method === '2x2');
const topIds = STICKERS2.filter(s => s.p[1] === 1).map(s => s.id);
const makeState = (alg: string) => applyMoves2(solved2(), invertMoves2(parseAlg(alg)));
// Independent coordinate checks: no recognitionFacts2 or production opposite-color table.
function observation(state: number[]) {
  const orientation = topIds.map(id => STICKERS2[state[id]].face === 'U' ? '1' : '0').join('');
  const bars = (['F', 'R', 'B', 'L'] as const).filter(face => {
    const ids = STICKERS2.filter(s => s.face === face && s.p[1] === -1).map(s => s.id);
    return STICKERS2[state[ids[0]]].face === STICKERS2[state[ids[1]]].face;
  });
  const topBars = (['F', 'R', 'B', 'L'] as const).filter(face => {
    const ids = STICKERS2.filter(s => s.face === face && s.p[1] === 1).map(s => s.id);
    return STICKERS2[state[ids[0]]].face === STICKERS2[state[ids[1]]].face;
  });
  return { orientation, bars, topBars };
}
function relation(state: number[], a: number, b: number) {
  const x = STICKERS2[state[a]], y = STICKERS2[state[b]];
  return x.face === y.face ? 'same' : x.n.reduce((sum, v, i) => sum + v * y.n[i], 0) === -1 ? 'opposite' : 'adjacent';
}

describe.each(sets)('$name: 42 complete, sufficient and color-correct recognition hints', set => {
  const variants = set.cases.flatMap(c => [0, 1, 2, 3].flatMap(u => [0, 1, 2, 3].map(y => {
    const moves: Move[] = [];
    if (u) moves.push({ base: 'U', amount: u as 1 | 2 | 3 });
    if (y) moves.push({ base: 'y', amount: y as 1 | 2 | 3 });
    const state = applyMoves2(makeState(c.algs[0]), moves);
    return { id: c.id, state, ...observation(state) };
  })));
  it.each(set.cases)('$id: geometric facts, 16 observation holds and every bottom agree', c => {
    const state = makeState(c.algs[0]), expected = observation(state), facts = recognitionFacts2(state);
    expect(facts.orientation).toBe(expected.orientation); expect(facts.bars).toEqual(expected.bars); expect(facts.topBars).toEqual(expected.topBars);
    expect(facts.bars).toHaveLength(c.set === 'cll' ? 4 : c.set === 'eg1' ? 1 : 0);
    const cues = recognitionCues2(c);
    expect([1, 2]).toContain(cues.length);
    for (const cue of cues) {
      expect(STICKERS2[cue.a].p[1]).toBe(1); expect(STICKERS2[cue.b].p[1]).toBe(1);
      expect(STICKERS2[state[cue.a]].face).not.toBe('U'); expect(STICKERS2[state[cue.b]].face).not.toBe('U');
      expect(relation(state, cue.a, cue.b)).toBe(cue.relation);
      expect(['same', 'opposite']).toContain(cue.relation);
    }
    // Exact emptiness: the displayed observations cannot fit any other case in any U/y hold.
    const ambiguous = variants.filter(other => other.id !== c.id && other.orientation === expected.orientation &&
      other.bars.join() === expected.bars.join() && cues.every(cue => relation(other.state, cue.a, cue.b) === cue.relation));
    expect(ambiguous.map(o => o.id)).toEqual([]);
    for (const bottom of BOTTOM_COLORS) {
      const palette = bottomPalette(bottom), text = recognitionText2(c, palette);
      expect(text.bottom).toContain(`${COLOR_NAME_ZH[bottom]}色底`);
      expect(text.orientation).toContain(COLOR_NAME_ZH[FACE_COLOR[palette.U]]);
      expect(text.cues).toHaveLength(cues.length);
      const oriented = STICKERS2.filter(s => s.face === 'U').every(s => STICKERS2[state[s.id]].face === 'U');
      if (oriented) {
        expect(expected.topBars).toHaveLength(c.id.includes('-adj-') ? 1 : 0);
        const similar = variants.filter(other => other.id !== c.id && other.orientation === expected.orientation &&
          other.bars.join() === expected.bars.join() && other.topBars.length === expected.topBars.length);
        expect(similar.map(o => o.id)).toEqual([]);
        const bar = expected.topBars[0];
        if (bar) {
          const location = STICKERS2.find(s => s.face === bar && s.p[1] === 1)!;
          const color = COLOR_NAME_ZH[FACE_COLOR[palette[STICKERS2[state[location.id]].face]]];
          expect(text.cues).toEqual([`顶层唯一同色边在${({ F: '前', B: '后', R: '右', L: '左' })[bar as 'F' | 'B' | 'R' | 'L']}侧（${color}色）。`]);
        } else expect(text.cues).toEqual(['顶层四个侧面都没有同色边。']);
      } else for (const [index, cue] of cues.entries()) {
        const a = COLOR_NAME_ZH[FACE_COLOR[palette[STICKERS2[state[cue.a]].face]]];
        const b = COLOR_NAME_ZH[FACE_COLOR[palette[STICKERS2[state[cue.b]].face]]];
        expect(text.cues[index]).toContain(cue.relation === 'same' ? `同色（${a}色）` : `对色（${a} / ${b}）`);
      }
      const html = renderToStaticMarkup(<Recognition2 c={c} palette={palette} />);
      for (const value of [text.bottom, text.orientation, ...text.cues, text.guide]) expect(html).toContain(value);
      expect(html.match(/<li>/g)).toHaveLength(cues.length);
      expect(html).toContain('aria-label="二阶识别提示"');
    }
  });
  it('coverage remains 42 with four single-cue and 38 two-cue cases, unique rendered hints', () => {
    expect(set.cases).toHaveLength(42);
    expect(set.cases.filter(c => recognitionCues2(c).length === 1)).toHaveLength(4);
    expect(set.cases.filter(c => recognitionCues2(c).length === 2)).toHaveLength(38);
    for (const bottom of BOTTOM_COLORS) expect(new Set(set.cases.map(c => JSON.stringify(recognitionText2(c, bottomPalette(bottom))))).size).toBe(42);
  });
});
it('independent named examples cover the actual EG-1 bar orientation, top direction and swap cases', () => {
  const p = bottomPalette('white');
  const as = recognitionText2(getCase('cll-as-1')!, p);
  expect(as.orientation).toBe('顶面黄角在右前；侧面黄贴纸：左前朝前、左后朝左、右后朝后。');
  expect(as.cues).toEqual(['顶面右后角与顶面左前角：对色（红 / 橙）。', '顶面左后角与右后角右侧：同色（绿色）。']);
  expect(recognitionText2(getCase('eg1-as-1')!, p).bottom).toBe('白色底面已完成；底层唯一同色边在左侧（红色），先对齐这条边。');
  expect(recognitionText2(getCase('eg1-h-1')!, p).bottom).toBe('白色底面已完成；底层唯一同色边在后侧（蓝色），先对齐这条边。');
  for (const id of ['cll-adj-1', 'cll-diag-1', 'eg1-adj-1', 'eg1-diag-1', 'eg2-adj-1', 'eg2-diag-1']) {
    const text = recognitionText2(getCase(id)!, p);
    expect(text.orientation).toBe('顶面四角均为黄色。'); expect(text.cues).toHaveLength(1);
  }
  expect(recognitionText2(getCase('eg2-h-1')!, bottomPalette('green')).bottom).toBe('绿色底面已完成；底层四个侧面都没有同色边。');
  expect(() => recognitionText2(getCase('oll-1')!, p)).toThrow('只接受二阶');
});
