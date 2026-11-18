import { test, expect, type Page } from '@playwright/test';

const button = (page: Page, group: string, name: string) => page
  .getByRole('group', { name: group, exact: true })
  .getByRole('button', { name, exact: true });

const size = (page: Page, name: string) => button(page, '魔方阶数', name);
const set = (page: Page, name: string) => button(page, '选择公式组', name);
const group = (page: Page, name: string) => button(page, '按分组筛选', name);
const status = (page: Page, name: string) => button(page, '按学习状态筛选', name);
const picked = (page: Page, name: string) => button(page, '选择情形', name);
const chooseCases = (page: Page) => page.getByRole('button', { name: '选择情形', exact: true });
const clearCases = (page: Page) => page.getByRole('button', { name: '清空选择', exact: true });

async function expectCount(page: Page, count: number) {
  await expect(page.locator('.practice-start')).toContainText(`范围内共 ${count} 个情形`);
}

test('切换阶数与离开页面后各自恢复公式组、分组、学习状态和手选情形', async ({ page }) => {
  await page.goto('/#/practice');
  await set(page, 'PLL').click();
  await group(page, '只换棱').click();
  await status(page, '未学').click();
  await expectCount(page, 4);
  await chooseCases(page).click();
  await picked(page, 'Aa').click();
  await expectCount(page, 1);

  await size(page, '二阶').click();
  await expectCount(page, 126);
  await expect(status(page, '全部')).toHaveAttribute('aria-pressed', 'true');
  await set(page, 'EG-1').click();
  await group(page, 'H').click();
  await status(page, '收藏').click();
  await expectCount(page, 0);
  await chooseCases(page).click();
  await picked(page, 'EG-1 H 1').click();
  await picked(page, 'EG-1 H 2').click();
  await expectCount(page, 2);

  await size(page, '三阶').click();
  await expect(set(page, 'PLL')).toHaveAttribute('aria-pressed', 'true');
  await expect(group(page, '只换棱')).toHaveAttribute('aria-pressed', 'true');
  await expect(status(page, '未学')).toHaveAttribute('aria-pressed', 'true');
  await expect(picked(page, 'Aa')).toHaveAttribute('aria-pressed', 'true');
  await expectCount(page, 1);
  await clearCases(page).click();
  await expectCount(page, 4);

  await size(page, '二阶').click();
  await page.getByRole('link', { name: '我的', exact: true }).click();
  await page.getByRole('link', { name: '练习', exact: true }).click();
  await expect(size(page, '二阶')).toHaveAttribute('aria-pressed', 'true');
  await expect(set(page, 'EG-1')).toHaveAttribute('aria-pressed', 'true');
  await expect(group(page, 'H')).toHaveAttribute('aria-pressed', 'true');
  await expect(status(page, '收藏')).toHaveAttribute('aria-pressed', 'true');
  for (const name of ['EG-1 H 1', 'EG-1 H 2']) await expect(picked(page, name)).toHaveAttribute('aria-pressed', 'true');
  await expectCount(page, 2);
  await clearCases(page).click();
  await expectCount(page, 0);
  await status(page, '全部').click();
  await expectCount(page, 4);
  expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(true);
});

test('组页直达只改对应阶数，详情返回保留后来切换的范围', async ({ page }) => {
  await page.goto('/#/practice');
  await size(page, '二阶').click();
  await set(page, 'EG-1').click();
  await group(page, 'H').click();
  await chooseCases(page).click();
  await picked(page, 'EG-1 H 1').click();
  await expectCount(page, 1);

  await page.goto('/#/set/eolr');
  await page.getByRole('link', { name: '练习 EOLR', exact: true }).click();
  await expect(size(page, '三阶')).toHaveAttribute('aria-pressed', 'true');
  await expect(set(page, 'EOLR')).toHaveAttribute('aria-pressed', 'true');
  await expectCount(page, 51);
  await size(page, '二阶').click();
  await expect(set(page, 'EG-1')).toHaveAttribute('aria-pressed', 'true');
  await expect(group(page, 'H')).toHaveAttribute('aria-pressed', 'true');
  await expectCount(page, 1);

  await page.getByRole('button', { name: '开始练习', exact: true }).click();
  const practice = page.locator('.practice');
  await expect(practice).toHaveAttribute('data-phase', 'ready');
  await page.keyboard.press('Space');
  await expect(practice).toHaveAttribute('data-phase', 'running');
  await page.keyboard.press('Space');
  await expect(practice).toHaveAttribute('data-phase', 'done');
  await page.getByRole('link', { name: '查看详情', exact: true }).click();
  await expect(page).toHaveURL(/#\/case\/eg1-h-1$/);
  await page.getByRole('button', { name: '‹ 返回', exact: true }).click();
  await expect(practice).toHaveAttribute('data-phase', 'done');
  await page.getByRole('button', { name: '‹ 结束', exact: true }).click();
  await expect(size(page, '二阶')).toHaveAttribute('aria-pressed', 'true');
  await expect(picked(page, 'EG-1 H 1')).toHaveAttribute('aria-pressed', 'true');
  await expectCount(page, 1);
  await size(page, '三阶').click();
  await expect(set(page, 'EOLR')).toHaveAttribute('aria-pressed', 'true');
  await expectCount(page, 51);
});
