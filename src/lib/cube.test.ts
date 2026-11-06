import { describe, expect, it } from 'vitest';
import { AlgParseError, moveCount, movesToString, parseAlg } from './alg';
import { STICKERS, applyMoves, invertMoves, normalizeRotation, solved, stickerAt } from './cube';

const run = (alg: string) => applyMoves(solved(), parseAlg(alg));
const isSolved = (s: number[]) => s.every((v, i) => v === i);

describe('转动几何', () => {
  it('R：F 面右上到 U 面右后', () => {
    const from = stickerAt([1, 1, 1], [0, 0, 1]);
    const to = stickerAt([1, 1, -1], [0, 1, 0]);
    expect(run('R')[to]).toBe(from);
  });
  it('U：F 面顶行到 L 面顶行', () => {
    const from = stickerAt([0, 1, 1], [0, 0, 1]);
    const to = stickerAt([-1, 1, 0], [-1, 0, 0]);
    expect(run('U')[to]).toBe(from);
  });
  it('F：U 面前行到 R 面', () => {
    const from = stickerAt([0, 1, 1], [0, 1, 0]);
    const to = stickerAt([1, 0, 1], [1, 0, 0]);
    expect(run('F')[to]).toBe(from);
  });
  it('宽层和整体转动等于分层之和', () => {
    expect(run('r')).toEqual(run("R M'"));
    expect(run('l')).toEqual(run('L M'));
    expect(run('u')).toEqual(run("U E'"));
    expect(run('d')).toEqual(run('D E'));
    expect(run('f')).toEqual(run('F S'));
    expect(run('b')).toEqual(run("B S'"));
    expect(run('x')).toEqual(run("R M' L'"));
    expect(run('y')).toEqual(run("U E' D'"));
    expect(run('z')).toEqual(run("F S B'"));
  });
  it('已知周期', () => {
    expect(isSolved(run('(R U)105'))).toBe(true);
    expect(isSolved(run('(R U)35'))).toBe(false);
    expect(isSolved(run("(R U R' U')6"))).toBe(true);
    for (const m of 'RLUDFBMESrludfbxyz') expect(isSolved(run(`${m}4`))).toBe(true);
  });
  it('公式与逆互相抵消', () => {
    const m = parseAlg("R U2 D' F L' M2 r u' x");
    expect(isSolved(applyMoves(applyMoves(solved(), m), invertMoves(m)))).toBe(true);
  });
  it('54 张贴纸位置唯一', () => {
    expect(new Set(STICKERS.map((s) => `${s.p}|${s.n}`)).size).toBe(54);
  });
  it('整体转动可以被校正', () => {
    expect(isSolved(normalizeRotation(run('x y2 z')))).toBe(true);
    expect(isSolved(normalizeRotation(run("R U R'")))).toBe(false);
  });
});

describe('公式解析', () => {
  it('各种写法', () => {
    expect(movesToString(parseAlg("(R U R' U')2"))).toBe("R U R' U' R U R' U'");
    expect(movesToString(parseAlg('Rw2 U’'))).toBe("r2 U'");
    expect(movesToString(parseAlg("R2' U3"))).toBe("R2 U'");
    expect(movesToString(parseAlg("（R U）'"))).toBe("U' R'");
  });
  it('错误输入报错', () => {
    for (const bad of ['R Q', '(R U', 'R)', 'Mw']) expect(() => parseAlg(bad)).toThrow(AlgParseError);
  });
  it('步数不计整体转动', () => {
    expect(moveCount("x R U R' x'")).toBe(3);
  });
});
