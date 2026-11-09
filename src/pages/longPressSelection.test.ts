import { describe, expect, it } from 'vitest';

// vitest 里 styles.css?raw 是空串，和 homeStyle.test.ts 一样用 node:fs
const fsModule: string = 'node:fs';
const { readFileSync } = (await import(/* @vite-ignore */ fsModule)) as {
  readFileSync(path: URL, encoding: 'utf8'): string;
};
const css = readFileSync(new URL('../styles.css', import.meta.url), 'utf8');

const block = (selector: string) => {
  const escaped = selector.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
  return css.match(new RegExp(`^${escaped} \\{\\r?\\n([\\s\\S]*?)\\r?\\n\\}`, 'm'))?.[1] ?? '';
};

describe('长按选中收敛', () => {
  it('界面文字默认不可选中，标题和卡片不再弹原生选择菜单', () => {
    const body = block('body');
    expect(body).toContain('-webkit-touch-callout: none');
    expect(body).toContain('-webkit-user-select: none');
    expect(body).toContain('user-select: none');
  });

  it('公式和输入框仍可选中复制', () => {
    const selectable = block('input, textarea, code, [contenteditable="true"]');
    expect(selectable).toContain('-webkit-touch-callout: default');
    expect(selectable).toContain('-webkit-user-select: text');
    expect(selectable).toContain('user-select: text');
  });
});