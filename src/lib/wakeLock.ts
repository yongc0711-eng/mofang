/**
 * 屏幕常亮（Screen Wake Lock）的薄封装。不支持或申请失败都静默降级，调用方不用 try/catch。
 * navigator 可以注入，方便单测。
 */
export interface WakeLockSentinelLike {
  release(): Promise<void>;
  addEventListener?(type: 'release', listener: () => void): void;
}
export interface NavigatorLike {
  wakeLock?: { request(type: 'screen'): Promise<WakeLockSentinelLike> };
}

export interface ScreenWakeLock {
  /** 申请常亮。成功（或已持有）返回 true，不支持或失败返回 false，不抛异常 */
  acquire(): Promise<boolean>;
  /** 释放。没持有时什么也不做；申请还在路上时，到手后立刻释放 */
  release(): Promise<void>;
  readonly held: boolean;
}

export function createWakeLock(
  nav: NavigatorLike | undefined = typeof navigator === 'undefined' ? undefined : (navigator as NavigatorLike),
): ScreenWakeLock {
  let sentinel: WakeLockSentinelLike | null = null;
  // 想要常亮的意图。申请是异步的，期间如果又调了 release，到手后要立刻放掉
  let wanted = false;
  let pending: Promise<boolean> | null = null;

  const drop = async (s: WakeLockSentinelLike) => {
    try {
      await s.release();
    } catch {
      // 已经被系统释放了
    }
  };

  return {
    get held() {
      return sentinel !== null;
    },
    async acquire() {
      wanted = true;
      if (sentinel) return true;
      if (pending) return pending;
      const wl = nav?.wakeLock;
      if (!wl) return false;
      pending = (async () => {
        try {
          const s = await wl.request('screen');
          if (!wanted) {
            await drop(s);
            return false;
          }
          sentinel = s;
          // 系统会在页面隐藏等时机自己释放，同步一下状态
          s.addEventListener?.('release', () => {
            if (sentinel === s) sentinel = null;
          });
          return true;
        } catch {
          return false;
        } finally {
          pending = null;
        }
      })();
      return pending;
    },
    async release() {
      wanted = false;
      const s = sentinel;
      sentinel = null;
      if (s) await drop(s);
    },
  };
}
