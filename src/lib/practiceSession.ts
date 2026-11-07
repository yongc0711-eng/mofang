/**
 * 练习会话的计时状态机和持久化。
 *
 * 计时用 Date.now()（epoch ms），用时 = 已累计 + (now - runningSince)，所以切路由、切后台
 * 期间计时照常走，回来时用时包含离开的时间。只有重载或进程被杀（文档变了）才停下来：
 * 会话里存了 docId，读取时 docId 和当前文档相同才保持 running，否则按 savedAt 冻结成 paused。
 * 会话存在 localStorage，靠 savedAt 判断过期；这里不依赖 React，方便单测。
 */
export const SESSION_KEY = 'mofang.practice.v1';

/**
 * 当前文档（这次页面加载）的标识，模块加载时生成。
 * 不能用 sessionStorage 判断：它在重载后还在；模块级变量重载就没了，正好区分“同一文档”。
 */
export const DOC_ID = `${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 10)}`;
/** 会话最长保留 2 小时；同一文档里还在 running 的会话不受此限制 */
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
  /** 保存时的文档标识；缺失（旧数据）按“不是同一文档”处理 */
  docId?: string;
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
 *
 * 保存时还在计时（running）的：
 * - docId 和当前文档相同（只是切了路由或切了后台）：保持 running，runningSince 原样，用时包含离开的时间，
 *   也不受 2 小时过期限制；runningSince 不是数字就当数据异常，按下一条处理
 * - docId 不同或缺失（重载、冷启动、进程被杀）：按保存时刻冻结成 paused，不把死掉的时间算进去
 */
export function parseSession(
  raw: string | null,
  now: number,
  validId: (id: string) => boolean,
  docId: string,
): PracticeSession | null {
  if (!raw) return null;
  let v: unknown;
  try {
    v = JSON.parse(raw);
  } catch {
    return null;
  }
  if (!v || typeof v !== 'object') return null;
  const o = v as Record<string, unknown>;
  if (!isNum(o.savedAt)) return null;
  if (!PHASES.includes(o.phase as SessionPhase)) return null;
  const sameDoc = isStr(o.docId) && o.docId === docId;
  const live = o.phase === 'running' && sameDoc && isNum(o.runningSince);
  if (!live && now - o.savedAt > SESSION_TTL_MS) return null;
  if (!Array.isArray(o.poolIds) || !o.poolIds.every(isStr)) return null;
  const poolIds = o.poolIds.filter(validId);
  if (poolIds.length === 0) return null;
  const q = o.question as Record<string, unknown> | null;
  if (!q || typeof q !== 'object' || !isStr(q.id) || !isStr(q.alg) || !isStr(q.scramble) || !validId(q.id)) return null;
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
    ...(isStr(o.docId) ? { docId: o.docId } : {}),
  };
  // 同一文档的 running 原样保留；否则按保存时刻冻结，之后的时间是进程不在的时间
  return live ? session : freeze(session, session.savedAt);
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

/** 心跳间隔：计时中每隔这么久把 savedAt 刷新一次 */
export const HEARTBEAT_MS = 4000;

/**
 * 心跳的一拍：存储里的会话还是 running，就只把 savedAt 改成 now 写回（runningSince、elapsedMs 不动），返回 true；
 * 读不到、JSON 坏了、phase 不是 running、写入失败都返回 false，调用方据此停掉心跳。
 * 传了 docId 时，只刷新这个文档写的会话，别的文档写的不碰，免得替一个已经死掉的文档续命。
 */
export function touchRunning(storage: StorageLike | null, now: number, docId?: string): boolean {
  if (!storage) return false;
  try {
    const raw = storage.getItem(SESSION_KEY);
    if (!raw) return false;
    const o = JSON.parse(raw) as Record<string, unknown> | null;
    if (!o || typeof o !== 'object' || o.phase !== 'running') return false;
    if (docId !== undefined && o.docId !== docId) return false;
    storage.setItem(SESSION_KEY, JSON.stringify({ ...o, savedAt: now }));
    return true;
  } catch {
    return false;
  }
}

/**
 * 模块级心跳：不属于任何组件，切到别的页面（练习页卸载）后继续跑，
 * 这样进程被杀或刷新之后，冷启动按最后一次 savedAt 冻结，丢掉的时间最多一个周期。
 * 后台标签页会被浏览器节流，所以不保证严格 4 秒，冷启动最多丢一个节流周期。
 * 没有 window（node 测试）不启动。
 */
let heartbeat: { id: number; storage: StorageLike } | null = null;

function startHeartbeat(storage: StorageLike | null): void {
  if (typeof window === 'undefined' || !storage) return;
  if (heartbeat) {
    heartbeat.storage = storage;
    return;
  }
  const h = { id: 0, storage };
  h.id = window.setInterval(() => {
    if (!touchRunning(h.storage, Date.now(), DOC_ID)) stopHeartbeat();
  }, HEARTBEAT_MS);
  heartbeat = h;
}

function stopHeartbeat(): void {
  if (!heartbeat) return;
  window.clearInterval(heartbeat.id);
  heartbeat = null;
}

/** 写入会话。写入 running 时确保心跳在跑，写入其他阶段时停掉心跳 */
export function saveSession(s: PracticeSession, storage: StorageLike | null = defaultStorage()): void {
  try {
    storage?.setItem(SESSION_KEY, serializeSession(s));
    if (s.phase === 'running') startHeartbeat(storage);
    else stopHeartbeat();
  } catch {
    // 隐私模式等情况下写入失败：本次会话内仍可用
  }
}

/** 读取并校验；无效的会话顺手清掉，免得下次再解析 */
export function loadSession(
  now: number,
  validId: (id: string) => boolean,
  docId: string,
  storage: StorageLike | null = defaultStorage(),
): PracticeSession | null {
  let raw: string | null = null;
  try {
    raw = storage?.getItem(SESSION_KEY) ?? null;
  } catch {
    return null;
  }
  const s = parseSession(raw, now, validId, docId);
  if (!s && raw) clearSession(storage);
  return s;
}

export function clearSession(storage: StorageLike | null = defaultStorage()): void {
  stopHeartbeat();
  try {
    storage?.removeItem(SESSION_KEY);
  } catch {
    // 忽略
  }
}
