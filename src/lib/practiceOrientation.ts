import { movesToString, parseAlg } from './alg';
import { applyMoves, solved, STICKERS, type Move } from './cube';
import { paletteFor, type PracticeColors } from './practiceColors';
import { bottomPalette, paletteFace, type BottomColor, type Palette } from './colorScheme';

export const OBSERVATION: Record<BottomColor, string> = {
  white: 'z2', yellow: '', red: 'z', orange: "z'", green: 'x z2', blue: 'x y2',
};
// Enumerate each proper rotation once, without changing the target or normalizing displaced centers.
const rotations: Move[][] = (() => {
  const seen = new Set([solved().join()]), queue: Move[][] = [[]];
  for (let i=0;i<queue.length;i++) for (const base of ['x','y','z']) {
    const seq: Move[] = [...queue[i], {base,amount:1}], key = applyMoves(solved(),seq).join();
    if (!seen.has(key)) { seen.add(key); queue.push(seq); }
  }
  if (queue.length !== 24) throw new Error('整体朝向数量错误');
  return queue;
})();
const whiteUp = applyMoves(solved(), parseAlg('z2'));
const signature = (p: Palette) => STICKERS.map(s=>paletteFace(s.id,p)).join();
const observations = new Map<string,string>();
for (const seq of rotations) {
  const rotation = applyMoves(solved(),seq);
  const key = STICKERS.map(s=>STICKERS[whiteUp[rotation[s.id]]].face).join();
  if (observations.has(key)) throw new Error('观察持法不唯一');
  observations.set(key,movesToString(seq));
}
// Calibrate the six historical CFOP spellings to the same full 54-color mapping.
for (const bottom of Object.keys(OBSERVATION) as BottomColor[]) {
  const rotation = applyMoves(solved(),parseAlg(OBSERVATION[bottom]));
  const key = STICKERS.map(s=>STICKERS[whiteUp[rotation[s.id]]].face).join();
  if (key !== signature(bottomPalette(bottom))) throw new Error('旧观察持法校准失败');
  observations.set(key,OBSERVATION[bottom]);
}
export function observationFor(colors: PracticeColors): string {
  const result = observations.get(signature(paletteFor(colors)));
  if (result === undefined) throw new Error('无法确定观察持法');
  return result;
}
