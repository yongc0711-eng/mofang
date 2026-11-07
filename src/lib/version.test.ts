import { afterEach, describe, expect, it, vi } from 'vitest';
import { checkVersion, createVersionChecker, forceReload, isNewVersion, parseVersion, reloadUrl, UPDATE_INTERVAL_MS, watchVersionChecks } from './version';
afterEach(() => vi.useRealTimers());

it('parses a trimmed version and compares opaque build identities', () => {
  expect(parseVersion({ version: ' build-b ' })).toBe('build-b');
  expect(isNewVersion('build-a', 'build-b')).toBe(true);
  expect(isNewVersion('build-a', ' build-a ')).toBe(false);
  expect(isNewVersion('build-a', ' ')).toBe(false);
});
for (const invalid of [null, [], {}, { version: '' }, { version: '  ' }, { version: 1 }, 'build-a', true]) {
  it(`rejects invalid metadata ${JSON.stringify(invalid)}`, () => expect(() => parseVersion(invalid)).toThrow('无效版本信息'));
}
it('fetches a cache-busted relative URL with no-store and an abort signal', async () => {
  const fetcher = vi.fn(async () => ({ ok: true, json: async () => ({ version: 'remote' }) }));
  await expect(checkVersion(fetcher, () => 1234)).resolves.toBe('remote');
  expect(fetcher).toHaveBeenCalledWith('./version.json?ts=1234', { cache: 'no-store', signal: expect.any(AbortSignal) });
});
it('rejects HTTP errors, invalid JSON, malformed version and network errors', async () => {
  await expect(checkVersion(async () => ({ ok: false, json: vi.fn() }))).rejects.toThrow('版本检查失败');
  await expect(checkVersion(async () => ({ ok: true, json: async () => { throw new Error('bad json'); } }))).rejects.toThrow('bad json');
  await expect(checkVersion(async () => ({ ok: true, json: async () => ({ version: null }) }))).rejects.toThrow('无效版本信息');
  await expect(checkVersion(async () => { throw new Error('offline'); })).rejects.toThrow('offline');
});
it('aborts a slow network check after eight seconds', async () => {
  vi.useFakeTimers();
  const pending = checkVersion((_url, options) => new Promise((_resolve, reject) => {
    options.signal!.addEventListener('abort', () => reject(new Error('aborted')));
  }));
  const assertion = expect(pending).rejects.toThrow('aborted');
  await vi.advanceTimersByTimeAsync(8000);
  await assertion;
});

describe('event-driven version checker', () => {
  it('checks initially and only after a full thirty minutes', async () => {
    let time = 100;
    const request = vi.fn(async () => 'a');
    const checker = createVersionChecker('a', request, () => time);
    expect(await checker.check()).toEqual({ status: 'latest', version: 'a' });
    time += UPDATE_INTERVAL_MS - 1;
    expect(await checker.check()).toBeNull();
    expect(request).toHaveBeenCalledOnce();
    time++;
    await checker.check();
    expect(request).toHaveBeenCalledTimes(2);
  });
  it('manual check bypasses throttle, but not an in-flight request', async () => {
    let finish!: (version: string) => void;
    const request = vi.fn(() => new Promise<string>((resolve) => { finish = resolve; }));
    const checker = createVersionChecker('a', request, () => 0);
    const first = checker.check();
    const manual = checker.check(true);
    expect(manual).toBe(first);
    await Promise.resolve();
    finish('a');
    await first;
    expect(request).toHaveBeenCalledOnce();
    const next = checker.check(true);
    await Promise.resolve();
    finish('b');
    expect(await next).toEqual({ status: 'new', version: 'b' });
    expect(request).toHaveBeenCalledTimes(2);
  });
  it('publishes a new build without reloading and only notifies on changes', async () => {
    let remote = 'b';
    const checker = createVersionChecker('a', async () => remote);
    const listener = vi.fn();
    const unsubscribe = checker.subscribe(listener);
    expect(checker.getAvailable()).toBeNull();
    await checker.check(true);
    expect(checker.getAvailable()).toBe('b');
    expect(listener).toHaveBeenCalledOnce();
    await checker.check(true);
    expect(listener).toHaveBeenCalledOnce();
    remote = 'a';
    await checker.check(true);
    expect(checker.getAvailable()).toBeNull();
    expect(listener).toHaveBeenCalledTimes(2);
    unsubscribe();
    remote = 'c';
    await checker.check(true);
    expect(listener).toHaveBeenCalledTimes(2);
  });
  it('offline failures are results, retain an existing notice and are throttled too', async () => {
    const request = vi.fn<() => Promise<string>>().mockResolvedValueOnce('b').mockRejectedValue(new Error('offline'));
    const checker = createVersionChecker('a', request, () => 0);
    await checker.check(true);
    await expect(checker.check(true)).resolves.toEqual({ status: 'failed' });
    expect(checker.getAvailable()).toBe('b');
    expect(await checker.check()).toBeNull();
    expect(request).toHaveBeenCalledTimes(2);
  });
  it('clock rollback does not permanently suppress future checks', async () => {
    let time = 100;
    const request = vi.fn(async () => 'a');
    const checker = createVersionChecker('a', request, () => time);
    await checker.check();
    time = 0;
    await checker.check();
    expect(request).toHaveBeenCalledTimes(2);
  });
});
class VisibleTarget extends EventTarget { visibilityState: DocumentVisibilityState = 'visible'; }
it('focus and visible events share the throttle; hidden events do not fetch; cleanup detaches', async () => {
  let time = 0;
  const request = vi.fn(async () => 'a');
  const checker = createVersionChecker('a', request, () => time);
  const win = new EventTarget();
  const doc = new VisibleTarget();
  const stop = watchVersionChecks(win, doc, checker);
  await checker.check();
  win.dispatchEvent(new Event('focus'));
  doc.dispatchEvent(new Event('visibilitychange'));
  expect(request).toHaveBeenCalledOnce();
  time = UPDATE_INTERVAL_MS;
  doc.visibilityState = 'hidden';
  doc.dispatchEvent(new Event('visibilitychange'));
  win.dispatchEvent(new Event('focus'));
  expect(request).toHaveBeenCalledOnce();
  doc.visibilityState = 'visible';
  doc.dispatchEvent(new Event('visibilitychange'));
  await checker.check();
  expect(request).toHaveBeenCalledTimes(2);
  stop();
  time += UPDATE_INTERVAL_MS;
  doc.dispatchEvent(new Event('visibilitychange'));
  win.dispatchEvent(new Event('focus'));
  expect(request).toHaveBeenCalledTimes(2);
});

for (const [href, expected] of [
  ['https://example.test/mofang/#/case/pll-t', 'https://example.test/mofang/?v=42#/case/pll-t'],
  ['https://example.test/mofang/index.html?x=1#/practice', 'https://example.test/mofang/index.html?x=1&v=42#/practice'],
  ['https://example.test/?v=old&lang=zh#/me', 'https://example.test/?v=42&lang=zh#/me'],
  ['https://example.test/a/', 'https://example.test/a/?v=42'],
]) it(`reload URL preserves path/hash and other query parameters: ${href}`, () => expect(reloadUrl(href, 42)).toBe(expected));
it('unregisters every SW before deleting every cache, then replaces the current URL', async () => {
  const events: string[] = [];
  const replace = vi.fn(() => { events.push('replace'); });
  await forceReload({
    serviceWorker: { getRegistrations: async () => [1, 2].map((id) => ({ unregister: async () => { events.push(`sw${id}`); return true; } })) },
    caches: { keys: async () => ['a', 'b'], delete: async (name) => { events.push(`cache-${name}`); return true; } },
    location: { href: 'https://example.test/mofang/#/practice', replace }, now: () => 42,
  });
  expect(events).toEqual(['sw1', 'sw2', 'cache-a', 'cache-b', 'replace']);
  expect(replace).toHaveBeenCalledWith('https://example.test/mofang/?v=42#/practice');
});
it('unsupported SW/cache APIs still permit a cache-busted navigation without touching user data', async () => {
  const replace = vi.fn();
  const env = {
    location: { href: 'https://example.test/#/me', replace }, now: () => 42,
    get localStorage() { throw new Error('must not access user data'); },
    get indexedDB() { throw new Error('must not access user data'); },
  };
  await forceReload(env);
  expect(replace).toHaveBeenCalledOnce();
});
it('failed cleanup still attempts every sibling and cache, but reports failure instead of claiming reload succeeded', async () => {
  const unregister = vi.fn(async () => true);
  const deleted: string[] = [];
  const replace = vi.fn();
  await expect(forceReload({
    serviceWorker: { getRegistrations: async () => [{ unregister: async () => { throw new Error('denied'); } }, { unregister }] },
    caches: { keys: async () => ['a', 'b'], delete: async (name) => { deleted.push(name); if (name === 'a') throw new Error('denied'); return true; } },
    location: { href: 'https://example.test/', replace },
  })).rejects.toThrow('清理离线缓存失败');
  expect(unregister).toHaveBeenCalledOnce();
  expect(deleted).toEqual(['a', 'b']);
  expect(replace).not.toHaveBeenCalled();
});
it('registration lookup failure does not skip cache cleanup', async () => {
  const remove = vi.fn(async () => false);
  const replace = vi.fn();
  await expect(forceReload({
    serviceWorker: { getRegistrations: async () => { throw new Error('lookup failed'); } },
    caches: { keys: async () => ['cache'], delete: remove }, location: { href: 'https://example.test/', replace },
  })).rejects.toThrow();
  expect(remove).toHaveBeenCalledWith('cache');
  expect(replace).not.toHaveBeenCalled();
});
it('waits for asynchronous unregister and cache deletion before navigation', async () => {
  let finishUnregister!: (result: boolean) => void;
  let finishDelete!: (result: boolean) => void;
  const keys = vi.fn(async () => ['cache']);
  const remove = vi.fn(() => new Promise<boolean>((resolve) => { finishDelete = resolve; }));
  const replace = vi.fn();
  const pending = forceReload({
    serviceWorker: { getRegistrations: async () => [{ unregister: () => new Promise<boolean>((resolve) => { finishUnregister = resolve; }) }] },
    caches: { keys, delete: remove }, location: { href: 'https://example.test/', replace },
  });
  await vi.waitFor(() => expect(finishUnregister).toBeTypeOf('function'));
  expect(keys).not.toHaveBeenCalled();
  finishUnregister(true);
  await vi.waitFor(() => expect(remove).toHaveBeenCalledOnce());
  expect(replace).not.toHaveBeenCalled();
  finishDelete(true);
  await pending;
  expect(replace).toHaveBeenCalledOnce();
});
