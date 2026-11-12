import catalogJson from '../../scripts/research/eolr/basilio-eolr-verified.json';
import { describe, expect, it } from 'vitest';
import { EOLR_CASES, EOLR_NUISANCE_ALGS } from './eolr';
import { ALL_CASES, getSet } from './index';
import { algSolvesCase, caseState, SET_RULES } from '../lib/cases';
import { parseAlg } from '../lib/alg';
import { applyMoves, invertMoves, solved, STICKERS, stickerAt, type State, type Vec } from '../lib/cube';
import { eolrGoal, inspectEolr, lintEolr } from '../lib/eolr';
import { Timeline } from '../lib/timeline';
import { scrambleFor } from '../lib/practice';
import { sampleTarget } from '../lib/practiceSample';
import { colorCandidates, pickPracticeColors, paletteFor } from '../lib/practiceColors';
import { BOTTOM_COLORS, validPairs } from '../lib/colorScheme';
import { solve } from 'min2phase.js';
import { solveTarget, verifySetup, observedColors } from '../lib/practiceTarget';
import { paletteFace } from '../lib/colorScheme';

const catalog = catalogJson;
const protectedIds = STICKERS.filter(s => Math.abs(s.p[0]) === 1 && s.p[1] <= 0).map(s => s.id);
const cornerIds = STICKERS.filter(s => s.p.every(v => v !== 0) && s.p[1] === 1).map(s => s.id);
const lrIds = STICKERS.filter(s => Math.abs(s.p[0]) === 1 && s.p[1] === 1 && s.p[2] === 0).map(s => s.id);
const slots = [['UF',[0,1,1]],['UB',[0,1,-1]],['UL',[-1,1,0]],['UR',[1,1,0]],['DF',[0,-1,1]],['DB',[0,-1,-1]]] as const;
// Independent facelet checks; does not call the production goal predicate.
function physical(state: State) {
  const bad: string[] = [], lr: string[] = [];
  for (const [slot, coords] of slots) {
    const p = [...coords] as Vec;
    const ref = state[stickerAt(p, [0,p[1],0])];
    if (!['U','D'].includes(STICKERS[ref].face)) bad.push(slot);
    const ids = STICKERS.filter(s => s.p.every((n,i) => n === p[i])).map(s => state[s.id]);
    if (ids.some(id => id === lrIds[0] || lrIds.includes(id))) {
      const visible = state[stickerAt(p, p[1] === 1 ? [0,1,0] : [0,0,p[2]])];
      lr.push(`${slot}:${'LR'.includes(STICKERS[visible].face) ? 'red' : 'pink'}`);
    }
  }
  return `${bad.sort().join(',')}|${lr.sort().join(',')}`;
}
function strictEnd(state: State) {
  for (const id of [...protectedIds,...cornerIds,...lrIds]) expect(state[id], `sticker ${id}`).toBe(id);
  for (const [,p] of slots) expect(['U','D']).toContain(STICKERS[state[stickerAt([...p] as Vec,[0,p[1],0])]].face);
  for (const y of [1,-1]) expect(['U','D']).toContain(STICKERS[state[stickerAt([0,y,0],[0,y,0])]].face);
}

it('九组 437 情形、原顺序、51 主图解与 20 个 BAD CASE', () => {
  expect(ALL_CASES).toHaveLength(437);
  expect(getSet('eolr')!.cases).toHaveLength(51);
  expect(EOLR_CASES.filter(c => c.isBadCase)).toHaveLength(20);
  expect(Object.fromEntries([...new Set(EOLR_CASES.map(c => c.group))].map(g => [g,EOLR_CASES.filter(c => c.group === g).length]))).toEqual({'3/1':8,'2a/2':7,'4/0':4,'2o/2':6,'2o/0':6,'0/2':4,'2a/0':7,'1/1':6,'4/2':3});
  expect(protectedIds).toHaveLength(26);expect(cornerIds).toHaveLength(12);expect(lrIds).toHaveLength(4);
  expect(STICKERS.filter(s => SET_RULES.eolr.display(s.id))).toHaveLength(42);
});

for (const c of EOLR_CASES) describe(c.id, () => {
  const row = catalog.find(r => r.caseId === c.sourceCase)!;
  it('名字、起手与来源图解逐条对应，不把计算补全冒充原表公式', () => {
    expect(c.id).toBe(`eolr-${row.caseId.replaceAll('/','-')}`);
    expect(c.group).toBe(row.row);expect(c.setup).toBe(row.verifiedSetup);
    expect(c.isBadCase).toBe(row.isBadCase);expect(c.sourceAlg).toBe(row.boldAlg);
    if (!c.computedPrefix) expect(c.algs).toEqual([row.boldAlg]);
    const raw = physical(caseState(c));
    let expected = row.diagKey;
    if (row.matchStatus === 'LR_MIRROR') expected = expected.replace(/UL|UR/g,s => s === 'UL' ? 'UR' : 'UL').split('|').map(s => s.split(',').sort().join(',')).join('|');
    if (row.caseId === '2a/0-3') expected = 'UB,UL|DF:red,UL:red';
    if (row.caseId === '4/2-3') expected = 'DB,DF,UB,UF,UL,UR|DB:pink,DF:pink';
    expect(raw).toBe(expected);
  });
  it('短公式达到声明层级，完整接续每一帧保护两桥并严格归位', () => {
    expect(lintEolr(c)).toEqual([]);
    const start = caseState(c);
    expect(algSolvesCase(c,c.algs[0])).toBe(true);
    expect(eolrGoal(c,applyMoves(start,parseAlg(c.algs[0])))).toBe(true);
    const full = [c.algs[0],c.continuationAlg].filter(Boolean).join(' ');
    let state = start;
    for (const move of parseAlg(full)) {
      state = applyMoves(state,[move]);
      for (const id of protectedIds) expect(state[id]).toBe(id);
    }
    strictEnd(state);
    expect(algSolvesCase(c,'R')).toBe(false);
    expect(lintEolr({...c,continuationAlg:'R'})).toContain('EOLR 接续未达到严格 EOLRb');
  });
  it('短/完整时间线、图解与练习都保持同一 54 贴纸起手', () => {
    const short = new Timeline(c.algs[0],c.setup);
    const full = new Timeline([c.algs[0],c.continuationAlg].filter(Boolean).join(' '),c.setup);
    expect(short.states[0]).toEqual(caseState(c));expect(full.states[0]).toEqual(short.states[0]);
    expect(full.frameAt(short.duration).state).toEqual(short.frameAt(short.duration).state);
    strictEnd(full.frameAt(full.duration).state);
    const reference = scrambleFor(c,()=>0);
    expect(parseAlg(reference)).toEqual(parseAlg(c.setup!));
    expect(sampleTarget(c,reference,()=>0).state).toEqual(caseState(c));
  });
  it('12 种其余 M 棱置换与允许的四种 AUF 保留情形，答案对准后仍闭环', () => {
    expect(EOLR_NUISANCE_ALGS).toHaveLength(12);
    const values = c.targetTier === 'tier2' ? [0,.3,.6,.9] : [0];
    const canonical = inspectEolr(caseState(c));
    const sampled = new Set<string>();
    for (const value of values) for (let i = 0; i < 12; i++) {
      const reference = scrambleFor(c,()=>value);
      const sample = sampleTarget(c,reference,()=>(i+.5)/12);
      const aligned = applyMoves(sample.state,invertMoves(parseAlg(sample.auf)));
      expect(inspectEolr(aligned).key).toBe(canonical.key);
      if (value === 0) sampled.add(aligned.join(','));
      expect(eolrGoal(c,applyMoves(aligned,parseAlg(c.algs[0])))).toBe(true);
      strictEnd(applyMoves(aligned,parseAlg([c.algs[0],c.continuationAlg].filter(Boolean).join(' '))));
    }
    expect(sampled.size).toBe(12);
  });
  it('24 个桥式持法的求解打乱逐一回放，保留 54/54 贴纸与倾斜中心', () => {
    const state = caseState(c);
    const pools = {cfopBottoms:['white' as const],rouxBottoms:[...BOTTOM_COLORS],rouxPairsByBottom:Object.fromEntries(BOTTOM_COLORS.map(b => [b,validPairs(b)]))};
    const candidates = colorCandidates('roux', pools);
    expect(candidates).toHaveLength(24);
    for (const color of candidates) {
      const setup = solveTarget(state,color,solve);
      expect(setup.state).toEqual(state);expect(verifySetup(setup)).toBe(true);
      expect(observedColors(setup.scramble,color)).toEqual(state.map(id => paletteFace(id,paletteFor(color))));
    }
  });
});

it('倾斜起手如实保留；终点与四种 AUF / LR 对调反例仍严格拒绝', () => {
  expect(inspectEolr(caseState(EOLR_CASES.find(c => c.sourceCase === '3/1-7')!)).centerPhase).toBe(1);
  const prefix = applyMoves(solved(),parseAlg("M' U M2 U M' U2 M U2 M M' U2 M' U2 M' U' M'"));
  for (const auf of ['','U','U2',"U'"]) expect(eolrGoal({algs:[],targetTier:'tier3'},applyMoves(prefix,parseAlg(auf)))).toBe(false);
  expect(eolrGoal({algs:[],targetTier:'tier3'},applyMoves(solved(),parseAlg('U M2 U2 M2 U')))).toBe(false);
});

it('EOLR 走完整桥式 24 配色池', () => {
  const pools = {cfopBottoms:['white' as const],rouxBottoms:[...BOTTOM_COLORS],rouxPairsByBottom:Object.fromEntries(BOTTOM_COLORS.map(b => [b,validPairs(b)]))};
  const colors = colorCandidates('roux', pools);
  expect(colors).toHaveLength(24);
  expect(colors.map((_,i) => pickPracticeColors({set:'eolr'},pools,null,()=>(i+.5)/24))).toEqual(colors);
  for (const color of colors) { expect(color.method).toBe('roux');expect(new Set(Object.values(paletteFor(color))).size).toBe(6); }
});
