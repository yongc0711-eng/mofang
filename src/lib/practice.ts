import { applyMoves, invertMoves, solved, type Move } from './cube';
import { movesToString, parseAlg } from './alg';
import { type AlgCase, type LearnStatus, type SetId, type UserData } from '../types';

/** 只有顶层整体转动不改变情形的公式组才加随机 AUF；F2L、LSE 和 SBLS 的起始状态对 U 敏感 */
const AUF_SETS: SetId[] = ['oll', 'pll', 'cmll', 'coll'];
const AUFS = ['', 'U', "U'", 'U2'];

const isRotation = (m: Move) => 'xyz'.includes(m.base);
// Reuse the engine's exact move permutations instead of changing its coordinate
// system or duplicating face/wide/slice direction tables.
const moveByPermutation = new Map<string, Move>();
for (const base of 'RLUDFBMESrludfb') {
  for (const amount of [1, 2, 3] as const) {
    const move = { base, amount };
    moveByPermutation.set(applyMoves(solved(), [move]).join(','), move);
  }
}

/** Remove outer rotations by conjugating each body move into the original frame. */
function withoutOuterRotations(moves: Move[], id: string): Move[] {
  let first = 0;
  let last = moves.length;
  while (first < last && isRotation(moves[first])) first++;
  while (last > first && isRotation(moves[last - 1])) last--;
  const body = moves.slice(first, last);
  if (body.some(isRotation)) throw new Error(`${id} 的定义公式中间含整体转体`);
  if (first === 0) return body;
  const prefix = moves.slice(0, first);
  const undo = invertMoves(prefix);
  return body.map((move) => {
    // P m P^-1, in execution order. For x ... x': U→F, D→B, R→R.
    const key = applyMoves(solved(), [...prefix, move, ...undo]).join(',');
    const mapped = moveByPermutation.get(key);
    if (!mapped) throw new Error(`${id} 的 ${move.base} 无法等价改写为无转体动作`);
    return mapped;
  });
}
/**
 * 打乱 = 随机 AUF + 情形定义公式去除外围转体（等价面转改写）后的逆。
 * 起始状态只由情形决定，和用户选的主公式无关，所以不接收公式参数。
 */
export function scrambleFor(c: AlgCase, rand: () => number = Math.random): string {
  const inv: Move[] = invertMoves(withoutOuterRotations(parseAlg(c.algs[0]), c.id));
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

/** Pick a per-question color, avoiding an immediate repeat when alternatives exist. */
export function pickBottom<T extends string>(colors: readonly T[], last: T | null, rand: () => number = Math.random): T {
  if (colors.length === 0) throw new Error('至少选择一种练习底色');
  if (colors.length === 1) return colors[0];
  const choices = colors.filter((color) => color !== last);
  if (choices.length === 0) return colors[0];
  const rawIndex = Math.floor(rand() * choices.length);
  const index = Number.isNaN(rawIndex) ? 0 : Math.max(0, Math.min(choices.length - 1, rawIndex));
  return choices[index];
}
