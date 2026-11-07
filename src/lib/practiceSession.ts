/**
 * 练习会话的计时状态机和持久化。
 *
 * 计时用 Date.now()（epoch ms）而不是 performance.now()：页面被切到后台时 rAF 会暂停，
 * 回来再补差值会让用时跳变，所以离开页面前一律先冻结。
 * 会话存在 localStorage，靠 savedAt 判断过期；这里不依赖 React，方便单测。
 */
export const SESSION_KEY = 'mofang.practice.v1';
/** 会话最长保留 2 小时 */
export const SESSION_TTL_MS = 2 * 60 * 60 * 1000;

export type SessionPhase = 'ready' | 'running' | 'paused' | 'done';
const PHASES: SessionPhase[] = ['ready', 'running', 'paused', 'done'];

/** 计时部分：elapsedMs 是 runningSince 之前已累计的毫秒数 */
export interface Timer {
  phase: SessionPhase;
  elapsedMs: number;
  /** 本段计时开始的 epoch ms；不在计时时为 null */
  runningSince: number | null;
}

export interface SessionQuestion {
  id: string;
  alg: string;
  scramble: string;
}

export interface PracticeSession extends Timer {
  poolIds: string[];
  question: SessionQuestion;
  count: number;
  savedAt: number;
}

/** 此刻的用时。不在计时（或 runningSince 缺失）时就是已累计的值；时钟倒退按 0 处理 */
export function elapsedOf(t: Timer, now: number): number {
  if (t.phase === 'running' && t.runningSince !== null) return t.elapsedMs + Math.max(0, now - t.runningSince);
  return t.elapsedMs;
}

/** 冻结：正在计时就把用时结算进 elapsedMs，变成 paused。其他阶段原样返回（同一个对象） */
export function freeze<T extends Timer>(t: T, now: number): T {
  if (t.phase !== 'running') return t;
  return { ...t, phase: 'paused', elapsedMs: elapsedOf(t, now), runningSince: null };
}

/** ready → running，从 0 开始 */
export function startTimer<T extends Timer>(t: T, now: number): T {
  return { ...t, phase: 'running', elapsedMs: 0, runningSince: now };
}

/** paused → running，保留已累计的用时 */
export function resumeTimer<T extends Timer>(t: T, now: number): T {
  return { ...t, phase: 'running', runningSince: now };
}

/** running → done，用时定格 */
export function stopTimer<T extends Timer>(t: T, now: number): T {
  return { ...t, phase: 'done', elapsedMs: elapsedOf(t, now), runningSince: null };
}

const isNum = (x: unknown): x is number => typeof x === 'number' && Number.isFinite(x);
const isStr = (x: unknown): x is string => typeof x === 'string';

/**
 * 校验并还原一份保存的会话。过期、格式不对、题目 id 不存在、范围为空都返回 null。
 * 范围里个别 id 已不存在（数据更新过）就丢掉那几个，剩下为空才放弃。
 * 保存时还在计时的，按保存时刻冻结成 paused，不把离开的时间算进去。
 */
export function parseSession(raw: string | null, now: number, validId: (id: string) => boolean): PracticeSession | null {
  if (!raw) return null;
  let v: unknown;
  try {
    v = JSON.parse(raw);
  } catch {
    return null;
  }
  if (!v || typeof v !== 'object') return null;
  const o = v as Record<string, unknown>;
  if (!isNum(o.savedAt) || now - o.savedAt > SESSION_TTL_MS) return null;
  if (!Array.isArray(o.poolIds) || !o.poolIds.every(isStr)) return null;
  const poolIds = o.poolIds.filter(validId);
  if (poolIds.length === 0) return null;
  const q = o.question as Record<string, unknown> | null;
  if (!q || typeof q !== 'object' || !isStr(q.id) || !isStr(q.alg) || !isStr(q.scramble) || !validId(q.id)) return null;
  if (!PHASES.includes(o.phase as SessionPhase)) return null;
  if (!isNum(o.count) || o.count < 0 || !Number.isInteger(o.count)) return null;
  if (!isNum(o.elapsedMs) || o.elapsedMs < 0) return null;
  if (o.runningSince !== null && !isNum(o.runningSince)) return null;
  const session: PracticeSession = {
    poolIds,
    question: { id: q.id, alg: q.alg, scramble: q.scramble },
    phase: o.phase as SessionPhase,
    count: o.count,
    elapsedMs: o.elapsedMs,
    runningSince: o.phase === 'running' ? (o.runningSince as number | null) : null,
    savedAt: o.savedAt,
  };
  // 在计时的会话按保存时刻冻结；之后的时间是人不在的时间
  return freeze(session, session.savedAt);
}

/** 要写入的 JSON。savedAt 由调用方给，便于测试 */
export const serializeSession = (s: PracticeSession): string => JSON.stringify(s);

type StorageLike = Pick<Storage, 'getItem' | 'setItem' | 'removeItem'>;
const defaultStorage = (): StorageLike | null => {
  try {
    return typeof localStorage === 'undefined' ? null : localStorage;
  } catch {
    return null;
  }
};

export function saveSession(s: PracticeSession, storage: StorageLike | null = defaultStorage()): void {
  try {
    storage?.setItem(SESSION_KEY, serializeSession(s));
  } catch {
    // 隐私模式等情况下写入失败：本次会话内仍可用
  }
}

/** 读取并校验；无效的会话顺手清掉，免得下次再解析 */
export function loadSession(
  now: number,
  validId: (id: string) => boolean,
  storage: StorageLike | null = defaultStorage(),
): PracticeSession | null {
  let raw: string | null = null;
  try {
    raw = storage?.getItem(SESSION_KEY) ?? null;
  } catch {
    return null;
  }
  const s = parseSession(raw, now, validId);
  if (!s && raw) clearSession(storage);
  return s;
}

export function clearSession(storage: StorageLike | null = defaultStorage()): void {
  try {
    storage?.removeItem(SESSION_KEY);
  } catch {
    // 忽略
  }
}
