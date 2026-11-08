import { createElement } from 'react';
import { renderToStaticMarkup } from 'react-dom/server';
import { MemoryRouter } from 'react-router-dom';
import { expect, it, vi } from 'vitest';
import { METHODS, SETS } from '../data';
import { HomePage } from './HomePage';
vi.mock('../store/userStore', async original => ({ ...await original<typeof import('../store/userStore')>(), useUserData: () => ({ version: 1, cases: {} }) }));
vi.mock('../store/devicePrefs', async original => { const actual = await original<typeof import('../store/devicePrefs')>(); return { ...actual, useDevicePrefs: () => actual.getDevicePrefs() }; });
const render = (entry = '/') => renderToStaticMarkup(createElement(MemoryRouter, { initialEntries: [entry] }, createElement(HomePage)));

it('首页固定为独立卡片，旧的 ?cards / ?tone 实验开关不再生效', () => {
  const html = render();
  expect(html).not.toContain('data-cards');
  expect(html).not.toContain('data-card-tone');
  expect(render('/?cards=a&tone=mist')).toBe(html);
  expect(render('/?cards=b')).toBe(html);
  expect(render('/?cards=c')).toBe(html);
});

it('保留五个方法入口、图解、说明、掌握数与进度', () => {
  const html = render();
  for (const id of ['f2l', 'oll', 'pll', 'cmll', 'lse']) expect(html).toContain(`href="/set/${id}"`);
  expect(html.match(/class="set-card"/g)).toHaveLength(5);
  expect(html.match(/class="diagram"/g)).toHaveLength(5);
  expect(html.match(/class="progress" aria-hidden="true"/g)).toHaveLength(5);
  expect(html.match(/已掌握 0 \/ /g)).toHaveLength(5);
  expect(html.match(/class="chevron"/g)).toHaveLength(5);
  for (const set of SETS) {
    expect(html).toContain(set.name);
    expect(html).toContain(set.description);
  }
});

it('A 方案只留方法名，不再显示两行箭头说明', () => {
  const html = render();
  for (const method of METHODS) expect(html).not.toContain(method.hint);
});