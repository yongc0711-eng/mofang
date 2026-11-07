import { describe, expect, it } from 'vitest';
import { ALG_KEY_TOKENS, editAlgDraft } from './algKeyboard';
import { parseAlg } from './alg';

describe('T42 formula keyboard editing', () => {
  for (const token of ALG_KEY_TOKENS) {
    it(`${token} is one recognized move, and appending preserves the previous moves`, () => {
      expect(parseAlg(token)).toHaveLength(1);
      const draft = editAlgDraft("R U'  ", { type: 'append', token });
      expect(draft).toBe(`R U' ${token}`);
      expect(parseAlg(draft)).toEqual([...parseAlg("R U'"), ...parseAlg(token)]);
    });
  }
  it('covers all six faces and all three suffixes exactly once', () => {
    expect(new Set(ALG_KEY_TOKENS).size).toBe(18);
    for (const base of ['R', 'L', 'U', 'D', 'F', 'B']) {
      for (const suffix of ['', "'", '2']) expect(ALG_KEY_TOKENS).toContain(base + suffix);
    }
  });
  it('rapid consecutive edits use the latest draft without duplicate spaces', () => {
    const draft = (['R', "U'", 'F2'] as const).reduce((text, token) => editAlgDraft(text, { type: 'append', token }), '  ');
    expect(draft).toBe("R U' F2");
    expect(draft).not.toContain('  ');
  });
  it('appending preserves manually entered parentheses and inner formatting', () => {
    expect(editAlgDraft(" (R  U)3 \n", { type: 'append', token: 'F2' })).toBe('(R  U)3 F2');
  });
  it('backspace removes one character, including a prime or 2, and skips trailing whitespace', () => {
    let draft = "R U'  ";
    draft = editAlgDraft(draft, { type: 'backspace' });
    expect(draft).toBe('R U');
    expect(editAlgDraft(draft, { type: 'backspace' })).toBe('R');
    expect(editAlgDraft('R2', { type: 'backspace' })).toBe('R');
    expect(editAlgDraft("RUR'U'", { type: 'backspace' })).toBe("RUR'U");
    expect(editAlgDraft('R💡', { type: 'backspace' })).toBe('R');
  });
  it('backspace is safe on an empty or whitespace-only draft', () => {
    expect(editAlgDraft('', { type: 'backspace' })).toBe('');
    expect(editAlgDraft(' \n ', { type: 'backspace' })).toBe('');
  });
  it('clear empties manual or keyboard input and a subsequent key starts a fresh draft', () => {
    const empty = editAlgDraft("(R U R' U')3", { type: 'clear' });
    expect(empty).toBe('');
    expect(editAlgDraft(empty, { type: 'append', token: 'B2' })).toBe('B2');
  });
});

import { ALG_MOVE_KEYS } from './algKeyboard';
for (const token of ALG_MOVE_KEYS) {
  for (const suffix of ["'", '2'] as const) {
    it(`${token} plus separate ${suffix} key produces exactly one recognized move`, () => {
      const base = editAlgDraft('U ', { type: 'append', token });
      const edited = editAlgDraft(base, { type: 'suffix', suffix });
      expect(edited).toBe(`U ${token}${suffix}`);
      expect(parseAlg(edited)).toEqual(parseAlg(`U ${token}${suffix}`));
      expect(parseAlg(edited)).toHaveLength(2);
      expect(editAlgDraft(edited, { type: 'suffix', suffix })).toBe(base);
    });
  }
}
it('separate suffixes replace each other and edit a manually typed wide move', () => {
  expect(editAlgDraft("R U'", { type: 'suffix', suffix: '2' })).toBe('R U2');
  expect(editAlgDraft('R U2', { type: 'suffix', suffix: "'" })).toBe("R U'");
  expect(editAlgDraft('Rw  ', { type: 'suffix', suffix: '2' })).toBe('Rw2');
  expect(editAlgDraft("RUR'U'", { type: 'suffix', suffix: '2' })).toBe("RUR'U2");
});
it('a suffix without a terminal move does not create a stray token or change grouped repeats', () => {
  for (const draft of ['', '  ', '(R U)3', '(R U)']) {
    expect(editAlgDraft(draft, { type: 'suffix', suffix: "'" })).toBe(draft);
    expect(editAlgDraft(draft, { type: 'suffix', suffix: '2' })).toBe(draft);
  }
});

for (const token of ALG_MOVE_KEYS) {
  it(`${token} with the independent 3 key keeps notation and parses as inverse`, () => {
    const draft = editAlgDraft('', { type: 'append', token });
    const triple = editAlgDraft(draft, { type: 'suffix', suffix: '3' });
    expect(triple).toBe(`${token}3`);
    expect(parseAlg(triple)).toEqual(parseAlg(`${token}'`));
    expect(editAlgDraft(triple, { type: 'suffix', suffix: '3' })).toBe(token);
    expect(editAlgDraft(triple, { type: 'suffix', suffix: '2' })).toBe(`${token}2`);
    expect(editAlgDraft(`${token}2`, { type: 'suffix', suffix: '3' })).toBe(triple);
    expect(editAlgDraft(triple, { type: 'suffix', suffix: "'" })).toBe(`${token}'`);
  });
}
it('3 does not create a standalone token or change a grouped repeat', () => {
  expect(editAlgDraft('', { type: 'suffix', suffix: '3' })).toBe('');
  expect(editAlgDraft('(R U)3', { type: 'suffix', suffix: '3' })).toBe('(R U)3');
});
