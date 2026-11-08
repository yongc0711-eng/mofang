import practicePanelSource from '../components/PracticeColorsDialog.tsx?raw';
import { expect, it } from 'vitest';
import practiceSource from './PracticePage.tsx?raw';
import formulaSource from '../components/FormulaColors.tsx?raw';
import { COLOR_LABEL, COLOR_VAR } from '../lib/colorNames';
import { BOTTOM_COLORS } from '../store/devicePrefs';
import { initializeColorPools, togglePoolBottom } from '../lib/practiceColors';
const prefs = { cfop: { bottomColor: 'blue' as const }, roux: { bottomColor: 'red' as const, bridgePair: 'white-yellow' as const, leftColor: 'white' as const } };

it('T60b renders both method six-color multiselects and explicit complete-color explanation', () => {
  expect(practicePanelSource).toContain("{method === 'cfop' ? 'CFOP 练习底色' : 'Roux 练习底色'}");
  expect(practicePanelSource).toContain('className="practice-color-grid" role="group" aria-label={`${method} 练习底色`}');
  expect(practicePanelSource).toContain('BOTTOM_COLORS.map(color =>');
  expect(practicePanelSource).toContain("aria-pressed={(method === 'cfop' ? cfopBottoms : rouxBottoms).includes(color)}");
  expect(practicePanelSource).toContain('togglePoolBottom(current, method, color)');
  expect(practiceSource.match(/<PracticeColorsDialog colorPools=\{colorPools\} onChange=\{setColorPools\} \/>/g)).toHaveLength(1);
  expect(practiceSource).not.toContain('className="practice-color-grid"');
  expect(practicePanelSource).toContain('每题按所属方法随机一个已选完整配色');
  expect(practicePanelSource).toContain('validPairs(bottom).map(pair =>');
  expect(practicePanelSource).toContain('aria-pressed={rouxPairsByBottom[bottom]!.includes(pair)}');
});
it('T60b actual toggle implementation adds/removes each method independently and always retains one', () => {
  const original = initializeColorPools({}, prefs);
  expect(togglePoolBottom(original, 'cfop', 'blue')).toEqual(original);
  const added = togglePoolBottom(original, 'cfop', 'green');
  expect(added.cfopBottoms).toEqual(['blue', 'green']);
  expect(original.cfopBottoms).toEqual(['blue']);
  expect(togglePoolBottom(added, 'cfop', 'blue').cfopBottoms).toEqual(['green']);
  expect(togglePoolBottom(original, 'roux', 'red')).toEqual(original);
  expect(added.rouxBottoms).toEqual(['red']);
});
it('T60b old scope migrates bottoms to both methods and an existing two-pool scope is copied', () => {
  expect(initializeColorPools({},prefs)).toEqual({cfopBottoms:['blue'],rouxBottoms:['red'],rouxPairsByBottom:{red:['white-yellow']}});
  expect(initializeColorPools({bottoms:[]},prefs)).toEqual(initializeColorPools({},prefs));
  const saved = { bottoms: ['white','green'] as ('white'|'green')[] };
  const migrated=initializeColorPools(saved,prefs);
  expect(migrated).toEqual({cfopBottoms:['white','green'],rouxBottoms:['white','green'],rouxPairsByBottom:{white:['red-orange'],green:['red-orange']}});
  expect(migrated.cfopBottoms).not.toBe(saved.bottoms);
  expect(migrated.cfopBottoms).not.toBe(migrated.rouxBottoms);
  expect(initializeColorPools(migrated,prefs)).toEqual(migrated);
});
it('T60b both pools and per-bottom bridge pairs live in uiState without device preferences or storage writes', () => {
  expect(practiceSource).toContain('interface PracticeScope extends PracticeColorPools');
  expect(practiceSource).toContain("setUi<PracticeScope>('practice:scope', { sets, group, filter, picked, showPicker, cfopBottoms, rouxBottoms, rouxPairsByBottom })");
  expect(practiceSource).toContain('[sets, group, filter, picked, showPicker, cfopBottoms, rouxBottoms, rouxPairsByBottom]');
  expect(practiceSource).not.toMatch(/\b(?:localStorage|setDevicePrefs)\b/);
});
it('T60b session snapshots the pools and seeds lastColors only from restored v2 prepared data', () => {
  expect(practiceSource).toContain('colorPools={colorPools}');
  expect(practiceSource).toContain('colorPools: initialColorPools');
  expect(practiceSource).toContain('const [colorPools] = useState(() => snapshotPools(initialColorPools))');
  expect(practiceSource).toContain('useRef<PracticeColors | null>(restore?.question.prepared?.version === 2 ? restore.question.prepared.colors : null)');
});
it('T60b each next request selects complete colors after case selection and keeps the generation chain', () => {
  expect(practiceSource).toContain('const colors = pickPracticeColors(c, colorPools, lastColors.current)');
  expect(practiceSource).toContain('lastColors.current = colors');
  expect(practiceSource).toContain('setQuestion({ c: view, alg, scramble, colors })');
  expect(practiceSource).toContain('const colors = requested.colors');
  expect(practiceSource).toContain('const { view, scramble } = practiceViewFor(c, alg)');
  expect(practiceSource).toContain('const sample = sampleTarget(requested.c, requested.scramble)');
  expect(practiceSource).toContain('prepareSetup(sample.state, colors, controller.signal)');
  expect(practiceSource.indexOf('const c = pickCase(pool, userRef.current, lastId.current)')).toBeLessThan(practiceSource.indexOf('const colors = pickPracticeColors(c, colorPools, lastColors.current)'));
});
it('T60b diagrams use the frozen complete palette while v1/fallback bottom and warning stay', () => {
  expect(practiceSource).toContain('const colors = prepared?.version === 2 ? prepared.colors : question.colors');
  expect(practiceSource).toContain('const palette = colors ? paletteFor(colors) : undefined');
  expect(practiceSource).toContain('const bottom = prepared?.version === 1 ? prepared.bottom : colors ? colorBottom(colors) : question.bottom ?? prefs.bottomColor');
  expect(practiceSource).toContain('<CaseDiagram c={c} view={set.view} bottom={bottom} state={prepared.state} palette={palette} />');
  expect(practiceSource).toContain('<CaseDiagram c={c} view={set.view} bottom={bottom} palette={palette} />');
  expect(practiceSource).toContain('setupText(bottom)');
  expect(practiceSource).toContain('practiceInstructions(prepared)');
  expect(practiceSource).not.toContain('bottom={prefs.bottomColor}');
  expect(practiceSource).toContain('旧版会话：原底色未知');
});
it('T52 FormulaColors and PracticePage reuse one complete label/color-variable definition', () => {
  for (const source of [practicePanelSource, formulaSource]) {
    expect(source).toContain("import { COLOR_LABEL, COLOR_VAR } from '../lib/colorNames'");
    expect(source).not.toMatch(/const COLOR_(?:LABEL|VAR)\s*:/);
  }
  for (const color of BOTTOM_COLORS) {
    expect(COLOR_LABEL[color]).toHaveLength(1);
    expect(COLOR_VAR[color]).toMatch(/^var\(--cube-[udfblr]\)$/);
  }
});
