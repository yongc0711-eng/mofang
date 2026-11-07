export const CURRENT_BUILD_ID = __BUILD_ID__;
export const UPDATE_INTERVAL_MS = 30 * 60 * 1000;

export function parseVersion(value: unknown): string {
  if (!value || typeof value !== 'object' || !('version' in value) ||
      typeof value.version !== 'string' || !value.version.trim()) throw new Error('无效版本信息');
  return value.version.trim();
}
export const isNewVersion = (current: string, remote: string): boolean => !!remote.trim() && current.trim() !== remote.trim();

type VersionFetch = (url: string, options: RequestInit) => Promise<{ ok: boolean; json(): Promise<unknown> }>;
/** A network check only: errors are handled by the caller, never reload here. */
export async function checkVersion(fetcher: VersionFetch = fetch, now: () => number = Date.now): Promise<string> {
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), 8000);
  try {
    const response = await fetcher(`./version.json?ts=${now()}`, { cache: 'no-store', signal: controller.signal });
    if (!response.ok) throw new Error('版本检查失败');
    return parseVersion(await response.json());
  } finally { clearTimeout(timeout); }
}

export type CheckResult = { status: 'new' | 'latest'; version: string } | { status: 'failed' };
/** Per-document attempt throttle, including failures; manual checks bypass the interval, not an in-flight request. */
export function createVersionChecker(current: string, request: () => Promise<string> = checkVersion, now = Date.now) {
  let lastCheck: number | null = null;
  let pending: Promise<CheckResult> | null = null;
  let available: string | null = null;
  const listeners = new Set<() => void>();
  return {
    getAvailable: () => available,
    subscribe(listener: () => void) { listeners.add(listener); return () => { listeners.delete(listener); }; },
    check(manual = false): Promise<CheckResult | null> {
      if (pending) return pending;
      const time = now();
      if (!manual && lastCheck !== null && time >= lastCheck && time - lastCheck < UPDATE_INTERVAL_MS) return Promise.resolve(null);
      lastCheck = time;
      pending = Promise.resolve().then(request).then((remote): CheckResult => {
        const next = isNewVersion(current, remote) ? remote : null;
        if (next !== available) {
          available = next;
          listeners.forEach((listener) => listener());
        }
        return { status: next ? 'new' : 'latest', version: remote };
      }).catch((): CheckResult => ({ status: 'failed' })).finally(() => { pending = null; });
      return pending;
    },
  };
}
export const versionChecker = createVersionChecker(CURRENT_BUILD_ID);

/** Event-driven checks only; no polling timer. Injected EventTargets also work in node tests. */
export function watchVersionChecks(
  win: Pick<EventTarget, 'addEventListener' | 'removeEventListener'>,
  doc: Pick<Document, 'visibilityState' | 'addEventListener' | 'removeEventListener'>,
  checker: Pick<typeof versionChecker, 'check'> = versionChecker,
): () => void {
  const visible = () => { if (doc.visibilityState === 'visible') void checker.check(); };
  win.addEventListener('focus', visible);
  doc.addEventListener('visibilitychange', visible);
  visible();
  return () => {
    win.removeEventListener('focus', visible);
    doc.removeEventListener('visibilitychange', visible);
  };
}

export function reloadUrl(href: string, timestamp: number): string {
  const url = new URL(href);
  url.searchParams.set('v', String(timestamp));
  return url.href;
}
export const RELOAD_WARNING_MESSAGE = '可能仍是旧版，请关闭后用系统浏览器重新打开。';
type WarningStorage = Pick<Storage, 'getItem' | 'setItem' | 'removeItem'>;
export const appScope = (href: string): string => new URL('./', href).href;
export const reloadWarningKey = (href: string): string => 'mofang.reload-incomplete:' + appScope(href);
/** Workbox appends the exact registration scope. A prefix match would also delete nested apps. */
export const isAppCache = (name: string, scope: string): boolean => name.endsWith(scope);
interface WarningEnvironment { href: string; storage?: WarningStorage }
export function hasReloadWarning(env?: WarningEnvironment): boolean {
  try {
    const href = env ? env.href : window.location.href;
    const storage = env ? env.storage : window.sessionStorage;
    return storage?.getItem(reloadWarningKey(href)) === '1';
  } catch { return false; }
}
/** Separate reading from consumption so React StrictMode's double initializer cannot lose the warning. */
export function clearReloadWarning(env?: WarningEnvironment): void {
  try {
    const href = env ? env.href : window.location.href;
    const storage = env ? env.storage : window.sessionStorage;
    storage?.removeItem(reloadWarningKey(href));
  } catch { /* Storage denial must not block the page. */ }
}
export interface ReloadEnvironment {
  serviceWorker?: { getRegistrations(): Promise<readonly { scope: string; unregister(): Promise<boolean> }[]> };
  caches?: { keys(): Promise<string[]>; delete(name: string): Promise<boolean> };
  sessionStorage?: WarningStorage;
  location: { href: string; replace(url: string): void };
  now?: () => number;
}
export interface ReloadResult { cleaned: boolean; warningStored: boolean }
/** Cleanup is best effort and app-scoped; even denial must not trap the user on the current page. */
export async function forceReload(env?: ReloadEnvironment): Promise<ReloadResult> {
  const target: ReloadEnvironment = env ?? {
    // Browser API getters can themselves throw in restricted containers; read them inside the stage try/catch.
    get serviceWorker() { return navigator.serviceWorker; },
    get caches() { return typeof caches === 'undefined' ? undefined : caches; },
    get sessionStorage() { return window.sessionStorage; },
    location: window.location,
  };
  const scope = appScope(target.location.href);
  let cleaned = true;
  try {
    const workers = target.serviceWorker;
    if (!workers) cleaned = false;
    else {
      const registrations = (await workers.getRegistrations()).filter((registration) => registration.scope === scope);
      const results = await Promise.allSettled(registrations.map((registration) => Promise.resolve().then(() => registration.unregister())));
      if (results.some((result) => result.status === 'rejected')) cleaned = false;
    }
  } catch { cleaned = false; }
  try {
    const cacheStore = target.caches;
    if (!cacheStore) cleaned = false;
    else {
      const names = (await cacheStore.keys()).filter((name) => isAppCache(name, scope));
      const results = await Promise.allSettled(names.map((name) => Promise.resolve().then(() => cacheStore.delete(name))));
      if (results.some((result) => result.status === 'rejected')) cleaned = false;
    }
  } catch { cleaned = false; }
  let warningStored = false;
  try {
    const storage = target.sessionStorage;
    if (cleaned) storage?.removeItem(reloadWarningKey(target.location.href));
    else if (storage) {
      storage.setItem(reloadWarningKey(target.location.href), '1');
      warningStored = true;
    }
  } catch { /* Return the incomplete result even when the one-time marker cannot be stored. */ }
  target.location.replace(reloadUrl(target.location.href, (target.now ?? Date.now)()));
  return { cleaned, warningStored };
}
