import { expect, it } from 'vitest';
import home from './HomePage.tsx?raw';
import formula from '../components/FormulaColors.tsx?raw';
const fsName: string='node:fs';
const {readFileSync}=await import(/* @vite-ignore */ fsName) as {readFileSync(path:URL,encoding:'utf8'):string};
const css=readFileSync(new URL('../styles.css',import.meta.url),'utf8');
it('a single round color action sits at the right of the shortened search row',()=>{
  expect(home.match(/<FormulaColors iconOnly \/>/g)).toHaveLength(1);
  expect(home).toMatch(/<h1 className="page-title">魔方公式<\/h1>[\s\S]*?<div className="home-search-row">\s*<input[\s\S]*?aria-label="搜索公式"[\s\S]*?<FormulaColors iconOnly \/>\s*<\/div>/);
  expect(css).toContain('.home-search-row { display: flex; align-items: center; gap: 8px; }');
  const search=css.match(/^\.home-search-row \.search-input \{([^}]*)\}/m)![1];
  expect(search).toContain('height: 44px');
  expect(search).toContain('border-radius: 999px');
  expect(search).toContain('margin-bottom: 0');
});
it('entry keeps the full dialog accessibility contract and explicit focus-before-open handler',()=>{
  expect(formula).toContain('id="browse-colors" title="浏览配色" aria-label="浏览配色" aria-haspopup="dialog" aria-expanded={open}');
  expect(formula).toContain('onClick={e => { e.currentTarget.focus(); setOpen(true); }}');
  expect(formula).toContain('{!iconOnly && <span>配色</span>}');
});
it('the decorative inline icon cannot add another focus stop or accessible name',()=>{
  expect(formula).toContain('stroke="currentColor"');
  expect(formula).toContain('aria-hidden="true" focusable="false"');
  expect(formula).toContain("className={`home-color-action color-dialog-entry${iconOnly ? ' icon-only' : ''}`}");
});
it('round trailing action reserves 44px, uses the search surface and border, and adds no inline color',()=>{
  const action=css.match(/^\.home-color-action\.icon-only \{([^}]*)\}/m)![1];
  expect(action).toContain('width: 44px');expect(action).toContain('height: 44px');
  expect(action).toContain('min-width: 44px');expect(action).toContain('min-height: 44px');
  expect(action).toContain('border: 1px solid var(--border)');expect(action).toContain('border-radius: 50%');
  expect(action).toContain('background: var(--surface)');
  expect(action).not.toMatch(/#[0-9a-f]|rgb\(/i);
});
