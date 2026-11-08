export type HomeCards = 'a' | 'b' | 'c';
/** Explicit review flag only; absent or unknown values keep the production layout. */
export function homeCards(value: string | null): HomeCards | undefined {
  return value === 'a' || value === 'b' || value === 'c' ? value : undefined;
}
