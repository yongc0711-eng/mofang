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
  expect(stylesSource).toMatch(/\.alg-keyboard\s*\{\s*animation:\s*alg-keyboard-enter 200ms ease-out;/);
  const frames = stylesSource.match(/@keyframes alg-keyboard-enter\s*\{([\s\S]*?)\n\}/)?.[1];
  expect(frames).toMatch(/opacity:\s*0/);
  expect(frames).toMatch(/translateY\(14px\)/);
  expect(frames).toMatch(/opacity:\s*1/);
  expect(frames).toMatch(/translateY\(0\)/);
  expect(frames).not.toMatch(/\b(?:height|width|margin|padding|pointer-events|visibility|display)\s*:/);
  expect(stylesSource).toMatch(/@media \(prefers-reduced-motion: reduce\)\s*\{\s*\.alg-keyboard\s*\{\s*animation: none;/);
  expect(stylesSource).not.toMatch(/scroll-behavior\s*:/);
  expect(stylesSource).toContain('scroll-margin-bottom: calc(76px + env(safe-area-inset-bottom))');
});

// Run the actual open/close controller. The entry counter is the React key on the mounted wrap.
function keyboardController() {
  const body = casePageSource.match(/const setKeyboardOpen = [^\n]+ => \{([\s\S]*?)\n  \};/)?.[1];
  expect(body).toBeDefined();
  const ref = { current: false };
  let entry = 0;
  let open = false;
  const update = new Function('value', 'keyboardOpenRef', 'setKeyboardEntry', 'setKeyboardOpenState', body!);
  return {
    set(value: boolean | ((current: boolean) => boolean)) {
      update(value, ref, (next: (current: number) => number) => { entry = next(entry); }, (next: boolean) => { open = next; });
    },
    snapshot: () => ({ open, key: entry }),
  };
}
it('T46 open-close-open gives the second mount a new entry key and reruns both scroll requests', () => {
  const controller = keyboardController();
  controller.set(true);
  const first = controller.snapshot();
  expect(first).toEqual({ open: true, key: 1 });
  expect(scrollEffect(first.open, false).scrollIntoView).toHaveBeenCalledWith({ block: 'nearest', behavior: 'smooth' });
  controller.set((open) => !open);
  expect(controller.snapshot()).toEqual({ open: false, key: 1 });
  expect(scrollEffect(false, false).raf).not.toHaveBeenCalled();
  controller.set(true);
  expect(controller.snapshot()).toEqual({ open: true, key: 2 });
  expect(scrollEffect(true, false).scrollIntoView).toHaveBeenCalledWith({ block: 'nearest', behavior: 'smooth' });
  expect(casePageSource).toMatch(/\{keyboardOpen && \(\s*<div key=\{keyboardEntry\} ref=\{keyboardRef\} className="alg-keyboard-wrap">/);
});
it('T46 focusing an already open input does not change its animation key', () => {
  const controller = keyboardController();
  controller.set(true);
  for (let i = 0; i < 5; i++) controller.set(true);
  expect(controller.snapshot()).toEqual({ open: true, key: 1 });
  controller.set(false);
  controller.set(false);
  expect(controller.snapshot()).toEqual({ open: false, key: 1 });
});
it('T46 rapid toggle events use current ownership and each genuine reopen increments once', () => {
  const controller = keyboardController();
  for (let i = 0; i < 6; i++) controller.set((open) => !open);
  expect(controller.snapshot()).toEqual({ open: false, key: 3 });
  controller.set(true);
  expect(controller.snapshot()).toEqual({ open: true, key: 4 });
});
it('T46 reduced motion remains instant on the second opening without a forced scroll offset', () => {
  const controller = keyboardController();
  controller.set(true); controller.set(false); controller.set(true);
  expect(scrollEffect(controller.snapshot().open, true).scrollIntoView).toHaveBeenCalledWith({ block: 'nearest', behavior: 'auto' });
  expect(casePageSource).not.toMatch(/\b(?:scrollBy|scrollTo)\s*\(/);
  expect(stylesSource).toMatch(/animation:\s*alg-keyboard-enter 200ms ease-out/);
  expect(stylesSource).toMatch(/translateY\(14px\)/);
});
