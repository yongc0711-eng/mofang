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
  timeStats,
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

describe('备份逐字段清洗（T11）', () => {
  beforeEach(() => importUserData(JSON.stringify(empty)));

  it('times: 5 导入成功且统计为 null，其他字段和情形保留', () => {
    importUserData(JSON.stringify({ version: 1, cases: {
      x: { times: 5, favorite: true }, other: { status: 'learning', times: [3000] },
    } }));
    expect(timeStats('x', user())).toBeNull();
    expect(user().cases.x).toEqual({ favorite: true });
    expect(user().cases.other).toEqual({ status: 'learning', times: [3000] });
  });

  it('times 数组只保留有限且大于零的数字', () => {
    // 1e400 是合法 JSON 数字文本，解析后为 Infinity。
    importUserData('{"version":1,"cases":{"x":{"times":[1000,-5,"x",null,2000,0,1e400,-1e400]}}}');
    expect(user().cases.x.times).toEqual([1000, 2000]);
    expect(timeStats('x', user())).toEqual({ last: 2000, avg: 1500, best: 1000, count: 2 });
  });

  it.each([null, 5, [], 'bad', true].map((value) => [value]))('非普通对象情形 %j 只丢该条', (bad) => {
    importUserData(JSON.stringify({ version: 1, cases: { bad, good: { favorite: false } } }));
    expect(user().cases).toEqual({ good: { favorite: false } });
  });

  it.each([null, 5, '123', {}, true])('非数组 times %j 只丢该字段', (times) => {
    importUserData(JSON.stringify({ version: 1, cases: { x: { times, primaryAlg: 'R' } } }));
    expect(user().cases.x).toEqual({ primaryAlg: 'R' });
    expect(timeStats('x', user())).toBeNull();
  });

  it('逐字段筛选类型并丢掉未知字段，保留未知 ID', () => {
    importUserData(JSON.stringify({ version: 1, extra: true, cases: {
      'future-case': { status: 'bad', favorite: 'yes', primaryAlg: 5, customAlgs: ['R', null, 5, '', 'U'], extra: 1 },
      valid: { status: 'none', favorite: false, primaryAlg: '', customAlgs: [], times: [] },
      learning: { status: 'learning' }, mastered: { status: 'mastered' },
    } }));
    expect(user()).toEqual({ version: 1, cases: {
      'future-case': { customAlgs: ['R', '', 'U'] },
      valid: { status: 'none', favorite: false, primaryAlg: '', customAlgs: [], times: [] },
      learning: { status: 'learning' }, mastered: { status: 'mastered' },
    } });
    expect(timeStats('valid', user())).toBeNull();
  });

  it.each([null, 5, 'R', {}])('非数组 customAlgs %j 丢掉字段', (customAlgs) => {
    importUserData(JSON.stringify({ version: 1, cases: { x: { customAlgs, favorite: true } } }));
    expect(user().cases.x).toEqual({ favorite: true });
  });

  it('旧版备份不带 times 仍可完整导入', () => {
    const backup = { version: 1, cases: { [c.id]: { status: 'learning', favorite: true, customAlgs: [solving], primaryAlg: solving } } };
    importUserData(JSON.stringify(backup));
    expect(user()).toEqual(backup);
    expect(timeStats(c.id, user())).toBeNull();
  });

  it.each(['{', 'null', '[]', '5', '{}', '{"version":2,"cases":{}}', '{"version":1,"cases":null}', '{"version":1,"cases":[]}', '{"version":1,"cases":5}'])('顶层非法 %s 抛统一错误且现有数据不变', (json) => {
    addCustomAlg(c.id, solving);
    const before = exportUserData();
    expect(() => importUserData(json)).toThrow('不是有效的备份文件');
    expect(exportUserData()).toBe(before);
  });
});
