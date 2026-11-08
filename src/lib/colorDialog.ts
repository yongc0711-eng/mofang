/** Roving tab focus: null means leave unrelated keys alone. */
export function colorTabIndex(index: number, key: string): number | null {
  if (key === 'Home') return 0;
  if (key === 'End') return 1;
  if (key === 'ArrowRight' || key === 'ArrowLeft') return 1 - index;
  return null;
}
export function trappedFocusIndex(index: number, count: number, shift: boolean): number | null {
  if (!count) return null;
  if (shift && index <= 0) return count - 1;
  if (!shift && (index < 0 || index === count - 1)) return 0;
  return null;
}
