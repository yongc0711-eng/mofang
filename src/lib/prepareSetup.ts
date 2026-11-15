import { verifySetup, type PreparedSetup } from './practiceTarget';
import type { State } from './cube';
import { paletteFor, sameColors, type PracticeColors } from './practiceColors';
import type { BottomColor } from '../store/devicePrefs';

/** One worker per preparation: cancellation/timeout can always terminate synchronous solver work. */
export function prepareSetup(state: State, colors: BottomColor | PracticeColors, signal: AbortSignal): Promise<PreparedSetup> {
  const target = state.slice();
  const requested = typeof colors === 'string' ? colors : { ...colors };
  return new Promise((resolve, reject) => {
    try { if (typeof requested !== 'string') paletteFor(requested); } catch (error) { reject(error); return; }
    if (signal.aborted) return reject(new Error('已取消'));
    const twoByTwo = typeof requested !== 'string' && requested.method === '2x2';
    const worker = twoByTwo
      ? new Worker(new URL('./practiceSolver2.worker.ts', import.meta.url), { type: 'module' })
      : new Worker(new URL('./practiceSolver.worker.ts', import.meta.url), { type: 'module' });
    const clean = () => { clearTimeout(timeout); signal.removeEventListener('abort', abort); worker.terminate(); };
    const fail = (message: string) => { clean(); reject(new Error(message)); };
    const abort = () => fail('已取消');
    const timeout = setTimeout(() => fail('准备超时，请重试'), 15000);
    signal.addEventListener('abort', abort, { once: true });
    worker.onerror = () => fail('求解器加载或运行失败，请重试');
    worker.onmessage = (event: MessageEvent<{ setup?: PreparedSetup; error?: string }>) => {
      const setup = event.data.setup;
      if (!setup || !verifySetup(setup) || (typeof requested === 'string' ? setup.version !== 1 || setup.bottom !== requested : setup.version !== (twoByTwo ? 3 : 2) || !sameColors(setup.colors, requested)) || setup.state.length !== target.length || setup.state.some((id, i) => id !== target[i])) {
        fail(event.data.error ?? '求解结果校验失败');
        return;
      }
      clean(); resolve(setup);
    };
    worker.postMessage(typeof requested === 'string' ? { state: target, bottom: requested } : { state: target, colors: requested });
  });
}
