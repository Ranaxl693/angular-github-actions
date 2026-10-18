import { expect, test } from '@playwright/test';

test('loads both remotes and shares the lib-core singleton under a Pages subfolder', async ({
  page,
}) => {
  const errors: string[] = [];
  page.on('pageerror', (error) => errors.push(error.message));
  await page.goto('./');
  await expect(page.getByRole('heading', { name: 'Host application', exact: true })).toBeVisible();
  await page.getByRole('link', { name: 'MFE 1 · Products' }).click();
  await expect(page.getByRole('heading', { name: 'MFE 1 · Products' })).toBeVisible();
  await expect(page).toHaveURL(/\/mfe1$/);
  await page.getByRole('button', { name: 'Add item' }).first().click();
  await expect(page.getByTestId('host-count')).toHaveText('1');
  await page.getByRole('link', { name: 'MFE 2 · Selection' }).click();
  await expect(page).toHaveURL(/\/mfe2$/);
  await expect(page.getByTestId('selection-count')).toHaveText('1');
  await page.getByRole('button', { name: 'Clear selection' }).click();
  await expect(page.getByTestId('host-count')).toHaveText('0');
  await expect(page.getByTestId('selection-count')).toHaveText('0');
  await page.reload();
  await expect(page).toHaveURL(/\/mfe2\/$/);
  await expect(page.getByRole('heading', { name: 'MFE 2 · Selection' })).toBeVisible();
  expect(errors).toEqual([]);
});

for (const [remote, heading] of [
  ['mfe1', 'MFE 1 · Products'],
  ['mfe2', 'MFE 2 · Selection'],
]) {
  test(`${remote} also launches standalone`, async ({ page }) => {
    await page.goto(`remotes/${remote}/`);
    await expect(page.getByRole('heading', { name: heading })).toBeVisible();
  });
}
