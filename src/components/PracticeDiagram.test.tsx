import { createElement } from 'react';
import { renderToStaticMarkup } from 'react-dom/server';
import { expect, it } from 'vitest';
import { CaseDiagram, TopView } from './CaseDiagram';
import { getCase } from '../data';
import { caseState } from '../lib/cases';
import { applyMoves } from '../lib/cube';
import { parseAlg } from '../lib/alg';
import { displayFace } from '../store/devicePrefs';

it('T37 green-bottom PLL T diagram renders the actual U-prime terminal state', () => {
  const c = getCase('pll-t')!;
  const state = applyMoves(caseState(c), parseAlg("U'"));
  const actual = renderToStaticMarkup(createElement(CaseDiagram, { c, view: 'top', bottom: 'green', ...{ state } }));
  const expected = `<div class="diagram">${renderToStaticMarkup(createElement(TopView, { colors: state.map((id) => displayFace(id, 'green')) }))}</div>`;
  expect(actual).toBe(expected);
});

import { ALL_CASES, getSet } from '../data';
import { diagramColors } from './CaseDiagram';
import { displayMask } from '../lib/cases';
import { is2x2Set } from '../lib/cases2';
import { ollTopMask, BOTTOM_COLORS } from '../store/devicePrefs';
const THREE_BY_THREE_CASES = ALL_CASES.filter((c) => !is2x2Set(c.set));
for (const bottom of BOTTOM_COLORS) {
  it(`T37 actual state respects existing masks and palette / ${bottom}, every case`, () => {
    expect(THREE_BY_THREE_CASES).toHaveLength(437);
    for (const c of THREE_BY_THREE_CASES) {
      const state = applyMoves(caseState(c), parseAlg(['oll', 'pll', 'cmll'].includes(c.set) ? 'U' : ''));
      const mask = c.set === 'oll' ? ollTopMask : displayMask(c);
      expect(diagramColors(c, undefined, bottom, state)).toEqual(state.map((id) => mask(id) ? displayFace(id, bottom) : null));
      const set = getSet(c.set)!;
      if (set.view === 'top2' || set.view === 'both2') throw new Error(`unexpected 2x2 view: ${c.set}`);
      const props = { c, view: set.view, bottom };
      const base = renderToStaticMarkup(createElement(CaseDiagram, props));
      const explicit = renderToStaticMarkup(createElement(CaseDiagram, { ...props, state: caseState(c) }));
      expect(explicit).toBe(base);
    }
  });
}
