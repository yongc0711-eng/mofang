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
import { ollTopMask, BOTTOM_COLORS } from '../store/devicePrefs';
for (const bottom of BOTTOM_COLORS) {
  it(`T37 actual state respects existing masks and palette / ${bottom}, every case`, () => {
    for (const c of ALL_CASES) {
      const state = applyMoves(caseState(c), parseAlg(['oll', 'pll', 'cmll'].includes(c.set) ? 'U' : ''));
      const mask = c.set === 'oll' ? ollTopMask : displayMask(c);
      expect(diagramColors(c, undefined, bottom, state)).toEqual(state.map((id) => mask(id) ? displayFace(id, bottom) : null));
      const props = { c, view: getSet(c.set)!.view, bottom };
      const base = renderToStaticMarkup(createElement(CaseDiagram, props));
      const explicit = renderToStaticMarkup(createElement(CaseDiagram, { ...props, state: caseState(c) }));
      expect(explicit).toBe(base);
    }
  });
}
