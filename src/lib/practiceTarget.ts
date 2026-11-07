import { parseAlg, movesToString } from './alg';
import { applyMoves, invertMoves, solved, STICKERS, type State } from './cube';
import { BOTTOM_COLORS, displayFace, type BottomColor } from '../store/devicePrefs';

/** State arrays are sticker permutations, never color arrays. Composition is “a, then b”. */
export const compose = (a: State, b: State): State => b.map((id) => a[id]);
const centers = STICKERS.filter((s) => s.p.filter(Boolean).length === 1).map((s) => s.id);
const equal = (a: State, b: State) => a.every((id, i) => id === b[i]);
// From physical white-U/green-F to the existing selected-bottom observation frame.
// These are observation instructions ONLY, never included in the scramble.
export const OBSERVATION: Record<BottomColor, string> = {
  white: 'z2', yellow: '', red: 'z', orange: "z'", green: 'x z2', blue: 'x y2',
};
export interface PreparedSetup {
  version: 1;
  bottom: BottomColor;
  scramble: string;
  /** Logical observation coordinates; palette comes from bottom. Includes AUF and displaced centers. */
  state: State;
  observation: string;
}
export function validState(v: unknown): v is State {
  return Array.isArray(v) && v.length === 54 && new Set(v).size === 54 &&
    v.every((id) => Number.isInteger(id) && id >= 0 && id < 54);
}
export function physicalTarget(target: State, bottom: BottomColor): State {
  const a = parseAlg(OBSERVATION[bottom]);
  return applyMoves(compose(applyMoves(solved(), a), target), invertMoves(a));
}
/** Convert physical white-up sticker identities into the observation palette; exact 54/54, no normalization. */
export function observedColors(scramble: string, bottom: BottomColor) {
  const physical = applyMoves(solved(), [...parseAlg(scramble), ...parseAlg(OBSERVATION[bottom])]);
  const whiteUp = applyMoves(solved(), parseAlg('z2'));
  return physical.map((id) => STICKERS[whiteUp[id]].face);
}
export function verifySetup(setup: PreparedSetup): boolean {
  if (!validState(setup.state) || !BOTTOM_COLORS.includes(setup.bottom) || setup.version !== 1 ||
      setup.observation !== OBSERVATION[setup.bottom]) return false;
  try {
    const moves = parseAlg(setup.scramble);
    if (moves.some((m) => 'xyz'.includes(m.base))) return false;
    return equal(applyMoves(solved(), moves), physicalTarget(setup.state, setup.bottom)) &&
      observedColors(setup.scramble, setup.bottom).every((face, i) => face === displayFace(setup.state[i], setup.bottom));
  } catch { return false; }
}

/** The solver solves a target; only ITS solution is reversed. Teaching algorithms never enter this function. */
export function solveTarget(target: State, bottom: BottomColor, solve: (facelets: string) => string): PreparedSetup {
  if (!validState(target)) throw new Error('目标状态无效');
  const physical = physicalTarget(target, bottom);
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
  const setup: PreparedSetup = { version: 1, bottom, scramble: movesToString(moves), state: target.slice(), observation: OBSERVATION[bottom] };
  if (!verifySetup(setup)) throw new Error('求解结果未通过 54/54 校验');
  return setup;
}
