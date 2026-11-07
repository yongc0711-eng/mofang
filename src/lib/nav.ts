/** 公式组页和详情页都属于“公式”这个 tab */
export const isFormulaPath = (pathname: string): boolean =>
  pathname === '/' || pathname.startsWith('/set/') || pathname.startsWith('/case/');

/**
 * 底部“公式”tab 的目标（T51/T54）：
 * - 已经在公式区：回分区根 '/'（点当前 tab 仍能回首页）
 * - 在别的 tab（搜索、练习、我的…）：回上次停留的公式页
 *   （首页/组页/详情页都算；组页没选具体公式时也能回到组页）
 * - 没有公式页记录时退回上次详情页，再没有就是 '/'
 */
export function formulaTabTarget(
  pathname: string,
  lastFormulaPath: string | null | undefined,
  lastCaseId: string | null | undefined,
): string {
  if (isFormulaPath(pathname)) return '/';
  if (lastFormulaPath && isFormulaPath(lastFormulaPath)) return lastFormulaPath;
  return lastCaseId ? `/case/${lastCaseId}` : '/';
}

/** 底部 tab 链接带的路由 state：记住这一步是从哪个公式页（首页/组页）出来的（T55） */
export interface TabNavState {
  fromFormula?: string;
}

const isDetailPath = (pathname: string) => pathname.startsWith('/case/');
const isOtherTab = (pathname: string) => pathname === '/search' || pathname === '/practice' || pathname === '/me';

/**
 * 去搜索/练习/我的的链接带什么 state（T55）：
 * - 从首页/组页出去是 push，历史里保留着这个公式页，记下它（fromFormula）；
 * - 从别的 tab 出去是 replace，上一条历史没变，把已有的 fromFormula 带过去；
 * - 从详情出去是 replace，详情本来就被换掉了，什么都不带。
 */
export function tabLinkState(pathname: string, current: unknown): TabNavState | undefined {
  if (isDetailPath(pathname)) return undefined;
  if (isFormulaPath(pathname)) return { fromFormula: pathname };
  if (isOtherTab(pathname)) {
    const from = (current as TabNavState | null | undefined)?.fromFormula;
    return typeof from === 'string' ? { fromFormula: from } : undefined;
  }
  return undefined;
}

/**
 * 在别的 tab 点“公式”时，要不要直接后退一步（T55）：
 * 当前这条历史是从公式页 P push 出来的（state.fromFormula === P），而“公式”要回的正是 P
 * （lastFormulaPath === P），那么上一条历史就是 P，后退即可；如果改用 replace，历史里会多出一条重复的 P，
 * 要按两次返回才能离开。其他情况（详情、记录对不上、刷新后没有记录）保持原来的 replace。
 */
export function shouldPopToFormula(
  pathname: string,
  state: unknown,
  lastFormulaPath: string | null | undefined,
): boolean {
  if (isFormulaPath(pathname)) return false;
  const from = (state as TabNavState | null | undefined)?.fromFormula;
  return typeof from === 'string' && isFormulaPath(from) && from === lastFormulaPath;
}
