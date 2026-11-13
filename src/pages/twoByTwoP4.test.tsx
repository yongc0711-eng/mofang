import { createElement } from 'react';
import { renderToStaticMarkup } from 'react-dom/server';
import { MemoryRouter, Route, Routes } from 'react-router-dom';
import { describe, expect, it, vi } from 'vitest';
import { CasePage } from './CasePage';
import { PracticePage } from './PracticePage';
import { SetPage } from './SetPage';
import { getCase } from '../data';
import { primaryAlgOf } from '../store/userStore';

const prefsState = vi.hoisted(() => ({ focusRelevant: true }));
vi.mock('../store/userStore', async (original) => ({
  ...(await original<typeof import('../store/userStore')>()),
  useUserData: () => ({ version: 1, cases: {} }),
}));
vi.mock('../store/devicePrefs', async (original) => ({
  ...(await original<typeof import('../store/devicePrefs')>()),
  useDevicePrefs: () => ({
    finish: 'uv' as const,
    focusRelevant: prefsState.focusRelevant,
    bottomColor: 'white' as const,
    cfop: { bottomColor: 'white' as const },
    roux: { bottomColor: 'white' as const, bridgePair: 'red-orange' as const, leftColor: 'red' as const },
  }),
}));
vi.mock('../components/CubePlayer', () => ({
  CubePlayer: ({ alg, size }: { alg: string; size?: 2 | 3 }) =>
    createElement('div', { 'data-playing': alg, 'data-size': String(size ?? 3) }),
}));

describe('2x2 P4 页面接线与练习隔离', () => {
  it('SetPage 正常渲染 CLL / EG-1 / EG-2 共 126 条卡片并分流顶/双图', () => {
    let total = 0;
    for (const [setId, svgsPerCard] of [['cll', 1], ['eg1', 2], ['eg2', 2]] as const) {
      const html = renderToStaticMarkup(
        createElement(
          MemoryRouter,
          { initialEntries: [`/set/${setId}`] },
          createElement(Routes, null, createElement(Route, { path: '/set/:setId', element: createElement(SetPage) })),
        ),
      );
      expect(html).toContain('42 个情形');
      expect(html.match(/class="case-card"/g)).toHaveLength(42);
      expect(html.match(/<svg viewBox="0 0 64 64"/g)).toHaveLength(42 * svgsPerCard);
      total += 42;
    }
    expect(total).toBe(126);
  });

  it('CasePage 渲染二阶 2D（top2/both2）与 CubePlayer size=2，开着 focusRelevant 也不碰 SET_RULES', () => {
    const cllHtml = renderToStaticMarkup(
      createElement(
        MemoryRouter,
        { initialEntries: ['/case/cll-as-1'] },
        createElement(Routes, null, createElement(Route, { path: '/case/:caseId', element: createElement(CasePage) })),
      ),
    );
    expect(cllHtml).toContain('data-size="2"');
    expect(cllHtml.match(/<svg viewBox="/g)).toHaveLength(1);
    expect(cllHtml).not.toContain('focus-chip');

    const eg1Html = renderToStaticMarkup(
      createElement(
        MemoryRouter,
        { initialEntries: ['/case/eg1-h-1'] },
        createElement(Routes, null, createElement(Route, { path: '/case/:caseId', element: createElement(CasePage) })),
      ),
    );
    expect(eg1Html).toContain('data-size="2"');
    expect(eg1Html.match(/<svg viewBox="/g)).toHaveLength(2);
    expect(eg1Html).toContain('aria-label="顶视图"');
    expect(eg1Html).toContain('aria-label="底视图"');
  });

  it('PracticePage 不包含 CLL / EG-1 / EG-2，且忽略 ?set=cll', () => {
    const html = renderToStaticMarkup(
      createElement(
        MemoryRouter,
        { initialEntries: ['/practice?set=cll'] },
        createElement(Routes, null, createElement(Route, { path: '/practice', element: createElement(PracticePage) })),
      ),
    );
    expect(html).toContain('范围内共 437 个情形');
    expect(html).not.toContain('>CLL<');
    expect(html).not.toContain('>EG-1<');
    expect(html).not.toContain('>EG-2<');
  });

  it('userStore.primaryAlgOf 对二阶合法/非法自定义公式走 cases2 校验', () => {
    const c = getCase('cll-as-1')!;
    const alt = c.algs[0];
    expect(primaryAlgOf(c, { version: 1, cases: { [c.id]: { customAlgs: ['R U'], primaryAlg: 'R U' } } })).toBe(alt);
    expect(
      primaryAlgOf(c, {
        version: 1,
        cases: { [c.id]: { customAlgs: [c.algs[1]], primaryAlg: c.algs[1] } },
      }),
    ).toBe(c.algs[1]);
  });
});
