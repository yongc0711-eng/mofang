import { invertMoves, type Move } from './cube';
import { movesToString, parseAlg } from './alg';
import { type AlgCase, type LearnStatus, type SetId, type UserData } from '../types';

/** 只有顶层整体转动不改变情形的公式组才加随机 AUF；F2L 和 LSE 的起始状态对 U 敏感 */
const AUF_SETS: SetId[] = ['oll', 'pll', 'cmll'];
const AUFS = ['', 'U', "U'", 'U2'];

/**
 * 打乱 = 随机 AUF + 情形定义公式（algs[0]）的逆。返回字符串，可直接显示。
 * 起始状态只由情形决定，和用户选的主公式无关，所以不接收公式参数。
 */
export function scrambleFor(c: AlgCase, rand: () => number = Math.random): string {
  const inv: Move[] = invertMoves(parseAlg(c.algs[0]));
  const auf = AUF_SETS.includes(c.set) ? AUFS[Math.floor(rand() * AUFS.length)] : '';
  return [auf, movesToString(inv)].filter(Boolean).join(' ');
}

const STATUS_WEIGHT: Record<LearnStatus, number> = { learning: 3, none: 1, mastered: 0.5 };

/** 出题权重：学习中优先；没练过的略高；平均用时越慢权重越高 */
export function weightOf(c: AlgCase, user: UserData, meanAvg: number): number {
  const u = user.cases[c.id];
  const status = u?.status ?? 'none';
  const t = u?.times?.filter((x) => Number.isFinite(x));
  let speed = 1.5;
  if (t?.length) {
    const avg = t.reduce((a, b) => a + b, 0) / t.length;
    speed = meanAvg > 0 ? Math.min(3, Math.max(0.5, avg / meanAvg)) : 1;
  }
  return STATUS_WEIGHT[status] * speed;
}

/** 按权重随机选一个，尽量不和上一题相同 */
export function pickCase(
  pool: AlgCase[],
  user: UserData,
  lastId: string | null,
  rand: () => number = Math.random,
): AlgCase | null {
  if (!pool.length) return null;
  const choices = pool.length > 1 ? pool.filter((c) => c.id !== lastId) : pool;
  const avgs = pool.flatMap((c) => {
    const t = user.cases[c.id]?.times?.filter((x) => Number.isFinite(x));
    return t?.length ? [t.reduce((a, b) => a + b, 0) / t.length] : [];
  });
  const meanAvg = avgs.length ? avgs.reduce((a, b) => a + b, 0) / avgs.length : 0;
  const weights = choices.map((c) => weightOf(c, user, meanAvg));
  let r = rand() * weights.reduce((a, b) => a + b, 0);
  for (let i = 0; i < choices.length; i++) {
    r -= weights[i];
    if (r < 0) return choices[i];
  }
  return choices[choices.length - 1];
}
