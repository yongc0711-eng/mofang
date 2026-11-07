import { frontColor, topColor, type BottomColor } from '../store/devicePrefs';
import { COLOR_NAME_ZH } from './recognition';

/**
 * 练习页 setup 的朝向说明，跟着底面颜色走。
 * 起手：底色的中心朝上、前面颜色的中心朝前；做完绕前后轴原地转 180°，顶色朝上、底色朝下，前面颜色仍在前。
 * 前面颜色和顶色都由 T28 的映射推出（frontColor、topColor），这里不另写表。
 *
 * 白色底时必须和 T25 的原文逐字相同：
 * 「白色中心朝上、绿色中心朝前起手；做完把魔方绕前后轴原地转 180°：黄顶朝上、白底朝下，绿色仍在前（不是前倾 90°）。」
 */
export function setupText(bottom: BottomColor): string {
  const b = COLOR_NAME_ZH[bottom];
  const f = COLOR_NAME_ZH[frontColor(bottom)];
  const t = COLOR_NAME_ZH[topColor(bottom)];
  return `${b}色中心朝上、${f}色中心朝前起手；做完把魔方绕前后轴原地转 180°：${t}顶朝上、${b}底朝下，${f}色仍在前（不是前倾 90°）。`;
}
