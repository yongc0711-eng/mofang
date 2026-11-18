import { expect, test } from '@playwright/test';

test('PLL Na 的长步骤跟随当前转法，公式入口和画布仍在首屏', async ({ page }) => {
  const width = page.viewportSize()!.width;
  await page.emulateMedia({ colorScheme: width === 320 ? 'dark' : 'light' });
  await page.goto('/#/case/pll-na');
  const track = page.getByRole('list', { name: '公式步骤', exact: true });
  const cue = page.getByRole('button', { name: '识别与公式', exact: true });
  const stage = (await page.locator('.player-stage').boundingBox())!;
  const cueBox = (await cue.boundingBox())!;
  const nav = (await page.locator('.nav').boundingBox())!;
  expect(stage.height).toBe(width === 320 ? 164 : 190);
  expect(cueBox.y + cueBox.height).toBeLessThanOrEqual(nav.y);
  await expect(track.locator('li')).toHaveCount(21);
  if (width === 320) expect(await track.evaluate(el => el.scrollHeight > el.clientHeight)).toBe(true);

  await page.getByRole('button', { name: '跳到结尾', exact: true }).click();
  await expect(track.locator('li').last()).toHaveClass('move-now');
  const last = (await track.locator('.move-now').boundingBox())!;
  const trackBox = (await track.boundingBox())!;
  expect(last.y + last.height).toBeLessThanOrEqual(trackBox.y + trackBox.height + 1);
  if (width === 320) expect(await track.evaluate(el => el.scrollTop)).toBeGreaterThan(0);
  expect(await page.evaluate(() => window.scrollY)).toBe(0);
  await page.getByRole('button', { name: '回到开头', exact: true }).click();
  await expect.poll(() => track.evaluate(el => el.scrollTop)).toBe(0);
  await cue.click();
  await expect(page.getByRole('heading', { name: '公式', exact: true })).toBeInViewport();
});

test('公式卡片保留括号分组，自定义连写公式按完整转法换行', async ({ page }) => {
  const compact = `（${"RwU2R'U'".repeat(7)}）2`;
  await page.addInitScript((custom) => localStorage.setItem('mofang.user.v1', JSON.stringify({
    version: 1,
    cases: { 'pll-ga': { customAlgs: [custom] } },
  })), compact);
  await page.goto('/#/case/pll-ga');
  const primary = page.locator('.alg-list .alg').first();
  expect(await primary.textContent()).toBe("R2 (U R' U R' U' R U') R2 D (U' R' U R) D'");
  await expect(primary.locator('.alg-phrase')).toHaveText(["(U R' U R' U' R U')", "(U' R' U R)"]);
  for (const phrase of await primary.locator('.alg-phrase').all()) {
    const lines = await phrase.locator('.alg-turn').evaluateAll(items => new Set(items.map(item => item.getBoundingClientRect().top)).size);
    expect(lines).toBe(1);
  }

  const custom = page.getByRole('button', { name: `查看这条公式的起手 ${compact}`, exact: true }).locator('.alg');
  expect(await custom.textContent()).toBe(compact);
  const turns = custom.locator('.alg-turn');
  await expect(turns).toHaveCount(28);
  await expect(turns.first()).toHaveText('（Rw');
  await expect(turns.last()).toHaveText("U'）2");
  const customLines = await turns.evaluateAll(items => new Set(items.map(item => item.getBoundingClientRect().top)).size);
  expect(customLines).toBeGreaterThan(1);
  expect(await page.evaluate(() => document.documentElement.scrollWidth)).toBe(page.viewportSize()!.width);
});
