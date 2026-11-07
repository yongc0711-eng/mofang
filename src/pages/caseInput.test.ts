import { expect, it } from 'vitest';
import casePageSource from './CasePage.tsx?raw';

it('T42 follow-up: the custom formula input only opens the in-app keyboard', () => {
  expect(casePageSource).toMatch(/inputMode="none"/);
  expect(casePageSource).toMatch(/onFocus=\{\(\) => setKeyboardOpen\(true\)\}/);
  expect(casePageSource).toMatch(/scrollIntoView/);
  expect(casePageSource).toMatch(/alg-keyboard-wrap/);
});
import { vi } from 'vitest';
// Node-only test runtime; describe the single API locally without adding project-wide Node typings.
const fsModule: string = 'node:fs';
const { readFileSync } = await import(/* @vite-ignore */ fsModule) as {
  readFileSync(path: URL, encoding: 'utf8'): string;
};
const stylesSource = readFileSync(new URL('../styles.css', import.meta.url), 'utf8');

// Execute the actual scroll-effect body with browser APIs replaced; keep T42's original assertions above.
function scrollEffect(open: boolean, reduced: boolean) {
  const body = casePageSource.match(/useEffect\(\(\) => \{([\s\S]*?)\}, \[keyboardOpen\]\)/)?.[1];
  expect(body).toBeDefined();
  const scrollIntoView = vi.fn();
  const matchMedia = vi.fn(() => ({ matches: reduced }));
  const raf = vi.fn((callback: () => void) => { callback(); return 42; });
  const cancel = vi.fn();
  const cleanup = new Function('keyboardOpen', 'window', 'keyboardRef', 'requestAnimationFrame', 'cancelAnimationFrame', body!)(
    open, { matchMedia }, { current: { scrollIntoView } }, raf, cancel,
  );
  return { scrollIntoView, matchMedia, raf, cancel, cleanup };
}

it('T44 open scrolls smoothly in the next frame without reduced motion', () => {
  const effect = scrollEffect(true, false);
  expect(effect.matchMedia).toHaveBeenCalledWith('(prefers-reduced-motion: reduce)');
  expect(effect.raf).toHaveBeenCalledOnce();
  expect(effect.scrollIntoView).toHaveBeenCalledWith({ block: 'nearest', behavior: 'smooth' });
  effect.cleanup();
  expect(effect.cancel).toHaveBeenCalledWith(42);
});
it('T44 reduced motion scrolls instantly instead of smoothly', () => {
  const effect = scrollEffect(true, true);
  expect(effect.scrollIntoView).toHaveBeenCalledWith({ block: 'nearest', behavior: 'auto' });
});
it('T44 closing does not schedule a scroll or delay unmounting', () => {
  const effect = scrollEffect(false, false);
  expect(effect.raf).not.toHaveBeenCalled();
  expect(effect.scrollIntoView).not.toHaveBeenCalled();
  expect(effect.cleanup).toBeUndefined();
  expect(casePageSource).toMatch(/\{keyboardOpen && \(/);
});
it('T44 entry animates only opacity and transform; reduced motion disables it', () => {
  expect(stylesSource).toMatch(/\.alg-keyboard\s*\{\s*animation:\s*alg-keyboard-enter 170ms ease-out;/);
  const frames = stylesSource.match(/@keyframes alg-keyboard-enter\s*\{([\s\S]*?)\n\}/)?.[1];
  expect(frames).toMatch(/opacity:\s*0/);
  expect(frames).toMatch(/translateY\(7px\)/);
  expect(frames).toMatch(/opacity:\s*1/);
  expect(frames).toMatch(/translateY\(0\)/);
  expect(frames).not.toMatch(/\b(?:height|width|margin|padding|pointer-events|visibility|display)\s*:/);
  expect(stylesSource).toMatch(/@media \(prefers-reduced-motion: reduce\)\s*\{\s*\.alg-keyboard\s*\{\s*animation: none;/);
  expect(stylesSource).not.toMatch(/scroll-behavior\s*:/);
  expect(stylesSource).toContain('scroll-margin-bottom: calc(76px + env(safe-area-inset-bottom))');
});
