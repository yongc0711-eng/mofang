import { describe, expect, it } from 'vitest';
import { invalidateSpace, spaceDown, spaceUp, type SpaceHold } from './practiceKeys';
import { elapsedOf, resumeTimer, startTimer, stopTimer, type SessionPhase, type Timer } from './practiceSession';
const context = (phase: SessionPhase) => ({ phase, blocked: false, pointerHeld: false, enabled: true });

describe('T40 Space uses release to start/resume/advance', () => {
  for (const phase of ['ready', 'paused', 'done'] as const) {
    it(`${phase}: down arms; up in same phase advances exactly once`, () => {
      const down = spaceDown(null, context(phase));
      expect(down).toEqual({ hold: { phase, armed: true }, handled: true, advance: false });
      const up = spaceUp(down.hold, context(phase));
      expect(up).toEqual({ hold: null, handled: true, advance: true });
      expect(spaceUp(up.hold, context(phase)).advance).toBe(false);
    });
  }
  it('ready: holding for a second leaves elapsed at zero; release is the timer origin', () => {
    let timer: Timer = { phase: 'ready', elapsedMs: 0, runningSince: null };
    const down = spaceDown(null, context('ready'));
    if (down.advance) timer = startTimer(timer, 1000);
    expect(elapsedOf(timer, 2000)).toBe(0);
    if (spaceUp(down.hold, context(timer.phase)).advance) timer = startTimer(timer, 2000);
    expect(elapsedOf(timer, 2000)).toBe(0);
    expect(elapsedOf(timer, 2250)).toBe(250);
  });
  it('paused: holding does not add time, release resumes with the accumulated time', () => {
    let timer: Timer = { phase: 'paused', elapsedMs: 500, runningSince: null };
    const down = spaceDown(null, context(timer.phase));
    expect(down.advance).toBe(false);
    expect(elapsedOf(timer, 2000)).toBe(500);
    if (spaceUp(down.hold, context(timer.phase)).advance) timer = resumeTimer(timer, 2000);
    expect(elapsedOf(timer, 2250)).toBe(750);
  });
  it('running: down stops immediately; release cannot advance from done', () => {
    let timer: Timer = { phase: 'running', elapsedMs: 0, runningSince: 1000 };
    const down = spaceDown(null, context(timer.phase));
    expect(down.hold?.armed).toBe(false);
    if (down.advance) timer = stopTimer(timer, 2000);
    expect(timer.phase).toBe('done');
    expect(timer.elapsedMs).toBe(1000);
    expect(spaceUp(invalidateSpace(down.hold), context('done')).advance).toBe(false);
  });
  for (const phase of ['ready', 'paused', 'done', 'running'] as const) {
    it(`${phase}: repeated keydowns never advance or re-arm`, () => {
      const down = spaceDown(null, context(phase));
      for (let i = 0; i < 20; i++) {
        expect(spaceDown(down.hold, { ...context(phase), repeat: true })).toEqual({ hold: down.hold, handled: true, advance: false });
      }
      expect(spaceDown(null, { ...context(phase), repeat: true }).hold).toBeNull();
    });
  }
  it('link/button focus is not intercepted, and a blocked release cancels an earlier arm', () => {
    expect(spaceDown(null, { ...context('ready'), blocked: true })).toEqual({ hold: null, handled: false, advance: false });
    expect(spaceUp({ phase: 'ready', armed: true }, { ...context('ready'), blocked: true })).toEqual({ hold: null, handled: false, advance: false });
  });
  it('pointer ownership blocks both keyboard start and stop', () => {
    for (const phase of ['ready', 'running', 'done', 'paused'] as const) {
      expect(spaceDown(null, { ...context(phase), pointerHeld: true })).toEqual({ hold: null, handled: false, advance: false });
      expect(spaceUp({ phase, armed: true }, { ...context(phase), pointerHeld: true }).advance).toBe(false);
    }
  });
  it('phase changes disarm even if the phase returns before release, retaining mutual-exclusion ownership', () => {
    const held = spaceDown(null, context('ready')).hold;
    const cancelled = invalidateSpace(held);
    expect(cancelled).toEqual({ phase: 'ready', armed: false });
    expect(spaceUp(cancelled, context('ready')).advance).toBe(false);
    expect(spaceUp(held, context('done')).advance).toBe(false);
  });
  it('blur/pagehide/hidden cancellation leaves no release action; hidden or preparing cannot arm', () => {
    const cancelled: SpaceHold | null = null;
    expect(spaceUp(cancelled, context('ready')).advance).toBe(false);
    expect(spaceDown(null, { ...context('ready'), enabled: false }).hold).toBeNull();
    expect(spaceUp({ phase: 'ready', armed: true }, { ...context('ready'), enabled: false }).advance).toBe(false);
  });
});

import { watchPressCancellation } from './practiceKeys';
for (const event of ['blur', 'pagehide', 'visibilitychange'] as const) {
  it(`actual ${event} listener cancels an arm so the later keyup cannot start`, () => {
    const win = new EventTarget(); const doc = new EventTarget();
    let hold = spaceDown(null, context('ready')).hold;
    const detach = watchPressCancellation(win, doc, () => { hold = null; }, () => true);
    (event === 'visibilitychange' ? doc : win).dispatchEvent(new Event(event));
    expect(hold).toBeNull();
    expect(spaceUp(hold, context('ready')).advance).toBe(false);
    detach();
  });
}
it('visible visibilitychange keeps the hold, and unmount removes all cancellation listeners', () => {
  const win = new EventTarget(); const doc = new EventTarget();
  let hold = spaceDown(null, context('ready')).hold;
  const detach = watchPressCancellation(win, doc, () => { hold = null; }, () => false);
  doc.dispatchEvent(new Event('visibilitychange'));
  expect(hold?.armed).toBe(true);
  detach();
  win.dispatchEvent(new Event('blur'));
  win.dispatchEvent(new Event('pagehide'));
  expect(spaceUp(hold, context('ready')).advance).toBe(true);
});
