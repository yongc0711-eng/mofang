import { afterEach, beforeEach, expect, it, vi } from 'vitest';
import { prepareSetup } from './prepareSetup';
import { solveTarget } from './practiceTarget';
import { solved } from './cube';
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
