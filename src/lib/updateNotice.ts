/**
 * 更新提示条只在不含播放器和练习键盘的页面显示（T56-fix）。
 * 提示条在文档流里，显示时会把内容下推；详情页（3D 播放器、公式键盘）和练习页（按压区）
 * 按首屏预算排版（T48），不能被它改变可用高度。版本检查仍全局运行，离开这些页面后再显示。
 */
export function shouldShowUpdateNotice(pathname: string): boolean {
  if (pathname.startsWith('/case/')) return false;
  if (pathname === '/practice' || pathname.startsWith('/practice/')) return false;
  return true;
}
