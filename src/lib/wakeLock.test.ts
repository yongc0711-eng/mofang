import { describe, expect, it } from 'vitest';
import { createWakeLock, type NavigatorLike, type WakeLockSentinelLike } from './wakeLock';

function fakeNav(opts: { fail?: boolean } = {}) {
  const log = { requests: 0, releases: 0 };
  const sentinels: (WakeLockSentinelLike & { fire(): void })[] = [];
  const nav: NavigatorLike = {
    wakeLock: {
      request: async () => {
        log.requests++;
        if (opts.fail) throw new Error('NotAllowedError');
        let onRelease: (() => void) | undefined;
        const s = {
          release: async () => {
            log.releases++;
          },
          addEventListener: (_t: 'release', l: () => void) => {
            onRelease = l;
          },
          fire: () => onRelease?.(),
        };
        sentinels.push(s);
        return s;
      },
    },
  };
  return { nav, log, sentinels };
}

describe('Wake Lock', () => {
  it('申请成功后持有，释放后不再持有', async () => {
    const { nav, log } = fakeNav();
    const wl = createWakeLock(nav);
    expect(await wl.acquire()).toBe(true);
    expect(wl.held).toBe(true);
    await wl.release();
    expect(wl.held).toBe(false);
    expect(log).toEqual({ requests: 1, releases: 1 });
  });

  it('已持有时再申请不会重复请求', async () => {
    const { nav, log } = fakeNav();
    const wl = createWakeLock(nav);
    await wl.acquire();
    expect(await wl.acquire()).toBe(true);
    expect(log.requests).toBe(1);
  });

  it('同时发起两次申请只请求一次', async () => {
    const { nav, log } = fakeNav();
    const wl = createWakeLock(nav);
    const [a, b] = await Promise.all([wl.acquire(), wl.acquire()]);
    expect([a, b]).toEqual([true, true]);
    expect(log.requests).toBe(1);
  });

  it('没持有时释放什么也不做', async () => {
    const { nav, log } = fakeNav();
    const wl = createWakeLock(nav);
    await wl.release();
    expect(log).toEqual({ requests: 0, releases: 0 });
  });

  it('不支持（没有 wakeLock / 没有 navigator）时不抛，返回 false', async () => {
    for (const nav of [{}, undefined] as (NavigatorLike | undefined)[]) {
      const wl = createWakeLock(nav);
      expect(await wl.acquire()).toBe(false);
      expect(wl.held).toBe(false);
      await expect(wl.release()).resolves.toBeUndefined();
    }
  });

  it('申请被拒绝时不抛，返回 false，之后还能再试', async () => {
    const { nav, log } = fakeNav({ fail: true });
    const wl = createWakeLock(nav);
    expect(await wl.acquire()).toBe(false);
    expect(wl.held).toBe(false);
    expect(await wl.acquire()).toBe(false);
    expect(log.requests).toBe(2);
  });

  it('申请还在路上就被释放：到手后立刻放掉', async () => {
    const { nav, log } = fakeNav();
    const wl = createWakeLock(nav);
    const p = wl.acquire();
    await wl.release();
    expect(await p).toBe(false);
    expect(wl.held).toBe(false);
    expect(log).toEqual({ requests: 1, releases: 1 });
  });

  it('系统自己释放（页面隐藏等）后状态同步，可以重新申请', async () => {
    const { nav, log, sentinels } = fakeNav();
    const wl = createWakeLock(nav);
    await wl.acquire();
    sentinels[0].fire();
    expect(wl.held).toBe(false);
    expect(await wl.acquire()).toBe(true);
    expect(log.requests).toBe(2);
  });

  it('release() 抛异常也不外泄', async () => {
    const nav: NavigatorLike = {
      wakeLock: {
        request: async () => ({
          release: async () => {
            throw new Error('already released');
          },
        }),
      },
    };
    const wl = createWakeLock(nav);
    await wl.acquire();
    await expect(wl.release()).resolves.toBeUndefined();
    expect(wl.held).toBe(false);
  });
});
