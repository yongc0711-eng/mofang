import type { BottomColor } from '../store/devicePrefs';

export const COLOR_LABEL: Record<BottomColor, string> = { white: '白', yellow: '黄', red: '红', orange: '橙', green: '绿', blue: '蓝' };
/** 色块用公式页同一组 CSS 变量，浅色和深色模式都跟着走 */
export const COLOR_VAR: Record<BottomColor, string> = {
  white: 'var(--cube-d)',
  yellow: 'var(--cube-u)',
  red: 'var(--cube-l)',
  orange: 'var(--cube-r)',
  green: 'var(--cube-f)',
  blue: 'var(--cube-b)',
};
