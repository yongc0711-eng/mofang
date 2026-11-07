import { verifySetup, type PreparedSetup } from './practiceTarget';
import type { State } from './cube';
import type { BottomColor } from '../store/devicePrefs';

/** One worker per preparation: cancellation/timeout can always terminate synchronous solver work. */
export function prepareSetup(state: State, bottom: BottomColor, signal: AbortSignal): Promise<PreparedSetup> {
  return new Promise((resolve, reject) => {
    if (signal.aborted) return reject(new Error('已取消'));
    const worker = new Worker(new URL('./practiceSolver.worker.ts', import.meta.url), { type: 'module' });
    const clean = () => { clearTimeout(timeout); signal.removeEventListener('abort', abort); worker.terminate(); };
    const fail = (message: string) => { clean(); reject(new Error(message)); };
    const abort = () => fail('已取消');
    const timeout = setTimeout(() => fail('准备超时，请重试'), 15000);
    signal.addEventListener('abort', abort, { once: true });
    worker.onerror = () => fail('求解器加载或运行失败，请重试');
    worker.onmessage = (event: MessageEvent<{ setup?: PreparedSetup; error?: string }>) => {
      const setup = event.data.setup;
      if (!setup || !verifySetup(setup) || setup.bottom !== bottom || setup.state.some((id, i) => id !== state[i])) {
        fail(event.data.error ?? '求解结果校验失败');
        return;
      }
      clean(); resolve(setup);
    };
    worker.postMessage({ state, bottom });
  });
}
