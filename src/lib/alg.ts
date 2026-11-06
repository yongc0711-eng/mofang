import { invertMoves, type Move } from './cube';

const BASES = new Set('RLUDFBMESrludfbxyz'.split(''));

export class AlgParseError extends Error {}

/**
 * 解析公式字符串。支持：R U' F2 M' r Rw x y z、括号分组 (R U R' U')、括号重复 (R U)3。
 * 也容忍中文撇号和全角括号，便于手动输入。
 */
export function parseAlg(input: string): Move[] {
  const s = input
    .replace(/[’‘`´]/g, "'")
    .replace(/（/g, '(')
    .replace(/）/g, ')');
  let i = 0;

  const skip = () => {
    while (i < s.length && /\s/.test(s[i])) i++;
  };
  const readCount = (): number => {
    const start = i;
    while (i < s.length && /\d/.test(s[i])) i++;
    return start === i ? 1 : Number(s.slice(start, i));
  };

  function parseSeq(depth: number): Move[] {
    const out: Move[] = [];
    for (;;) {
      skip();
      if (i >= s.length) {
        if (depth > 0) throw new AlgParseError('括号没有闭合');
        return out;
      }
      const ch = s[i];
      if (ch === ')') {
        if (depth === 0) throw new AlgParseError('多余的右括号');
        i++;
        return out;
      }
      if (ch === '(') {
        i++;
        const inner = parseSeq(depth + 1);
        const count = readCount();
        const prime = s[i] === "'";
        if (prime) i++;
        const unit = prime ? invertMoves(inner) : inner;
        for (let k = 0; k < count; k++) out.push(...unit);
        continue;
      }
      if (!BASES.has(ch)) throw new AlgParseError(`无法识别 “${ch}”`);
      i++;
      let base = ch;
      if (s[i] === 'w') {
        if (!'RLUDFB'.includes(ch)) throw new AlgParseError(`无法识别 “${ch}w”`);
        base = ch.toLowerCase();
        i++;
      }
      const count = readCount();
      const prime = s[i] === "'";
      if (prime) i++;
      const amount = (((prime ? -count : count) % 4) + 4) % 4;
      if (amount !== 0) out.push({ base, amount: amount as Move['amount'] });
    }
  }
  return parseSeq(0);
}

export function movesToString(moves: Move[]): string {
  return moves.map((m) => m.base + (m.amount === 1 ? '' : m.amount === 2 ? '2' : "'")).join(' ');
}

/** 转成 cubing.js 能直接播放的扁平写法 */
export const normalizeAlg = (alg: string): string => movesToString(parseAlg(alg));

/** 公式步数（HTM，整体转动不计，M/E/S 记 1 步） */
export const moveCount = (alg: string): number =>
  parseAlg(alg).filter((m) => !'xyz'.includes(m.base)).length;
