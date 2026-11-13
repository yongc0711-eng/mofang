import { test, expect, type Locator, type Page } from '@playwright/test';

const deck = (page: Page, method: 'cfop' | 'roux' | '2x2') => page.locator(`.home-method-deck[data-method="${method}"]`);
const front = (method: Locator) => method.locator('.home-deck-card[aria-hidden="false"]:not([hidden])');
const idle = (method: Locator) => expect(method).toHaveAttribute('data-motion', 'idle');
const expand = (method: Locator) => method.getByRole('button', { name: /展开全部分组$/ });
async function noOverflow(page: Page) {
  const widths = await page.evaluate(() => ({ scroll: document.documentElement.scrollWidth, client: document.documentElement.clientWidth }));
  expect(widths.scroll).toBe(widths.client);
}
async function swipe(page: Page, method: Locator, direction = 1, distance = 58, cancel = false) {
  await idle(method);
  await front(method).scrollIntoViewIfNeeded();
  const box = (await front(method).boundingBox())!;
  const x = box.x + box.width * .36, y = box.y + 40;
  const session = await page.context().newCDPSession(page);
  try {
    await session.send('Input.dispatchTouchEvent', { type: 'touchStart', touchPoints: [{ x, y }] });
    await session.send('Input.dispatchTouchEvent', { type: 'touchMove', touchPoints: [{ x, y: y - direction * distance / 2 }] });
    await session.send('Input.dispatchTouchEvent', { type: 'touchMove', touchPoints: [{ x, y: y - direction * distance }] });
    await session.send('Input.dispatchTouchEvent', { type: cancel ? 'touchCancel' : 'touchEnd', touchPoints: [] });
  } finally { await session.detach(); }
  await idle(method);
}

test('三卡堆：浅深色纯文字封面、卡内展开、十二入口与搜索行配色', async ({ page }) => {
  const width = page.viewportSize()!.width;
  for (const colorScheme of ['light', 'dark'] as const) {
    await page.emulateMedia({ colorScheme });await page.goto('/');
    await expect(page.getByRole('heading', { name: '三阶', exact: true })).toHaveCount(1);
    await expect(page.locator('.home-method-deck')).toHaveCount(3);
    await expect(page.locator('.home-deck-cover .diagram')).toHaveCount(0);
    await expect(page.locator('.set-card')).toHaveCount(12);
    await expect(page.locator('.set-card .diagram')).toHaveCount(12);
    const nav = (await page.locator('.nav').boundingBox())!;
    for (const method of [deck(page, 'cfop'), deck(page, 'roux'), deck(page, '2x2')]) {
      await expect(method).toHaveAttribute('data-index', '0');
      const card = (await front(method).boundingBox())!;
      expect(card.height).toBe(width === 320 ? 96 : 100);expect(card.width).toBeGreaterThan(card.height);
      expect(card.y + card.height).toBeLessThanOrEqual(nav.y);
      const button = (await expand(method).boundingBox())!;
      expect(button.width).toBeGreaterThanOrEqual(32);expect(button.height).toBeGreaterThanOrEqual(32);
      expect(button.x).toBeGreaterThanOrEqual(card.x);expect(button.x + button.width).toBeLessThanOrEqual(card.x + card.width);
      expect(button.y + button.height).toBeLessThanOrEqual(card.y + card.height);
    }
    const search = (await page.getByRole('searchbox', { name: '搜索公式' }).boundingBox())!;
    const palette = page.locator('#browse-colors'),paletteBox = (await palette.boundingBox())!;
    await expect(palette).toHaveCount(1);expect(paletteBox.width).toBe(44);expect(paletteBox.height).toBe(44);
    expect(paletteBox.y).toBe(search.y);expect(paletteBox.x).toBeGreaterThan(search.x + search.width);
    await noOverflow(page);
    await page.screenshot({ path: `ui-review.local/home-decks/after-${width}-${colorScheme}.png` });
    for (const method of [deck(page, 'cfop'), deck(page, 'roux'), deck(page, '2x2')]) await expand(method).click();
    await expect(page.locator('.set-card').filter({ visible: true })).toHaveCount(12);
    expect(await page.locator('.set-card').evaluateAll(links => links.map(link => link.getAttribute('href')))).toEqual(['#/set/f2l', '#/set/oll', '#/set/pll', '#/set/coll', '#/set/wv', '#/set/cmll', '#/set/lse', '#/set/sbls', '#/set/eolr', '#/set/cll', '#/set/eg1', '#/set/eg2']);
    for (const link of await page.locator('.set-card').all()) {
      await link.evaluate(el => el.scrollIntoView({ block: 'center' }));
      const box = (await link.boundingBox())!,bottomNav = (await page.locator('.nav').boundingBox())!;
      expect(box.height).toBeGreaterThanOrEqual(32);expect(box.y + box.height).toBeLessThanOrEqual(bottomNav.y);
      await expect(link.locator('.progress')).toBeVisible();
    }
    await noOverflow(page);
    await page.screenshot({ path: `ui-review.local/home-decks/expanded-${width}-${colorScheme}.png`, fullPage: true });
  }
});

test('展开与进入独立：直达原列表、返回保留位置和展开状态、键盘焦点', async ({ page }) => {
  await page.goto('/');const cfop = deck(page, 'cfop'),roux = deck(page, 'roux');
  await expand(cfop).focus();await page.keyboard.press('ArrowUp');
  await expect(cfop).toHaveAttribute('data-index', '1');
  await expect(front(cfop).locator('.set-card')).toBeFocused();
  await expand(cfop).click();await expect(cfop).toHaveAttribute('data-expanded', 'true');
  await expect(cfop.locator('.home-deck-close')).toBeFocused();await expect(page).toHaveURL(/\/$/);
  await cfop.locator('a[href="#/set/pll"]').click();await expect(page).toHaveURL(/#\/set\/pll$/);
  await expect(page.locator('.case-card')).toHaveCount(21);
  await page.goBack();await expect(cfop).toHaveAttribute('data-expanded', 'true');await expect(cfop).toHaveAttribute('data-index', '1');
  await cfop.locator('.home-deck-close').click();await expect(expand(cfop)).toBeFocused();
  await front(cfop).locator('.set-card').click();await expect(page).toHaveURL(/#\/set\/f2l$/);
  await expect(page.locator('.case-card')).toHaveCount(41);await page.locator('.set-back').click();
  await expect(cfop).toHaveAttribute('data-index', '1');await expect(cfop).toHaveAttribute('data-expanded', 'false');
  await expect(roux).toHaveAttribute('data-index', '0');
  await expand(cfop).focus();await page.keyboard.press('ArrowDown');await expect(cfop).toHaveAttribute('data-index', '0');
  await expect(expand(cfop)).toBeFocused();await page.keyboard.press('ArrowDown');await expect(cfop).toHaveAttribute('data-index', '5');
  await expect(front(cfop).locator('.set-card')).toBeFocused();await page.keyboard.press('ArrowUp');await expect(cfop).toHaveAttribute('data-index', '0');
  expect(await cfop.evaluate(el => el.getAnimations({ subtree: true }).length)).toBe(0);
});

test('首页搜索、真实进度和方法配色继续工作，宽屏无溢出', async ({ page }) => {
  await page.addInitScript(() => localStorage.setItem('mofang.user.v1', JSON.stringify({ version: 1, cases: { 'pll-t': { status: 'mastered' } } })));
  await page.goto('/');await expect(page.locator('.home-head')).toContainText('已掌握 1 条');
  const cfop = deck(page, 'cfop'),roux = deck(page, 'roux');await expand(cfop).click();await expand(roux).click();
  await expect(cfop.locator('[data-set="pll"]')).toContainText('已掌握 1 / 21');
  const pll = cfop.locator('[data-set="pll"] .diagram'),cmll = roux.locator('[data-set="cmll"] .diagram');
  const beforeCfop = await pll.innerHTML(),beforeRoux = await cmll.innerHTML();
  await page.locator('#browse-colors').click();const dialog = page.getByRole('dialog', { name: '浏览配色' });
  await dialog.getByRole('tab', { name: 'Roux', exact: true }).click();
  await dialog.getByRole('button', { name: '底面黄色', exact: true }).click();
  await dialog.getByRole('button', { name: '关闭配色', exact: true }).click();await expect(page.locator('#browse-colors')).toBeFocused();
  expect(await pll.innerHTML()).toBe(beforeCfop);expect(await cmll.innerHTML()).not.toBe(beforeRoux);
  const query = page.getByRole('searchbox', { name: '搜索公式' });await query.fill('pll-t');
  await expect(page.locator('.home-results .case-card[href="#/case/pll-t"]')).toBeVisible();
  await expect(page.locator('.home-results')).toContainText('找到');await expect(page.locator('.home-method-deck')).toHaveCount(3);
  await query.fill('不存在的情形xyz123');await expect(page.locator('.home-results')).toContainText('没有匹配的公式');
  await query.fill('');await expect(page.locator('.home-results')).toHaveCount(0);await noOverflow(page);
  await page.setViewportSize({ width: 1280, height: 900 });
  await expect.poll(() => page.locator('.home-decks').evaluate(el => getComputedStyle(el).gridTemplateColumns.split(' ').length)).toBe(2);
  const [first, second, third] = await page.locator('.home-method-deck').evaluateAll(elements => elements.map(el => el.getBoundingClientRect().toJSON()));
  expect(first.y).toBe(second.y);expect(first.x + first.width).toBeLessThan(second.x);expect(third.y).toBeGreaterThan(first.y);await noOverflow(page);
});

test.describe('正常动效与触屏', () => {
  test.use({ reducedMotion: 'no-preference' });
  test('滑动归位后第一次轻点即可进入，返回不产生重复历史', async ({ page }) => {
    const session = await page.context().newCDPSession(page);
    try {
      for (const reducedMotion of ['no-preference', 'reduce'] as const) {
        await page.emulateMedia({ reducedMotion });
        for (const entry of [{ method: 'cfop', set: 'f2l', cases: 41 }, { method: 'roux', set: 'cmll', cases: 42 }] as const) {
          await page.goto('/');await expect(page.locator('.route')).toHaveCSS('transform', 'none');
          const method = deck(page, entry.method);
          const box = (await method.locator('.home-deck-pile').boundingBox())!;
          const x = box.x + box.width * .36, y = box.y + 52;
          await session.send('Input.dispatchTouchEvent', { type: 'touchStart', touchPoints: [{ x, y }] });
          // 单个 move 可复现安卓触屏在归位后吞掉下一次轻点的问题。
          await session.send('Input.dispatchTouchEvent', { type: 'touchMove', touchPoints: [{ x, y: y - 58 }] });
          await session.send('Input.dispatchTouchEvent', { type: 'touchEnd', touchPoints: [] });
          await expect(method).toHaveAttribute('data-index', '1');await idle(method);
          await page.waitForTimeout(300);await expect(page).toHaveURL(/\/$/);
          await page.touchscreen.tap(x, y);
          await expect(page).toHaveURL(new RegExp(`#/set/${entry.set}$`));
          await expect(page.locator('.case-card')).toHaveCount(entry.cases);
          await page.goBack();await expect(page).toHaveURL(/\/$/);
          await expect(method).toHaveAttribute('data-index', '1');await noOverflow(page);
        }
      }
    } finally { await session.detach(); }
  });
  test('连续快滑：接管未结束的动画、1:1 跟手、逐次计数且不积压', async ({ page }) => {
    const errors: string[] = [];page.on('pageerror', error => errors.push(error.message));
    await page.goto('/');await expect(page.locator('.route')).toHaveCSS('transform', 'none');
    const cfop = deck(page, 'cfop'),roux = deck(page, 'roux');
    await expand(cfop).focus();await page.keyboard.press('ArrowUp');
    await expect(cfop).toHaveAttribute('data-index', '1');await expect(cfop).toHaveAttribute('data-motion', 'flip');
    // 把动画停在中途，确保这次触摸确实发生在上一张尚未归位时。
    await cfop.evaluate(el => el.getAnimations({ subtree: true }).forEach(animation => { animation.pause();animation.currentTime = 60; }));
    const before = (await front(cfop).boundingBox())!;
    const session = await page.context().newCDPSession(page);
    async function rawSwipe(method: Locator, direction: number) {
      const box = (await method.locator('.home-deck-pile').boundingBox())!;
      const x = box.x + box.width * .36,y = box.y + 52;
      await session.send('Input.dispatchTouchEvent', { type: 'touchStart', touchPoints: [{ x, y }] });
      await session.send('Input.dispatchTouchEvent', { type: 'touchMove', touchPoints: [{ x, y: y - direction * 28 }] });
      await session.send('Input.dispatchTouchEvent', { type: 'touchMove', touchPoints: [{ x, y: y - direction * 58 }] });
      await session.send('Input.dispatchTouchEvent', { type: 'touchEnd', touchPoints: [] });
    }
    try {
      const pile = (await cfop.locator('.home-deck-pile').boundingBox())!;
      const x = pile.x + pile.width * .36,y = pile.y + 52;
      await session.send('Input.dispatchTouchEvent', { type: 'touchStart', touchPoints: [{ x, y }] });
      const held = (await front(cfop).boundingBox())!;
      expect(Math.abs(held.y - before.y)).toBeLessThan(.5);
      await session.send('Input.dispatchTouchEvent', { type: 'touchMove', touchPoints: [{ x, y: y - 24 }] });
      await page.evaluate(() => new Promise<void>(resolve => requestAnimationFrame(() => resolve())));
      const dragged = (await front(cfop).boundingBox())!;
      expect(Math.abs(dragged.y - (held.y - 24))).toBeLessThan(1);
      await session.send('Input.dispatchTouchEvent', { type: 'touchMove', touchPoints: [{ x, y: y - 58 }] });
      await session.send('Input.dispatchTouchEvent', { type: 'touchEnd', touchPoints: [] });
      await expect(cfop).toHaveAttribute('data-index', '2');
      // 故意不等 idle：连续 8 次上滑、再 3 次下滑，每个手势都必须计入。
      for (let i = 0; i < 8; i += 1) {
        await rawSwipe(cfop, 1);await expect(cfop).toHaveAttribute('data-index', String((3 + i) % 6));
      }
      await expect(cfop).toHaveAttribute('data-index', '4');
      for (let i = 0; i < 3; i += 1) {
        await rawSwipe(cfop, -1);await expect(cfop).toHaveAttribute('data-index', String((3 - i) % 6));
      }
      await expect(cfop).toHaveAttribute('data-index', '1');
      for (let i = 0; i < 6; i += 1) {
        await rawSwipe(roux, 1);await expect(roux).toHaveAttribute('data-index', String((1 + i) % 5));
      }
      await expect(roux).toHaveAttribute('data-index', '1');await expect(cfop).toHaveAttribute('data-index', '1');
      await idle(cfop);await idle(roux);
      await page.waitForTimeout(260);
      await expect(cfop).toHaveAttribute('data-index', '1');await expect(roux).toHaveAttribute('data-index', '1');
      await expect(page).toHaveURL(/\/$/);await noOverflow(page);
      // 快滑后一个新的轻点立即进入当前分组。
      await rawSwipe(cfop, 1);await expect(cfop).toHaveAttribute('data-index', '2');
      const tap = (await cfop.locator('.home-deck-pile').boundingBox())!;
      await session.send('Input.dispatchTouchEvent', { type: 'touchStart', touchPoints: [{ x: tap.x + tap.width * .36, y: tap.y + 52 }] });
      await session.send('Input.dispatchTouchEvent', { type: 'touchEnd', touchPoints: [] });
      await expect(page).toHaveURL(/#\/set\/oll$/);
      expect(errors).toEqual([]);
    } finally { await session.detach(); }
  });

  test('两堆首尾双向循环，动效不透明且不超过 220ms，无自动导航', async ({ page }) => {
    await page.goto('/');const cfop = deck(page, 'cfop'),roux = deck(page, 'roux');
    for (const index of [1, 2, 3, 4, 5, 0]) { await swipe(page, cfop);await expect(cfop).toHaveAttribute('data-index', String(index)); }
    await swipe(page, cfop, -1);await expect(cfop).toHaveAttribute('data-index', '5');
    await swipe(page, cfop);await expect(cfop).toHaveAttribute('data-index', '0');
    for (const index of [1, 2, 3, 4, 0]) { await swipe(page, roux);await expect(roux).toHaveAttribute('data-index', String(index)); }
    await swipe(page, roux, -1);await expect(roux).toHaveAttribute('data-index', '4');await expect(cfop).toHaveAttribute('data-index', '0');
    await expand(cfop).focus();await page.keyboard.press('ArrowUp');await expect(cfop).toHaveAttribute('data-motion', 'flip');
    const timings = await cfop.evaluate(el => el.getAnimations({ subtree: true }).map(animation => ({ duration: animation.effect!.getTiming().duration, frames: (animation.effect as KeyframeEffect).getKeyframes() })));
    expect(timings.length).toBe(6);
    for (const timing of timings) { expect(timing.duration).toBe(220);expect(timing.frames.every(frame => !('opacity' in frame))).toBe(true); }
    await idle(cfop);await expect(front(cfop).locator('.set-card')).toBeFocused();await expect(page).toHaveURL(/\/$/);await noOverflow(page);
  });

  test('轻微拖动/取消不翻卡，滑动松手不误进，独立轻点仍可进入', async ({ page }) => {
    await page.goto('/');const cfop = deck(page, 'cfop');await swipe(page, cfop);await expect(cfop).toHaveAttribute('data-index', '1');
    await swipe(page, cfop, 1, 13);await expect(cfop).toHaveAttribute('data-index', '1');await expect(page).toHaveURL(/\/$/);
    await swipe(page, cfop, 1, 58, true);await expect(cfop).toHaveAttribute('data-index', '1');await expect(page).toHaveURL(/\/$/);
    await expand(cfop).click();await idle(cfop);await expect(page).toHaveURL(/\/$/);await expect(cfop).toHaveAttribute('data-expanded', 'true');
    await cfop.locator('.home-deck-close').click();await idle(cfop);await expect(expand(cfop)).toBeFocused();
    await front(cfop).locator('.set-card').click();await expect(page).toHaveURL(/#\/set\/f2l$/);
    await page.goBack();await expect(cfop).toHaveAttribute('data-index', '1');await expect(cfop).toHaveAttribute('data-expanded', 'false');
    await page.emulateMedia({ reducedMotion: 'reduce' });await expand(cfop).focus();await page.keyboard.press('ArrowDown');
    await expect(cfop).toHaveAttribute('data-index', '0');await expect(cfop).toHaveAttribute('data-motion', 'idle');
    expect(await cfop.evaluate(el => el.getAnimations({ subtree: true }).length)).toBe(0);
    await expand(cfop).click();await expect(cfop).toHaveAttribute('data-expanded', 'true');await expect(cfop).toHaveAttribute('data-motion', 'idle');
    expect(await cfop.evaluate(el => el.getAnimations({ subtree: true }).length)).toBe(0);
  });
});
