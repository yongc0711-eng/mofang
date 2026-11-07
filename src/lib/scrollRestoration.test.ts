import { describe, expect, it } from 'vitest';
import appSource from '../App.tsx?raw';
import casePageSource from '../pages/CasePage.tsx?raw';
import setPageSource from '../pages/SetPage.tsx?raw';
import hookSource from './scrollRestoration.ts?raw';
import { scrollKey, shouldRestoreScroll } from './scrollRestoration';

describe('scrollKey / shouldRestoreScroll', () => {
  it("scrollKey 按 pathname 生成：'/'、'/set/oll'、'/case/oll-27'", () => {
    expect(scrollKey('/')).toBe('scroll:/');
    expect(scrollKey('/set/oll')).toBe('scroll:/set/oll');
    expect(scrollKey('/case/oll-27')).toBe('scroll:/case/oll-27');
  });
  it('不同页面的 key 互不相同', () => {
    const keys = ['/', '/set/oll', '/set/pll', '/case/oll-27', '/case/oll-28', '/me', '/search', '/practice'].map(scrollKey);
    expect(new Set(keys).size).toBe(keys.length);
  });
  it('POP、REPLACE 恢复；PUSH（新打开页面）回顶部', () => {
    expect(shouldRestoreScroll('POP')).toBe(true);
    expect(shouldRestoreScroll('REPLACE')).toBe(true);
    expect(shouldRestoreScroll('PUSH')).toBe(false);
  });
});

describe('接线（源码文本）', () => {
  it('App：有 ScrollRestoration，放在 Nav 之后、main 之前', () => {
    expect(appSource).toMatch(/function ScrollRestoration\(\) \{\s*useScrollRestoration\(\);\s*return null;\s*\}/);
    expect(appSource).toMatch(/<Nav \/>\s*<ScrollRestoration \/>\s*<main>/);
  });

  it('返回栈（T53-fix）：Nav 里定义 inCase / inTab；公式 replace={!inFormulas || formulaTo === pathname}，其余三个 replace={inCase || inTab}', () => {
    expect(appSource).toMatch(/const inCase = pathname\.startsWith\('\/case\/'\);/);
    expect(appSource).toMatch(/const inTab = pathname === '\/search' \|\| pathname === '\/practice' \|\| pathname === '\/me';/);
    const links = appSource.match(/<NavLink\b[^>]*>/g) ?? [];
    // 一个“公式”，加上 NAV 数组渲染出的搜索/练习/我的共用的一个 <NavLink>
    expect(links).toHaveLength(2);
    expect(links[0]).toMatch(/to=\{formulaTo\} replace=\{!inFormulas \|\| formulaTo === pathname\} className=/);
    expect(links[1]).toMatch(/key=\{n\.to\} to=\{n\.to\} replace=\{inCase \|\| inTab\} className="nav-item"/);
    // 没有裸的、无条件的 replace（那会把首页/组页从历史里替换掉）
    for (const l of links) expect(l, l).not.toMatch(/\breplace(?!=)/);
    expect(appSource.match(/to: '\/(search|practice|me)'/g)).toHaveLength(3);
  });

  it('T51 的“公式”tab 目标没动', () => {
    expect(appSource).toMatch(/formulaTabTarget\(pathname, getUi<string \| null>\('lastCaseId', null\)\)/);
    expect(appSource).toMatch(/<NavLink to=\{formulaTo\} replace=\{!inFormulas \|\| formulaTo === pathname\} className=/);
  });

  it('CasePage 不再含 useScrollTop；T51 的 lastCaseId effect 保留', () => {
    expect(casePageSource).not.toContain('useScrollTop');
    expect(casePageSource).toMatch(/if \(validId\) setUi\('lastCaseId', validId\);/);
  });

  it('SetPage 不再含 useScrollMemory；筛选的 getUi/setUi 保留', () => {
    expect(setPageSource).not.toContain('useScrollMemory');
    expect(setPageSource).toContain('getUi(`filter:${setId}`');
    expect(setPageSource).toContain('getUi(`group:${setId}`');
    expect(setPageSource).toContain('setUi(`filter:${setId}`');
    expect(setPageSource).toContain('setUi(`group:${setId}`');
  });

  it('hook：用 useLocation + useNavigationType，layout effect 里滚动，只存内存不写 localStorage', () => {
    expect(hookSource).toContain('useLocation');
    expect(hookSource).toContain('useNavigationType');
    expect(hookSource).toContain('useLayoutEffect');
    expect(hookSource).toMatch(/window\.scrollTo\(0, y\)/);
    expect(hookSource).toMatch(/shouldRestoreScroll\(navType\) \? getUi<number>\(storeKey, 0\) : 0/);
    expect(hookSource).toMatch(/addEventListener\('scroll', onScroll, \{ passive: true \}\)/);
    expect(hookSource).not.toMatch(/localStorage[.[]|sessionStorage/);
    // 离开时存 render 阶段（旧 DOM 还在）读到的位置；清理里不现读 window.scrollY（新页面已换上，可能被截断）
    expect(hookSource).toMatch(/if \(typeof window !== 'undefined'\) leaving\.current = window\.scrollY;/);
    const cleanup = hookSource.slice(hookSource.indexOf('return () => {'));
    expect(cleanup).toContain('setUi(storeKey, leaving.current);');
    expect(cleanup).not.toMatch(/window\.scrollY/);
  });
});
