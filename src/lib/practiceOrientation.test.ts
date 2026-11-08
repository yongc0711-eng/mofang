import { expect, it } from 'vitest';
import { solve } from 'min2phase.js';
import { ALL_CASES, getCase } from '../data';
import { BOTTOM_COLORS, PAIRS, FACE_COLOR, validPairs } from './colorScheme';
import { paletteFor, type PracticeColors } from './practiceColors';
import { OBSERVATION, observationFor, physicalTarget, observedColors, solveTarget, verifySetup } from './practiceTarget';
import { parseAlg } from './alg';
import { STICKERS, applyMoves, solved, stickerAt, type Vec } from './cube';
import { caseState, displayMask } from './cases';
import { diagramColors } from '../components/CaseDiagram';
import { practiceInstructions } from './practiceInstructions';

const roux: PracticeColors[] = BOTTOM_COLORS.flatMap(bottomColor => validPairs(bottomColor).flatMap(bridgePair => PAIRS[bridgePair].map(leftColor => ({ method:'roux' as const,bottomColor,bridgePair,leftColor }))));
it('24 unique observation rotations are proper, exact 54 colors, with the documented D/L/R frame',()=>{
  expect(roux).toHaveLength(24);const rotations = new Set();
  for(const colors of roux) {
    const p=paletteFor(colors), observation=observationFor(colors);
    rotations.add(applyMoves(solved(),parseAlg(observation)).join());
    expect(observedColors('',colors)).toEqual(STICKERS.map(s=>p[s.face]));
    expect(FACE_COLOR[p.D]).toBe(colors.method==='roux' ? colors.bottomColor : colors.bottom);
    if(colors.method==='roux') {
      expect(FACE_COLOR[p.L]).toBe(colors.leftColor);
      expect(new Set([FACE_COLOR[p.L],FACE_COLOR[p.R]])).toEqual(new Set(PAIRS[colors.bridgePair]));
    }
    const actual = applyMoves(solved(),parseAlg(observation));
    const basis: Vec[] = [[1,0,0],[0,1,0],[0,0,1]];
    const n=basis.map(v=>STICKERS[actual[stickerAt(v,v)]].n);
    const cross=[n[0][1]*n[1][2]-n[0][2]*n[1][1],n[0][2]*n[1][0]-n[0][0]*n[1][2],n[0][0]*n[1][1]-n[0][1]*n[1][0]];
    expect(cross.reduce((s,v,i)=>s+v*n[2][i],0)).toBe(1);
  }
  expect(rotations.size).toBe(24);
});
it.each(BOTTOM_COLORS)('CFOP %s keeps exact old observation and target conversion',bottom=>{
  const colors:PracticeColors={method:'cfop',bottom};
  expect(observationFor(colors)).toBe(OBSERVATION[bottom]);
  const target=caseState(getCase('pll-t')!);
  expect(physicalTarget(target,colors)).toEqual(physicalTarget(target,bottom));
  const result=solveTarget(target,colors,solve);
  expect(result.version).toBe(2);expect(verifySetup(result)).toBe(true);
  expect(observedColors(result.scramble,colors)).toEqual(target.map(id=>paletteFor(colors)[STICKERS[id].face]));
});
for(const c of ALL_CASES.filter(c=>c.set==='cmll'||c.set==='lse')) {
  it(`${c.id}: all 24 palettes and center offsets retain exact diagram/physical 54 sticker colors`,()=>{
    const state=caseState(c),mask=displayMask(c);
    for(const colors of roux) {
      const p=paletteFor(colors),setup=solveTarget(state,colors,solve);
      expect(verifySetup(setup)).toBe(true);
      expect(setup.state).toEqual(state);
      expect(applyMoves(solved(),parseAlg(setup.scramble))).toEqual(physicalTarget(state,colors));
      expect(observedColors(setup.scramble,colors)).toEqual(state.map(id=>p[STICKERS[id].face]));
      expect(diagramColors(c,mask,'white',state,p)).toEqual(state.map(id=>mask(id)?p[STICKERS[id].face]:null));
      expect(parseAlg(setup.scramble).some(m=>'xyz'.includes(m.base))).toBe(false);
    }
  });
}
it('v2 verification rejects mismatched observation/colors/method/state/version and cannot silently normalize',()=>{
  const colors=roux[0],setup=solveTarget(caseState(getCase('cmll-s-1')!),colors,solve);
  expect(verifySetup({...setup,observation:'not-a-move'})).toBe(false);
  expect(verifySetup({...setup,observation:observationFor(roux[1])})).toBe(false);
  expect(verifySetup({...setup,colors:roux[1]})).toBe(false);
  expect(verifySetup({...setup,colors:{...colors,method:'unknown'}})).toBe(false);
  expect(verifySetup({...setup,colors:null})).toBe(false);
  expect(verifySetup({...setup,state:[0]})).toBe(false);
  expect(verifySetup({...setup,version:3})).toBe(false);
  expect(verifySetup({...setup,scramble:'x'})).toBe(false);
  expect(()=>observationFor({method:'roux',bottomColor:'white',bridgePair:'white-yellow',leftColor:'white'})).toThrow();
  expect(()=>physicalTarget(setup.state,colors,observationFor(roux[1]))).toThrow();
});
it('preparation snapshots are copied and v2 instructions derive all facing colors from the same palette',()=>{
  const colors:PracticeColors={method:'roux',bottomColor:'white',bridgePair:'green-blue',leftColor:'blue'};
  const state=solved(),setup=solveTarget(state,colors,solve);
  colors.leftColor='green'; state[0]=53;
  expect(setup.colors).toEqual({method:'roux',bottomColor:'white',bridgePair:'green-blue',leftColor:'blue'});
  expect(setup.state).toEqual(solved());
  expect(practiceInstructions(setup)).toContain('白色中心朝上、绿色中心朝前起手');
  expect(practiceInstructions(setup)).toContain('左蓝 · 右绿');
});
