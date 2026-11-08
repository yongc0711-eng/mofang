import { createElement } from 'react';
import { renderToStaticMarkup } from 'react-dom/server';
import { expect, it, vi } from 'vitest';
import { PracticeQuestionDiagram } from './PracticePage';
import { CaseDiagram } from '../components/CaseDiagram';
import { getCase, getSet } from '../data';
import { caseState, viewCaseFor } from '../lib/cases';
import { applyMoves } from '../lib/cube';
import { parseAlg } from '../lib/alg';
import source from './PracticePage.tsx?raw';

const capture = vi.hoisted(() => ({ state: undefined as unknown, hasState: false }));
vi.mock('../components/CaseDiagram', async (original) => {
  const actual = await original<typeof import('../components/CaseDiagram')>();
  return { ...actual, CaseDiagram: (props: Parameters<typeof actual.CaseDiagram>[0]) => {
    capture.state = props.state;
    capture.hasState = Object.prototype.hasOwnProperty.call(props, 'state');
    return createElement(actual.CaseDiagram, props);
  } };
});
for (const id of ['oll-27', 'pll-t']) {
  const base = getCase(id)!;
  const c = viewCaseFor(base, 'U ' + base.algs[0]);
  const set = getSet(c.set)!;
  const props = { c, view: set.view, bottom: 'white' as const };
  const canonical = () => renderToStaticMarkup(createElement(CaseDiagram, props));
  const state = applyMoves(caseState(c), parseAlg('U'));
  const render = (phase: string, prepared: { state: typeof state } | null | undefined) => renderToStaticMarkup(createElement(PracticeQuestionDiagram, { c, set, bottom: 'white', prepared, phase }));
  it(`${id}: done omits state and matches the primary-view canonical SVG including side strips`, () => {
    const expected = canonical();
    expect(state).not.toEqual(caseState(c));
    expect(render('done', { state })).toBe(expected);
    expect(capture.hasState).toBe(false);
  });
  it.each(['ready', 'running', 'paused'])(`${id}: %s retains the exact sampled state`, phase => {
    const expected = renderToStaticMarkup(createElement(CaseDiagram, { ...props, state }));
    expect(render(phase, { state })).toBe(expected);
    expect(capture.hasState).toBe(true);
    expect(capture.state).toBe(state);
  });
  it.each([null, undefined])(`${id}: done without prepared (%s) safely renders canonical`, prepared => {
    const expected = canonical();
    expect(render('done', prepared)).toBe(expected);
    expect(capture.hasState).toBe(false);
  });
}
it('Session passes its existing c, phase, bottom and prepared directly to the diagram boundary', () => {
  expect(source).toContain('<PracticeQuestionDiagram c={c} set={set} bottom={bottom} prepared={prepared} phase={phase} />');
});
