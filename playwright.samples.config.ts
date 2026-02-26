/**
 * サンプルE2Eテスト用 Playwright 設定
 *
 * 実行コマンド: pnpm test:e2e:samples
 *
 * サンプルドメインのE2Eテスト専用設定。
 * リリースZIP展開後のプロジェクトには含まれない。
 */
import { defineConfig, devices } from '@playwright/test';

export default defineConfig({
  testDir: './src/samples/tests/e2e',
  fullyParallel: false,
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 2 : 1,
  workers: process.env.CI ? 4 : 5,
  reporter: process.env.CI ? 'html' : 'list',
  timeout: 60000,
  expect: {
    timeout: 15000,
  },
  use: {
    baseURL: 'http://localhost:3099',
    trace: 'on-first-retry',
    screenshot: 'only-on-failure',
    actionTimeout: 15000,
    launchOptions: {
      args: ['--disable-dev-shm-usage'],
    },
  },
  projects: [
    {
      name: 'chromium',
      use: { ...devices['Desktop Chrome'] },
    },
  ],
  webServer: {
    command: 'pnpm dev:test',
    url: 'http://localhost:3099',
    reuseExistingServer: !process.env.CI,
    timeout: 30_000,
    stdout: 'pipe',
    stderr: 'pipe',
  },
});
