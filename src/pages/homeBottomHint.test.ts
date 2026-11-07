import { describe, expect, it } from 'vitest';
import homeSource from './HomePage.tsx?raw';

// vitest 里 styles.css?raw 是空串，和 caseInput.test.ts 一样用 node:fs，本地声明这一个 API
const fsModule: string = 'node:fs';
const { readFileSync } = (await import(/* @vite-ignore */ fsModule)) as {
  readFileSync(path: URL, encoding: 'utf8'): string;
};
const css = readFileSync(new URL('../styles.css', import.meta.url), 'utf8');
const rule = (sel: string) => css.match(new RegExp(`^${sel.replace(/[.]/g, '\\.')} \\{([^}]*)\\}`, 'm'))?.[1] ?? '';

describe('T50 首页的“底色可切换”提示', () => {
  it('文案存在：想换魔方底色？到「我的」里切换', () => {
    expect(homeSource).toContain('想换魔方底色？到「我的」里切换');
  });

  it('是一个 <Link>，指向 /me，不是不可点的灰字', () => {
    expect(homeSource).toMatch(/<Link to="\/me" className="home-hint-link">\s*想换魔方底色？到「我的」里切换/);
    expect(homeSource.match(/to="\/me"/g)).toHaveLength(1);
  });

  it('位置：在标题和公式计数之后、方法/课程卡之前，且在 header 里', () => {
    const title = homeSource.indexOf('魔方公式</h1>');
    const count = homeSource.indexOf('已掌握 {mastered} 条');
    const hint = homeSource.indexOf('home-hint-link');
    const headEnd = homeSource.indexOf('</header>');
    const cards = homeSource.indexOf('METHODS.map');
    expect(title).toBeGreaterThan(0);
    expect(title).toBeLessThan(count);
    expect(count).toBeLessThan(hint);
    expect(hint).toBeLessThan(headEnd);
    expect(headEnd).toBeLessThan(cards);
  });

  it('只是提示：首页没有切换控件，也没碰底色逻辑', () => {
    expect(homeSource).not.toMatch(/setDevicePrefs|swatch|BOTTOM_COLORS|bottomColor: /);
    expect(homeSource).toContain('bottom={prefs.bottomColor}'); // T30：卡片和封面仍跟随底色
    expect(homeSource).toContain('viewForPrimary(cover, primaryAlgOf(cover, user))'); // T33
  });

  it('触控目标 ≥ 32px，颜色用变量，不写死宽度（320 宽不横向撑开）', () => {
    const link = rule('.home-hint-link');
    expect(link).not.toBe('');
    expect(Number(link.match(/min-height:\s*(\d+)px/)?.[1])).toBeGreaterThanOrEqual(32);
    expect(link).toContain('display: inline-flex');
    expect(link).toContain('color: var(--accent)');
    expect(link).toContain('max-width: 100%');
    expect(link).toContain('overflow-wrap: anywhere');
    expect(link).not.toMatch(/#[0-9a-fA-F]{3,8}\b|rgb\(/);
    expect(link).not.toMatch(/(^|[;\s])(min-)?width:\s*\d+px/);
    expect(css.match(/--accent:/g)!.length).toBeGreaterThanOrEqual(2); // 浅色 + 深色都有定义
  });
});
