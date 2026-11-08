import { createElement } from 'react';
import { renderToStaticMarkup } from 'react-dom/server';
import { MemoryRouter } from 'react-router-dom';
import { expect, it, vi } from 'vitest';
import { HomePage } from './HomePage';
import { ALL_CASES } from '../data';
import { matches } from '../lib/search';

const state = vi.hoisted(() => ({ query: '' }));
vi.mock('react', async (original) => ({
  ...await original<typeof import('react')>(),
  useState: (initial: unknown) => [initial === '' ? state.query : initial, vi.fn()],
}));
vi.mock('../store/userStore', async (original) => ({
  ...await original<typeof import('../store/userStore')>(),
  useUserData: () => ({ version: 1, cases: {} }),
}));
vi.mock('../store/devicePrefs', async (original) => ({
  ...await original<typeof import('../store/devicePrefs')>(),
  useDevicePrefs: () => ({ bottomColor: 'white' }),
}));
const render = (query: string) => {
  state.query = query;
  return renderToStaticMarkup(createElement(MemoryRouter, null, createElement(HomePage)));
};
it('empty or whitespace input keeps home entries without result cards', () => {
  for (const q of ['', '   ']) {
    const html = render(q);
    expect(html).toContain('aria-label="搜索公式"');
    expect(html).toContain('/set/pll');
    expect(html).not.toContain('aria-label="搜索结果"');
  }
});
it('renders the shared-search result count and real CaseCard links on home', () => {
  const html = render('  pll-t  ');
  const expected = ALL_CASES.filter(c => matches(c, 'pll-t', { version: 1, cases: {} }));
  expect(expected.length).toBeGreaterThan(0);
  expect(html).toContain(`找到 ${expected.length} 条`);
  for (const c of expected) expect(html).toContain(`/case/${c.id}`);
  expect(html.match(/class="case-card"/g)).toHaveLength(expected.length);
  expect(html).toContain('/set/oll');
});
it('shows the no-results state on home', () => {
  const html = render('不存在的情形xyz123');
  expect(html).toContain('找到 0 条');
  expect(html).toContain('没有匹配的公式');
  expect(html).not.toContain('class="case-card"');
});
