import { test, expect } from '@playwright/test';

test('试转浅深色：布局避开底栏，后缀持续锁定，更多/撤销/复原保持可用', async ({ page }) => {
  const width = page.viewportSize()!.width;
  for (const colorScheme of ['light', 'dark'] as const) {
    await page.emulateMedia({ colorScheme });
    await page.goto('/#/search');
    const turn = (name: string) => page.getByRole('button', { name: `转动 ${name}`, exact: true });
    await expect(turn('R')).toBeEnabled();
    await expect(page.locator('.sandbox-stage canvas')).toBeVisible();
    const nav = (await page.locator('.nav').boundingBox())!;
    for (const selector of ['.sandbox-stage', '.sandbox-controls', '.sandbox-footer', '.sandbox-queue']) {
      const b = (await page.locator(selector).boundingBox())!;
      expect(b.x).toBeGreaterThanOrEqual(16);expect(b.x + b.width).toBeLessThanOrEqual(width - 16);
      expect(b.y + b.height).toBeLessThanOrEqual(nav.y - 8);
    }
    const suffix = page.getByRole('group', { name: '转动后缀', exact: true });
    await expect(suffix.getByRole('button')).toHaveCount(3);
    await expect(page.locator('.sandbox-controls button')).toHaveCount(15);
    for (const button of await page.locator('.sandbox-controls button').all()) {
      const b = (await button.boundingBox())!;
      expect(b.width).toBeGreaterThanOrEqual(32);expect(b.height).toBeGreaterThanOrEqual(32);
    }
    const suffixBox = (await suffix.boundingBox())!;
    const more = page.getByRole('button', { name: '切换更多转法', exact: true });
    expect((await more.boundingBox())!.x).toBeGreaterThanOrEqual(suffixBox.x + suffixBox.width);
    expect(await page.evaluate(() => document.documentElement.scrollWidth)).toBe(width);
    await page.screenshot({ path: `ui-review.local/lab-polish/after-${width}-${colorScheme}.png` });

    const prime = page.getByRole('button', { name: "后缀 '", exact: true });
    const undo = page.getByRole('button', { name: '撤销最后一转', exact: true });
    const queue = page.locator('.sandbox-queue');
    await prime.click();await turn('R').click();await expect(undo).toBeEnabled();
    await expect(prime).toHaveAttribute('aria-pressed', 'true');
    await turn('U').click();await expect(undo).toBeEnabled();await expect(prime).toHaveAttribute('aria-pressed', 'true');
    await undo.click();await expect(queue).toHaveText('待转 0 / 16');await expect(prime).toHaveAttribute('aria-pressed', 'true');
    await more.click();await expect(more).toHaveAttribute('aria-pressed', 'true');
    await expect(page.locator('.sandbox-keys button')).toHaveText(['r','l','u','d','f','b','M','E','S']);
    const double = page.getByRole('button', { name: '后缀 2', exact: true });await double.click();
    await page.screenshot({ path: `ui-review.local/lab-polish/more-${width}-${colorScheme}.png` });
    await turn('M').click();await expect(undo).toBeEnabled();await expect(double).toHaveAttribute('aria-pressed', 'true');
    await page.getByRole('button', { name: '复原魔方', exact: true }).click();
    await expect(undo).toBeDisabled();await expect(queue).toHaveText('待转 0 / 16');
    await expect(page.getByRole('button', { name: '无后缀', exact: true })).toHaveAttribute('aria-pressed', 'true');
    await more.click();await expect(page.locator('.sandbox-keys button')).toHaveText(['R','U','F','L','D','B','x','y','z']);
    await expect(page.locator('.sandbox-controls')).toBeVisible();
    expect(await page.evaluate(() => document.documentElement.scrollWidth)).toBe(width);
  }
});
