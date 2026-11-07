import { expect, it } from 'vitest';
import { solve } from 'min2phase.js';
import { caseState } from './cases';
import { getCase } from '../data';
import { parseSession, type PracticeSession } from './practiceSession';
import { solveTarget } from './practiceTarget';
const session: PracticeSession = {
  poolIds: ['pll-t'], question: { id: 'pll-t', alg: getCase('pll-t')!.algs[0], scramble: 'U R' },
  phase: 'running', count: 2, elapsedMs: 100, runningSince: 1000, savedAt: 2000, docId: 'same',
};
it('legacy session retains original setup and timing, with no guessed bottom or new target', () => {
  const result = parseSession(JSON.stringify(session), 2200, () => true, 'same')!;
  expect(result).toEqual(session);
  expect(result.question.prepared).toBeUndefined();
});
it('new session persists full target, bottom and observation, while T21 reload freeze is unchanged', () => {
  const prepared = solveTarget(caseState(getCase('pll-t')!), 'green', solve);
  const saved = { ...session, question: { ...session.question, scramble: prepared.scramble, prepared } };
  const result = parseSession(JSON.stringify(saved), 2200, () => true, 'different')!;
  expect(result.question).toEqual(saved.question);
  expect(result.phase).toBe('paused');
  expect(result.elapsedMs).toBe(1100);
  expect(result.runningSince).toBeNull();
});
it('invalid saved metadata never replaces or rerolls the original stored setup', () => {
  const saved = { ...session, question: { ...session.question, prepared: { version: 1, state: [0], bottom: 'green' } } };
  const result = parseSession(JSON.stringify(saved), 2200, () => true, 'same')!;
  expect(result.question).toEqual(session.question);
  expect(result.phase).toBe('running');
});
