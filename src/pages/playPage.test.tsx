import { createElement } from 'react';
import { renderToStaticMarkup } from 'react-dom/server';
import { expect, it, vi } from 'vitest';
import { PlayPage } from './PlayPage';
vi.mock('../store/devicePrefs', () => ({ useDevicePrefs: () => ({ bottomColor: 'white', finish: 'uv' }) }));
it('SSR has title, nine main keys, suffixes and actions without loading WebGL', () => {
  const html=renderToStaticMarkup(createElement(PlayPage));
  expect(html).toContain('试转</h1>');expect(html).toContain('拖动魔方换视角，双击回正');
  for(const key of ['R','U','F','L','D','B','x','y','z']) expect(html).toContain(`aria-label="转动 ${key}"`);
  expect(html.match(/aria-label="转动 /g)).toHaveLength(9);
  for(const label of ['切换更多转法','无后缀','后缀 &#x27;','后缀 2','撤销最后一转','复原魔方']) expect(html).toContain(`aria-label="${label}"`);
  expect(html.match(/<button type="button"/g)).toHaveLength(15);
  expect(html).not.toContain('搜索公式');expect(html).not.toContain('case-card');
});
