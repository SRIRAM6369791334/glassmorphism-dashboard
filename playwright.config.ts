import { defineConfig, devices } from '@playwright/test'

export default defineConfig({
  testDir: './tests',
  timeout: 90_000,
  fullyParallel: true,
  forbidOnly: Boolean(process.env.CI),
  retries: process.env.CI ? 2 : 0,
  workers: 3,
  reporter: [['list'], ['html', { outputFolder: 'artifacts/playwright-report', open: 'never' }]],
  outputDir: 'artifacts/test-results',
  use: {
    baseURL: 'http://127.0.0.1:5173',
    viewport: { width: 1128, height: 778 },
    trace: 'retain-on-failure',
    screenshot: 'only-on-failure',
  },
  projects: [
    { name: 'chromium', use: { ...devices['Desktop Chrome'], viewport: { width: 1128, height: 778 } } },
    { name: 'firefox', use: { ...devices['Desktop Firefox'], viewport: { width: 1128, height: 778 } } },
    { name: 'webkit', use: { ...devices['Desktop Safari'], viewport: { width: 1128, height: 778 } } },
  ],
  webServer: {
    command: 'npm run dev -- --host 127.0.0.1 --port 5173 --strictPort',
    url: 'http://127.0.0.1:5173',
    reuseExistingServer: true,
    timeout: 120_000,
  },
})
