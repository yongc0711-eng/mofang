import { describe, expect, it } from 'vitest';
import appSource from '../App.tsx?raw';
import { formulaTabTarget, isFormulaPath, shouldPopToFormula, tabLinkState } from './nav';

describe('tabLinkState：去搜索/练习/我的的链接带什么 state', () => {
  it('从首页、组页出去：带上来源（push，历史里保留这一页）', () => {
    expect(tabLinkState('/', undefined)).toEqual({ fromFormula: '/' });
    expect(tabLinkState('/set/cmll', null)).toEqual({ fromFormula: '/set/cmll' });
  });
  it('从详情出去：什么都不带（详情本来就被 replace 掉了）', () => {
    expect(tabLinkState('/case/cmll-o-1', { fromFormula: '/set/cmll' })).toBeUndefined();
  });
  it('从别的 tab 出去：把已有的来源带过去，没有就不带', () => {
    expect(tabLinkState('/me', { fromFormula: '/set/cmll' })).toEqual({ fromFormula: '/set/cmll' });
    expect(tabLinkState('/search', { fromFormula: '/' })).toEqual({ fromFormula: '/' });
    expect(tabLinkState('/practice', undefined)).toBeUndefined();
    expect(tabLinkState('/practice', null)).toBeUndefined();
    expect(tabLinkState('/me', { fromFormula: 3 })).toBeUndefined();
    expect(tabLinkState('/me', 'junk')).toBeUndefined();
  });
});

describe('shouldPopToFormula：什么时候后退一步而不是 replace', () => {
  it('当前历史是从 P push 出来的，而“公式”要回的也是 P → 后退', () => {
    expect(shouldPopToFormula('/me', { fromFormula: '/set/cmll' }, '/set/cmll')).toBe(true);
    expect(shouldPopToFormula('/search', { fromFormula: '/' }, '/')).toBe(true);
    expect(shouldPopToFormula('/practice', { fromFormula: '/set/oll' }, '/set/oll')).toBe(true);
  });
  it('已经在公式区：不后退', () => {
    expect(shouldPopToFormula('/', { fromFormula: '/' }, '/')).toBe(false);
    expect(shouldPopToFormula('/set/oll', { fromFormula: '/set/oll' }, '/set/oll')).toBe(false);
    expect(shouldPopToFormula('/case/x', { fromFormula: '/set/oll' }, '/set/oll')).toBe(false);
  });
  it('没有来源、来源和记录对不上、没有记录（刷新后）：不后退，保持 replace', () => {
    expect(shouldPopToFormula('/me', undefined, '/set/cmll')).toBe(false);
    expect(shouldPopToFormula('/me', null, '/set/cmll')).toBe(false);
    expect(shouldPopToFormula('/me', {}, '/set/cmll')).toBe(false);
    expect(shouldPopToFormula('/me', { fromFormula: '/set/a' }, '/set/b')).toBe(false);
    expect(shouldPopToFormula('/me', { fromFormula: '/set/a' }, null)).toBe(false);
    expect(shouldPopToFormula('/me', { fromFormula: '/set/a' }, undefined)).toBe(false);
    expect(shouldPopToFormula('/me', { fromFormula: '/me' }, '/me')).toBe(false); // 来源不是公式页
    expect(shouldPopToFormula('/me', { fromFormula: 7 }, '7')).toBe(false);
  });
});

/**
 * 用一个最小的历史栈模型照着 App 的规则走一遍（push / replace / 后退），
 * 规则本身来自 nav.ts 的纯函数；App 里 replace 的表达式用源码断言锁住（见最后一组）。
 */
class Sim {
  stack: { path: string; state: unknown }[];
  idx = 0;
  lastFormulaPath: string | null = null;
  lastCaseId: string | null = null;
  constructor(start = '/') {
    this.stack = [{ path: start, state: undefined }];
    this.seen();
  }
  get path() {
    return this.stack[this.idx].path;
  }
  /** 每次地址变化后 App 里的 effect / CasePage 的 effect 做的记录 */
  private seen() {
    if (isFormulaPath(this.path)) this.lastFormulaPath = this.path;
    if (this.path.startsWith('/case/')) this.lastCaseId = this.path.slice('/case/'.length);
  }
  private nav(path: string, replace: boolean, state?: unknown) {
    if (replace) this.stack[this.idx] = { path, state };
    else {
      this.stack = [...this.stack.slice(0, this.idx + 1), { path, state }];
      this.idx++;
    }
    this.seen();
  }
  /** 页面内的链接（卡片、组卡）：push */
  visit(path: string) {
    this.nav(path, false);
    return this;
  }
  back() {
    if (this.idx > 0) this.idx--;
    this.seen();
    return this;
  }
  /** 点底部的搜索/练习/我的：replace={inCase || inTab}，state={tabLinkState(...)} */
  tab(to: '/search' | '/practice' | '/me') {
    const cur = this.stack[this.idx];
    const inCase = cur.path.startsWith('/case/');
    const inTab = cur.path === '/search' || cur.path === '/practice' || cur.path === '/me';
    this.nav(to, inCase || inTab, tabLinkState(cur.path, cur.state));
    return this;
  }
  /** 点底部的“公式” */
  formula() {
    const cur = this.stack[this.idx];
    const target = formulaTabTarget(cur.path, this.lastFormulaPath, this.lastCaseId);
    if (shouldPopToFormula(cur.path, cur.state, this.lastFormulaPath)) return this.back();
    this.nav(target, !isFormulaPath(cur.path) || target === cur.path);
    return this;
  }
  paths() {
    return this.stack.slice(0, this.idx + 1).map((e) => e.path);
  }
}

describe('历史栈：三种来源的返回（T55 + 不回退 T53）', () => {
  it('首页 → CMLL 组页 → 我的 → 公式 → 返回一次就是首页，历史里没有重复的组页', () => {
    const s = new Sim('/').visit('/set/cmll').tab('/me');
    expect(s.paths()).toEqual(['/', '/set/cmll', '/me']);
    s.formula();
    expect(s.path).toBe('/set/cmll');
    expect(s.paths()).toEqual(['/', '/set/cmll']); // 没有重复
    s.back();
    expect(s.path).toBe('/');
  });

  it('首页 → 我的 → 公式 → 回到首页，历史里不重复', () => {
    const s = new Sim('/').tab('/me');
    expect(s.paths()).toEqual(['/', '/me']);
    s.formula();
    expect(s.path).toBe('/');
    expect(s.paths()).toEqual(['/']);
  });

  it('详情 → 我的 → 公式 → 返回仍回组页，不回我的（T53 不回退）', () => {
    const s = new Sim('/').visit('/set/cmll').visit('/case/cmll-o-1').tab('/me');
    expect(s.paths()).toEqual(['/', '/set/cmll', '/me']); // 详情被 replace 掉
    s.formula();
    expect(s.path).toBe('/case/cmll-o-1');
    expect(s.paths()).toEqual(['/', '/set/cmll', '/case/cmll-o-1']);
    s.back();
    expect(s.path).toBe('/set/cmll');
    expect(s.paths()).not.toContain('/me');
  });

  it('组页 → 我的 → 搜索 → 公式：tab 之间 replace，来源一路带着，公式后退一步回组页', () => {
    const s = new Sim('/').visit('/set/pll').tab('/me').tab('/search');
    expect(s.paths()).toEqual(['/', '/set/pll', '/search']);
    s.formula();
    expect(s.paths()).toEqual(['/', '/set/pll']);
    s.back();
    expect(s.path).toBe('/');
  });

  it('首页 → 我的 → 搜索 → 公式 → 回到首页，不重复', () => {
    const s = new Sim('/').tab('/me').tab('/search').formula();
    expect(s.path).toBe('/');
    expect(s.paths()).toEqual(['/']);
  });

  it('详情 → 我的 → 搜索 → 公式 → 返回组页（详情那条被 replace，不留 tab）', () => {
    const s = new Sim('/').visit('/set/oll').visit('/case/oll-27').tab('/me').tab('/search').formula();
    expect(s.path).toBe('/case/oll-27');
    expect(s.paths()).toEqual(['/', '/set/oll', '/case/oll-27']);
    s.back();
    expect(s.path).toBe('/set/oll');
  });

  it('组页 → 我的 → 公式 之后再去我的再回来，同样一次返回就能离开', () => {
    const s = new Sim('/').visit('/set/f2l').tab('/me').formula().tab('/me').formula();
    expect(s.paths()).toEqual(['/', '/set/f2l']);
  });

  it('刷新后（记录没了）：从我的点公式不后退，保持 replace 回首页，不会崩', () => {
    const s = new Sim('/');
    s.stack = [{ path: '/', state: undefined }, { path: '/me', state: { fromFormula: '/set/cmll' } }];
    s.idx = 1;
    s.lastFormulaPath = null;
    s.lastCaseId = null;
    s.formula();
    expect(s.path).toBe('/');
  });

  it('先进别的组再回我的：来源和记录对不上时保持 replace', () => {
    const s = new Sim('/').visit('/set/a').tab('/me');
    s.lastFormulaPath = '/set/b'; // 记录被别的页面改过
    s.formula();
    expect(s.path).toBe('/set/b');
    expect(s.paths()).toEqual(['/', '/set/a', '/set/b']); // replace：我的被换掉
  });

  it('在公式区点“公式”仍回首页（T51），不后退', () => {
    const s = new Sim('/').visit('/set/cmll').formula();
    expect(s.path).toBe('/');
    expect(s.paths()).toEqual(['/', '/set/cmll', '/']);
  });
});

describe('App 接线（源码文本）', () => {
  it('三个 tab 的链接带 state={tabState}；“公式”有 onClick；replace 表达式没变（T53）', () => {
    expect(appSource).toMatch(/const tabState = tabLinkState\(pathname, location\.state\);/);
    expect(appSource).toMatch(/key=\{n\.to\} to=\{n\.to\} replace=\{inCase \|\| inTab\} className="nav-item" state=\{tabState\}/);
    expect(appSource).toMatch(/<NavLink to=\{formulaTo\} replace=\{!inFormulas \|\| formulaTo === pathname\} className=\{`nav-item \$\{inFormulas \? 'active' : ''\}`\} onClick=\{onFormulaClick\}>/);
  });
  it('onClick 用 shouldPopToFormula 判断，后退用 navigate(-1)，并 preventDefault 避免再 replace', () => {
    expect(appSource).toMatch(/shouldPopToFormula\(pathname, location\.state, getUi<string \| null>\('lastFormulaPath', null\)\)/);
    expect(appSource).toMatch(/event\.preventDefault\(\);\s*navigate\(-1\);/);
  });
  it('T54 的 lastFormulaPath 记录和 formulaTabTarget 的调用没动；路由表没动', () => {
    expect(appSource).toMatch(/if \(isFormulaPath\(pathname\)\) setUi\('lastFormulaPath', pathname\);/);
    expect(appSource).toMatch(/formulaTabTarget\(\s*pathname,\s*getUi<string \| null>\('lastFormulaPath', null\),\s*getUi<string \| null>\('lastCaseId', null\),\s*\)/);
    for (const r of ['path="/"', 'path="/set/:setId"', 'path="/case/:caseId"', 'path="/search"', 'path="/practice"', 'path="/me"', 'path="*"']) {
      expect(appSource, r).toContain(r);
    }
  });
});
