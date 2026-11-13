import { test, expect, type Locator, type Page } from '@playwright/test';

/**
 * 轻量视觉冒烟：只查“页面明显坏掉”，不做像素对比。
 * 失败时 Playwright 自动留截图和 trace（见 playwright.config.ts）。
 */

async function open(page: Page, path: string) {
  await page.goto(path);
  await expect(page.locator('main')).toBeVisible();
  await expect(page.locator('.nav')).toBeVisible();
}

async function expectNoHorizontalScroll(page: Page) {
  const widths = await page.evaluate(() => ({
    scroll: document.documentElement.scrollWidth,
    client: document.documentElement.clientWidth,
  }));
  expect(widths.scroll, `横向溢出：scrollWidth ${widths.scroll} > clientWidth ${widths.client}`).toBeLessThanOrEqual(widths.client + 1);
}

async function expectInsideViewport(locator: Locator, page: Page) {
  const box = await locator.boundingBox();
  const viewport = page.viewportSize()!;
  expect(box, '元素没有布局盒').not.toBeNull();
  expect(box!.x).toBeGreaterThanOrEqual(-1);
  expect(box!.y).toBeGreaterThanOrEqual(-1);
  expect(box!.x + box!.width).toBeLessThanOrEqual(viewport.width + 1);
  expect(box!.y + box!.height).toBeLessThanOrEqual(viewport.height + 1);
}

/** 元素底边不能被固定底栏盖住 */
async function expectAboveNav(locator: Locator, page: Page) {
  const box = await locator.boundingBox();
  const nav = await page.locator('.nav').boundingBox();
  expect(box, '元素没有布局盒').not.toBeNull();
  expect(nav, '底栏没有布局盒').not.toBeNull();
  expect(box!.y + box!.height).toBeLessThanOrEqual(nav!.y + 1);
}

test.describe('视觉冒烟', () => {
  test('首页：三张方法封面在首屏、展开后十二入口完整、配色 44px、无横滚', async ({ page }) => {
    await open(page, '/');
    await expect(page.getByRole('heading', { level: 1, name: '魔方公式' })).toBeVisible();

    const cards = page.locator('.set-card');
    await expect(cards).toHaveCount(12);
    const covers = page.locator('.home-deck-cover');
    await expect(covers).toHaveCount(3);
    for (const cover of await covers.all()) {
      await expect(cover).toBeVisible();
      await expectAboveNav(cover, page);
    }
    await page.getByRole('button', { name: 'CFOP，展开全部分组', exact: true }).click();
    await page.getByRole('button', { name: '桥式，展开全部分组', exact: true }).click();
    await page.getByRole('button', { name: '二阶，展开全部分组', exact: true }).click();
    for (let i = 0; i < 12; i += 1) {
      await cards.nth(i).evaluate(el => el.scrollIntoView({ block: 'center' }));
      await expect(cards.nth(i)).toBeVisible();
      await expectAboveNav(cards.nth(i), page);
    }

    await page.locator('.home-head').scrollIntoViewIfNeeded();

    const entry = page.locator('#browse-colors');
    await expect(entry).toBeVisible();
    const box = await entry.boundingBox();
    expect(box!.width).toBeGreaterThanOrEqual(44);
    expect(box!.height).toBeGreaterThanOrEqual(44);
    await expect(entry).toHaveAttribute('aria-haspopup', 'dialog');

    await expectNoHorizontalScroll(page);
  });

  test('公式详情：主公式显示括号、播放器不超宽、无横滚', async ({ page }) => {
    await page.goto('/#/case/oll-4');
    await expect(page.locator('.case-page')).toBeVisible();
    await expect(page.locator('.case-head .page-title')).toBeVisible();

    const firstAlg = page.locator('.alg').first();
    await expect(firstAlg).toContainText("(R' F' R)");

    await expectInsideViewport(page.locator('.case-player'), page);
    await expectNoHorizontalScroll(page);
  });

  test('练习设置：开始按钮可见、配色入口可操作、无横滚', async ({ page }) => {
    await open(page, '/#/practice');
    await expect(page.getByRole('heading', { level: 1, name: '练习' })).toBeVisible();

    const start = page.getByRole('button', { name: '开始练习' });
    await expect(start).toBeVisible();
    await expect(start).toBeEnabled();

    const colors = page.locator('#practice-colors');
    await expect(colors).toBeVisible();
    await colors.click();
    const dialog = page.getByRole('dialog');
    await expect(dialog).toBeVisible();
    await expect(dialog.getByRole('tab', { name: 'CFOP' })).toHaveAttribute('aria-selected', 'true');
    await dialog.getByRole('button', { name: '关闭配色' }).click();
    await expect(dialog).toBeHidden();
    await expect(colors).toBeFocused();

    await expectNoHorizontalScroll(page);
  });

  test('配色弹窗：两个 tab、关闭按钮、在视口内、焦点回入口', async ({ page }) => {
    await open(page, '/');
    const entry = page.locator('#browse-colors');
    await entry.click();

    const dialog = page.getByRole('dialog');
    await expect(dialog).toBeVisible();
    await expect(dialog.getByRole('tab', { name: 'CFOP' })).toHaveAttribute('aria-selected', 'true');
    await expect(dialog.getByRole('tab', { name: 'Roux' })).toBeVisible();
    await expectInsideViewport(dialog, page);

    await dialog.getByRole('tab', { name: 'Roux' }).click();
    await expect(dialog.getByRole('tab', { name: 'Roux' })).toHaveAttribute('aria-selected', 'true');

    await dialog.getByRole('button', { name: '关闭配色' }).click();
    await expect(dialog).toBeHidden();
    await expect(entry).toBeFocused();
    await expectNoHorizontalScroll(page);
  });

  test('试转：魔方舞台、九键和撤销/复原都在底栏上方、无横滚', async ({ page }) => {
    await open(page, '/#/search');
    await expect(page.getByRole('heading', { level: 1, name: '试转' })).toBeVisible();

    const stage = page.locator('.sandbox-stage');
    await expect(stage).toBeVisible();
    await expectInsideViewport(stage, page);

    const keys = page.locator('.sandbox-keys button');
    await expect(keys).toHaveCount(9);
    await expect(keys.first()).toBeVisible();

    const undo = page.getByRole('button', { name: '撤销最后一转' });
    const reset = page.getByRole('button', { name: '复原魔方' });
    await expect(undo).toBeVisible();
    await expect(reset).toBeVisible();
    await expectAboveNav(undo, page);
    await expectAboveNav(reset, page);

    await expectNoHorizontalScroll(page);
  });
});
