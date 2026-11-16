import { test, expect, type Page } from '@playwright/test';

async function noOverflow(page: Page) {
  expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(true);
}
const cases = {
  cll: ['cll-as-1', 'cll-h-1', 'cll-adj-1'],
  eg1: ['eg1-as-1', 'eg1-h-1', 'eg1-diag-1'],
  eg2: ['eg2-pi-1', 'eg2-u-1', 'eg2-diag-1'],
};
for (const scheme of ['light', 'dark'] as const) for (const [set, ids] of Object.entries(cases)) {
  test(`二阶识别 ${set} ${scheme}：按图持方、少量比色点，首屏入口和长文字不溢出`, async ({ page }) => {
    await page.emulateMedia({ colorScheme: scheme });
    const errors: string[] = []; page.on('pageerror', error => errors.push(error.message));
    for (const id of ids) {
      await page.goto(`/#/case/${id}`);
      const peek = page.getByRole('button', { name: '识别与公式', exact: true });
      await expect(peek).toBeVisible();
      await page.evaluate(() => window.scrollTo(0, 0));
      const box = (await peek.boundingBox())!, nav = (await page.locator('.nav').boundingBox())!;
      expect(box.y + box.height).toBeLessThanOrEqual(nav.y);
      await peek.click();
      const section = page.getByRole('region', { name: '二阶识别提示', exact: true });
      await expect(section).toBeVisible();
      await expect(section.getByRole('heading', { name: '识别提示', exact: true })).toBeVisible();
      await expect(section).toContainText('先看底层'); await expect(section).toContainText('再看顶色');
      await expect(section).toContainText('区分相似情形');
      const count = await section.getByRole('listitem').count(); expect([1, 2]).toContain(count);
      await expect(section).toContainText('顶视图前侧在下');
      if (set === 'cll') await expect(section).toContainText('白色底层已还原');
      if (set === 'eg1') await expect(section).toContainText('底层唯一同色边');
      if (set === 'eg2') await expect(section).toContainText('底层四个侧面都没有同色边');
      if (id.endsWith('diag-1') || id.endsWith('adj-1')) {
        await expect(section).toContainText('顶面四角均为黄色');
        await expect(section.getByRole('listitem')).toContainText(id.endsWith('adj-1') ? '顶层唯一同色边' : '顶层四个侧面都没有同色边');
      }
      if (id === 'eg1-as-1') await expect(section).toContainText('同色边在左侧（红色）');
      for (const row of await section.locator('p, li').all()) {
        const b = (await row.boundingBox())!;
        expect(b.x).toBeGreaterThanOrEqual(16); expect(b.x + b.width).toBeLessThanOrEqual(page.viewportSize()!.width - 16);
      }
      await noOverflow(page);
    }
    await page.screenshot({ path: `ui-review.local/recognition-2x2/${set}-${page.viewportSize()!.width}-${scheme}.png`, fullPage: true });
    expect(errors).toEqual([]);
  });
}

for (const [index, colors] of [
  [['white', '黄'], ['yellow', '白'], ['red', '橙']],
  [['orange', '红'], ['green', '蓝'], ['blue', '绿']],
].entries()) test(`二阶识别六底配色与图解同步（第 ${index + 1} 组）`, async ({ page }) => {
  for (const [bottom, top] of colors) {
    await page.goto('/');
    await page.evaluate(bottomColor => localStorage.setItem('mofang.device.v1', JSON.stringify({ twoByTwo: { bottomColor }, cfop: { bottomColor: 'white' } })), bottom);
    await page.goto('/#/case/eg1-as-1'); await page.reload();
    const section = page.getByRole('region', { name: '二阶识别提示', exact: true });
    await expect(section.locator('p').nth(1)).toContainText(`顶面${top}角在左后`);
    await expect(section).toContainText('同色边在左侧');
    await expect(section.getByRole('listitem')).toHaveCount(2);
    await noOverflow(page);
  }
});

test('切换二阶公式后提示仍跟随当前图解，三阶保持原识别文字', async ({ page }) => {
  await page.goto('/');
  await page.evaluate(() => localStorage.setItem('mofang.device.v1', JSON.stringify({ twoByTwo: { bottomColor: 'blue' }, cfop: { bottomColor: 'white' } })));
  await page.goto('/#/case/eg1-as-1'); await page.reload();
  await page.locator('.alg-list .alg').nth(1).click();
  await expect(page.getByRole('region', { name: '二阶识别提示', exact: true })).toContainText('顶面绿角在左后');
  await page.goto('/#/case/oll-5');
  await expect(page.getByRole('region', { name: '二阶识别提示', exact: true })).toHaveCount(0);
  await expect(page.locator('.recognition')).toContainText('黄棱');
});
