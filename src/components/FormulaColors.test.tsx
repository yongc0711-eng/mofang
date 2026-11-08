import { createElement } from 'react';
import { renderToStaticMarkup } from 'react-dom/server';
import { expect, it, vi } from 'vitest';
import { MemoryRouter } from 'react-router-dom';
import { HomePage } from '../pages/HomePage';
import { FormulaColors } from './FormulaColors';
import { getDevicePrefs } from '../store/devicePrefs';
import { browsePalette, FACE_COLOR, rouxPalette } from '../lib/colorScheme';
import { getCase } from '../data';
import { diagramColors } from './CaseDiagram';
import { caseState, displayMask } from '../lib/cases';
import scene from './CubeScene.ts?raw';
import player from './CubePlayer.tsx?raw';
import sandbox from './CubeSandbox.tsx?raw';
import casePage from '../pages/CasePage.tsx?raw';
import home from '../pages/HomePage.tsx?raw';
import card from './CaseCard.tsx?raw';
const ui=vi.hoisted(()=>({open:true}));
vi.mock('react',async original=>({...await original<typeof import('react')>(),useState:(initial: unknown)=>[typeof initial === 'string' ? initial : ui.open,vi.fn()]}));
vi.mock('../store/devicePrefs',async original=>{const actual=await original<typeof import('../store/devicePrefs')>();return {...actual,useDevicePrefs:()=>actual.getDevicePrefs()};});
vi.mock('../store/userStore', async original => ({ ...await original<typeof import('../store/userStore')>(), useUserData: () => ({ version: 1, cases: {} }) }));
it('CFOP panel has exactly six bottom selectors and no bridge controls',()=>{
  const html=renderToStaticMarkup(createElement(FormulaColors,{method:'cfop'}));
  expect(html).toContain('id="colors-cfop"');expect(html).toContain('aria-expanded="true"');
  expect(html.match(/aria-label="底面/g)).toHaveLength(6);expect(html).not.toContain('交换左右');
});
it('Roux panel shows exactly two legal pairs, stable left/right summary and swap button',()=>{
  const html=renderToStaticMarkup(createElement(FormulaColors,{method:'roux'}));
  expect(html).toContain('id="colors-roux"');expect(html.match(/桥<\/button>/g)).toHaveLength(2);
  expect(html).toContain('红 / 橙桥');expect(html).toContain('绿 / 蓝桥');expect(html).toContain('左红 · 右橙');
  expect(html).toContain('aria-label="交换左右桥色"');
});
it('closed panel retains accessible method entry and does not mount controls',()=>{
  ui.open=false;const html=renderToStaticMarkup(createElement(FormulaColors,{method:'roux'}));ui.open=true;
  expect(html).toContain('aria-expanded="false"');expect(html).not.toContain('浏览桥色对');
});
it('2D 54 colors use the explicit palette shared with 3D, including swapped direction',()=>{
  const c=getCase('pll-t')!,p=rouxPalette({bottomColor:'white',bridgePair:'green-blue',leftColor:'green'});
  expect(diagramColors(c,displayMask(c),'white',undefined,p)).toEqual(caseState(c).map(id=>p[STICKERS[id].face]));
});
import { STICKERS } from '../lib/cube';
it('detail wires the very same palette to 2D/3D and OLL wording, while the old player API stays optional',()=>{
  expect(casePage).toContain('<CaseDiagram c={viewCase} view={set.view} mask={maskFor2D} palette={palette} />');
  expect(casePage).toContain('<CubePlayer alg={playing} autoPlay={false} mask={maskFor3D} finish={prefs.finish} palette={palette} />');
  expect(casePage).toContain('recognitionFor(c, FACE_COLOR[palette.U])');
  expect(player).toContain('created.setPalette(paletteRef.current)');expect(player).toContain('scene.current?.setPalette(palette)');
  expect(scene).toContain('this.palette ? paletteFace(id, this.palette) : displayFace(id, bottom)');
  expect(home).toContain('palette={browsePalette(cover, prefs)}');expect(card).toContain('palette={palette}');
});
it('sandbox is explicitly fixed and no longer subscribes its drawing to legacy bottom',()=>{
  expect(sandbox).toContain('created.setPalette(SANDBOX_PALETTE)');expect(sandbox).not.toContain('prefs.bottomColor');
  const prefs=getDevicePrefs();expect(FACE_COLOR[browsePalette({set:'oll'},prefs).D]).toBe(prefs.cfop.bottomColor);
});

it('home mounts exactly the CFOP and Roux operable button entries, not detail or group duplicates', () => {
  const html = renderToStaticMarkup(createElement(MemoryRouter, null, createElement(HomePage)));
  for (const method of ['cfop', 'roux']) {
    expect(html.match(new RegExp(`id="colors-${method}"`, 'g'))).toHaveLength(1);
    expect(html).toContain(`aria-label="${method === 'cfop' ? 'CFOP' : 'Roux'} 配色" aria-expanded="true"`);
  }
  expect(html.match(/class="formula-colors"/g)).toHaveLength(2);
});
