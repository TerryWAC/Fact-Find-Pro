import { defineConfig, devices } from '@playwright/test'

export default defineConfig({
  testDir: './tests/email-e2e',
  outputDir: './test-results/email-e2e',
  workers: 1,
  timeout: 60000,
  use: { baseURL: 'http://localhost:3008', ...devices['Desktop Chrome'], trace: 'retain-on-failure' },
  webServer: {
    command: 'node tests/start-preview.mjs --production --email-tests',
    url: 'http://localhost:3008/f/home/preview',
    reuseExistingServer: false,
    timeout: 120000,
  },
})
