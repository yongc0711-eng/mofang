/** Roving tab focus: null means leave unrelated keys alone. */
export function colorTabIndex(index: number, key: string, count = 2): number | null {
  if (key === 'Home') return 0;
  if (key === 'End') return count - 1;
  if (key === 'ArrowRight') return (index + 1) % count;
  if (key === 'ArrowLeft') return (index + count - 1) % count;
  return null;
}
export function trappedFocusIndex(index: number, count: number, shift: boolean): number | null {
  if (!count) return null;
  if (shift && index <= 0) return count - 1;
  if (!shift && (index < 0 || index === count - 1)) return 0;
  return null;
}
