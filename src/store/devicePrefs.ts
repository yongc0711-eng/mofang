import { useSyncExternalStore } from 'react';
import { displayMask, topLayerMask, type Mask } from '../lib/cases';
import { STICKERS } from '../lib/cube';
import { BOTTOM_COLORS, cleanBrowse, type BottomColor, type BrowseColors } from '../lib/colorScheme';
export { BOTTOM_COLORS, BOTTOM_ROTATION, FACE_COLOR, displayFace, topColor, frontColor, type BottomColor } from '../lib/colorScheme';
import { type AlgCase } from '../types';

/**
 * 只对这台设备生效的显示设置，比如旧手机选普通面省性能。
 * 和进度分开存，不进备份，所以导入备份不会改变它。
 */
export interface DevicePrefs extends BrowseColors {
  /** 魔方表面：UV 亮面或普通面 */
  finish: 'uv' | 'matte';
  /** 只给相关的块上色，其余变灰：3D 播放器所有组都用；2D 图解里 OLL 之外的组也用 */
  focusRelevant: boolean;
  /** 底面颜色，默认白色；公式页的图解和 3D 按它换配色 */
  bottomColor: BottomColor;
}

const KEY = 'mofang.device.v1';
const DEFAULTS: DevicePrefs = { finish: 'uv', focusRelevant: false, bottomColor: 'white', ...cleanBrowse({}, 'white') };

function load(): DevicePrefs {
  try {
    const parsed = JSON.parse(localStorage.getItem(KEY) ?? '{}') as Partial<DevicePrefs>;
    return {
      ...cleanBrowse(parsed, BOTTOM_COLORS.includes(parsed.bottomColor as BottomColor) ? parsed.bottomColor! : 'white'),
      finish: parsed.finish === 'matte' ? 'matte' : 'uv',
      focusRelevant: parsed.focusRelevant === true,
      // 旧数据里可能还有 ollView（T27 的设置，T32 已删除）：这里不读，也就不会再写回去
      // 旧数据没有这一项，或值不认识：白色
      bottomColor: BOTTOM_COLORS.includes(parsed.bottomColor as BottomColor) ? (parsed.bottomColor as BottomColor) : 'white',
    };
  } catch {
    return DEFAULTS;
  }
}

/**
 * OLL 的 2D 图解只显示顶层的 9 张颜色：原本属于 U 面的 9 块贴纸，按贴纸编号判断，和它转到哪里无关。
 * 固定如此，不受“只看相关的块”影响。
 */
export const ollTopMask: Mask = (id) => STICKERS[id].face === 'U';

/**
 * “只看相关的块”打开时每组该显示的贴纸（2D 和 3D 共用）：
 * - OLL：顶面 9 张（ollTopMask），和 OLL 的 2D 一致
 * - PLL：顶层 21 张（顶面 9 + 四周顶行 12）。PLL 的 SET_RULES.display 是全部 54 张，
 *   它同时用于情形去重，所以不改它，只在这里收窄
 * - 其他组：该组的 displayMask
 */
export function focusMask(c: Pick<AlgCase, 'set' | 'group'>): Mask {
  if (c.set === 'oll') return ollTopMask;
  if (c.set === 'pll') return topLayerMask;
  return displayMask(c);
}

/**
 * 2D 图解该用哪个掩码，null 表示用该组默认的显示规则（OLL 默认 9 张，PLL 完整 54 张）。
 * - OLL：固定 ollTopMask（9 张），不看 focusRelevant
 * - 其他组：开了“只看相关的块”就是 focusMask，否则 null
 */
export function diagramMask(c: Pick<AlgCase, 'set' | 'group'>, p: Pick<DevicePrefs, 'focusRelevant'>): Mask | null {
  if (c.set === 'oll') return ollTopMask;
  return p.focusRelevant ? focusMask(c) : null;
}

/**
 * 3D 播放器该用哪个掩码：默认 null（完整魔方），开了“只看相关的块”就是 focusMask
 * （OLL 顶面 9 张，PLL 顶层 21 张，其他组同 2D）。
 */
export function playerMask(c: Pick<AlgCase, 'set' | 'group'>, p: Pick<DevicePrefs, 'focusRelevant'>): Mask | null {
  return p.focusRelevant ? focusMask(c) : null;
}

let prefs: DevicePrefs = typeof localStorage === 'undefined' ? DEFAULTS : load();
const listeners = new Set<() => void>();

const subscribe = (l: () => void) => {
  listeners.add(l);
  return () => listeners.delete(l);
};

export const useDevicePrefs = () => useSyncExternalStore(subscribe, () => prefs);

/** 当前设置（不是 hook，测试和非组件代码用） */
export const getDevicePrefs = (): DevicePrefs => prefs;

export function setDevicePrefs(patch: Partial<Omit<DevicePrefs, 'cfop' | 'roux'>> & { cfop?: Partial<DevicePrefs['cfop']>; roux?: Partial<DevicePrefs['roux']> }) {
  const next = { ...prefs, ...patch, cfop: { ...prefs.cfop, ...patch.cfop }, roux: { ...prefs.roux, ...patch.roux } };
  prefs = { ...next, ...cleanBrowse(next, prefs.bottomColor) };
  try {
    localStorage.setItem(KEY, JSON.stringify(prefs));
  } catch {
    // 隐私模式等情况下写入失败：本次会话内仍可用
  }
  listeners.forEach((l) => l());
}
