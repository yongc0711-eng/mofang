import { parseAlg } from './alg';
import { applyMove, applyMoves, invertMoves, solved, type Move, type State } from './cube';

/** 1x 速度下，转 90° 的时长（毫秒） */
export const QUARTER_MS = 625;
/** 转 180° 不用两倍时间，否则手感拖沓 */
const DOUBLE_MS = Math.round(QUARTER_MS * 1.5); // 取整：进度条只能取整数，否则拖不到终点

const durationOf = (m: Move) => (m.amount === 2 ? DOUBLE_MS : QUARTER_MS);

export interface Frame {
  /** 这一帧的基础状态（当前这步转之前） */
  state: State;
  /** 正在转的那一步；停在步与步之间时为 null */
  move: Move | null;
  /** 当前这步的进度 0–1，未加缓动 */
  fraction: number;
  /** 当前或刚结束的是第几步，用于高亮公式；在开头时为 -1 */
  moveIndex: number;
}

/**
 * 播放时间线：纯逻辑，不碰渲染。
 * 任意时刻的画面都由时间戳直接算出，所以拖动进度条和倒放都不会累积误差。
 */
export class Timeline {
  readonly moves: Move[];
  /** states[i] 是第 i 步转之前的状态；显式 setup 可让终点停在分步目标。 */
  readonly states: State[];
  /** starts[i] 是第 i 步开始的时间，starts[moves.length] 是总时长 */
  readonly starts: number[];

  constructor(alg: string, setup?: string) {
    this.moves = parseAlg(alg);
    this.states = [applyMoves(solved(), setup !== undefined ? parseAlg(setup) : invertMoves(this.moves))];
    this.starts = [0];
    this.moves.forEach((m, i) => {
      this.states.push(applyMove(this.states[i], m));
      this.starts.push(this.starts[i] + durationOf(m));
    });
  }

  get duration(): number {
    return this.starts[this.moves.length];
  }

  frameAt(t: number): Frame {
    const n = this.moves.length;
    if (t <= 0 || n === 0) return { state: this.states[0], move: null, fraction: 0, moveIndex: -1 };
    if (t >= this.duration) return { state: this.states[n], move: null, fraction: 0, moveIndex: n - 1 };
    let i = 0;
    while (t >= this.starts[i + 1]) i++;
    // 正好停在步与步之间：显示已完成的状态，高亮刚做完的那一步
    if (t === this.starts[i]) return { state: this.states[i], move: null, fraction: 0, moveIndex: i - 1 };
    return { state: this.states[i], move: this.moves[i], fraction: (t - this.starts[i]) / durationOf(this.moves[i]), moveIndex: i };
  }

  /** t 之后最近的步边界，已在终点时返回总时长 */
  nextBoundary(t: number): number {
    return this.starts.find((s) => s > t) ?? this.duration;
  }

  /** t 之前最近的步边界，已在开头时返回 0 */
  prevBoundary(t: number): number {
    return [...this.starts].reverse().find((s) => s < t) ?? 0;
  }
}

/** 转动缓动：起步和收尾稍慢，中间快 */
export function easeMove(x: number): number {
  return x < 0.5 ? 4 * x * x * x : 1 - (-2 * x + 2) ** 3 / 2;
}
