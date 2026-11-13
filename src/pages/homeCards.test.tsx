import { createElement } from 'react';
import { renderToStaticMarkup } from 'react-dom/server';
import { MemoryRouter } from 'react-router-dom';
import { expect, it, vi } from 'vitest';
import { METHODS, SETS } from '../data';
import { HomePage } from './HomePage';
vi.mock('../store/userStore', async original => ({ ...await original<typeof import('../store/userStore')>(), useUserData: () => ({ version: 1, cases: {} }) }));
vi.mock('../store/devicePrefs', async original => { const actual = await original<typeof import('../store/devicePrefs')>(); return { ...actual, useDevicePrefs: () => actual.getDevicePrefs() }; });
const render = (entry = '/') => renderToStaticMarkup(createElement(MemoryRouter, { initialEntries: [entry] }, createElement(HomePage)));

it('首页固定为双卡堆，旧的 ?cards / ?tone 实验开关不再生效', () => {
  const html = render();
  expect(html).not.toContain('data-cards');
  expect(html).not.toContain('data-card-tone');
  expect(render('/?cards=a&tone=mist')).toBe(html);
  expect(render('/?cards=b')).toBe(html);
  expect(render('/?cards=c')).toBe(html);
});

it('保留十二个方法入口、图解、说明、掌握数与进度', () => {
  const html = render();
  for (const id of ['f2l', 'oll', 'pll', 'coll', 'wv', 'cmll', 'lse', 'sbls', 'eolr', 'cll', 'eg1', 'eg2']) expect(html).toContain(`href="/set/${id}"`);
  expect(html.match(/class="set-card"/g)).toHaveLength(12);
  expect(html.match(/class="diagram"/g)).toHaveLength(11);
  expect(html.match(/class="diagram eolr-diagram"/g)).toHaveLength(1);
  expect(html.match(/class="progress" aria-hidden="true"/g)).toHaveLength(12);
  expect(html.match(/已掌握 0 \/ /g)).toHaveLength(12);
  expect(html.match(/class="home-deck-expand"/g)).toHaveLength(15);
  for (const set of SETS) {
    expect(html).toContain(set.name);
    expect(html).toContain(set.description);
  }
});

it('方法封面只留方法名和分组信息，不再显示两行箭头说明', () => {
  const html = render();
  for (const method of METHODS) expect(html).not.toContain(method.hint);
});

it('三阶是公共标题，三张纯文字封面各自属于独立卡堆', () => {
  const html = render();
  expect(html.match(/id="home-three-title">三阶<\/h2>/g)).toHaveLength(1);
  expect(html.match(/class="home-method-deck"/g)).toHaveLength(3);
  expect(html.match(/data-cover="true"/g)).toHaveLength(3);
  const covers = [...html.matchAll(/<article[^>]*data-cover="true"[^>]*>([\s\S]*?)<\/article>/g)];
  expect(covers).toHaveLength(3);
  expect(covers[0][1]).toContain('<h3>CFOP</h3>');
  expect(covers[0][1]).toContain('5 组 · 186 个情形');
  expect(covers[0][1]).toContain('F2L · OLL · PLL · COLL · WV');
  expect(covers[1][1]).toContain('<h3>桥式</h3>');
  expect(covers[1][1]).toContain('4 组 · 251 个情形');
  expect(covers[1][1]).toContain('CMLL · LSE · SBLS · EOLR');
  expect(covers[2][1]).toContain('<h3>二阶</h3>');
  expect(covers[2][1]).toContain('3 组 · 126 个情形');
  expect(covers[2][1]).toContain('CLL · EG-1 · EG-2');
  for (const [, body] of covers) expect(body).not.toContain('class="diagram"');
});

it('十二个链接保持原顺序；展开和进入是相邻独立控件，没有嵌套交互', () => {
  const html = render();
  const links = [...html.matchAll(/href="\/set\/([a-z0-9]+)"/g)].map(match => match[1]);
  expect(links).toEqual(['f2l', 'oll', 'pll', 'coll', 'wv', 'cmll', 'lse', 'sbls', 'eolr', 'cll', 'eg1', 'eg2']);
  expect([...html.matchAll(/<a[^>]*class="set-card"[^>]*>([\s\S]*?)<\/a>/g)]).toHaveLength(12);
  for (const [, content] of html.matchAll(/<a[^>]*class="set-card"[^>]*>([\s\S]*?)<\/a>/g)) expect(content).not.toContain('<button');
  expect(html.match(/inert=""/g)).toHaveLength(15); // 十二张未翻到的分组卡和三条收起标题
});
