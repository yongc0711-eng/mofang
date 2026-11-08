import { paletteFor } from './practiceColors';
import { FACE_COLOR } from './colorScheme';
import { frontColor, topColor } from '../store/devicePrefs';
import { COLOR_NAME_ZH } from './recognition';
import type { PreparedSetup } from './practiceTarget';
export function practiceInstructions(setup: PreparedSetup): string {
  if (setup.version === 2) {
    const p = paletteFor(setup.colors);
    return '白色中心朝上、绿色中心朝前起手；做完按观察持法 ' + (setup.observation || '保持不转') +
      '，对照图解（' + COLOR_NAME_ZH[FACE_COLOR[p.U]] + '顶、' + COLOR_NAME_ZH[FACE_COLOR[p.D]] + '底、' + COLOR_NAME_ZH[FACE_COLOR[p.F]] +
      '前' + (setup.colors.method === 'roux' ? '；左' + COLOR_NAME_ZH[FACE_COLOR[p.L]] + ' · 右' + COLOR_NAME_ZH[FACE_COLOR[p.R]] : '') + '；Roux 中心偏移照图保留）。';
  }
  const b = setup.bottom;
  return '白色中心朝上、绿色中心朝前起手；做完按观察持法 ' + (setup.observation || '保持不转') +
    '，对照图解（' + COLOR_NAME_ZH[topColor(b)] + '顶、' + COLOR_NAME_ZH[b] + '底、' + COLOR_NAME_ZH[frontColor(b)] +
    '前；Roux 中心偏移照图保留）。';
}
