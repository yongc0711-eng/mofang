import { memo } from 'react';
import { type Face, type Vec } from '../lib/cube';
import { stickerAt2 } from '../lib/cube2';

const COLOR_VAR: Record<Face, string> = {
  U: 'var(--cube-u)',
  D: 'var(--cube-d)',
  F: 'var(--cube-f)',
  B: 'var(--cube-b)',
  R: 'var(--cube-r)',
  L: 'var(--cube-l)',
};
const fill = (f: Face | null) => (f ? COLOR_VAR[f] : 'var(--cube-mask)');

const N2 = [-1, 1] as const;
const CELL = 20;
const GAP = 2;
const STRIP = 7;
const START = STRIP + GAP * 2;
const SIZE = START * 2 + 2 * CELL + GAP;
const pos = (v: -1 | 1) => START + ((v + 1) / 2) * (CELL + GAP);

interface ViewConfig {
  yLevel: 1 | -1;
  faceN: Vec;
  invertZ: boolean;
  topZ: -1 | 1;
  topN: Vec;
  bottomZ: -1 | 1;
  bottomN: Vec;
}

const TOP_CONFIG: ViewConfig = {
  yLevel: 1,
  faceN: [0, 1, 0],
  invertZ: false,
  topZ: -1,
  topN: [0, 0, -1],
  bottomZ: 1,
  bottomN: [0, 0, 1],
};

const BOTTOM_CONFIG: ViewConfig = {
  yLevel: -1,
  faceN: [0, -1, 0],
  invertZ: true,
  topZ: 1,
  topN: [0, 0, 1],
  bottomZ: -1,
  bottomN: [0, 0, -1],
};

function FaceRingView2({
  colors,
  cfg,
  label,
}: {
  colors: (Face | null)[];
  cfg: ViewConfig;
  label?: string;
}) {
  const at = (p: Vec, n: Vec) => fill(colors[stickerAt2(p, n)]);
  const sy = (z: -1 | 1) => pos((cfg.invertZ ? -z : z) as -1 | 1);
  const a11y = label ? { 'aria-label': label } : { 'aria-hidden': true as const };

  return (
    <svg viewBox={`0 0 ${SIZE} ${SIZE}`} role="img" {...a11y}>
      {N2.flatMap((x) =>
        N2.map((z) => (
          <rect
            key={`f${x}${z}`}
            x={pos(x)}
            y={sy(z)}
            width={CELL}
            height={CELL}
            rx={2.5}
            fill={at([x, cfg.yLevel, z], cfg.faceN)}
          />
        )),
      )}
      {N2.map((x) => (
        <rect
          key={`t${x}`}
          x={pos(x)}
          y={GAP}
          width={CELL}
          height={STRIP}
          rx={1.5}
          fill={at([x, cfg.yLevel, cfg.topZ], cfg.topN)}
        />
      ))}
      {N2.map((x) => (
        <rect
          key={`b${x}`}
          x={pos(x)}
          y={SIZE - GAP - STRIP}
          width={CELL}
          height={STRIP}
          rx={1.5}
          fill={at([x, cfg.yLevel, cfg.bottomZ], cfg.bottomN)}
        />
      ))}
      {N2.map((z) => (
        <rect
          key={`l${z}`}
          x={GAP}
          y={sy(z)}
          width={STRIP}
          height={CELL}
          rx={1.5}
          fill={at([-1, cfg.yLevel, z], [-1, 0, 0])}
        />
      ))}
      {N2.map((z) => (
        <rect
          key={`r${z}`}
          x={SIZE - GAP - STRIP}
          y={sy(z)}
          width={STRIP}
          height={CELL}
          rx={1.5}
          fill={at([1, cfg.yLevel, z], [1, 0, 0])}
        />
      ))}
    </svg>
  );
}

/** 顶视图（2×2）：顶面 2×2 与四周侧面顶行，F 在下、R 在右 */
export function TopView2({ colors, label }: { colors: (Face | null)[]; label?: string }) {
  return <FaceRingView2 colors={colors} cfg={TOP_CONFIG} label={label} />;
}

/** 底视图（2×2）：底面 2×2 与四周侧面底行，F 在上、R 在右（绕 x 轴往前翻 90° 看底面） */
export function BottomView2({ colors, label }: { colors: (Face | null)[]; label?: string }) {
  return <FaceRingView2 colors={colors} cfg={BOTTOM_CONFIG} label={label} />;
}

/** 二阶情形图解 */
export const CaseDiagram2 = memo(function CaseDiagram2({
  colors,
  view,
}: {
  colors: (Face | null)[];
  view: 'top2' | 'both2';
}) {
  if (view === 'top2') {
    return (
      <div className="diagram">
        <TopView2 colors={colors} />
      </div>
    );
  }
  return (
    <div className="diagram" style={{ display: 'flex', gap: 4 }}>
      <TopView2 colors={colors} label="顶视图" />
      <BottomView2 colors={colors} label="底视图" />
    </div>
  );
});
