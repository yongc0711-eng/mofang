import { type CSSProperties, type PointerEvent, type ReactNode, useEffect, useId, useLayoutEffect, useRef, useState } from 'react';
import { Link } from 'react-router-dom';
import { getUi, setUi } from '../lib/uiState';
import { type MethodId, type SetId } from '../types';

export interface HomeDeckItem {
  id: SetId;
  name: string;
  description: string;
  done: number;
  total: number;
  diagram: ReactNode;
}

interface DeckView { index: number; expanded: boolean }
interface Gesture { id: number; index: number; base: string; x: number; y: number; dx: number; dy: number; moved: boolean; time: number }
interface Flip { old: number; direction: number; before: Keyframe[]; token: number; keyboard: boolean; duration: number; lift: number }

const DURATION = 220;
const easing = 'cubic-bezier(.2,.7,.2,1)';
const reducedMotion = () => window.matchMedia('(prefers-reduced-motion: reduce)').matches;
const stackTransform = (depth: number) => `translateY(${-depth * 6}px) scale(${1 - depth * .03})`;
const atStackPosition = (transform: string, depth: number) => {
  const matrix = transform === 'none' ? new DOMMatrixReadOnly() : new DOMMatrixReadOnly(transform);
  const scale = 1 - depth * .03;
  return Math.abs(matrix.m11 - scale) < .0001 && Math.abs(matrix.m22 - scale) < .0001
    && Math.abs(matrix.m41) < .1 && Math.abs(matrix.m42 + depth * 6) < .1;
};

function Chevron({ up = false }: { up?: boolean }) {
  return <svg className="home-deck-toggle-icon" width="14" height="14" viewBox="0 0 16 16" aria-hidden="true" focusable="false"><path d={up ? 'm4 10 4-4 4 4' : 'm4 6 4 4 4-4'} fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" /></svg>;
}

/** 首页专用卡堆。只保存内存中的位置；实际入口仍是原来的 router Link。 */
export function HomeMethodDeck({ method, name, items }: { method: MethodId; name: string; items: HomeDeckItem[] }) {
  const key = `home-deck:${method}`;
  const count = items.length + 1;
  const [view, setView] = useState<DeckView>(() => {
    const saved = getUi<DeckView>(key, { index: 0, expanded: false });
    return { index: Math.max(0, Math.min(items.length, saved.index)), expanded: saved.expanded };
  });
  const current = useRef(view);
  const [motion, setMotion] = useState<'idle' | 'flip' | 'layout'>('idle');
  const [announcement, setAnnouncement] = useState<string | null>(null);
  const busy = useRef(false); // 仅展开/收起改变布局时互斥，翻卡不锁输入。
  const pile = useRef<HTMLDivElement>(null);
  const cards = useRef<(HTMLElement | null)[]>([]);
  const close = useRef<HTMLButtonElement>(null);
  const gesture = useRef<Gesture | null>(null);
  const suppressClick = useRef(false);
  const pending = useRef<Flip | null>(null);
  const focusAfterRender = useRef<'toggle' | 'flip' | null>(null);
  const animations = useRef<Animation[]>([]);
  const rebound = useRef<Animation | null>(null);
  const dragFrame = useRef<number | null>(null);
  const generation = useRef(0);
  const fallback = useRef<ReturnType<typeof setTimeout> | undefined>(undefined);
  const pileId = useId();

  function commit(next: DeckView) {
    current.current = next;
    setUi(key, next);
    setView(next);
  }

  function focusCurrent() {
    const card = cards.current[current.current.index];
    card?.querySelector<HTMLElement>('.set-card, .home-deck-expand')?.focus({ preventScroll: true });
  }

  function finish(token: number) {
    if (generation.current !== token) return;
    clearTimeout(fallback.current);
    busy.current = false;
    animations.current = [];
    setMotion('idle');
  }

  function cancelDragFrame() {
    if (dragFrame.current !== null) cancelAnimationFrame(dragFrame.current);
    dragFrame.current = null;
  }

  /** 从屏幕上的当前帧接管，不能 cancel 后跳到旧动画的终点。 */
  function freezeMotion(): Keyframe[] {
    const before = cards.current.map(card => {
      const style = card && getComputedStyle(card);
      return { transform: style?.transform, zIndex: style?.zIndex };
    });
    generation.current += 1;
    pending.current = null;
    focusAfterRender.current = null;
    cancelDragFrame();
    animations.current.forEach(animation => animation.cancel());
    rebound.current?.cancel();
    animations.current = [];
    rebound.current = null;
    cards.current.forEach((card, index) => {
      if (!card) return;
      card.style.transform = before[index].transform as string;
      card.style.zIndex = String(20 - (index - current.current.index + count) % count);
    });
    setMotion('idle');
    return before;
  }

  function settleCard(card: HTMLElement, duration: number) {
    const from = getComputedStyle(card).transform;
    card.style.transform = stackTransform(0);
    if (!reducedMotion() && card.animate && !atStackPosition(from, 0)) {
      rebound.current = card.animate([{ transform: from }, { transform: stackTransform(0) }], { duration, easing });
      void rebound.current.finished.catch(() => {});
    }
  }

  function paintDrag(drag: Gesture) {
    const card = cards.current[drag.index];
    if (card) card.style.transform = `translateY(${drag.dy}px) ${drag.base}`;
  }

  useEffect(() => {
    const element = pile.current!;
    const onTouchMove = (event: TouchEvent) => {
      const drag = gesture.current;
      // PointerEvent 的 preventDefault 不会取消浏览器的原生触摸手势。
      // 只接管已识别的纵向翻卡，避免安卓把下一次轻点用于终止原生手势。
      if (drag && Math.abs(drag.dy) > 9 && Math.abs(drag.dy) > Math.abs(drag.dx) * 1.1 && event.cancelable) event.preventDefault();
    };
    element.addEventListener('touchmove', onTouchMove, { passive: false });
    return () => element.removeEventListener('touchmove', onTouchMove);
  }, []);

  useEffect(() => {
    const preference = window.matchMedia('(prefers-reduced-motion: reduce)');
    const onChange = () => {
      if (!preference.matches) return;
      animations.current.forEach(animation => animation.finish());
      rebound.current?.finish();
      finish(generation.current);
    };
    preference.addEventListener('change', onChange);
    return () => {
      generation.current += 1;
      clearTimeout(fallback.current);
      cancelDragFrame();
      animations.current.forEach(animation => animation.cancel());
      rebound.current?.cancel();
      preference.removeEventListener('change', onChange);
    };
  }, []);

  useLayoutEffect(() => {
    if (focusAfterRender.current && (view.expanded || motion === 'idle')) {
      const request = focusAfterRender.current;
      focusAfterRender.current = null;
      if (request === 'flip') focusCurrent();
      else if (view.expanded) close.current?.focus({ preventScroll: true });
      else cards.current[view.index]?.querySelector<HTMLButtonElement>('.home-deck-expand')?.focus({ preventScroll: true });
    }
    const flip = pending.current;
    if (!flip) return;
    pending.current = null;
    animations.current = cards.current.flatMap((card, index) => {
      if (!card) return [];
      const target: Keyframe = { transform: card.style.transform, zIndex: card.style.zIndex };
      let frames = [flip.before[index], target];
      if (flip.direction === 1 && index === flip.old) frames = [flip.before[index],
        { transform: `translateY(${flip.lift}px) scale(.97)`, zIndex: '30', offset: .49 },
        { transform: `translateY(${flip.lift}px) scale(.97)`, zIndex: '1', offset: .51 }, { ...target, zIndex: '1' }];
      if (flip.direction === -1 && index === view.index) frames = [{ ...flip.before[index], zIndex: '1' },
        { transform: 'translateY(-65px) scale(.97)', zIndex: '30', offset: .5 }, { ...target, zIndex: '30' }];
      return [card.animate(frames, { duration: flip.duration, easing })];
    });
    void Promise.all(animations.current.map(animation => animation.finished.catch(() => {}))).then(() => {
      if (generation.current !== flip.token) return;
      if (flip.keyboard) focusAfterRender.current = 'flip';
      finish(flip.token);
    });
  }, [view, motion]);

  function flip(direction: number, keyboard = false, velocity = 0) {
    if (busy.current || current.current.expanded) return;
    const before = freezeMotion();
    const old = current.current.index;
    const index = (old + direction + count) % count;
    const token = ++generation.current;
    const animate = !reducedMotion() && !!cards.current[0]?.animate;
    if (animate) {
      const transform = before[old].transform as string;
      const y = transform === 'none' ? 0 : new DOMMatrixReadOnly(transform).m42;
      const duration = keyboard || !velocity ? DURATION : Math.round(Math.max(70, Math.min(DURATION, 100 / velocity)));
      pending.current = { old, direction, token, keyboard, before, duration, lift: Math.min(-65, y) };
      setMotion('flip');
    }
    commit({ ...current.current, index });
    setAnnouncement(`${name}，${index === 0 ? '封面' : items[index - 1].name}，第 ${index + 1} 张，共 ${count} 张`);
    // reduced-motion 没有动画后的回调，焦点在下一次布局提交时恢复。
    if (keyboard && !animate) focusAfterRender.current = 'flip';
  }

  function toggle() {
    if (busy.current) return;
    freezeMotion();
    suppressClick.current = false;
    const expanded = !current.current.expanded;
    const token = ++generation.current;
    if (!reducedMotion()) {
      busy.current = true;
      setMotion('layout');
      fallback.current = setTimeout(() => finish(token), DURATION);
    }
    focusAfterRender.current = 'toggle';
    commit({ ...current.current, expanded });
    setAnnouncement(expanded ? `${name}，已展开全部 ${items.length} 个分组` : `${name}，卡片已收起`);
  }

  function pointerDown(event: PointerEvent<HTMLDivElement>) {
    if (busy.current || !event.isPrimary || (event.pointerType === 'mouse' && event.button !== 0)) return;
    suppressClick.current = false;
    if (current.current.expanded || (event.target as Element).closest('.home-deck-expand')) return;
    const before = freezeMotion();
    const index = current.current.index;
    // 手指抓住的卡保留当前帧；其余卡在背后归位，不挡住下一次操作。
    cards.current.forEach((card, cardIndex) => {
      if (!card || cardIndex === index) return;
      const depth = (cardIndex - index + count) % count;
      const target = stackTransform(depth);
      card.style.transform = target;
      if (!reducedMotion() && card.animate && !atStackPosition(before[cardIndex].transform as string, depth)) {
        const animation = card.animate([{ transform: before[cardIndex].transform }, { transform: target }], { duration: 100, easing });
        animations.current.push(animation);
        void animation.finished.catch(() => {});
      }
    });
    gesture.current = { id: event.pointerId, index, base: before[index].transform as string, x: event.clientX, y: event.clientY, dx: 0, dy: 0, moved: false, time: performance.now() };
  }

  function pointerMove(event: PointerEvent<HTMLDivElement>) {
    const drag = gesture.current;
    if (!drag || drag.id !== event.pointerId) return;
    drag.dx = event.clientX - drag.x;
    drag.dy = event.clientY - drag.y;
    if (Math.hypot(drag.dx, drag.dy) > 9) { drag.moved = true; suppressClick.current = true; }
    if (Math.abs(drag.dy) <= Math.abs(drag.dx) * 1.1 || Math.abs(drag.dy) <= 9) return;
    if (!event.currentTarget.hasPointerCapture(event.pointerId)) event.currentTarget.setPointerCapture(event.pointerId);
    if (dragFrame.current === null) dragFrame.current = requestAnimationFrame(() => {
      dragFrame.current = null;
      if (gesture.current === drag) paintDrag(drag);
    });
    if (event.cancelable) event.preventDefault();
  }

  function release(event: PointerEvent<HTMLDivElement>, cancelled = false) {
    const drag = gesture.current;
    if (!drag || drag.id !== event.pointerId) return;
    gesture.current = null;
    cancelDragFrame();
    if (event.currentTarget.hasPointerCapture(event.pointerId)) event.currentTarget.releasePointerCapture(event.pointerId);
    if (!drag.moved) {
      const card = cards.current[drag.index];
      if (card) settleCard(card, 100);
      return;
    }
    suppressClick.current = true;
    const velocity = Math.abs(drag.dy) / Math.max(1, performance.now() - drag.time);
    const enough = Math.abs(drag.dy) > 38 || (Math.abs(drag.dy) > 22 && velocity > .45);
    paintDrag(drag); // pointerup 可能早于下一帧，保留最后一个输入位置。
    if (!cancelled && enough && Math.abs(drag.dy) > Math.abs(drag.dx) * 1.15) { flip(drag.dy < 0 ? 1 : -1, false, velocity); return; }
    const card = cards.current[drag.index];
    if (!card) return;
    settleCard(card, 150);
  }

  function footer() {
    return <div className="home-deck-footer" hidden={view.expanded}>
      <span className="home-deck-position" role="img" aria-label={`第 ${view.index + 1} 张，共 ${count} 张，循环翻阅`}>
        <span className="home-deck-dots" aria-hidden="true">{Array.from({ length: count }, (_, index) => <span key={index} className={index === view.index ? 'home-deck-dot current' : 'home-deck-dot'} />)}</span>
        <span aria-hidden="true">{view.index + 1} / {count}</span>
      </span>
      <button className="home-deck-expand" type="button" aria-label={`${name}，展开全部分组`} aria-controls={pileId} aria-expanded={view.expanded} disabled={motion === 'layout'} onClick={toggle}>展开全部<Chevron /></button>
    </div>;
  }

  return <section className="home-method-deck" aria-label={`${name}卡堆`} data-method={method} data-index={view.index} data-expanded={view.expanded} data-motion={motion} aria-busy={motion !== 'idle'} onKeyDown={event => {
    if (view.expanded || !['ArrowUp', 'ArrowDown'].includes(event.key)) return;
    event.preventDefault();
    if (!event.repeat) flip(event.key === 'ArrowUp' ? 1 : -1, true);
  }}>
    <div className="home-deck-header" aria-hidden={!view.expanded} inert={!view.expanded}>
      <h3>{name}</h3>
      <button ref={close} type="button" className="home-deck-close" aria-label={`${name}，收起卡片`} aria-controls={pileId} aria-expanded={view.expanded} onClick={toggle}>收起卡片<Chevron up /></button>
    </div>
    <div ref={pile} className="home-deck-pile" id={pileId} style={{ '--home-deck-items': items.length } as CSSProperties} onPointerDown={pointerDown} onPointerMove={pointerMove} onPointerUp={event => release(event)} onPointerCancel={event => release(event, true)} onLostPointerCapture={event => {
      // 触屏的隐式 capture 从子链接转到 pile 时也会冒泡 lost，不能中断新手势。
      if (event.target !== event.currentTarget || event.currentTarget.hasPointerCapture(event.pointerId) || !gesture.current) return;
      gesture.current = null; suppressClick.current = true;
      cancelDragFrame();
      const card = cards.current[current.current.index];
      if (card) settleCard(card, 100);
    }} onClickCapture={event => {
      if (!busy.current && (!suppressClick.current || event.detail === 0)) return;
      event.preventDefault(); event.stopPropagation(); suppressClick.current = false;
    }}>
      {[null, ...items].map((item, index) => {
        const depth = (index - view.index + count) % count;
        const available = view.expanded || depth === 0;
        const transform = view.expanded ? `translateY(calc(${index - 1} * (var(--home-deck-expanded-height) + 8px)))` : stackTransform(depth);
        return <article key={item?.id ?? 'cover'} ref={node => { cards.current[index] = node; }} className={`home-deck-card${item ? '' : ' home-deck-cover'}`} data-cover={!item || undefined} data-set={item?.id} data-depth={view.expanded ? 0 : depth} aria-hidden={!available} inert={!available} hidden={!item && view.expanded} style={{ transform, zIndex: view.expanded ? 1 : 20 - depth }}>
          {item ? <Link to={`/set/${item.id}`} className="set-card">
            <div className="set-body">
              <div className="set-title"><strong>{item.name}</strong><span className="muted small">{item.description}</span></div>
              <span className="muted small">已掌握 {item.done} / {item.total}</span>
              <div className="progress" aria-hidden="true"><div style={{ width: `${item.total ? item.done / item.total * 100 : 0}%` }} /></div>
            </div>
            {item.diagram}
          </Link> : <div className="home-deck-cover-body">
            <div className="home-deck-cover-title"><h3>{name}</h3><span>{items.length} 组 · {items.reduce((sum, entry) => sum + entry.total, 0)} 个情形</span></div>
            <p>{items.map(entry => entry.name).join(' · ')}</p>
          </div>}
          {footer()}
        </article>;
      })}
    </div>
    <span className="home-deck-status" role="status" aria-live="polite">{announcement}</span>
  </section>;
}
