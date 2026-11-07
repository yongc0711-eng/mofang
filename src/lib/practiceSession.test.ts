import { describe, expect, it } from 'vitest';
import {
  SESSION_KEY,
  SESSION_TTL_MS,
  clearSession,
  elapsedOf,
  freeze,
  loadSession,
  parseSession,
  resumeTimer,
  saveSession,
  serializeSession,
  startTimer,
  stopTimer,
  type PracticeSession,
  type Timer,
} from './practiceSession';

const ids = new Set(['a', 'b', 'c']);
const valid = (id: string) => ids.has(id);
const T0 = 1_700_000_000_000;

const session = (over: Partial<PracticeSession> = {}): PracticeSession => ({
  poolIds: ['a', 'b', 'c'],
  question: { id: 'b', alg: "R U R'", scramble: "R U' R'" },
  phase: 'ready',
  count: 3,
  elapsedMs: 0,
  runningSince: null,
  savedAt: T0,
  ...over,
});

/** 内存版 storage */
function fakeStorage(initial: Record<string, string> = {}) {
  const m = new Map(Object.entries(initial));
  return {
    m,
    getItem: (k: string) => m.get(k) ?? null,
    setItem: (k: string, v: string) => void m.set(k, v),
    removeItem: (k: string) => void m.delete(k),
  };
}

describe('计时纯函数', () => {
  const idle: Timer = { phase: 'ready', elapsedMs: 0, runningSince: null };

  it('开始 → 计时 → 停止', () => {
    const run = startTimer(idle, 1000);
    expect(run).toEqual({ phase: 'running', elapsedMs: 0, runningSince: 1000 });
    expect(elapsedOf(run, 1000)).toBe(0);
    expect(elapsedOf(run, 3500)).toBe(2500);
    const done = stopTimer(run, 3500);
    expect(done).toEqual({ phase: 'done', elapsedMs: 2500, runningSince: null });
    expect(elapsedOf(done, 99_999)).toBe(2500);
  });

  it('冻结：正在计时就结算进 elapsedMs，变成 paused', () => {
    const run = startTimer(idle, 1000);
    expect(freeze(run, 4000)).toEqual({ phase: 'paused', elapsedMs: 3000, runningSince: null });
  });

  it('冻结 0ms：刚开始就冻结，用时为 0', () => {
    expect(freeze(startTimer(idle, 5000), 5000)).toEqual({ phase: 'paused', elapsedMs: 0, runningSince: null });
  });

  it('冻结跨小时：纯函数不截断，如实结算', () => {
    const hours = 3 * 3600 * 1000;
    expect(freeze(startTimer(idle, 0), hours).elapsedMs).toBe(hours);
  });

  it('runningSince 为 null 的 running（数据异常）：不加时间，也不抛', () => {
    const odd: Timer = { phase: 'running', elapsedMs: 700, runningSince: null };
    expect(elapsedOf(odd, 10_000)).toBe(700);
    expect(freeze(odd, 10_000)).toEqual({ phase: 'paused', elapsedMs: 700, runningSince: null });
  });

  it('时钟倒退按 0 处理', () => {
    expect(elapsedOf(startTimer(idle, 5000), 4000)).toBe(0);
  });

  it('非计时阶段冻结原样返回（同一个对象）', () => {
    const paused: Timer = { phase: 'paused', elapsedMs: 10, runningSince: null };
    const done: Timer = { phase: 'done', elapsedMs: 10, runningSince: null };
    expect(freeze(idle, 1)).toBe(idle);
    expect(freeze(paused, 1)).toBe(paused);
    expect(freeze(done, 1)).toBe(done);
  });

  it('paused 恢复：保留已累计的用时，从此刻重新计', () => {
    const paused: Timer = { phase: 'paused', elapsedMs: 3000, runningSince: null };
    const run = resumeTimer(paused, 9000);
    expect(run).toEqual({ phase: 'running', elapsedMs: 3000, runningSince: 9000 });
    expect(elapsedOf(run, 10_000)).toBe(4000);
  });

  it('冻结后再恢复，中间离开的时间不算', () => {
    let t = startTimer(idle, 0);
    t = freeze(t, 2000); // 切后台
    t = resumeTimer(t, 62_000); // 一分钟后回来点屏幕
    expect(elapsedOf(t, 63_000)).toBe(3000);
  });
});

describe('保存与读取', () => {
  it('往返：存进去再读出来一致', () => {
    const st = fakeStorage();
    const s = session({ phase: 'paused', elapsedMs: 4200, count: 7 });
    saveSession(s, st);
    expect(loadSession(T0 + 1000, valid, st)).toEqual(s);
  });

  it('用 SESSION_KEY 存', () => {
    const st = fakeStorage();
    saveSession(session(), st);
    expect([...st.m.keys()]).toEqual([SESSION_KEY]);
    expect(SESSION_KEY).toBe('mofang.practice.v1');
  });

  it('结束时清空', () => {
    const st = fakeStorage();
    saveSession(session(), st);
    clearSession(st);
    expect(loadSession(T0, valid, st)).toBeNull();
    expect(st.m.size).toBe(0);
  });

  it('没存过：null', () => {
    expect(loadSession(T0, valid, fakeStorage())).toBeNull();
  });

  it('过期丢弃：刚好 2 小时仍有效，多 1ms 就丢', () => {
    const raw = serializeSession(session());
    expect(parseSession(raw, T0 + SESSION_TTL_MS, valid)).not.toBeNull();
    expect(parseSession(raw, T0 + SESSION_TTL_MS + 1, valid)).toBeNull();
  });

  it('过期的会话读取时顺手清掉', () => {
    const st = fakeStorage();
    saveSession(session(), st);
    expect(loadSession(T0 + SESSION_TTL_MS + 1, valid, st)).toBeNull();
    expect(st.m.size).toBe(0);
  });

  it('坏 JSON 丢弃，并清掉', () => {
    const st = fakeStorage({ [SESSION_KEY]: '{oops' });
    expect(loadSession(T0, valid, st)).toBeNull();
    expect(st.m.size).toBe(0);
    expect(parseSession('null', T0, valid)).toBeNull();
    expect(parseSession('"str"', T0, valid)).toBeNull();
    expect(parseSession('[]', T0, valid)).toBeNull();
  });

  it('字段缺失或类型不对丢弃', () => {
    const bad = (patch: Record<string, unknown>) => parseSession(JSON.stringify({ ...session(), ...patch }), T0, valid);
    expect(bad({ savedAt: 'x' })).toBeNull();
    expect(bad({ phase: 'weird' })).toBeNull();
    expect(bad({ count: -1 })).toBeNull();
    expect(bad({ count: 1.5 })).toBeNull();
    expect(bad({ elapsedMs: -5 })).toBeNull();
    expect(bad({ runningSince: 'now' })).toBeNull();
    expect(bad({ question: null })).toBeNull();
    expect(bad({ question: { id: 'b' } })).toBeNull();
    expect(bad({ poolIds: 'a' })).toBeNull();
    expect(bad({ poolIds: ['a', 1] })).toBeNull();
  });

  it('题目 id 不存在丢弃', () => {
    const s = session({ question: { id: 'gone', alg: 'R', scramble: "R'" } });
    expect(parseSession(serializeSession(s), T0, valid)).toBeNull();
  });

  it('范围为空丢弃；范围里全是已不存在的 id 也丢弃', () => {
    expect(parseSession(serializeSession(session({ poolIds: [] })), T0, valid)).toBeNull();
    expect(parseSession(serializeSession(session({ poolIds: ['x', 'y'] })), T0, valid)).toBeNull();
  });

  it('范围里个别 id 已不存在：只丢那几个', () => {
    const s = parseSession(serializeSession(session({ poolIds: ['a', 'gone', 'b'] })), T0, valid);
    expect(s?.poolIds).toEqual(['a', 'b']);
  });

  it('running 持久化后恢复为 paused，用时冻结在保存时刻', () => {
    const st = fakeStorage();
    // 1000ms 前开始计时，保存时已累计 500，所以保存时刻的用时 = 500 + 1000
    saveSession(session({ phase: 'running', elapsedMs: 500, runningSince: T0 - 1000, savedAt: T0 }), st);
    // 一小时后才回来：用时仍然是保存时刻的 1500，不把离开的时间算进去
    const s = loadSession(T0 + 3600_000, valid, st)!;
    expect(s.phase).toBe('paused');
    expect(s.runningSince).toBeNull();
    expect(s.elapsedMs).toBe(1500);
    expect(elapsedOf(s, T0 + 7200_000)).toBe(1500);
  });

  it('非 running 的 runningSince 被忽略', () => {
    const s = parseSession(serializeSession(session({ phase: 'done', elapsedMs: 900, runningSince: T0 })), T0, valid)!;
    expect(s.phase).toBe('done');
    expect(s.runningSince).toBeNull();
    expect(s.elapsedMs).toBe(900);
  });

  it('ready、done 原样恢复', () => {
    const r = parseSession(serializeSession(session({ phase: 'ready' })), T0, valid)!;
    const d = parseSession(serializeSession(session({ phase: 'done', elapsedMs: 8123 })), T0, valid)!;
    expect(r.phase).toBe('ready');
    expect(d.phase).toBe('done');
    expect(d.elapsedMs).toBe(8123);
  });

  it('storage 不可用（null / 抛异常）时不抛', () => {
    expect(() => saveSession(session(), null)).not.toThrow();
    expect(loadSession(T0, valid, null)).toBeNull();
    expect(() => clearSession(null)).not.toThrow();
    const broken = {
      getItem: () => {
        throw new Error('denied');
      },
      setItem: () => {
        throw new Error('quota');
      },
      removeItem: () => {
        throw new Error('denied');
      },
    };
    expect(() => saveSession(session(), broken)).not.toThrow();
    expect(loadSession(T0, valid, broken)).toBeNull();
    expect(() => clearSession(broken)).not.toThrow();
  });
});
