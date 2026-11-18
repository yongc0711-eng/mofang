import { test, expect } from '@playwright/test';

test('二阶识别提示只在停表后显示，使用本题配色并能在原题重练', async ({ page }) => {
  const dark = page.viewportSize()!.width === 320;
  await page.emulateMedia({ colorScheme: dark ? 'dark' : 'light' });
  await page.goto('/#/practice?set=eg1');
  await page.locator('#practice-colors').click();
  await page.getByRole('button', { name: '二阶练习底色绿色', exact: true }).click();
  await page.getByRole('button', { name: '二阶练习底色白色', exact: true }).click();
  await page.keyboard.press('Escape');
  await page.getByRole('button', { name: '开始练习', exact: true }).click();

  const practice = page.locator('.practice');
  const summary = practice.getByText('识别提示', { exact: true });
  const hint = practice.getByRole('region', { name: '二阶识别提示', exact: true });
  await expect(practice).toHaveAttribute('data-phase', 'ready');
  await expect(summary).toHaveCount(0);
  const scramble = await practice.locator('.practice-scramble code').innerText();
  const diagram = await practice.locator('.practice-case .diagram').innerHTML();
  await page.keyboard.press('Space');
  await expect(practice).toHaveAttribute('data-phase', 'running');
  await expect(summary).toHaveCount(0);
  await page.keyboard.press('Space');
  await expect(practice).toHaveAttribute('data-phase', 'done');

  await expect(summary).toBeVisible();
  await expect(hint).toBeHidden();
  expect((await summary.boundingBox())!.height).toBeGreaterThanOrEqual(32);
  if (dark) await summary.tap();
  else await summary.press('Space');
  await expect(practice).toHaveAttribute('data-phase', 'done');
  await expect(hint).toBeVisible();
  await expect(hint).toContainText('绿色底面已完成');
  await expect(hint).toContainText('底层唯一同色边');
  await expect(hint).toContainText('蓝');
  await expect(hint).toContainText('区分相似情形');
  expect(await practice.locator('.practice-case .diagram').innerHTML()).toBe(diagram);
  expect(await page.evaluate(() => document.documentElement.scrollWidth)).toBe(page.viewportSize()!.width);
  await hint.getByText('先看底层', { exact: true }).tap();
  await expect(hint).toBeVisible();
  await expect(practice).toHaveAttribute('data-phase', 'done');

  await practice.getByRole('button', { name: '再练这题', exact: true }).tap();
  await expect(practice).toHaveAttribute('data-phase', 'ready');
  await expect(summary).toHaveCount(0);
  await expect(practice.locator('.practice-scramble code')).toHaveText(scramble);
  await page.keyboard.press('Space');
  await expect(practice).toHaveAttribute('data-phase', 'running');
  await page.keyboard.press('Space');
  await expect(practice).toHaveAttribute('data-phase', 'done');
  await expect(summary).toBeVisible();
  await expect(hint).toBeHidden();
  await practice.locator('.practice-pad').focus();
  await page.keyboard.press('Space');
  await expect(practice).toHaveAttribute('data-phase', 'ready');
  await expect(summary).toHaveCount(0);
});
