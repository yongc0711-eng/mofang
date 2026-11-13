import { createElement } from 'react';
import { renderToStaticMarkup } from 'react-dom/server';
import { describe, expect, it } from 'vitest';
import cardSource from '../components/CaseCard.tsx?raw';
import { CaseDiagram } from '../components/CaseDiagram';
import { ALL_CASES, SETS, getCase } from '../data';
import homeSource from '../pages/HomePage.tsx?raw';
import practiceSource from '../pages/PracticePage.tsx?raw';
import { BOTTOM_COLORS, frontColor, topColor, type BottomColor } from '../store/devicePrefs';
import { COLOR_NAME_ZH } from './recognition';
import { setupText } from './setupText';

/** T25 的原文（提交 16388ab）。白底输出必须逐字相同 */
const T25_TEXT =
  '白色中心朝上、绿色中心朝前起手；做完把魔方绕前后轴原地转 180°：黄顶朝上、白底朝下，绿色仍在前（不是前倾 90°）。';

describe('frontColor：由 displayFace 推出的前色', () => {
  const EXPECTED: Record<BottomColor, BottomColor> = {
    white: 'green',
    yellow: 'green',
    red: 'green',
    orange: 'green',
    green: 'yellow',
    blue: 'white',
  };

  it('白、黄、红、橙 → 绿；绿 → 黄；蓝 → 白', () => {
    for (const b of BOTTOM_COLORS) expect(frontColor(b), b).toBe(EXPECTED[b]);
  });

  it('前色既不是底色也不是顶色（三个朝向的颜色两两不同）', () => {
    for (const b of BOTTOM_COLORS) {
      expect(new Set([b, topColor(b), frontColor(b)]).size, b).toBe(3);
    }
  });
});

describe('setupText：练习页 setup 的朝向说明', () => {
  it('白底：与 T25 原文逐字相同', () => {
    expect(setupText('white')).toBe(T25_TEXT);
  });

  const EXPECTED: Record<BottomColor, string> = {
    white: T25_TEXT,
    yellow: '黄色中心朝上、绿色中心朝前起手；做完把魔方绕前后轴原地转 180°：白顶朝上、黄底朝下，绿色仍在前（不是前倾 90°）。',
    red: '红色中心朝上、绿色中心朝前起手；做完把魔方绕前后轴原地转 180°：橙顶朝上、红底朝下，绿色仍在前（不是前倾 90°）。',
    orange: '橙色中心朝上、绿色中心朝前起手；做完把魔方绕前后轴原地转 180°：红顶朝上、橙底朝下，绿色仍在前（不是前倾 90°）。',
    green: '绿色中心朝上、黄色中心朝前起手；做完把魔方绕前后轴原地转 180°：蓝顶朝上、绿底朝下，黄色仍在前（不是前倾 90°）。',
    blue: '蓝色中心朝上、白色中心朝前起手；做完把魔方绕前后轴原地转 180°：绿顶朝上、蓝底朝下，白色仍在前（不是前倾 90°）。',
  };

  for (const b of BOTTOM_COLORS) {
    it(`${b} 底：整句逐字符合`, () => {
      expect(setupText(b)).toBe(EXPECTED[b]);
    });
  }

  it('六句各不相同，每句里底色、前色、顶色三个名字都在', () => {
    expect(new Set(BOTTOM_COLORS.map(setupText)).size).toBe(6);
    for (const b of BOTTOM_COLORS) {
      const t = setupText(b);
      for (const color of [b, frontColor(b), topColor(b)]) expect(t, `${b} ${color}`).toContain(COLOR_NAME_ZH[color]);
    }
  });

  it('句式固定：只有颜色名变，其余文字一字不差', () => {
    const skeleton = (text: string) => text.replace(/[白黄红橙绿蓝]/g, '·');
    const base = skeleton(T25_TEXT);
    for (const b of BOTTOM_COLORS) expect(skeleton(setupText(b)), b).toBe(base);
  });
});

describe('练习页、卡片、首页都接上了底色', () => {
  const diagramWithPalette = /<CaseDiagram\b[^>]*\bpalette=\{(?:palette|browsePalette\(cover, prefs\))\}/;

  it('CaseCard/HomePage 使用方法 palette，PracticePage 使用本题底色', () => {
    for (const [name, src] of [['CaseCard', cardSource], ['HomePage', homeSource]] as const) {
      expect(src, name).toMatch(diagramWithPalette);
      expect(src, name).toContain('useDevicePrefs()');
      expect(src, name).toContain(name === 'CaseCard' ? 'browsePalette(c, prefs)' : 'browsePalette(cover, prefs)');
    }
    expect(practiceSource).toMatch(/<CaseDiagram\b[^>]*\bbottom=\{bottom\}/);
    expect(practiceSource).toContain('useDevicePrefs()');
  });

  it('练习页的说明走 setupText；写死的白色文案没了；打乱和 WCA 说明原样保留', () => {
    expect(practiceSource).toContain('setupText(bottom)');
    expect(practiceSource).not.toContain('白色中心朝上');
    expect(practiceSource).toContain('摆出情形（setup）');
    expect(practiceSource).toContain("{scramble || '（已还原）'}");
    expect(practiceSource).toContain('定点练习的 setup 是这条公式的逆，用来精确摆出情形；WCA 4b3 的随机打乱用于比赛，不能瞄准某个情形。');
  });
});

describe('各处图解的底色：默认白色不改变现有颜色；top 视图也跟着换', () => {
  const render = (c: (typeof ALL_CASES)[number], view: 'top' | 'iso' | 'lse', bottom?: BottomColor) =>
    renderToStaticMarkup(createElement(CaseDiagram, { c, view, bottom }));

  it('默认（不传）和白色逐字相同：卡片、练习页用的是每组自己的视图，覆盖全部三阶情形', () => {
    const sets3x3 = SETS.filter((s) => s.method !== '2x2');
    expect(sets3x3).toHaveLength(9);
    for (const s of sets3x3) {
      if (s.view === 'top2' || s.view === 'both2') throw new Error(`unexpected 2x2 view: ${s.id}`);
      for (const c of s.cases) expect(render(c, s.view, 'white'), c.id).toBe(render(c, s.view));
    }
  });

  it('首页封面（LSE 用 top 视图）：默认与白色一致', () => {
    for (const id of ['f2l-5', 'oll-27', 'pll-t', 'cmll-s-1', 'lse-eo-7']) {
      const c = getCase(id)!;
      const set = SETS.find((s) => s.id === c.set)!;
      if (set.view === 'top2' || set.view === 'both2') throw new Error(`unexpected 2x2 view: ${set.id}`);
      const view = set.view === 'lse' ? 'top' : set.view;
      expect(render(c, view, 'white'), id).toBe(render(c, view));
    }
  });

  /** 黄底是 z2：U↔D、R↔L，F、B 不变。把白底的标记按这个换一遍，应当得到黄底的标记 */
  const swapZ2 = (html: string) =>
    html
      .replaceAll('--cube-u)', '--cube-X)')
      .replaceAll('--cube-d)', '--cube-u)')
      .replaceAll('--cube-X)', '--cube-d)')
      .replaceAll('--cube-r)', '--cube-Y)')
      .replaceAll('--cube-l)', '--cube-r)')
      .replaceAll('--cube-Y)', '--cube-l)');

  it('top 视图（首页 LSE 封面、OLL 等）：黄底 = 白底按 z2 换色，位置和灰格都不变', () => {
    for (const id of ['lse-eo-7', 'oll-27', 'pll-t', 'cmll-s-1', 'f2l-5']) {
      const c = getCase(id)!;
      expect(render(c, 'top', 'yellow'), id).toBe(swapZ2(render(c, 'top')));
    }
  });

  it('iso 和 lse 视图同样按 z2 换色', () => {
    expect(render(getCase('oll-27')!, 'iso', 'yellow')).toBe(swapZ2(render(getCase('oll-27')!, 'iso')));
    expect(render(getCase('lse-eo-7')!, 'lse', 'yellow')).toBe(swapZ2(render(getCase('lse-eo-7')!, 'lse')));
  });

  it('非白底时 top 视图的颜色确实变了（封面不会还是标准配色）', () => {
    const c = getCase('lse-eo-7')!;
    for (const b of BOTTOM_COLORS.filter((x) => x !== 'white')) expect(render(c, 'top', b), b).not.toBe(render(c, 'top'));
  });
});
