import { describe, expect, it } from 'vitest';
import { ALL_CASES } from '../data';
import { caseState, SET_RULES } from './cases';
import { parseAlg } from './alg';
import { applyMoves, invertMoves, STICKERS } from './cube';
import { scrambleFor } from './practice';
import { sampleTarget } from './practiceSample';

describe('T37 target sampler preserves selected stage and case, independently of solver', () => {
  for (const c of ALL_CASES) {
    it(`${c.id}: AUF and allowed nuisance permutations preserve the case`, () => {
      for (const rand of [0, 0.3, 0.6, 0.9]) {
        for (const variation of [0, 0.4, 0.8]) {
          const sample = sampleTarget(c, scrambleFor(c, () => rand), () => variation);
          const unauf = applyMoves(sample.state, invertMoves(parseAlg(sample.auf)));
          const reference = caseState(c);
          for (let i = 0; i < 54; i++) {
            if (c.set === 'oll') {
              // Exact U-color orientation category; entire F2L remains untouched.
              expect(STICKERS[unauf[i]].face === 'U').toBe(STICKERS[reference[i]].face === 'U');
              if (STICKERS[i].p[1] !== 1) expect(unauf[i]).toBe(reference[i]);
            } else if (c.set === 'cmll') {
              if (STICKERS[i].p.every(Boolean) || SET_RULES.cmll.preserve(i)) expect(unauf[i]).toBe(reference[i]);
            } else expect(unauf[i]).toBe(reference[i]);
          }
          if (c.set === 'f2l' || c.set === 'lse') expect(sample.auf).toBe('');
        }
      }
    });
  }
  it('rejects an invalid reference rather than guessing a target', () => {
    expect(() => sampleTarget(ALL_CASES[0], 'broken')).toThrow('参考');
  });
});
