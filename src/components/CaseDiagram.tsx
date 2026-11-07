import { memo } from 'react';
import { caseState, displayColors, displayMask, type Mask } from '../lib/cases';
import { STICKERS, stickerAt, type Face, type Vec, type State } from '../lib/cube';
import { displayFace, ollTopMask, type BottomColor } from '../store/devicePrefs';
import { type AlgCase } from '../types';

/** 观察方向是黄色朝上、绿色朝前（白顶绿前的魔方做 z2），和 3D 播放器一致 */
const COLOR_VAR: Record<Face, string> = {
  U: 'var(--cube-u)',
  D: 'var(--cube-d)',
  F: 'var(--cube-f)',
  B: 'var(--cube-b)',
  R: 'var(--cube-r)',
  L: 'var(--cube-l)',
};
const fill = (f: Face | null) => (f ? COLOR_VAR[f] : 'var(--cube-mask)');

const N = [-1, 0, 1];

/** 顶视图：顶面 3x3，四周一圈侧面顶行 */
export function TopView({ colors }: { colors: (Face | null)[] }) {
  const cell = 20;
  const gap = 2;
  const strip = 7;
  const start = strip + gap * 2;
  const pos = (i: number) => start + (i + 1) * (cell + gap);
  const size = start * 2 + 3 * cell + 2 * gap;
  const at = (p: Vec, n: Vec) => fill(colors[stickerAt(p, n)]);
  return (
    <svg viewBox={`0 0 ${size} ${size}`} role="img" aria-hidden="true">
      {N.flatMap((x) =>
        N.map((z) => (
          <rect key={`u${x}${z}`} x={pos(x) } y={pos(z)} width={cell} height={cell} rx={2.5} fill={at([x, 1, z], [0, 1, 0])} />
        )),
      )}
      {N.map((x) => (
        <rect key={`b${x}`} x={pos(x)} y={gap} width={cell} height={strip} rx={1.5} fill={at([x, 1, -1], [0, 0, -1])} />
      ))}
      {N.map((x) => (
        <rect key={`f${x}`} x={pos(x)} y={size - gap - strip} width={cell} height={strip} rx={1.5} fill={at([x, 1, 1], [0, 0, 1])} />
      ))}
      {N.map((z) => (
        <rect key={`l${z}`} x={gap} y={pos(z)} width={strip} height={cell} rx={1.5} fill={at([-1, 1, z], [-1, 0, 0])} />
      ))}
      {N.map((z) => (
        <rect key={`r${z}`} x={size - gap - strip} y={pos(z)} width={strip} height={cell} rx={1.5} fill={at([1, 1, z], [1, 0, 0])} />
      ))}
    </svg>
  );
}

/** 等轴视图：显示 U、F、R 三面 */
export function IsoView({ colors }: { colors: (Face | null)[] }) {
  const project = ([x, y, z]: number[]) => {
    const sx = (x - z) * 0.866;
    const sy = (x + z) * 0.5 - y;
    return `${(sx * 20 + 62).toFixed(2)},${(sy * 20 + 66).toFixed(2)}`;
  };
  const inset = 0.45;
  const polys = STICKERS.filter((s) => s.face === 'U' || s.face === 'F' || s.face === 'R').map((s) => {
    const axes = [0, 1, 2].filter((a) => s.n[a] === 0);
    const center = s.p.map((v, a) => v + s.n[a] * 0.5);
    const corner = (da: number, db: number) => {
      const v = [...center];
      v[axes[0]] += da * inset;
      v[axes[1]] += db * inset;
      return project(v);
    };
    return { id: s.id, points: [corner(-1, -1), corner(-1, 1), corner(1, 1), corner(1, -1)].join(' ') };
  });
  return (
    <svg viewBox="0 0 124 124" role="img" aria-hidden="true">
      {polys.map((p) => (
        <polygon key={p.id} points={p.points} fill={fill(colors[p.id])} stroke={fill(colors[p.id])} strokeWidth={0.6} strokeLinejoin="round" />
      ))}
    </svg>
  );
}

/** LSE 视图：顶视图下面加一张底面（从上方透视，上边是 DF），否则看不到 DB 棱 */
export function LseView({ colors }: { colors: (Face | null)[] }) {
  const cell = 20;
  const gap = 2;
  const inset = 9;
  const size = inset * 2 + 3 * cell + 2 * gap;
  const pos = (i: number) => inset + (i + 1) * (cell + gap);
  return (
    <>
      <TopView colors={colors} />
      <svg viewBox={`0 0 ${size} ${size - inset * 2 + 4}`} role="img" aria-hidden="true">
        {N.flatMap((x) =>
          N.map((z) => (
            <rect
              key={`d${x}${z}`}
              x={pos(x)}
              // 上边是 DF，下边是 DB，和魔方绕 F 面向下展开的方向一致
              y={2 + (1 - z) * (cell + gap)}
              width={cell}
              height={cell}
              rx={2.5}
              fill={fill(colors[stickerAt([x, -1, z], [0, -1, 0])])}
            />
          )),
        )}
      </svg>
    </>
  );
}

interface Props {
  c: Pick<AlgCase, 'set' | 'algs' | 'group'>;
  view: 'top' | 'iso' | 'lse';
  /** 哪些贴纸显示颜色，其余画成灰色（和 3D 播放器的 mask 同一个）。不传或 null 用该组默认的显示规则 */
  mask?: Mask | null;
  /** 底面颜色，换一套配色画；不传是白色（标准配色） */
  bottom?: BottomColor;
  /** Practice only: validated actual terminal state, in observation coordinates. */
  state?: Readonly<State>;
}

/**
 * 每个位置该显示的颜色。显式传的 mask 优先；没传时 OLL 默认只显示顶层的 9 张（ollTopMask），
 * 其他组按该组默认的显示规则。所以卡片、首页封面、练习页不用逐个传 mask。
 * 颜色经 displayFace 换成所选底色的配色，和 3D 播放器用的是同一个映射。
 */
export function diagramColors(
  c: Pick<AlgCase, 'set' | 'algs' | 'group'>,
  mask?: Mask | null,
  bottom: BottomColor = 'white',
  state?: Readonly<State>,
): (Face | null)[] {
  const chosen = mask ?? (c.set === 'oll' ? ollTopMask : null);
  if (!state && !chosen && bottom === 'white') return displayColors(c);
  const m = chosen ?? displayMask(c);
  return (state ?? caseState(c)).map((id) => (m(id) ? displayFace(id, bottom) : null));
}

/** 情形图解。纯由公式推导，不需要任何图片素材 */
export const CaseDiagram = memo(function CaseDiagram({ c, view, mask, bottom, state }: Props) {
  const colors = diagramColors(c, mask, bottom, state);
  const View = view === 'top' ? TopView : view === 'iso' ? IsoView : LseView;
  return (
    <div className="diagram">
      <View colors={colors} />
    </div>
  );
});
