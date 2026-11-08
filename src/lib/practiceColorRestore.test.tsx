import { expect, it } from 'vitest';
import { solve } from 'min2phase.js';
import { solveTarget, verifySetup } from './practiceTarget';
import { parseSession, serializeSession, type PracticeSession } from './practiceSession';
import { getCase } from '../data';
import { caseState } from './cases';
import { paletteFor } from './practiceColors';
import { PracticeQuestionDiagram } from '../pages/PracticePage';
import { CaseDiagram } from '../components/CaseDiagram';
import { createElement } from 'react';
import { renderToStaticMarkup } from 'react-dom/server';
const base = getCase('cmll-s-1')!;
const colors = {method:'roux' as const,bottomColor:'white' as const,bridgePair:'green-blue' as const,leftColor:'green' as const};
const prepared=solveTarget(caseState(base),colors,solve);
const session:PracticeSession={poolIds:[base.id],question:{id:base.id,alg:base.algs[0],scramble:prepared.scramble,prepared},phase:'running',count:1,elapsedMs:25,runningSince:1000,savedAt:2000,docId:'same'};
it('v2 full color snapshot restores exactly without choosing another bottom/pair/direction',()=>{
  const restored=parseSession(serializeSession(session),2100,()=>true,'same')!;
  expect(restored).toEqual(session);
  expect(restored.question.prepared).toEqual(prepared);
  expect(verifySetup(restored.question.prepared)).toBe(true);
});
it('v2 reload freezes the timer at savedAt using the exact existing T21 rule',()=>{
  const restored=parseSession(serializeSession(session),2100,()=>true,'new')!;
  expect(restored.question).toEqual(session.question);
  expect({phase:restored.phase,elapsedMs:restored.elapsedMs,runningSince:restored.runningSince}).toEqual({phase:'paused',elapsedMs:1025,runningSince:null});
});
it('tampered v2 observation is not accepted as prepared; stored setup/timer remain rather than rerolling',()=>{
  const tampered={...session,question:{...session.question,prepared:{...prepared,observation:'x'}}};
  const restored=parseSession(JSON.stringify(tampered),2100,()=>true,'same')!;
  expect(restored.question).toEqual({id:base.id,alg:base.algs[0],scramble:prepared.scramble});
  expect(restored.phase).toBe('running');
});
it('ready and done share the same frozen palette, with done removing actual-state input only',()=>{
  const palette=paletteFor(colors),props={c:base,set:{view:'top' as const},bottom:'white' as const,prepared,phase:'ready',palette};
  const ready=renderToStaticMarkup(createElement(PracticeQuestionDiagram,props));
  const done=renderToStaticMarkup(createElement(PracticeQuestionDiagram,{...props,phase:'done'}));
  expect(ready).toBe(renderToStaticMarkup(createElement(CaseDiagram,{c:base,view:'top',bottom:'white',palette,state:prepared.state})));
  expect(done).toBe(renderToStaticMarkup(createElement(CaseDiagram,{c:base,view:'top',bottom:'white',palette})));
});
