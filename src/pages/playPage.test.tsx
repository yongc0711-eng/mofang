import { createElement } from 'react';
import { renderToStaticMarkup } from 'react-dom/server';
import { expect, it, vi } from 'vitest';
import { PlayPage } from './PlayPage';
import { CubeSandbox } from '../components/CubeSandbox';
vi.mock('../store/devicePrefs', () => ({ useDevicePrefs: () => ({ bottomColor: 'white', finish: 'uv' }) }));
it('SSR has title, nine main keys, suffixes and actions without loading WebGL', () => {
  const html=renderToStaticMarkup(createElement(PlayPage));
  expect(html).toContain('试转</h1>');expect(html).toContain('拖动魔方换视角，双击回正');
  for(const key of ['R','U','F','L','D','B','x','y','z']) expect(html).toContain(`aria-label="转动 ${key}"`);
  expect(html.match(/aria-label="转动 /g)).toHaveLength(9);
  for(const label of ['切换更多转法','无后缀','后缀 &#x27;','后缀 2','撤销最后一转','复原魔方']) expect(html).toContain(`aria-label="${label}"`);
  expect(html.match(/<button type="button"/g)).toHaveLength(17);
  expect(renderToStaticMarkup(createElement(CubeSandbox)).match(/<button type="button"/g)).toHaveLength(15);
  expect(html).toContain('aria-label="魔方阶数"');
  expect(html).toContain('aria-pressed="true" title="切换后复原魔方">三阶</button>');
  expect(html).toContain('aria-pressed="false" title="切换后复原魔方">二阶</button>');
  expect(html).not.toContain('搜索公式');expect(html).not.toContain('case-card');
});
it('二阶 SSR 只有六面转、三个后缀和两项动作，不提供更多或三阶转法', () => {
  const html = renderToStaticMarkup(createElement(CubeSandbox, { size: 2 }));
  expect(html).toContain('data-size="2"');
  expect(html.match(/aria-label="转动 /g)).toHaveLength(6);
  expect(html.match(/<button type="button"/g)).toHaveLength(11);
  for (const key of ['R', 'U', 'F', 'L', 'D', 'B']) expect(html).toContain(`aria-label="转动 ${key}"`);
  for (const key of ['x', 'y', 'z', 'r', 'l', 'u', 'd', 'f', 'b', 'M', 'E', 'S']) expect(html).not.toContain(`aria-label="转动 ${key}"`);
  for (const label of ['无后缀', '后缀 &#x27;', '后缀 2', '撤销最后一转', '复原魔方']) expect(html).toContain(`aria-label="${label}"`);
  expect(html).not.toContain('切换更多转法');
});
