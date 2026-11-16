import { test, expect, type Page } from '@playwright/test';

const sizes = (page: Page) => page.getByRole('group', { name: '魔方阶数', exact: true });
const turn = (page: Page, key: string) => page.getByRole('button', { name: `转动 ${key}`, exact: true });
async function expectSameFrame(page: Page, before: Buffer, after: Buffer) {
  const comparison = await page.evaluate(async ([a, b]) => {
    const decode = async (png: string) => {
      const image = new Image(); image.src = 'data:image/png;base64,' + png; await image.decode();
      const canvas = document.createElement('canvas'); canvas.width = image.width; canvas.height = image.height;
      const context = canvas.getContext('2d')!; context.drawImage(image, 0, 0);
      return { width: image.width, height: image.height, rgba: context.getImageData(0, 0, image.width, image.height).data };
    };
    const [left, right] = await Promise.all([decode(a), decode(b)]);
    let maxDifference = 0;
    for (let i = 0; i < left.rgba.length; i++) maxDifference = Math.max(maxDifference, Math.abs(left.rgba[i] - right.rgba[i]));
    return { sameSize: left.width === right.width && left.height === right.height, maxDifference };
  }, [before.toString('base64'), after.toString('base64')]);
  expect(comparison.sameSize).toBe(true);
  // WebGL can round antialiased edges by one channel level (D28); state tests remain exact.
  expect(comparison.maxDifference).toBeLessThanOrEqual(1);
}
async function expectCubeMargin(page: Page, png: Buffer) {
  const coloredEdgePixels = await page.evaluate(async encoded => {
    const image = new Image(); image.src = 'data:image/png;base64,' + encoded; await image.decode();
    const canvas = document.createElement('canvas'); canvas.width = image.width; canvas.height = image.height;
    const context = canvas.getContext('2d')!; context.drawImage(image, 0, 0);
    const data = context.getImageData(0, 0, image.width, image.height).data;
    let count = 0;
    // Cube face colors must leave a 6px margin; neutral rounded panel edges are excluded.
    for (let y = 0; y < image.height; y++) {
      if (y >= 6 && y < image.height - 6) continue;
      for (let x = 24; x < image.width - 24; x++) {
        const i = (y * image.width + x) * 4;
        if (Math.max(data[i], data[i + 1], data[i + 2]) - Math.min(data[i], data[i + 1], data[i + 2]) > 32) count++;
      }
    }
    return count;
  }, png.toString('base64'));
  expect(coloredEdgePixels).toBe(0);
}
async function fits(page: Page) {
  const width = page.viewportSize()!.width, nav = (await page.locator('.nav').boundingBox())!;
  for (const selector of ['.play-title-row', '.sandbox-stage', '.sandbox-controls', '.sandbox-footer']) {
    const b = (await page.locator(selector).boundingBox())!;
    expect(b.x).toBeGreaterThanOrEqual(16); expect(b.x + b.width).toBeLessThanOrEqual(width - 16);
    if (width < 800) expect(b.y + b.height).toBeLessThanOrEqual(nav.y - 8);
  }
  for (const button of await page.locator('.play-page button').all()) {
    const b = (await button.boundingBox())!;
    expect(b.width).toBeGreaterThanOrEqual(32); expect(b.height).toBeGreaterThanOrEqual(32);
  }
  expect(await page.evaluate(() => document.documentElement.scrollWidth)).toBe(width);
}

/** Enter the play page on the 2×2 model and return its canvas plus the clean frame. */
async function enterTwoByTwo(page: Page, scheme: 'light' | 'dark') {
  const errors: string[] = []; page.on('pageerror', error => errors.push(error.message));
  await page.emulateMedia({ colorScheme: scheme }); await page.goto('/#/search');
  await expect(turn(page, 'R')).toBeEnabled();
  await sizes(page).getByRole('button', { name: '二阶', exact: true }).click();
  await expect(page.locator('.sandbox-layout')).toHaveAttribute('data-size', '2');
  await expect(turn(page, 'R')).toBeEnabled();
  const canvas = page.locator('.sandbox-stage canvas');
  return { errors, canvas };
}

for (const scheme of ['light', 'dark'] as const) {
  test(`试转二阶 ${scheme}：模型切换、九键与首屏避开底栏`, async ({ page }) => {
    const errors: string[] = []; page.on('pageerror', error => errors.push(error.message));
    await page.emulateMedia({ colorScheme: scheme }); await page.goto('/#/search');
    await expect(turn(page, 'R')).toBeEnabled();
    await expect(page.locator('.sandbox-layout')).toHaveAttribute('data-size', '3');
    await fits(page);
    await sizes(page).getByRole('button', { name: '二阶', exact: true }).click();
    await expect(turn(page, 'R')).toBeEnabled();
    await expect(page.locator('.sandbox-layout')).toHaveAttribute('data-size', '2');
    await expect(page.locator('.sandbox-stage canvas')).toHaveCount(1);
    await expect(page.locator('.sandbox-keys button')).toHaveText(['R', 'U', 'F', 'L', 'D', 'B', 'x', 'y', 'z']);
    await expect(page.locator('.sandbox-controls button')).toHaveCount(14);
    await expect(page.getByRole('button', { name: '切换更多转法', exact: true })).toHaveCount(0);
    await expect(sizes(page).getByRole('button', { name: '二阶', exact: true })).toHaveAttribute('aria-pressed', 'true');
    await fits(page);
    const initial = await page.locator('.sandbox-stage canvas').screenshot({ path: `ui-review.local/lab-2x2/initial-${page.viewportSize()!.width}-${scheme}.png` });
    await expectCubeMargin(page, initial);
    expect(errors).toEqual([]);
  });

  test(`试转二阶 ${scheme}：后缀、撤销与转体后的画面`, async ({ page }) => {
    const { errors, canvas } = await enterTwoByTwo(page, scheme);
    const initial = await canvas.screenshot();
    const prime = page.getByRole('button', { name: "后缀 '", exact: true });
    const undo = page.getByRole('button', { name: '撤销最后一转', exact: true });
    await prime.click(); await turn(page, 'R').click(); await expect(undo).toBeEnabled();
    expect((await canvas.screenshot()).equals(initial)).toBe(false);
    await sizes(page).getByRole('button', { name: '二阶', exact: true }).click();
    await expect(undo).toBeEnabled(); await expect(prime).toHaveAttribute('aria-pressed', 'true');
    await undo.click(); await expect(page.locator('.sandbox-queue')).toHaveText('待转 0 / 16');
    await expect(undo).toBeDisabled(); await expectSameFrame(page, initial, await canvas.screenshot({ path: `ui-review.local/lab-2x2/undo-${page.viewportSize()!.width}-${scheme}.png` }));
    await expect(prime).toHaveAttribute('aria-pressed', 'true');
    for (const axis of ['x', 'y', 'z']) {
      await turn(page, axis).click(); await expect(undo).toBeEnabled();
      await expect(prime).toHaveAttribute('aria-pressed', 'true');
      expect((await canvas.screenshot()).equals(initial)).toBe(false);
      await undo.click(); await expect(page.locator('.sandbox-queue')).toHaveText('待转 0 / 16');
      await expect(undo).toBeDisabled(); await expectSameFrame(page, initial, await canvas.screenshot());
    }
    expect(errors).toEqual([]);
  });

  test(`试转二阶 ${scheme}：连续转体、复原后回三阶`, async ({ page }) => {
    const { errors, canvas } = await enterTwoByTwo(page, scheme);
    const initial = await canvas.screenshot();
    const undo = page.getByRole('button', { name: '撤销最后一转', exact: true });
    await page.getByRole('button', { name: '后缀 2', exact: true }).click();
    for (const key of ['U', 'F', 'L', 'D', 'B', 'x', 'y', 'z']) await turn(page, key).click();
    await expect(page.locator('.sandbox-queue')).toHaveText('待转 0 / 16');
    await expect(undo).toBeEnabled();
    await page.getByRole('button', { name: '复原魔方', exact: true }).click();
    await expect(undo).toBeDisabled();
    await expect(page.getByRole('button', { name: '无后缀', exact: true })).toHaveAttribute('aria-pressed', 'true');
    await expectSameFrame(page, initial, await canvas.screenshot());
    await page.screenshot({ path: `ui-review.local/lab-2x2/2x2-${page.viewportSize()!.width}-${scheme}.png` });
    await sizes(page).getByRole('button', { name: '三阶', exact: true }).click();
    await expect(turn(page, 'R')).toBeEnabled(); await expect(undo).toBeDisabled();
    await expect(page.locator('.sandbox-keys button')).toHaveText(['R', 'U', 'F', 'L', 'D', 'B', 'x', 'y', 'z']);
    await expect(page.locator('.sandbox-stage canvas')).toHaveCount(1); await fits(page);
    await page.getByRole('button', { name: '切换更多转法', exact: true }).click();
    await turn(page, 'M').click(); await expect(undo).toBeEnabled();
    await page.screenshot({ path: `ui-review.local/lab-2x2/3x3-${page.viewportSize()!.width}-${scheme}.png` });
    expect(errors).toEqual([]);
  });
}

test('试转切换时取消旧队列和动画，快速往返不残留旧场景或状态', async ({ page }) => {
  const errors: string[] = []; page.on('pageerror', error => errors.push(error.message));
  await page.goto('/#/search'); await expect(turn(page, 'R')).toBeEnabled();
  // Fill the queue synchronously so switching happens before the 16 turns can finish.
  await page.evaluate(() => {
    const button = document.querySelector<HTMLButtonElement>('[aria-label="转动 R"]')!;
    for (let i = 0; i < 16; i++) button.click();
  });
  await sizes(page).getByRole('button', { name: '二阶', exact: true }).click();
  await expect(turn(page, 'R')).toBeEnabled();
  await expect(page.getByRole('button', { name: '撤销最后一转', exact: true })).toBeDisabled();
  await expect(page.locator('.sandbox-queue')).toHaveText('待转 0 / 16');
  await turn(page, 'F').click();
  await sizes(page).getByRole('button', { name: '三阶', exact: true }).click();
  await sizes(page).getByRole('button', { name: '二阶', exact: true }).click();
  await expect(turn(page, 'R')).toBeEnabled();
  await expect(page.locator('.sandbox-stage canvas')).toHaveCount(1);
  await expect(page.locator('.sandbox-queue')).toHaveText('待转 0 / 16');
  await expect(page.getByRole('button', { name: '撤销最后一转', exact: true })).toBeDisabled();
  await turn(page, 'B').click();
  await expect(page.getByRole('button', { name: '撤销最后一转', exact: true })).toBeEnabled();
  await fits(page); expect(errors).toEqual([]);
});

test('试转宽屏两阶布局与取景可用，拖动和双击后仍能转动', async ({ page }) => {
  await page.setViewportSize({ width: 1280, height: 900 });
  await page.goto('/#/search');
  for (const size of [2, 3] as const) {
    await sizes(page).getByRole('button', { name: size === 2 ? '二阶' : '三阶', exact: true }).click();
    await expect(turn(page, 'R')).toBeEnabled();
    const canvas = page.locator('.sandbox-stage canvas'), b = (await canvas.boundingBox())!;
    await page.mouse.move(b.x + b.width / 2, b.y + b.height / 2);
    await page.mouse.down(); await page.mouse.move(b.x + b.width / 2 + 60, b.y + b.height / 2 + 20, { steps: 5 }); await page.mouse.up();
    await canvas.dblclick();
    if (size === 2) await expectCubeMargin(page, await canvas.screenshot());
    await turn(page, 'R').click();
    await expect(page.getByRole('button', { name: '撤销最后一转', exact: true })).toBeEnabled();
    await fits(page);
    await page.screenshot({ path: `ui-review.local/lab-2x2/${size}x${size}-1280.png` });
  }
});