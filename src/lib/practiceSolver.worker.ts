// This module is bundled only into the lazy worker, never the application's initial graph.
import { solve } from 'min2phase.js';
import { solveTarget } from './practiceTarget';
import type { State } from './cube';
import type { PracticeColors } from './practiceColors';
import type { BottomColor } from '../store/devicePrefs';
self.onmessage = (event: MessageEvent<{ state: State; bottom?: BottomColor; colors?: PracticeColors }>) => {
  try {
    self.postMessage({ setup: solveTarget(event.data.state, event.data.colors ?? event.data.bottom!, solve) });
  } catch (error) {
    self.postMessage({ error: error instanceof Error ? error.message : '准备失败' });
  }
};
