import { movesToString, parseAlg } from './alg';
import { caseState2, is2x2Set } from './cases2';
import { applyMoves2, invertMoves2, solved2, STICKERS2, type State2 } from './cube2';
import { observationFor } from './practiceOrientation';
import { paletteFor, type PracticeColors } from './practiceColors';
import { solve2 } from './solver2';
import type { AlgCase } from '../types';

export interface PreparedSetup2 {
  version: 3;
  size: 2;
  colors: PracticeColors;
  state: State2;
  scramble: string;
  observation: string;
}
/** Fixed bottom and bar orientation: each selected algorithm's exact case, without AUF. */
export function sampleTarget2(c: AlgCase): State2 {
  if (!is2x2Set(c.set)) throw new Error('二阶出题器只接受二阶公式组');
  return caseState2(c);
}
const compose2 = (a: State2, b: State2) => b.map(id => a[id]);
export function physicalTarget2(state: State2, colors: PracticeColors): State2 {
  const view = parseAlg(observationFor(colors));
  return applyMoves2(compose2(applyMoves2(solved2(), view), state), invertMoves2(view));
}
export function observedColors2(scramble: string, observation: string) {
  const whiteUp = applyMoves2(solved2(), parseAlg('z2'));
  return applyMoves2(solved2(), parseAlg(`${scramble} ${observation}`)).map(id => STICKERS2[whiteUp[id]].face);
}
export function verifySetup2(value: unknown): value is PreparedSetup2 {
  try {
    if (!value || typeof value !== 'object') return false;
    const s = value as PreparedSetup2;
    if (s.version !== 3 || s.size !== 2 || s.colors.method !== '2x2' || !Array.isArray(s.state) || s.state.length !== 24 ||
      new Set(s.state).size !== 24 || s.state.some(id => !Number.isInteger(id) || id < 0 || id >= 24) ||
      typeof s.scramble !== 'string' || s.observation !== observationFor(s.colors)) return false;
    const moves = parseAlg(s.scramble);
    if (moves.some(m => !'RLUDFB'.includes(m.base))) return false;
    const expected = physicalTarget2(s.state, s.colors), actual = applyMoves2(solved2(), moves);
    const palette = paletteFor(s.colors), seen = observedColors2(s.scramble, s.observation);
    return actual.every((id, i) => id === expected[i]) && seen.every((face, i) => face === palette[STICKERS2[s.state[i]].face]);
  } catch { return false; }
}
export function solveTarget2(state: State2, colors: PracticeColors): PreparedSetup2 {
  if (colors.method !== '2x2') throw new Error('二阶练习配色无效');
  const solution = solve2(physicalTarget2(state, colors));
  const setup: PreparedSetup2 = { version: 3, size: 2, colors: { ...colors }, state: state.slice(),
    scramble: movesToString(invertMoves2(solution)), observation: observationFor(colors) };
  if (!verifySetup2(setup)) throw new Error('二阶打乱未通过 24/24 校验');
  return setup;
}
