import { afterEach, describe, expect, it, vi } from 'vitest';
import appSource from '../App.tsx?raw';
import bandSource from '../components/RubberBand.tsx?raw';
import meSource from '../pages/MePage.tsx?raw';
import {
  MAX_PULL,
  atEdgePull,
  canCaptureFrom,
  damp,
  isSettled,
  stepSpring,
  undamp,
  type SpringState,
} from './rubberBand';

describe('damp / undamp', () => {
  it('0 → 0，奇函数，单调递增，永远小于上限', () => {
    expect(damp(0)).toBe(0);
    let prev = 0;
    for (let x = 1; x <= 5000; x += 7) {
      const d = damp(x);
      expect(d).toBeGreaterThan(prev);
      expect(d).toBeLessThan(MAX_PULL);
      expect(damp(-x)).toBe(-d);
      prev = d;
    }
  });
  it('开头约一半跟手（有阻尼）', () => {
    expect(damp(2)).toBeCloseTo(1, 1);
    expect(damp(100)).toBeLessThan(100 * 0.5);
  });
  it('undamp 是 damp 的反函数', () => {
    for (const x of [1, 10, 40, 120, 300, -25, -200]) expect(undamp(damp(x)), String(x)).toBeCloseTo(x, 6);
    expect(Number.isFinite(undamp(MAX_PULL * 5))).toBe(true);
  });
});

describe('stepSpring', () => {
  const run = (s: SpringState, dt: number, steps: number) => {
    let cur = s;
    for (let i = 0; i < steps; i++) cur = stepSpring(cur, dt);
    return cur;
  };
  it('从任意位移回到 0 并判定停下，不过冲（临界阻尼）', () => {
    for (const y0 of [80, 15, -60]) {
      let s: SpringState = { y: y0, v: 0 };
      let crossed = false;
      let frames = 0;
      while (!isSettled(s) && frames < 600) {
        s = stepSpring(s, 1 / 60);
        if (Math.sign(s.y) === -Math.sign(y0) && Math.abs(s.y) > 0.5) crossed = true;
        frames++;
      }
      expect(isSettled(s), String(y0)).toBe(true);
      expect(frames, String(y0)).toBeLessThan(120); // 2 秒内
      expect(crossed, String(y0)).toBe(false);
    }
  });
  it('dt 很大、为 0 或为负时不发散', () => {
    const s0 = { y: 50, v: 0 };
    expect(stepSpring(s0, 0)).toEqual(s0);
    expect(stepSpring(s0, -1)).toEqual(s0);
    const big = run(s0, 5, 20);
    expect(Math.abs(big.y)).toBeLessThan(50);
    expect(Number.isFinite(big.y)).toBe(true);
  });
});

describe('atEdgePull：什么时候接管', () => {
  const page = { innerHeight: 800, scrollHeight: 2000 };
  it('中间不接管', () => {
    expect(atEdgePull({ ...page, scrollY: 500, pull: 30 })).toBe(false);
    expect(atEdgePull({ ...page, scrollY: 500, pull: -30 })).toBe(false);
  });
  it('顶部：向下拉接管，向上推（正常往下滚）不接管', () => {
    expect(atEdgePull({ ...page, scrollY: 0, pull: 30 })).toBe(true);
    expect(atEdgePull({ ...page, scrollY: 0, pull: -30 })).toBe(false);
    expect(atEdgePull({ ...page, scrollY: -12, pull: 5 })).toBe(true); // iOS 原生回弹时 scrollY 为负
  });
  it('底部：向上拉接管，向下拉不接管', () => {
    expect(atEdgePull({ ...page, scrollY: 1200, pull: -30 })).toBe(true);
    expect(atEdgePull({ ...page, scrollY: 1200, pull: 30 })).toBe(false);
    expect(atEdgePull({ ...page, scrollY: 1199.5, pull: -30 })).toBe(true); // 小数像素
  });
  it('短页（不能滚）：两个方向都接管', () => {
    const short = { innerHeight: 800, scrollHeight: 700, scrollY: 0 };
    expect(atEdgePull({ ...short, pull: 20 })).toBe(true);
    expect(atEdgePull({ ...short, pull: -20 })).toBe(true);
  });
  it('没有位移、或横向手势不接管', () => {
    expect(atEdgePull({ ...page, scrollY: 0, pull: 0 })).toBe(false);
    expect(atEdgePull({ ...page, scrollY: 0, pull: 10, dx: 40 })).toBe(false);
    expect(atEdgePull({ ...page, scrollY: 0, pull: 40, dx: 10 })).toBe(true);
  });
});

describe('canCaptureFrom：练习、3D、chips、输入控件里起手不接管', () => {
  const el = (matches: string[]) =>
    ({ closest: (sel: string) => (matches.some((m) => sel.split(',').map((x) => x.trim()).includes(m)) ? {} : null) }) as unknown as Element;
  it('不接管', () => {
    for (const m of ['.practice-pad', '.player-stage', '.chips', 'input', 'textarea', 'select']) {
      expect(canCaptureFrom(el([m])), m).toBe(false);
    }
  });
  it('其他地方接管', () => {
    expect(canCaptureFrom(el([]))).toBe(true);
    expect(canCaptureFrom(null)).toBe(true);
  });
});

describe('开关 rubberBandPref（按设备、默认开）', () => {
  afterEach(() => vi.unstubAllGlobals());
  const fresh = async (stored: string | null | 'throws') => {
    vi.resetModules();
    const map = new Map<string, string>();
    if (typeof stored === 'string' && stored !== 'throws') map.set('mofang.device.rubberBand.v1', stored);
    vi.stubGlobal('localStorage', {
      getItem: (k: string) => {
        if (stored === 'throws') throw new Error('blocked');
        return map.get(k) ?? null;
      },
      setItem: (k: string, v: string) => {
        if (stored === 'throws') throw new Error('blocked');
        map.set(k, v);
      },
    });
    return { mod: await import('../store/rubberBandPref'), map };
  };
  it('默认开；存了 off 才是关；乱写的值当作开；存储不可用时开', async () => {
    expect((await fresh(null)).mod.getRubberBand()).toBe(true);
    expect((await fresh('off')).mod.getRubberBand()).toBe(false);
    expect((await fresh('on')).mod.getRubberBand()).toBe(true);
    expect((await fresh('garbage')).mod.getRubberBand()).toBe(true);
    expect((await fresh('throws')).mod.getRubberBand()).toBe(true);
  });
  it('设置后立刻生效并写入；存储写失败时本次仍有效', async () => {
    const { mod, map } = await fresh(null);
    mod.setRubberBand(false);
    expect(mod.getRubberBand()).toBe(false);
    expect(map.get('mofang.device.rubberBand.v1')).toBe('off');
    mod.setRubberBand(true);
    expect(map.get('mofang.device.rubberBand.v1')).toBe('on');
    const bad = (await fresh('throws')).mod;
    bad.setRubberBand(false);
    expect(bad.getRubberBand()).toBe(false);
  });
});

describe('接线（源码文本）', () => {
  it('RubberBand 只包 <main> 里的内容，不包 <Nav />', () => {
    expect(appSource).toMatch(/<main>\s*<RubberBand>\s*<AnimatedRoutes \/>\s*<\/RubberBand>\s*<\/main>/);
    expect(appSource).toMatch(/<Nav \/>\s*<main>/);
  });
  it('transform 不加在 body / documentElement 上，位移不进 React 状态', () => {
    expect(bandSource).not.toMatch(/document\.body\.style/);
    expect(bandSource).not.toMatch(/documentElement\.style\.transform/);
    expect(bandSource).not.toMatch(/useState|setState/);
  });
  it('减少动态效果时关闭；非被动 touchmove 才能 preventDefault', () => {
    expect(bandSource).toContain('prefers-reduced-motion: reduce');
    expect(bandSource).toMatch(/'touchmove', onTouchMove, \{ passive: false \}/);
  });
  it('卸载或关闭时位移归零并还原 overscroll-behavior', () => {
    expect(bandSource).toMatch(/apply\(0\);\s*root\.style\.overscrollBehaviorY = prevOverscroll/);
  });
  it('「我的」有开关，CasePage / 练习页 / 播放器没被改成依赖它', () => {
    expect(meSource).toContain('aria-label="页面弹性"');
    expect(meSource).toContain('setRubberBand(');
  });
});
