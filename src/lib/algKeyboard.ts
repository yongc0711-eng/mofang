export const ALG_BASE_KEYS = ['R', 'L', 'U', 'D', 'F', 'B'] as const;
export const ALG_MOVE_KEYS = [...ALG_BASE_KEYS, 'r', 'l', 'u', 'd', 'f', 'b', 'M', 'E', 'S', 'x', 'y', 'z'] as const;
type AlgToken = `${typeof ALG_MOVE_KEYS[number]}${'' | "'" | '2'}`;
/** The original six-face forms remain accepted by the editing API. */
export const ALG_KEY_TOKENS = (['', "'", '2'] as const)
  .flatMap((suffix) => ALG_BASE_KEYS.map((base) => `${base}${suffix}` as AlgToken));
export type AlgKeyboardEdit = { type: 'append'; token: AlgToken } | { type: 'suffix'; suffix: "'" | '2' } | { type: 'backspace' } | { type: 'clear' };

/** Append at the end; preserve manual text inside the draft. Backspace removes one Unicode character. */
export function editAlgDraft(draft: string, edit: AlgKeyboardEdit): string {
  if (edit.type === 'clear') return '';
  if (edit.type === 'backspace') return Array.from(draft.trimEnd()).slice(0, -1).join('').trimEnd();
  const prefix = draft.trim();
  if (edit.type === 'suffix') {
    // Match only a terminal move, including a manually typed Rw form; never change group repetition.
    const match = /([RLUDFB](?:w)?|[MESrludfbxyz])(2|')?$/.exec(prefix);
    if (!match) return draft;
    const suffix = match[2] === edit.suffix ? '' : edit.suffix;
    return prefix.slice(0, match.index) + match[1] + suffix;
  }
  return prefix ? `${prefix} ${edit.token}` : edit.token;
}
