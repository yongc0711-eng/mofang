import { parseAlg, movesToString } from './alg';
import { applyMoves, invertMoves, solved, STICKERS, type State } from './cube';
import { BOTTOM_COLORS, displayFace, paletteFace, type BottomColor } from './colorScheme';
import { paletteFor, type PracticeColors } from './practiceColors';
import { OBSERVATION, observationFor } from './practiceOrientation';
export { OBSERVATION, observationFor } from './practiceOrientation';
export { paletteFor } from './practiceColors';

/** State arrays are sticker permutations, never color arrays. Composition is “a, then b”. */
export const compose = (a: State, b: State): State => b.map((id) => a[id]);
const centers = STICKERS.filter((s) => s.p.filter(Boolean).length === 1).map((s) => s.id);
const equal = (a: State, b: State) => a.every((id, i) => id === b[i]);
export interface PreparedSetupV1 {
  version: 1;
  bottom: BottomColor;
  scramble: string;
  state: State;
  observation: string;
}
export interface PreparedSetupV2 {
  version: 2;
  colors: PracticeColors;
  scramble: string;
  state: State;
  observation: string;
}
export type PreparedSetup = PreparedSetupV1 | PreparedSetupV2;
const observation = (colors: BottomColor | PracticeColors): string => typeof colors === 'string' ? OBSERVATION[colors] : observationFor(colors);
export function validState(v: unknown): v is State {
  return Array.isArray(v) && v.length === 54 && new Set(v).size === 54 &&
    v.every((id) => Number.isInteger(id) && id >= 0 && id < 54);
}
export function physicalTarget(target: State, colors: BottomColor | PracticeColors, view = observation(colors)): State {
  if (!validState(target) || view !== observation(colors)) throw new Error('非法目标/观察持法');
  const a = parseAlg(view);
  return applyMoves(compose(applyMoves(solved(), a), target), invertMoves(a));
}
/** Convert physical white-up sticker identities into the observation palette; exact 54/54, no normalization. */
export function observedColors(scramble: string, colors: BottomColor | PracticeColors, view = observation(colors)) {
  if (view !== observation(colors)) throw new Error('观察持法与配色不符');
  const physical = applyMoves(solved(), [...parseAlg(scramble), ...parseAlg(view)]);
  const whiteUp = applyMoves(solved(), parseAlg('z2'));
  return physical.map((id) => STICKERS[whiteUp[id]].face);
}
export function verifySetup(value: unknown): value is PreparedSetup {
  try {
    if (!value || typeof value !== 'object') return false;
    const setup = value as PreparedSetup;
    if (!validState(setup.state) || typeof setup.scramble !== 'string' || typeof setup.observation !== 'string') return false;
    let colors: BottomColor | PracticeColors;
    if (setup.version === 1 && BOTTOM_COLORS.includes(setup.bottom)) colors = setup.bottom;
    else if (setup.version === 2) { paletteFor(setup.colors); colors = setup.colors; }
    else return false;
    if (setup.observation !== observation(colors)) return false;
    const moves = parseAlg(setup.scramble);
    if (moves.some((m) => 'xyz'.includes(m.base))) return false;
    const palette = typeof colors === 'string' ? null : paletteFor(colors);
    const expected = typeof colors === 'string' ? setup.state.map(id=>displayFace(id,colors)) : setup.state.map(id=>paletteFace(id,palette!));
    return equal(applyMoves(solved(), moves), physicalTarget(setup.state, colors, setup.observation)) &&
      observedColors(setup.scramble, colors, setup.observation).every((face,i)=>face===expected[i]);
  } catch { return false; }
}

/** The solver solves a target; only ITS solution is reversed. Teaching algorithms never enter this function. */
export function solveTarget(target: State, bottom: BottomColor, solve: (facelets: string) => string): PreparedSetupV1;
export function solveTarget(target: State, colors: PracticeColors, solve: (facelets: string) => string): PreparedSetupV2;
export function solveTarget(target: State, colors: BottomColor | PracticeColors, solve: (facelets: string) => string): PreparedSetup;
export function solveTarget(target: State, colors: BottomColor | PracticeColors, solve: (facelets: string) => string): PreparedSetup {
  if (!validState(target)) throw new Error('目标状态无效');
  const physical = physicalTarget(target, colors);
  // A face-turn solver fixes centers. Factor real slice motion, then put it back in the output.
  // This preserves Roux center offsets instead of normalizing them away.
  const corrections = ['', ...['M', 'E', 'S'].flatMap((b) => [b, `${b}2`, `${b}'`])];
  const correction = corrections.find((s) => {
    const corrected = applyMoves(physical, parseAlg(s));
    return centers.every((id) => corrected[id] === id);
  });
  if (correction === undefined) throw new Error('未覆盖的中心偏移');
  const corrected = applyMoves(physical, parseAlg(correction));
  const solution = solve(corrected.map((id) => STICKERS[id].face).join(''));
  if (/Error/i.test(solution)) throw new Error(`求解失败：${solution}`);
  const moves = [...invertMoves(parseAlg(solution)), ...invertMoves(parseAlg(correction))];
  const common = { scramble: movesToString(moves), state: target.slice(), observation: observation(colors) };
  const setup: PreparedSetup = typeof colors === 'string' ? { ...common, version: 1, bottom: colors } : { ...common, version: 2, colors: { ...colors } };
  if (!verifySetup(setup)) throw new Error('求解结果未通过 54/54 校验');
  return setup;
}
