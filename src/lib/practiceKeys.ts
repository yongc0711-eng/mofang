import type { SessionPhase } from './practiceSession';

/** Physical key ownership survives a phase change; arming does not. */
export interface SpaceHold { phase: SessionPhase; armed: boolean }
interface Context {
  phase: SessionPhase;
  blocked: boolean;
  pointerHeld: boolean;
  enabled: boolean;
  repeat?: boolean;
}
interface Decision { hold: SpaceHold | null; handled: boolean; advance: boolean }
export function spaceDown(hold: SpaceHold | null, context: Context): Decision {
  if (context.blocked || context.pointerHeld || !context.enabled) return { hold, handled: false, advance: false };
  if (context.repeat || hold) return { hold, handled: true, advance: false };
  return {
    hold: { phase: context.phase, armed: context.phase !== 'running' },
    handled: true,
    advance: context.phase === 'running',
  };
}
export function spaceUp(hold: SpaceHold | null, context: Context): Decision {
  return {
    hold: null,
    handled: !!hold && !context.blocked,
    advance: !!hold?.armed && hold.phase === context.phase && !context.blocked && !context.pointerHeld && context.enabled,
  };
}
/** Clear the armed action but keep ownership until physical keyup, blocking cross-input starts. */
export const invalidateSpace = (hold: SpaceHold | null): SpaceHold | null => hold && { ...hold, armed: false };

/** Share the actual cancellation event wiring with tests; never changes timer/session state. */
export function watchPressCancellation(
  windowTarget: Pick<EventTarget, 'addEventListener' | 'removeEventListener'>,
  documentTarget: Pick<EventTarget, 'addEventListener' | 'removeEventListener'>,
  clear: () => void,
  hidden: () => boolean,
): () => void {
  const onVisibility = () => { if (hidden()) clear(); };
  windowTarget.addEventListener('blur', clear);
  windowTarget.addEventListener('pagehide', clear);
  documentTarget.addEventListener('visibilitychange', onVisibility);
  return () => {
    windowTarget.removeEventListener('blur', clear);
    windowTarget.removeEventListener('pagehide', clear);
    documentTarget.removeEventListener('visibilitychange', onVisibility);
  };
}
