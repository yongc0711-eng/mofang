import { describe, expect, it } from 'vitest';
import appSource from '../App.tsx?raw';
import casePageSource from '../pages/CasePage.tsx?raw';
import { ALL_CASES } from '../data';
import { formulaTabTarget, isFormulaPath } from './nav';
import { getUi, setUi } from './uiState';

describe('formulaTabTarget：底部“公式”tab 的目标', () => {
  it("已经在公式区：'/'、'/set/x'、'/case/x' 都回 '/'（有没有记录都一样）", () => {
    for (const p of ['/', '/set/oll', '/set/f2l', '/case/cmll-o-1', '/case/x']) {
      expect(formulaTabTarget(p, null), p).toBe('/');
      expect(formulaTabTarget(p, 'cmll-o-1'), p).toBe('/');
    }
  });

  it("在别的 tab：'/me'、'/search'、'/practice' + 记录 → 上次的详情页", () => {
    for (const p of ['/me', '/search', '/practice']) {
      expect(formulaTabTarget(p, 'cmll-o-1'), p).toBe('/case/cmll-o-1');
    }
  });

  it("在别的 tab 且没有记录（null、undefined、空串）→ '/'", () => {
    for (const p of ['/me', '/search', '/practice']) {
      expect(formulaTabTarget(p, null), p).toBe('/');
      expect(formulaTabTarget(p, undefined), p).toBe('/');
      expect(formulaTabTarget(p, ''), p).toBe('/');
    }
  });

  it('不会把 /me 之类误当成公式区；/setx、/cases 这种前缀相似的也不算', () => {
    for (const p of ['/me', '/search', '/practice', '/setx', '/cases', '/case']) expect(isFormulaPath(p), p).toBe(false);
    for (const p of ['/', '/set/oll', '/case/oll-27']) expect(isFormulaPath(p), p).toBe(true);
  });

  it('所有真实情形的 id 都能拼出对应的详情页路径', () => {
    for (const c of ALL_CASES) expect(formulaTabTarget('/me', c.id), c.id).toBe(`/case/${c.id}`);
  });
});

describe('接线（源码文本）与内存状态', () => {
  it('CasePage 在 case 有效时 setUi(\'lastCaseId\', id)，不写 localStorage / userStore', () => {
    expect(casePageSource).toMatch(/const validId = c\?\.id;/);
    expect(casePageSource).toMatch(/if \(validId\) setUi\('lastCaseId', validId\);/);
    expect(casePageSource).toMatch(/\}, \[validId\]\);/);
    expect(casePageSource.match(/lastCaseId/g)).toHaveLength(1);
    const idx = casePageSource.indexOf("setUi('lastCaseId'");
    expect(casePageSource.slice(idx - 200, idx + 100)).not.toMatch(/localStorage/);
  });

  it('App 只调用 formulaTabTarget：公式 tab 的 to 来自它，路由表没动', () => {
    expect(appSource).toMatch(/formulaTabTarget\(pathname, getUi<string \| null>\('lastCaseId', null\)\)/);
    expect(appSource).toMatch(/<NavLink to=\{formulaTo\} replace className=/); // T53：加了 replace
    expect(appSource).not.toMatch(/<NavLink to="\/" /);
    for (const r of ['path="/"', 'path="/set/:setId"', 'path="/case/:caseId"', 'path="/search"', 'path="/practice"', 'path="/me"', 'path="*"']) {
      expect(appSource, r).toContain(r);
    }
  });

  it('T49 的选中记忆没动：CasePage 仍用 readCaseSelection / rememberCaseSelection，刷新后重置', () => {
    expect(casePageSource).toContain("import { readCaseSelection, rememberCaseSelection } from '../lib/caseSelection';");
    expect(casePageSource).toMatch(/readCaseSelection\(c, user\.cases\[c\.id\]\?\.customAlgs \?\? \[\]\)/);
  });

  it('uiState 是内存 Map：存了能读，没存读到 null（刷新后就是这个状态）', () => {
    expect(getUi<string | null>('lastCaseId', null)).toBeNull();
    setUi('lastCaseId', 'oll-27');
    expect(getUi<string | null>('lastCaseId', null)).toBe('oll-27');
    setUi('lastCaseId', 'cmll-o-1');
    expect(formulaTabTarget('/practice', getUi<string | null>('lastCaseId', null))).toBe('/case/cmll-o-1');
  });
});
