import { describe, expect, it } from 'vitest';

// vitest 里 styles.css?raw 是空串，和 caseInput.test.ts 一样用 node:fs，本地声明这一个 API
const fsModule: string = 'node:fs';
const { readFileSync } = (await import(/* @vite-ignore */ fsModule)) as {
  readFileSync(path: URL, encoding: 'utf8'): string;
};
const css = readFileSync(new URL('../styles.css', import.meta.url), 'utf8');

/** 取某个选择器所有规则的声明，包括写在媒体查询里的 */
const rules = (sel: string) => {
  const escaped = sel.replace(/[.>:+]/g, '\\$&');
  return [...css.matchAll(new RegExp(`^\\s*${escaped} \\{([^}]*)\\}`, 'gm'))].map((m) => m[1]).join(';');
};

const HOME_SELECTORS = [
  '.home-head', '.method', '.method-head', '.set-list', '.set-card', '.set-card::after',
  '.set-card:active', '.set-card:hover', '.set-body', '.set-title', '.progress', '.progress > div', '.chevron',
];

describe('UI-home 首页样式', () => {
  it('每张卡是独立 surface：有细边和圆角，没有阴影，按下有底色反馈', () => {
    const card = rules('.set-card');
    expect(card).toContain('background: var(--surface)');
    expect(card).toContain('border: 1px solid var(--border)');
    expect(card).toContain('border-radius: 12px');
    expect(card).not.toMatch(/box-shadow/);
    expect(rules('.set-card:active')).toContain('background: var(--surface-2)');
  });

  it('卡片高度固定 64px，触控目标是整行且不低于 32px', () => {
    const card = rules('.set-card');
    expect(Number(card.match(/height:\s*(\d+)px/)?.[1])).toBe(64);
    expect(Number(card.match(/min-height:\s*(\d+)px/)?.[1])).toBeGreaterThanOrEqual(32);
  });

  it('320 宽不撑开：列宽不超过容器', () => {
    expect(rules('.set-list')).toContain('grid-template-columns: minmax(0, 1fr)');
    expect(rules('.set-body')).toContain('min-width: 0');
  });

  it('独立卡片之间有 6px 间隔，不再用内缩分隔线；焦点框画在卡片外', () => {
    expect(rules('.set-list')).toContain('gap: 6px');
    expect(rules('.set-list')).not.toMatch(/background:|border:|box-shadow/);
    expect(css).not.toMatch(/\.set-card \+ \.set-card::before/);
    expect(rules('.set-card:focus-visible')).toContain('outline-offset: 2px');
  });

  it('强调色侧标和圆形箭头都只引用现有变量', () => {
    expect(rules('.set-card::after')).toContain('background: var(--accent)');
    const chevron = rules('.chevron');
    expect(chevron).toContain('width: 24px');
    expect(chevron).toContain('border-radius: 50%');
    expect(chevron).toContain('background: var(--accent-soft)');
    expect(chevron).toContain('color: var(--accent)');
  });

  it('首页没有硬编码颜色、模糊、渐变，动画不超过 250ms', () => {
    for (const sel of HOME_SELECTORS) {
      const body = rules(sel);
      expect(body, sel).not.toBe('');
      expect(body, sel).not.toMatch(/#[0-9a-fA-F]{3,8}\b|rgb\(|gradient|backdrop-filter|filter:/);
      for (const [, sec] of body.matchAll(/(\d*\.?\d+)s\b/g)) {
        expect(Number(sec), sel).toBeLessThanOrEqual(0.25);
      }
    }
  });

  it('字号 token 只定义一次，浅色和深色通用', () => {
    for (const token of ['--fs-title', '--fs-name', '--fs-meta']) {
      expect(css.match(new RegExp(`${token}:`, 'g')), token).toHaveLength(1);
    }
  });

  it('其他页共用的 .page-title 没有被改（T48 的预算按它实测）', () => {
    expect(css).toMatch(/^\.page-title \{ font-size: 1\.5rem; margin-bottom: 12px; \}/m);
    expect(css).toMatch(/^\.page \{ max-width: 1040px; margin: 0 auto; padding: 16px; \}/m);
  });
});