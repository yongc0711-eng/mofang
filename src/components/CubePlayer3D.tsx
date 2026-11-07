import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { Timeline, easeMove } from '../lib/timeline';
import type { CubeFinish, CubeScene } from './CubeScene';

const SPEEDS = [0.5, 1, 1.5, 2];
const SPEED_KEY = 'mofang.player.speed';

function loadSpeed(): number {
  try {
    const v = Number(localStorage.getItem(SPEED_KEY));
    return SPEEDS.includes(v) ? v : 1;
  } catch {
    return 1;
  }
}

interface Props {
  alg: string;
  /** 每次变化都从头播放一遍，用于重复点击同一条公式 */
  replayKey?: number;
  /** 哪些贴纸显示颜色，不传显示全部 */
  mask?: ((id: number) => boolean) | null;
  /** 表面，默认 UV 亮面 */
  finish?: CubeFinish;
}

/**
 * 自己画的 3D 播放器：Three.js 只负责渲染（动态加载），播放逻辑全在 Timeline 里。
 * 配色和 2D 图解共用 CSS 变量。
 */
export function CubePlayer3D({ alg, replayKey = 0, mask = null, finish = 'uv' }: Props) {
  const host = useRef<HTMLDivElement>(null);
  const scrubber = useRef<HTMLInputElement>(null);
  const scene = useRef<CubeScene | null>(null);
  const timeline = useMemo(() => new Timeline(alg), [alg]);
  const tlRef = useRef(timeline);
  tlRef.current = timeline;

  const time = useRef(0);
  const target = useRef<number | null>(null);
  const raf = useRef(0);
  const [speed, setSpeed] = useState(loadSpeed);
  const speedRef = useRef(speed);
  speedRef.current = speed;
  const [ready, setReady] = useState(false);
  const [error, setError] = useState(false);
  const [playing, setPlaying] = useState(false);
  const [moveIndex, setMoveIndex] = useState(-1);
  const [position, setPosition] = useState<'start' | 'middle' | 'end'>('start');

  const draw = useCallback(() => {
    const tl = tlRef.current;
    const t = time.current;
    const f = tl.frameAt(t);
    scene.current?.render(f.state, f.move, easeMove(f.fraction));
    setMoveIndex(f.moveIndex);
    setPosition(t <= 0 ? 'start' : t >= tl.duration ? 'end' : 'middle');
    const input = scrubber.current;
    if (input) {
      input.max = String(tl.duration);
      input.value = String(t);
      input.style.setProperty('--progress', `${tl.duration ? (t / tl.duration) * 100 : 0}%`);
    }
  }, []);

  const stop = useCallback(() => {
    cancelAnimationFrame(raf.current);
    target.current = null;
    setPlaying(false);
  }, []);

  /** 朝目标时间播放，到了就停 */
  const runTo = useCallback(
    (to: number) => {
      const wasRunning = target.current !== null;
      target.current = to;
      setPlaying(true);
      if (wasRunning) return;
      let last = performance.now();
      const tick = (now: number) => {
        // 切到后台再回来时，不要一下跳过一大段
        const dt = Math.min(now - last, 100) * speedRef.current;
        last = now;
        const goal = target.current;
        if (goal === null) return;
        const t = time.current;
        const next = goal > t ? Math.min(goal, t + dt) : Math.max(goal, t - dt);
        time.current = next;
        draw();
        if (next === goal) stop();
        else raf.current = requestAnimationFrame(tick);
      };
      raf.current = requestAnimationFrame(tick);
    },
    [draw, stop],
  );

  const seek = useCallback(
    (t: number) => {
      stop();
      time.current = t;
      draw();
    },
    [draw, stop],
  );

  const togglePlay = () => {
    const tl = tlRef.current;
    if (target.current !== null) {
      stop();
      return;
    }
    if (time.current >= tl.duration) time.current = 0;
    runTo(tl.duration);
  };

  /** 转动中再点一次，就在当前目标的基础上多走一步，点几次走几步 */
  const step = (direction: 1 | -1) => {
    const tl = tlRef.current;
    const from = target.current ?? time.current;
    runTo(direction === 1 ? tl.nextBoundary(from) : tl.prevBoundary(from));
  };

  useEffect(() => {
    let cancelled = false;
    let created: CubeScene | null = null;
    import('./CubeScene')
      .then(({ CubeScene: Scene }) => {
        if (cancelled || !host.current) return;
        created = new Scene(host.current, finishRef.current);
        created.setMask(maskRef.current);
        scene.current = created;
        setReady(true);
        draw();
      })
      .catch(() => {
        if (!cancelled) setError(true);
      });
    return () => {
      cancelled = true;
      cancelAnimationFrame(raf.current);
      target.current = null;
      created?.dispose();
      scene.current = null;
    };
    // 场景只创建一次
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const maskRef = useRef(mask);
  maskRef.current = mask;
  useEffect(() => {
    scene.current?.setMask(mask);
  }, [mask]);

  const finishRef = useRef(finish);
  finishRef.current = finish;
  useEffect(() => {
    scene.current?.setFinish(finish);
  }, [finish]);

  // 切换公式或重复点击时，从头播放
  const played = useRef({ timeline, replayKey });
  useEffect(() => {
    // 和上次相同就不播：首次进入不自动播放，开发模式下 effect 重跑也不会误触发
    if (played.current.timeline === timeline && played.current.replayKey === replayKey) return;
    played.current = { timeline, replayKey };
    seek(0);
    runTo(tlRef.current.duration);
  }, [timeline, replayKey, seek, runTo]);

  const changeSpeed = (v: number) => {
    setSpeed(v);
    try {
      localStorage.setItem(SPEED_KEY, String(v));
    } catch {
      // 记不住速度不影响播放
    }
  };

  const atStart = position === 'start';
  const atEnd = position === 'end';
  const tokens = useMemo(
    () => timeline.moves.map((m) => m.base + (m.amount === 1 ? '' : m.amount === 2 ? '2' : "'")),
    [timeline],
  );

  if (error) return <div className="player player-error">这台设备无法显示 3D 魔方</div>;

  return (
    <div className="player">
      <div className="player-stage" ref={host}>
        <div className="player-loading">
          <span className="spinner" aria-hidden="true" />
          正在加载 3D 魔方…
        </div>
      </div>

      <ol className="move-track" aria-label="公式步骤">
        {tokens.map((m, i) => (
          <li key={`${i}-${m}`} className={i === moveIndex ? 'move-now' : i < moveIndex ? 'move-done' : ''}>
            {m}
          </li>
        ))}
      </ol>

      <input
        ref={scrubber}
        className="player-scrubber"
        type="range"
        min={0}
        max={timeline.duration}
        step={1}
        defaultValue={0}
        disabled={!ready}
        aria-label="播放进度"
        onChange={(e) => seek(Number(e.target.value))}
      />

      <div className="player-controls">
        <button className="ctl" disabled={!ready || atStart} onClick={() => seek(0)} aria-label="回到开头">
          <svg viewBox="0 0 24 24" aria-hidden="true"><path d="M6 5v14M19 5l-9 7 9 7z" /></svg>
        </button>
        <button className="ctl" disabled={!ready || atStart} onClick={() => step(-1)} aria-label="上一步">
          <svg viewBox="0 0 24 24" aria-hidden="true"><path d="M15 5l-8 7 8 7" /></svg>
        </button>
        <button className="ctl ctl-main" disabled={!ready} onClick={togglePlay} aria-label={playing ? '暂停' : '播放'}>
          {playing ? (
            <svg viewBox="0 0 24 24" aria-hidden="true"><path d="M8 5v14M16 5v14" /></svg>
          ) : (
            <svg viewBox="0 0 24 24" aria-hidden="true"><path d="M8 5l11 7-11 7z" /></svg>
          )}
        </button>
        <button className="ctl" disabled={!ready || atEnd} onClick={() => step(1)} aria-label="下一步">
          <svg viewBox="0 0 24 24" aria-hidden="true"><path d="M9 5l8 7-8 7" /></svg>
        </button>
        <button className="ctl" disabled={!ready || atEnd} onClick={() => seek(timeline.duration)} aria-label="跳到结尾">
          <svg viewBox="0 0 24 24" aria-hidden="true"><path d="M18 5v14M5 5l9 7-9 7z" /></svg>
        </button>
      </div>

      <div className="speed" role="group" aria-label="播放速度">
        {SPEEDS.map((v) => (
          <button key={v} className={speed === v ? 'speed-on' : ''} aria-pressed={speed === v} onClick={() => changeSpeed(v)}>
            {v}x
          </button>
        ))}
      </div>
    </div>
  );
}
