import { test, expect } from '@playwright/test';

for (const fixture of [
  { set: 'coll', count: 40, group: 'Antisune', groupCount: 6, caseId: 'coll-as-1', name: 'AS 1' },
  { set: 'sbls', count: 65, group: 'Corner on U facing up', groupCount: 14, caseId: 'sbls-u-ub', name: 'U UB' },
]) {
test(`${fixture.set.toUpperCase()}：浅深色列表、分类、详情和播放器适配`, async ({ page }) => {
  const width = page.viewportSize()!.width;
  for (const colorScheme of ['light', 'dark'] as const) {
    await page.emulateMedia({ colorScheme });
    await page.goto(`/#/set/${fixture.set}`);
    await expect(page.locator('.case-card')).toHaveCount(fixture.count);
    await expect(page.locator('.set-count')).toHaveText(`${fixture.count} 个情形`);
    expect(await page.evaluate(() => document.documentElement.scrollWidth)).toBe(width);
    await page.screenshot({ path: `ui-review.local/formula-expansion/${fixture.set}-list-${width}-${colorScheme}.png` });
    await page.getByRole('button', { name: '按分组筛选：全部分类', exact: true }).click();
    const dialog = page.getByRole('dialog', { name: '选择分类' });
    await expect(dialog).toBeVisible();
    const box = (await dialog.boundingBox())!;
    expect(box.x).toBeGreaterThanOrEqual(0);
    expect(box.x + box.width).toBeLessThanOrEqual(width);
    expect(box.y).toBeGreaterThanOrEqual(0);
    expect(box.y + box.height).toBeLessThanOrEqual(page.viewportSize()!.height);
    await page.screenshot({ path: `ui-review.local/formula-expansion/${fixture.set}-category-${width}-${colorScheme}.png` });
    await dialog.getByRole('button', { name: `${fixture.group}，${fixture.groupCount} 个情形`, exact: true }).click();
    await expect(page.locator('.case-card')).toHaveCount(fixture.groupCount);
    await page.locator(`a[href="#/case/${fixture.caseId}"]`).click();
    await expect(page.locator('.case-head .page-title')).toHaveText(fixture.name);
    const svg = (await page.locator('.case-head .diagram svg').boundingBox())!;
    expect(svg.width).toBe(64);expect(svg.height).toBe(64);
    await expect(page.locator('.player-stage canvas')).toBeVisible();
    const stage = (await page.locator('.player-stage').boundingBox())!;
    const peek = (await page.locator('.peek-cue').boundingBox())!;
    const nav = (await page.locator('.nav').boundingBox())!;
    expect(stage.height).toBe(width === 320 ? 164 : 190);
    expect(peek.y + peek.height).toBeLessThanOrEqual(nav.y);
    expect(await page.evaluate(() => document.documentElement.scrollWidth)).toBe(width);
    await page.screenshot({ path: `ui-review.local/formula-expansion/${fixture.set}-${width}-${colorScheme}.png` });
    console.log('formula-expansion', fixture.set, width, colorScheme, JSON.stringify({ svg, stageHeight: stage.height, peekBottom: peek.y + peek.height, navTop: nav.y }));
    await page.getByRole('button', { name: '‹ 返回', exact: true }).click();
    await expect(page.locator('.case-card')).toHaveCount(fixture.groupCount);
    await expect(page.getByRole('button', { name: `按分组筛选：${fixture.group}`, exact: true })).toBeVisible();
    await page.getByRole('button', { name: `按分组筛选：${fixture.group}`, exact: true }).click();
    await dialog.getByRole('button', { name: `全部分类，${fixture.count} 个情形`, exact: true }).click();
    await expect(page.locator('.case-card')).toHaveCount(fixture.count);
  }
});

test(`${fixture.set.toUpperCase()}：练习选择、求解生成、计时与原情形链接`, async ({ page }) => {
  await page.goto('/#/practice');
  await page.getByRole('group', { name: '选择公式组', exact: true }).getByRole('button', { name: fixture.set.toUpperCase(), exact: true }).click();
  await expect(page.locator('.practice-start')).toContainText(`范围内共 ${fixture.count} 个情形`);
  await page.getByRole('button', { name: '选择情形', exact: true }).click();
  await page.getByRole('group', { name: '选择情形', exact: true }).getByRole('button', { name: fixture.name, exact: true }).click();
  await expect(page.locator('.practice-start')).toContainText('范围内共 1 个情形');
  expect(await page.evaluate(() => document.documentElement.scrollWidth)).toBe(page.viewportSize()!.width);
  await page.getByRole('button', { name: '开始练习', exact: true }).click();
  const practice = page.locator('.practice');
  await expect(practice).toHaveAttribute('data-phase', 'ready');
  await expect(page.locator('.practice-case')).toContainText(`${fixture.set.toUpperCase()} · ${fixture.group}`);
  await expect(page.locator('.practice-scramble')).toContainText('训练打乱由目标状态求解生成');
  if (fixture.set === 'sbls') await expect(page.locator('.practice-scramble')).toContainText('；左');
  await page.locator('.practice-pad').focus();
  await page.keyboard.press('Enter');
  await expect(practice).toHaveAttribute('data-phase', 'running');
  await page.keyboard.press('Enter');
  await expect(practice).toHaveAttribute('data-phase', 'done');
  await expect(page.locator('.practice-result a')).toHaveAttribute('href', `#/case/${fixture.caseId}`);
  expect(await page.evaluate(() => document.documentElement.scrollWidth)).toBe(page.viewportSize()!.width);
  await page.getByRole('button', { name: '‹ 结束', exact: true }).click();
  await expect(page.locator('.practice-start')).toBeVisible();
});
}
