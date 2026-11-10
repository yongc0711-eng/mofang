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
  await page.locator('.case-card').first().click();
  await page.getByRole('group', { name: '学习状态', exact: true }).getByRole('button', { name: '已掌握' }).click();
  await page.getByRole('button', { name: '‹ 返回', exact: true }).click();
  const mastered = page.locator('.case-state-mastered');
  await expect(mastered).toHaveText('已掌握');
  expect(await mastered.evaluate((el) => getComputedStyle(el).color)).toBe(await page.locator('body').evaluate((el) => getComputedStyle(el).color));
});

test('浅深色：列表和长公式不溢出，首屏播放器与提示条避开底栏', async ({ page }) => {
  const width = page.viewportSize()!.width;
  for (const colorScheme of ['light', 'dark'] as const) {
    await page.emulateMedia({ colorScheme });
    for (const path of ['/set/f2l', '/set/oll', '/set/pll', '/set/cmll', '/set/lse', '/case/pll-ga', '/case/oll-4', '/case/cmll-s-1', '/case/lse-eo-7']) {
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
        if (path === '/case/lse-eo-7') {
          const views = page.locator('.case-head .diagram svg');
          await expect(views).toHaveCount(2);
          const top = (await views.nth(0).boundingBox())!;
          const bottom = (await views.nth(1).boundingBox())!;
          expect(top.x + top.width).toBeLessThanOrEqual(bottom.x);
          expect(top.height).toBeGreaterThan(20);
          expect(bottom.height).toBeGreaterThan(20);
          for (const box of [top, bottom]) {
            expect(box.width).toBeGreaterThanOrEqual(56);
            expect(box.height).toBeGreaterThanOrEqual(56);
          }
        } else {
          const view = page.locator('.case-head .diagram svg');
          await expect(view).toHaveCount(1);
          const box = (await view.boundingBox())!;
          expect(box.width).toBe(64);
          expect(box.height).toBe(64);
        }
      }
      if (path === '/set/pll' || path === '/case/oll-4') {
        if (path.startsWith('/case')) await expect(page.locator('.player-stage canvas')).toBeVisible();
        await page.screenshot({ path: `test-results/ui-polish/${width}-${colorScheme}-${path.split('/').at(-1)}.png`, fullPage: false });
      }
    }
  }
});

test('LSE 长名称详情：双图清晰并排、收藏不溢出、播放器和提示条在底栏上方', async ({ page }, testInfo) => {
  await page.goto('/#/case/lse-ulur-24');
  await expect(page.locator('.case-page')).toBeVisible();
  const views = page.locator('.case-head .diagram svg');
  await expect(views).toHaveCount(2);
  const first = (await views.nth(0).boundingBox())!;
  const second = (await views.nth(1).boundingBox())!;
  for (const box of [first, second]) {
    expect(box.width).toBeGreaterThanOrEqual(56);
    expect(box.height).toBeGreaterThanOrEqual(56);
  }
  expect(first.x + first.width).toBeLessThanOrEqual(second.x);
  const favorite = (await page.locator('.case-head .fav-btn').boundingBox())!;
  expect(favorite.x).toBeGreaterThanOrEqual(0);
  expect(favorite.y).toBeGreaterThanOrEqual(0);
  expect(favorite.x + favorite.width).toBeLessThanOrEqual(page.viewportSize()!.width);
  expect(favorite.height).toBeGreaterThanOrEqual(32);
  const nav = (await page.locator('.nav').boundingBox())!;
  const player = (await page.locator('.player').boundingBox())!;
  const cue = (await page.locator('.peek-cue').boundingBox())!;
  expect(player.y + player.height).toBeLessThanOrEqual(nav.y);
  expect(cue.y + cue.height).toBeLessThanOrEqual(nav.y);
  const widths = await page.evaluate(() => ({ scroll: document.documentElement.scrollWidth, client: document.documentElement.clientWidth }));
  expect(widths.scroll).toBe(widths.client);
  console.log('UI-polish-fix', testInfo.project.name, JSON.stringify({ first, second, favorite, playerBottom: player.y + player.height, peekBottom: cue.y + cue.height, navTop: nav.y, ...widths }));
  await expect(page.locator('.player-stage canvas')).toBeVisible();
  await page.screenshot({ path: `test-results/ui-polish/lse-fix-${testInfo.project.name}.png` });
});
