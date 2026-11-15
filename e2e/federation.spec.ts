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

for (const [mode, path] of [
  ['hosted', 'mfe2'],
  ['standalone', 'remotes/mfe2/'],
]) {
  test(`mfe2 lists API posts when ${mode}`, async ({ page }) => {
    await page.route('https://jsonplaceholder.typicode.com/posts', (route) =>
      route.fulfill({
        json: [{ id: 1, userId: 2, title: 'Shared API client post', body: 'Fetched by MFE2' }],
      }),
    );
    await page.goto(path);
    const post = page.locator('app-mfe2').getByTestId('post');
    await expect(post).toHaveCount(1);
    await expect(post).toContainText('Shared API client post');
    await expect(post).toContainText('Fetched by MFE2');
  });
}

for (const [name, path, selector] of [
  ['shell', './', 'app-root'],
  ['MFE1', 'remotes/mfe1/', 'app-mfe1'],
  ['MFE2', 'remotes/mfe2/', 'app-mfe2'],
]) {
  test(`${name} gets and creates posts`, async ({ page }) => {
    await page.route('https://jsonplaceholder.typicode.com/posts', async (route) => {
      if (route.request().method() === 'POST') {
        expect(route.request().postDataJSON()).toEqual({
          title: 'New title',
          body: 'New body',
          userId: 1,
        });
        await route.fulfill({ status: 201, json: { id: 101, ...route.request().postDataJSON() } });
      } else {
        await route.fulfill({
          json: [{ id: 1, userId: 1, title: 'Existing post', body: 'Existing body' }],
        });
      }
    });
    await page.goto(path);
    const app = page.locator(selector);
    await expect(app.getByTestId('post')).toHaveCount(1);
    if (selector !== 'app-root') {
      await expect(app.getByTestId('preview-post')).toHaveCount(1);
      await expect(app.getByTestId('preview-post')).toContainText('Existing post');
    }
    await app.getByLabel('Title', { exact: true }).fill('New title');
    await app.getByLabel('Body', { exact: true }).fill('New body');
    await app.getByRole('button', { name: 'Create post', exact: true }).click();
    await expect(app.getByTestId('post')).toHaveCount(2);
    await expect(app.getByTestId('post').first()).toContainText('New title');
    await expect(app.getByText('Post created successfully.')).toBeVisible();
  });
}
