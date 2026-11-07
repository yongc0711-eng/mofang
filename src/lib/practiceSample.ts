import { caseState } from './cases';
import { scrambleFor } from './practice';
import { compose } from './practiceTarget';
import { applyMoves, type State } from './cube';
import { parseAlg } from './alg';
import { getCase } from '../data';
import type { AlgCase } from '../types';

export interface TargetSample { state: State; auf: string; variation: number }
/** Compatibility adapter: T33's reference string selects the view/AUF, never the output training string.
 * Move the selected AUF to the target's END (old prefix U is not an observation AUF).
 * OLL/CMLL also sample three legal Ua edge cycles, fixing all corners/F2L/Roux blocks.
 * This finite sampler is intentionally NOT a uniform random-state generator.
 */
export function sampleTarget(c: AlgCase, reference: string, rand = Math.random): TargetSample {
  const options = ['oll', 'pll', 'cmll'].includes(c.set) ? ['', 'U', "U'", 'U2'] : [''];
  const index = options.findIndex((_, i) => scrambleFor(c, () => (i + 0.01) / 4) === reference);
  if (index < 0) throw new Error('目标参考与情形不一致');
  const auf = options[index];
  const variation = ['oll', 'cmll'].includes(c.set) ? Math.min(2, Math.floor(rand() * 3)) : 0;
  let state = caseState(c);
  // Source-label permutation preserves each selected corner orientation and all solved lower blocks.
  for (let i = 0; i < variation; i++) state = compose(caseState(getCase('pll-ua')!), state);
  return { state: applyMoves(state, parseAlg(auf)), auf, variation };
}
