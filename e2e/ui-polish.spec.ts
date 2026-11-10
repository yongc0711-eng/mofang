import { test, expect } from '@playwright/test';

test('公式列表：筛选都可点、分类与状态组合、返回保留选择、空结果可恢复', async ({ page }) => {
  await page.goto('/#/set/pll');
  const filters = page.getByRole('group', { name: '按学习状态筛选' });
  const buttons = filters.getByRole('button');
  await expect(buttons).toHaveCount(5);
  for (const button of await buttons.all()) {
    const box = (await button.boundingBox())!;
    expect(box.x).toBeGreaterThanOrEqual(0);
    expect(box.x + box.width).toBeLessThanOrEqual(page.viewportSize()!.width);
    expect(box.height).toBeGreaterThanOrEqual(32);
  }

  await page.getByLabel('按分组筛选').selectOption('G 系列');
  await expect(page.locator('.case-card')).toHaveCount(4);
  await page.locator('.case-card').first().click();
  await page.getByRole('group', { name: '学习状态', exact: true }).getByRole('button', { name: '学习中' }).click();
  await page.getByRole('button', { name: '☆ 收藏', exact: true }).click();
  await page.getByRole('button', { name: '‹ 返回', exact: true }).click();
  await expect(page.getByLabel('按分组筛选')).toHaveValue('G 系列');
  await filters.getByRole('button', { name: '学习中', exact: true }).click();
  await expect(page.locator('.case-card')).toHaveCount(1);
  await expect(page.locator('.case-card')).toContainText('学习中');
  await filters.getByRole('button', { name: '收藏', exact: true }).click();
  await expect(page.locator('.case-card')).toHaveCount(1);
  await filters.getByRole('button', { name: '已掌握', exact: true }).click();
  await expect(page.getByText('没有符合条件的情形')).toBeVisible();
  await page.getByRole('button', { name: '查看全部情形' }).click();
  await expect(page.locator('.case-card')).toHaveCount(21);
  await expect(page.getByLabel('按分组筛选')).toHaveValue('全部');
  await expect(filters.getByRole('button', { name: '全部', exact: true })).toHaveAttribute('aria-pressed', 'true');
});

test('浅深色：列表和长公式不溢出，首屏播放器与提示条避开底栏', async ({ page }) => {
  const width = page.viewportSize()!.width;
  for (const colorScheme of ['light', 'dark'] as const) {
    await page.emulateMedia({ colorScheme });
    for (const path of ['/set/pll', '/case/pll-ga', '/case/oll-4', '/case/cmll-s-1', '/case/lse-eo-7']) {
      await page.goto('/#' + path);
      await expect(page.locator(path.startsWith('/set') ? '.set-page' : '.case-page')).toBeVisible();
      const overflow = await page.evaluate(() => document.documentElement.scrollWidth - document.documentElement.clientWidth);
      expect(overflow, `${path} ${colorScheme} 横向溢出`).toBeLessThanOrEqual(0);
      const textColors = await page.evaluate(() => ({
        text: getComputedStyle(document.body).color,
        title: getComputedStyle(document.querySelector('h1')!).color,
      }));
      expect(textColors.title).toBe(textColors.text);
      if (path.startsWith('/case')) {
        const cue = (await page.locator('.peek-cue').boundingBox())!;
        const nav = (await page.locator('.nav').boundingBox())!;
        expect(cue.y + cue.height, `${path} ${colorScheme} 提示条被底栏盖住`).toBeLessThanOrEqual(nav.y);
        const stage = (await page.locator('.player-stage').boundingBox())!;
        expect(stage.height).toBe(width === 320 ? 164 : 190);
      }
      if (path === '/set/pll' || path === '/case/oll-4') {
        if (path.startsWith('/case')) await expect(page.locator('.player-stage canvas')).toBeVisible();
        await page.screenshot({ path: `test-results/ui-polish/${width}-${colorScheme}-${path.split('/').at(-1)}.png`, fullPage: false });
      }
    }
  }
});
