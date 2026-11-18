import { expect, test } from '@playwright/test';

test.beforeEach(async ({ page }) => {
  await page.emulateMedia({ colorScheme: page.viewportSize()!.width === 320 ? 'dark' : 'light' });
  await page.addInitScript(() => localStorage.setItem('mofang.user.v1', JSON.stringify({
    version: 1,
    cases: {
      'pll-t': { status: 'learning' },
      'oll-27': { status: 'mastered' },
      'cll-as-1': { status: 'mastered' },
    },
  })));
});

test('我的按阶查看已掌握和学习中，详情改状态后两边计数同步', async ({ page }) => {
  await page.goto('/#/me');
  await page.getByRole('link', { name: '2 已掌握', exact: true }).click();
  await expect(page.getByRole('heading', { name: '已掌握', exact: true })).toBeVisible();
  const cards = page.locator('.case-card');
  await expect(cards).toHaveCount(1);
  await expect(cards.first()).toHaveAttribute('href', '#/case/oll-27');
  const size = page.getByRole('group', { name: '魔方阶数' });
  await size.getByRole('button', { name: '二阶', exact: true }).click();
  await expect(cards).toHaveCount(1);
  await expect(cards.first()).toHaveAttribute('href', '#/case/cll-as-1');
  expect(await page.evaluate(() => document.documentElement.scrollWidth)).toBe(page.viewportSize()!.width);
  await cards.first().click();
  await page.getByRole('group', { name: '学习状态', exact: true }).getByRole('button', { name: '学习中', exact: true }).click();
  await page.getByRole('button', { name: '‹ 返回', exact: true }).click();
  await expect(size.getByRole('button', { name: '二阶', exact: true })).toHaveAttribute('aria-pressed', 'true');
  await expect(page.getByRole('status')).toContainText('还没有标为「已掌握」的二阶情形');
  await page.getByRole('button', { name: '‹ 我的', exact: true }).click();
  await expect(page.getByRole('link', { name: '1 已掌握', exact: true })).toBeVisible();
  await page.getByRole('link', { name: '2 学习中', exact: true }).click();
  await expect(page.getByRole('heading', { name: '学习中', exact: true })).toBeVisible();
  await size.getByRole('button', { name: '二阶', exact: true }).click();
  await expect(cards).toHaveCount(1);
  await expect(cards.first()).toHaveAttribute('href', '#/case/cll-as-1');
});

test('两个状态的练习入口按当前阶数和学习状态预选', async ({ page }) => {
  for (const { label, count, size } of [
    { label: '已掌握', count: 2, size: '二阶' },
    { label: '学习中', count: 1, size: '三阶' },
  ]) {
    await page.goto('/#/me');
    await page.getByRole('link', { name: `${count} ${label}`, exact: true }).click();
    await page.getByRole('group', { name: '魔方阶数' }).getByRole('button', { name: size, exact: true }).click();
    await page.getByRole('link', { name: `练习${label}`, exact: true }).click();
    await expect(page.getByRole('group', { name: '魔方阶数' }).getByRole('button', { name: size, exact: true })).toHaveAttribute('aria-pressed', 'true');
    await expect(page.getByRole('group', { name: '按学习状态筛选' }).getByRole('button', { name: label, exact: true })).toHaveAttribute('aria-pressed', 'true');
    await expect(page.locator('.practice-start')).toContainText('范围内共 1 个情形');
  }
});
