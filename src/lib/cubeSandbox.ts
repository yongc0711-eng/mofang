import { parseAlg } from './alg';
import { applyMove, invertMoves, solved, type Move } from './cube';

export const MAIN_KEYS = ['R', 'U', 'F', 'L', 'D', 'B', 'x', 'y', 'z'] as const;
export const MORE_KEYS = ['r', 'l', 'u', 'd', 'f', 'b', 'M', 'E', 'S'] as const;
export type Suffix = '' | "'" | '2';
export function keyMove(key: string, suffix: Suffix): Move {
  if (![...MAIN_KEYS, ...MORE_KEYS].some(k => k === key)) throw new Error('未知试转按键');
  return parseAlg(key + suffix)[0];
}
export const moveDuration = (move: Move) => move.amount === 2 ? 240 : 160;

/** Sticker state stays in the current frame, including rotated centers; never normalize. */
export class Sandbox {
  state = solved();
  suffix: Suffix = '';
  history: Move[] = [];
  queue: { move: Move; record: boolean }[] = [];
  active: { move: Move; record: boolean; elapsed: number } | null = null;
  get pending() { return this.queue.length + (this.active ? 1 : 0); }
  get canUndo() { return !this.pending && this.history.length > 0; }
  press(key: string): boolean {
    if (this.pending >= 16) return false;
    this.queue.push({ move: keyMove(key, this.suffix), record: true });
    this.suffix = '';
    return true;
  }
  undo(): boolean {
    if (!this.canUndo) return false;
    this.queue.push({ move: invertMoves([this.history.pop()!])[0], record: false });
    return true;
  }
  reset() {
    this.state = solved(); this.queue = []; this.active = null; this.history = []; this.suffix = '';
  }
  tick(dt: number) {
    let remaining = Math.max(0, dt);
    while (this.pending) {
      this.active ??= { ...this.queue.shift()!, elapsed: 0 };
      const duration = moveDuration(this.active.move);
      const used = Math.min(remaining, duration - this.active.elapsed);
      this.active.elapsed += used; remaining -= used;
      if (this.active.elapsed < duration) break;
      this.state = applyMove(this.state, this.active.move);
      if (this.active.record) this.history.push(this.active.move);
      this.active = null;
    }
    return { state: this.state, move: this.active?.move ?? null,
      fraction: this.active ? this.active.elapsed / moveDuration(this.active.move) : 0 };
  }
}

