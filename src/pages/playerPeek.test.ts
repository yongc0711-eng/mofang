import { describe, expect, it } from 'vitest';
import casePageSource from './CasePage.tsx?raw';
import playerSource from '../components/CubePlayer.tsx?raw';

// vitest 里 styles.css?raw 是空串，和 caseInput.test.ts 一样用 node:fs，本地声明这一个 API
const fsModule: string = 'node:fs';
const { readFileSync } = (await import(/* @vite-ignore */ fsModule)) as {
  readFileSync(path: URL, encoding: 'utf8'): string;
};
const css = readFileSync(new URL('../styles.css', import.meta.url), 'utf8');

/** 取出以 `start` 开头的 @media 块（按大括号配平） */
function block(start: string, from = 0): string {
  const i = css.indexOf(start, from);
  expect(i, start).toBeGreaterThanOrEqual(0);
  let depth = 0;
  for (let j = css.indexOf('{', i); j < css.length; j++) {
    if (css[j] === '{') depth++;
    if (css[j] === '}' && --depth === 0) return css.slice(i, j + 1);
  }
  throw new Error('unbalanced');
}
const mobile = block('@media (max-width: 799px) {');
const desktop = block('@media (min-width: 800px) {');
const px = (s: string, name: string) => Number(s.match(new RegExp(`${name}:\\s*(\\d+)px`))?.[1]);

describe('T48 详情页首屏：提示条与浮层按钮（CasePage）', () => {
  const player = casePageSource.slice(casePageSource.indexOf('<div className="case-player">'), casePageSource.indexOf('<div className="case-side"'));
  it('提示条在 .case-player 里、播放器之后、.case-side 之前，点击滚到 .case-side', () => {
    expect(player).toContain('className="peek-cue"');
    expect(player.indexOf('<CubePlayer')).toBeLessThan(player.indexOf('peek-cue'));
    expect(casePageSource).toMatch(/<div className="case-side" ref=\{sideRef\}>/);
    expect(player).toMatch(/sideRef\.current\?\.scrollIntoView\(\{ block: 'start', behavior: reduceMotion \? 'auto' : 'smooth' \}\)/);
    expect(player).toContain('prefers-reduced-motion: reduce');
    expect(player).toContain("{c.recognition ? '识别与公式' : '公式'}");
  });
  it('“只看相关的块”仍在 .case-player 里、播放器之外（不在 3D 拖拽区里），逻辑不变', () => {
    expect(player).toContain('setDevicePrefs({ focusRelevant: !prefs.focusRelevant })');
    expect(playerSource).not.toContain('focus-chip');
    expect(playerSource).not.toContain('peek-cue');
    expect(casePageSource.match(/只看相关的块\s*</g)).toHaveLength(1);
  });
  it('速度按钮仍在 CubePlayer 里（只用 CSS 浮到画面角落），播放逻辑没改：标记里还是原来的 5 个控制按钮和 4 档速度', () => {
    expect(playerSource).toContain('const SPEEDS = [0.5, 1, 1.5, 2];');
    expect(playerSource).toContain('aria-label="播放速度"');
    expect(playerSource.match(/className="ctl/g)).toHaveLength(5);
  });
});

describe('T48 样式：只在手机宽度生效', () => {
  it('画面高度按视口预算算：clamp(下限, 100dvh − …, 上限)，有 vh 回退，下限 ≥ 180、上限 340', () => {
    expect(mobile).toMatch(/height: clamp\(180px, calc\(100vh - /);
    expect(mobile).toMatch(/height: clamp\(180px, calc\(100dvh - /);
    // vh 回退在 dvh 之前，不支持 dvh 的浏览器用前一条
    expect(mobile.indexOf('clamp(180px, calc(100vh')).toBeLessThan(mobile.indexOf('clamp(180px, calc(100dvh'));
    expect(mobile).toMatch(/340px\)/);
  });
  it('预算常量算出来的画面高度：390×844 在 [180, 340] 内，并给下面的内容留出 ≥ 100px', () => {
    const above = px(mobile, '--player-above');
    const chrome = px(mobile, '--player-chrome');
    const cue = px(mobile, '--peek-cue');
    const peek = px(mobile, '--peek');
    expect(peek).toBeGreaterThanOrEqual(100);
    const navH = 60;
    const gap = 12;
    const stage = (vh: number) => Math.min(340, Math.max(180, vh - above - chrome - cue - peek - navH - gap));
    expect(stage(844)).toBe(190);
    expect(stage(896)).toBeGreaterThan(stage(844)); // 屏越高画面越大
    expect(stage(300)).toBe(180); // 有下限，不会缩到看不清
    expect(stage(5000)).toBe(340); // 有上限，不超过原来的高度
  });
  it('矮屏（max-height: 700px）有单独的收紧：画面、控件尺寸仍 ≥ 32px 触控目标', () => {
    const short = block('@media (max-height: 700px) {', css.indexOf(mobile));
    expect(px(short, '.player-stage \\{ height')).toBeGreaterThanOrEqual(160);
    expect(short.match(/\.ctl \{ width: (\d+)px; height: (\d+)px/)!.slice(1).map(Number).every((n) => n >= 32)).toBe(true);
    expect(short.match(/\.ctl-main \{ width: (\d+)px; height: (\d+)px/)!.slice(1).map(Number).every((n) => n >= 32)).toBe(true);
  });
  it('浮在画面角落的按钮在拖拽区之外，触控目标 ≥ 32px，位置在手机块里', () => {
    expect(mobile).toMatch(/\.focus-chip \{ position: absolute;[^}]*top: 8px; left: 8px;/);
    expect(mobile).toMatch(/\.speed \{ position: absolute;[^}]*top: 8px; right: 8px;/);
    expect(Number(mobile.match(/\.speed button \{ min-width: (\d+)px/)?.[1])).toBeGreaterThanOrEqual(32);
    expect(css).toMatch(/\.speed button \{\s*min-width: 44px; min-height: 32px;/); // 原来的 32px 高度仍在
    expect(Number(mobile.match(/\.peek-cue \{[^}]*min-height: (\d+)px/)?.[1])).toBeGreaterThanOrEqual(32);
  });
  it('提示条默认隐藏，只在手机块里显示；颜色全是变量；不写死宽度', () => {
    expect(css).toMatch(/^\.peek-cue \{ display: none; \}/m);
    expect(desktop).not.toContain('.peek-cue');
    const rule = mobile.match(/\.peek-cue \{\s*display: flex;[^}]*\}/)![0];
    expect(rule).toContain('var(--accent)');
    expect(rule).toContain('var(--accent-soft)');
    expect(rule).not.toMatch(/#[0-9a-fA-F]{3,8}\b|rgb\(/);
    expect(rule).not.toMatch(/[^-]width: \d+px/);
  });
  it('宽屏不变：两栏、sticky、画面 360px，手机块里的规则不在 ≥800 的块里', () => {
    expect(desktop).toMatch(/\.player \{ position: sticky; top: calc\(var\(--nav-h\) \+ 16px\); \}/);
    expect(desktop).toMatch(/\.player-stage \{ height: 360px; \}/);
    expect(desktop).toContain('.case-layout { display: grid; grid-template-columns: minmax(0, 1fr) minmax(0, 1fr);');
    expect(desktop).not.toMatch(/focus-chip|\.speed|clamp\(/);
  });
  it('3D 画面本身的规则没动：touch-action: none、光标', () => {
    expect(css).toMatch(/\.player-stage \{\s*height: min\(46vh, 340px\); display: flex; align-items: center; justify-content: center;\s*cursor: grab; touch-action: none;/);
  });
});
