import { useSyncExternalStore } from 'react';
import { displayMask, type Mask } from '../lib/cases';
import { parseAlg } from '../lib/alg';
import { STICKERS, applyMoves, solved, type Face, type Move } from '../lib/cube';
import { type AlgCase } from '../types';

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

/**
 * 只对这台设备生效的显示设置，比如旧手机选普通面省性能。
 * 和进度分开存，不进备份，所以导入备份不会改变它。
 */
export interface DevicePrefs {
  /** 魔方表面：UV 亮面或普通面 */
  finish: 'uv' | 'matte';
  /** 3D 魔方只给相关的块上色，其余变灰 */
  focusRelevant: boolean;
  /** OLL 详情页的识别视图：top 只显示 U 面的 9 块，full 显示整个顶层的 21 块 */
  ollView: 'top' | 'full';
  /** 底面颜色，默认白色；公式页的图解和 3D 按它换配色 */
  bottomColor: BottomColor;
}

const KEY = 'mofang.device.v1';
const DEFAULTS: DevicePrefs = { finish: 'uv', focusRelevant: false, ollView: 'top', bottomColor: 'white' };

function load(): DevicePrefs {
  try {
    const parsed = JSON.parse(localStorage.getItem(KEY) ?? '{}') as Partial<DevicePrefs>;
    return {
      finish: parsed.finish === 'matte' ? 'matte' : 'uv',
      focusRelevant: parsed.focusRelevant === true,
      // 旧数据没有这一项，默认 top
      ollView: parsed.ollView === 'full' ? 'full' : 'top',
      // 旧数据没有这一项，或值不认识：白色
      bottomColor: BOTTOM_COLORS.includes(parsed.bottomColor as BottomColor) ? (parsed.bottomColor as BottomColor) : 'white',
    };
  } catch {
    return DEFAULTS;
  }
}

/** 原本属于 U 面的 9 块贴纸，按贴纸编号判断，和它转到哪里无关 */
const uFaceStickers: Mask = (id) => STICKERS[id].face === 'U';

/**
 * 公式详情页该用哪个掩码，2D 图解和 3D 播放器共用同一个。
 * - OLL：按 ollView。top 只显示 U 面的 9 块，full 是整个顶层的 21 块（就是 SET_RULES.oll.display）；和 focusRelevant 无关
 * - 其他组：开了“只看相关的块”就是该组的显示掩码，否则 null（3D 显示全部，2D 用默认图解）
 */
export function caseMask(
  c: Pick<AlgCase, 'set' | 'group'>,
  p: Pick<DevicePrefs, 'ollView' | 'focusRelevant'>,
): Mask | null {
  if (c.set === 'oll') return p.ollView === 'top' ? uFaceStickers : displayMask(c);
  return p.focusRelevant ? displayMask(c) : null;
}

let prefs: DevicePrefs = typeof localStorage === 'undefined' ? DEFAULTS : load();
const listeners = new Set<() => void>();

const subscribe = (l: () => void) => {
  listeners.add(l);
  return () => listeners.delete(l);
};

export const useDevicePrefs = () => useSyncExternalStore(subscribe, () => prefs);

/** 当前设置（不是 hook，测试和非组件代码用） */
export const getDevicePrefs = (): DevicePrefs => prefs;

export function setDevicePrefs(patch: Partial<DevicePrefs>) {
  prefs = { ...prefs, ...patch };
  try {
    localStorage.setItem(KEY, JSON.stringify(prefs));
  } catch {
    // 隐私模式等情况下写入失败：本次会话内仍可用
  }
  listeners.forEach((l) => l());
}
