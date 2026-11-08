import { getSet } from '../data';
import { primaryAlgOf } from '../store/userStore';
import { type AlgCase, type UserData } from '../types';

// 公式片段比较时忽略空格、括号和中英文撇号差异
export const squash = (s: string) => s.replace(/[\s()（）]/g, '').replace(/[’‘]/g, "'");

export function matches(c: AlgCase, q: string, user: UserData): boolean {
  const lower = q.toLowerCase();
  const text = [c.name, c.id, c.group, getSet(c.set)?.name ?? '', ...(c.aliases ?? [])];
  if (text.some((t) => t.toLowerCase().includes(lower))) return true;
  // 公式区分大小写：r 和 R 是不同转动
  const needle = squash(q);
  const algs = [...c.algs, ...(user.cases[c.id]?.customAlgs ?? []), primaryAlgOf(c, user)];
  return algs.some((a) => squash(a).includes(needle));
}

