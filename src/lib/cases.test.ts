import { describe, expect, it } from 'vitest';
import { getSet } from '../data';
import { OLL_CASES } from '../data/oll';
import { STICKERS, applyMoves, invertMoves, solved, stickerAt, type State } from './cube';
import { parseAlg } from './alg';
import { type AlgCase } from '../types';
import { COLL_RULE, COLL_U_CORNER_TOP_LOCS, COLL_U_EDGE_TOP_LOCS, SBLS_FR_PAIR_LOCS, SBLS_RULE, SET_RULES, algSolvesCase, caseFingerprint, caseState, displayColors, isCollMask, isSblsPreserve, lintCase, lintCaseAlg, lintCollState, lintSblsState, viewCaseFor } from './cases';

const lse = (group: string, alg: string): AlgCase => ({ id: 'lse-x', set: 'lse', name: 'x', group, algs: [alg] });

describe('T71 COLL / SBLS 公共规则', () => {
  const setup = (alg: string) => applyMoves(solved(), invertMoves(parseAlg(alg)));
  const preserves = (st: State, mask: (id: number) => boolean) => st.every((id, loc) => !mask(loc) || id === loc);
  const colors = (st: State, mask: (id: number) => boolean) => st.map((id) => mask(id) ? STICKERS[id].face : null);

  it('COLL 精确显示 50 张，仅忽略顶层四棱侧面', () => {
    const hidden = STICKERS.filter((s) => !isCollMask(s.id));
    expect(STICKERS.filter((s) => isCollMask(s.id))).toHaveLength(50);
    expect(hidden.map((s) => s.face).sort()).toEqual(['B', 'F', 'L', 'R']);
    for (const s of hidden) {
      expect(s.p[1]).toBe(1);
      expect(s.p.filter((v) => v !== 0)).toHaveLength(2);
    }
    expect(COLL_U_EDGE_TOP_LOCS).toHaveLength(4);
    expect(COLL_U_CORNER_TOP_LOCS).toHaveLength(4);
    expect(COLL_RULE.preUs).toEqual([0, 1, 2, 3]);
    expect(COLL_RULE.preY).toEqual([0, 1, 2, 3]);
    expect(COLL_RULE.normalize).toBe(true);
  });

  it('SBLS 精确保留左桥 13 张与右后桥 8 张，目标槽 5 张', () => {
    const kept = STICKERS.filter((s) => isSblsPreserve(s.id));
    expect(kept).toHaveLength(21);
    expect(kept.filter((s) => s.p[0] === -1)).toHaveLength(13);
    expect(kept.filter((s) => s.p[0] === 1)).toHaveLength(8);
    expect(SBLS_FR_PAIR_LOCS).toHaveLength(5);
    expect(STICKERS.filter((s) => SBLS_RULE.solve(s.id))).toHaveLength(26);
    for (const s of STICKERS) {
      expect(isSblsPreserve(s.id)).toBe(s.p[0] !== 0 && s.p[1] !== 1 && !(s.p[0] === 1 && s.p[2] === 1 && s.p[1] <= 0));
    }
    expect(SBLS_RULE.preUs).toEqual([0]);
    expect(SBLS_RULE.preY).toEqual([0]);
    expect(SBLS_RULE.normalize).toBe(false);
  });

  it('COLL 合法起手保留 F2L，目标允许剩余 EPLL', () => {
    const alg = "R' U' R U' R' U2 R";
    const st = setup(alg);
    expect(lintCollState('coll-as-1', st, alg)).toEqual([]);
    expect(preserves(st, COLL_RULE.preserve)).toBe(true);
    const ua = getSet('pll')!.cases.find((c) => c.name === 'Ua')!;
    const epll = applyMoves(applyMoves(st, parseAlg(alg)), parseAlg(ua.algs[0]));
    expect(epll).not.toEqual(solved());
    expect(colors(epll, COLL_RULE.solve)).toEqual(colors(solved(), COLL_RULE.solve));
  });

  it.each(["F R U R' U' F'", "U' R' F R F' r U r'"])(
    'COLL 拦截翻转顶棱的 CMLL：%s', (alg) => {
      expect(lintCollState('bad-eo', setup(alg), alg)).toContain('bad-eo: COLL prerequisite violated — U-layer edges are not oriented');
    },
  );

  it('COLL 拦截破坏 DF/DB 的 CMLL', () => {
    expect(preserves(setup("r U' r' F R' F' R"), COLL_RULE.preserve)).toBe(false);
  });

  it('COLL 排除四角已朝上的 PLL，并拒绝主公式转体', () => {
    const t = "R U R' U' R' F R2 U' R' U' R U R' F'";
    expect(lintCollState('pll', setup(t), t)).toContain('pll: COLL state has all 4 U-corners already oriented (PLL/O case)');
    for (const axis of ['x', 'y', 'z']) {
      expect(lintCollState('rotation', setup("R' U' R U' R' U2 R"), `${axis} R`)).toContain('rotation: COLL algs[0] must not contain whole-cube rotations');
    }
  });

  it.each(["U R U2 R' U R U' R'", "M' r U' r' U2 r U r'"])(
    'SBLS 合法公式保持 21 张贴纸，允许 M 层中心偏移：%s', (alg) => {
      const st = setup(alg);
      expect(lintSblsState('sbls', st, [alg])).toEqual([]);
      expect(preserves(st, SBLS_RULE.preserve)).toBe(true);
      expect(colors(applyMoves(st, parseAlg(alg)), SBLS_RULE.solve)).toEqual(colors(solved(), SBLS_RULE.solve));
    },
  );

  it('SBLS 拦截破坏右后桥、已解决前槽和任意备选转体', () => {
    expect(preserves(setup("R' U R"), SBLS_RULE.preserve)).toBe(false);
    expect(lintSblsState('solved', solved(), ['U'])).toContain('solved: SBLS FR pair is already solved');
    const st = setup("R U R'");
    for (const alg of ['x', "y'", 'z2']) {
      expect(lintSblsState('rotation', st, ["R U R'", alg])).toContain(`rotation: SBLS alg (${alg}) must not contain whole-cube rotations`);
    }
  });
});

describe('LSE 校验', () => {
  it('EO：只要求朝向全对，其他公式解决不了', () => {
    const c = lse('EO', "M' U M'");
    expect(lintCase(c)).toEqual([]);
    expect(algSolvesCase(c, "M' U M'")).toBe(true);
    expect(algSolvesCase(c, 'U')).toBe(false);
  });
  it('步骤放错会被发现', () => {
    expect(lintCase(lse('EO', 'M2 U2 M2 U2'))).not.toEqual([]); // 朝向没变，不是 EO
    expect(lintCase(lse('4c', "M' U M'"))).not.toEqual([]); // 朝向错
    expect(lintCase(lse('4c', "M2 U M U2 M' U M2"))).not.toEqual([]); // 动了 UL/UR
    expect(lintCase(lse('UL/UR', 'M2 U2 M2 U2'))).not.toEqual([]); // UL、UR 已归位
    expect(lintCase(lse('其他', 'M2 U2 M2 U2'))).not.toEqual([]);
  });
  it('4c：必须完全还原，只差 U 层调整也算解决', () => {
    const c = lse('4c', 'M2 U2 M2 U2');
    expect(lintCase(c)).toEqual([]);
    expect(algSolvesCase(c, 'M2 U2 M2 U2')).toBe(true);
    expect(algSolvesCase(c, 'M2 U2 M2')).toBe(true);
    expect(algSolvesCase(c, 'M2')).toBe(false);
  });
  it('只能用 M 和 U', () => {
    expect(lintCase(lse('4c', "R U R'"))).not.toEqual([]);
  });
  it('LSE 备选公式即使能还原，带 R 也必须校验失败', () => {
    const c = lse('4c', 'M2 U2 M2 U2');
    c.algs.push("M2 U2 M2 U2 R R'");
    expect(lintCase(c)).toContain('只能使用 MU 转动，出现了 R');
  });
  it('LSE 自定义公式即使能还原，带 R 也必须校验失败', () => {
    const c = lse('4c', 'M2 U2 M2 U2');
    expect(algSolvesCase(c, "M2 U2 M2 U2 R R'")).toBe(false);
  });
  it('单条公式检查供自定义公式共用，合法 M/U 公式仍通过', () => {
    const c = lse('4c', 'M2 U2 M2 U2');
    expect(lintCaseAlg(c, "M2 U2 M2 U2 R R'")).toEqual(['只能使用 MU 转动，出现了 R']);
    expect(lintCaseAlg(c, "M' U2 M U'")).toEqual([]);
    c.algs.push(c.algs[0], "M2 U2 M2 U2 R R'");
    expect(lintCase(c)).toContain('只能使用 MU 转动，出现了 R');
  });
  it('EO 指纹只看好棱坏棱，排列不同也算同一情形', () => {
    expect(caseFingerprint(lse('EO', "M' U M'"))).toBe(caseFingerprint(lse('EO', "M' U M' U2 M2 U2 M2")));
  });
});

describe('其他公式组不受影响', () => {
  it('错误公式会被拒绝', () => {
    const t: AlgCase = { id: 'pll-t', set: 'pll', name: 'T', group: 'x', algs: ["R U R' U' R' F R2 U' R' U' R U R' F'"] };
    expect(algSolvesCase(t, "R U R'")).toBe(false);
  });
});

describe('F2L 不允许前置 U', () => {
  const c = getSet('f2l')!.cases[0];
  it('定义公式本身仍能解决情形', () => {
    expect(algSolvesCase(c, c.algs[0])).toBe(true);
  });
  it("前面多一个 U' 等于换了另一个情形，不能当作解", () => {
    expect(algSolvesCase(c, "U' " + c.algs[0])).toBe(false);
  });
});

describe('OLL 显示整个顶层（T20）', () => {
  for (const c of OLL_CASES) {
    it(`${c.id}：恰好显示顶层 21 张贴纸`, () => {
      expect(displayColors(c).filter((color) => color !== null)).toHaveLength(21);
    });
    it(`${c.id}：四个侧面顶行 12 个位置逐格可见`, () => {
      const colors = displayColors(c);
      for (const t of [-1, 0, 1]) {
        expect(colors[stickerAt([t, 1, 1], [0, 0, 1])], `F ${t}`).not.toBeNull();
        expect(colors[stickerAt([t, 1, -1], [0, 0, -1])], `B ${t}`).not.toBeNull();
        expect(colors[stickerAt([1, 1, t], [1, 0, 0])], `R ${t}`).not.toBeNull();
        expect(colors[stickerAt([-1, 1, t], [-1, 0, 0])], `L ${t}`).not.toBeNull();
      }
    });
  }
});

describe('图解按所选公式对齐（viewCaseFor）', () => {
  // 同一情形的不同公式，起手可能差一个 U：这里用 "U " + 定义公式 构造一条“前面多一个 U”的对照，
  // pre-U 取 3 就能抵消，所以 algSolvesCase 为 true，但它的逆作为起手和定义公式的不一样。
  const c = getSet('pll')!.cases[0];
  const shifted = 'U ' + c.algs[0];

  it('对照公式能解决该情形，但起手和定义公式不同', () => {
    expect(algSolvesCase(c, shifted)).toBe(true);
    expect(caseState({ ...c, algs: [shifted] })).not.toEqual(caseState(c));
  });

  it('选中这条公式时，图解用它的起手；颜色也随之不同', () => {
    const v = viewCaseFor(c, shifted);
    expect(v.algs).toEqual([shifted]);
    expect(caseState(v)).toEqual(caseState({ ...c, algs: [shifted] }));
    expect(displayColors(v)).not.toEqual(displayColors(c));
  });

  it('其余字段原样保留，不改原对象', () => {
    const v = viewCaseFor(c, shifted);
    expect(v).toMatchObject({ id: c.id, name: c.name, group: c.group, set: c.set, recognition: c.recognition });
    expect(c.algs[0]).not.toBe(shifted);
  });

  it('选的是定义公式本身：起手和 c 一致', () => {
    const v = viewCaseFor(c, c.algs[0]);
    expect(caseState(v)).toEqual(caseState(c));
  });

  it('解决不了该情形的公式：回退到 c 本身，不显示错起手', () => {
    const other = getSet('pll')!.cases[1];
    expect(algSolvesCase(c, other.algs[0])).toBe(false);
    expect(viewCaseFor(c, other.algs[0])).toBe(c);
  });

  it('格式有误的公式：不抛错，回退到 c', () => {
    expect(viewCaseFor(c, 'X Q')).toBe(c);
    expect(viewCaseFor(c, '')).toBe(c);
  });

  it('违反转动限制的公式（LSE 只能 M/U）：回退到 c', () => {
    const lse = getSet('lse')!.cases.find((x) => x.group === '4c')!;
    expect(viewCaseFor(lse, "R U R'")).toBe(lse);
  });

  it('F2L 不允许前置 U：多一个 U 的公式不算解，回退到 c', () => {
    const f2l = getSet('f2l')!.cases[0];
    expect(algSolvesCase(f2l, "U' " + f2l.algs[0])).toBe(false);
    expect(viewCaseFor(f2l, "U' " + f2l.algs[0])).toBe(f2l);
  });

  it('LSE 允许前置 U：起手随公式变化', () => {
    const lse = getSet('lse')!.cases.find((x) => x.group === '4c')!;
    const alt = 'U2 ' + lse.algs[0];
    expect(algSolvesCase(lse, alt)).toBe(true);
    expect(viewCaseFor(lse, alt).algs).toEqual([alt]);
  });
});

describe('WV 规则与拒绝条件', () => {
  const S = STICKERS;
  const caseAt = (n: number) => getSet('wv')!.cases[n - 1];
  it('规则精确保护 28、显示/完成 42 张；只忽略顶层侧面 12 张', () => {
    const rule = SET_RULES.wv;
    expect(S.filter((s) => rule.preserve(s.id))).toHaveLength(28);
    for (const mask of [rule.display, rule.solve]) {
      expect(S.filter((s) => mask(s.id))).toHaveLength(42);
      expect(S.filter((s) => !mask(s.id)).every((s) => s.p[1] === 1 && s.face !== 'U')).toBe(true);
    }
    expect(rule.preUs).toEqual([0]);expect(rule.preY).toEqual([0]);expect(rule.normalize).toBe(false);
  });

  it('接受后置 AUF，拒绝错误前置 U、SV 姿态、坏棱、保护区破坏与未完成 OLL', () => {
    const c = caseAt(1);
    expect(lintCase(c)).toEqual([]);
    expect(algSolvesCase(c, c.algs[0] + ' U')).toBe(true);
    expect(algSolvesCase(c, 'U ' + c.algs[0])).toBe(false);
    expect(lintCase({ ...c, algs: ["R U' R'"] })).toContain(`${c.id}: WV 起手 UFR 角块不是相连的 DFR 角块姿态`);
    expect(lintCase({ ...c, algs: ["U' R U R'"] })).toContain(`${c.id}: WV 起手 UFR 角块不是相连的 DFR 角块姿态`);
    expect(lintCase({ ...c, algs: ["F R' F' R"] })).toContain(`${c.id}: WV 起手顶层棱块朝向未完成`);
    expect(lintCase({ ...c, algs: ["L' U' L U R U' R'"] })).toContain('定义公式破坏了本该保持不动的块');
    expect(algSolvesCase(c, "U R U' R'")).toBe(false);
  });

  it('自定义与备选公式同样拒绝整体转体和 M 中心偏移', () => {
    const c = caseAt(1);
    for (const axis of ['x', 'y', 'z']) {
      const alg = `${c.algs[0]} ${axis} ${axis}'`;
      expect(lintCaseAlg(c, alg)).toContain('WV 公式不允许包含整体转体 x/y/z');
      expect(lintCase({ ...c, algs: [c.algs[0], alg] })).toContain('WV 公式不允许包含整体转体 x/y/z');
      expect(algSolvesCase(c, alg)).toBe(false);
    }
    expect(lintCaseAlg(c, "U r U' l'")).toContain('WV 公式导致中心块偏移');
    expect(lintCaseAlg(c, c.algs[0] + ' M')).toContain('WV 公式导致中心块偏移');
    expect(algSolvesCase(c, c.algs[0] + ' M')).toBe(false);
  });
});
