import { test, expect, type Page } from '@playwright/test';
import type { PracticeSession } from '../src/lib/practiceSession';

const session = (page: Page): Promise<PracticeSession> => page.evaluate(() =>
  JSON.parse(localStorage.getItem('mofang.practice.v1') ?? 'null'));
const timesFor = (page: Page, id: string): Promise<number[]> => page.evaluate(caseId =>
  JSON.parse(localStorage.getItem('mofang.user.v1') ?? '{}').cases?.[caseId]?.times ?? [], id);

for (const { set, size, scheme } of [
  { set: 'eg1', size: 2, scheme: 'dark' },
  { set: 'pll', size: 3, scheme: 'light' },
] as const) {
  test(`${size} 阶重练复用原题，第二次用时单独记录`, async ({ page }) => {
    await page.emulateMedia({ colorScheme: scheme });
    await page.goto(`/#/practice?set=${set}`);
    await page.getByRole('button', { name: '开始练习', exact: true }).click();
    const practice = page.locator(`.practice[data-size="${size}"]`);
    const pad = practice.locator('.practice-pad');
    const time = practice.locator('.practice-time');
    const retry = page.getByRole('button', { name: '再练这题', exact: true });
    await expect(practice).toHaveAttribute('data-phase', 'ready');
    await expect(retry).toHaveCount(0);
    await expect.poll(async () => (await session(page))?.phase).toBe('ready');
    const original = await session(page);
    const originalDiagram = await practice.locator('.practice-case .diagram').innerHTML();
    expect(original.question.prepared?.version).toBe(size === 2 ? 3 : 2);

    await page.keyboard.press('Space');
    await expect(practice).toHaveAttribute('data-phase', 'running');
    await expect(retry).toHaveCount(0);
    await page.keyboard.press('Space');
    await expect(practice).toHaveAttribute('data-phase', 'done');
    await expect.poll(() => timesFor(page, original.question.id)).toHaveLength(1);
    const first = await timesFor(page, original.question.id);
    expect(first[0]).toBeGreaterThan(0);
    const details = page.getByRole('link', { name: '查看详情', exact: true });
    await expect(details).toHaveAttribute('href', `#/case/${original.question.id}`);
    const retryBox = (await retry.boundingBox())!;
    const detailBox = (await details.boundingBox())!;
    expect(retryBox.width).toBeGreaterThanOrEqual(32);
    expect(retryBox.height).toBeGreaterThanOrEqual(32);
    expect(retryBox.x + retryBox.width).toBeLessThanOrEqual(detailBox.x);
    expect(retryBox.y).toBeCloseTo(detailBox.y, 0);
    await expect(pad).toHaveCSS('touch-action', 'pan-y');
    expect(await page.evaluate(() => document.documentElement.scrollWidth)).toBe(page.viewportSize()!.width);

    if (size === 2) await retry.tap();
    else await retry.press('Enter');
    await expect(practice).toHaveAttribute('data-phase', 'ready');
    await expect(time).toHaveText('0.00');
    await expect(pad).toBeFocused();
    await expect.poll(async () => (await session(page)).phase).toBe('ready');
    expect(await session(page)).toMatchObject({ question: original.question, elapsedMs: 0, runningSince: null, count: 1 });
    expect(await practice.locator('.practice-case .diagram').innerHTML()).toBe(originalDiagram);
    expect(await timesFor(page, original.question.id)).toEqual(first);

    if (size === 2) {
      await page.reload();
      await expect(practice).toHaveAttribute('data-phase', 'ready');
      await expect(time).toHaveText('0.00');
      expect((await session(page)).question).toEqual(original.question);
    }
    await page.keyboard.press('Space');
    await expect(practice).toHaveAttribute('data-phase', 'running');
    await page.keyboard.press('Space');
    await expect(practice).toHaveAttribute('data-phase', 'done');
    await expect(practice.locator('.practice-bar').first()).toContainText('本次 2 题');
    await expect.poll(() => timesFor(page, original.question.id)).toHaveLength(2);
    const both = await timesFor(page, original.question.id);
    expect(both[0]).toBe(first[0]);
    expect(both[1]).toBeGreaterThan(0);

    if (size === 2) await time.tap();
    else await page.keyboard.press('Space');
    await expect(practice).toHaveAttribute('data-phase', 'ready');
    await expect.poll(async () => (await session(page)).question.id).not.toBe(original.question.id);
  });
}
