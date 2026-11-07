import { useSyncExternalStore } from 'react';

/**
 * 只对这台设备生效的显示设置，比如旧手机选普通面省性能。
 * 和进度分开存，不进备份，所以导入备份不会改变它。
 */
export interface DevicePrefs {
  /** 魔方表面：UV 亮面或普通面 */
  finish: 'uv' | 'matte';
  /** 3D 魔方只给相关的块上色，其余变灰 */
  focusRelevant: boolean;
}

const KEY = 'mofang.device.v1';
const DEFAULTS: DevicePrefs = { finish: 'uv', focusRelevant: false };

function load(): DevicePrefs {
  try {
    const parsed = JSON.parse(localStorage.getItem(KEY) ?? '{}') as Partial<DevicePrefs>;
    return {
      finish: parsed.finish === 'matte' ? 'matte' : 'uv',
      focusRelevant: parsed.focusRelevant === true,
    };
  } catch {
    return DEFAULTS;
  }
}

let prefs: DevicePrefs = typeof localStorage === 'undefined' ? DEFAULTS : load();
const listeners = new Set<() => void>();

const subscribe = (l: () => void) => {
  listeners.add(l);
  return () => listeners.delete(l);
};

export const useDevicePrefs = () => useSyncExternalStore(subscribe, () => prefs);

export function setDevicePrefs(patch: Partial<DevicePrefs>) {
  prefs = { ...prefs, ...patch };
  try {
    localStorage.setItem(KEY, JSON.stringify(prefs));
  } catch {
    // 隐私模式等情况下写入失败：本次会话内仍可用
  }
  listeners.forEach((l) => l());
}
