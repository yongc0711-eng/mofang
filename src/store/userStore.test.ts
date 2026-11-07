import { beforeEach, describe, expect, it } from 'vitest';
import { getSet } from '../data';
import { algSolvesCase } from '../lib/cases';
import {
  addCustomAlg,
  exportUserData,
  importUserData,
  primaryAlgOf,
  removeCustomAlg,
  setPrimaryAlg,
} from './userStore';
import { type UserData } from '../types';

const empty: UserData = { version: 1, cases: {} };
const user = () => JSON.parse(exportUserData()) as UserData;

const [c, other] = getSet('pll')!.cases;
/** 一条能解决 c、写法和内置不同的公式：内置第一条前面加一对抵消的转动 */
const solving = `U U' ${c.algs[0]}`;
/** 肯定解决不了 c 的公式：另一个情形的公式 */
const wrong = other.algs[0];

describe('主公式', () => {
  beforeEach(() => importUserData(JSON.stringify(empty)));

  it('测试用的两条公式确实一条能解、一条不能', () => {
    expect(algSolvesCase(c, solving)).toBe(true);
    expect(algSolvesCase(c, wrong)).toBe(false);
  });

  it('能解决情形的自定义公式默认成为主公式', () => {
    addCustomAlg(c.id, solving);
    expect(primaryAlgOf(c, user())).toBe(solving);
  });

  it('强制保存（setPrimary=false）不改主公式，但会保存公式', () => {
    addCustomAlg(c.id, wrong, false);
    expect(user().cases[c.id].customAlgs).toContain(wrong);
    expect(user().cases[c.id].primaryAlg).toBeUndefined();
    expect(primaryAlgOf(c, user())).toBe(c.algs[0]);
  });

  it('已有主公式时强制保存不会把它顶掉', () => {
    addCustomAlg(c.id, solving);
    addCustomAlg(c.id, wrong, false);
    expect(primaryAlgOf(c, user())).toBe(solving);
  });

  it('主公式解决不了该情形时读取回退到 algs[0]（含导入的备份）', () => {
    addCustomAlg(c.id, wrong, false);
    setPrimaryAlg(c.id, wrong);
    expect(primaryAlgOf(c, user())).toBe(c.algs[0]);
  });

  it('内置备选公式仍可作为主公式', () => {
    const alt = c.algs[1] ?? c.algs[0];
    setPrimaryAlg(c.id, alt);
    expect(primaryAlgOf(c, user())).toBe(alt);
  });

  it('删除自定义公式后回到 algs[0]', () => {
    addCustomAlg(c.id, solving);
    removeCustomAlg(c.id, solving);
    expect(primaryAlgOf(c, user())).toBe(c.algs[0]);
  });
});
