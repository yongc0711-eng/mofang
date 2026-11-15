import { solveTarget2 } from './practice2';
import type { PracticeColors } from './practiceColors';
import type { State2 } from './cube2';

self.onmessage = (event: MessageEvent<{ state: State2; colors: PracticeColors }>) => {
  try { self.postMessage({ setup: solveTarget2(event.data.state, event.data.colors) }); }
  catch (error) { self.postMessage({ error: error instanceof Error ? error.message : '二阶求解失败' }); }
};
