import { getCase } from '../data';
import { algSolvesCase2, caseState2, is2x2Set } from './cases2';
import { verifySetup2 } from './practice2';
import type { PracticeSession } from './practiceSession';

/** Reject mixed-size or mismatched 2×2 sessions; preserve the existing legacy 3×3 path. */
export function compatiblePracticeSession(session: PracticeSession): boolean {
  const c = getCase(session.question.id);
  if (!c) return false;
  const two = is2x2Set(c.set);
  if (!session.poolIds.length || session.poolIds.some(id => {
    const item = getCase(id);
    return !item || is2x2Set(item.set) !== two;
  })) return false;
  const prepared = session.question.prepared;
  if (!two) return prepared?.version !== 3;
  if (!session.poolIds.includes(c.id) || !verifySetup2(prepared) || prepared.scramble !== session.question.scramble ||
    !algSolvesCase2(c, session.question.alg)) return false;
  const expected = caseState2(c);
  return prepared.state.every((id, i) => id === expected[i]);
}
