import { describe, expect, it } from 'vitest';
import { solve } from 'min2phase.js';
import { ALL_CASES, getCase } from '../data';
import { caseState } from './cases';
import { practiceViewFor } from '../components/CaseCard';
import { parseAlg } from './alg';
import { applyMoves, solved, STICKERS } from './cube';
import { BOTTOM_COLORS, displayFace } from '../store/devicePrefs';
import { OBSERVATION, observedColors, physicalTarget, solveTarget, verifySetup } from './practiceTarget';

describe('T37 solver targets: fixed white U / green F, six bottoms, exact sticker identity', () => {
  for (const bottom of BOTTOM_COLORS) {
    for (const c of ALL_CASES) {
      it(`${c.id} / ${bottom}: every AUF, all 54 stickers and physical colors`, () => {
        const aufs = ['oll', 'pll', 'cmll'].includes(c.set) ? ['', 'U', "U'", 'U2'] : [''];
        for (const auf of aufs) {
          const target = applyMoves(caseState(c), parseAlg(auf));
          const result = solveTarget(target, bottom, solve);
          expect(verifySetup(result)).toBe(true);
          expect(result.state).toEqual(target);
          expect(parseAlg(result.scramble).every((m) => !'xyz'.includes(m.base))).toBe(true);
          expect(applyMoves(solved(), parseAlg(result.scramble))).toEqual(physicalTarget(target, bottom));
          expect(observedColors(result.scramble, bottom)).toEqual(target.map((id) => displayFace(id, bottom)));
          // Full permutation check includes displaced Roux centers, not just visible/masked stickers.
          const a = applyMoves(solved(), parseAlg(OBSERVATION[bottom]));
          expect(applyMoves(solved(), parseAlg(`${result.scramble} ${result.observation}`))).toEqual(target.map((id) => a[id]));
        }
      });
    }
  }
  it('uses the solver solution, and rejects invalid solutions instead of falling back to a teaching inverse', () => {
    const c = getCase('pll-t')!;
    let input = '';
    expect(() => solveTarget(caseState(c), 'white', (s) => { input = s; return ''; })).toThrow('54/54');
    expect(input).toHaveLength(54);
    expect(() => solveTarget(caseState(c), 'white', () => 'Error 8')).toThrow('求解失败');
    expect(() => solveTarget([0], 'white', solve)).toThrow('目标状态无效');
  });
  it('retains T33 primary view and its pre-U / outer-rotation fallback', () => {
    for (const id of ['oll-5', 'pll-t', 'pll-aa', 'cmll-s-1']) {
      const c = getCase(id)!;
      const { view, scramble } = practiceViewFor(c, `U ${c.algs[0]}`, () => 0.3);
      const target = applyMoves(solved(), parseAlg(scramble));
      const result = solveTarget(target, 'green', solve);
      expect(result.state).toEqual(target);
      expect(view.id).toBe(c.id);
      expect(verifySetup(result)).toBe(true);
    }
  });
  it('colors of fixed physical start are white U and green F, with all six selected bottoms after observation', () => {
    for (const bottom of BOTTOM_COLORS) {
      const result = solveTarget(solved(), bottom, solve);
      expect(observedColors(result.scramble, bottom)).toEqual(STICKERS.map((s) => displayFace(s.id, bottom)));
    }
  });
});
