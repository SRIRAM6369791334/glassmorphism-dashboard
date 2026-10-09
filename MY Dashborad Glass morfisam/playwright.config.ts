import { defineConfig, devices } from '@playwright/test'

export default defineConfig({
  testDir: './tests',
  testIgnore: '**/live/**',
  timeout: 120_000,
  fullyParallel: true,
  forbidOnly: Boolean(process.env.CI),
  retries: process.env.CI ? 2 : 0,
  workers: 2,
  reporter: [['list'], ['html', { outputFolder: 'artifacts/preview/playwright-report', open: 'never' }]],
  outputDir: 'artifacts/preview/test-results',
  use: {
    baseURL: 'http://127.0.0.1:4173',
    viewport: { width: 1128, height: 778 },
    trace: 'on-first-retry',
    screenshot: 'only-on-failure',
  },
  projects: [
    { name: 'chromium', use: { ...devices['Desktop Chrome'], viewport: { width: 1128, height: 778 } } },
    { name: 'firefox', use: { ...devices['Desktop Firefox'], viewport: { width: 1128, height: 778 } } },
    { name: 'webkit', use: { ...devices['Desktop Safari'], viewport: { width: 1128, height: 778 } } },
  ],
  webServer: {
    command: 'npm run build && npm run preview -- --host 127.0.0.1 --port 4173 --strictPort',
    url: 'http://127.0.0.1:4173',
    reuseExistingServer: !process.env.CI,
    timeout: 120_000,
  },
})
