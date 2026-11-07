import { type AlgCase, type SetId } from '../types';
import { parseAlg } from './alg';
import {
  STICKERS,
  applyMoves,
  invertMoves,
  normalizeRotation,
  solved,
  stickerAt,
  type Face,
  type Move,
  type State,
} from './cube';

/** 贴纸掩码：按“贴纸原本属于哪个块”决定是否显示，和块被转到哪里无关 */
export type Mask = (id: number) => boolean;

const S = STICKERS;
const isCorner = (id: number) => S[id].p.every((v) => v !== 0);
const inU = (id: number) => S[id].p[1] === 1;
/** 属于前两层（底层 + 中层）的块 */
const isF2LPiece = (id: number) => !inU(id);
/** 桥式左右两个 1x2x3 块，含左右中心，不含 M 层 */
const isRouxBlock = (id: number) => S[id].p[0] !== 0 && S[id].p[1] !== 1;
/** FR 槽位目标对：DFR 角和 FR 棱 */
const isFRPair = (id: number) => {
  const [x, y, z] = S[id].p;
  return x === 1 && z === 1 && y <= 0;
};
const uFace: Mask = (id) => S[id].face === 'U';

interface SetRule {
  /** 图解显示哪些贴纸的颜色，其余画成灰色 */
  display: Mask;
  /** 判定“已解决”时必须正确的贴纸 */
  solve: Mask;
  /** 公式从已还原状态执行后必须保持不动的位置，用于发现录错的公式 */
  preserve: Mask;
  /** 是否校正整体朝向。CMLL/LSE 的 M 层中心可能错位，不能校正 */
  normalize: boolean;
  /** 备选公式允许先做的整体 y 转动次数 */
  preY: number[];
  /** PLL 额外要求：不改变顶面朝向 */
  keepsUFace?: boolean;
  /** 只允许这些转动（LSE 只能 M/U） */
  allowedBases?: string;
}

export const SET_RULES: Record<SetId, SetRule> = {
  f2l: {
    display: isF2LPiece,
    solve: isF2LPiece,
    preserve: (id) => isF2LPiece(id) && !isFRPair(id),
    normalize: true,
    preY: [0],
  },
  oll: {
    display: (id) => isF2LPiece(id) || uFace(id),
    solve: (id) => isF2LPiece(id) || uFace(id),
    preserve: isF2LPiece,
    normalize: true,
    preY: [0, 1, 2, 3],
  },
  pll: {
    display: () => true,
    solve: () => true,
    preserve: isF2LPiece,
    normalize: true,
    preY: [0, 1, 2, 3],
    keepsUFace: true,
  },
  cmll: {
    display: (id) => isRouxBlock(id) || isCorner(id),
    solve: (id) => isRouxBlock(id) || isCorner(id),
    preserve: isRouxBlock,
    normalize: false,
    preY: [0, 2],
  },
  lse: {
    display: () => true,
    solve: (id) => isRouxBlock(id) || isCorner(id),
    preserve: isRouxBlock,
    normalize: false,
    preY: [0],
    allowedBases: 'MU',
  },
};

const turn = (base: string, n: number): Move[] =>
  n % 4 ? [{ base, amount: (n % 4) as Move['amount'] }] : [];

const finish = (state: State, set: SetId) =>
  SET_RULES[set].normalize ? normalizeRotation(state) : state;

type CaseRef = Pick<AlgCase, 'set' | 'algs' | 'group'>;

/** 这个情形的魔方状态：已还原状态执行定义公式的逆 */
export function caseState(c: Pick<AlgCase, 'set' | 'algs'>): State {
  return finish(applyMoves(solved(), invertMoves(parseAlg(c.algs[0]))), c.set);
}

/** 按掩码取每个位置的颜色串。比较颜色而不是贴纸编号，所以 OLL 不会受排列影响 */
function render(state: State, mask: Mask): string {
  return state.map((id) => (mask(id) ? S[id].face : '.')).join('');
}

/*
 * LSE 分三步，每步的“已解决”不同，由 group 决定：
 * - EO：六条棱朝向全对，排列不管
 * - UL/UR：朝向全对，且 UL、UR 两条棱归位
 * - 4c：全部还原
 */
export const LSE_STEPS = ['EO', 'UL/UR', '4c'] as const;
type LseStep = (typeof LSE_STEPS)[number];
const lseStepOf = (c: CaseRef): LseStep | null =>
  (LSE_STEPS as readonly string[]).includes(c.group) ? (c.group as LseStep) : null;

const UD_NORMAL = (y: number): [number, number, number] => [0, y, 0];
/** 六条棱朝 U/D 方向的贴纸位置 */
const EDGE_UD_LOCS = [
  stickerAt([0, 1, 1], UD_NORMAL(1)),
  stickerAt([0, 1, -1], UD_NORMAL(1)),
  stickerAt([-1, 1, 0], UD_NORMAL(1)),
  stickerAt([1, 1, 0], UD_NORMAL(1)),
  stickerAt([0, -1, 1], UD_NORMAL(-1)),
  stickerAt([0, -1, -1], UD_NORMAL(-1)),
];
const CENTER_U = stickerAt([0, 1, 0], UD_NORMAL(1));
const CENTER_D = stickerAt([0, -1, 0], UD_NORMAL(-1));
const isUD = (id: number) => S[id].face === 'U' || S[id].face === 'D';
const isLseEdge = (id: number) => !isCorner(id) && S[id].p[0] === 0 && S[id].p[1] !== 0 && S[id].p[2] !== 0;
const isLseEdgeOrCenter = (id: number) => isLseEdge(id) || id === CENTER_U || id === CENTER_D;
const isULUR = (id: number) => S[id].p[0] !== 0 && S[id].p[1] === 1 && S[id].p[2] === 0;
const blocksAndCorners: Mask = (id) => isRouxBlock(id) || isCorner(id);

const edgesOriented = (st: State) =>
  isUD(st[CENTER_U]) && isUD(st[CENTER_D]) && EDGE_UD_LOCS.every((loc) => isUD(st[loc]));

/** 状态是否已完成这一步，允许最后调整 U 层；前两步还允许调整 M 层 */
function lseStepDone(state: State, step: LseStep): boolean {
  const mask: Mask =
    step === '4c' ? () => true : step === 'UL/UR' ? (id) => blocksAndCorners(id) || isULUR(id) : blocksAndCorners;
  const target = render(solved(), mask);
  for (const m of step === '4c' ? [0] : [0, 1, 2, 3]) {
    for (let u = 0; u < 4; u++) {
      const st = applyMoves(state, [...turn('M', m), ...turn('U', u)]);
      if (render(st, mask) === target && (step === '4c' || edgesOriented(st))) return true;
    }
  }
  return false;
}

const LSE_DISPLAY: Record<LseStep, Mask> = {
  // EO 只看 U/D 色贴纸落在哪，其他信息画成灰色，避免干扰判断
  EO: (id) => isUD(id) && isLseEdgeOrCenter(id),
  'UL/UR': (id) => isULUR(id) || (isUD(id) && isLseEdgeOrCenter(id)),
  '4c': () => true,
};

/** 按情形检查单条公式的转动限制；格式错误沿用 parseAlg 的异常 */
export function lintCaseAlg(c: Pick<AlgCase, 'set'>, alg: string): string[] {
  const moves = parseAlg(alg);
  const { allowedBases } = SET_RULES[c.set];
  const bad = allowedBases && moves.find((m) => !allowedBases.includes(m.base));
  return bad ? [`只能使用 ${allowedBases} 转动，出现了 ${bad.base}`] : [];
}

/** 判断合规公式能否解决该情形，允许前后调整 U 层，部分组还允许先整体 y 转 */
export function algSolvesCase(c: CaseRef, alg: string): boolean {
  if (lintCaseAlg(c, alg).length) return false;
  const rule = SET_RULES[c.set];
  const moves = parseAlg(alg);
  if (c.set === 'lse') {
    const step = lseStepOf(c);
    if (!step) return false;
    const start = caseState(c);
    return [0, 1, 2, 3].some((pre) => lseStepDone(applyMoves(start, [...turn('U', pre), ...moves]), step));
  }
  const target = render(solved(), rule.solve);
  const start = caseState(c);
  for (const y of rule.preY) {
    for (let pre = 0; pre < 4; pre++) {
      const after = applyMoves(start, [...turn('U', pre), ...turn('y', y), ...moves]);
      const base = finish(after, c.set);
      for (let post = 0; post < 4; post++) {
        if (render(applyMoves(base, turn('U', post)), rule.solve) === target) return true;
      }
    }
  }
  return false;
}

/** 检查所有公式的转动限制及定义公式的不变量，空数组表示合规 */
export function lintCase(c: AlgCase): string[] {
  const rule = SET_RULES[c.set];
  const problems: string[] = [];
  for (const alg of c.algs) problems.push(...lintCaseAlg(c, alg));
  const after = caseState(c);
  if (!after.every((id, loc) => !rule.preserve(loc) || id === loc)) {
    problems.push('定义公式破坏了本该保持不动的块');
  }
  if (rule.keepsUFace && !after.every((id, loc) => S[loc].face !== 'U' || S[id].face === 'U')) {
    problems.push('PLL 公式改变了顶面朝向');
  }
  if (c.set === 'lse') {
    const step = lseStepOf(c);
    if (!step) {
      problems.push(`LSE 的 group 必须是 ${LSE_STEPS.join('、')} 之一`);
    } else {
      // 每步的起始状态必须正好停在上一步之后，否则说明公式放错了步骤
      const eo = lseStepDone(after, 'EO');
      const ulur = lseStepDone(after, 'UL/UR');
      if (step === 'EO' && eo) problems.push('EO 情形的棱朝向已经全对');
      if (step === 'UL/UR' && (!eo || ulur)) problems.push('UL/UR 情形应当朝向全对，且 UL、UR 未归位');
      if (step === '4c' && !ulur) problems.push('4c 情形应当朝向全对，且 UL、UR 已归位');
    }
  }
  return problems;
}

/**
 * 情形的等价类指纹：对 U 层前后调整和 y 共轭取最小显示串。
 * 两个情形指纹相同，说明同一情形被录入了两次。
 */
export function caseFingerprint(c: AlgCase): string {
  const rule = SET_RULES[c.set];
  const inv = invertMoves(parseAlg(c.algs[0]));
  const step = c.set === 'lse' ? lseStepOf(c) : null;
  if (step) {
    // 只比这一步关心的内容。EO 里中心 U/D 色朝上就不再动 M 层，
    // 因为 M2 会交换前后位置：F Arrow 和 B Arrow 只差一个 M2，但是两个情形。
    const start = caseState(c);
    const m =
      step === 'EO' && isUD(start[CENTER_U])
        ? 0
        : [0, 1, 2, 3].find((k) => S[applyMoves(start, turn('M', k))[CENTER_U]].face === 'U')!;
    const keys = [0, 1, 2, 3].map((u) => {
      const st = applyMoves(start, [...turn('M', m), ...turn('U', u)]);
      return step === 'EO'
        ? EDGE_UD_LOCS.map((loc) => (isUD(st[loc]) ? 'o' : 'x')).join('')
        : render(st, LSE_DISPLAY[step]);
    });
    return keys.sort()[0];
  }
  let best: string | null = null;
  for (const y of rule.preY) {
    for (let pre = 0; pre < 4; pre++) {
      for (let post = 0; post < 4; post++) {
        const seq = [...turn('y', y), ...turn('U', pre), ...inv, ...turn('U', post), ...turn('y', 4 - y)];
        const r = render(finish(applyMoves(solved(), seq), c.set), rule.display);
        if (best === null || r < best) best = r;
      }
    }
  }
  return best!;
}

/** 这个情形哪些贴纸要显示颜色，3D 播放器和图解共用 */
export function displayMask(c: Pick<AlgCase, 'set' | 'group'>): Mask {
  const step = c.set === 'lse' ? lseStepOf({ ...c, algs: [] }) : null;
  return step ? LSE_DISPLAY[step] : SET_RULES[c.set].display;
}

/** 图解使用：每个位置应显示的颜色（用原始面表示），null 为灰色 */
export function displayColors(c: CaseRef): (Face | null)[] {
  const step = c.set === 'lse' ? lseStepOf(c) : null;
  const mask = step ? LSE_DISPLAY[step] : SET_RULES[c.set].display;
  return caseState(c).map((id) => (mask(id) ? S[id].face : null));
}

/** 顶层角块和棱块的轮换结构，如 corners [3] 表示角三循环，PLL 校验用 */
export function cycleTypes(state: State): { corners: number[]; edges: number[] } {
  const faceIds = S.filter((s) => s.face === 'U' && (s.p[0] !== 0 || s.p[2] !== 0)).map((s) => s.id);
  const walk = (ids: number[]) => {
    const seen = new Set<number>();
    const lens: number[] = [];
    for (const id of ids) {
      if (seen.has(id)) continue;
      let cur = id;
      let len = 0;
      while (!seen.has(cur)) {
        seen.add(cur);
        cur = state[cur];
        len++;
      }
      if (len > 1) lens.push(len);
    }
    return lens.sort((a, b) => a - b);
  };
  return {
    corners: walk(faceIds.filter(isCorner)),
    edges: walk(faceIds.filter((id) => !isCorner(id))),
  };
}
