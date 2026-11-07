import { useSyncExternalStore } from 'react';
import { algSolvesCase } from '../lib/cases';
import { type AlgCase, type LearnStatus, type UserCaseData, type UserData } from '../types';

/**
 * 用户数据（进度、收藏、自定义公式）只存在本机浏览器。
 * 手机和电脑之间不自动同步，靠“我的”页面的导出/导入迁移。
 */
const KEY = 'mofang.user.v1';
const EMPTY: UserData = { version: 1, cases: {} };

function load(): UserData {
  try {
    const raw = localStorage.getItem(KEY);
    if (!raw) return EMPTY;
    const parsed = JSON.parse(raw) as UserData;
    return parsed?.version === 1 && parsed.cases ? parsed : EMPTY;
  } catch {
    return EMPTY;
  }
}

let data: UserData = typeof localStorage === 'undefined' ? EMPTY : load();
const listeners = new Set<() => void>();

function commit(next: UserData) {
  data = next;
  try {
    localStorage.setItem(KEY, JSON.stringify(next));
  } catch {
    // 隐私模式等情况下写入失败：本次会话内仍可用
  }
  listeners.forEach((l) => l());
}

function patchCase(id: string, patch: (c: UserCaseData) => UserCaseData) {
  commit({ ...data, cases: { ...data.cases, [id]: patch(data.cases[id] ?? {}) } });
}

const subscribe = (l: () => void) => {
  listeners.add(l);
  return () => listeners.delete(l);
};

export const useUserData = () => useSyncExternalStore(subscribe, () => data);

export const setStatus = (id: string, status: LearnStatus) => patchCase(id, (c) => ({ ...c, status }));

export const toggleFavorite = (id: string) => patchCase(id, (c) => ({ ...c, favorite: !c.favorite }));

export const setPrimaryAlg = (id: string, alg: string) => patchCase(id, (c) => ({ ...c, primaryAlg: alg }));

/** setPrimary 为 false 时只保存，不改变当前主公式（强制保存解决不了情形的公式时用） */
export const addCustomAlg = (id: string, alg: string, setPrimary = true) =>
  patchCase(id, (c) => ({
    ...c,
    customAlgs: [...(c.customAlgs ?? []).filter((a) => a !== alg), alg],
    ...(setPrimary ? { primaryAlg: alg } : {}),
  }));

export const removeCustomAlg = (id: string, alg: string) =>
  patchCase(id, (c) => ({
    ...c,
    customAlgs: (c.customAlgs ?? []).filter((a) => a !== alg),
    primaryAlg: c.primaryAlg === alg ? undefined : c.primaryAlg,
  }));

const MAX_TIMES = 10;

export const addTime = (id: string, ms: number) =>
  patchCase(id, (c) => ({ ...c, times: [...(c.times ?? []), ms].slice(-MAX_TIMES) }));

export const clearTimes = (id: string) => patchCase(id, ({ times: _t, ...rest }) => rest);

/** 最近一次用时和最近几次的平均，没有记录时为 null */
export function timeStats(id: string, user: UserData): { last: number; avg: number; best: number; count: number } | null {
  const t = user.cases[id]?.times?.filter((x) => Number.isFinite(x));
  if (!t?.length) return null;
  return { last: t[t.length - 1], avg: t.reduce((a, b) => a + b, 0) / t.length, best: Math.min(...t), count: t.length };
}

export const formatTime = (ms: number) => (ms / 1000).toFixed(2);

export const exportUserData = () => JSON.stringify(data, null, 2);

const isPlainObject = (value: unknown): value is Record<string, unknown> =>
  typeof value === 'object' && value !== null &&
  (Object.getPrototypeOf(value) === Object.prototype || Object.getPrototypeOf(value) === null);

/** 只复制已知且类型正确的字段；单字段错误不影响同条情形的其他数据。 */
function sanitizeCase(value: Record<string, unknown>): UserCaseData {
  const result: UserCaseData = {};
  if (value.status === 'none' || value.status === 'learning' || value.status === 'mastered') result.status = value.status;
  if (typeof value.favorite === 'boolean') result.favorite = value.favorite;
  if (typeof value.primaryAlg === 'string') result.primaryAlg = value.primaryAlg;
  if (Array.isArray(value.customAlgs)) result.customAlgs = value.customAlgs.filter((a): a is string => typeof a === 'string');
  if (Array.isArray(value.times)) {
    result.times = value.times.filter((t): t is number => typeof t === 'number' && Number.isFinite(t) && t > 0);
  }
  return result;
}

/** 顶层不合法时不动现有数据；合法备份逐情形、逐字段清洗后覆盖本机数据。 */
export function importUserData(json: string) {
  let parsed: unknown;
  try {
    parsed = JSON.parse(json);
  } catch {
    throw new Error('不是有效的备份文件');
  }
  if (!isPlainObject(parsed) || parsed.version !== 1 || !isPlainObject(parsed.cases)) {
    throw new Error('不是有效的备份文件');
  }
  const cases = Object.fromEntries(
    Object.entries(parsed.cases).flatMap(([id, value]) => isPlainObject(value) ? [[id, sanitizeCase(value)]] : []),
  );
  commit({ version: 1, cases });
}
const solvesCache = new Map<string, boolean>();
/** 自定义公式能否解决这个情形；结果缓存，列表页每次渲染都会问 */
function customSolves(c: AlgCase, alg: string): boolean {
  const key = `${c.id}|${alg}`;
  let r = solvesCache.get(key);
  if (r === undefined) {
    try {
      r = algSolvesCase(c, alg);
    } catch {
      r = false;
    }
    solvesCache.set(key, r);
  }
  return r;
}

/**
 * 这个情形当前该显示的主公式：用户选定的优先，其次是内置第一条。
 * 选定的公式如果解决不了该情形（强制保存的、或导入的备份里带来的），回退到 algs[0]。
 */
export function primaryAlgOf(c: AlgCase, user: UserData): string {
  const u = user.cases[c.id];
  const p = u?.primaryAlg;
  if (!p) return c.algs[0];
  if (c.algs.includes(p)) return p;
  return (u?.customAlgs ?? []).includes(p) && customSolves(c, p) ? p : c.algs[0];
}

export const statusOf = (c: AlgCase, user: UserData): LearnStatus => user.cases[c.id]?.status ?? 'none';

export const STATUS_LABEL: Record<LearnStatus, string> = {
  none: '未学',
  learning: '学习中',
  mastered: '已掌握',
};
