import { expect, test } from '@playwright/test';

test('二阶：第三叠卡堆展开、列表与详情 2D/3D 渲染、搜索及练习隔离无横滚', async ({ page }) => {
  const width = page.viewportSize()!.width;
  await page.goto('/');
  await expect(page.locator('.home-head')).toContainText('共 563 条公式');

  const deck2x2 = page.locator('.home-method-deck[data-method="2x2"]');
  await expect(deck2x2).toBeVisible();
  await expect(deck2x2.locator('.home-deck-cover')).toContainText('3 组 · 126 个情形');
  await deck2x2.getByRole('button', { name: '二阶，展开全部分组', exact: true }).click();
  await expect(deck2x2.locator('.set-card')).toHaveCount(3);

  let totalCases = 0;
  for (const fixture of [
    { set: 'cll', svgs: 1, caseId: 'cll-as-1', title: 'CLL AS 1' },
    { set: 'eg1', svgs: 2, caseId: 'eg1-h-1', title: 'EG-1 H 1' },
    { set: 'eg2', svgs: 2, caseId: 'eg2-h-1', title: 'EG-2 H 1' },
  ] as const) {
    for (const colorScheme of ['light', 'dark'] as const) {
      await page.emulateMedia({ colorScheme });
      await page.goto(`/#/set/${fixture.set}`);
      await expect(page.locator('.set-count')).toHaveText('42 个情形');
      await expect(page.locator('.case-card')).toHaveCount(42);
      expect(await page.evaluate(() => document.documentElement.scrollWidth)).toBe(width);

      await page.locator(`a[href="#/case/${fixture.caseId}"]`).click();
      await expect(page.locator('.case-head .page-title')).toHaveText(fixture.title);
      const diagrams = page.locator('.case-head .diagram svg');
      await expect(diagrams).toHaveCount(fixture.svgs);
      for (let i = 0; i < fixture.svgs; i += 1) {
        const box = (await diagrams.nth(i).boundingBox())!;
        expect(box.width).toBe(64);
        expect(box.height).toBe(64);
      }
      await expect(page.locator('.player-stage canvas')).toBeVisible();
      await expect(page.locator('.focus-chip')).toHaveCount(0);
      const nav = (await page.locator('.nav').boundingBox())!;
      const peek = (await page.locator('.peek-cue').boundingBox())!;
      expect(peek.y + peek.height).toBeLessThanOrEqual(nav.y);
      expect(await page.evaluate(() => document.documentElement.scrollWidth)).toBe(width);
    }
    totalCases += 42;
  }
  expect(totalCases).toBe(126);

  await page.goto('/');
  const search = page.getByRole('searchbox', { name: '搜索公式' });
  await search.fill('二阶');
  await expect(page.locator('.home-results .case-card')).toHaveCount(126);
  await search.fill('EG-2 Diagonal');
  await expect(page.locator('.home-results .case-card[href="#/case/eg2-diag-1"]')).toHaveCount(1);

  await page.goto('/#/practice');
  const setGroup = page.getByRole('group', { name: '选择公式组', exact: true });
  await expect(setGroup.getByRole('button')).toHaveCount(9);
  for (const name of ['CLL', 'EG-1', 'EG-2']) {
    await expect(setGroup.getByRole('button', { name, exact: true })).toHaveCount(0);
  }
  await expect(page.locator('.practice-start')).toContainText('范围内共 437 个情形');
});
