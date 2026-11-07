import { afterEach, describe, expect, it, vi } from 'vitest';
import { appScope, clearReloadWarning, hasReloadWarning, isAppCache, reloadWarningKey, type ReloadEnvironment, checkVersion, createVersionChecker, forceReload, isNewVersion, parseVersion, reloadUrl, UPDATE_INTERVAL_MS, watchVersionChecks } from './version';
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
const rootScope = 'https://example.test/';
const projectScope = 'https://example.test/mofang/';
const cacheName = (scope: string, name = 'precache-v2') => `workbox-${name}-${scope}`;
function warningStorage(initial: Record<string, string> = {}) {
  const entries = new Map(Object.entries(initial));
  return {
    getItem: (key: string) => entries.get(key) ?? null,
    setItem: (key: string, value: string) => { entries.set(key, value); },
    removeItem: (key: string) => { entries.delete(key); },
  };
}
it('unregisters every app SW before deleting every app cache, then replaces the current URL', async () => {
  const events: string[] = [];
  const names = [cacheName(projectScope), cacheName(projectScope, 'runtime')];
  const replace = vi.fn(() => { events.push('replace'); });
  const result = await forceReload({
    serviceWorker: { getRegistrations: async () => [1, 2].map((id) => ({ scope: projectScope, unregister: async () => { events.push(`sw${id}`); return true; } })) },
    caches: { keys: async () => names, delete: async (name) => { events.push(`cache-${name}`); return true; } },
    location: { href: 'https://example.test/mofang/#/practice', replace }, now: () => 42,
  });
  expect(events).toEqual(['sw1', 'sw2', `cache-${names[0]}`, `cache-${names[1]}`, 'replace']);
  expect(replace).toHaveBeenCalledWith('https://example.test/mofang/?v=42#/practice');
  expect(result).toEqual({ cleaned: true, warningStored: false });
});
it('unsupported SW/cache APIs still permit a cache-busted navigation without touching user data', async () => {
  const replace = vi.fn();
  const storage = warningStorage();
  const env = {
    location: { href: 'https://example.test/#/me', replace }, now: () => 42, sessionStorage: storage,
    get localStorage() { throw new Error('must not access user data'); },
    get indexedDB() { throw new Error('must not access user data'); },
    get cookie() { throw new Error('must not access user data'); },
  };
  expect(await forceReload(env)).toEqual({ cleaned: false, warningStored: true });
  expect(replace).toHaveBeenCalledOnce();
  expect(storage.getItem(reloadWarningKey(env.location.href))).toBe('1');
});
it('failed cleanup still attempts every app sibling/cache, then navigates with an incomplete marker', async () => {
  const unregister = vi.fn(async () => true);
  const deleted: string[] = [];
  const storage = warningStorage();
  const href = 'https://example.test/#/me';
  const names = [cacheName(rootScope), cacheName(rootScope, 'runtime')];
  const replace = vi.fn(() => expect(storage.getItem(reloadWarningKey(href))).toBe('1'));
  const result = await forceReload({
    serviceWorker: { getRegistrations: async () => [{ scope: rootScope, unregister: async () => { throw new Error('denied'); } }, { scope: rootScope, unregister }] },
    caches: { keys: async () => names, delete: async (name) => { deleted.push(name); if (name === names[0]) throw new Error('denied'); return true; } },
    sessionStorage: storage, location: { href, replace }, now: () => 42,
  });
  expect(unregister).toHaveBeenCalledOnce();
  expect(deleted).toEqual(names);
  expect(replace).toHaveBeenCalledWith('https://example.test/?v=42#/me');
  expect(result).toEqual({ cleaned: false, warningStored: true });
});
it('registration lookup failure does not skip app cache cleanup or the navigation', async () => {
  const remove = vi.fn(async () => false);
  const storage = warningStorage();
  const replace = vi.fn();
  const result = await forceReload({
    serviceWorker: { getRegistrations: async () => { throw new Error('lookup failed'); } },
    caches: { keys: async () => [cacheName(rootScope)], delete: remove },
    sessionStorage: storage, location: { href: 'https://example.test/', replace }, now: () => 42,
  });
  expect(remove).toHaveBeenCalledWith(cacheName(rootScope));
  expect(replace).toHaveBeenCalledWith('https://example.test/?v=42');
  expect(storage.getItem(reloadWarningKey('https://example.test/'))).toBe('1');
  expect(result).toEqual({ cleaned: false, warningStored: true });
});
it('waits for asynchronous unregister and cache deletion before navigation', async () => {
  let finishUnregister!: (result: boolean) => void;
  let finishDelete!: (result: boolean) => void;
  const keys = vi.fn(async () => [cacheName(rootScope)]);
  const remove = vi.fn(() => new Promise<boolean>((resolve) => { finishDelete = resolve; }));
  const replace = vi.fn();
  const pending = forceReload({
    serviceWorker: { getRegistrations: async () => [{ scope: rootScope, unregister: () => new Promise<boolean>((resolve) => { finishUnregister = resolve; }) }] },
    caches: { keys, delete: remove }, location: { href: 'https://example.test/', replace },
  });
  await vi.waitFor(() => expect(finishUnregister).toBeTypeOf('function'));
  expect(keys).not.toHaveBeenCalled();
  finishUnregister(true);
  await vi.waitFor(() => expect(remove).toHaveBeenCalledOnce());
  expect(replace).not.toHaveBeenCalled();
  finishDelete(true);
  expect(await pending).toEqual({ cleaned: true, warningStored: false });
  expect(replace).toHaveBeenCalledOnce();
});

it('only exact app registrations and scope-suffixed caches are cleared; sibling/child/parent scopes stay intact', async () => {
  const scopes = [projectScope, 'https://example.test/other/', projectScope + 'child/', rootScope, 'https://example.test/mofang-other/'];
  const registrations = scopes.map((scope) => ({ scope, unregister: vi.fn(async () => true) }));
  const names = [cacheName(projectScope), cacheName(projectScope, 'runtime'), ...scopes.slice(1).map((scope) => cacheName(scope)), 'manual-cache', cacheName(projectScope) + '-not-a-scope-suffix'];
  const caches = new Set(names);
  const remove = vi.fn(async (name: string) => caches.delete(name));
  const result = await forceReload({
    serviceWorker: { getRegistrations: async () => registrations },
    caches: { keys: async () => [...caches], delete: remove },
    location: { href: projectScope + 'index.html?lang=zh#/case/pll-t', replace: vi.fn() },
  });
  expect(result.cleaned).toBe(true);
  expect(registrations[0].unregister).toHaveBeenCalledOnce();
  for (const registration of registrations.slice(1)) expect(registration.unregister).not.toHaveBeenCalled();
  expect(remove.mock.calls.map(([name]) => name)).toEqual(names.slice(0, 2));
  expect([...caches]).toEqual(names.slice(2));
});
it('scope is the app directory without query/hash and a nested app name does not match its parent', () => {
  expect(appScope(projectScope + 'index.html?v=1#/me')).toBe(projectScope);
  expect(appScope(projectScope + '?v=1#/practice')).toBe(projectScope);
  expect(isAppCache(cacheName(projectScope), projectScope)).toBe(true);
  expect(isAppCache(cacheName(projectScope + 'child/'), projectScope)).toBe(false);
});
it('cache-key lookup rejection is incomplete but still navigates', async () => {
  const storage = warningStorage();
  const replace = vi.fn();
  const result = await forceReload({
    serviceWorker: { getRegistrations: async () => [] },
    caches: { keys: async () => { throw new Error('denied'); }, delete: vi.fn() },
    sessionStorage: storage, location: { href: projectScope, replace }, now: () => 42,
  });
  expect(result).toEqual({ cleaned: false, warningStored: true });
  expect(replace).toHaveBeenCalledWith(projectScope + '?v=42');
  expect(hasReloadWarning({ href: projectScope, storage })).toBe(true);
});
for (const api of ['serviceWorker', 'caches'] as const) {
  it(`a denied ${api} property getter still reaches navigation`, async () => {
    const storage = warningStorage();
    const replace = vi.fn();
    const env: ReloadEnvironment = {
      serviceWorker: { getRegistrations: async () => [] },
      caches: { keys: async () => [], delete: vi.fn() }, sessionStorage: storage,
      location: { href: projectScope, replace }, now: () => 42,
    };
    Object.defineProperty(env, api, { get() { throw new Error('blocked getter'); } });
    expect(await forceReload(env)).toEqual({ cleaned: false, warningStored: true });
    expect(replace).toHaveBeenCalledWith(projectScope + '?v=42');
  });
}
it('denied sessionStorage does not prevent navigation and the caller still knows cleanup was incomplete', async () => {
  const replace = vi.fn();
  const result = await forceReload({
    get sessionStorage(): never { throw new Error('blocked storage'); },
    location: { href: projectScope, replace }, now: () => 42,
  });
  expect(result).toEqual({ cleaned: false, warningStored: false });
  expect(replace).toHaveBeenCalledWith(projectScope + '?v=42');
});
it('warning reads survive double initialization; consumption removes only this app one-time flag', () => {
  const href = projectScope + '?v=42#/me';
  const other = 'https://example.test/other/';
  const storage = warningStorage({ [reloadWarningKey(href)]: '1', [reloadWarningKey(other)]: '1', unrelated: 'keep' });
  expect(hasReloadWarning({ href, storage })).toBe(true);
  expect(hasReloadWarning({ href, storage })).toBe(true);
  clearReloadWarning({ href, storage });
  expect(hasReloadWarning({ href, storage })).toBe(false);
  expect(storage.getItem(reloadWarningKey(other))).toBe('1');
  expect(storage.getItem('unrelated')).toBe('keep');
});
it('a successful cleanup clears only its previous incomplete warning', async () => {
  const href = projectScope + '#/me';
  const otherKey = reloadWarningKey('https://example.test/other/');
  const storage = warningStorage({ [reloadWarningKey(href)]: '1', [otherKey]: '1' });
  expect(await forceReload({
    serviceWorker: { getRegistrations: async () => [] },
    caches: { keys: async () => [], delete: vi.fn() }, sessionStorage: storage,
    location: { href, replace: vi.fn() },
  })).toEqual({ cleaned: true, warningStored: false });
  expect(storage.getItem(reloadWarningKey(href))).toBeNull();
  expect(storage.getItem(otherKey)).toBe('1');
});
it('warning storage denial is silent during page reads and consumption', () => {
  const env = { href: projectScope, storage: {
    getItem() { throw new Error('blocked'); }, setItem: vi.fn(), removeItem() { throw new Error('blocked'); },
  } };
  expect(hasReloadWarning(env)).toBe(false);
  expect(() => clearReloadWarning(env)).not.toThrow();
});
it('a rejected navigation remains an error, but is attempted even after cleanup failure and leaves its warning', async () => {
  const storage = warningStorage();
  const replace = vi.fn(() => { throw new Error('navigation blocked'); });
  await expect(forceReload({ sessionStorage: storage, location: { href: projectScope, replace } })).rejects.toThrow('navigation blocked');
  expect(replace).toHaveBeenCalledOnce();
  expect(hasReloadWarning({ href: projectScope, storage })).toBe(true);
});

it('a rejected one-time marker write does not block navigation or change the incomplete result', async () => {
  const replace = vi.fn();
  const setItem = vi.fn(() => { throw new Error('storage quota/permission'); });
  const removeItem = vi.fn();
  const result = await forceReload({
    sessionStorage: { getItem: () => null, setItem, removeItem },
    location: { href: projectScope + '#/me', replace }, now: () => 42,
  });
  expect(setItem).toHaveBeenCalledExactlyOnceWith(reloadWarningKey(projectScope), '1');
  expect(removeItem).not.toHaveBeenCalled();
  expect(result).toEqual({ cleaned: false, warningStored: false });
  expect(replace).toHaveBeenCalledWith(projectScope + '?v=42#/me');
});
