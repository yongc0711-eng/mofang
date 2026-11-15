import { afterEach, beforeEach, expect, it, vi } from 'vitest';
import { prepareSetup } from './prepareSetup';
import { solveTarget } from './practiceTarget';
import { solved } from './cube';
import { solveTarget2 } from './practice2';
import { caseState2 } from './cases2';
import { getCase } from '../data';
class FakeWorker {
  static instances: FakeWorker[] = [];
  onmessage: ((e: MessageEvent) => void) | null = null;
  onerror: (() => void) | null = null;
  terminate = vi.fn();
  postMessage = vi.fn();
  constructor() { FakeWorker.instances.push(this); }
}
beforeEach(() => { vi.useFakeTimers(); vi.stubGlobal('Worker', FakeWorker); FakeWorker.instances = []; });
afterEach(() => { vi.useRealTimers(); vi.unstubAllGlobals(); });
it('worker is created only on a preparation request; successful response is checked and worker terminated', async () => {
  expect(FakeWorker.instances).toHaveLength(0);
  const p = prepareSetup(solved(), 'green', new AbortController().signal);
  const w = FakeWorker.instances[0];
  const setup = solveTarget(solved(), 'green', () => '');
  w.onmessage!({ data: { setup } } as MessageEvent);
  expect(await p).toEqual(setup);
  expect(w.terminate).toHaveBeenCalledOnce();
});
it('timeout rejects and terminates with no inverse fallback', async () => {
  const p = prepareSetup(solved(), 'white', new AbortController().signal);
  const result = expect(p).rejects.toThrow('准备超时');
  await vi.advanceTimersByTimeAsync(15000);
  await result;
  expect(FakeWorker.instances[0].terminate).toHaveBeenCalledOnce();
});
it('cancelled response cannot resolve a stale question', async () => {
  const controller = new AbortController();
  const p = prepareSetup(solved(), 'white', controller.signal);
  const result = expect(p).rejects.toThrow('已取消');
  controller.abort();
  FakeWorker.instances[0].onmessage!({ data: { setup: solveTarget(solved(), 'white', () => '') } } as MessageEvent);
  await result;
});
it('load error and mismatched target both reject without fallback', async () => {
  const p = prepareSetup(solved(), 'white', new AbortController().signal);
  FakeWorker.instances[0].onerror!();
  await expect(p).rejects.toThrow('加载或运行失败');
  const other = prepareSetup(solved(), 'white', new AbortController().signal);
  FakeWorker.instances[1].onmessage!({ data: { setup: solveTarget(solved(), 'green', () => '') } } as MessageEvent);
  await expect(other).rejects.toThrow('校验失败');
});
it('v2 worker request snapshots complete colors/state and validates a matching v2 result', async () => {
  const colors = {method:'roux' as const,bottomColor:'white' as const,bridgePair:'green-blue' as const,leftColor:'blue' as 'blue'|'green'};
  const state=solved();
  const p=prepareSetup(state,colors,new AbortController().signal),w=FakeWorker.instances[0];
  expect(w.postMessage).toHaveBeenCalledExactlyOnceWith({state:solved(),colors:{method:'roux',bottomColor:'white',bridgePair:'green-blue',leftColor:'blue'}});
  const setup=solveTarget(solved(),colors,()=> '');
  colors.leftColor='green';state[0]=53;
  w.onmessage!({data:{setup}} as MessageEvent);
  expect(await p).toEqual(setup);
  expect(w.terminate).toHaveBeenCalledOnce();
});
it('v2 rejects a different bridge/left direction even when the bottom and state match',async()=>{
  const colors={method:'roux' as const,bottomColor:'white' as const,bridgePair:'green-blue' as const,leftColor:'blue' as const};
  const p=prepareSetup(solved(),colors,new AbortController().signal);
  const different=solveTarget(solved(),{...colors,leftColor:'green'},()=> '');
  FakeWorker.instances[0].onmessage!({data:{setup:different}} as MessageEvent);
  await expect(p).rejects.toThrow('校验失败');
});
it('a v2 request rejects a v1 response instead of silently downgrading its palette',async()=>{
  const p=prepareSetup(solved(),{method:'cfop',bottom:'white'},new AbortController().signal);
  FakeWorker.instances[0].onmessage!({data:{setup:solveTarget(solved(),'white',()=> '')}} as MessageEvent);
  await expect(p).rejects.toThrow('校验失败');
});
it('v2 cancellation still terminates the solver without replacing the chosen colors',async()=>{
  const controller=new AbortController();
  const p=prepareSetup(solved(),{method:'cfop',bottom:'green'},controller.signal);
  const rejected=expect(p).rejects.toThrow('已取消');controller.abort();await rejected;
  expect(FakeWorker.instances[0].terminate).toHaveBeenCalledOnce();
});
it('v3 worker request snapshots 24-sticker target/colors and rejects a different target or bottom', async () => {
  const state = caseState2(getCase('eg1-h-1')!), colors = { method: '2x2' as const, bottom: 'blue' as const };
  const p = prepareSetup(state, colors, new AbortController().signal), worker = FakeWorker.instances[0];
  expect(worker.postMessage).toHaveBeenCalledExactlyOnceWith({ state, colors });
  const setup = solveTarget2(state, colors);
  state[0] = -1;
  worker.onmessage!({ data: { setup } } as MessageEvent);
  expect(await p).toEqual(setup);
  expect(worker.terminate).toHaveBeenCalledOnce();
  for (const wrong of [solveTarget2(setup.state, { method: '2x2', bottom: 'green' }), solveTarget2(caseState2(getCase('eg2-h-1')!), colors)]) {
    const request = prepareSetup(setup.state, colors, new AbortController().signal);
    FakeWorker.instances.at(-1)!.onmessage!({ data: { setup: wrong } } as MessageEvent);
    await expect(request).rejects.toThrow('校验失败');
  }
});
it('v3 cancellation and timeout terminate their workers without changing the question', async () => {
  const controller = new AbortController(), state = caseState2(getCase('cll-as-1')!);
  const request = prepareSetup(state, { method: '2x2', bottom: 'white' }, controller.signal);
  const rejected = expect(request).rejects.toThrow('已取消'); controller.abort(); await rejected;
  expect(FakeWorker.instances[0].terminate).toHaveBeenCalledOnce();
  const timed = prepareSetup(state, { method: '2x2', bottom: 'white' }, new AbortController().signal);
  const timeout = expect(timed).rejects.toThrow('准备超时');
  await vi.advanceTimersByTimeAsync(15000); await timeout;
  expect(FakeWorker.instances[1].terminate).toHaveBeenCalledOnce();
});
