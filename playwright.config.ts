import { defineConfig } from '@playwright/test';

export default defineConfig({
  testDir: './tests/e2e',
  timeout: 45_000,
  fullyParallel: false,
  workers: 1,
  retries: 0,
  reporter: [['list']],
  use: {
    baseURL: 'http://127.0.0.1:3100',
    channel: 'chrome',
    trace: 'retain-on-failure',
    screenshot: 'only-on-failure',
  },
  webServer: [
    {
      command: 'node tests/fixtures/pro-api-server.mjs',
      url: 'http://127.0.0.1:8100/api/pro/trends?from_date=2026-09-01&to_date=2026-09-30',
      reuseExistingServer: false,
      timeout: 30_000,
    },
    {
      command: 'npm run dev -- --port 3100',
      url: 'http://127.0.0.1:3100',
      env: { API_BASE_URL: 'http://127.0.0.1:8100' },
      reuseExistingServer: false,
      timeout: 120_000,
    },
  ],
});
