import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import sceneSource from '../components/CubeScene.ts?raw';
import caseDiagramSource from '../components/CaseDiagram.tsx?raw';
import cardSource from '../components/CaseCard.tsx?raw';
import { CaseDiagram, diagramColors } from '../components/CaseDiagram';
import { getSet, METHODS } from '../data';
import casePageSource from '../pages/CasePage.tsx?raw';
import homeSource from '../pages/HomePage.tsx?raw';
import mePageSource from '../pages/MePage.tsx?raw';
import practiceSource from '../pages/PracticePage.tsx?raw';
import { createElement } from 'react';
import { renderToStaticMarkup } from 'react-dom/server';
import { caseState, displayColors, displayMask, SET_RULES } from '../lib/cases';
import { applyMoves, solved, stickerAt, STICKERS } from '../lib/cube';
import { ALL_CASES } from '../data';
import {
  BOTTOM_COLORS,
  BOTTOM_ROTATION,
  FACE_COLOR,
  diagramMask,
  displayFace,
  ollTopMask,
  playerMask,
  type BottomColor,
} from './devicePrefs';

const KEY = 'mofang.device.v1';

/** 内存版 localStorage，每个测试一份 */
function installStorage(initial: Record<string, string> = {}) {
  const m = new Map(Object.entries(initial));
  const storage = {
    getItem: (k: string) => m.get(k) ?? null,
    setItem: (k: string, v: string) => void m.set(k, v),
    removeItem: (k: string) => void m.delete(k),
  };
  vi.stubGlobal('localStorage', storage);
  return m;
}

/** 模块在加载时读 localStorage，所以每次都重新加载 */
async function freshModule() {
  vi.resetModules();
  return import('./devicePrefs');
}

const countIds = (mask: (id: number) => boolean) => STICKERS.filter((s) => mask(s.id)).length;

describe('devicePrefs：默认值与持久化（ollView 已在 T32 删除，旧数据里的 ollView 被忽略）', () => {
  beforeEach(() => vi.unstubAllGlobals());
  afterEach(() => vi.unstubAllGlobals());

  it('没有 localStorage（node）：默认值里没有 ollView', async () => {
    vi.stubGlobal('localStorage', undefined);
    const { getDevicePrefs } = await freshModule();
    expect(getDevicePrefs()).toEqual({ finish: 'uv', focusRelevant: false, bottomColor: 'white', cfop: { bottomColor: 'white' }, roux: { bottomColor: 'white', bridgePair: 'red-orange', leftColor: 'red' } });
    expect('ollView' in getDevicePrefs()).toBe(false);
  });

  it('存储为空：同样没有 ollView', async () => {
    installStorage();
    const { getDevicePrefs } = await freshModule();
    expect('ollView' in getDevicePrefs()).toBe(false);
  });

  it('旧数据带着 ollView（T27 存的 top / full / 乱写的值）：直接忽略，其他设置保留', async () => {
    for (const old of ['top', 'full', 'sideways', 42, null, {}, ['full']]) {
      installStorage({ [KEY]: JSON.stringify({ finish: 'matte', focusRelevant: true, ollView: old, bottomColor: 'red' }) });
      const { getDevicePrefs } = await freshModule();
      expect(getDevicePrefs(), String(old)).toEqual({ finish: 'matte', focusRelevant: true, bottomColor: 'red', cfop: { bottomColor: 'red' }, roux: { bottomColor: 'red', bridgePair: 'white-yellow', leftColor: 'yellow' } });
      expect('ollView' in getDevicePrefs(), String(old)).toBe(false);
    }
  });

  it('旧数据带着 ollView：之后再保存别的设置，ollView 不会被写回去', async () => {
    const m = installStorage({ [KEY]: JSON.stringify({ finish: 'uv', focusRelevant: false, ollView: 'full' }) });
    const { setDevicePrefs } = await freshModule();
    setDevicePrefs({ focusRelevant: true });
    expect(JSON.parse(m.get(KEY)!)).toEqual({ finish: 'uv', focusRelevant: true, bottomColor: 'white', cfop: { bottomColor: 'white' }, roux: { bottomColor: 'white', bridgePair: 'red-orange', leftColor: 'red' } });
  });

  it('旧数据缺某一项：用默认值，已有的设置不丢', async () => {
    installStorage({ [KEY]: JSON.stringify({ finish: 'matte', focusRelevant: true }) });
    const { getDevicePrefs } = await freshModule();
    expect(getDevicePrefs()).toEqual({ finish: 'matte', focusRelevant: true, bottomColor: 'white', cfop: { bottomColor: 'white' }, roux: { bottomColor: 'white', bridgePair: 'red-orange', leftColor: 'red' } });
  });

  it('JSON 损坏：整体回到默认值，不抛', async () => {
    installStorage({ [KEY]: '{oops' });
    const { getDevicePrefs } = await freshModule();
    expect(getDevicePrefs()).toEqual({ finish: 'uv', focusRelevant: false, bottomColor: 'white', cfop: { bottomColor: 'white' }, roux: { bottomColor: 'white', bridgePair: 'red-orange', leftColor: 'red' } });
  });

  it('设置后立刻生效，并写进 mofang.device.v1；只改一项不影响其他项', async () => {
    const m = installStorage();
    const { getDevicePrefs, setDevicePrefs } = await freshModule();
    setDevicePrefs({ focusRelevant: true });
    expect(getDevicePrefs()).toEqual({ finish: 'uv', focusRelevant: true, bottomColor: 'white', cfop: { bottomColor: 'white' }, roux: { bottomColor: 'white', bridgePair: 'red-orange', leftColor: 'red' } });
    expect(JSON.parse(m.get(KEY)!)).toEqual({ finish: 'uv', focusRelevant: true, bottomColor: 'white', cfop: { bottomColor: 'white' }, roux: { bottomColor: 'white', bridgePair: 'red-orange', leftColor: 'red' } });
    setDevicePrefs({ finish: 'matte' });
    expect(getDevicePrefs().focusRelevant).toBe(true);
  });

  it('重新加载后读回刚保存的值', async () => {
    const m = installStorage();
    const first = await freshModule();
    first.setDevicePrefs({ focusRelevant: true });
    const second = await freshModule();
    expect(second.getDevicePrefs().focusRelevant).toBe(true);
    expect(m.has(KEY)).toBe(true);
  });

  it('按设备存，不进备份：备份里没有这些设置，导入备份也不改它', async () => {
    const m = installStorage();
    vi.resetModules();
    const prefs = await import('./devicePrefs');
    const user = await import('./userStore');
    prefs.setDevicePrefs({ focusRelevant: true });
    expect(user.exportUserData()).not.toContain('focusRelevant');
    expect(user.exportUserData()).not.toContain('ollView');
    expect(user.exportUserData()).not.toContain('finish');
    user.importUserData(JSON.stringify({ version: 1, cases: {} }));
    expect(prefs.getDevicePrefs().focusRelevant).toBe(true);
    expect(JSON.parse(m.get(KEY)!).focusRelevant).toBe(true);
  });
});

describe('ollTopMask / diagramMask / playerMask：2D 和 3D 的掩码分开', () => {
  const oll = getSet('oll')!.cases[0];
  const pll = getSet('pll')!.cases[0];
  const lse = getSet('lse')!.cases.find((c) => c.group === 'EO')!;
  const f2l = getSet('f2l')!.cases[0];
  const cmll = getSet('cmll')!.cases[0];
  const NON_OLL = [pll, lse, f2l, cmll];
  const prefs = (focusRelevant: boolean) => ({ focusRelevant });

  it('ollTopMask：恰好 9 块，都是原本属于 U 面的贴纸', () => {
    expect(countIds(ollTopMask)).toBe(9);
    expect(STICKERS.filter((s) => ollTopMask(s.id)).every((s) => s.face === 'U')).toBe(true);
  });

  it('ollTopMask 是 OLL 显示掩码（顶层 21 格）的子集', () => {
    const full = displayMask(oll);
    expect(STICKERS.filter((s) => ollTopMask(s.id)).every((s) => full(s.id))).toBe(true);
    expect(countIds(full)).toBe(21);
  });

  it('diagramMask：OLL 固定 ollTopMask，“只看相关的块”开不开都一样', () => {
    for (const on of [false, true]) {
      const m = diagramMask(oll, prefs(on))!;
      expect(m, String(on)).toBe(ollTopMask);
      expect(countIds(m), String(on)).toBe(9);
    }
  });

  const OTHER = [lse, f2l, cmll];

  it('diagramMask：非 OLL 组开关生效——没开是 null；开了 PLL 是顶层 21 张，其余组是该组的显示掩码', () => {
    for (const c of NON_OLL) expect(diagramMask(c, prefs(false)), `${c.set} off`).toBeNull();
    for (const c of OTHER) expect(diagramMask(c, prefs(true)), `${c.set} on`).toBe(displayMask(c));
    expect(countIds(diagramMask(pll, prefs(true))!)).toBe(21);
  });

  it('playerMask：所有组没开是 null（完整魔方）；开了 OLL 9 张、PLL 21 张、其余组是该组的显示掩码', () => {
    for (const c of [oll, ...NON_OLL]) expect(playerMask(c, prefs(false)), `${c.set} off`).toBeNull();
    for (const c of OTHER) expect(playerMask(c, prefs(true)), `${c.set} on`).toBe(displayMask(c));
    expect(countIds(playerMask(oll, prefs(true))!)).toBe(9);
    expect(countIds(playerMask(pll, prefs(true))!)).toBe(21);
  });

  it('OLL 的 3D：默认 null（完整魔方）；开了只有顶面 9 张，和 2D 是同一批贴纸', () => {
    expect(playerMask(oll, prefs(false))).toBeNull();
    const on = playerMask(oll, prefs(true))!;
    expect(countIds(on)).toBe(9);
    expect(on).toBe(ollTopMask);
    for (const s of STICKERS) expect(on(s.id)).toBe(diagramMask(oll, prefs(true))!(s.id));
    // SET_RULES.oll.display 仍是 21 格，没有被收窄
    expect(countIds(SET_RULES.oll.display)).toBe(21);
  });

  it('PLL：关 = 完整 54 张（2D 默认和 3D 都是），开 = 顶层 21 张（顶面 9 + 四周顶行 12），2D 和 3D 同步', () => {
    expect(diagramMask(pll, prefs(false))).toBeNull();
    expect(playerMask(pll, prefs(false))).toBeNull();
    expect(displayColors(pll).filter((x) => x !== null)).toHaveLength(54);
    const on = playerMask(pll, prefs(true))!;
    expect(countIds(on)).toBe(21);
    expect(STICKERS.filter((s) => on(s.id)).filter((s) => s.face === 'U')).toHaveLength(9);
    expect(STICKERS.filter((s) => on(s.id)).filter((s) => s.face !== 'U' && s.face !== 'D')).toHaveLength(12);
    for (const s of STICKERS) expect(on(s.id)).toBe(diagramMask(pll, prefs(true))!(s.id));
    // 开启时 PLL 的 2D 图解只有 21 格有颜色；SET_RULES.pll.display 不变，仍是全部 54 张
    expect(diagramColors(pll, on).filter((x) => x !== null)).toHaveLength(21);
    expect(countIds(SET_RULES.pll.display)).toBe(54);
  });

  it('OLL 的 2D 和 3D 默认不同（2D 固定 9 张，3D 完整），开了之后是同一个 9 张', () => {
    expect(diagramMask(oll, prefs(false))).not.toBe(playerMask(oll, prefs(false)));
    expect(diagramMask(oll, prefs(true))).toBe(playerMask(oll, prefs(true)));
  });

  it('caseMask 和 DevicePrefs.ollView 已删除', async () => {
    vi.stubGlobal('localStorage', undefined);
    const mod = await freshModule();
    expect('caseMask' in mod).toBe(false);
    expect('ollView' in mod.getDevicePrefs()).toBe(false);
    vi.unstubAllGlobals();
  });
});

describe('图解按 mask 显示（CaseDiagram 用的 diagramColors）', () => {
  const oll = getSet('oll')!.cases[0];
  const nonOll = ALL_CASES.filter((c) => c.set !== 'oll');

  it('其他组不传或 null：用该组默认的显示规则，和以前完全一样', () => {
    for (const c of nonOll) {
      expect(diagramColors(c), c.id).toEqual(displayColors(c));
      expect(diagramColors(c, null), c.id).toEqual(displayColors(c));
      expect(diagramColors(c, undefined), c.id).toEqual(displayColors(c));
    }
  });

  it('OLL 不传或 null：默认只显示顶层的 9 张（U 面原本的贴纸），都是 U 色，其余是 null', () => {
    for (const c of ALL_CASES.filter((x) => x.set === 'oll')) {
      for (const colors of [diagramColors(c), diagramColors(c, null), diagramColors(c, undefined)]) {
        const shown = colors.filter((x) => x !== null);
        expect(shown, c.id).toHaveLength(9);
        expect(shown.every((f) => f === 'U'), c.id).toBe(true);
      }
    }
  });

  it('OLL 默认和 displayColors 不再相同（displayColors 本身仍是 21 格，T20 的测试不变）', () => {
    expect(diagramColors(oll)).not.toEqual(displayColors(oll));
    expect(displayColors(oll).filter((x) => x !== null)).toHaveLength(21);
  });

  it('显式传的 mask 优先：OLL 传该组的显示掩码，得到原来的 21 格', () => {
    expect(diagramColors(oll, displayMask(oll))).toEqual(displayColors(oll));
    expect(diagramColors(oll, displayMask(oll)).filter((x) => x !== null)).toHaveLength(21);
  });

  it('显式传的 mask 优先：其他组传 ollTopMask，就只显示 9 张', () => {
    const pll = getSet('pll')!.cases[0];
    expect(diagramColors(pll, ollTopMask).filter((x) => x !== null)).toHaveLength(9);
  });

  it('同一个 mask 在 2D 和 3D 里选中的是同一批贴纸', () => {
    // 3D 是 state[位置] 的贴纸编号过 mask；2D 是同一个判断
    const st = caseState(oll);
    const fromScene = st.map((id) => (ollTopMask(id) ? STICKERS[id].face : null));
    expect(diagramColors(oll, ollTopMask)).toEqual(fromScene);
    expect(diagramColors(oll)).toEqual(fromScene);
  });

  it('OLL 默认的 2D 图解里，顶层以外一格颜色都没有', () => {
    const colors = diagramColors(oll);
    STICKERS.forEach((s) => {
      if (s.p[1] !== 1) expect(colors[s.id], `sticker ${s.id}`).toBeNull();
    });
  });
});

describe('渲染出来的 OLL 图解：默认 9 张，显式 mask 优先，其他组不变', () => {
  const oll = getSet('oll')!.cases[0];
  const pll = getSet('pll')!.cases[0];
  const html = (props: Record<string, unknown>) =>
    renderToStaticMarkup(createElement(CaseDiagram, props as unknown as Parameters<typeof CaseDiagram>[0]));
  const colored = (markup: string, tag: 'rect' | 'polygon') =>
    [...markup.matchAll(new RegExp(`<${tag}\\b[^>]*fill="([^"]*)"`, 'g'))].map((m) => m[1]).filter((v) => !v.includes('mask'));

  it('top 视图：OLL 默认 21 个格子里只有 9 个有颜色，且都是 U 色', () => {
    const shown = colored(html({ c: oll, view: 'top' }), 'rect');
    expect(shown).toHaveLength(9);
    expect(new Set(shown)).toEqual(new Set(['var(--cube-u)']));
  });

  it('iso 视图：OLL 默认只有 U 色的块有颜色', () => {
    const shown = colored(html({ c: oll, view: 'iso' }), 'polygon');
    expect(shown.length).toBeGreaterThan(0);
    expect(new Set(shown)).toEqual(new Set(['var(--cube-u)']));
  });

  it('显式传 mask={displayMask(c)}：top 视图 21 格都有颜色', () => {
    expect(colored(html({ c: oll, view: 'top', mask: displayMask(oll) }), 'rect')).toHaveLength(21);
  });

  it('其他组：默认渲染和显式传 displayMask 完全一样', () => {
    for (const view of ['top', 'iso'] as const) {
      expect(html({ c: pll, view })).toBe(html({ c: pll, view, mask: displayMask(pll) }));
    }
  });

  it('卡片、首页、练习页不传 mask，靠 CaseDiagram 的默认：OLL 在这些地方自动变成 9 张', () => {
    for (const [name, src] of [['CaseCard', cardSource], ['HomePage', homeSource], ['PracticePage', practiceSource]] as const) {
      expect(src, name).toMatch(/<CaseDiagram\b/);
      expect(src, name).not.toMatch(/<CaseDiagram\b[^>]*\bmask=/);
    }
    expect(caseDiagramSource).toContain("c.set === 'oll' ? ollTopMask : null");
  });
});

describe('CasePage 和「我的」页的接线（T32）', () => {
  it('2D 用 diagramMask、3D 用 playerMask，两个掩码分开算', () => {
    expect(casePageSource).toContain('diagramMask(');
    expect(casePageSource).toContain('playerMask(');
    expect(casePageSource).toMatch(/<CaseDiagram\b[^>]*\bmask=\{maskFor2D\}/);
    expect(casePageSource).toMatch(/<CubePlayer\b[^>]*\bmask=\{maskFor3D\}/);
    expect(casePageSource).toMatch(/const maskFor2D = useMemo\([\s\S]*?diagramMask\(/);
    expect(casePageSource).toMatch(/const maskFor3D = useMemo\([\s\S]*?playerMask\(/);
  });

  it('“只看相关的块”按钮对 OLL 也显示：不再有 c.set !== \'oll\' 的条件', () => {
    // 按钮文字（标签之间的那一处），注释里的提及不算
    expect(casePageSource.match(/>\s*只看相关的块\s*</g)?.length).toBe(1);
    expect(casePageSource).not.toMatch(/c\.set\s*!==\s*'oll'/);
    expect(casePageSource).toMatch(/focus-chip/);
  });

  it('没有残留：CasePage 不再引用 caseMask、ollView', () => {
    expect(casePageSource).not.toContain('caseMask');
    expect(casePageSource).not.toContain('ollView');
  });

  it('「我的」页删除了“OLL 识别视图”设置和它的说明', () => {
    expect(mePageSource).not.toContain('OLL 识别视图');
    expect(mePageSource).not.toContain('ollView');
    expect(mePageSource).not.toContain('顶面 9 格');
    // 其他设置还在
    expect(mePageSource).toContain('魔方表面');
    expect(mePageSource).not.toContain('<h2>底面颜色</h2>');
    expect(mePageSource).not.toContain('aria-label="底面颜色"');
    expect(mePageSource).not.toContain('setDevicePrefs({ bottomColor:');
    expect(METHODS.map(({ id, name }) => ({ id, name }))).toEqual([{ id: 'cfop', name: 'CFOP' }, { id: 'roux', name: '桥式 Roux' }]);
    expect(homeSource.match(/<FormulaColors \/>/g)).toHaveLength(1);
    expect(homeSource).not.toContain('<FormulaColors method={m.id} />');
  });
});

describe('底面颜色：六种配色', () => {
  /** 你给的表：每种底色下 D、U、F、R 四个中心的颜色 */
  const TABLE: Record<BottomColor, { D: BottomColor; U: BottomColor; F: BottomColor; R: BottomColor }> = {
    white: { D: 'white', U: 'yellow', F: 'green', R: 'orange' },
    yellow: { D: 'yellow', U: 'white', F: 'green', R: 'red' },
    red: { D: 'red', U: 'orange', F: 'green', R: 'white' },
    orange: { D: 'orange', U: 'red', F: 'green', R: 'yellow' },
    green: { D: 'green', U: 'blue', F: 'yellow', R: 'orange' },
    blue: { D: 'blue', U: 'green', F: 'white', R: 'orange' },
  };
  const OPPOSITE: Record<BottomColor, BottomColor> = {
    white: 'yellow', yellow: 'white', red: 'orange', orange: 'red', green: 'blue', blue: 'green',
  };
  const CENTER_POS = { D: [0, -1, 0], U: [0, 1, 0], F: [0, 0, 1], R: [1, 0, 0] } as const;
  /** 位置 q 的中心贴纸（引擎里它的编号就是中心位置的编号），在所选底色下显示什么颜色 */
  const centerColor = (q: keyof typeof CENTER_POS, color: BottomColor) =>
    FACE_COLOR[displayFace(stickerAt([...CENTER_POS[q]], [...CENTER_POS[q]]), color)];

  it('六种底色的 D / U / F / R 中心色与表一致', () => {
    for (const color of BOTTOM_COLORS) {
      for (const q of ['D', 'U', 'F', 'R'] as const) {
        expect(centerColor(q, color), `${color} ${q}`).toBe(TABLE[color][q]);
      }
    }
  });

  it('D 中心 = 所选色，U 中心 = 对色，F 总是不同于 D 和 U，R 是第三个轴上的颜色', () => {
    for (const color of BOTTOM_COLORS) {
      expect(centerColor('D', color)).toBe(color);
      expect(centerColor('U', color)).toBe(OPPOSITE[color]);
      expect(new Set([centerColor('D', color), centerColor('U', color), centerColor('F', color)]).size).toBe(3);
    }
  });

  it('六种底色互不相同', () => {
    expect(new Set(BOTTOM_COLORS.map((c) => centerColor('D', c))).size).toBe(6);
  });

  it('白色就是标准配色：每个贴纸还是它原本的面', () => {
    for (const s of STICKERS) expect(displayFace(s.id, 'white')).toBe(s.face);
  });

  it('每种配色都是合法的整体转体：六个面各用一次颜色，且对面仍是对色', () => {
    const opposite = { U: 'D', D: 'U', F: 'B', B: 'F', R: 'L', L: 'R' } as const;
    for (const color of BOTTOM_COLORS) {
      const used = (['U', 'D', 'F', 'B', 'R', 'L'] as const).map((f) => {
        const id = STICKERS.find((s) => s.face === f && s.p.filter((v) => v !== 0).length === 1)!.id;
        return displayFace(id, color);
      });
      expect(new Set(used).size, color).toBe(6);
      for (const f of ['U', 'F', 'R'] as const) {
        const a = STICKERS.find((s) => s.face === f && s.p.filter((v) => v !== 0).length === 1)!.id;
        const b = STICKERS.find((s) => s.face === opposite[f] && s.p.filter((v) => v !== 0).length === 1)!.id;
        expect(opposite[displayFace(a, color)], `${color} ${f}`).toBe(displayFace(b, color));
      }
    }
  });

  it('同一面的贴纸总是同一种颜色（换的是配色，不会把一个面染花）', () => {
    for (const color of BOTTOM_COLORS) {
      for (const f of ['U', 'D', 'F', 'B', 'R', 'L'] as const) {
        const shown = new Set(STICKERS.filter((s) => s.face === f).map((s) => displayFace(s.id, color)));
        expect(shown.size, `${color} ${f}`).toBe(1);
      }
    }
  });

  it('转体字母：黄 z2、红 z\'、橙 z、绿 x\'、蓝 x（用引擎核对，和表一致）', () => {
    const letters = (c: BottomColor) => BOTTOM_ROTATION[c].map((m) => m.base + (m.amount === 1 ? '' : m.amount === 2 ? '2' : "'")).join(' ');
    expect(BOTTOM_COLORS.map(letters)).toEqual(['', 'z2', "z'", 'z', "x'", 'x']);
    // 引擎里整体转体后，D 位置的中心是谁：与 displayFace 用的是同一个转体
    for (const color of BOTTOM_COLORS) {
      const turned = applyMoves(solved(), BOTTOM_ROTATION[color]);
      const dCenter = STICKERS[turned[stickerAt([0, -1, 0], [0, -1, 0])]].face;
      expect(FACE_COLOR[dCenter], color).toBe(color);
    }
  });
});

describe('底面颜色：2D 和 3D 共用同一个映射，切换后一致', () => {
  const oll = getSet('oll')!.cases[0];
  const pll = getSet('pll')!.cases[0];

  it('白色且不传 mask：除 OLL 外和以前的 displayColors 完全一样（所有情形）；OLL 默认是顶层 9 张', () => {
    for (const c of ALL_CASES) {
      if (c.set === 'oll') {
        expect(diagramColors(c, null, 'white'), c.id).toEqual(diagramColors(c, ollTopMask, 'white'));
      } else {
        expect(diagramColors(c, null, 'white'), c.id).toEqual(displayColors(c));
      }
    }
    // 显式传该组的显示掩码，OLL 也和 displayColors 完全一样
    for (const c of ALL_CASES) expect(diagramColors(c, displayMask(c), 'white'), c.id).toEqual(displayColors(c));
  });

  it('其他底色：位置不变、只是颜色换了——显示哪些格子和白色时完全一样', () => {
    for (const color of BOTTOM_COLORS) {
      const base = displayColors(pll);
      const recolored = diagramColors(pll, null, color);
      expect(recolored.map((x) => x === null), color).toEqual(base.map((x) => x === null));
    }
  });

  it('2D 每一格 = displayFace（3D 用的同一个函数）作用在该位置的贴纸上', () => {
    for (const color of BOTTOM_COLORS) {
      const st = caseState(pll);
      const colors = diagramColors(pll, null, color);
      st.forEach((id, pos) => expect(colors[pos], `${color} ${pos}`).toBe(displayFace(id, color)));
    }
  });

  it('3D（CubeScene）上色走 displayFace，并读设备设置里的底色', () => {
    const src = sceneSource;
    expect(src).toContain('displayFace(id, bottom)');
    expect(src).toContain('getDevicePrefs().bottomColor');
    // 不再直接用贴纸原本的面给 3D 上色
    expect(src).not.toMatch(/faceMats\.get\(STICKERS\[id\]\.face\)/);
  });

  it('黄底：末层仍然在顶面，原本的 U 面（黄）贴纸显示成白色，F2L 一侧换成黄', () => {
    const colors = diagramColors(oll, displayMask(oll), 'yellow'); // 显式传 21 格的掩码，才看得到 F2L 一侧
    const shown = colors.filter((x) => x !== null);
    expect(shown).toHaveLength(21);
    // 末层的顶面贴纸原本是 U（黄），现在用对色（白，即 D 的颜色）画
    expect(colors.filter((x) => x === 'D').length).toBeGreaterThanOrEqual(1);
    expect(colors.filter((x) => x === 'U').length).toBe(0);
  });

  it('OLL 默认的 9 张配合底色：只剩 9 块，且都是同一种颜色（对色）', () => {
    const colors = diagramColors(oll, null, 'blue').filter((x) => x !== null);
    expect(colors).toHaveLength(9);
    // 蓝底：U 面贴纸用绿色画（绿 = 蓝的对色）
    expect(new Set(colors).size).toBe(1);
    expect(FACE_COLOR[colors[0]!]).toBe('green');
  });

  it('底色是设备设置：默认白色；设置后立刻生效、写进 mofang.device.v1；重新加载读回', async () => {
    const m = installStorage();
    const first = await freshModule();
    expect(first.getDevicePrefs().bottomColor).toBe('white');
    first.setDevicePrefs({ bottomColor: 'blue' });
    expect(first.getDevicePrefs().bottomColor).toBe('blue');
    expect(JSON.parse(m.get(KEY)!).bottomColor).toBe('blue');
    const second = await freshModule();
    expect(second.getDevicePrefs().bottomColor).toBe('blue');
    vi.unstubAllGlobals();
  });

  it('旧数据没有 bottomColor、值不认识：白色；已有设置不丢', async () => {
    for (const bad of [undefined, 'purple', 3, null, ['red']]) {
      // 输入里故意留着 T27 的 ollView：它应该被忽略
      installStorage({ [KEY]: JSON.stringify({ finish: 'matte', ollView: 'full', bottomColor: bad }) });
      const { getDevicePrefs } = await freshModule();
      expect(getDevicePrefs(), String(bad)).toEqual({ finish: 'matte', focusRelevant: false, bottomColor: 'white', cfop: { bottomColor: 'white' }, roux: { bottomColor: 'white', bridgePair: 'red-orange', leftColor: 'red' } });
    }
    vi.unstubAllGlobals();
  });

  it('按设备存，不进备份：备份里没有 bottomColor，导入备份不改它', async () => {
    installStorage();
    vi.resetModules();
    const prefs = await import('./devicePrefs');
    const user = await import('./userStore');
    prefs.setDevicePrefs({ bottomColor: 'red' });
    expect(user.exportUserData()).not.toContain('bottomColor');
    user.importUserData(JSON.stringify({ version: 1, cases: {} }));
    expect(prefs.getDevicePrefs().bottomColor).toBe('red');
    vi.unstubAllGlobals();
  });
});
