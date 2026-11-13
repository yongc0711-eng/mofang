import { renderToStaticMarkup } from 'react-dom/server';
import { describe, expect, it } from 'vitest';
import { parseAlg } from '../lib/alg';
import { FACES, type Face } from '../lib/cube';
import { applyMoves2, solved2, STICKERS2 } from '../lib/cube2';
import { BottomView2, CaseDiagram2, TopView2 } from './CaseDiagram2';

type Attrs = Record<string, string>;
const elements = (markup: string, tag: string): Attrs[] =>
  [...markup.matchAll(new RegExp(`<${tag}\\b([^>]*)>`, 'g'))].map((m) =>
    Object.fromEntries([...m[1].matchAll(/([\w-]+)="([^"]*)"/g)].map((a) => [a[1], a[2]])),
  );
const svgs = (markup: string) => [...markup.matchAll(/<svg\b[^>]*>[\s\S]*?<\/svg>/g)].map((m) => m[0]);
const colorVar = (face: Face | null) => `var(--cube-${face ? face.toLowerCase() : 'mask'})`;

function rectAt(rects: Attrs[], x: number, y: number): Attrs {
  const matches = rects.filter((r) => Number(r.x) === x && Number(r.y) === y);
  expect(matches).toHaveLength(1);
  return matches[0];
}

/** 不调用 stickerAt2，直接按 STICKERS2 的几何坐标过滤对应贴纸 id */
function stickerIdByFilter(p: [number, number, number], n: [number, number, number]): number {
  const found = STICKERS2.filter(
    (s) => s.p[0] === p[0] && s.p[1] === p[1] && s.p[2] === p[2] && s.n[0] === n[0] && s.n[1] === n[1] && s.n[2] === n[2],
  );
  expect(found).toHaveLength(1);
  return found[0].id;
}

const posCoord = (v: number) => (v === -1 ? 11 : 33);

describe('CaseDiagram2 二阶图解', () => {
  it('格数与可访问性标签：TopView2 / BottomView2 各 12 格，both2 24 格并带顶/底视图标签', () => {
    const colors: (Face | null)[] = STICKERS2.map((s) => (s.id === 0 ? null : s.face));

    const topHtml = renderToStaticMarkup(<TopView2 colors={colors} />);
    expect(elements(topHtml, 'rect')).toHaveLength(12);
    expect(elements(topHtml, 'svg')[0]['aria-hidden']).toBe('true');

    const bottomHtml = renderToStaticMarkup(<BottomView2 colors={colors} />);
    expect(elements(bottomHtml, 'rect')).toHaveLength(12);
    expect(elements(bottomHtml, 'svg')[0]['aria-hidden']).toBe('true');

    const topModeHtml = renderToStaticMarkup(<CaseDiagram2 colors={colors} view="top2" />);
    expect(svgs(topModeHtml)).toHaveLength(1);
    expect(elements(topModeHtml, 'rect')).toHaveLength(12);

    const bothHtml = renderToStaticMarkup(<CaseDiagram2 colors={colors} view="both2" />);
    const bothSvgs = svgs(bothHtml);
    expect(bothSvgs).toHaveLength(2);
    expect(elements(bothHtml, 'rect')).toHaveLength(24);
    expect(elements(bothSvgs[0], 'svg')[0]['aria-label']).toBe('顶视图');
    expect(elements(bothSvgs[1], 'svg')[0]['aria-label']).toBe('底视图');

    // id 0 在 U [-1, 1, -1] 处，传 null 应回退到 --cube-mask
    const topRects = elements(topHtml, 'rect');
    expect(rectAt(topRects, 11, 11).fill).toBe('var(--cube-mask)');
  });

  it('确定性颜色映射：逐格匹配 STICKERS2 过滤出的真实贴纸 id', () => {
    const colors: Face[] = STICKERS2.map((_, i) => FACES[i % 6]);

    const topRects = elements(renderToStaticMarkup(<TopView2 colors={colors} />), 'rect');
    for (const s of STICKERS2.filter((st) => st.p[1] === 1)) {
      const [x, , z] = s.p;
      const [sx, sy] =
        s.face === 'U' ? [posCoord(x), posCoord(z)]
          : s.face === 'B' ? [posCoord(x), 2]
          : s.face === 'F' ? [posCoord(x), 55]
          : s.face === 'L' ? [2, posCoord(z)]
          : [55, posCoord(z)];
      const id = stickerIdByFilter(s.p, s.n);
      const rect = rectAt(topRects, sx, sy);
      expect(rect.fill, `Top ${s.face} ${s.p}`).toBe(colorVar(colors[id]));
      expect(Number(rect.width)).toBe(s.face === 'L' || s.face === 'R' ? 7 : 20);
      expect(Number(rect.height)).toBe(s.face === 'F' || s.face === 'B' ? 7 : 20);
    }

    const bottomRects = elements(renderToStaticMarkup(<BottomView2 colors={colors} />), 'rect');
    for (const s of STICKERS2.filter((st) => st.p[1] === -1)) {
      const [x, , z] = s.p;
      // BottomView2: F 在上、R 在右（z=1 在上，z=-1 在下）
      const [sx, sy] =
        s.face === 'D' ? [posCoord(x), posCoord(-z)]
          : s.face === 'F' ? [posCoord(x), 2]
          : s.face === 'B' ? [posCoord(x), 55]
          : s.face === 'L' ? [2, posCoord(-z)]
          : [55, posCoord(-z)];
      const id = stickerIdByFilter(s.p, s.n);
      const rect = rectAt(bottomRects, sx, sy);
      expect(rect.fill, `Bottom ${s.face} ${s.p}`).toBe(colorVar(colors[id]));
      expect(Number(rect.width)).toBe(s.face === 'L' || s.face === 'R' ? 7 : 20);
      expect(Number(rect.height)).toBe(s.face === 'F' || s.face === 'B' ? 7 : 20);
    }
  });

  it('方位与 R 转对称校验：顶视图与底视图均满足左列/L 不变、右列/R 变化，且底视图 F 在上 R 在右', () => {
    const solvedColors = solved2().map((id) => STICKERS2[id].face);
    const rState = applyMoves2(solved2(), parseAlg('R'));
    const rColors = rState.map((id) => STICKERS2[id].face);

    const solvedBoth = svgs(renderToStaticMarkup(<CaseDiagram2 colors={solvedColors} view="both2" />));
    const rBoth = svgs(renderToStaticMarkup(<CaseDiagram2 colors={rColors} view="both2" />));

    const solvedTop = elements(solvedBoth[0], 'rect');
    const rTop = elements(rBoth[0], 'rect');
    // 顶视图左列 (x=11) 与 L 条 (x=2) 不变
    for (const [x, y] of [[11, 2], [11, 11], [11, 33], [11, 55], [2, 11], [2, 33]]) {
      expect(rectAt(rTop, x, y).fill).toBe(rectAt(solvedTop, x, y).fill);
    }
    // 顶视图右列 (x=33) 与 R 条 (x=55) 均变化
    for (const [x, y] of [[33, 2], [33, 11], [33, 33], [33, 55]]) {
      expect(rectAt(rTop, x, y).fill).not.toBe(rectAt(solvedTop, x, y).fill);
    }
    // R 条自身两张原本同为 R 色（橙），R 转后仍是 R 面的贴纸色不变，但 U/F/B 变化已覆盖；验证 R 条位置色为 R
    expect(rectAt(rTop, 55, 11).fill).toBe(colorVar('R'));
    expect(rectAt(rTop, 55, 33).fill).toBe(colorVar('R'));

    const solvedBottom = elements(solvedBoth[1], 'rect');
    const rBottom = elements(rBoth[1], 'rect');
    // 底视图左列 (x=11) 与 L 条 (x=2) 不变
    for (const [x, y] of [[11, 2], [11, 11], [11, 33], [11, 55], [2, 11], [2, 33]]) {
      expect(rectAt(rBottom, x, y).fill).toBe(rectAt(solvedBottom, x, y).fill);
    }
    // 底视图右列 (x=33) 全变化：上条 F(y=2) 收到原 D，底面 DF(y=11) 收到原 B，DB(y=33) 收到原 B，下条 B(y=55) 收到原 U
    for (const [x, y] of [[33, 2], [33, 11], [33, 33], [33, 55]]) {
      expect(rectAt(rBottom, x, y).fill).not.toBe(rectAt(solvedBottom, x, y).fill);
    }
    expect(rectAt(rBottom, 33, 2).fill).toBe(colorVar('D'));
    expect(rectAt(rBottom, 33, 11).fill).toBe(colorVar('B'));
    expect(rectAt(rBottom, 33, 33).fill).toBe(colorVar('B'));
    expect(rectAt(rBottom, 33, 55).fill).toBe(colorVar('U'));
    expect(rectAt(rBottom, 55, 11).fill).toBe(colorVar('R'));
    expect(rectAt(rBottom, 55, 33).fill).toBe(colorVar('R'));
  });
});
