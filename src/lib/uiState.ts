import { useLayoutEffect } from 'react';

/**
 * 页面间的临时界面状态（滚动位置、筛选）。放在内存里：
 * 详情页返回时恢复，刷新页面后重置，不写进用户数据。
 */
const store = new Map<string, unknown>();

export function getUi<T>(key: string, fallback: T): T {
  return store.has(key) ? (store.get(key) as T) : fallback;
}
export function setUi<T>(key: string, value: T) {
  store.set(key, value);
}

/** 挂载时恢复滚动位置，之后持续记录。内容必须在首次渲染时就在 DOM 里 */
export function useScrollMemory(key: string) {
  useLayoutEffect(() => {
    window.scrollTo(0, getUi<number>(`scroll:${key}`, 0));
    const onScroll = () => setUi(`scroll:${key}`, window.scrollY);
    window.addEventListener('scroll', onScroll, { passive: true });
    return () => window.removeEventListener('scroll', onScroll);
  }, [key]);
}

/** 进入新页面时回到顶部 */
export function useScrollTop(key?: string) {
  useLayoutEffect(() => {
    window.scrollTo(0, 0);
  }, [key]);
}
