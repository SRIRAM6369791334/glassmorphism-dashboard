import { defineConfig, devices } from '@playwright/test'

export default defineConfig({
  testDir: './tests/live',
  timeout: 90_000,
  workers: 1,
  reporter: [['list']],
  outputDir: 'artifacts/preview/live-results',
  use: { ...devices['Desktop Chrome'], baseURL: 'http://127.0.0.1:5173', viewport: { width: 1128, height: 778 }, trace: 'off', screenshot: 'off' },
  webServer: { command: 'npm run dev -- --port 5173 --strictPort', url: 'http://127.0.0.1:5173', reuseExistingServer: true },
})
