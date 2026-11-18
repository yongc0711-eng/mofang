import { expect, test } from '@playwright/test';

test('学习中显示各组数量，练习本组同时限定阶数、公式组和状态', async ({ page }) => {
  await page.emulateMedia({ colorScheme: page.viewportSize()!.width === 320 ? 'dark' : 'light' });
  await page.addInitScript(() => localStorage.setItem('mofang.user.v1', JSON.stringify({
    version: 1,
    cases: {
      'pll-t': { status: 'learning' },
      'pll-aa': { status: 'mastered' },
      'oll-27': { status: 'learning' },
      'cll-as-1': { status: 'learning' },
      'cll-as-2': { status: 'learning' },
      'eg1-h-1': { status: 'learning' },
    },
  })));
  await page.goto('/#/me');
  await page.getByRole('link', { name: '5 学习中', exact: true }).click();

  const practice = page.locator('.practice-start');
  const status = page.getByRole('group', { name: '按学习状态筛选', exact: true });
  const sets = page.getByRole('group', { name: '选择公式组', exact: true });
  const sizes = page.getByRole('group', { name: '魔方阶数', exact: true });
  const pll = page.getByRole('region', { name: 'PLL', exact: true });
  await expect(pll.getByText('1 个学习中', { exact: true })).toBeVisible();
  await expect(page.getByRole('region', { name: 'OLL', exact: true }).getByText('1 个学习中', { exact: true })).toBeVisible();
  const link = pll.getByRole('link', { name: '练习本组：PLL', exact: true });
  expect((await link.boundingBox())!.height).toBeGreaterThanOrEqual(32);
  await link.click();
  await expect(sizes.getByRole('button', { name: '三阶', exact: true })).toHaveAttribute('aria-pressed', 'true');
  await expect(sets.getByRole('button', { name: 'PLL', exact: true })).toHaveAttribute('aria-pressed', 'true');
  await expect(status.getByRole('button', { name: '学习中', exact: true })).toHaveAttribute('aria-pressed', 'true');
  await expect(practice).toContainText('范围内共 1 个情形');

  await page.goBack();
  await sizes.getByRole('button', { name: '二阶', exact: true }).click();
  const cll = page.getByRole('region', { name: 'CLL', exact: true });
  await expect(cll.getByText('2 个学习中', { exact: true })).toBeVisible();
  await expect(cll.locator('.case-card')).toHaveCount(2);
  expect(await page.evaluate(() => document.documentElement.scrollWidth)).toBe(page.viewportSize()!.width);
  await cll.getByRole('link', { name: '练习本组：CLL', exact: true }).click();
  await expect(sizes.getByRole('button', { name: '二阶', exact: true })).toHaveAttribute('aria-pressed', 'true');
  await expect(sets.getByRole('button', { name: 'CLL', exact: true })).toHaveAttribute('aria-pressed', 'true');
  await expect(status.getByRole('button', { name: '学习中', exact: true })).toHaveAttribute('aria-pressed', 'true');
  await expect(practice).toContainText('范围内共 2 个情形');
  await sizes.getByRole('button', { name: '三阶', exact: true }).click();
  await expect(sets.getByRole('button', { name: 'PLL', exact: true })).toHaveAttribute('aria-pressed', 'true');
  await expect(practice).toContainText('范围内共 1 个情形');
});
