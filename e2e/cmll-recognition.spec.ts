import { test, expect } from '@playwright/test';

test('CMLL 手机详情提示跟随桥式配色和当前公式起手', async ({ page }) => {
  await page.emulateMedia({ colorScheme: page.viewportSize()!.width === 320 ? 'dark' : 'light' });
  await page.goto('/');
  await page.getByRole('button', { name: '浏览配色', exact: true }).click();
  const dialog = page.getByRole('dialog');
  await dialog.getByRole('tab', { name: 'Roux', exact: true }).click();
  await dialog.getByRole('button', { name: '底面绿色', exact: true }).click();
  await page.keyboard.press('Escape');
  await page.goto('/#/case/cmll-h-1');

  const cue = page.getByRole('button', { name: '识别与公式', exact: true });
  const hint = page.getByRole('region', { name: 'CMLL 识别提示', exact: true });
  await expect(cue).toBeVisible();
  const cueBox = (await cue.boundingBox())!;
  const nav = (await page.locator('.nav').boundingBox())!;
  expect(cueBox.y + cueBox.height).toBeLessThanOrEqual(nav.y);
  await cue.click();
  await expect(hint).toContainText('没有蓝色角贴纸朝上');
  await expect(hint.getByRole('listitem')).toHaveText([
    '顶面左后角与顶面右后角为对色（白色与黄色）。',
    '顶面左后角与顶面左前角为同色（白色）。',
  ]);
  const diagram = page.locator('.case-head .diagram');
  const before = await diagram.innerHTML();
  await page.locator('.alg-list .alg').nth(1).click();
  await expect(hint.getByRole('listitem')).toHaveText([
    '顶面左后角与顶面右后角为对色（红色与橙色）。',
    '顶面左后角与顶面左前角为同色（红色）。',
  ]);
  expect(await diagram.innerHTML()).not.toBe(before);
  expect(await page.evaluate(() => document.documentElement.scrollWidth)).toBe(page.viewportSize()!.width);
});
