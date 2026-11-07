import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import sceneSource from '../components/CubeScene.ts?raw';
import { diagramColors } from '../components/CaseDiagram';
import { getSet } from '../data';
import { caseState, displayColors, displayMask, SET_RULES } from '../lib/cases';
import { applyMoves, solved, stickerAt, STICKERS } from '../lib/cube';
import { ALL_CASES } from '../data';
import {
  BOTTOM_COLORS,
  BOTTOM_ROTATION,
  FACE_COLOR,
  displayFace,
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
/** 两个掩码对全部 54 块的判断是否一样。重新加载模块后函数不是同一个实例，所以比行为不比身份 */
const sameMask = (a: (id: number) => boolean, b: (id: number) => boolean) => STICKERS.every((s) => a(s.id) === b(s.id));

describe('devicePrefs：ollView', () => {
  beforeEach(() => vi.unstubAllGlobals());
  afterEach(() => vi.unstubAllGlobals());

  it('没有 localStorage（node）：默认 top', async () => {
    vi.stubGlobal('localStorage', undefined);
    const { getDevicePrefs } = await freshModule();
    expect(getDevicePrefs()).toEqual({ finish: 'uv', focusRelevant: false, ollView: 'top', bottomColor: 'white' });
  });

  it('存储为空：默认 top', async () => {
    installStorage();
    const { getDevicePrefs } = await freshModule();
    expect(getDevicePrefs().ollView).toBe('top');
  });

  it('读出已保存的 full', async () => {
    installStorage({ [KEY]: JSON.stringify({ finish: 'uv', focusRelevant: false, ollView: 'full' }) });
    const { getDevicePrefs } = await freshModule();
    expect(getDevicePrefs().ollView).toBe('full');
  });

  it('旧数据没有 ollView：默认 top，已有的设置不丢', async () => {
    installStorage({ [KEY]: JSON.stringify({ finish: 'matte', focusRelevant: true }) });
    const { getDevicePrefs } = await freshModule();
    expect(getDevicePrefs()).toEqual({ finish: 'matte', focusRelevant: true, ollView: 'top', bottomColor: 'white' });
  });

  it('值不认识（乱写、类型不对）：回到 top', async () => {
    for (const bad of ['sideways', 42, null, {}, ['full']]) {
      installStorage({ [KEY]: JSON.stringify({ ollView: bad }) });
      const { getDevicePrefs } = await freshModule();
      expect(getDevicePrefs().ollView, String(bad)).toBe('top');
    }
  });

  it('JSON 损坏：整体回到默认值，不抛', async () => {
    installStorage({ [KEY]: '{oops' });
    const { getDevicePrefs } = await freshModule();
    expect(getDevicePrefs()).toEqual({ finish: 'uv', focusRelevant: false, ollView: 'top', bottomColor: 'white' });
  });

  it('设置后立刻生效，并写进 mofang.device.v1；只改一项不影响其他项', async () => {
    const m = installStorage();
    const { getDevicePrefs, setDevicePrefs } = await freshModule();
    setDevicePrefs({ ollView: 'full' });
    expect(getDevicePrefs()).toEqual({ finish: 'uv', focusRelevant: false, ollView: 'full', bottomColor: 'white' });
    expect(JSON.parse(m.get(KEY)!)).toEqual({ finish: 'uv', focusRelevant: false, ollView: 'full', bottomColor: 'white' });
    setDevicePrefs({ finish: 'matte' });
    expect(getDevicePrefs().ollView).toBe('full');
  });

  it('重新加载后读回刚保存的值', async () => {
    const m = installStorage();
    const first = await freshModule();
    first.setDevicePrefs({ ollView: 'full' });
    const second = await freshModule();
    expect(second.getDevicePrefs().ollView).toBe('full');
    expect(m.has(KEY)).toBe(true);
  });

  it('按设备存，不进备份：备份里没有 ollView，导入备份也不改它', async () => {
    const m = installStorage();
    vi.resetModules();
    const prefs = await import('./devicePrefs');
    const user = await import('./userStore');
    prefs.setDevicePrefs({ ollView: 'full' });
    expect(user.exportUserData()).not.toContain('ollView');
    expect(user.exportUserData()).not.toContain('finish');
    user.importUserData(JSON.stringify({ version: 1, cases: {} }));
    expect(prefs.getDevicePrefs().ollView).toBe('full');
    expect(JSON.parse(m.get(KEY)!).ollView).toBe('full');
  });
});

describe('caseMask：公式详情页的掩码', () => {
  const oll = getSet('oll')!.cases[0];
  const pll = getSet('pll')!.cases[0];
  const lse = getSet('lse')!.cases.find((c) => c.group === 'EO')!;
  const prefs = (ollView: 'top' | 'full', focusRelevant = false) => ({ ollView, focusRelevant });

  async function mod() {
    vi.stubGlobal('localStorage', undefined);
    return freshModule();
  }

  it('OLL top：只有原本属于 U 面的 9 块', async () => {
    const { caseMask } = await mod();
    const m = caseMask(oll, prefs('top'))!;
    expect(countIds(m)).toBe(9);
    expect(STICKERS.filter((s) => m(s.id)).every((s) => s.face === 'U')).toBe(true);
  });

  it('OLL full：整个顶层 21 块，就是 SET_RULES.oll.display', async () => {
    const { caseMask } = await mod();
    const m = caseMask(oll, prefs('full'))!;
    expect(countIds(m)).toBe(21);
    expect(sameMask(m, SET_RULES.oll.display)).toBe(true);
    expect(sameMask(m, displayMask(oll))).toBe(true);
  });

  it('top 是 full 的子集', async () => {
    const { caseMask } = await mod();
    const top = caseMask(oll, prefs('top'))!;
    const full = caseMask(oll, prefs('full'))!;
    expect(STICKERS.filter((s) => top(s.id)).every((s) => full(s.id))).toBe(true);
  });

  it('OLL 不看 focusRelevant：开不开都按 ollView', async () => {
    const { caseMask } = await mod();
    expect(countIds(caseMask(oll, prefs('top', true))!)).toBe(9);
    expect(countIds(caseMask(oll, prefs('top', false))!)).toBe(9);
    expect(countIds(caseMask(oll, prefs('full', true))!)).toBe(21);
    expect(countIds(caseMask(oll, prefs('full', false))!)).toBe(21);
  });

  it('其他组不受 ollView 影响：没开“只看相关的块”是 null，开了是该组的显示掩码', async () => {
    const { caseMask } = await mod();
    for (const c of [pll, lse]) {
      for (const v of ['top', 'full'] as const) {
        expect(caseMask(c, prefs(v, false)), `${c.set} ${v} off`).toBeNull();
        expect(sameMask(caseMask(c, prefs(v, true))!, displayMask(c)), `${c.set} ${v} on`).toBe(true);
      }
    }
  });
});

describe('图解按 mask 显示（CaseDiagram 用的 diagramColors）', () => {
  const oll = getSet('oll')!.cases[0];

  it('不传或 null：用该组默认的显示规则，和以前完全一样', () => {
    expect(diagramColors(oll)).toEqual(displayColors(oll));
    expect(diagramColors(oll, null)).toEqual(displayColors(oll));
    expect(diagramColors(oll, undefined)).toEqual(displayColors(oll));
  });

  it('OLL 默认是 21 格（T20 的行为不变）', () => {
    expect(diagramColors(oll).filter((x) => x !== null)).toHaveLength(21);
  });

  it('top：只有 U 面的 9 块有颜色，且都是 U 色（黄），其余是 null', async () => {
    vi.stubGlobal('localStorage', undefined);
    const { caseMask } = await freshModule();
    const colors = diagramColors(oll, caseMask(oll, { ollView: 'top', focusRelevant: false }));
    const shown = colors.filter((x) => x !== null);
    expect(shown).toHaveLength(9);
    expect(shown.every((f) => f === 'U')).toBe(true);
  });

  it('full 和默认一致', async () => {
    vi.stubGlobal('localStorage', undefined);
    const { caseMask } = await freshModule();
    expect(diagramColors(oll, caseMask(oll, { ollView: 'full', focusRelevant: false }))).toEqual(displayColors(oll));
  });

  it('同一个 mask 在 2D 和 3D 里选中的是同一批贴纸', async () => {
    vi.stubGlobal('localStorage', undefined);
    const { caseMask } = await freshModule();
    const mask = caseMask(oll, { ollView: 'top', focusRelevant: false })!;
    // 3D 是 state[位置] 的贴纸编号过 mask；2D 是同一个判断
    const st = caseState(oll);
    const fromScene = st.map((id) => (mask(id) ? STICKERS[id].face : null));
    expect(diagramColors(oll, mask)).toEqual(fromScene);
  });

  it('OLL 的 top 图解里，顶层以外一格颜色都没有', async () => {
    vi.stubGlobal('localStorage', undefined);
    const { caseMask } = await freshModule();
    const colors = diagramColors(oll, caseMask(oll, { ollView: 'top', focusRelevant: false }));
    STICKERS.forEach((s) => {
      if (s.p[1] !== 1) expect(colors[s.id], `sticker ${s.id}`).toBeNull();
    });
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

  it('白色且不传 mask：和以前的 displayColors 完全一样（所有情形）', () => {
    for (const c of ALL_CASES) expect(diagramColors(c, null, 'white'), c.id).toEqual(displayColors(c));
    expect(diagramColors(oll)).toEqual(displayColors(oll));
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
    const colors = diagramColors(oll, null, 'yellow');
    const shown = colors.filter((x) => x !== null);
    expect(shown).toHaveLength(21); // OLL 默认仍是 21 格
    // 末层的顶面贴纸原本是 U（黄），现在用对色（白，即 D 的颜色）画
    expect(colors.filter((x) => x === 'D').length).toBeGreaterThanOrEqual(1);
    expect(colors.filter((x) => x === 'U').length).toBe(0);
  });

  it('OLL top 视图配合底色：只剩 9 块，且都是同一种颜色（对色）', async () => {
    vi.stubGlobal('localStorage', undefined);
    const { caseMask } = await freshModule();
    const top = caseMask(oll, { ollView: 'top', focusRelevant: false });
    const colors = diagramColors(oll, top, 'blue').filter((x) => x !== null);
    expect(colors).toHaveLength(9);
    // 蓝底：U 面贴纸用绿色画（绿 = 蓝的对色）
    expect(new Set(colors).size).toBe(1);
    expect(FACE_COLOR[colors[0]!]).toBe('green');
    vi.unstubAllGlobals();
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
      installStorage({ [KEY]: JSON.stringify({ finish: 'matte', ollView: 'full', bottomColor: bad }) });
      const { getDevicePrefs } = await freshModule();
      expect(getDevicePrefs(), String(bad)).toEqual({ finish: 'matte', focusRelevant: false, ollView: 'full', bottomColor: 'white' });
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
