import { describe, expect, it } from 'vitest';
import { ALL_CASES, getSet } from '../data';
import { movesToString, parseAlg } from './alg';
import { caseState } from './cases';
import { applyMoves, invertMoves, solved } from './cube';
import { pickCase, scrambleFor } from './practice';
import { type UserData } from '../types';

const empty: UserData = { version: 1, cases: {} };

describe('练习打乱', () => {
  it('WV 固定相连对起手，随机数不增加 AUF', () => {
    for (const c of getSet('wv')!.cases) {
      const base = scrambleFor(c, () => 0);
      for (const rand of [0, 0.3, 0.6, 0.9]) expect(scrambleFor(c, () => rand)).toBe(base);
    }
  });
  it('不加 AUF 时为等价无转体公式的逆；无外围转体的定义逐步保持不变', () => {
    for (const c of ALL_CASES) {
      const s = scrambleFor(c, () => 0);
      // Explicit x-conjugation expectations, not produced by the implementation.
      const mapped: Record<string, string> = {
        'pll-aa': "R' F R' B2 R F' R' B2 R2",
        'pll-ab': "R2 B2 R F R' B2 R F' R",
      };
      expect(parseAlg(s)).toEqual(invertMoves(parseAlg(mapped[c.id] ?? c.algs[0])));
    }
  });
  it('原有 OLL/PLL/CMLL 的 AUF 与 F2L 固定起手保持不变', () => {
    const pll = getSet('pll')!.cases[0];
    const f2l = getSet('f2l')!.cases[0];
    expect(scrambleFor(pll, () => 0.3).startsWith('U')).toBe(true);
    expect(scrambleFor(f2l, () => 0.3)).toBe(scrambleFor(f2l, () => 0));
  });
  it('COLL 四种 AUF 均可抽到，保留 EO 的情形定义不变', () => {
    for (const c of getSet('coll')!.cases) {
      const base = scrambleFor(c, () => 0);
      expect([0, 0.3, 0.6, 0.9].map((rand) => scrambleFor(c, () => rand))).toEqual(
        [base, `U ${base}`, `U' ${base}`, `U2 ${base}`],
      );
    }
  });
  it('SBLS 保留固定起手，四个随机区间都不额外加 AUF', () => {
    for (const c of getSet('sbls')!.cases) {
      const base = scrambleFor(c, () => 0);
      for (const rand of [0, 0.3, 0.6, 0.9]) expect(scrambleFor(c, () => rand)).toBe(base);
    }
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

describe('固定起手、无整体转体的打乱（T22）', () => {
  for (const c of ALL_CASES) {
    it(`${c.id}：打乱不含 x/y/z`, () => {
      expect(parseAlg(scrambleFor(c, () => 0)).filter((m) => ['x', 'y', 'z'].includes(m.base))).toEqual([]);
    });
    it(`${c.id}：无 AUF 打乱原始 54 张贴纸与 caseState 完全相同`, () => {
      const scramble = scrambleFor(c, () => 0);
      // Compare all 54 stickers directly: no finish/normalization on the scramble.
      expect(applyMoves(solved(), parseAlg(scramble))).toEqual(caseState(c));
    });
  }
  for (const id of ['pll-aa', 'pll-ab']) {
    it(`${id}：单独回归不含 x 且 54 张贴纸相同`, () => {
      const c = ALL_CASES.find((c) => c.id === id)!;
      const moves = parseAlg(scrambleFor(c, () => 0));
      expect(moves.some((m) => m.base === 'x')).toBe(false);
      expect(applyMoves(solved(), moves)).toEqual(caseState(c));
    });
  }
});

describe('外围转体的等价改写（T22）', () => {
  for (const prefix of ['x', "x'", 'x2', 'y', "y'", 'y2', 'z', "z'", 'z2', 'x y']) {
    it(`${prefix} 共轭保持面转、宽转和中层转的逐贴纸置换`, () => {
      for (const base of 'RLUDFBMESrludfb') {
        for (const amount of ['', "'", '2']) {
          const suffix = movesToString(invertMoves(parseAlg(prefix)));
          const alg = `${prefix} ${base}${amount} ${suffix}`;
          const c = { ...ALL_CASES[0], algs: [alg] };
          const output = parseAlg(scrambleFor(c, () => 0));
          expect(output.some((m) => 'xyz'.includes(m.base))).toBe(false);
          expect(applyMoves(solved(), output)).toEqual(applyMoves(solved(), invertMoves(parseAlg(alg))));
        }
      }
    });
  }
  it('中间仍有转体时显式报错，不静默输出', () => {
    const c = { ...ALL_CASES[0], algs: ["x R y U x'"] };
    expect(() => scrambleFor(c, () => 0)).toThrow(`${c.id} 的定义公式中间含整体转体`);
  });
});

import { pickBottom } from './practice';
describe('T52 pickBottom', () => {
  it('single color returns directly without consuming randomness', () => {
    let calls = 0;
    expect(pickBottom(['green'] as const, 'green', () => { calls++; return 0.5; })).toBe('green');
    expect(calls).toBe(0);
  });
  it('multiple colors exclude the previous question color', () => {
    expect(pickBottom(['white', 'green', 'blue'], 'green', () => 0)).toBe('white');
    expect(pickBottom(['white', 'green', 'blue'], 'green', () => 0.99)).toBe('blue');
  });
  it('first question and an absent last color can choose any selected color', () => {
    expect(pickBottom(['white', 'green'], null, () => 0)).toBe('white');
    expect(pickBottom(['white', 'green'], 'blue', () => 0.99)).toBe('green');
  });
  it('every pick stays in the selected set and avoids repeats for a full sequence', () => {
    const colors = ['white', 'yellow', 'red', 'orange', 'green', 'blue'];
    let last: string | null = null;
    for (let i = 0; i < 100; i++) {
      const chosen: string = pickBottom(colors, last, () => (i % 11) / 10);
      expect(colors).toContain(chosen);
      expect(chosen).not.toBe(last);
      last = chosen;
    }
  });
  it('empty selection throws instead of yielding undefined', () => {
    expect(() => pickBottom([], null)).toThrow('至少选择一种练习底色');
  });
  for (const random of [-1, 0, 0.999, 1, 100, NaN, Infinity, -Infinity]) {
    it(`index is bounded for rand=${random}`, () => {
      const colors = ['white', 'green', 'blue'];
      const chosen = pickBottom(colors, 'green', () => random);
      expect(['white', 'blue']).toContain(chosen);
    });
  }
  it('duplicate entries cannot produce an undefined color', () => {
    expect(pickBottom(['white', 'white'], 'white', () => 1)).toBe('white');
  });
});
