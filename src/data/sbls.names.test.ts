import { describe, expect, it } from 'vitest';
import { SBLS_CASES } from './sbls';
import { algSolvesCase, caseState, lintCase } from '../lib/cases';
import { STICKERS, stickerAt, type Face } from '../lib/cube';
import { type AlgCase } from '../types';

const DFR_D = stickerAt([1, -1, 1], [0, -1, 0]);
const FR_R = stickerAt([1, 0, 1], [1, 0, 0]);
const FR_F = stickerAt([1, 0, 1], [0, 0, 1]);
const EDGE_POSITIONS: Record<string, string> = {
  '0,1,-1': 'UB', '1,1,0': 'UR', '0,1,1': 'UF', '-1,1,0': 'UL',
  '1,0,1': 'FR', '0,-1,-1': 'DB', '0,-1,1': 'DF',
};
const CORNER_GROUPS: Record<string, string> = {
  U: 'Corner on U facing up', Up: 'Corner on U oriented', Um: 'Corner on U misoriented',
  D: 'Corner on D solved', Dp: 'Corner on D facing forward', Dm: 'Corner on D facing side',
};

/** No reference algorithms or production masks: read the two physical cubies directly. */
function physicalName(c: AlgCase) {
  const st = caseState(c);
  const corner = STICKERS[st.indexOf(DFR_D)];
  const top = corner.p[1] === 1;
  expect(corner.p).toEqual([1, top ? 1 : -1, 1]);
  const codes: Partial<Record<Face, string>> = top ? { U: 'U', R: 'Up', F: 'Um' } : { D: 'D', F: 'Dp', R: 'Dm' };
  const code = codes[corner.face];
  expect(code).toBeDefined();

  const r = STICKERS[st.indexOf(FR_R)], f = STICKERS[st.indexOf(FR_F)];
  expect(r.p).toEqual(f.p);
  const pos = EDGE_POSITIONS[r.p.join(',')];
  expect(pos).toBeDefined();
  const upper = r.p[1] === 1;
  if (!top && upper) expect(pos).toBe('UR');
  const isM = r.face === (upper ? 'U' : pos === 'FR' ? 'F' : 'D');
  // The other orientation is also pinned, rather than treating every non-m face as valid.
  if (upper) expect([r.face, f.face]).toContain('U');
  else if (pos === 'FR') expect([r.face, f.face].sort()).toEqual(['F', 'R']);
  else expect([r.face, f.face]).toContain('D');
  const name = `${code} ${!top && upper ? 'U' : pos}${isM ? 'm' : ''}`;
  return { name, group: CORNER_GROUPS[code!] };
}

describe('SBLS 名称来自真实 DFR 角 / FR 棱的位置与朝向', () => {
  for (const c of SBLS_CASES) {
    it(`${c.id}: 物理状态、名称、分类和稳定 ID 精确一致`, () => {
      expect(physicalName(c)).toEqual({ name: c.name, group: c.group });
      expect(c.id).toBe('sbls-' + c.name.toLowerCase().replace(/\s+/g, '-'));
    });
  }

  it('恰好覆盖六组 65 个合法组合，排除已解决的 D FR', () => {
    const names = Object.keys(CORNER_GROUPS).flatMap((code) => {
      const positions = code.startsWith('U') ? ['UB', 'UR', 'UF', 'UL', 'FR', 'DB', 'DF'] : ['U', 'FR', 'DB', 'DF'];
      return ['', 'm'].flatMap((suffix) => positions.map((pos) => `${code} ${pos}${suffix}`));
    }).filter((name) => name !== 'D FR');
    expect(names).toHaveLength(65);
    expect(SBLS_CASES.map((c) => c.name).sort()).toEqual(names.sort());
    expect(Object.fromEntries(Object.entries(CORNER_GROUPS).map(([code, group]) => [code, SBLS_CASES.filter((c) => c.group === group).length])))
      .toEqual({ U: 14, Up: 14, Um: 14, D: 7, Dp: 8, Dm: 8 });
  });

  it('原来源标题 Up UF 的算法实际对应 Up UL，不能照搬到 Up UF', () => {
    const uf = SBLS_CASES.find((c) => c.id === 'sbls-up-uf')!;
    const mislabeled = { ...uf, algs: ["r U' r' U' r U' r'"] };
    expect(physicalName(mislabeled)).toEqual({ name: 'Up UL', group: CORNER_GROUPS.Up });
    expect(physicalName(mislabeled).name).not.toBe(uf.name);
    expect(algSolvesCase(uf, mislabeled.algs[0])).toBe(false);
  });

  it('保持原桥块保护、固定起手 U，并拒绝已解决槽和任意公式转体', () => {
    const base = SBLS_CASES.find((c) => c.id === 'sbls-u-ur')!;
    expect(lintCase({ ...base, algs: ["R' U R"] })).toContain('定义公式破坏了本该保持不动的块');
    expect(lintCase({ ...base, algs: ['L'] })).toContain('定义公式破坏了本该保持不动的块');
    expect(algSolvesCase(base, `U ${base.algs[0]}`)).toBe(false);
    expect(lintCase({ ...base, algs: ['U'] })).toContain(`${base.id}: SBLS FR pair is already solved`);
    expect(lintCase({ ...base, algs: [base.algs[0], 'x'] })).toContain(`${base.id}: SBLS alg (x) must not contain whole-cube rotations`);
  });
});
