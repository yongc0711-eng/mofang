import { createElement } from 'react';
import { renderToStaticMarkup } from 'react-dom/server';
import { MemoryRouter, Route, Routes } from 'react-router-dom';
import { beforeEach, expect, it, vi } from 'vitest';
import { ALL_CASES, getCase } from '../data';
import { CasePage } from './CasePage';
import { readCaseSelection, rememberCaseSelection } from '../lib/caseSelection';
import type { AlgCase, UserData } from '../types';

const store = vi.hoisted(() => ({ user: { version: 1, cases: {} } as UserData }));
vi.mock('../store/userStore', async (original) => ({
  ...(await original<typeof import('../store/userStore')>()),
  useUserData: () => store.user,
}));
vi.mock('../store/devicePrefs', async (original) => ({
  ...(await original<typeof import('../store/devicePrefs')>()),
  useDevicePrefs: () => ({ finish: 'matte', focusRelevant: false, bottomColor: 'white' }),
}));
vi.mock('../components/CubePlayer', () => ({ CubePlayer: ({ alg }: { alg: string }) => createElement('div', { 'data-playing': alg }) }));
vi.mock('../components/CaseDiagram', () => ({ CaseDiagram: ({ c }: { c: AlgCase }) => createElement('div', { 'data-diagram-alg': c.algs[0] }) }));

const c = getCase('pll-t')!;
const other = getCase('oll-27')!;
const chosen = `U ${c.algs[0]}`;
const customPrimary = `U2 ${c.algs[0]}`;
// Each call renders an independent component root, so React-local state from the previous render is gone.
const mount = (id = c.id) => renderToStaticMarkup(createElement(MemoryRouter, { initialEntries: [`/case/${id}`] },
  createElement(Routes, null, createElement(Route, { path: '/case/:caseId', element: createElement(CasePage) })),
));
const player = (html: string) => html.match(/data-playing="([^"]*)"/)?.[1];
const escaped = (value: string) => value.replaceAll("'", '&#x27;');
beforeEach(() => {
  store.user = { version: 1, cases: {} };
  rememberCaseSelection(c.id, null);
  rememberCaseSelection(other.id, null);
});

it('T49 independent remount of the same case restores the selected formula for player and diagram', () => {
  store.user.cases[c.id] = { customAlgs: [chosen] };
  rememberCaseSelection(c.id, chosen);
  const first = mount();
  expect(player(first)).toBe(escaped(chosen));
  expect(first).toContain(`data-diagram-alg="${escaped(chosen)}"`);
  mount(other.id); // Discard the first root and visit a different page/case.
  const remounted = mount();
  expect(player(remounted)).toBe(escaped(chosen));
  expect(remounted).toContain(`data-diagram-alg="${escaped(chosen)}"`);
});
it('T49 case IDs are isolated even when a selected string is also available on another case', () => {
  store.user.cases[c.id] = { customAlgs: [chosen] };
  store.user.cases[other.id] = { customAlgs: [chosen] };
  rememberCaseSelection(c.id, chosen);
  expect(readCaseSelection(other, [chosen])).toBeNull();
  expect(player(mount(other.id))).toBe(escaped(other.algs[0]));
  expect(player(mount())).toBe(escaped(chosen));
});
it('T49 removed custom selection is cleared and falls back to the current primary without resurrecting', () => {
  store.user.cases[c.id] = { customAlgs: [chosen, customPrimary], primaryAlg: customPrimary };
  rememberCaseSelection(c.id, chosen);
  expect(player(mount())).toBe(escaped(chosen));
  store.user.cases[c.id].customAlgs = [customPrimary];
  expect(player(mount())).toBe(escaped(customPrimary));
  expect(readCaseSelection(c, [customPrimary])).toBeNull();
  store.user.cases[c.id].customAlgs = [chosen, customPrimary];
  expect(player(mount())).toBe(escaped(customPrimary));
});
it('T49 stale built-in formula is discarded when no longer in the available list', () => {
  rememberCaseSelection(c.id, c.algs[0]);
  expect(readCaseSelection({ ...c, algs: ['R'] })).toBeNull();
  expect(readCaseSelection(c)).toBeNull();
});
it('T49 no selection still uses a user primary, or algs[0] when no primary exists', () => {
  expect(player(mount())).toBe(escaped(c.algs[0]));
  store.user.cases[c.id] = { customAlgs: [customPrimary], primaryAlg: customPrimary };
  expect(player(mount())).toBe(escaped(customPrimary));
});
it('T49 explicit removal of the active choice returns immediately to primary and stays cleared on remount', () => {
  store.user.cases[c.id] = { customAlgs: [chosen] };
  rememberCaseSelection(c.id, chosen);
  expect(player(mount())).toBe(escaped(chosen));
  rememberCaseSelection(c.id, null);
  expect(player(mount())).toBe(escaped(c.algs[0]));
  expect(player(mount())).toBe(escaped(c.algs[0]));
});
it('T49 remembering selection never mutates user data or its backup contents', () => {
  const before = JSON.stringify(store.user);
  rememberCaseSelection(c.id, chosen);
  readCaseSelection(c, [chosen]);
  expect(JSON.stringify(store.user)).toBe(before);
});

it('T49 existing built-in alternatives also survive a fresh component mount', () => {
  const builtin = ALL_CASES.find((item) => item.algs.length > 1)!;
  expect(builtin).toBeDefined();
  rememberCaseSelection(builtin.id, builtin.algs[1]);
  expect(player(mount(builtin.id))).toBe(escaped(builtin.algs[1]));
  expect(player(mount(builtin.id))).toBe(escaped(builtin.algs[1]));
  rememberCaseSelection(builtin.id, null);
});
