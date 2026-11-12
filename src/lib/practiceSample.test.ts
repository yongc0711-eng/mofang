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
          if (c.set === 'wv') expect(sample.variation).toBe(0);
          if (c.set === 'coll') {
            expect(sample.variation).toBe(0);
            expect(sample.auf).toBe(['', 'U', "U'", 'U2'][[0, 0.3, 0.6, 0.9].indexOf(rand)]);
          }
          for (let i = 0; i < 54; i++) {
            if (c.set === 'eolr') {
              const p = STICKERS[reference[i]].p;
              const otherMEdge = p[0] === 0 && p[1] !== 0 && p[2] !== 0;
              if (otherMEdge) {
                expect(STICKERS[unauf[i]].p[0]).toBe(0);
                expect(STICKERS[unauf[i]].p[1]).not.toBe(0);expect(STICKERS[unauf[i]].p[2]).not.toBe(0);
                expect('UD'.includes(STICKERS[unauf[i]].face)).toBe('UD'.includes(STICKERS[reference[i]].face));
              } else expect(unauf[i]).toBe(reference[i]);
            } else if (c.set === 'oll') {
              // Exact U-color orientation category; entire F2L remains untouched.
              expect(STICKERS[unauf[i]].face === 'U').toBe(STICKERS[reference[i]].face === 'U');
              if (STICKERS[i].p[1] !== 1) expect(unauf[i]).toBe(reference[i]);
            } else if (c.set === 'cmll') {
              if (STICKERS[i].p.every(Boolean) || SET_RULES.cmll.preserve(i)) expect(unauf[i]).toBe(reference[i]);
            } else expect(unauf[i]).toBe(reference[i]);
          }
          if (c.set === 'f2l' || c.set === 'lse' || c.set === 'sbls' || c.set === 'wv') expect(sample.auf).toBe('');
        }
      }
    });
  }
  it('rejects an invalid reference rather than guessing a target', () => {
    expect(() => sampleTarget(ALL_CASES[0], 'broken')).toThrow('参考');
  });
});
