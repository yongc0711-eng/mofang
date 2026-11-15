import { expect, test, type Locator, type Page } from '@playwright/test';

const screenshot = async (page: Page, name: string) => page.screenshot({ path: `ui-review.local/2x2-polish/after-${page.viewportSize()!.width}-${name}.png` });
async function noOverflow(page: Page) {
  expect(await page.evaluate(() => document.documentElement.scrollWidth)).toBe(page.viewportSize()!.width);
}
async function openDetail(page: Page, id: string) {
  await page.goto(`/#/case/${id}`);
  await expect(page.getByRole('button', { name: '播放', exact: true })).toBeEnabled();
  await page.waitForFunction(() => getComputedStyle(document.querySelector('.route')!).transform === 'none');
  // 浏览器回到已访问的 hash 时可恢复滚动；首屏预算必须从顶部测量。
  await page.evaluate(() => window.scrollTo(0, 0));
  await expect(page.locator('.case-page > .back')).toBeInViewport();
  expect((await page.locator('.case-head').boundingBox())!.y).toBeGreaterThanOrEqual(0);
}
async function fitsWithin(inner: Locator, outer: Locator) {
  const i = (await inner.boundingBox())!, o = (await outer.boundingBox())!;
  expect(i.x).toBeGreaterThanOrEqual(o.x);
  expect(i.y).toBeGreaterThanOrEqual(o.y);
  expect(i.x + i.width).toBeLessThanOrEqual(o.x + o.width);
  expect(i.y + i.height).toBeLessThanOrEqual(o.y + o.height);
}

test('二阶首页：展开和翻卡的简短说明、掌握数与进度都在卡片内', async ({ page }) => {
  for (const colorScheme of ['light', 'dark'] as const) {
    await page.emulateMedia({ colorScheme });
    await page.goto('/');
    const deck = page.locator('.home-method-deck[data-method="2x2"]');
    await deck.getByRole('button', { name: '二阶，展开全部分组', exact: true }).click();
    for (const card of await deck.locator('.set-card').all()) {
      await fitsWithin(card.locator('.set-body'), card);
      await expect(card.locator('.set-title > .small')).toHaveAttribute('title', /二阶/);
      await expect(card).toContainText('已掌握 0 / 42');
    }
    await deck.scrollIntoViewIfNeeded();
    await screenshot(page, `home-${colorScheme}`);
    await deck.getByRole('button', { name: '二阶，收起卡片', exact: true }).click();
    await deck.getByRole('button', { name: '二阶，展开全部分组', exact: true }).first().focus();
    await page.keyboard.press('ArrowUp');
    const current = deck.locator('.home-deck-card[aria-hidden="false"] .set-card');
    await expect(current).toHaveCount(1);
    await fitsWithin(current.locator('.set-body'), current);
    const footer = deck.locator('.home-deck-card[aria-hidden="false"] .home-deck-position');
    const body = (await current.locator('.set-body').boundingBox())!, f = (await footer.boundingBox())!;
    expect(body.y + body.height).toBeLessThanOrEqual(f.y);
    await noOverflow(page);
  }
});

for (const set of ['eg1', 'eg2']) test(`二阶列表 ${set}：双图各64px，标明顶底，公式完整收在卡片里`, async ({ page }) => {
  for (const colorScheme of ['light', 'dark'] as const) {
    await page.emulateMedia({ colorScheme });
    await page.goto(`/#/set/${set}`);
    await expect(page.locator('.case-card')).toHaveCount(42);
    for (const card of await page.locator('.case-card').all()) {
      const diagrams = card.locator('.diagram svg');
      await expect(diagrams).toHaveCount(2);
      const boxes = await Promise.all([0, 1].map(i => diagrams.nth(i).boundingBox()));
      for (const b of boxes) { expect(b!.width).toBe(64); expect(b!.height).toBe(64); }
      expect(boxes[0]!.x + boxes[0]!.width).toBeLessThanOrEqual(boxes[1]!.x);
      await expect(card.locator('figcaption')).toHaveText(['顶视', '底视']);
      await fitsWithin(card.locator('.alg'), card);
    }
    await noOverflow(page);
    await screenshot(page, `${set}-list-${colorScheme}`);
  }
});

test('二阶 EG 长名称：邻换和对角换首屏提示条不被底栏盖住', async ({ page }) => {
  for (const colorScheme of ['light', 'dark'] as const) {
    await page.emulateMedia({ colorScheme });
    for (const id of ['eg1-adj-1', 'eg1-diag-1', 'eg2-adj-1', 'eg2-diag-1']) {
      await openDetail(page, id);
      const peek = (await page.locator('.peek-cue').boundingBox())!, nav = (await page.locator('.nav').boundingBox())!;
      expect(peek.y + peek.height).toBeLessThanOrEqual(nav.y - 4);
      await fitsWithin(page.locator('.case-title-row .page-title'), page.locator('.case-head'));
      await noOverflow(page);
      await screenshot(page, `${id}-${colorScheme}`);
    }
  }
});

test('二阶详情：长标题不挤掉提示条，速度避开画布，键盘仅提供合法面转', async ({ page }) => {
  for (const colorScheme of ['light', 'dark'] as const) {
    await page.emulateMedia({ colorScheme });
    for (const id of ['cll-as-1', 'cll-adj-1', 'cll-diag-1', 'eg1-h-1', 'eg2-h-1']) {
      await openDetail(page, id);
      const nav = (await page.locator('.nav').boundingBox())!;
      const peek = (await page.locator('.peek-cue').boundingBox())!;
      expect(peek.y + peek.height).toBeLessThanOrEqual(nav.y - 4);
      const canvas = (await page.locator('.player-stage canvas').boundingBox())!;
      const speed = (await page.locator('.speed').boundingBox())!;
      expect(speed.y + speed.height).toBeLessThanOrEqual(canvas.y);
      expect(canvas.height).toBeGreaterThanOrEqual(120);
      await expect(page.locator('.case-head figcaption')).toHaveText(id.startsWith('cll') ? ['顶视'] : ['顶视', '底视']);
      await fitsWithin(page.locator('.case-title-row .page-title'), page.locator('.case-head'));
      await noOverflow(page);
      await screenshot(page, `${id}-${colorScheme}`);
    }
    await page.getByRole('button', { name: '公式键盘', exact: true }).click();
    const keyboard = page.getByRole('group', { name: '公式键盘', exact: true });
    await expect(keyboard.locator('.alg-keyboard-moves button')).toHaveText(['R', 'L', 'U', 'D', 'F', 'B']);
    for (const button of await keyboard.getByRole('button').all()) {
      const b = (await button.boundingBox())!;
      expect(b.width).toBeGreaterThanOrEqual(32); expect(b.height).toBeGreaterThanOrEqual(32);
    }
    await keyboard.getByRole('button', { name: 'R', exact: true }).click();
    await keyboard.getByRole('button', { name: '2', exact: true }).click();
    await expect(page.getByRole('textbox', { name: '公式', exact: true })).toHaveValue('R2');
    await keyboard.getByRole('button', { name: '退格', exact: true }).click();
    await expect(page.getByRole('textbox', { name: '公式', exact: true })).toHaveValue('R');
    await keyboard.getByRole('button', { name: '清空', exact: true }).click();
    await expect(page.getByRole('textbox', { name: '公式', exact: true })).toBeEmpty();
    await page.getByRole('textbox', { name: '公式', exact: true }).fill('M');
    await page.getByRole('button', { name: '保存', exact: true }).click();
    await expect(page.locator('.form-msg')).toHaveText('二阶不支持此转法：M');
  }
});
