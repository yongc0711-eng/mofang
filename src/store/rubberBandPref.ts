import { useSyncExternalStore } from 'react';

/**
 * 弹性反馈开关，按设备保存，不进备份（和 devicePrefs 一样）。默认开。
 * 单独一个键：这样不改 DevicePrefs 的形状。
 */
const KEY = 'mofang.device.rubberBand.v1';

function load(): boolean {
  try {
    return localStorage.getItem(KEY) !== 'off';
  } catch {
    return true;
  }
}

let enabled = typeof localStorage === 'undefined' ? true : load();
const listeners = new Set<() => void>();

export const getRubberBand = () => enabled;
export function setRubberBand(on: boolean) {
  enabled = on;
  try {
    localStorage.setItem(KEY, on ? 'on' : 'off');
  } catch {
    // 隐私模式等：本次会话内仍有效
  }
  listeners.forEach((l) => l());
}
const subscribe = (l: () => void) => {
  listeners.add(l);
  return () => listeners.delete(l);
};
export const useRubberBand = () => useSyncExternalStore(subscribe, () => enabled, () => true);
