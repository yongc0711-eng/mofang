import { expect, it, vi } from 'vitest';
import { renderToStaticMarkup } from 'react-dom/server';
import { MemoryRouter } from 'react-router-dom';
import { BOTTOM_COLORS, bottomPalette, browsePalette, cleanBrowse } from './colorScheme';
import { colorCandidates, initializeColorPools, pickPracticeColors, snapshotPools, togglePoolBottom } from './practiceColors';
import { colorTabIndex } from './colorDialog';
import { ALL_CASES, getCase, getSet } from '../data';
import { diagramColors2, is2x2Set } from './cases2';
import { CaseDiagram2 } from '../components/CaseDiagram2';
import { PracticeQuestionDiagram, PracticePage } from '../pages/PracticePage';
import { setUi } from './uiState';
import { ColorDialog } from '../components/ColorDialog';
import { PracticeColorPanel } from '../components/PracticeColorsDialog';
import { applyMoves2 } from './cube2';
import { parseAlg } from './alg';
import { caseState2 } from './cases2';

vi.mock('../store/userStore', async original => ({ ...await original<typeof import('../store/userStore')>(), useUserData: () => ({ version: 1, cases: {} }) }));
vi.mock('../store/devicePrefs', async original => ({ ...await original<typeof import('../store/devicePrefs')>(), useDevicePrefs: () => ({ bottomColor: 'white', ...cleanBrowse({}, 'white') }) }));
it('missing/invalid 2×2 prefs initialize white independently of legacy and both three-dimensional methods', () => {
  const prefs = cleanBrowse({ cfop: { bottomColor: 'green' }, twoByTwo: { bottomColor: 'invalid' } }, 'red');
  expect(prefs.twoByTwo).toEqual({ bottomColor: 'white' });
  expect(prefs.cfop).toEqual({ bottomColor: 'green' });
  expect(prefs.roux.bottomColor).toBe('red');
  for (const bottomColor of BOTTOM_COLORS) {
    const clean = cleanBrowse({ ...prefs, twoByTwo: { bottomColor } }, 'blue');
    expect(clean.twoByTwo).toEqual({ bottomColor });
    for (const set of ['cll', 'eg1', 'eg2']) expect(browsePalette({ set }, { ...clean, bottomColor: 'yellow' })).toEqual(bottomPalette(bottomColor));
    expect(browsePalette({ set: 'oll' }, { ...clean, bottomColor: 'yellow' })).toEqual(bottomPalette('green'));
  }
});
it('independent two-dimensional practice pool migrates, snapshots, samples uniformly and retains one bottom', () => {
  const prefs = cleanBrowse({ twoByTwo: { bottomColor: 'red' } }, 'green');
  const pools = initializeColorPools({ bottoms: ['blue'] }, prefs);
  expect(pools.twoByTwoBottoms).toEqual(['red']);
  const added = togglePoolBottom(pools, '2x2', 'orange');
  expect(added.twoByTwoBottoms).toEqual(['red', 'orange']);
  expect(added.cfopBottoms).toEqual(['blue']);
  expect(added.rouxBottoms).toEqual(['blue']);
  const only = togglePoolBottom(added, '2x2', 'red');
  expect(togglePoolBottom(only, '2x2', 'orange')).toEqual(only);
  for (const set of ['cll', 'eg1', 'eg2']) {
    expect(pickPracticeColors({ set }, added, null, () => 0)).toEqual({ method: '2x2', bottom: 'red' });
    expect(pickPracticeColors({ set }, added, null, () => .99)).toEqual({ method: '2x2', bottom: 'orange' });
    expect(pickPracticeColors({ set }, added, { method: '2x2', bottom: 'red' }, () => 0)).toEqual({ method: '2x2', bottom: 'orange' });
  }
  const copy = snapshotPools(added);
  added.twoByTwoBottoms!.push('yellow');
  expect(copy.twoByTwoBottoms).toEqual(['red', 'orange']);
  expect(colorCandidates('2x2', { ...copy, twoByTwoBottoms: [...BOTTOM_COLORS] })).toEqual(BOTTOM_COLORS.map(bottom => ({ method: '2x2', bottom })));
  expect(initializeColorPools({ twoByTwoBottoms: ['red', 'red'] }, prefs).twoByTwoBottoms).toEqual(['red']);
  expect(() => colorCandidates('2x2', { ...copy, twoByTwoBottoms: [] })).toThrow('至少选择');
});
it('default three-dimensional practice remains 437 and the two-dimensional scope is exactly 126', () => {
  for (const [size, count, names, excluded] of [[3, 437, ['OLL', 'PLL', 'CMLL'], ['CLL', 'EG-1', 'EG-2']], [2, 126, ['CLL', 'EG-1', 'EG-2'], ['OLL', 'PLL', 'CMLL']]] as const) {
    setUi('practice:scope', { size, sets: [], group: '全部', filter: 'all', picked: [], showPicker: false });
    const html = renderToStaticMarkup(<MemoryRouter><PracticePage /></MemoryRouter>);
    expect(html).toContain(`范围内共 ${count} 个情形`);
    for (const name of names) expect(html).toContain(`>${name}<`);
    for (const name of excluded) expect(html).not.toContain(`>${name}<`);
  }
  expect(ALL_CASES.filter(c => is2x2Set(c.set))).toHaveLength(126);
  setUi('practice:scope', { sets: [], group: '全部', filter: 'all', picked: [], showPicker: false });
});
it.each(['cll-as-1', 'eg1-h-1', 'eg2-h-1'])('%s uses actual 24-sticker target while training, canonical primary on done, same frozen six-bottom palette', id => {
  const c = getCase(id)!, set = getSet(c.set)!;
  if (set.view !== 'top2' && set.view !== 'both2') throw new Error('expected two-dimensional view');
  for (const bottom of BOTTOM_COLORS) {
    const palette = bottomPalette(bottom), state = applyMoves2(caseState2(c), parseAlg('U'));
    const canonical = renderToStaticMarkup(<CaseDiagram2 colors={diagramColors2(c, palette)} view={set.view} />);
    const props = { c, set, bottom, palette, prepared: { state } };
    expect(renderToStaticMarkup(<PracticeQuestionDiagram {...props} phase="done" />)).toBe(canonical);
    for (const phase of ['ready', 'running', 'paused']) expect(renderToStaticMarkup(<PracticeQuestionDiagram {...props} phase={phase} />)).not.toBe(canonical);
  }
});
it('three-method tab navigation wraps with Home/End and a single two-dimensional practice tab stays selected', () => {
  expect(colorTabIndex(2, 'ArrowRight', 3)).toBe(0);
  expect(colorTabIndex(0, 'ArrowLeft', 3)).toBe(2);
  expect(colorTabIndex(1, 'End', 3)).toBe(2);
  expect(colorTabIndex(0, 'ArrowRight', 1)).toBe(0);
  const html = renderToStaticMarkup(<ColorDialog open title="练习配色" methods={['2x2']} onClose={() => {}}>{method => <PracticeColorPanel method={method} colorPools={initializeColorPools({}, cleanBrowse({}, 'white'))} onChange={() => {}} />}</ColorDialog>);
  expect(html.match(/role="tab"/g)).toHaveLength(1);
  expect(html.match(/aria-label="二阶练习底色/g)).toHaveLength(7);
  expect(html.match(/aria-pressed="true"/g)).toHaveLength(1);
  expect(html).not.toContain('桥色');
});
