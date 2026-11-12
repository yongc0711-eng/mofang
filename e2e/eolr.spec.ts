import { test, expect } from '@playwright/test';

test('EOLR 接续保持当前帧与进度，短/完整公式同起手，首屏控制不遮挡', async ({ page }) => {
  const width = page.viewportSize()!.width;
  for (const colorScheme of ['light', 'dark'] as const) {
    await page.emulateMedia({ colorScheme });
    await page.goto('/#/case/eolr-3-1-2');
    await expect(page.locator('.player-stage canvas')).toBeVisible();
    const continuation = page.getByRole('button', { name: '接续 4b', exact: true });
    await expect(continuation).toHaveAttribute('aria-pressed', 'false');
    await expect(page.locator('.move-track li')).toHaveText(["M'", "U'", "M'"]);
    const diagram = await page.locator('.case-head .diagram').innerHTML();
    await page.getByRole('button', { name: '跳到结尾', exact: true }).click();
    const slider = page.getByRole('slider', { name: '播放进度' });
    const end = await slider.inputValue();
    expect(Number(end)).toBe(1875);
    await continuation.click();
    await expect(continuation).toHaveAttribute('aria-pressed', 'true');
    await expect(slider).toHaveValue(end);
    await expect(page.locator('.move-track .move-now')).toHaveText("M'");
    expect(Number(await slider.getAttribute('max'))).toBeGreaterThan(Number(end));
    expect(await page.locator('.case-head .diagram').innerHTML()).toBe(diagram);
    await page.getByRole('button', { name: '跳到结尾', exact: true }).click();
    expect(Number(await slider.inputValue())).toBeGreaterThan(Number(end));
    await continuation.click();await expect(slider).toHaveValue(end);
    await page.getByRole('button', { name: '回到开头', exact: true }).click();await expect(slider).toHaveValue('0');
    const nav = (await page.locator('.nav').boundingBox())!;
    for (const selector of ['.player', '.peek-cue', '.eolr-continuation']) {
      const box = (await page.locator(selector).boundingBox())!;
      expect(box.x).toBeGreaterThanOrEqual(0);expect(box.x + box.width).toBeLessThanOrEqual(width);
      expect(box.y + box.height).toBeLessThanOrEqual(nav.y);
    }
    const controls = await page.locator('.player-controls button, .speed button, .focus-chip, .eolr-continuation').all();
    for (const control of controls) { const b = (await control.boundingBox())!;expect(b.width).toBeGreaterThanOrEqual(32);expect(b.height).toBeGreaterThanOrEqual(32); }
    const continuationBox = (await continuation.boundingBox())!;
    for (const other of await page.locator('.speed button, .focus-chip').all()) {
      const b = (await other.boundingBox())!;
      expect(continuationBox.x >= b.x + b.width || continuationBox.x + continuationBox.width <= b.x || continuationBox.y >= b.y + b.height || continuationBox.y + continuationBox.height <= b.y).toBe(true);
    }
    expect(await page.evaluate(() => document.documentElement.scrollWidth)).toBe(width);
    await page.screenshot({ path: `ui-review.local/eolr/detail-${width}-${colorScheme}.png` });
  }
});

test('EOLR 列表 20 个 BAD CASE、LSE 双向入口与独立练习范围', async ({ page }) => {
  await page.goto('/#/set/lse');
  await page.locator('.set-advanced a').first().click();
  await expect(page).toHaveURL(/#\/set\/eolr$/);
  await expect(page.locator('.case-card')).toHaveCount(51);
  await expect(page.locator('.case-card-bad')).toHaveCount(20);
  await expect(page.locator('.case-card-bad .tag')).toHaveText(Array(20).fill('BAD CASE'));
  await page.getByRole('link', { name: '练习 EOLR', exact: true }).click();
  await expect(page.getByRole('group', { name: '选择公式组', exact: true }).getByRole('button', { name: 'EOLR', exact: true })).toHaveAttribute('aria-pressed', 'true');
  await expect(page.locator('.practice-start')).toContainText('范围内共 51 个情形');
  await page.goto('/#/case/eolr-4-0-1');
  await expect(page.locator('.case-side')).toContainText('化归中间态');
  await expect(page.getByRole('button', { name: '接续 4b', exact: true })).toBeVisible();
});
