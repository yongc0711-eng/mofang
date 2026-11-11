import { BOTTOM_COLORS, PAIRS, bottomPalette, isRouxSet, legacyRoux, rouxPalette, validPairs, type BottomColor, type BridgePair, type BrowseColors, type Palette, type RouxColors } from './colorScheme';

export type PracticeColors = { method: 'cfop'; bottom: BottomColor } | ({ method: 'roux' } & RouxColors);
const palettes = new Map<string, Palette>();
export function paletteFor(colors: PracticeColors): Palette {
  if (!colors || typeof colors !== 'object') throw new Error('非法练习配色');
  if (colors.method === 'roux') {
    if (!BOTTOM_COLORS.includes(colors.bottomColor) || !validPairs(colors.bottomColor).includes(colors.bridgePair) ||
        !(PAIRS[colors.bridgePair] as readonly string[]).includes(colors.leftColor)) throw new Error('非法练习配色');
    const key = `${colors.bottomColor}/${colors.bridgePair}/${colors.leftColor}`;
    let palette = palettes.get(key);
    if (!palette) { palette = rouxPalette(colors); palettes.set(key, palette); }
    return palette;
  }
  if (colors.method !== 'cfop' || !BOTTOM_COLORS.includes(colors.bottom)) throw new Error('非法练习配色');
  return bottomPalette(colors.bottom);
}
export const colorBottom = (c: PracticeColors): BottomColor => c.method === 'cfop' ? c.bottom : c.bottomColor;
export const colorKey = (c: PracticeColors): string => c.method === 'cfop' ? `cfop/${c.bottom}` : `roux/${c.bottomColor}/${c.bridgePair}/${c.leftColor}`;
export function sameColors(a: PracticeColors, b: PracticeColors): boolean { return colorKey(a) === colorKey(b); }
export interface PracticeColorPools {
  cfopBottoms: BottomColor[];
  rouxBottoms: BottomColor[];
  rouxPairsByBottom: Partial<Record<BottomColor, BridgePair[]>>;
}
const legalColors = (v: unknown): BottomColor[] => Array.isArray(v) ? [...new Set(v.filter((c): c is BottomColor => BOTTOM_COLORS.includes(c)))] : [];
/** Only initializes/cleans a scope snapshot, never a subscription to browsing preferences. */
export function initializeColorPools(saved: Partial<PracticeColorPools> & { bottoms?: BottomColor[] }, prefs: BrowseColors): PracticeColorPools {
  const old = legalColors(saved.bottoms);
  const cfopBottoms = legalColors(saved.cfopBottoms), rouxBottoms = legalColors(saved.rouxBottoms);
  if (!cfopBottoms.length) cfopBottoms.push(...(old.length ? old : [prefs.cfop.bottomColor]));
  if (!rouxBottoms.length) rouxBottoms.push(...(old.length ? old : [prefs.roux.bottomColor]));
  const rouxPairsByBottom: PracticeColorPools['rouxPairsByBottom'] = {};
  for (const bottom of rouxBottoms) {
    const raw = saved.rouxPairsByBottom?.[bottom];
    const pairs = Array.isArray(raw) ? [...new Set(raw.filter(p => validPairs(bottom).includes(p)))] : [];
    rouxPairsByBottom[bottom] = pairs.length ? pairs : [bottom === prefs.roux.bottomColor ? prefs.roux.bridgePair : legacyRoux(bottom).bridgePair];
  }
  return { cfopBottoms, rouxBottoms, rouxPairsByBottom };
}
export function snapshotPools(pools: PracticeColorPools): PracticeColorPools {
  return { cfopBottoms: [...pools.cfopBottoms], rouxBottoms: [...pools.rouxBottoms], rouxPairsByBottom: Object.fromEntries(Object.entries(pools.rouxPairsByBottom).map(([b,p])=>[b,[...p]])) };
}
export function togglePoolBottom(pools: PracticeColorPools, method: 'cfop' | 'roux', bottom: BottomColor): PracticeColorPools {
  if (!BOTTOM_COLORS.includes(bottom)) throw new Error('非法底色');
  const next = snapshotPools(pools), key = method === 'cfop' ? 'cfopBottoms' : 'rouxBottoms';
  const selected = next[key];
  if (selected.includes(bottom)) { if (selected.length > 1) next[key] = selected.filter(c=>c!==bottom); }
  else {
    next[key].push(bottom);
    if (method === 'roux' && !next.rouxPairsByBottom[bottom]?.length) next.rouxPairsByBottom[bottom] = [legacyRoux(bottom).bridgePair];
  }
  return next;
}
export function togglePoolPair(pools: PracticeColorPools, bottom: BottomColor, pair: BridgePair): PracticeColorPools {
  if (!pools.rouxBottoms.includes(bottom) || !validPairs(bottom).includes(pair)) throw new Error('非法练习桥对');
  const next = snapshotPools(pools), pairs = next.rouxPairsByBottom[bottom];
  if (!pairs?.length) throw new Error('至少选择一对桥色');
  if (pairs.includes(pair)) { if (pairs.length > 1) next.rouxPairsByBottom[bottom] = pairs.filter(p=>p!==pair); }
  else pairs.push(pair);
  return next;
}
export function colorCandidates(method: 'cfop' | 'roux', pools: PracticeColorPools): PracticeColors[] {
  const bottoms = method === 'cfop' ? pools.cfopBottoms : pools.rouxBottoms;
  if (!bottoms.length) throw new Error('至少选择一种练习底色');
  const candidates: PracticeColors[] = [];
  for (const bottom of [...new Set(bottoms)]) {
    if (!BOTTOM_COLORS.includes(bottom)) throw new Error('非法练习底色');
    if (method === 'cfop') candidates.push({ method, bottom });
    else {
      const pairs = pools.rouxPairsByBottom[bottom];
      if (!pairs?.length) throw new Error('至少选择一对桥色');
      const valid: PracticeColors[] = [];
      for (const pair of [...new Set(pairs)]) if (validPairs(bottom).includes(pair)) for (const leftColor of PAIRS[pair]) {
        const colors: PracticeColors = { method, bottomColor: bottom, bridgePair: pair, leftColor };
        try { paletteFor(colors); valid.push(colors); } catch { /* Filter impossible rotations, never solve a different target. */ }
      }
      if (!valid.length) throw new Error('没有合法练习桥色组合');
      candidates.push(...valid);
    }
  }
  return candidates;
}
export function pickPracticeColors(c: { set: string }, pools: PracticeColorPools, last: PracticeColors | null, rand = Math.random): PracticeColors {
  const method = isRouxSet(c.set) ? 'roux' : 'cfop';
  let candidates = colorCandidates(method, pools);
  if (candidates.length > 1 && last) candidates = candidates.filter(c=>!sameColors(c,last));
  const value = rand(), index = Number.isFinite(value) ? Math.min(candidates.length-1, Math.max(0, Math.floor(value*candidates.length))) : 0;
  return Object.freeze({ ...candidates[index] });
}
