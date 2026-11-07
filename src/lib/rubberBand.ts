/** 页面上下拉到边界时的弹性反馈（T43）：纯函数部分，位移、阻尼、回弹、是否接管手势 */

/** 位移上限（px）：阻尼曲线的渐近线 */
export const MAX_PULL = 80;

/** 手指/滚轮的原始位移 → 页面实际位移：单调、有上限、开头接近 0.5 倍跟手 */
export function damp(raw: number, limit = MAX_PULL): number {
  const a = Math.abs(raw);
  const d = (limit * a) / (a + limit * 2);
  return raw < 0 ? -d : d;
}

/** damp 的反函数：回弹途中又按下手指时，从当前位移接着拖 */
export function undamp(d: number, limit = MAX_PULL): number {
  const a = Math.min(Math.abs(d), limit * 0.99);
  const raw = (2 * limit * a) / (limit - a);
  return d < 0 ? -raw : raw;
}

export interface SpringState {
  y: number;
  v: number;
}
const STIFFNESS = 180;
const DAMPING = 2 * Math.sqrt(STIFFNESS); // 临界阻尼：回到 0 不过冲

/** 回弹一步，dt 单位秒；dt 过大时拆成小步，保证不发散 */
export function stepSpring(s: SpringState, dt: number): SpringState {
  let { y, v } = s;
  let left = Math.min(Math.max(dt, 0), 0.1);
  while (left > 0) {
    const h = Math.min(left, 1 / 120);
    v += (-STIFFNESS * y - DAMPING * v) * h;
    y += v * h;
    left -= h;
  }
  return { y, v };
}

/** 位移和速度都足够小就当作已经停下 */
export const isSettled = (s: SpringState) => Math.abs(s.y) < 0.4 && Math.abs(s.v) < 4;

export interface EdgeInput {
  scrollY: number;
  innerHeight: number;
  scrollHeight: number;
  /** 手指或滚轮的纵向位移，向下拉（内容跟着下移）为正 */
  pull: number;
  /** 横向位移，用来判断是不是横向手势 */
  dx?: number;
}

/** 文档在顶部且向下拉、或在底部且向上拉（短页两者同时成立）时返回 true */
export function atEdgePull({ scrollY, innerHeight, scrollHeight, pull, dx = 0 }: EdgeInput): boolean {
  if (pull === 0 || Math.abs(dx) > Math.abs(pull)) return false;
  const atTop = scrollY <= 0;
  const atBottom = scrollY + innerHeight >= scrollHeight - 1;
  return (pull > 0 && atTop) || (pull < 0 && atBottom);
}

/** 这些元素里起手的手势不接管：练习的按住/松手、3D 拖拽、横向滚动的 chips、输入控件 */
export const NO_CAPTURE_SELECTOR = '.practice-pad, .player-stage, .chips, input, textarea, select';

export function canCaptureFrom(target: Element | null): boolean {
  return !target?.closest?.(NO_CAPTURE_SELECTOR);
}
