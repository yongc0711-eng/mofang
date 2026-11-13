import { describe, expect, it } from 'vitest';
import { parseAlg } from './alg';
import { invertMoves } from './cube';
import { applyMove2, applyMoves2, solved2 } from './cube2';
import { Timeline } from './timeline';

const ENGINE2 = { solved: solved2, applyMove: applyMove2 };

describe('Timeline 换成二阶引擎', () => {
  it('起点仍是公式的逆，最后一步回到还原，状态长度是 24', () => {
    const tl = new Timeline('R U R2', undefined, ENGINE2);
    expect(tl.states[0]).toEqual(applyMoves2(solved2(), invertMoves(parseAlg('R U R2'))));
    expect(tl.states.every((s) => s.length === 24)).toBe(true);
    expect(tl.states[tl.states.length - 1]).toEqual(solved2());
  });

  it('显式 setup 从 setup 之后的状态开始，逐步向前', () => {
    const tl = new Timeline('R', 'U', ENGINE2);
    const start = applyMoves2(solved2(), parseAlg('U'));
    expect(tl.states[0]).toEqual(start);
    expect(tl.states[1]).toEqual(applyMove2(start, parseAlg('R')[0]));
    expect(tl.duration).toBeGreaterThan(0);
  });

  it('引擎只影响状态，不影响步数与时长', () => {
    const three = new Timeline('R U');
    const two = new Timeline('R U', undefined, ENGINE2);
    expect(two.moves).toEqual(three.moves);
    expect(two.starts).toEqual(three.starts);
    expect(three.states[0].length).toBe(54);
  });
});