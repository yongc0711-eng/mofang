import { describe, expect, it } from 'vitest';
import {
  DOC_ID,
  HEARTBEAT_MS,
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
  touchRunning,
  type PracticeSession,
  type Timer,
} from './practiceSession';

const ids = new Set(['a', 'b', 'c']);
const valid = (id: string) => ids.has(id);
const T0 = 1_700_000_000_000;
/** 保存时的文档，和重载之后的另一个文档 */
const DOC_A = 'doc-A';
const DOC_B = 'doc-B';

const session = (over: Partial<PracticeSession> = {}): PracticeSession => ({
  poolIds: ['a', 'b', 'c'],
  question: { id: 'b', alg: "R U R'", scramble: "R U' R'" },
  phase: 'ready',
  count: 3,
  elapsedMs: 0,
  runningSince: null,
  savedAt: T0,
  docId: DOC_A,
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

  it('冻结后再恢复，中间的时间不算（冷启动的情形）', () => {
    let t = startTimer(idle, 0);
    t = freeze(t, 2000);
    t = resumeTimer(t, 62_000);
    expect(elapsedOf(t, 63_000)).toBe(3000);
  });

  it('不冻结：running 跨过离开的时间继续算（同一文档的情形）', () => {
    const run = startTimer(idle, 0);
    expect(elapsedOf(run, 30_000)).toBe(30_000);
  });
});

describe('DOC_ID', () => {
  it('是非空字符串，同一次加载里不变', () => {
    expect(typeof DOC_ID).toBe('string');
    expect(DOC_ID.length).toBeGreaterThan(0);
    expect(DOC_ID).toBe(DOC_ID);
  });
});

describe('保存与读取', () => {
  it('往返：存进去再读出来一致（同一文档）', () => {
    const st = fakeStorage();
    const s = session({ phase: 'paused', elapsedMs: 4200, count: 7 });
    saveSession(s, st);
    expect(loadSession(T0 + 1000, valid, DOC_A, st)).toEqual(s);
  });

  it('用 SESSION_KEY 存，并带上 docId', () => {
    const st = fakeStorage();
    saveSession(session(), st);
    expect([...st.m.keys()]).toEqual([SESSION_KEY]);
    expect(SESSION_KEY).toBe('mofang.practice.v1');
    expect(JSON.parse(st.m.get(SESSION_KEY)!).docId).toBe(DOC_A);
  });

  it('结束时清空', () => {
    const st = fakeStorage();
    saveSession(session(), st);
    clearSession(st);
    expect(loadSession(T0, valid, DOC_A, st)).toBeNull();
    expect(st.m.size).toBe(0);
  });

  it('没存过：null', () => {
    expect(loadSession(T0, valid, DOC_A, fakeStorage())).toBeNull();
  });

  describe('同一文档的 running：计时一直走', () => {
    const running = session({ phase: 'running', elapsedMs: 500, runningSince: T0 - 1000, savedAt: T0 });

    it('读出来仍是 running，runningSince 原样，用时包含离开的时长', () => {
      const s = parseSession(serializeSession(running), T0 + 30_000, valid, DOC_A)!;
      expect(s.phase).toBe('running');
      expect(s.runningSince).toBe(T0 - 1000);
      expect(s.elapsedMs).toBe(500);
      // 保存时已累计 500 + 1000，又离开了 30 秒：回来时是 500 + 31_000
      expect(elapsedOf(s, T0 + 30_000)).toBe(31_500);
    });

    it('超过 2 小时仍有效，不按过期丢弃', () => {
      const later = T0 + SESSION_TTL_MS + 3 * 3600_000;
      const s = parseSession(serializeSession(running), later, valid, DOC_A)!;
      expect(s).not.toBeNull();
      expect(s.phase).toBe('running');
      expect(elapsedOf(s, later)).toBe(500 + (later - (T0 - 1000)));
    });

    it('runningSince 不是数字：数据异常，按冻结处理（paused，用时不变）', () => {
      const raw = JSON.stringify({ ...running, runningSince: null });
      const s = parseSession(raw, T0 + 5000, valid, DOC_A)!;
      expect(s.phase).toBe('paused');
      expect(s.runningSince).toBeNull();
      expect(s.elapsedMs).toBe(500);
    });

    it('runningSince 异常又超过 2 小时：丢弃', () => {
      const raw = JSON.stringify({ ...running, runningSince: null });
      expect(parseSession(raw, T0 + SESSION_TTL_MS + 1, valid, DOC_A)).toBeNull();
    });
  });

  describe('不同文档（重载、冷启动、进程被杀）的 running：停在保存时刻', () => {
    const running = session({ phase: 'running', elapsedMs: 500, runningSince: T0 - 1000, savedAt: T0 });

    it('不同 docId：paused，用时冻结在 savedAt', () => {
      const st = fakeStorage();
      saveSession(running, st);
      // 一小时后才冷启动：用时仍是保存时刻的 1500，不含死掉的时间
      const s = loadSession(T0 + 3600_000, valid, DOC_B, st)!;
      expect(s.phase).toBe('paused');
      expect(s.runningSince).toBeNull();
      expect(s.elapsedMs).toBe(1500);
      expect(elapsedOf(s, T0 + 7200_000)).toBe(1500);
    });

    it('缺 docId（旧数据）：同样 paused，冻结在 savedAt', () => {
      const raw = JSON.stringify({ ...running, docId: undefined });
      const s = parseSession(raw, T0 + 60_000, valid, DOC_A)!;
      expect(s.phase).toBe('paused');
      expect(s.elapsedMs).toBe(1500);
      expect(s.docId).toBeUndefined();
    });

    it('docId 不是字符串：按缺失处理', () => {
      const raw = JSON.stringify({ ...running, docId: 42 });
      expect(parseSession(raw, T0 + 60_000, valid, DOC_A)!.phase).toBe('paused');
    });

    it('超过 2 小时丢弃（只有同一文档的 running 例外）', () => {
      const raw = serializeSession(running);
      expect(parseSession(raw, T0 + SESSION_TTL_MS, valid, DOC_B)).not.toBeNull();
      expect(parseSession(raw, T0 + SESSION_TTL_MS + 1, valid, DOC_B)).toBeNull();
    });
  });

  describe('过期', () => {
    it('ready 过期丢弃：刚好 2 小时仍有效，多 1ms 就丢', () => {
      const raw = serializeSession(session());
      expect(parseSession(raw, T0 + SESSION_TTL_MS, valid, DOC_A)).not.toBeNull();
      expect(parseSession(raw, T0 + SESSION_TTL_MS + 1, valid, DOC_A)).toBeNull();
    });

    it('paused 超过 2 小时丢弃，即使是同一文档', () => {
      const raw = serializeSession(session({ phase: 'paused', elapsedMs: 900 }));
      expect(parseSession(raw, T0 + SESSION_TTL_MS, valid, DOC_A)).not.toBeNull();
      expect(parseSession(raw, T0 + SESSION_TTL_MS + 1, valid, DOC_A)).toBeNull();
    });

    it('done 超过 2 小时丢弃，即使是同一文档', () => {
      const raw = serializeSession(session({ phase: 'done', elapsedMs: 900 }));
      expect(parseSession(raw, T0 + SESSION_TTL_MS, valid, DOC_A)).not.toBeNull();
      expect(parseSession(raw, T0 + SESSION_TTL_MS + 1, valid, DOC_A)).toBeNull();
    });

    it('过期的会话读取时顺手清掉', () => {
      const st = fakeStorage();
      saveSession(session(), st);
      expect(loadSession(T0 + SESSION_TTL_MS + 1, valid, DOC_A, st)).toBeNull();
      expect(st.m.size).toBe(0);
    });
  });

  it('坏 JSON 丢弃，并清掉', () => {
    const st = fakeStorage({ [SESSION_KEY]: '{oops' });
    expect(loadSession(T0, valid, DOC_A, st)).toBeNull();
    expect(st.m.size).toBe(0);
    expect(parseSession('null', T0, valid, DOC_A)).toBeNull();
    expect(parseSession('"str"', T0, valid, DOC_A)).toBeNull();
    expect(parseSession('[]', T0, valid, DOC_A)).toBeNull();
  });

  it('字段缺失或类型不对丢弃', () => {
    const bad = (patch: Record<string, unknown>) =>
      parseSession(JSON.stringify({ ...session(), ...patch }), T0, valid, DOC_A);
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

  it('题目 id 不存在丢弃（同一文档的 running 也一样）', () => {
    const q = { id: 'gone', alg: 'R', scramble: "R'" };
    expect(parseSession(serializeSession(session({ question: q })), T0, valid, DOC_A)).toBeNull();
    const running = session({ question: q, phase: 'running', runningSince: T0 - 10 });
    expect(parseSession(serializeSession(running), T0, valid, DOC_A)).toBeNull();
  });

  it('范围为空丢弃；范围里全是已不存在的 id 也丢弃', () => {
    expect(parseSession(serializeSession(session({ poolIds: [] })), T0, valid, DOC_A)).toBeNull();
    expect(parseSession(serializeSession(session({ poolIds: ['x', 'y'] })), T0, valid, DOC_A)).toBeNull();
  });

  it('范围里个别 id 已不存在：只丢那几个', () => {
    const s = parseSession(serializeSession(session({ poolIds: ['a', 'gone', 'b'] })), T0, valid, DOC_A);
    expect(s?.poolIds).toEqual(['a', 'b']);
  });

  it('非 running 的 runningSince 被忽略', () => {
    const s = parseSession(
      serializeSession(session({ phase: 'done', elapsedMs: 900, runningSince: T0 })),
      T0,
      valid,
      DOC_A,
    )!;
    expect(s.phase).toBe('done');
    expect(s.runningSince).toBeNull();
    expect(s.elapsedMs).toBe(900);
  });

  it('ready、done 原样恢复（同一文档和不同文档一样）', () => {
    for (const doc of [DOC_A, DOC_B]) {
      const r = parseSession(serializeSession(session({ phase: 'ready' })), T0, valid, doc)!;
      const d = parseSession(serializeSession(session({ phase: 'done', elapsedMs: 8123 })), T0, valid, doc)!;
      expect(r.phase).toBe('ready');
      expect(d.phase).toBe('done');
      expect(d.elapsedMs).toBe(8123);
    }
  });

  it('savedAt 更新后：runningSince 不变，同一文档用时按原起点继续算，冷启动冻结在 savedAt', () => {
    // 这条只是手动改 savedAt，验证读取侧；心跳本身的更新逻辑见下面 touchRunning 的测试
    const st = fakeStorage();
    const base = session({ phase: 'running', elapsedMs: 0, runningSince: T0, savedAt: T0 });
    saveSession(base, st);
    saveSession({ ...base, savedAt: T0 + 8000 }, st);
    const s = loadSession(T0 + 20_000, valid, DOC_A, st)!;
    expect(s.runningSince).toBe(T0);
    expect(elapsedOf(s, T0 + 20_000)).toBe(20_000);
    const cold = loadSession(T0 + 20_000, valid, DOC_B, st)!;
    expect(cold.phase).toBe('paused');
    expect(cold.elapsedMs).toBe(8000);
  });

  describe('心跳的一拍 touchRunning', () => {
    const running = session({ phase: 'running', elapsedMs: 500, runningSince: T0 - 1000, savedAt: T0 });
    const stored = (st: ReturnType<typeof fakeStorage>) => JSON.parse(st.m.get(SESSION_KEY)!) as PracticeSession;

    it('running：只把 savedAt 改成 now，runningSince、elapsedMs 和其他字段不动，返回 true', () => {
      const st = fakeStorage();
      saveSession(running, st);
      expect(touchRunning(st, T0 + 4000, DOC_A)).toBe(true);
      expect(stored(st)).toEqual({ ...running, savedAt: T0 + 4000 });
    });

    it('连续几拍：savedAt 跟着走，其余不变；之后冷启动停在最后一拍', () => {
      const st = fakeStorage();
      saveSession(running, st);
      for (const k of [1, 2, 3]) expect(touchRunning(st, T0 + k * 4000, DOC_A)).toBe(true);
      expect(stored(st).runningSince).toBe(T0 - 1000);
      // 离开练习页后一直在拍，一小时后被杀：冷启动冻结在最后一拍（T0 + 12s），而不是第一次保存的 T0
      const cold = loadSession(T0 + 3600_000, valid, DOC_B, st)!;
      expect(cold.phase).toBe('paused');
      expect(cold.elapsedMs).toBe(500 + 1000 + 12_000);
    });

    it('paused：不动，返回 false', () => {
      const st = fakeStorage();
      saveSession(session({ phase: 'paused', elapsedMs: 900 }), st);
      const before = st.m.get(SESSION_KEY);
      expect(touchRunning(st, T0 + 4000, DOC_A)).toBe(false);
      expect(st.m.get(SESSION_KEY)).toBe(before);
    });

    it('done、ready：不动，返回 false', () => {
      for (const phase of ['done', 'ready'] as const) {
        const st = fakeStorage();
        saveSession(session({ phase }), st);
        const before = st.m.get(SESSION_KEY);
        expect(touchRunning(st, T0 + 4000, DOC_A)).toBe(false);
        expect(st.m.get(SESSION_KEY)).toBe(before);
      }
    });

    it('坏 JSON、读不到、不是对象：返回 false，不改存储', () => {
      for (const raw of ['{oops', 'null', '"x"', '42']) {
        const st = fakeStorage({ [SESSION_KEY]: raw });
        expect(touchRunning(st, T0, DOC_A)).toBe(false);
        expect(st.m.get(SESSION_KEY)).toBe(raw);
      }
      expect(touchRunning(fakeStorage(), T0, DOC_A)).toBe(false);
    });

    it('storage 为 null 或抛异常：返回 false，不抛', () => {
      expect(touchRunning(null, T0, DOC_A)).toBe(false);
      const broken = {
        getItem: () => {
          throw new Error('denied');
        },
        setItem: () => {
          throw new Error('quota');
        },
        removeItem: () => {},
      };
      expect(touchRunning(broken, T0, DOC_A)).toBe(false);
      // 读得到但写不进去
      const st = fakeStorage();
      saveSession(running, st);
      const readOnly = { ...st, setItem: () => { throw new Error('quota'); } };
      expect(touchRunning(readOnly, T0 + 4000, DOC_A)).toBe(false);
    });

    it('别的文档写的 running 不碰（不替死掉的文档续命）；不传 docId 则不检查', () => {
      const st = fakeStorage();
      saveSession(running, st); // docId = DOC_A
      const before = st.m.get(SESSION_KEY);
      expect(touchRunning(st, T0 + 4000, DOC_B)).toBe(false);
      expect(st.m.get(SESSION_KEY)).toBe(before);
      expect(touchRunning(st, T0 + 4000)).toBe(true);
    });

    it('心跳间隔是 4 秒', () => {
      expect(HEARTBEAT_MS).toBe(4000);
    });
  });

  it('node 测试里写入 running 不会启动真的 interval（没有 window）', () => {
    expect(typeof window).toBe('undefined');
    const st = fakeStorage();
    saveSession(session({ phase: 'running', runningSince: T0 }), st);
    expect(() => clearSession(st)).not.toThrow();
  });

  it('storage 不可用（null / 抛异常）时不抛', () => {
    expect(() => saveSession(session(), null)).not.toThrow();
    expect(loadSession(T0, valid, DOC_A, null)).toBeNull();
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
    expect(loadSession(T0, valid, DOC_A, broken)).toBeNull();
    expect(() => clearSession(broken)).not.toThrow();
  });
});
