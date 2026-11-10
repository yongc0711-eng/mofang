import { test, expect } from '@playwright/test';

test('分类面板：两列、选中、焦点返回、Esc 与遮罩关闭，浅深色无横滚', async ({ page }, testInfo) => {
  for (const colorScheme of ['light', 'dark'] as const) {
    await page.emulateMedia({ colorScheme });
    for (const set of ['pll', 'oll', 'f2l', 'cmll', 'lse']) {
      await page.goto('/#/set/' + set);
      const trigger = page.getByRole('button', { name: /^按分组筛选/ });
      await expect(trigger).toHaveAccessibleName('按分组筛选：全部分类');
      await trigger.click();
      const dialog = page.getByRole('dialog', { name: '选择分类' });
      await expect(dialog).toBeVisible();
      const all = dialog.getByRole('button', { name: /^全部分类/ });
      await expect(all).toHaveAttribute('aria-pressed', 'true');
      await expect(all).toBeFocused();
      const bounds = (await dialog.boundingBox())!;
      const triggerBounds = (await trigger.boundingBox())!;
      expect(bounds.x).toBeLessThanOrEqual(triggerBounds.x);
      expect(bounds.x + bounds.width).toBeGreaterThanOrEqual(triggerBounds.x + triggerBounds.width);
      expect(bounds.x).toBeGreaterThanOrEqual(0);
      expect(bounds.y).toBeGreaterThanOrEqual(0);
      expect(bounds.x + bounds.width).toBeLessThanOrEqual(page.viewportSize()!.width);
      expect(bounds.y + bounds.height).toBeLessThanOrEqual(page.viewportSize()!.height);
      const sizes = await dialog.evaluate(el => ({ scroll: el.scrollWidth, client: el.clientWidth }));
      expect(sizes.scroll).toBe(sizes.client);
      const options = dialog.getByRole('group', { name: '情形分类' }).getByRole('button');
      for (const button of await options.all()) {
        expect((await button.boundingBox())!.height).toBeGreaterThanOrEqual(32);
      }
      if (set === 'pll') {
        await expect(all).toHaveAccessibleName('全部分类，21 个情形');
        await expect(dialog.getByRole('button', { name: /^G 系列/ })).toHaveAccessibleName('G 系列，4 个情形');
        const close = (await dialog.getByRole('button', { name: '关闭分类' }).boundingBox())!;
        expect(close.width).toBe(40);
        expect(close.height).toBe(40);
        const header = (await dialog.locator('.category-dialog-head').boundingBox())!;
        expect(close.x + close.width).toBeLessThanOrEqual(header.x + header.width);
        console.log('CategoryPicker', testInfo.project.name, colorScheme, JSON.stringify({ dialog: bounds, trigger: triggerBounds, close }));
        await page.screenshot({ path: `test-results/category-picker/${testInfo.project.name}-${colorScheme}.png` });
        await dialog.getByRole('button', { name: /^G 系列/ }).click();
        await expect(dialog).toBeHidden();
        await expect(trigger).toHaveText('G 系列');
        await expect(trigger).toHaveAccessibleName('按分组筛选：G 系列');
        await expect(trigger).toBeFocused();
        await expect(page.locator('.case-card')).toHaveCount(4);
        await trigger.click();
        await expect(dialog.getByRole('button', { name: /^G 系列/ })).toHaveAttribute('aria-pressed', 'true');
      }
      await page.keyboard.press('Escape');
      await expect(dialog).toBeHidden();
      await expect(trigger).toBeFocused();
      await trigger.click();
      await page.mouse.click(2, 2);
      await expect(dialog).toBeHidden();
      await expect(trigger).toBeFocused();
      await trigger.click();
      await dialog.getByRole('button', { name: '关闭分类' }).click();
      await expect(dialog).toBeHidden();
      await expect(trigger).toBeFocused();
      await trigger.click();
      await all.click();
      await expect(trigger).toHaveText('全部分类');
      await expect(trigger).toHaveAccessibleName('按分组筛选：全部分类');
    }
  }
});
