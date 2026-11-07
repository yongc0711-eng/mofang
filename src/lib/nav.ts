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