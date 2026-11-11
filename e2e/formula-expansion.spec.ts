import { test, expect } from '@playwright/test';

test('COLL：浅深色列表、分类、详情和播放器适配', async ({ page }) => {
  const width = page.viewportSize()!.width;
  for (const colorScheme of ['light', 'dark'] as const) {
    await page.emulateMedia({ colorScheme });
    await page.goto('/#/set/coll');
    await expect(page.locator('.case-card')).toHaveCount(40);
    await expect(page.locator('.set-count')).toHaveText('40 个情形');
    await page.getByRole('button', { name: '按分组筛选：全部分类', exact: true }).click();
    const dialog = page.getByRole('dialog', { name: '选择分类' });
    await expect(dialog).toBeVisible();
    const box = (await dialog.boundingBox())!;
    expect(box.x).toBeGreaterThanOrEqual(0);
    expect(box.x + box.width).toBeLessThanOrEqual(width);
    expect(box.y).toBeGreaterThanOrEqual(0);
    expect(box.y + box.height).toBeLessThanOrEqual(page.viewportSize()!.height);
    await dialog.getByRole('button', { name: 'Antisune，6 个情形', exact: true }).click();
    await expect(page.locator('.case-card')).toHaveCount(6);
    await page.locator('a[href="#/case/coll-as-1"]').click();
    await expect(page.locator('.case-head .page-title')).toHaveText('AS 1');
    const svg = (await page.locator('.case-head .diagram svg').boundingBox())!;
    expect(svg.width).toBe(64);expect(svg.height).toBe(64);
    await expect(page.locator('.player-stage canvas')).toBeVisible();
    const stage = (await page.locator('.player-stage').boundingBox())!;
    const peek = (await page.locator('.peek-cue').boundingBox())!;
    const nav = (await page.locator('.nav').boundingBox())!;
    expect(stage.height).toBe(width === 320 ? 164 : 190);
    expect(peek.y + peek.height).toBeLessThanOrEqual(nav.y);
    expect(await page.evaluate(() => document.documentElement.scrollWidth)).toBe(width);
    await page.screenshot({ path: `ui-review.local/formula-expansion/coll-${width}-${colorScheme}.png` });
    await page.getByRole('button', { name: '‹ 返回', exact: true }).click();
    await expect(page.locator('.case-card')).toHaveCount(6);
    await expect(page.getByRole('button', { name: '按分组筛选：Antisune', exact: true })).toBeVisible();
    await page.getByRole('button', { name: '按分组筛选：Antisune', exact: true }).click();
    await dialog.getByRole('button', { name: '全部分类，40 个情形', exact: true }).click();
    await expect(page.locator('.case-card')).toHaveCount(40);
  }
});
