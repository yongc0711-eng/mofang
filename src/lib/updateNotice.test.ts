import { describe, expect, it } from 'vitest';
import appSource from '../App.tsx?raw';
import { shouldShowUpdateNotice } from './updateNotice';

describe('shouldShowUpdateNotice：哪些页面显示更新提示条', () => {
  it('首页、组页、我的、搜索显示', () => {
    for (const p of ['/', '/set/oll', '/set/f2l', '/set/cmll', '/me', '/search']) {
      expect(shouldShowUpdateNotice(p), p).toBe(true);
    }
  });

  it('详情页（3D 播放器、公式键盘）和练习页（按压区）不显示', () => {
    for (const p of ['/case/oll-27', '/case/pll-ga', '/case/cmll-o-1', '/case/x', '/practice', '/practice/']) {
      expect(shouldShowUpdateNotice(p), p).toBe(false);
    }
  });

  it('前缀相似但不是这两类页面的仍然显示；不认识的路径（渲染首页）显示', () => {
    for (const p of ['/cases', '/case', '/practices', '/practice-notes', '/whatever', '']) {
      expect(shouldShowUpdateNotice(p), p).toBe(true);
    }
  });

  it('离开详情或练习页后会再显示（路径一变结果就变，没有记忆）', () => {
    expect(shouldShowUpdateNotice('/case/oll-27')).toBe(false);
    expect(shouldShowUpdateNotice('/me')).toBe(true);
    expect(shouldShowUpdateNotice('/practice')).toBe(false);
    expect(shouldShowUpdateNotice('/set/pll')).toBe(true);
  });
});

describe('UpdateNotice 接线（源码文本）', () => {
  const body = appSource.slice(appSource.indexOf('function UpdateNotice()'), appSource.indexOf('export function App()'));

  it('用 useLocation 读 pathname，hooks 都在条件返回之前', () => {
    expect(body).toMatch(/const \{ pathname \} = useLocation\(\);/);
    const early = body.indexOf('return null;');
    expect(early).toBeGreaterThan(0);
    for (const hook of ['useLocation()', 'useSyncExternalStore(', 'useState(', 'useEffect(']) {
      const at = body.indexOf(hook);
      expect(at, hook).toBeGreaterThanOrEqual(0);
      expect(at, hook).toBeLessThan(early);
    }
    // 条件返回之后没有新的 hook 调用
    expect(body.slice(early)).not.toMatch(/\buse(State|Effect|Memo|Ref|Callback|Location|SyncExternalStore)\(/);
  });

  it('条件返回同时看有没有新版和 shouldShowUpdateNotice(pathname)', () => {
    expect(body).toMatch(/if \(!remote \|\| !shouldShowUpdateNotice\(pathname\)\) return null;/);
  });

  it('版本检查仍全局运行：watchVersionChecks 在 effect 里，不受路由过滤影响', () => {
    expect(body).toMatch(/useEffect\(\(\) => watchVersionChecks\(window, document\), \[\]\);/);
    expect(body.indexOf('watchVersionChecks(')).toBeLessThan(body.indexOf('shouldShowUpdateNotice(pathname)'));
  });

  it('提示条仍是文档流里的一节，没有改成 fixed 浮层；T56 的点击刷新逻辑没动', () => {
    expect(body).toContain('<section className="update-notice" role="status" aria-live="polite">');
    expect(body).toContain('void forceReload().then((result) => {');
    expect(appSource).toMatch(/<main>\s*<UpdateNotice \/>\s*<AnimatedRoutes \/>\s*<\/main>/);
  });
});
