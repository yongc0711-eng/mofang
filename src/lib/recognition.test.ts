import { describe, expect, it } from 'vitest';
import { ALL_CASES, getSet } from '../data';
import { BOTTOM_COLORS, topColor, type BottomColor } from '../store/devicePrefs';
import { COLOR_NAME_ZH, recognitionFor } from './recognition';

const OLL = getSet('oll')!.cases;
const OTHER_COLOR_WORDS = /[白红橙绿蓝]/;

describe('topColor：由 T28 的映射推出的顶色', () => {
  const EXPECTED: Record<BottomColor, BottomColor> = {
    white: 'yellow',
    yellow: 'white',
    red: 'orange',
    orange: 'red',
    green: 'blue',
    blue: 'green',
  };

  it('白→黄、黄→白、红→橙、橙→红、绿→蓝、蓝→绿', () => {
    for (const b of BOTTOM_COLORS) expect(topColor(b), b).toBe(EXPECTED[b]);
  });

  it('六种底色各不相同，顶色也各不相同，且顶色永远不是底色', () => {
    expect(new Set(BOTTOM_COLORS.map(topColor)).size).toBe(6);
    for (const b of BOTTOM_COLORS) expect(topColor(b)).not.toBe(b);
  });

  it('是底色的对色：对色的对色回到自己', () => {
    for (const b of BOTTOM_COLORS) expect(topColor(topColor(b))).toBe(b);
  });
});

describe('recognitionFor：OLL 识别文字跟随顶色', () => {
  it('数据是 57 条 OLL，每条都有识别文字', () => {
    expect(OLL).toHaveLength(57);
    for (const c of OLL) expect(c.recognition, c.id).toBeTruthy();
  });

  it('原文里的「黄」只有一个意思：没有别的颜色词，替换不会产生歧义', () => {
    for (const c of OLL) {
      expect(c.recognition, c.id).toContain('黄');
      expect(c.recognition, c.id).not.toMatch(OTHER_COLOR_WORDS);
    }
  });

  it('白底（顶色黄）：与原文逐字相同', () => {
    for (const c of OLL) expect(recognitionFor(c, topColor('white')), c.id).toBe(c.recognition);
  });

  for (const bottom of BOTTOM_COLORS) {
    const top = topColor(bottom);
    const name = COLOR_NAME_ZH[top];

    it(`${bottom} 底（顶色${name}）：57 条非空、互异；${top === 'yellow' ? '原文' : '不再含「黄」'}`, () => {
      const texts = OLL.map((c) => recognitionFor(c, top)!);
      for (const [i, t] of texts.entries()) {
        expect(t, OLL[i].id).toBeTruthy();
        if (top !== 'yellow') expect(t, OLL[i].id).not.toContain('黄');
        expect(t, OLL[i].id).toContain(name);
      }
      expect(new Set(texts).size).toBe(57);
    });

    it(`${bottom} 底：黄棱、黄角、侧面黄色三处都换成「${name}」`, () => {
      for (const c of OLL) {
        const t = recognitionFor(c, top)!;
        expect(t, c.id).toContain(`${name}棱：`);
        expect(t, c.id).toContain(`；${name}角：`);
        expect(t, c.id).toContain(`侧面${name}色：`);
      }
    });

    it(`${bottom} 底：除了颜色字，其余文字一字不差`, () => {
      for (const c of OLL) {
        expect(recognitionFor(c, top)!.replaceAll(name, '黄'), c.id).toBe(c.recognition);
      }
    });
  }

  it('只换颜色字：长度不变（一个字换一个字），数据里的原文没有被改', () => {
    for (const c of OLL) {
      const before = c.recognition!;
      for (const b of BOTTOM_COLORS) expect(recognitionFor(c, topColor(b))!.length, c.id).toBe(before.length);
      expect(c.recognition).toBe(before);
    }
  });

  it('PLL、CMLL、F2L、LSE 等其他组：任何底色下都原样不动', () => {
    const others = ALL_CASES.filter((c) => c.set !== 'oll');
    expect(others.length).toBeGreaterThan(0);
    for (const c of others) {
      for (const b of BOTTOM_COLORS) expect(recognitionFor(c, topColor(b)), `${c.id} ${b}`).toBe(c.recognition);
    }
  });

  it('没有识别文字：返回 undefined，不抛', () => {
    const none = ALL_CASES.find((c) => c.recognition === undefined)!;
    expect(none).toBeDefined();
    for (const b of BOTTOM_COLORS) expect(recognitionFor(none, topColor(b))).toBeUndefined();
    expect(recognitionFor({ set: 'oll', recognition: undefined }, 'white')).toBeUndefined();
  });

  it('典型例子：OLL 5 在红底（顶色橙）', () => {
    const c = OLL.find((x) => x.id === 'oll-5')!;
    expect(c.recognition).toContain('黄棱：');
    expect(recognitionFor(c, topColor('red'))).toBe(c.recognition!.replaceAll('黄', '橙'));
  });
});
