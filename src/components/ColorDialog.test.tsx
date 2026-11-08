import { createElement, isValidElement, type ReactNode, type ReactElement } from 'react';
import { renderToStaticMarkup } from 'react-dom/server';
import { expect, it, vi } from 'vitest';
import { ColorDialog } from './ColorDialog';
import { FormulaColors, BrowseColorPanel } from './FormulaColors';
import { PracticeColorsDialog, PracticeColorPanel } from './PracticeColorsDialog';
import { getDevicePrefs, setDevicePrefs } from '../store/devicePrefs';
import { initializeColorPools, type PracticeColorPools } from '../lib/practiceColors';
const ui=vi.hoisted(()=>({method:'cfop'}));
vi.mock('react',async original=>({...await original<typeof import('react')>(),useState:(initial:unknown)=>[initial==='cfop'?ui.method:initial,vi.fn()]}));
vi.mock('../store/devicePrefs',async original=>{const actual=await original<typeof import('../store/devicePrefs')>();return {...actual,useDevicePrefs:()=>actual.getDevicePrefs()};});
const render=(open:boolean)=>renderToStaticMarkup(createElement(ColorDialog,{open,title:'测试配色',onClose:()=>{},children:m=>createElement('p',null,`当前 ${m}`)}));
it('default-closed wrappers mount exactly one trigger each, without modal content',()=>{
  const pools=initializeColorPools({},getDevicePrefs());
  for(const html of [renderToStaticMarkup(createElement(FormulaColors)),renderToStaticMarkup(createElement(PracticeColorsDialog,{colorPools:pools,onChange:()=>{}}))]){
    expect(html.match(/aria-haspopup="dialog"/g)).toHaveLength(1);
    expect(html).toContain('aria-expanded="false"');expect(html).not.toContain('role="dialog"');expect(html).not.toContain('role="tablist"');
  }
});
it('closed shell does not render children and open shell has named modal, exactly two tabs and one panel',()=>{
  expect(render(false)).toBe('');const html=render(true);
  expect(html).toContain('role="dialog" aria-modal="true"');expect(html.match(/role="tab"/g)).toHaveLength(2);
  expect(html.match(/role="tabpanel"/g)).toHaveLength(1);expect(html).toContain('aria-label="关闭配色"');
  expect(html).toContain('当前 cfop');expect(html).toContain('aria-selected="true" tabindex="0"');
});
it('Roux tab changes the panel identity rather than showing two stacked editors',()=>{
  ui.method='roux';const html=render(true);ui.method='cfop';
  expect(html).toContain('当前 roux');expect(html).not.toContain('当前 cfop');expect(html.match(/aria-selected="true"/g)).toHaveLength(1);
});
function buttons(node:ReactNode):ReactElement<Record<string, unknown>>[]{
  if(Array.isArray(node))return node.flatMap(buttons);
  if(!isValidElement<{children?:ReactNode}>(node))return [];
  return [...(node.type==='button'?[node as ReactElement<Record<string, unknown>>]:[]),...buttons(node.props.children)];
}
it('practice panel writes only the passed pools and keeps device preferences exactly unchanged',()=>{
  const before=getDevicePrefs();let pools=initializeColorPools({},before);
  const onChange=(patch:PracticeColorPools|((p:PracticeColorPools)=>PracticeColorPools))=>{pools=typeof patch==='function'?patch(pools):patch};
  const tree=PracticeColorPanel({method:'cfop',colorPools:pools,onChange});
  const target=buttons(tree).find(b=>b.props['aria-label']==='cfop 练习底色蓝色')!;
  (target.props.onClick as ()=>void)();
  expect(pools.cfopBottoms).toEqual(['white','blue']);expect(getDevicePrefs()).toEqual(before);
});
it('browse panel writes device prefs immediately without modifying an existing practice pool snapshot',()=>{
  const before=getDevicePrefs(),pools=initializeColorPools({},before),snapshot=JSON.parse(JSON.stringify(pools));
  const tree=BrowseColorPanel({method:'cfop'}),target=buttons(tree).find(b=>b.props['aria-label']==='底面绿色')!;
  (target.props.onClick as ()=>void)();
  expect(getDevicePrefs().cfop).toEqual({bottomColor:'green'});expect(pools).toEqual(snapshot);
  setDevicePrefs({cfop:before.cfop});
});
