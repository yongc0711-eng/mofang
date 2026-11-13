import { describe, expect, it } from 'vitest';
import { matches, squash } from './search';
import { type AlgCase, type UserData } from '../types';

const c: AlgCase = { id: 'pll-example', set: 'pll', name: 'Example', group: '只换角', aliases: ['别名'], algs: ["R U R'", 'F2 D'] };
const user: UserData = { version: 1, cases: {} };

describe('shared search semantics', () => {
  it('normalizes spaces, both parentheses and Chinese apostrophes', () => {
    expect(squash(' （R U）(R’) R‘ ')).toBe("RUR'R'");
  });
  it.each(['EXAMPLE', 'PLL-EXAMPLE', '只换角', '别名', 'pll'])('matches metadata case insensitively: %s', (q) => {
    expect(matches(c, q, user)).toBe(true);
  });
  it('matches built-in alternatives and normalized algorithm fragments', () => {
    expect(matches(c, '(R U R’)', user)).toBe(true);
    expect(matches(c, 'F2D', user)).toBe(true);
  });
  it('keeps move case significant', () => {
    expect(matches(c, 'r U r\'', user)).toBe(false);
  });
  it('includes custom algorithms and retains stale primary fallback', () => {
    const custom: UserData = { version: 1, cases: { [c.id]: { customAlgs: ['M2 E2'], primaryAlg: 'S2 B2' } } };
    expect(matches(c, 'M2E2', custom)).toBe(true);
    expect(matches(c, 'S2B2', custom)).toBe(false);
    expect(matches(c, "RUR'", custom)).toBe(true);
  });
  it('returns false for no match, and retains the original empty-query helper behavior', () => {
    expect(matches(c, '不存在的情形', user)).toBe(false);
    expect(matches(c, '', user)).toBe(true);
  });
});

import { ALL_CASES } from '../data';
describe('2x2 search integration', () => {
  it('matches 二阶, CLL, EG-1, EG-2 and 2x2 ids/names/groups without leaking into 3x3', () => {
    const two = ALL_CASES.filter((x) => matches(x, '二阶', user));
    expect(two).toHaveLength(126);
    expect(ALL_CASES.filter((x) => matches(x, 'CLL', user)).every((x) => x.set === 'cll')).toBe(true);
    expect(ALL_CASES.filter((x) => matches(x, 'EG-1', user))).toHaveLength(42);
    expect(ALL_CASES.filter((x) => matches(x, 'EG-2', user))).toHaveLength(42);
    expect(ALL_CASES.filter((x) => matches(x, 'cll-as-1', user)).map((x) => x.id)).toEqual(['cll-as-1']);
    expect(ALL_CASES.filter((x) => matches(x, 'EG-1 Diagonal', user)).map((x) => x.id)).toEqual(['eg1-diag-1']);
  });
});
