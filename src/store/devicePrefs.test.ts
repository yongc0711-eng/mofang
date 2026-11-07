import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { diagramColors } from '../components/CaseDiagram';
import { getSet } from '../data';
import { caseState, displayColors, displayMask, SET_RULES } from '../lib/cases';
import { STICKERS } from '../lib/cube';

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
    expect(getDevicePrefs()).toEqual({ finish: 'uv', focusRelevant: false, ollView: 'top' });
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
    expect(getDevicePrefs()).toEqual({ finish: 'matte', focusRelevant: true, ollView: 'top' });
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
    expect(getDevicePrefs()).toEqual({ finish: 'uv', focusRelevant: false, ollView: 'top' });
  });

  it('设置后立刻生效，并写进 mofang.device.v1；只改一项不影响其他项', async () => {
    const m = installStorage();
    const { getDevicePrefs, setDevicePrefs } = await freshModule();
    setDevicePrefs({ ollView: 'full' });
    expect(getDevicePrefs()).toEqual({ finish: 'uv', focusRelevant: false, ollView: 'full' });
    expect(JSON.parse(m.get(KEY)!)).toEqual({ finish: 'uv', focusRelevant: false, ollView: 'full' });
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
