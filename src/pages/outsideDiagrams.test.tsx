import { createElement } from 'react';
import { renderToStaticMarkup } from 'react-dom/server';
import { MemoryRouter } from 'react-router-dom';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { CaseCard, practiceViewFor, viewForPrimary } from '../components/CaseCard';
import { CaseDiagram } from '../components/CaseDiagram';
import { ALL_CASES, getCase, getSet } from '../data';
import { caseState, viewCaseFor } from '../lib/cases';
import { applyMoves, solved } from '../lib/cube';
import { parseAlg } from '../lib/alg';
import { scrambleFor } from '../lib/practice';
import { primaryAlgOf } from '../store/userStore';
import { type UserData } from '../types';
import casePageSource from '../pages/CasePage.tsx?raw';
import homeSource from '../pages/HomePage.tsx?raw';
import practiceSource from '../pages/PracticePage.tsx?raw';
import cardSource from '../components/CaseCard.tsx?raw';
import { type AlgCase } from '../types';

// 测试环境是 node，useSyncExternalStore 没有 getServerSnapshot 不能做服务端渲染，
// 所以把订阅换成可设置的当前值；primaryAlgOf 等其余逻辑仍是真实实现。
const store = vi.hoisted(() => ({ user: { version: 1, cases: {} } as import('../types').UserData }));
vi.mock('../store/userStore', async (orig) => ({
  ...(await orig<typeof import('../store/userStore')>()),
  useUserData: () => store.user,
}));
vi.mock('../store/devicePrefs', async (orig) => ({
  ...(await orig<typeof import('../store/devicePrefs')>()),
  useDevicePrefs: () => ({ finish: 'matte', focusRelevant: false, bottomColor: 'white' }),
}));
const setPrimary = (c: AlgCase, alg: string | null) => {
  const cases: UserData['cases'] = alg ? { [c.id]: { primaryAlg: alg, customAlgs: [alg] } } : {};
  store.user = { version: 1, cases };
};
beforeEach(() => setPrimary(ALL_CASES[0], null));

/** 带前置 U 的主公式：对顶层整体转动不敏感的组（OLL/PLL/CMLL）里，在 algs[0] 前加 U 仍解决同一情形 */
const withPreU = (c: AlgCase) => `U ${c.algs[0]}`;
const preUCases = ALL_CASES.filter((c) => ['oll', 'pll', 'cmll'].includes(c.set) && viewCaseFor(c, withPreU(c)) !== c);

const card = (c: AlgCase) =>
  renderToStaticMarkup(createElement(MemoryRouter, null, createElement(CaseCard, { c })));
const diagram = (c: AlgCase) => {
  const set = getSet(c.set)!;
  // CaseCard 里 CaseDiagram 的 props：view 取自公式组，bottom 默认白
  return renderToStaticMarkup(createElement(CaseDiagram, { c, view: set.view, bottom: 'white' }));
};

describe('T33 外面的图解跟主公式对齐', () => {
  it('有带前置 U 的主公式可测（前提）', () => {
    expect(preUCases.length).toBeGreaterThan(20);
    for (const c of preUCases.slice(0, 20)) {
      expect(caseState(viewCaseFor(c, withPreU(c)))).not.toEqual(caseState(c));
    }
  });

  it('CaseCard：主公式带前置 U 时，图解与 viewCaseFor(c, primary) 一致，且不同于 algs[0] 的图解', () => {
    for (const id of ['pll-ua', 'oll-27', 'cmll-1']) {
      const c = getCase(id) ?? preUCases.find((x) => x.set === id.split('-')[0])!;
      const alg = withPreU(c);
      if (viewCaseFor(c, alg) === c) continue;
      setPrimary(c, alg);
      expect(primaryAlgOf(c, store.user)).toBe(alg);
      const html = card(c);
      const view = viewCaseFor(c, alg);
      expect(html).toContain(diagram(view));
      expect(html).not.toContain(diagram(c));
    }
  });

  it('CaseCard：主公式变了立刻生效（订阅 useUserData），改回 algs[0] 就回到原样', () => {
    const c = preUCases[0];
    const alg = withPreU(c);
    expect(card(c)).toContain(diagram(c));
    setPrimary(c, alg);
    expect(card(c)).toContain(diagram(viewCaseFor(c, alg)));
    setPrimary(c, c.algs[0]);
    expect(card(c)).toContain(diagram(c));
  });

  it('CaseCard：无主公式时和改动前完全一致（所有情形）', () => {
    for (const c of ALL_CASES) expect(card(c)).toContain(diagram(c));
  });

  it('viewForPrimary：主公式就是 algs[0] 时原样返回同一个对象，不解析', () => {
    for (const c of ALL_CASES) expect(viewForPrimary(c, c.algs[0])).toBe(c);
  });

  it('359 条全部：带前置 U 的主公式下 viewForPrimary 和渲染都不抛错', () => {
    expect(ALL_CASES.length).toBe(359);
    for (const c of ALL_CASES) {
      for (const alg of [withPreU(c), c.algs[c.algs.length - 1], 'not an alg ((']) {
        expect(() => diagram(viewForPrimary(c, alg))).not.toThrow();
      }
    }
  });

  it('解决不了情形的主公式回退到 c，不画错起手', () => {
    const c = ALL_CASES[0];
    expect(viewForPrimary(c, 'R U R\' U\'')).toBe(c);
    expect(viewForPrimary(c, 'not an alg ((')).toBe(c);
  });

  it('练习：practiceViewFor 的 scramble 从还原态应用后等于 caseState(view)，且与 algs[0] 的不同', () => {
    let aligned = 0;
    for (const c of preUCases) {
      const { view, scramble } = practiceViewFor(c, withPreU(c), () => 0);
      expect(applyMoves(solved(), parseAlg(scramble)), c.id).toEqual(caseState(view));
      if (view !== c) {
        aligned++;
        expect(scramble, c.id).not.toBe(scrambleFor(c, () => 0));
        expect(view.algs, c.id).toEqual([withPreU(c)]);
      }
    }
    expect(aligned).toBeGreaterThan(20);
  });

  it('练习：前置 U 夹在整体转体前面时 scrambleFor(view) 会抛，practiceViewFor 整题回退到 c，不崩', () => {
    const aa = getCase('pll-aa')!;
    const alg = withPreU(aa);
    expect(viewCaseFor(aa, alg)).not.toBe(aa);
    expect(() => scrambleFor(viewForPrimary(aa, alg))).toThrow();
    const r = practiceViewFor(aa, alg, () => 0);
    expect(r.view).toBe(aa);
    expect(r.scramble).toBe(scrambleFor(aa, () => 0));
  });

  it('练习：无主公式（alg 就是 algs[0]）时和改动前一样', () => {
    for (const c of ALL_CASES) {
      const r = practiceViewFor(c, c.algs[0], () => 0);
      expect(r.view).toBe(c);
      expect(r.scramble).toBe(scrambleFor(c, () => 0));
    }
  });

  it('接线：三处外面的图解都用 viewForPrimary + primaryAlgOf，练习的 setup 和恢复都按 view 算', () => {
    expect(cardSource).toMatch(/<CaseDiagram c=\{view\}/);
    expect(homeSource).toMatch(/viewForPrimary\(cover, primaryAlgOf\(cover, user\)\)/);
    expect(practiceSource).toMatch(/const \{ view, scramble \} = practiceViewFor\(c, alg\)/);
    expect(practiceSource).toMatch(/setQuestion\(\{ c: view, alg, scramble, colors \}\)/);
    expect(practiceSource).not.toMatch(/scrambleFor\(/);
    // 恢复：从 id + alg 重建 view；alg 不是 algs[0] 时重算 scramble
    expect(practiceSource).toMatch(/practiceViewFor\(base, alg\)/);
    expect(practiceSource).toMatch(/view === base \? restore\.question\.scramble : scramble/);
  });

  it('CasePage 没被改：仍按当前选中/播放的公式走，不用 viewForPrimary', () => {
    expect(casePageSource).toMatch(/viewCaseFor\(c, playing\)/);
    expect(casePageSource).not.toMatch(/viewForPrimary/);
  });
});
