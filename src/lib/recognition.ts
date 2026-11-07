import { type AlgCase } from '../types';
import { type BottomColor } from '../store/devicePrefs';

/** 颜色的中文名，和「我的」页的底面颜色一致 */
export const COLOR_NAME_ZH: Record<BottomColor, string> = {
  white: '白',
  yellow: '黄',
  red: '红',
  orange: '橙',
  green: '绿',
  blue: '蓝',
};

/**
 * 公式页显示的识别文字。
 *
 * OLL 的识别文字是按标准配色写的：「黄棱」「黄角」「侧面黄色」里的「黄」指的是顶面（U 面）那种颜色。
 * 选了别的底色后顶色变了（见 topColor），文字要跟着换成顶色的名字，否则和图解、手里的魔方对不上。
 * 数据文件里的字符串不改，只在显示层替换。
 *
 * - 只对 OLL 生效；PLL、CMLL 等原样返回
 * - 顶色是黄（白底）时就是原文，逐字不变
 * - OLL 的识别文字里「黄」只有这一个意思（目前没有别的颜色词，测试里锁住了），所以直接替换
 */
export function recognitionFor(c: Pick<AlgCase, 'set' | 'recognition'>, top: BottomColor): string | undefined {
  if (c.set !== 'oll' || c.recognition === undefined) return c.recognition;
  return c.recognition.replaceAll('黄', COLOR_NAME_ZH[top]);
}
