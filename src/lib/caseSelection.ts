import { getUi, setUi } from './uiState';
import type { AlgCase } from '../types';

const keyFor = (caseId: string) => `case-selection:${caseId}`;

/** UI-only memory: survives route unmounts, not reloads or user-data exports. */
export function rememberCaseSelection(caseId: string, alg: string | null): void {
  setUi(keyFor(caseId), alg);
}

/** Discard stale selections before rendering a player/diagram; do not change the primary algorithm. */
export function readCaseSelection(c: Pick<AlgCase, 'id' | 'algs'>, custom: readonly string[] = []): string | null {
  const selected = getUi<string | null>(keyFor(c.id), null);
  if (typeof selected === 'string' && (c.algs.includes(selected) || custom.includes(selected))) return selected;
  if (selected !== null) rememberCaseSelection(c.id, null);
  return null;
}
