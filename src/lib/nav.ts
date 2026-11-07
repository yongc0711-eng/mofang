/** 公式组页和详情页都属于“公式”这个 tab */
export const isFormulaPath = (pathname: string): boolean =>
  pathname === '/' || pathname.startsWith('/set/') || pathname.startsWith('/case/');

/**
 * 底部“公式”tab 的目标（T51）：
 * - 已经在公式区：回分区根 '/'（点当前 tab 仍能回首页）
 * - 在别的 tab（搜索、练习、我的…）：回上次看的详情页；没看过就是 '/'
 */
export function formulaTabTarget(pathname: string, lastCaseId: string | null | undefined): string {
  if (isFormulaPath(pathname)) return '/';
  return lastCaseId ? `/case/${lastCaseId}` : '/';
}
