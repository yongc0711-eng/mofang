import { useLayoutEffect, useRef } from 'react';
import { useLocation, useNavigationType } from 'react-router-dom';
import { getUi, setUi } from './uiState';

/** 每个 pathname 一份滚动位置，只存内存（刷新后重置），不写 localStorage */
export const scrollKey = (pathname: string): string => `scroll:${pathname}`;

/** 新打开页面（PUSH）回顶部；返回（POP）和底部 tab 切换（REPLACE）恢复上次的位置 */
export const shouldRestoreScroll = (navType: string): boolean => navType !== 'PUSH';

/**
 * 全局滚动恢复（T53），在 <HashRouter> 里调用一次。
 * - 每次导航（location.key 变化）在 layout effect 里滚动：恢复该 pathname 上次的位置，或回顶部；
 * - 页面内持续记录 scroll；离开时再存一次。
 * 离开时存的是“新一轮 render 开始时读到的 window.scrollY”：那时旧页面的 DOM 还在，位置是准的。
 * 不在清理里现读 window.scrollY：清理发生在新页面的 DOM 换上之后，可能已经被新页面更短的高度截断；
 * 也不只靠 scroll 事件：事件按帧派发，会比手指落后一帧（后台页面里甚至不派发）。
 */
export function useScrollRestoration() {
  const { pathname, key } = useLocation();
  const navType = useNavigationType();
  const latest = useRef(0);
  // 每次导航的 render 阶段（旧 DOM 还在）读一次当前位置，供上一个页面的清理存起来
  const leaving = useRef(0);
  if (typeof window !== 'undefined') leaving.current = window.scrollY;
  useLayoutEffect(() => {
    const storeKey = scrollKey(pathname);
    const y = shouldRestoreScroll(navType) ? getUi<number>(storeKey, 0) : 0;
    window.scrollTo(0, y);
    latest.current = y;
    const onScroll = () => {
      latest.current = window.scrollY;
      setUi(storeKey, window.scrollY);
    };
    window.addEventListener('scroll', onScroll, { passive: true });
    return () => {
      window.removeEventListener('scroll', onScroll);
      setUi(storeKey, leaving.current);
    };
    // navType 随 key 一起变；只在导航时重新执行
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [key, pathname]);
}
