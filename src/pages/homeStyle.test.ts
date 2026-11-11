import { describe, expect, it } from 'vitest';

// vitest 里 styles.css?raw 是空串，和 caseInput.test.ts 一样用 node:fs，本地声明这一个 API
const fsModule: string = 'node:fs';
const { readFileSync } = (await import(/* @vite-ignore */ fsModule)) as {
  readFileSync(path: URL, encoding: 'utf8'): string;
};
const css = readFileSync(new URL('../styles.css', import.meta.url), 'utf8');

/** 取某个选择器所有规则的声明，包括写在媒体查询里的 */
const rules = (sel: string) => {
  const escaped = sel.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
  return [...css.matchAll(new RegExp(`^\\s*${escaped} \\{([^}]*)\\}`, 'gm'))].map((m) => m[1]).join(';');
};

const HOME_SELECTORS = [
  '.home-head', '.home-library > h2', '.home-decks', '.home-method-deck', '.home-deck-card',
  '.home-deck-pile', '.home-deck-header', '.home-deck-cover-body', '.home-deck-position',
  '.home-deck-dot.current', '.home-deck-expand, .home-deck-close', '.set-card',
  '.set-card:active', '.set-card:hover', '.set-body', '.set-title', '.progress', '.progress > div',
];

describe('UI-home 首页样式', () => {
  it('每张卡是独立 surface：有细边和圆角，没有阴影，按下有底色反馈', () => {
    const card = rules('.home-deck-card');
    expect(card).toContain('background: var(--surface)');
    expect(card).toContain('border: 1px solid var(--border)');
    expect(card).toContain('border-radius: var(--radius-card)');
    expect(card).not.toMatch(/box-shadow/);
    expect(rules('.set-card:active')).toContain('background: var(--surface-2)');
  });

  it('横卡为 96/100px、展开后 80/82px，主入口和独立展开控件均不低于 32px', () => {
    const deck = rules('.home-method-deck');
    expect(Number(deck.match(/--home-deck-height:\s*(\d+)px/)?.[1])).toBe(96);
    expect(Number(deck.match(/--home-deck-expanded-height:\s*(\d+)px/)?.[1])).toBe(80);
    expect(css).toMatch(/@media \(min-width: 360px\)[\s\S]*?--home-deck-height: 100px; --home-deck-expanded-height: 82px;/);
    expect(rules('.home-deck-card')).toContain('height: var(--home-deck-height)');
    expect(rules('.home-method-deck[data-expanded="true"] .home-deck-card')).toContain('height: var(--home-deck-expanded-height)');
    expect(Number(rules('.set-card').match(/min-height:\s*(\d+)px/)?.[1])).toBeGreaterThanOrEqual(32);
    expect(Number(rules('.home-deck-expand, .home-deck-close').match(/min-height:\s*(\d+)px/)?.[1])).toBeGreaterThanOrEqual(32);
  });

  it('320 宽不撑开：列宽不超过容器', () => {
    expect(rules('.home-decks')).toContain('grid-template-columns: minmax(0, 1fr)');
    expect(rules('.set-body')).toContain('min-width: 0');
    expect(rules('.set-card')).toContain('grid-template-columns: minmax(0, 1fr) 44px');
  });

  it('两堆间隔 18px，展开行距 8px；堆叠裁切内仍保留清晰焦点框', () => {
    expect(rules('.home-decks')).toContain('gap: 18px');
    expect(rules('.home-decks')).not.toMatch(/background:|border:|box-shadow/);
    expect(rules('.home-method-deck[data-expanded="true"] .home-deck-pile')).toContain('(var(--home-deck-items) - 1) * 8px');
    expect(css).not.toMatch(/\.set-card \+ \.set-card::before/);
    expect(rules('.set-card:focus-visible')).toContain('outline-offset: -3px');
    expect(rules('.home-deck-expand:focus-visible, .home-deck-close:focus-visible')).toContain('outline-offset: -2px');
  });

  it('移除侧标和圆形箭头，页码点与触控反馈仍只引用现有变量', () => {
    expect(css).not.toContain('.set-card::after');
    expect(css).not.toContain('.chevron {');
    expect(rules('.home-deck-dot.current')).toContain('background: var(--accent)');
    expect(rules('.home-deck-expand, .home-deck-close')).toContain('color: var(--muted)');
    const pressed = rules('.home-deck-expand:active, .home-deck-close:active');
    expect(pressed).toContain('background: var(--accent-soft)');
    expect(pressed).toContain('color: var(--accent)');
  });

  it('首页没有硬编码颜色、模糊、渐变，动画不超过 250ms', () => {
    for (const sel of HOME_SELECTORS) {
      const body = rules(sel);
      expect(body, sel).not.toBe('');
      expect(body, sel).not.toMatch(/#[0-9a-fA-F]{3,8}\b|rgb\(|gradient|backdrop-filter|filter:/);
      for (const [, duration, unit] of body.matchAll(/(\d*\.?\d+)(ms|s)\b/g)) {
        expect(Number(duration) * (unit === 's' ? 1000 : 1), sel).toBeLessThanOrEqual(250);
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
