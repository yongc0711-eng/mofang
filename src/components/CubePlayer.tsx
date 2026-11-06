import { useEffect, useRef, useState } from 'react';
import { normalizeAlg } from '../lib/alg';

/**
 * 3D 动画播放器，封装 cubing.js 的 <twisty-player>。
 * cubing.js 体积大，只在进入详情页时才动态加载，列表页不受影响。
 * 播放起点是“情形状态”，终点是已还原（setup anchor = end），颜色为黄顶绿前（setup z2）。
 */
export function CubePlayer({ alg }: { alg: string }) {
  const host = useRef<HTMLDivElement>(null);
  const player = useRef<HTMLElement & { alg: string; timeline?: unknown } | null>(null);
  const [error, setError] = useState(false);
  const flat = normalizeAlg(alg);

  useEffect(() => {
    let cancelled = false;
    import('cubing/twisty')
      .then(({ TwistyPlayer }) => {
        if (cancelled || !host.current) return;
        const el = new TwistyPlayer({
          puzzle: '3x3x3',
          alg: flat,
          experimentalSetupAlg: 'z2',
          experimentalSetupAnchor: 'end',
          background: 'none',
          controlPanel: 'bottom-row',
          hintFacelets: 'none',
          backView: 'none',
          tempoScale: 1.2,
        });
        el.style.width = '100%';
        el.style.height = '100%';
        host.current.replaceChildren(el);
        player.current = el as never;
      })
      .catch(() => {
        if (!cancelled) setError(true);
      });
    return () => {
      cancelled = true;
      player.current = null;
      host.current?.replaceChildren();
    };
    // 播放器只创建一次，公式切换由下面的 effect 处理
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    if (player.current) player.current.alg = flat;
  }, [flat]);

  if (error) return <div className="player player-error">3D 动画加载失败，联网后刷新重试</div>;
  return (
    <div className="player" ref={host}>
      <div className="player-loading">正在加载 3D 魔方…</div>
    </div>
  );
}
