import { parseAlg } from './alg';
import { STICKERS, applyMoves, solved, type Face, type Move } from './cube';

/** 魔方底面（第一层）的颜色。决定图解和 3D 用哪套配色，见 displayFace */
export type BottomColor = 'white' | 'yellow' | 'red' | 'orange' | 'green' | 'blue';
export const BOTTOM_COLORS: readonly BottomColor[] = ['white', 'yellow', 'red', 'orange', 'green', 'blue'];

/** 引擎里六个面的标准颜色：U 黄、D 白、F 绿、B 蓝、R 橙、L 红 */
export const FACE_COLOR: Record<Face, BottomColor> = { U: 'yellow', D: 'white', F: 'green', B: 'blue', R: 'orange', L: 'red' };

/**
 * 把所选颜色转到底面所用的整体转体（引擎里的 x/y/z）。结果：
 *   白 D 白 U 黄 F 绿 R 橙｜黄 D 黄 U 白 F 绿 R 红｜红 D 红 U 橙 F 绿 R 白
 *   橙 D 橙 U 红 F 绿 R 黄｜绿 D 绿 U 蓝 F 黄 R 橙｜蓝 D 蓝 U 绿 F 白 R 橙
 * 在引擎里 x 是 F→U→B→D→F，所以蓝底是 x、绿底是 x'（按上面的表，已用引擎核对）。
 */
export const BOTTOM_ROTATION: Record<BottomColor, Move[]> = {
  white: [],
  yellow: parseAlg('z2'),
  red: parseAlg("z'"),
  orange: parseAlg('z'),
  green: parseAlg("x'"),
  blue: parseAlg('x'),
};

/** 每个面的中心贴纸编号 */
const CENTER: Record<Face, number> = Object.fromEntries(
  STICKERS.filter((s) => s.p.filter((v) => v !== 0).length === 1).map((s) => [s.face, s.id]),
) as Record<Face, number>;

/**
 * 每种底色下，“原本属于面 f 的贴纸”该用哪个面的颜色画。
 * 用引擎把还原的魔方整体转一下，读每个面中心现在是哪个面的贴纸：
 * 底面中心是所选颜色，其余中心跟着转。贴纸在块上的位置不变，只是换了一套配色，
 * 所以末层仍然在顶面，公式字母和转动动画都不变。
 */
const FACE_MAP: Record<BottomColor, Record<Face, Face>> = Object.fromEntries(
  BOTTOM_COLORS.map((color) => {
    const turned = applyMoves(solved(), BOTTOM_ROTATION[color]);
    const map = Object.fromEntries((Object.keys(CENTER) as Face[]).map((f) => [f, STICKERS[turned[CENTER[f]]].face]));
    return [color, map];
  }),
) as Record<BottomColor, Record<Face, Face>>;

/**
 * 编号为 id 的贴纸，在所选底色下该用哪个面的颜色画。2D 图解和 3D 播放器共用这一个函数。
 * 底色是白色时就是它原本的面，和以前完全一样。
 */
export const displayFace = (id: number, color: BottomColor): Face => FACE_MAP[color][STICKERS[id].face];

/**
 * 顶色：原本属于 U 面的贴纸（标准配色下是黄色，OLL 里“黄”指的就是它）在所选底色下显示成什么颜色。
 * 由 displayFace 推出来，不另写一张表：白→黄、黄→白、红→橙、橙→红、绿→蓝、蓝→绿，即底色的对色。
 */
const U_STICKER = STICKERS.find((s) => s.face === 'U')!.id;
export const topColor = (bottom: BottomColor): BottomColor => FACE_COLOR[displayFace(U_STICKER, bottom)];

/**
 * 前色：原本属于 F 面的贴纸在所选底色下显示成什么颜色，同样由 displayFace 推。
 * 白、黄、红、橙底都是绿，绿底是黄，蓝底是白。
 */
const F_STICKER = STICKERS.find((s) => s.face === 'F')!.id;
export const frontColor = (bottom: BottomColor): BottomColor => FACE_COLOR[displayFace(F_STICKER, bottom)];


export type Palette = Readonly<Record<Face, Face>>;
export const PAIRS = {
  'white-yellow': ['white', 'yellow'], 'red-orange': ['red', 'orange'], 'green-blue': ['green', 'blue'],
} as const;
export type BridgePair = keyof typeof PAIRS;
export interface RouxColors { bottomColor: BottomColor; bridgePair: BridgePair; leftColor: BottomColor }
export const defaultLeft = (pair: BridgePair): BottomColor => ({ 'white-yellow': 'white', 'red-orange': 'red', 'green-blue': 'blue' } as const)[pair];
export const validPairs = (bottom: BottomColor): BridgePair[] => (Object.keys(PAIRS) as BridgePair[]).filter(p => !(PAIRS[p] as readonly string[]).includes(bottom));
export const paletteFace = (id: number, palette: Palette): Face => palette[STICKERS[id].face];
export function bottomPalette(bottom: BottomColor): Palette { return FACE_MAP[bottom]; }
export function legacyRoux(bottom: BottomColor): RouxColors {
  const palette = bottomPalette(bottom);
  const leftColor = FACE_COLOR[palette.L];
  const bridgePair = (Object.keys(PAIRS) as BridgePair[]).find(p => (PAIRS[p] as readonly string[]).includes(leftColor))!;
  return { bottomColor: bottom, bridgePair, leftColor };
}
export function rouxPalette(colors: RouxColors): Palette {
  const { bottomColor, bridgePair, leftColor } = colors;
  if (!BOTTOM_COLORS.includes(bottomColor) || !validPairs(bottomColor).includes(bridgePair) ||
      !(PAIRS[bridgePair] as readonly string[]).includes(leftColor)) throw new Error('非法底色/桥色方向');
  const candidates = ['', 'y', 'y2', "y'"].map(y => {
    const state = applyMoves(solved(), [...BOTTOM_ROTATION[bottomColor], ...parseAlg(y)]);
    return Object.fromEntries((Object.keys(CENTER) as Face[]).map(f => [f, STICKERS[state[CENTER[f]]].face])) as Record<Face, Face>;
  }).filter(p => FACE_COLOR[p.D] === bottomColor && FACE_COLOR[p.L] === leftColor &&
    (PAIRS[bridgePair] as readonly string[]).includes(FACE_COLOR[p.R]) && new Set(Object.values(p)).size === 6);
  if (candidates.length !== 1) throw new Error('无法确定合法旋转配色');
  return Object.freeze(candidates[0]);
}
export function withRouxBottom(colors: RouxColors, bottomColor: BottomColor): RouxColors {
  rouxPalette(colors);
  if (!BOTTOM_COLORS.includes(bottomColor)) throw new Error('非法底色');
  if (validPairs(bottomColor).includes(colors.bridgePair)) return { ...colors, bottomColor };
  const bridgePair = legacyRoux(bottomColor).bridgePair;
  return { bottomColor, bridgePair, leftColor: defaultLeft(bridgePair) };
}
export function swapRoux(colors: RouxColors): RouxColors {
  rouxPalette(colors);
  return { ...colors, leftColor: PAIRS[colors.bridgePair].find(c => c !== colors.leftColor)! };
}
export interface BrowseColors { cfop: { bottomColor: BottomColor }; roux: RouxColors }
const colorOr = (value: unknown, fallback: BottomColor): BottomColor => BOTTOM_COLORS.includes(value as BottomColor) ? value as BottomColor : fallback;
const object = (v: unknown): Record<string, unknown> => v && typeof v === 'object' && !Array.isArray(v) ? v as Record<string, unknown> : {};
export function cleanBrowse(value: unknown, legacy: BottomColor): BrowseColors {
  const raw = object(value), cfop = object(raw.cfop), roux = object(raw.roux);
  const bottomColor = colorOr(roux.bottomColor, legacy);
  const old = legacyRoux(bottomColor);
  const bridgePair = validPairs(bottomColor).includes(roux.bridgePair as BridgePair) ? roux.bridgePair as BridgePair : old.bridgePair;
  const leftColor = (PAIRS[bridgePair] as readonly unknown[]).includes(roux.leftColor) ? roux.leftColor as BottomColor :
    !('roux' in raw) ? old.leftColor : defaultLeft(bridgePair);
  return { cfop: { bottomColor: colorOr(cfop.bottomColor, legacy) }, roux: { bottomColor, bridgePair, leftColor } };
}
export function isRouxSet(setId: string): boolean {
  return setId === 'cmll' || setId === 'lse' || setId === 'sbls';
}
export function browsePalette(c: { set: string }, prefs: Partial<BrowseColors> & { bottomColor: BottomColor }): Palette {
  const colors = cleanBrowse(prefs, prefs.bottomColor);
  return isRouxSet(c.set) ? rouxPalette(colors.roux) : bottomPalette(colors.cfop.bottomColor);
}
/** Physical white-up, green-front sandbox frame, independent of browsing/legacy prefs. */
export const SANDBOX_PALETTE: Palette = Object.freeze({ U: 'D', D: 'U', F: 'F', B: 'B', R: 'L', L: 'R' });
