import { STATUS_LABEL, statusOf } from '../store/userStore';
import type { AlgCase, UserData } from '../types';

export const MY_CASE_FILTERS = [
  { filter: 'mastered', label: STATUS_LABEL.mastered, path: 'mastered' },
  { filter: 'learning', label: STATUS_LABEL.learning, path: 'learning' },
  { filter: 'favorite', label: '收藏', path: 'favorites' },
] as const;

export type MyCaseList = (typeof MY_CASE_FILTERS)[number];
export type MyCaseFilter = MyCaseList['filter'];

export function matchesMyCase(c: AlgCase, user: UserData, filter: MyCaseFilter | 'none') {
  return filter === 'favorite' ? !!user.cases[c.id]?.favorite : statusOf(c, user) === filter;
}
