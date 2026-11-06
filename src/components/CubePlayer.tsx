import { useEffect, useMemo, useRef, useState } from 'react';
import type { TwistyPlayer } from 'cubing/twisty';
import { normalizeAlg } from '../lib/alg';

const SPEEDS = [0.5, 1, 1.5, 2];
const SPEED_KEY = 'mofang.player.speed';
/** cubing.js 默认一步要 1 秒，太慢。1x 定为每秒约 1.6 步 */
const BASE_TEMPO = 1.6;

function loadSpeed(): number {
  try {
    const v = Number(localStorage.getItem(SPEED_KEY));
    return SPEEDS.includes(v) ? v : 1;
  } catch {
    return 1;
  }
}

/** cubing.js 没有导出单步控制的类型，这里只声明用到的部分 */
interface StepController {
  animationController: {
    play(options: { direction: 1 | -1; untilBoundary: 'move'; autoSkipToOtherEndIfStartingAtBoundary: boolean }): void;
  };
}

interface Props {
  alg: string;
  /** 每次变化都从头播放一遍，用于重复点击同一条公式 */
  replayKey?: number;
}

/**
 * 3D 动画播放器：用 cubing.js 渲染魔方，控制条和当前步高亮是自己做的。
 * cubing.js 体积大，只在进入详情页时才动态加载，列表页不受影响。
 * 播放起点是“情形状态”，终点是已还原（setup anchor = end），颜色为黄顶绿前（setup z2）。
 */
export function CubePlayer({ alg, replayKey = 0 }: Props) {
  const host = useRef<HTMLDivElement>(null);
  const scrubber = useRef<HTMLInputElement>(null);
  const player = useRef<TwistyPlayer | null>(null);
  const [ready, setReady] = useState(false);
  const [error, setError] = useState(false);
  const [playing, setPlaying] = useState(false);
  const [atStart, setAtStart] = useState(true);
  const [atEnd, setAtEnd] = useState(false);
  const [moveIndex, setMoveIndex] = useState(0);
  const [speed, setSpeed] = useState(loadSpeed);
  const flat = normalizeAlg(alg);
  const moves = useMemo(() => (flat ? flat.split(' ') : []), [flat]);

  useEffect(() => {
    let cancelled = false;
    let detach = () => {};
    import('cubing/twisty')
      .then(({ TwistyPlayer: Player }) => {
        if (cancelled || !host.current) return;
        const el = new Player({
          puzzle: '3x3x3',
          alg: flat,
          experimentalSetupAlg: 'z2',
          experimentalSetupAnchor: 'end',
          background: 'none',
          controlPanel: 'none',
          hintFacelets: 'none',
          backView: 'none',
          tempoScale: speed * BASE_TEMPO,
        });
        el.style.width = '100%';
        el.style.height = '100%';
        host.current.replaceChildren(el);
        player.current = el;
        setReady(true);

        const model = el.experimentalModel;
        const onCoarse = (info: { playing: boolean; atStart: boolean; atEnd: boolean }) => {
          setPlaying(info.playing);
          setAtStart(info.atStart);
          setAtEnd(info.atEnd);
        };
        const onDetailed = (info: { timestamp: number; timeRange: { start: number; end: number } }) => {
          const input = scrubber.current;
          if (!input) return;
          input.max = String(info.timeRange.end);
          input.value = String(info.timestamp);
          const span = info.timeRange.end - info.timeRange.start;
          input.style.setProperty('--progress', `${span > 0 ? ((info.timestamp - info.timeRange.start) / span) * 100 : 0}%`);
        };
        const onMove = (info: { patternIndex: number }) => setMoveIndex(info.patternIndex);
        model.coarseTimelineInfo.addFreshListener(onCoarse);
        model.detailedTimelineInfo.addFreshListener(onDetailed);
        model.currentMoveInfo.addFreshListener(onMove);
        detach = () => {
          model.coarseTimelineInfo.removeFreshListener(onCoarse);
          model.detailedTimelineInfo.removeFreshListener(onDetailed);
          model.currentMoveInfo.removeFreshListener(onMove);
        };
      })
      .catch(() => {
        if (!cancelled) setError(true);
      });
    return () => {
      cancelled = true;
      detach();
      player.current = null;
      host.current?.replaceChildren();
    };
    // 播放器只创建一次，公式切换由下面的 effect 处理
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // 切换公式或重复点击时，从头播放
  const firstRun = useRef(true);
  useEffect(() => {
    if (firstRun.current) {
      firstRun.current = false;
      return;
    }
    const el = player.current;
    if (!el) return;
    el.alg = flat;
    el.jumpToStart({ flash: false });
    const t = window.setTimeout(() => el.play(), 120);
    return () => window.clearTimeout(t);
  }, [flat, replayKey]);

  const step = (direction: 1 | -1) => {
    const el = player.current;
    if (!el) return;
    el.pause();
    (el.controller as unknown as StepController).animationController.play({
      direction,
      untilBoundary: 'move',
      autoSkipToOtherEndIfStartingAtBoundary: false,
    });
  };

  const changeSpeed = (v: number) => {
    setSpeed(v);
    if (player.current) player.current.tempoScale = v * BASE_TEMPO;
    try {
      localStorage.setItem(SPEED_KEY, String(v));
    } catch {
      // 记不住速度不影响播放
    }
  };

  if (error) return <div className="player player-error">3D 动画加载失败，联网后刷新重试</div>;

  return (
    <div className="player">
      <div className="player-stage" ref={host}>
        <div className="player-loading">
          <span className="spinner" aria-hidden="true" />
          正在加载 3D 魔方…
        </div>
      </div>

      <ol className="move-track" aria-label="公式步骤">
        {moves.map((m, i) => (
          <li key={`${i}-${m}`} className={playing || !atStart ? (i === moveIndex && !atEnd ? 'move-now' : i < moveIndex || atEnd ? 'move-done' : '') : ''}>
            {m}
          </li>
        ))}
      </ol>

      <input
        ref={scrubber}
        className="player-scrubber"
        type="range"
        min={0}
        max={1}
        step={1}
        defaultValue={0}
        disabled={!ready}
        aria-label="播放进度"
        onChange={(e) => {
          const el = player.current;
          if (!el) return;
          el.pause();
          // cubing.js 的时间戳是带品牌的 number 类型
          el.experimentalModel.timestampRequest.set(Number(e.target.value) as never);
        }}
      />

      <div className="player-controls">
        <button className="ctl" disabled={!ready || atStart} onClick={() => player.current?.jumpToStart({ flash: false })} aria-label="回到开头">
          <svg viewBox="0 0 24 24" aria-hidden="true"><path d="M6 5v14M19 5l-9 7 9 7z" /></svg>
        </button>
        <button className="ctl" disabled={!ready || atStart} onClick={() => step(-1)} aria-label="上一步">
          <svg viewBox="0 0 24 24" aria-hidden="true"><path d="M15 5l-8 7 8 7" /></svg>
        </button>
        <button className="ctl ctl-main" disabled={!ready} onClick={() => player.current?.togglePlay()} aria-label={playing ? '暂停' : '播放'}>
          {playing ? (
            <svg viewBox="0 0 24 24" aria-hidden="true"><path d="M8 5v14M16 5v14" /></svg>
          ) : (
            <svg viewBox="0 0 24 24" aria-hidden="true"><path d="M8 5l11 7-11 7z" /></svg>
          )}
        </button>
        <button className="ctl" disabled={!ready || atEnd} onClick={() => step(1)} aria-label="下一步">
          <svg viewBox="0 0 24 24" aria-hidden="true"><path d="M9 5l8 7-8 7" /></svg>
        </button>
        <button className="ctl" disabled={!ready || atEnd} onClick={() => player.current?.jumpToEnd({ flash: false })} aria-label="跳到结尾">
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
