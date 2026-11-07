import { renderToStaticMarkup } from 'react-dom/server';
import { describe, expect, it } from 'vitest';
import { getCase } from '../data';
import { displayColors } from '../lib/cases';
import { STICKERS, type Face } from '../lib/cube';
import { CaseDiagram, IsoView, LseView, TopView } from './CaseDiagram';

// Parse only the SVG primitives under test; no DOM environment or snapshots.
type Attrs = Record<string, string>;
const elements = (markup: string, tag: string): Attrs[] =>
  [...markup.matchAll(new RegExp(`<${tag}\\b([^>]*)>`, 'g'))].map((m) =>
    Object.fromEntries([...m[1].matchAll(/([\w-]+)="([^"]*)"/g)].map((a) => [a[1], a[2]])),
  );
const svgs = (markup: string) => [...markup.matchAll(/<svg\b[^>]*>[\s\S]*?<\/svg>/g)].map((m) => m[0]);
const colorVar = (face: Face | null) => `var(--cube-${face ? face.toLowerCase() : 'mask'})`;
const fixture = (id: string) => {
  const c = getCase(id);
  if (!c) throw new Error(`Missing diagram fixture: ${id}`);
  return c;
};

// Locate by screen position rather than relying on SVG element order.
function rectAt(rects: Attrs[], x: number, y: number) {
  const matches = rects.filter((r) => Number(r.x) === x && Number(r.y) === y);
  expect(matches).toHaveLength(1);
  return matches[0];
}

function checkTop(markup: string, colors: (Face | null)[]) {
  const rects = elements(markup, 'rect');
  expect(rects).toHaveLength(21);
  for (const s of STICKERS.filter((s) => s.p[1] === 1)) {
    const [x, , z] = s.p;
    // Seen from above: back at top, front at bottom, +x to the right.
    const [sx, sy] = s.face === 'U' ? [33 + 22 * x, 33 + 22 * z]
      : s.face === 'F' ? [33 + 22 * x, 77]
      : s.face === 'B' ? [33 + 22 * x, 2]
      : s.face === 'L' ? [2, 33 + 22 * z] : [77, 33 + 22 * z];
    const rect = rectAt(rects, sx, sy);
    expect(rect.fill, `${s.face} ${s.p}`).toBe(colorVar(colors[s.id]));
    expect(Number(rect.width)).toBe(s.face === 'L' || s.face === 'R' ? 7 : 20);
    expect(Number(rect.height)).toBe(s.face === 'F' || s.face === 'B' ? 7 : 20);
  }
}

const polygonCenter = (p: Attrs) => {
  const points = p.points.split(' ').map((v) => v.split(',').map(Number));
  expect(points).toHaveLength(4);
  return [0, 1].map((axis) => points.reduce((sum, v) => sum + v[axis], 0) / 4);
};

describe('CaseDiagram 颜色和引擎坐标', () => {
  for (const id of ['oll-1', 'oll-27', 'pll-ua', 'pll-t']) {
    it(`TopView ${id}：顶面与四周顶行逐贴纸匹配 displayColors`, () => {
      const c = fixture(id);
      const colors = displayColors(c);
      checkTop(renderToStaticMarkup(<TopView colors={colors} />), colors);
      checkTop(svgs(renderToStaticMarkup(<CaseDiagram c={c} view="top" />))[0], colors);
    });

    it(`IsoView ${id}：U 在上、F 在左前、R 在右前，逐贴纸匹配 displayColors`, () => {
      const c = fixture(id);
      const colors = displayColors(c);
      for (const markup of [renderToStaticMarkup(<IsoView colors={colors} />),
        renderToStaticMarkup(<CaseDiagram c={c} view="iso" />)]) {
        const polys = elements(markup, 'polygon');
        expect(polys).toHaveLength(27);
        const used = new Set<Attrs>();
        for (const s of STICKERS.filter((s) => ['U', 'F', 'R'].includes(s.face))) {
          // Independent orthographic basis: +x down-right, +z down-left, +y up.
          const [x, y, z] = s.p.map((v, a) => v + s.n[a] / 2);
          const expected = [62 + 17.32 * (x - z), 66 + 10 * (x + z) - 20 * y];
          const matches = polys.filter((p) => polygonCenter(p).every((v, a) => Math.abs(v - expected[a]) < 0.01));
          expect(matches, `${s.face} ${s.p}`).toHaveLength(1);
          const p = matches[0];
          used.add(p);
          expect(p.fill).toBe(colorVar(colors[s.id]));
          expect(p.stroke).toBe(colorVar(colors[s.id]));
        }
        expect(used.size).toBe(27);
      }
    });
  }

  for (const id of ['lse-eo-7', 'lse-ulur-1', 'lse-4c-24']) {
    it(`LseView ${id}：上方顶视图、下方 D 面，DF 在 DB 上方`, () => {
      const c = fixture(id);
      const colors = displayColors(c);
      for (const markup of [renderToStaticMarkup(<LseView colors={colors} />),
        renderToStaticMarkup(<CaseDiagram c={c} view="lse" />)]) {
        const views = svgs(markup);
        expect(views).toHaveLength(2);
        checkTop(views[0], colors);
        const bottom = elements(views[1], 'rect');
        expect(bottom).toHaveLength(9);
        for (const s of STICKERS.filter((s) => s.face === 'D')) {
          const [x, , z] = s.p;
          expect(rectAt(bottom, 31 + 22 * x, 24 - 22 * z).fill).toBe(colorVar(colors[s.id]));
        }
      }
    });
  }

  it('黄顶绿前：CSS 变量含黄 U、绿 F、橙 R、红 L；还原态中心处于正确的屏幕方位', async () => {
    // Vitest stubs CSS imports. Load the file in Node; keep its small read-only
    // interface local because this browser project's types exclude Node APIs.
    const fsModule: string = 'node:fs';
    const { readFileSync } = await import(fsModule) as {
      readFileSync(path: URL, encoding: 'utf8'): string;
    };
    const css = readFileSync(new URL('../styles.css', import.meta.url), 'utf8');
    for (const [face, hex] of [['u', '#ffc800'], ['f', '#00a844'], ['r', '#ff6a00'], ['l', '#e0101f']]) {
      expect(css).toMatch(new RegExp(`--cube-${face}:\\s*${hex}\\s*;`));
    }
    // Derive the solved reference with the same engine API, never handwrite a state.
    const colors = displayColors({ ...fixture('pll-t'), algs: [''] });
    const top = elements(renderToStaticMarkup(<TopView colors={colors} />), 'rect');
    expect(rectAt(top, 33, 33).fill).toBe('var(--cube-u)');
    expect(rectAt(top, 33, 77).fill).toBe('var(--cube-f)');
    expect(rectAt(top, 2, 33).fill).toBe('var(--cube-l)');
    expect(rectAt(top, 77, 33).fill).toBe('var(--cube-r)');
    const polys = elements(renderToStaticMarkup(<IsoView colors={colors} />), 'polygon');
    for (const [face, x, y] of [['u', 62, 36], ['f', 36.02, 81], ['r', 87.98, 81]] as const) {
      const center = polys.find((p) => {
        const [cx, cy] = polygonCenter(p);
        return Math.abs(cx - x) < 0.01 && Math.abs(cy - y) < 0.01;
      });
      expect(center?.fill).toBe(`var(--cube-${face})`);
    }
  });
});
