import { afterEach, describe, expect, it, vi } from 'vitest';
import casePageSource from './CasePage.tsx?raw';
import practiceSource from './PracticePage.tsx?raw';
import { ALL_CASES } from '../data';

// Node-only test runtime（vitest 的 css?raw 是空串）；和 caseInput.test.ts 一样本地声明这一个 API，不加全局 Node 类型
const fsModule: string = 'node:fs';
const { readFileSync } = (await import(/* @vite-ignore */ fsModule)) as {
  readFileSync(path: URL, encoding: 'utf8'): string;
};
const stylesSource = readFileSync(new URL('../styles.css', import.meta.url), 'utf8');

/** CasePage 里 <header className="case-head"> … </header> 这一段 */
const head = casePageSource.match(/<header className="case-head">([\s\S]*?)<\/header>/)?.[1] ?? '';
const side = casePageSource.slice(casePageSource.indexOf('<div className="case-side">'));

describe('T45 详情页的学习状态在标题下', () => {
  it('开关在 .case-head 里，在标题和收藏之后，有“学习状态”小标题，不再在 .case-side 里', () => {
    expect(head).not.toBe('');
    expect(head).toContain('aria-label="学习状态"');
    expect(head).toMatch(/<h2 className="case-status-title">学习状态<\/h2>/);
    expect(head.indexOf('page-title')).toBeLessThan(head.indexOf('case-status'));
    expect(head.indexOf('fav-btn')).toBeLessThan(head.indexOf('case-status'));
    // 在图解/播放器/正文之前：case-head 本身就在 case-layout 之前
    expect(casePageSource.indexOf('class' + 'Name="case-head"')).toBeLessThan(casePageSource.indexOf('class' + 'Name="case-layout"'));
    expect(side).not.toContain('aria-label="学习状态"');
    expect(casePageSource.match(/aria-label="学习状态"/g)).toHaveLength(1);
  });

  it('仍是三段：未学 / 学习中 / 已掌握，顺序和值不变，没有第四态', () => {
    expect(casePageSource).toMatch(/const STATUSES: LearnStatus\[\] = \['none', 'learning', 'mastered'\];/);
    expect(head).toMatch(/STATUSES\.map\(\(s\) =>/);
    expect(head).toContain('{STATUS_LABEL[s]}');
    expect(head).toContain('onClick={() => setStatus(c.id, s)}');
    expect(head).toContain('aria-pressed={status === s}');
  });
});

describe('T45 状态标签、点击持久化、筛选与统计', () => {
  afterEach(() => vi.unstubAllGlobals());
  const load = async () => {
    vi.resetModules();
    const map = new Map<string, string>();
    vi.stubGlobal('localStorage', {
      getItem: (k: string) => map.get(k) ?? null,
      setItem: (k: string, v: string) => void map.set(k, v),
    });
    return { store: await import('../store/userStore'), map };
  };

  it('三个标签正是 未学 / 学习中 / 已掌握，没有别的状态', async () => {
    const { store } = await load();
    expect(store.STATUS_LABEL).toEqual({ none: '未学', learning: '学习中', mastered: '已掌握' });
  });

  it('点击等于 setStatus(c.id, s)：状态立刻变，并写入 localStorage（mofang.user.v1），结构不变', async () => {
    const { store, map } = await load();
    const c = ALL_CASES[0];
    expect(store.statusOf(c, { version: 1, cases: {} })).toBe('none');
    for (const s of ['learning', 'mastered', 'none'] as const) {
      store.setStatus(c.id, s);
      const saved = JSON.parse(map.get('mofang.user.v1')!);
      expect(saved.version).toBe(1);
      expect(saved.cases[c.id].status).toBe(s);
      expect(Object.keys(saved)).toEqual(['version', 'cases']);
    }
  });

  it('重新加载后读回；只改这一个情形，其他情形、收藏和主公式不受影响', async () => {
    const { store, map } = await load();
    const [a, b] = ALL_CASES;
    store.toggleFavorite(b.id);
    store.setStatus(a.id, 'learning');
    const raw = map.get('mofang.user.v1')!;
    vi.resetModules();
    vi.stubGlobal('localStorage', { getItem: () => raw, setItem: () => undefined });
    const again = await import('../store/userStore');
    const user = JSON.parse(raw);
    expect(again.statusOf(a, user)).toBe('learning');
    expect(again.statusOf(b, user)).toBe('none');
    expect(user.cases[b.id].favorite).toBe(true);
  });

  it('筛选和统计仍按 statusOf：练习页的筛选项、「我的」的统计没动', () => {
    expect(practiceSource).toContain('statusOf(c, user) === filter');
    expect(practiceSource).toMatch(/\{ id: 'none', label: STATUS_LABEL\.none \}/);
    expect(practiceSource).toMatch(/\{ id: 'learning', label: STATUS_LABEL\.learning \}/);
    expect(practiceSource).toMatch(/\{ id: 'mastered', label: STATUS_LABEL\.mastered \}/);
  });

  it('练习优先级：学习中 3 > 未学 1 > 已掌握 0.5', async () => {
    const { store } = await load();
    const practice = await import('../lib/practice');
    const c = ALL_CASES[0];
    const w = (status: 'none' | 'learning' | 'mastered') =>
      practice.weightOf(c, { version: 1, cases: { [c.id]: { status } } }, 0);
    expect(w('learning')).toBeGreaterThan(w('none'));
    expect(w('none')).toBeGreaterThan(w('mastered'));
    expect(store.STATUS_LABEL.none).toBe('未学');
  });
});

describe('T45 样式', () => {
  const rule = (sel: string) => stylesSource.match(new RegExp(`^${sel.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}\\s*\\{([^}]*)\\}`, 'm'))?.[1] ?? '';

  it('整行宽、可换行；触控目标不小于 32px', () => {
    expect(rule('.case-head')).toContain('flex-wrap: wrap');
    expect(rule('.case-status')).toMatch(/flex: 0 0 100%/);
    expect(rule('.case-status')).toContain('min-width: 0');
    const h = Number(rule('.status-seg button').match(/min-height:\s*(\d+)px/)?.[1]);
    expect(h).toBeGreaterThanOrEqual(32);
  });

  it('选中用 --accent / --accent-soft，颜色全是变量（浅色/深色都读 styles.css 里的变量）', () => {
    const css = rule('.status-seg .seg-thumb') + rule('.status-seg .seg-on');
    expect(css).toContain('var(--accent-soft)');
    expect(css).toContain('var(--accent)');
    expect(css).not.toMatch(/#[0-9a-fA-F]{3,8}\b|rgb\(/);
    expect(stylesSource.match(/--accent-soft:/g)!.length).toBeGreaterThanOrEqual(2); // 浅色 + 深色
  });

  it('没有固定宽度，320 宽不会横向撑开', () => {
    for (const sel of ['.case-status', '.case-status-title', '.status-seg', '.status-seg button']) {
      expect(rule(sel), sel).not.toMatch(/(^|[;\s])(min-)?width:\s*\d+px/);
    }
  });
});
