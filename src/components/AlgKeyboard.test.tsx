import { createElement } from 'react';
import { renderToStaticMarkup } from 'react-dom/server';
import { expect, it } from 'vitest';
import { AlgKeyboard } from './AlgKeyboard';
it('T42 keyboard contains 18 base moves, three suffix keys and two editing controls, never submit buttons', () => {
  const html = renderToStaticMarkup(createElement(AlgKeyboard, { id: 'keyboard', empty: false, onEdit: () => {} }));
  expect(html.match(/<button /g)).toHaveLength(23);
  expect(html.match(/type="button"/g)).toHaveLength(23);
  expect(html).toContain('role="group" aria-label="公式键盘"');
  expect(html).not.toContain('disabled=""');
});
it('T42 empty draft disables suffixes, backspace and clear; move keys stay usable', () => {
  const html = renderToStaticMarkup(createElement(AlgKeyboard, { id: 'keyboard', empty: true, onEdit: () => {} }));
  expect(html.match(/disabled=""/g)).toHaveLength(5);
  expect(html).toMatch(/disabled=""[^>]*>退格/);
  expect(html).toMatch(/disabled=""[^>]*>清空/);
});

it('二阶仅提供六个面转法，保留全部后缀与编辑键，不引导输入宽转', () => {
  const html = renderToStaticMarkup(createElement(AlgKeyboard, { id: 'keyboard2', size: 2, empty: false, onEdit: () => {} }));
  const keys = [...html.matchAll(/<button[^>]*>([^<]*)<\/button>/g)].map(match => match[1]);
  expect(keys).toEqual(['R', 'L', 'U', 'D', 'F', 'B', '&#x27;', '2', '3', '退格', '清空']);
  expect(html).toContain('二阶公式只使用六个面的转动');
  expect(html).not.toContain('小写表示宽转');
});
