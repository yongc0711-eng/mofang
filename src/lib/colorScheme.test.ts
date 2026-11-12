import { expect, it } from 'vitest';
import { BOTTOM_COLORS, FACE_COLOR, PAIRS, SANDBOX_PALETTE, bottomPalette, browsePalette, cleanBrowse, defaultLeft, isRouxSet, legacyRoux, paletteFace, rouxPalette, swapRoux, validPairs, withRouxBottom } from './colorScheme';
import { FACES, STICKERS, applyMoves, solved, stickerAt, type Face } from './cube';
import { parseAlg } from './alg';
import { ALL_CASES } from '../data';
import { caseState, displayMask } from './cases';
import { diagramColors } from '../components/CaseDiagram';

const center = (face: Face) => STICKERS.find(s => s.face === face && s.p.filter(Boolean).length === 1)!;
const normal = (f: Face) => center(f).n;
const dot = (a: readonly number[], b: readonly number[]) => a.reduce((sum,n,i)=>sum+n*b[i],0);
const cross = (a: readonly number[],b: readonly number[]) => [a[1]*b[2]-a[2]*b[1],a[2]*b[0]-a[0]*b[2],a[0]*b[1]-a[1]*b[0]];

it.each(['cmll', 'lse', 'sbls', 'f2l', 'oll', 'pll', 'coll', 'wv'])('%s routes browsing through the correct method palette (T71)', set => {
  const roux = ['cmll', 'lse', 'sbls'].includes(set);
  expect(isRouxSet(set)).toBe(roux);
  const prefs = { bottomColor: 'white' as const, cfop: { bottomColor: 'green' as const }, roux: { bottomColor: 'yellow' as const, bridgePair: 'green-blue' as const, leftColor: 'green' as const } };
  expect(browsePalette({ set }, prefs)).toEqual(roux ? rouxPalette(prefs.roux) : bottomPalette('green'));
});

it('has exactly twelve unordered pairs and 24 distinct directed proper rotations', () => {
  const signatures = new Set(); let pairs = 0;
  for (const bottomColor of BOTTOM_COLORS) {
    expect(validPairs(bottomColor)).toHaveLength(2);
    for (const bridgePair of validPairs(bottomColor)) {
      pairs++;
      for (const leftColor of PAIRS[bridgePair]) {
        const colors = { bottomColor, bridgePair, leftColor }, p = rouxPalette(colors);
        expect(FACE_COLOR[p.D]).toBe(bottomColor);
        expect(new Set([FACE_COLOR[p.L], FACE_COLOR[p.R]])).toEqual(new Set(PAIRS[bridgePair]));
        expect(FACE_COLOR[p.L]).toBe(leftColor);
        expect(new Set(Object.values(p)).size).toBe(6);
        // A proper 3D rotation preserves the right-handed basis R,U,F.
        expect(dot(cross(normal(p.R), normal(p.U)), normal(p.F))).toBe(1);
        signatures.add(FACES.map(f=>p[f]).join());
        const swapped = rouxPalette(swapRoux(colors));
        const rotated = applyMoves(solved(), parseAlg('y2'));
        for (const f of FACES) expect(swapped[f]).toBe(p[STICKERS[rotated[center(f).id]].face]);
        expect(swapRoux(swapRoux(colors))).toEqual(colors);
      }
    }
  }
  expect(pairs).toBe(12); expect(signatures.size).toBe(24);
});
it.each(BOTTOM_COLORS)('%s: illegal bridge axis and left not in pair throw, not mirrored or guessed', bottomColor => {
  const bad = (Object.keys(PAIRS) as (keyof typeof PAIRS)[]).find(p=>!validPairs(bottomColor).includes(p))!;
  expect(()=>rouxPalette({bottomColor,bridgePair:bad,leftColor:defaultLeft(bad)})).toThrow();
  for(const bridgePair of validPairs(bottomColor)) expect(()=>rouxPalette({bottomColor,bridgePair,leftColor:bottomColor})).toThrow();
});
it('uses explicit pair defaults',()=> {
  expect(defaultLeft('green-blue')).toBe('blue');expect(defaultLeft('red-orange')).toBe('red');expect(defaultLeft('white-yellow')).toBe('white');
});
it.each(BOTTOM_COLORS)('%s migration preserves all 54 sticker colors and both method bottoms', bottom => {
  const result=cleanBrowse({},bottom), old=bottomPalette(bottom), p=rouxPalette(result.roux);
  expect(result.cfop.bottomColor).toBe(bottom);expect(result.roux).toEqual(legacyRoux(bottom));
  for(const s of STICKERS) expect(paletteFace(s.id,p)).toBe(old[s.face]);
});
it('cleans malformed method objects separately and preserves an explicit swapped direction',()=>{
  const result=cleanBrowse({cfop:{bottomColor:'green'},roux:{bottomColor:'white',bridgePair:'green-blue',leftColor:'green'}},'red');
  expect(result.cfop.bottomColor).toBe('green');expect(result.roux.leftColor).toBe('green');
  const dirty=cleanBrowse({cfop:[],roux:{bottomColor:'no',bridgePair:'white-yellow',leftColor:'blue'}},'white');
  expect(dirty).toEqual({cfop:{bottomColor:'white'},roux:{bottomColor:'white',bridgePair:'red-orange',leftColor:'red'}});
});
it('full palette affects all 54 stickers in canonical and displaced-center states with masks unchanged',()=>{
  for(const bottomColor of BOTTOM_COLORS) for(const bridgePair of validPairs(bottomColor)) for(const leftColor of PAIRS[bridgePair]) {
    const p=rouxPalette({bottomColor,bridgePair,leftColor});
    for(const c of ALL_CASES.filter(c=>isRouxSet(c.set))) {
      const state=caseState(c), mask=displayMask(c);
      expect(diagramColors(c,mask,'white',state,p)).toEqual(state.map(id=>mask(id)?paletteFace(id,p):null));
      expect(state).toEqual(caseState(c));
    }
  }
});
it('sandbox fixed frame has white U, green F, yellow D, blue B, red R, orange L',()=>{
  expect(Object.fromEntries(FACES.map(f=>[f,FACE_COLOR[paletteFace(stickerAt(center(f).p,center(f).n),SANDBOX_PALETTE)]]))).toEqual({U:'white',F:'green',D:'yellow',B:'blue',R:'red',L:'orange'});
});

it('changing bottom preserves a legal pair and explicit direction, otherwise uses the documented default', () => {
  for (const bottomColor of BOTTOM_COLORS) for (const bridgePair of validPairs(bottomColor)) for (const leftColor of PAIRS[bridgePair]) {
    const colors = { bottomColor, bridgePair, leftColor };
    for (const next of BOTTOM_COLORS) {
      const result = withRouxBottom(colors, next);
      expect(result.bottomColor).toBe(next);
      if (validPairs(next).includes(bridgePair)) expect(result).toEqual({ ...colors, bottomColor: next });
      else expect(result).toEqual({ bottomColor: next, bridgePair: legacyRoux(next).bridgePair, leftColor: defaultLeft(legacyRoux(next).bridgePair) });
      expect(() => rouxPalette(result)).not.toThrow();
    }
  }
});
