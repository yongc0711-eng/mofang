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
      const s = scrambleFor(c, () => 0);
      expect(parseAlg(s)).toEqual(invertMoves(parseAlg(c.algs[0])));
    }
  });
  it('只有 OLL/PLL/CMLL 加 AUF', () => {
    const pll = getSet('pll')!.cases[0];
    const f2l = getSet('f2l')!.cases[0];
    expect(scrambleFor(pll, () => 0.3).startsWith('U')).toBe(true);
    expect(scrambleFor(f2l, () => 0.3)).toBe(scrambleFor(f2l, () => 0));
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

describe('打乱与主公式无关', () => {
  it('起始状态只由 algs[0] 决定，用户选了别的主公式也一样', async () => {
    const { setPrimaryAlg, addCustomAlg, importUserData } = await import('../store/userStore');
    importUserData(JSON.stringify(empty));
    for (const c of ALL_CASES) {
      const expected = scrambleFor(c, () => 0);
      const other = c.algs[1] ?? ALL_CASES.find((x) => x.id !== c.id)!.algs[0];
      addCustomAlg(c.id, other, false);
      setPrimaryAlg(c.id, other);
      expect(scrambleFor(c, () => 0)).toBe(expected);
    }
    importUserData(JSON.stringify(empty));
  });
  it('四种 AUF 之外不会混入别的转动', () => {
    const pll = getSet('pll')!.cases[0];
    const base = scrambleFor(pll, () => 0);
    for (const r of [0, 0.3, 0.6, 0.9]) {
      const s = scrambleFor(pll, () => r);
      expect(s.endsWith(base)).toBe(true);
      expect(['', 'U', "U'", 'U2']).toContain(s.slice(0, s.length - base.length).trim());
    }
  });
});
