export const ALG_BASE_KEYS = ['R', 'L', 'U', 'D', 'F', 'B'] as const;
type AlgToken = `${typeof ALG_BASE_KEYS[number]}${'' | "'" | '2'}`;
export const ALG_KEY_TOKENS: readonly AlgToken[] = (['', "'", '2'] as const)
  .flatMap((suffix) => ALG_BASE_KEYS.map((base) => `${base}${suffix}` as AlgToken));
export type AlgKeyboardEdit = { type: 'append'; token: AlgToken } | { type: 'backspace' } | { type: 'clear' };

/** Append at the end; preserve manual text inside the draft. Backspace removes one Unicode character. */
export function editAlgDraft(draft: string, edit: AlgKeyboardEdit): string {
  if (edit.type === 'clear') return '';
  if (edit.type === 'backspace') return Array.from(draft.trimEnd()).slice(0, -1).join('').trimEnd();
  const prefix = draft.trim();
  return prefix ? `${prefix} ${edit.token}` : edit.token;
}
