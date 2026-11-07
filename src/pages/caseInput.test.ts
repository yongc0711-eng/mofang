import { expect, it } from 'vitest';
import casePageSource from './CasePage.tsx?raw';

it('T42 follow-up: the custom formula input only opens the in-app keyboard', () => {
  expect(casePageSource).toMatch(/inputMode="none"/);
  expect(casePageSource).toMatch(/onFocus=\{\(\) => setKeyboardOpen\(true\)\}/);
});