import { defineConfig } from '@playwright/test';

export default defineConfig({
  testDir: './e2e',
  fullyParallel: true,
  forbidOnly: !!process.env['CI'],
  retries: process.env['CI'] ? 1 : 0,
  reporter: 'list',
  use: {
    baseURL: 'http://127.0.0.1:4400/angular-github-actions/cit/',
    browserName: 'chromium',
    channel: process.env['PLAYWRIGHT_CHANNEL'],
    headless: true,
    trace: 'retain-on-failure',
  },
  webServer: {
    command: 'node tools/preview-pages.mjs',
    url: 'http://127.0.0.1:4400/angular-github-actions/cit/',
    reuseExistingServer: !process.env['CI'],
  },
});
