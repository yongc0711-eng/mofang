import spec from '../../docs/tasks/T68.md?raw';
import casePageSource from '../pages/CasePage.tsx?raw';
import { expect, it } from 'vitest';
import { ALG_DISPLAY, displayAlg } from './algDisplay';
import { parseAlg } from './alg';
import { OLL_CASES } from '../data/oll';
import { PLL_CASES } from '../data/pll';

const rows = [...spec.matchAll(/^\| `(oll-[^`]+|pll-[^`]+)` \| `([^`]+)` \| `([^`]+)` \| ([AB]) 表/gm)]
  .map(([, id, raw, display, source]) => ({ id, raw, display, source }));

it('matches the complete authoritative 78-row table exactly, including source and set counts', () => {
  expect(rows).toHaveLength(78);
  expect(new Set(rows.map(r => r.id)).size).toBe(78);
  expect(rows.filter(r => r.source === 'A')).toHaveLength(41);
  expect(rows.filter(r => r.source === 'B')).toHaveLength(37);
  expect(rows.filter(r => r.id.startsWith('oll-'))).toHaveLength(57);
  expect(rows.filter(r => r.id.startsWith('pll-'))).toHaveLength(21);
  expect(Object.keys(ALG_DISPLAY)).toHaveLength(78);
  expect(ALG_DISPLAY).toEqual(Object.fromEntries(rows.map(({ id, raw, display }) => [id, { raw, display }])));
});
it.each(rows)('$id preserves raw text, parsed moves and matches the display exactly', ({ id, raw, display }) => {
  expect(ALG_DISPLAY[id]).toEqual({ raw, display });
  expect([...OLL_CASES, ...PLL_CASES].find(c => c.id === id)?.algs[0]).toBe(raw);
  expect(parseAlg(display)).toEqual(parseAlg(raw));
  expect(display.replace(/[()]/g, '')).toBe(raw);
  expect(displayAlg(id, raw)).toBe(display);
});
it('falls back for a custom formula with a known case id', () => {
  expect(displayAlg('oll-4', 'R U')).toBe('R U');
});
it('falls back for an unknown or inherited object key', () => {
  expect(displayAlg('unknown', 'R U')).toBe('R U');
  expect(displayAlg('toString', 'R U')).toBe('R U');
});
it('falls back for an edited primary formula instead of matching normalized moves', () => {
  const edited = 'U ' + ALG_DISPLAY['oll-4'].raw;
  expect(displayAlg('oll-4', edited)).toBe(edited);
});
it('keeps oll-22 ungrouped and the corrected oll-50 grouping', () => {
  expect(ALG_DISPLAY['oll-22'].display).toBe(ALG_DISPLAY['oll-22'].raw);
  expect(ALG_DISPLAY['oll-50'].display).toBe("r' U (r2 U') (r2 U') r2 U r'");
});
it('wires only row visible text to displayAlg and keeps all actions and labels raw', () => {
  const src = casePageSource;
  const row = src.slice(src.indexOf('  const row ='), src.indexOf('  const row =') + 1800);
  expect(row).toContain('<code className="alg">{displayAlg(c.id, alg)}</code>');
  expect(row).toContain('onClick={() => setSelected(alg)}');
  expect(row).toContain('key={alg}');
  expect(row).toContain('aria-label={`查看这条公式的起手 ${alg}`}');
  expect(row).toContain('moveCount(alg)');
  expect(row).toContain('setPrimaryAlg(c.id, alg)');
  expect(src.match(/displayAlg\(/g)).toHaveLength(1);
});
