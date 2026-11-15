import { test, expect, type Page } from '@playwright/test';
import { verifySetup2 } from '../src/lib/practice2';

const saved = (page: Page) => page.evaluate(() => JSON.parse(localStorage.getItem('mofang.practice.v1') ?? 'null'));
async function noOverflow(page: Page) {
  expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(true);
}
for (const scheme of ['light', 'dark'] as const) {
  test(`二阶练习设置与三阶隔离、底色池独立、触控尺寸 ${scheme}`, async ({ page }) => {
    await page.emulateMedia({ colorScheme: scheme });
    await page.goto('/#/practice');
    const sizes = page.getByRole('group', { name: '魔方阶数', exact: true });
    const scope = page.getByRole('group', { name: '选择公式组', exact: true });
    await expect(page.locator('.practice-start')).toContainText('437 个情形');
    await sizes.getByRole('button', { name: '二阶', exact: true }).click();
    await expect(scope.getByRole('button')).toHaveText(['CLL', 'EG-1', 'EG-2']);
    await expect(page.locator('.practice-start')).toContainText('126 个情形');
    await scope.getByRole('button', { name: 'EG-1', exact: true }).click();
    await expect(page.locator('.practice-start')).toContainText('42 个情形');
    await page.locator('#practice-colors').click();
    const dialog = page.getByRole('dialog');
    await expect(dialog.getByRole('tab')).toHaveText(['二阶']);
    await dialog.getByRole('button', { name: '二阶练习底色蓝色', exact: true }).click();
    await dialog.getByRole('button', { name: '二阶练习底色白色', exact: true }).click();
    await dialog.getByRole('button', { name: '二阶练习底色蓝色', exact: true }).click();
    await expect(dialog.getByRole('button', { name: '二阶练习底色蓝色', exact: true })).toHaveAttribute('aria-pressed', 'true');
    for (const box of await dialog.locator('button').evaluateAll(els => els.map(el => ({ width: el.getBoundingClientRect().width, height: el.getBoundingClientRect().height })))) {
      expect(box.width).toBeGreaterThanOrEqual(32); expect(box.height).toBeGreaterThanOrEqual(32);
    }
    await page.keyboard.press('Escape');
    await expect(page.locator('#practice-colors')).toBeFocused();
    await sizes.getByRole('button', { name: '三阶', exact: true }).click();
    await expect(scope.getByRole('button')).toHaveCount(9);
    await expect(page.locator('.practice-start')).toContainText('437 个情形');
    await page.locator('#practice-colors').click();
    await expect(dialog.getByRole('tab')).toHaveText(['CFOP', 'Roux']);
    await expect(dialog.getByRole('button', { name: 'cfop 练习底色白色', exact: true })).toHaveAttribute('aria-pressed', 'true');
    await expect(dialog.getByRole('button', { name: 'cfop 练习底色蓝色', exact: true })).toHaveAttribute('aria-pressed', 'false');
    await page.keyboard.press('Escape');
    await sizes.getByRole('button', { name: '二阶', exact: true }).click();
    await page.locator('#practice-colors').click();
    await expect(dialog.getByRole('button', { name: '二阶练习底色蓝色', exact: true })).toHaveAttribute('aria-pressed', 'true');
    await page.keyboard.press('Escape');
    await noOverflow(page);
    await page.screenshot({ path: `ui-review.local/practice-2x2/settings-${page.viewportSize()!.width}-${scheme}.png`, fullPage: true });
  });

  test(`二阶浏览六底保存、封面列表详情同配色 ${scheme}`, async ({ page }) => {
    await page.emulateMedia({ colorScheme: scheme });
    await page.goto('/');
    await page.locator('#browse-colors').click();
    const dialog = page.getByRole('dialog');
    await expect(dialog.getByRole('tab')).toHaveText(['CFOP', 'Roux', '二阶']);
    await dialog.getByRole('tab', { name: '二阶', exact: true }).click();
    await dialog.getByRole('button', { name: '底面蓝色', exact: true }).click();
    await page.keyboard.press('Escape');
    const prefs = await page.evaluate(() => JSON.parse(localStorage.getItem('mofang.device.v1')!));
    expect(prefs.twoByTwo).toEqual({ bottomColor: 'blue' });
    expect(prefs.cfop).toEqual({ bottomColor: 'white' });
    await page.reload();
    await page.locator('.home-method-deck[data-method="2x2"]').getByRole('button', { name: '二阶，展开全部分组', exact: true }).click();
    const colors = (selector: string) => page.locator(selector).evaluateAll(els => els.map(el => el.getAttribute('fill')));
    const cover = await colors('.home-method-deck[data-method="2x2"] a[href="#/set/eg1"] svg rect');
    await page.goto('/#/set/eg1');
    const list = await colors('a[href="#/case/eg1-h-1"] svg:first-of-type rect');
    expect(list.slice(0, 12)).toEqual(cover);
    await page.locator('a[href="#/case/eg1-h-1"]').click();
    await expect(page.locator('.case-player canvas')).toBeVisible();
    await expect(page.locator('.player-error')).toHaveCount(0);
    expect((await colors('.case-head svg rect')).slice(0, 12)).toEqual(cover);
    await noOverflow(page);
    await page.screenshot({ path: `ui-review.local/practice-2x2/detail-${page.viewportSize()!.width}-${scheme}.png`, fullPage: true });
  });
}

for (const set of ['cll', 'eg1', 'eg2']) {
  test(`二阶 ${set} 实际求解、计时、详情返回、刷新恢复同题`, async ({ page }) => {
    await page.goto(`/#/practice?set=${set}`);
    await expect(page.locator('.practice-start')).toContainText('42 个情形');
    await page.locator('#practice-colors').click();
    await page.getByRole('button', { name: '二阶练习底色绿色', exact: true }).click();
    await page.getByRole('button', { name: '二阶练习底色白色', exact: true }).click();
    await page.keyboard.press('Escape');
    await page.getByRole('button', { name: '开始练习', exact: true }).click();
    await expect(page.locator('.practice[data-size="2"][data-phase="ready"]')).toBeVisible();
    await expect(page.locator('.practice-scramble')).toContainText('二阶没有中心');
    const q = (await saved(page)).question;
    expect(q.id.startsWith(`${set}-`)).toBe(true);
    expect(q.prepared.colors).toEqual({ method: '2x2', bottom: 'green' });
    expect(verifySetup2(q.prepared)).toBe(true);
    expect(q.prepared.state).toHaveLength(24);
    await expect(page.locator('.practice-case svg')).toHaveCount(set === 'cll' ? 1 : 2);
    for (const box of await page.locator('.practice-case svg').evaluateAll(els => els.map(el => el.getBoundingClientRect().toJSON()))) {
      expect(box.width).toBe(64); expect(box.height).toBe(64);
    }
    await noOverflow(page);
    await page.keyboard.press('Space');
    await expect(page.locator('.practice')).toHaveAttribute('data-phase', 'running');
    await page.reload();
    await expect(page.locator('.practice')).toHaveAttribute('data-phase', 'paused');
    expect((await saved(page)).question).toEqual(q);
    await page.keyboard.press('Space');
    await expect(page.locator('.practice')).toHaveAttribute('data-phase', 'running');
    await page.keyboard.press('Space');
    await expect(page.locator('.practice')).toHaveAttribute('data-phase', 'done');
    await page.getByRole('link', { name: '查看详情', exact: true }).click();
    await page.getByRole('button', { name: '‹ 返回', exact: true }).click();
    await expect(page.locator('.practice')).toHaveAttribute('data-phase', 'done');
    expect((await saved(page)).question).toEqual(q);
    await page.screenshot({ path: `ui-review.local/practice-2x2/done-${set}-${page.viewportSize()!.width}.png`, fullPage: true });
    await page.keyboard.press('Space');
    await expect(page.locator('.practice')).toHaveAttribute('data-phase', 'ready');
    const next = await saved(page);
    expect(next.question.id).not.toBe(q.id);
    expect(verifySetup2(next.question.prepared)).toBe(true);
    await page.getByRole('button', { name: '‹ 结束', exact: true }).click();
    expect(await saved(page)).toBeNull();
  });
}
