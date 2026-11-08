import { expect, it } from 'vitest';
import { Sandbox, MAIN_KEYS, MORE_KEYS, keyMove, moveDuration } from './cubeSandbox';
import { parseAlg } from './alg';
import { applyMoves, solved } from './cube';

it.each([...MAIN_KEYS, ...MORE_KEYS])('key %s produces recognized moves with every suffix', key => {
  for (const suffix of ['', "'", '2'] as const) expect(keyMove(key, suffix)).toEqual(parseAlg(key + suffix)[0]);
});
it('rejects unknown keys', () => { expect(() => keyMove('Q', '')).toThrow(); });
it('suffix stays locked until explicitly changed or reset', () => {
  const s = new Sandbox(); s.suffix = "'"; s.press('R'); s.press('U');
  expect(s.suffix).toBe("'"); s.tick(320);
  expect(s.state).toEqual(applyMoves(solved(), parseAlg("R' U'")));
  s.suffix = '2'; s.press('F'); s.tick(240);
  expect(s.suffix).toBe('2');
  expect(s.state).toEqual(applyMoves(solved(), parseAlg("R' U' F2")));
  expect(s.undo()).toBe(true); s.tick(240); expect(s.suffix).toBe('2');
  expect(s.state).toEqual(applyMoves(solved(), parseAlg("R' U'")));
  s.suffix = ''; s.press('B'); s.tick(160);
  expect(s.state).toEqual(applyMoves(solved(), parseAlg("R' U' B")));
});
it('90 and 180 degree turns commit only after 160 and 240ms', () => {
  const s = new Sandbox(); s.press('R');
  expect(s.tick(159).fraction).toBe(159/160); expect(s.state).toEqual(solved());
  s.tick(1); expect(s.state).toEqual(applyMoves(solved(), parseAlg('R')));
  expect(moveDuration(keyMove('U', '2'))).toBe(240);
  s.suffix = '2'; s.press('U'); s.tick(239); expect(s.history).toHaveLength(1);
  s.tick(1); expect(s.history).toHaveLength(2);
});
it.each(['x', 'y', 'z'])('keeps %s centers rotated and subsequent face turns in the current frame', key => {
  const s = new Sandbox(); s.press(key); s.press('R'); s.press('U'); s.tick(480);
  expect(s.state).toEqual(applyMoves(solved(), parseAlg(`${key} R U`)));
  expect(s.state).not.toEqual(applyMoves(solved(), parseAlg('R U')));
});
it('rapid clicks queue in order, overflow is rejected without consuming the suffix', () => {
  const s = new Sandbox();
  for(let i=0;i<16;i++) expect(s.press(i%2 ? 'U':'R')).toBe(true);
  s.tick(1); s.suffix='2'; expect(s.press('F')).toBe(false); expect(s.suffix).toBe('2');
  expect(s.pending).toBe(16); s.tick(2559);
  expect(s.state).toEqual(applyMoves(solved(), parseAlg(Array(8).fill('R U').join(' '))));
  expect(s.history).toHaveLength(16); expect(s.pending).toBe(0);
});
it('undo is disabled while busy and reverses only the last completed turn', () => {
  const s=new Sandbox(); expect(s.undo()).toBe(false); s.press('x'); s.press('F');
  expect(s.undo()).toBe(false); s.tick(320); expect(s.undo()).toBe(true);
  expect(s.undo()).toBe(false); s.tick(160);
  expect(s.state).toEqual(applyMoves(solved(),parseAlg('x')));
  expect(s.history).toHaveLength(1); s.undo(); s.tick(160); expect(s.state).toEqual(solved());
});
it('reset cancels the in-progress move, queue, suffix and undo history', () => {
  const s=new Sandbox(); s.press('R');s.press('U');s.tick(170);s.suffix='2';s.reset();
  expect(s.tick(10000)).toEqual({state:solved(),move:null,fraction:0});
  expect(s.pending).toBe(0);expect(s.history).toEqual([]);expect(s.suffix).toBe('');expect(s.canUndo).toBe(false);
});
