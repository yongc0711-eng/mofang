import { expect, test } from '@playwright/test';

test.beforeEach(async ({ page }) => {
  await page.emulateMedia({ colorScheme: page.viewportSize()!.width === 320 ? 'dark' : 'light' });
  await page.addInitScript(() => localStorage.setItem('mofang.user.v1', JSON.stringify({
    version: 1,
    cases: { 'pll-t': { favorite: true }, 'cll-as-1': { favorite: true } },
  })));
});

test('从我的查看两阶收藏，详情取消收藏后返回原阶数', async ({ page }) => {
  await page.goto('/#/me');
  await page.getByRole('link', { name: '2 收藏', exact: true }).click();
  await expect(page.getByRole('heading', { name: '我的收藏', exact: true })).toBeVisible();
  await expect(page.locator('.case-card')).toHaveCount(1);
  await expect(page.getByRole('region', { name: 'PLL', exact: true }).locator('.case-card')).toHaveAttribute('href', '#/case/pll-t');
  const size = page.getByRole('group', { name: '收藏阶数' });
  await size.getByRole('button', { name: '二阶', exact: true }).click();
  const caseLink = page.getByRole('region', { name: 'CLL', exact: true }).locator('.case-card');
  await expect(caseLink).toHaveAttribute('href', '#/case/cll-as-1');
  expect(await page.evaluate(() => document.documentElement.scrollWidth)).toBe(page.viewportSize()!.width);
  await caseLink.click();
  await page.getByRole('button', { name: '★ 已收藏', exact: true }).click();
  await page.getByRole('button', { name: '‹ 返回', exact: true }).click();
  await expect(size.getByRole('button', { name: '二阶', exact: true })).toHaveAttribute('aria-pressed', 'true');
  await expect(page.getByRole('status')).toContainText('还没有二阶收藏');
  await expect(page.getByRole('link', { name: '练习收藏', exact: true })).toHaveCount(0);
  await page.getByRole('button', { name: '‹ 我的', exact: true }).click();
  await expect(page.getByRole('link', { name: '1 收藏', exact: true })).toBeVisible();
});

test('收藏练习限定当前阶数，保留另一阶的范围和未结束会话', async ({ page }) => {
  await page.goto('/#/practice');
  const sizes = page.getByRole('group', { name: '魔方阶数' });
  const filters = page.getByRole('group', { name: '按学习状态筛选' });
  const pll = page.getByRole('group', { name: '选择公式组' }).getByRole('button', { name: 'PLL', exact: true });
  const navToMe = page.getByRole('navigation').getByRole('link', { name: '我的', exact: true });
  await pll.click();
  await navToMe.click();
  await page.getByRole('link', { name: '2 收藏', exact: true }).click();
  await page.getByRole('group', { name: '收藏阶数' }).getByRole('button', { name: '二阶', exact: true }).click();
  await page.getByRole('link', { name: '练习收藏', exact: true }).click();
  await expect(sizes.getByRole('button', { name: '二阶', exact: true })).toHaveAttribute('aria-pressed', 'true');
  await expect(filters.getByRole('button', { name: '收藏', exact: true })).toHaveAttribute('aria-pressed', 'true');
  await expect(page.locator('.practice-start')).toContainText('范围内共 1 个情形');
  await sizes.getByRole('button', { name: '三阶', exact: true }).click();
  await expect(pll).toHaveAttribute('aria-pressed', 'true');
  await expect(page.locator('.practice-start')).toContainText('范围内共 21 个情形');
  await sizes.getByRole('button', { name: '二阶', exact: true }).click();
  await page.getByRole('button', { name: '开始练习', exact: true }).click();
  await expect(page.locator('.practice')).toHaveAttribute('data-phase', 'ready');
  await expect(page.locator('.practice-case')).toContainText('CLL');
  await navToMe.click();
  await page.getByRole('link', { name: '2 收藏', exact: true }).click();
  await page.getByRole('link', { name: '练习收藏', exact: true }).click();
  await expect(page.locator('.practice-case')).toContainText('CLL');
  await page.getByRole('button', { name: '‹ 结束', exact: true }).click();
  await expect(sizes.getByRole('button', { name: '三阶', exact: true })).toHaveAttribute('aria-pressed', 'true');
  await expect(filters.getByRole('button', { name: '收藏', exact: true })).toHaveAttribute('aria-pressed', 'true');
  await expect(page.locator('.practice-start')).toContainText('范围内共 1 个情形');
});
