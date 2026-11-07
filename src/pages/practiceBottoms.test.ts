import { expect, it } from 'vitest';
import practiceSource from './PracticePage.tsx?raw';
import meSource from './MePage.tsx?raw';
import { COLOR_LABEL, COLOR_VAR } from '../lib/colorNames';
import { BOTTOM_COLORS } from '../store/devicePrefs';

it('T52 renders six shared-color multiselect swatches and the requested explanation', () => {
  expect(practiceSource).toContain('<h2>练习底色</h2>');
  expect(practiceSource).toMatch(/className="swatches" role="group" aria-label="练习底色"/);
  expect(practiceSource).toMatch(/BOTTOM_COLORS\.map\(\(color\)/);
  expect(practiceSource).toContain('aria-pressed={bottoms.includes(color)}');
  expect(practiceSource).toContain('onClick={() => toggleBottom(color)}');
  expect(practiceSource).toContain('可多选；每题随机一个；只换观察配色，setup 和打乱逻辑不变。');
});
it('T52 actual toggle implementation supports adding/removing but always retains one', () => {
  const body = practiceSource.match(/const toggleBottom = \(color: BottomColor\) => setBottoms\(\(current\) => \{([\s\S]*?)\n  \}\);/)?.[1];
  expect(body).toBeDefined();
  const toggle = new Function('color', 'current', body!) as (color: string, current: string[]) => string[];
  const original = ['white'];
  expect(toggle('white', original)).toBe(original);
  const added = toggle('green', original);
  expect(added).toEqual(['white', 'green']);
  expect(original).toEqual(['white']);
  expect(toggle('white', added)).toEqual(['green']);
  expect(toggle('green', ['green'])).toEqual(['green']);
});
it('T52 old scope defaults to device color and an existing scope is copied', () => {
  const expression = practiceSource.match(/const \[bottoms, setBottoms\] = useState<BottomColor\[\]>\(\(\) => ([^\n]+)\);/)?.[1];
  expect(expression).toBeDefined();
  const initialize = new Function('saved', 'prefs', `return (${expression});`);
  expect(initialize({}, { bottomColor: 'blue' })).toEqual(['blue']);
  expect(initialize({ bottoms: [] }, { bottomColor: 'red' })).toEqual(['red']);
  const saved = { bottoms: ['white', 'green'] };
  expect(initialize(saved, { bottomColor: 'blue' })).toEqual(saved.bottoms);
  expect(initialize(saved, { bottomColor: 'blue' })).not.toBe(saved.bottoms);
});
it('T52 scope including bottoms is kept in uiState without writing device preferences or storage', () => {
  expect(practiceSource).toMatch(/bottoms: BottomColor\[\]/);
  expect(practiceSource).toContain("setUi<PracticeScope>('practice:scope', { sets, group, filter, picked, showPicker, bottoms })");
  expect(practiceSource).toContain('[sets, group, filter, picked, showPicker, bottoms]');
  expect(practiceSource).not.toMatch(/\b(?:localStorage|setDevicePrefs)\b/);
});
it('T52 session snapshots the colors and seeds lastBottom only from restored prepared data', () => {
  expect(practiceSource).toContain('bottoms={bottoms}');
  expect(practiceSource).toContain('bottoms: initialBottoms');
  expect(practiceSource).toContain('const [bottoms] = useState(() => [...initialBottoms])');
  expect(practiceSource).toContain('useRef<BottomColor | null>(restore?.question.prepared?.bottom ?? null)');
});
it('T52 each next request selects its color before keeping the existing generation chain', () => {
  expect(practiceSource).toContain('const bottom = pickBottom(bottoms, lastBottom.current)');
  expect(practiceSource).toContain('lastBottom.current = bottom');
  expect(practiceSource).toContain('setQuestion({ c: view, alg, scramble, bottom })');
  expect(practiceSource).toContain('const bottom = requested.bottom ?? prefs.bottomColor');
  expect(practiceSource).toContain('const { view, scramble } = practiceViewFor(c, alg)');
  expect(practiceSource).toContain('const sample = sampleTarget(requested.c, requested.scramble)');
  expect(practiceSource).toContain('prepareSetup(sample.state, bottom, controller.signal)');
});
it('T52 diagrams and fallback setup text share the question color and legacy warning stays', () => {
  expect(practiceSource).toContain('const bottom = prepared?.bottom ?? question.bottom ?? prefs.bottomColor');
  expect(practiceSource).toMatch(/<CaseDiagram c=\{c\} view=\{set.view\} bottom=\{bottom\} state=\{prepared.state\}/);
  expect(practiceSource).toMatch(/<CaseDiagram c=\{c\} view=\{set.view\} bottom=\{bottom\} \/>/);
  expect(practiceSource).toContain('setupText(bottom)');
  expect(practiceSource).toContain('practiceInstructions(prepared)');
  expect(practiceSource).not.toContain('bottom={prefs.bottomColor}');
  expect(practiceSource).toContain('旧版会话：原底色未知');
});
it('T52 MePage and PracticePage reuse one complete label/color-variable definition', () => {
  for (const source of [practiceSource, meSource]) {
    expect(source).toContain("import { COLOR_LABEL, COLOR_VAR } from '../lib/colorNames'");
    expect(source).not.toMatch(/const COLOR_(?:LABEL|VAR)\s*:/);
  }
  for (const color of BOTTOM_COLORS) {
    expect(COLOR_LABEL[color]).toHaveLength(1);
    expect(COLOR_VAR[color]).toMatch(/^var\(--cube-[udfblr]\)$/);
  }
});
