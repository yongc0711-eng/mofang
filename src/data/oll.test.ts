import { describe, expect, it } from 'vitest';
import { OLL_CASES } from './oll';

describe('OLL 识别要点', () => {
  it('57 条都非空', () => {
    expect(OLL_CASES).toHaveLength(57);
    for (const c of OLL_CASES) {
      expect(c.recognition?.trim(), c.id).toBeTruthy();
    }
  });

  it('57 条两两不同', () => {
    const seen = new Map<string, string>();
    for (const c of OLL_CASES) {
      const key = c.recognition?.trim() ?? '';
      expect(seen.has(key), `${c.id} 与 ${seen.get(key)} 重复`).toBe(false);
      seen.set(key, c.id);
    }
  });
});