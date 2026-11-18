import { expect, test } from '@playwright/test';

test('首页搜索按阶数筛选、更新数量并在清空后恢复全部', async ({ page }) => {
  await page.emulateMedia({ colorScheme: page.viewportSize()!.width === 320 ? 'dark' : 'light' });
  await page.goto('/');
  const input = page.getByRole('searchbox', { name: '搜索公式' });
  const results = page.getByRole('region', { name: '搜索结果' });
  const sizes = results.getByRole('group', { name: '搜索阶数' });
  const all = sizes.getByRole('button', { name: '全部', exact: true });
  const two = sizes.getByRole('button', { name: '二阶', exact: true });
  const three = sizes.getByRole('button', { name: '三阶', exact: true });
  const count = results.getByRole('status');
  const links = () => results.locator('.case-card').evaluateAll(cards => cards.map(card => card.getAttribute('href')));

  await expect(sizes).toHaveCount(0);
  await input.fill('H');
  await expect(all).toHaveAttribute('aria-pressed', 'true');
  const allLinks = await links();
  await two.click();
  await expect(two).toHaveAttribute('aria-pressed', 'true');
  const twoLinks = allLinks.filter(href => /^#\/case\/(cll|eg1|eg2)-/.test(href ?? ''));
  expect(twoLinks).toContain('#/case/eg1-h-1');
  await expect.poll(links).toEqual(twoLinks);
  await expect(count).toHaveText(`找到 ${twoLinks.length} 条`);
  expect((await two.boundingBox())!.height).toBeGreaterThanOrEqual(32);
  expect(await page.evaluate(() => document.documentElement.scrollWidth)).toBe(page.viewportSize()!.width);

  await input.fill('pll-h');
  await expect(two).toHaveAttribute('aria-pressed', 'true');
  await expect(count).toHaveText('找到 0 条');
  await expect(results.getByText('没有匹配的公式', { exact: true })).toBeVisible();
  await input.fill('H');
  await three.click();
  const threeLinks = allLinks.filter(href => !twoLinks.includes(href));
  expect(threeLinks).toContain('#/case/pll-h');
  await expect.poll(links).toEqual(threeLinks);
  await expect(count).toHaveText(`找到 ${threeLinks.length} 条`);

  await input.fill('   ');
  await expect(sizes).toHaveCount(0);
  await expect(page.getByRole('heading', { name: '公式库', exact: true })).toBeVisible();
  await input.fill('H');
  await expect(all).toHaveAttribute('aria-pressed', 'true');
  await expect.poll(links).toEqual(allLinks);
  await expect(count).toHaveText(`找到 ${allLinks.length} 条`);
});
