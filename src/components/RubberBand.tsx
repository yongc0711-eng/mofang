import { useEffect, useRef, type ReactNode } from 'react';
import { MAX_PULL, atEdgePull, canCaptureFrom, damp, isSettled, stepSpring, undamp, type SpringState } from '../lib/rubberBand';
import { useRubberBand } from '../store/rubberBandPref';

/**
 * 文档滚动到顶/底时的弹性（T43）。只包 <main> 里的内容，不包 <Nav />：
 * transform 加在祖先上会让 position: fixed 的底栏跟着位移，所以绝不能加在 body / #root 上。
 * 位移只写 style.transform，不进 React 状态，不影响练习会话和滚动位置。
 * 开启时给 <html> 设 overscroll-behavior-y: none，关掉浏览器自己的回弹/下拉刷新，避免叠加；关闭或卸载时还原。
 * 系统设置了减少动态效果时整个关闭。
 */
export function RubberBand({ children }: { children: ReactNode }) {
  const enabled = useRubberBand();
  const box = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const el = box.current;
    if (!enabled || !el) return;
    if (window.matchMedia?.('(prefers-reduced-motion: reduce)').matches) return;
    const root = document.documentElement;
    const prevOverscroll = root.style.overscrollBehaviorY;
    root.style.overscrollBehaviorY = 'none';

    let offset = 0; // 当前位移（px）
    let raf = 0;
    const apply = (y: number) => {
      offset = y;
      if (Math.abs(y) < 0.01) {
        offset = 0;
        el.style.transform = '';
        el.style.willChange = '';
      } else {
        el.style.transform = `translate3d(0, ${y.toFixed(2)}px, 0)`;
        el.style.willChange = 'transform';
      }
    };
    const stopSpring = () => {
      if (raf) cancelAnimationFrame(raf);
      raf = 0;
    };
    const release = () => {
      stopSpring();
      if (offset === 0) return;
      let spring: SpringState = { y: offset, v: 0 };
      let last = performance.now();
      const tick = (now: number) => {
        spring = stepSpring(spring, (now - last) / 1000);
        last = now;
        if (isSettled(spring)) {
          raf = 0;
          apply(0);
          return;
        }
        apply(spring.y);
        raf = requestAnimationFrame(tick);
      };
      raf = requestAnimationFrame(tick);
    };
    const edge = (pull: number, dx = 0) =>
      atEdgePull({ scrollY: window.scrollY, innerHeight: window.innerHeight, scrollHeight: root.scrollHeight, pull, dx });

    // ---- 触摸 ----
    let tStart: { x: number; y: number } | null = null;
    let tOrigin: number | null = null; // 开始接管时手指的 y；null 表示还没接管
    let tDir = 0; // 接管时的方向：向下拉 1，向上拉 -1
    let tAllowed = false;
    const onTouchStart = (e: TouchEvent) => {
      stopSpring();
      tOrigin = null;
      if (e.touches.length !== 1) {
        tStart = null;
        return;
      }
      tAllowed = canCaptureFrom(e.target as Element | null);
      tStart = { x: e.touches[0].clientX, y: e.touches[0].clientY };
      if (offset !== 0 && tAllowed) {
        // 回弹途中又按下：从当前位移接着拖
        tDir = Math.sign(offset);
        tOrigin = tStart.y - undamp(offset);
      }
    };
    const onTouchMove = (e: TouchEvent) => {
      if (!tStart || !tAllowed || e.touches.length !== 1) return;
      const t = e.touches[0];
      if (tOrigin === null) {
        const pull = t.clientY - tStart.y;
        if (!edge(pull, t.clientX - tStart.x)) return;
        tOrigin = tStart.y; // 到边界后才开始计位移
        tDir = Math.sign(pull);
      }
      const raw = t.clientY - tOrigin;
      if (raw * tDir <= 0) {
        // 往回拖过了起点：位移归零，交还给原生滚动
        apply(0);
        tOrigin = null;
        tStart = { x: t.clientX, y: t.clientY };
        return;
      }
      if (e.cancelable) e.preventDefault();
      apply(damp(raw, MAX_PULL));
    };
    const onTouchEnd = () => {
      tStart = null;
      tOrigin = null;
      release();
    };

    // ---- 滚轮（Windows 等；macOS 触控板自带弹性，跳过） ----
    const native = /Mac/.test(navigator.userAgent) && navigator.maxTouchPoints === 0;
    let wheelRaw = 0;
    let wheelTimer = 0;
    const onWheel = (e: WheelEvent) => {
      if (e.ctrlKey || Math.abs(e.deltaX) > Math.abs(e.deltaY)) return;
      if (!canCaptureFrom(e.target as Element | null)) return;
      const pull = -e.deltaY; // 向上滚（deltaY<0）在顶部 = 向下拉
      if (wheelRaw === 0 && !edge(pull)) return;
      stopSpring();
      const next = wheelRaw + pull * 0.6;
      if (wheelRaw !== 0 && next * wheelRaw <= 0) {
        // 反向滚回来：位移归零，恢复原生滚动
        wheelRaw = 0;
        apply(0);
        return;
      }
      wheelRaw = next;
      if (e.cancelable) e.preventDefault();
      apply(damp(wheelRaw, MAX_PULL));
      window.clearTimeout(wheelTimer);
      wheelTimer = window.setTimeout(() => {
        wheelRaw = 0;
        release();
      }, 90);
    };

    document.addEventListener('touchstart', onTouchStart, { passive: true });
    document.addEventListener('touchmove', onTouchMove, { passive: false });
    document.addEventListener('touchend', onTouchEnd, { passive: true });
    document.addEventListener('touchcancel', onTouchEnd, { passive: true });
    if (!native) document.addEventListener('wheel', onWheel, { passive: false });
    return () => {
      document.removeEventListener('touchstart', onTouchStart);
      document.removeEventListener('touchmove', onTouchMove);
      document.removeEventListener('touchend', onTouchEnd);
      document.removeEventListener('touchcancel', onTouchEnd);
      document.removeEventListener('wheel', onWheel);
      window.clearTimeout(wheelTimer);
      stopSpring();
      apply(0);
      root.style.overscrollBehaviorY = prevOverscroll;
    };
  }, [enabled]);

  return <div ref={box}>{children}</div>;
}
