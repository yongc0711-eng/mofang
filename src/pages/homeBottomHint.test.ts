import { describe, expect, it } from 'vitest';
import homeSource from './HomePage.tsx?raw';

// vitest 里 styles.css?raw 是空串，和 caseInput.test.ts 一样用 node:fs，本地声明这一个 API
const fsModule: string = 'node:fs';
const { readFileSync } = (await import(/* @vite-ignore */ fsModule)) as {
  readFileSync(path: URL, encoding: 'utf8'): string;
};
const css = readFileSync(new URL('../styles.css', import.meta.url), 'utf8');

describe('T50 首页“底色可切换”提示已在 2026-11-08 按用户要求删除', () => {
  it('不再出现提示文案', () => {
    expect(homeSource).not.toContain('想换魔方底色');
    expect(homeSource).not.toContain('home-hint');
  });

  it('顶部唯一入口仍是首页共用的 FormulaColors，没有旧提示按钮或“我的”链接', () => {
    expect(homeSource.match(/<FormulaColors \/>/g)).toHaveLength(1);
    expect(homeSource).not.toContain('<FormulaColors method={m.id} />');
    expect(homeSource).not.toContain('document.getElementById');
    expect(homeSource).not.toContain('to="/me"');
  });

  it('位置：标题计数和右侧配色组成标题行，随后是搜索和方法课程卡', () => {
    expect(homeSource).toMatch(/<div className="home-title-row">\s*<div className="home-identity">[\s\S]*?<h1 className="page-title">魔方公式<\/h1>[\s\S]*?<\/div>\s*<FormulaColors \/>\s*<\/div>\s*<input/);
    const title = homeSource.indexOf('魔方公式</h1>');
    const count = homeSource.indexOf('已掌握 {mastered} 条');
    const entry = homeSource.indexOf('<FormulaColors />');
    const search = homeSource.indexOf('aria-label="搜索公式"');
    const headEnd = homeSource.indexOf('</header>');
    const cards = homeSource.indexOf('METHODS.map');
    expect(title).toBeGreaterThan(0);
    expect(title).toBeLessThan(count);
    expect(count).toBeLessThan(entry);
    expect(entry).toBeLessThan(search);
    expect(search).toBeLessThan(headEnd);
    expect(headEnd).toBeLessThan(cards);
  });

  it('首页只接共享入口，封面按所属方法配色且主公式视图不变', () => {
    expect(homeSource).not.toMatch(/setDevicePrefs|swatch|BOTTOM_COLORS|bottomColor: /);
    expect(homeSource).toContain('palette={browsePalette(cover, prefs)}');
    expect(homeSource).toContain('viewForPrimary(cover, primaryAlgOf(cover, user))');
  });

  it('旧提示的样式已删除，顶部入口仍保留 44px 触控高度', () => {
    expect(css).not.toContain('.home-hint');
    expect(css).toContain('.color-dialog-entry { min-height: 44px; }');
  });
});