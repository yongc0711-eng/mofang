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
export interface ReloadEnvironment {
  serviceWorker?: { getRegistrations(): Promise<readonly { unregister(): Promise<boolean> }[]> };
  caches?: { keys(): Promise<string[]>; delete(name: string): Promise<boolean> };
  location: { href: string; replace(url: string): void };
  now?: () => number;
}
/** Explicit user action only. Keep localStorage / IndexedDB / cookies, and keep the route hash. */
export async function forceReload(env?: ReloadEnvironment): Promise<void> {
  const target: ReloadEnvironment = env ?? {
    serviceWorker: navigator.serviceWorker,
    caches: typeof caches === 'undefined' ? undefined : caches,
    location: window.location,
  };
  const errors: unknown[] = [];
  // Try every registration, then every cache, even if a sibling operation rejects.
  if (target.serviceWorker) {
    try {
      const registrations = await target.serviceWorker.getRegistrations();
      const results = await Promise.allSettled(registrations.map((registration) => Promise.resolve().then(() => registration.unregister())));
      errors.push(...results.filter((result) => result.status === 'rejected'));
    } catch (error) { errors.push(error); }
  }
  if (target.caches) {
    try {
      const names = await target.caches.keys();
      const results = await Promise.allSettled(names.map((name) => Promise.resolve().then(() => target.caches!.delete(name))));
      errors.push(...results.filter((result) => result.status === 'rejected'));
    } catch (error) { errors.push(error); }
  }
  if (errors.length) throw new Error('清理离线缓存失败，请重试或在系统浏览器中打开');
  target.location.replace(reloadUrl(target.location.href, (target.now ?? Date.now)()));
}
