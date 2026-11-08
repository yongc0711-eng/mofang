import { createElement } from 'react';
import { renderToStaticMarkup } from 'react-dom/server';
import { MemoryRouter } from 'react-router-dom';
import { expect, it, vi } from 'vitest';
import { homeCards } from '../lib/homeCards';
import { SETS } from '../data';
import { HomePage } from './HomePage';
vi.mock('../store/userStore',async original=>({...await original<typeof import('../store/userStore')>(),useUserData:()=>({version:1,cases:{}})}));
vi.mock('../store/devicePrefs',async original=>{const actual=await original<typeof import('../store/devicePrefs')>();return {...actual,useDevicePrefs:()=>actual.getDevicePrefs()};});
const render=(query='')=>renderToStaticMarkup(createElement(MemoryRouter,{initialEntries:['/'+query]},createElement(HomePage)));
it('default and unknown flags retain the existing rendering, without a review selector taking height',()=>{
  expect(homeCards(null)).toBeUndefined();expect(homeCards('other')).toBeUndefined();expect(homeCards('A')).toBeUndefined();
  expect(render()).toBe(render('?cards=other'));expect(render()).not.toContain('data-cards=');
});
it.each(['a','b','c'] as const)('%s keeps every method Link, diagram, description and mastery/progress information',variant=>{
  const html=render('?cards='+variant);
  expect(html).toContain(`data-cards="${variant}"`);
  for(const id of ['f2l','oll','pll','cmll','lse'])expect(html).toContain(`href="/set/${id}"`);
  expect(html.match(/class="set-card"/g)).toHaveLength(5);expect(html.match(/class="diagram"/g)).toHaveLength(5);
  expect(html.match(/class="progress" aria-hidden="true"/g)).toHaveLength(5);expect(html.match(/已掌握 0 \/ /g)).toHaveLength(5);
  for(const set of SETS) { expect(html).toContain(set.name); expect(html).toContain(set.description); }
  expect(html.replace(` data-cards="${variant}"`,'')).toBe(render());
});

it.each(['a','b','c'] as const)('%s opts into mist without changing card content or structure',variant=>{
  const html=render('?cards='+variant+'&tone=mist');
  expect(html).toContain('data-card-tone="mist"');
  expect(html.replace(' data-card-tone="mist"','')).toBe(render('?cards='+variant));
});
it('mist is opt-in and cannot affect the default home without a card direction',()=>{
  expect(render('?tone=mist')).toBe(render());
  expect(render('?cards=a&tone=unknown')).toBe(render('?cards=a'));
});
