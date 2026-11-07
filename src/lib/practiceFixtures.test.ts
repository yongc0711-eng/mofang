import { expect, it } from 'vitest';
import { solve } from 'min2phase.js';
import { getCase } from '../data';
import { caseState } from './cases';
import { applyMoves, STICKERS } from './cube';
import { parseAlg } from './alg';
import { compose, observedColors, solveTarget } from './practiceTarget';
import { sampleTarget } from './practiceSample';
import { scrambleFor } from './practice';
import { ALL_CASES } from '../data';
import { BOTTOM_COLORS, type BottomColor } from '../store/devicePrefs';

// Independent reference facelets from T37-spec's four physical fixtures (URFDLB order).
const fixtures: [string, BottomColor, string, number, string][] = [
  ['oll-5', 'white', 'U', 1, 'BBRUULUUFLUURRRRRRLFUFFFFFFDDDDDDDDDRRBLLLLLLFUUBBBBBB'],
  ['pll-t', 'green', "U'", 0, 'UUUUUUUUUFFRRRRRRRLRLFFFFFFDDDDDDDDDRBBLLLLLLBLFBBBBBB'],
  ['cmll-s-1', 'red', 'U2', 1, 'UURUUULUFLFURRRRRRBBUFFFFFFDDDDDDDDDBRULLLLLLFLRBBBBBB'],
  ['pll-aa', 'blue', '', 0, 'UUUUUUUUULRFRRRRRRFFBFFFFFFDDDDDDDDDBLLLLLLLLRBRBBBBBB'],
];
for (const [id, bottom, auf, variation, facelets] of fixtures) {
  it(`T37-spec ${id} / ${bottom}: independent 54-color fixture`, () => {
    let target = caseState(getCase(id)!);
    if (variation) target = compose(caseState(getCase('pll-ua')!), target);
    target = applyMoves(target, parseAlg(auf));
    expect(target.map((s) => STICKERS[s].face).join('')).toBe(facelets);
    const result = solveTarget(target, bottom, solve);
    const colors = observedColors(result.scramble, bottom);
    // Palette expectation is tied to the independently recorded facelets, not solver internals.
    const palettes: Record<BottomColor, string> = {
      white: 'URFDLB', yellow: 'DLFURB', red: 'RDFLUB', orange: 'LUFRDB', green: 'BRUFLD', blue: 'FRDBLU',
    };
    const order = 'URFDLB';
    expect(colors.join('')).toBe([...facelets].map((f) => palettes[bottom][order.indexOf(f)]).join(''));
  });
}
for (const bottom of BOTTOM_COLORS) {
  it(`sampled OLL/CMLL nuisance permutations / ${bottom}: 792 additional full-state replays`, () => {
    for (const c of ALL_CASES.filter((c) => ['oll', 'cmll'].includes(c.set))) {
      for (const rand of [0, 0.3, 0.6, 0.9]) {
        for (const variation of [0.4, 0.8]) {
          const sample = sampleTarget(c, scrambleFor(c, () => rand), () => variation);
          const result = solveTarget(sample.state, bottom, solve);
          expect(observedColors(result.scramble, bottom)).toHaveLength(54);
        }
      }
    }
  });
}
