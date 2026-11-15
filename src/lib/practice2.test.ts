import { describe, expect, it } from 'vitest';
import { SETS } from '../data';
import { parseAlg } from './alg';
import { applyMoves2, invertMoves2, solved2, STICKERS2 } from './cube2';
import { BOTTOM_COLORS, bottomPalette } from './colorScheme';
import { caseState2, is2x2Set, SET_RULES_2, type SetId2 } from './cases2';
import { observedColors2, sampleTarget2, solveTarget2, verifySetup2 } from './practice2';
import { verifySetup } from './practiceTarget';
import { solve2 } from './solver2';
import { practiceInstructions } from './practiceInstructions';
import { parseSession, serializeSession } from './practiceSession';
import { compatiblePracticeSession } from './practiceRestore';
import { solve } from 'min2phase.js';
import { caseState } from './cases';
import { getCase } from '../data';
import { solveTarget } from './practiceTarget';

it('geometry-based corner search solves all face turns and rejects impossible corner twists', () => {
  for (const base of 'RLUDFB') for (const amount of [1, 2, 3] as const) {
    const state = applyMoves2(solved2(), [{ base, amount }]);
    expect(applyMoves2(state, solve2(state))).toEqual(solved2());
  }
  const bad = solved2(); [bad[0], bad[1]] = [bad[1], bad[0]];
  expect(() => solve2(bad)).toThrow();
});
describe.each(SETS.filter(s => is2x2Set(s.id)))('$name: every case and six bottoms', set => {
  it.each(set.cases)('$id generates a verified fixed-frame scramble and exact observed colors', c => {
    const state = sampleTarget2(c);
    expect(state).toEqual(caseState2(c));
    expect(state).toHaveLength(24);
    expect(SET_RULES_2[c.set as SetId2].preserve(state, c.id)).toBe(true);
    for (const bottom of BOTTOM_COLORS) {
      const setup = solveTarget2(state, { method: '2x2', bottom });
      expect(verifySetup2(setup)).toBe(true);
      expect(verifySetup(setup)).toBe(true);
      expect(setup.state).toEqual(state);
      expect(parseAlg(setup.scramble).every(m => 'RLUDFB'.includes(m.base))).toBe(true);
      expect(observedColors2(setup.scramble, setup.observation)).toEqual(state.map(id => bottomPalette(bottom)[STICKERS2[id].face]));
      // Returning to canonical frame and executing the selected teaching algorithm solves exactly.
      expect(applyMoves2(state, parseAlg(c.algs[0]))).toEqual(solved2());
      expect(practiceInstructions(setup)).toContain('二阶没有中心');
      expect(practiceInstructions(setup)).not.toContain('中心朝上');
      expect(verifySetup2({ ...setup, state: applyMoves2(state, parseAlg('R')) })).toBe(false);
      expect(verifySetup2({ ...setup, scramble: setup.scramble + ' x' })).toBe(false);
      expect(verifySetup2({ ...setup, observation: setup.observation + ' y' })).toBe(false);
    }
  });
});
it('v3 round trips paused/done/running sessions with all 24 stickers and frozen palette', () => {
  const c = SETS.find(s => s.id === 'eg1')!.cases[0];
  const prepared = solveTarget2(caseState2(c), { method: '2x2', bottom: 'blue' });
  const base = { poolIds: [c.id], question: { id: c.id, alg: c.algs[0], scramble: prepared.scramble, prepared },
    count: 2, elapsedMs: 100, runningSince: null, savedAt: 1000, docId: 'doc' };
  for (const phase of ['ready', 'paused', 'done'] as const) {
    const session = { ...base, phase };
    expect(parseSession(serializeSession(session), 1100, id => id === c.id, 'doc')).toEqual(session);
  }
  const running = { ...base, phase: 'running' as const, runningSince: 900 };
  expect(compatiblePracticeSession(running)).toBe(true);
  expect(compatiblePracticeSession({ ...running, poolIds: [c.id, 'pll-t'] })).toBe(false);
  expect(compatiblePracticeSession({ ...running, question: { ...running.question, alg: 'R U' } })).toBe(false);
  expect(compatiblePracticeSession({ ...running, question: { ...running.question, id: 'eg2-h-1' }, poolIds: ['eg2-h-1'] })).toBe(false);
  expect(compatiblePracticeSession({ ...running, question: { ...running.question, prepared: undefined } })).toBe(false);
  expect(parseSession(serializeSession(running), 1100, () => true, 'doc')).toEqual(running);
  expect(parseSession(serializeSession(running), 1100, () => true, 'new')!.elapsedMs).toBe(200);
  expect(invertMoves2(parseAlg(prepared.scramble))).toHaveLength(parseAlg(prepared.scramble).length);
});
it('three-dimensional legacy sessions remain compatible and a v3 payload cannot enter them', () => {
  const legacy = { poolIds: ['pll-t'], question: { id: 'pll-t', alg: 'R U', scramble: 'U R' },
    count: 0, phase: 'ready' as const, elapsedMs: 0, runningSince: null, savedAt: 1000 };
  expect(compatiblePracticeSession(legacy)).toBe(true);
  const c = SETS.find(s => s.id === 'cll')!.cases[0];
  expect(compatiblePracticeSession({ ...legacy, question: { ...legacy.question, prepared: solveTarget2(caseState2(c), { method: '2x2', bottom: 'white' }) } })).toBe(false);
  expect(() => sampleTarget2(SETS[0].cases[0])).toThrow('只接受二阶');
  const three = solveTarget(caseState(getCase('pll-t')!), { method: 'cfop', bottom: 'white' }, solve);
  expect(verifySetup({ ...three, colors: { method: '2x2', bottom: 'white' } })).toBe(false);
});
