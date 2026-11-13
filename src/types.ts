export type MethodId = 'cfop' | 'roux' | '2x2';
export type SetId = 'f2l' | 'oll' | 'pll' | 'coll' | 'wv' | 'cmll' | 'lse' | 'sbls' | 'eolr' | 'cll' | 'eg1' | 'eg2';

/** 一个公式情形。图解由 algs[0] 的逆推导出，所以 algs[0] 决定这个情形的“标准摆法”。 */
export interface AlgCase {
  /** 全站唯一，形如 pll-t、oll-27 */
  id: string;
  set: SetId;
  /** 显示名，如 “T”“OLL 27” */
  name: string;
  /** 分组，用于筛选，如 “只换角” */
  group: string;
  /** 至少一条。第一条为定义公式，其余为备选 */
  algs: string[];
  /** EOLR 独立起手；旧情形仍由定义公式的逆推导。 */
  setup?: string;
  targetTier?: 'tier1' | 'tier2' | 'tier3';
  continuationAlg?: string;
  /** Tier 1 的精确化归特征，不能仅以坏棱数量判定。 */
  reductionKey?: string;
  isBadCase?: boolean;
  sourceCase?: string;
  /** 可选：搜索用的别名，如 “小鱼”“Sune” */
  aliases?: string[];
  /** 可选：识别要点 */
  recognition?: string;
}

export interface CaseSet {
  id: SetId;
  method: MethodId;
  name: string;
  description: string;
  /** 这一组公式的标准数量；LSE 不是固定情形集，填 null */
  expectedCount: number | null;
  /** 录入完成后改为 true，测试会严格检查数量 */
  complete: boolean;
  /** 列表和详情使用的图解视角 */
  view: 'top' | 'iso' | 'lse' | 'top2' | 'both2';
  cases: AlgCase[];
}

export type LearnStatus = 'none' | 'learning' | 'mastered';

export interface UserCaseData {
  status?: LearnStatus;
  favorite?: boolean;
  customAlgs?: string[];
  /** 用户选定的主公式，可以是内置公式或自定义公式 */
  primaryAlg?: string;
  /** 练习用时（毫秒），最近的在最后，最多保留 10 条。旧备份没有这个字段 */
  times?: number[];
}

export interface UserData {
  version: 1;
  cases: Record<string, UserCaseData>;
}
