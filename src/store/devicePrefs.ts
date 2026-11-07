import { useSyncExternalStore } from 'react';
import { displayMask, type Mask } from '../lib/cases';
import { STICKERS } from '../lib/cube';
import { type AlgCase } from '../types';

/**
 * 只对这台设备生效的显示设置，比如旧手机选普通面省性能。
 * 和进度分开存，不进备份，所以导入备份不会改变它。
 */
export interface DevicePrefs {
  /** 魔方表面：UV 亮面或普通面 */
  finish: 'uv' | 'matte';
  /** 3D 魔方只给相关的块上色，其余变灰 */
  focusRelevant: boolean;
  /** OLL 详情页的识别视图：top 只显示 U 面的 9 块，full 显示整个顶层的 21 块 */
  ollView: 'top' | 'full';
}

const KEY = 'mofang.device.v1';
const DEFAULTS: DevicePrefs = { finish: 'uv', focusRelevant: false, ollView: 'top' };

function load(): DevicePrefs {
  try {
    const parsed = JSON.parse(localStorage.getItem(KEY) ?? '{}') as Partial<DevicePrefs>;
    return {
      finish: parsed.finish === 'matte' ? 'matte' : 'uv',
      focusRelevant: parsed.focusRelevant === true,
      // 旧数据没有这一项，默认 top
      ollView: parsed.ollView === 'full' ? 'full' : 'top',
    };
  } catch {
    return DEFAULTS;
  }
}

/** 原本属于 U 面的 9 块贴纸，按贴纸编号判断，和它转到哪里无关 */
const uFaceStickers: Mask = (id) => STICKERS[id].face === 'U';

/**
 * 公式详情页该用哪个掩码，2D 图解和 3D 播放器共用同一个。
 * - OLL：按 ollView。top 只显示 U 面的 9 块，full 是整个顶层的 21 块（就是 SET_RULES.oll.display）；和 focusRelevant 无关
 * - 其他组：开了“只看相关的块”就是该组的显示掩码，否则 null（3D 显示全部，2D 用默认图解）
 */
export function caseMask(
  c: Pick<AlgCase, 'set' | 'group'>,
  p: Pick<DevicePrefs, 'ollView' | 'focusRelevant'>,
): Mask | null {
  if (c.set === 'oll') return p.ollView === 'top' ? uFaceStickers : displayMask(c);
  return p.focusRelevant ? displayMask(c) : null;
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

export function setDevicePrefs(patch: Partial<DevicePrefs>) {
  prefs = { ...prefs, ...patch };
  try {
    localStorage.setItem(KEY, JSON.stringify(prefs));
  } catch {
    // 隐私模式等情况下写入失败：本次会话内仍可用
  }
  listeners.forEach((l) => l());
}
