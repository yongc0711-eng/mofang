import { useSyncExternalStore } from 'react';
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

export const addCustomAlg = (id: string, alg: string) =>
  patchCase(id, (c) => ({
    ...c,
    customAlgs: [...(c.customAlgs ?? []).filter((a) => a !== alg), alg],
    primaryAlg: alg,
  }));

export const removeCustomAlg = (id: string, alg: string) =>
  patchCase(id, (c) => ({
    ...c,
    customAlgs: (c.customAlgs ?? []).filter((a) => a !== alg),
    primaryAlg: c.primaryAlg === alg ? undefined : c.primaryAlg,
  }));

export const exportUserData = () => JSON.stringify(data, null, 2);

/** 导入会覆盖本机数据。格式不对时抛错，不会动现有数据 */
export function importUserData(json: string) {
  const parsed = JSON.parse(json) as UserData;
  if (parsed?.version !== 1 || typeof parsed.cases !== 'object' || parsed.cases === null) {
    throw new Error('不是有效的备份文件');
  }
  commit(parsed);
}

/** 这个情形当前该显示的主公式：用户选定的优先，其次是内置第一条 */
export function primaryAlgOf(c: AlgCase, user: UserData): string {
  const u = user.cases[c.id];
  const candidates = [...c.algs, ...(u?.customAlgs ?? [])];
  return u?.primaryAlg && candidates.includes(u.primaryAlg) ? u.primaryAlg : c.algs[0];
}

export const statusOf = (c: AlgCase, user: UserData): LearnStatus => user.cases[c.id]?.status ?? 'none';

export const STATUS_LABEL: Record<LearnStatus, string> = {
  none: '未学',
  learning: '学习中',
  mastered: '已掌握',
};
