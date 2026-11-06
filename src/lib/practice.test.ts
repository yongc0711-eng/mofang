import { describe, expect, it } from 'vitest';
import { ALL_CASES, getSet } from '../data';
import { parseAlg } from './alg';
import { invertMoves } from './cube';
import { pickCase, scrambleFor } from './practice';
import { type UserData } from '../types';

const empty: UserData = { version: 1, cases: {} };

describe('练习打乱', () => {
  it('所有情形的打乱都能解析，且不加 AUF 时恰为公式的逆', () => {
    for (const c of ALL_CASES) {
      const s = scrambleFor(c, c.algs[0], () => 0);
      expect(parseAlg(s)).toEqual(invertMoves(parseAlg(c.algs[0])));
    }
  });
  it('只有 OLL/PLL/CMLL 加 AUF', () => {
    const pll = getSet('pll')!.cases[0];
    const f2l = getSet('f2l')!.cases[0];
    expect(scrambleFor(pll, pll.algs[0], () => 0.3).startsWith('U')).toBe(true);
    expect(scrambleFor(f2l, f2l.algs[0], () => 0.3)).toBe(scrambleFor(f2l, f2l.algs[0], () => 0));
  });
});

describe('出题', () => {
  const pool = getSet('pll')!.cases;
  it('空范围返回 null，单个情形可重复', () => {
    expect(pickCase([], empty, null)).toBeNull();
    expect(pickCase([pool[0]], empty, pool[0].id)?.id).toBe(pool[0].id);
  });
  it('不连续重复同一题', () => {
    for (let i = 0; i < 50; i++) expect(pickCase(pool, empty, pool[0].id)?.id).not.toBe(pool[0].id);
  });
  it('学习中和更慢的情形更常出现', () => {
    const user: UserData = {
      version: 1,
      cases: {
        [pool[0].id]: { status: 'learning', times: [20000] },
        [pool[1].id]: { status: 'mastered', times: [2000] },
      },
    };
    let a = 0;
    let b = 0;
    for (let i = 0; i < 2000; i++) {
      const id = pickCase([pool[0], pool[1]], user, null)!.id;
      if (id === pool[0].id) a++;
      else b++;
    }
    expect(a).toBeGreaterThan(b * 3);
  });
});
