import { createElement } from 'react';
import { renderToStaticMarkup } from 'react-dom/server';
import { expect, it } from 'vitest';
import { AlgKeyboard } from './AlgKeyboard';
it('T42 keyboard contains all 18 moves and two editing controls, never submit buttons', () => {
  const html = renderToStaticMarkup(createElement(AlgKeyboard, { id: 'keyboard', empty: false, onEdit: () => {} }));
  expect(html.match(/<button /g)).toHaveLength(20);
  expect(html.match(/type="button"/g)).toHaveLength(20);
  expect(html).toContain('role="group" aria-label="公式键盘"');
  expect(html).not.toContain('disabled=""');
});
it('T42 empty draft disables only backspace and clear; move keys stay usable', () => {
  const html = renderToStaticMarkup(createElement(AlgKeyboard, { id: 'keyboard', empty: true, onEdit: () => {} }));
  expect(html.match(/disabled=""/g)).toHaveLength(2);
  expect(html).toMatch(/disabled=""[^>]*>退格/);
  expect(html).toMatch(/disabled=""[^>]*>清空/);
});
