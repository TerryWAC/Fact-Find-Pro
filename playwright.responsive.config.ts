import { defineConfig, devices } from '@playwright/test'

export default defineConfig({
  testDir: './tests/responsive',
  outputDir: './test-results/responsive',
  workers: 1,
  timeout: 60000,
  use: { baseURL: 'http://localhost:3008', trace: 'retain-on-failure', screenshot: 'only-on-failure' },
  projects: [
    { name: 'small-android', use: { ...devices['Pixel 7'], viewport: { width: 360, height: 740 } } },
    { name: 'iphone', use: { ...devices['iPhone 13'], defaultBrowserType: 'chromium' } },
    { name: 'ipad-portrait', use: { ...devices['iPad (gen 7)'], defaultBrowserType: 'chromium' } },
    { name: 'ipad-landscape', use: { ...devices['iPad (gen 7) landscape'], defaultBrowserType: 'chromium' } },
    { name: 'desktop', use: { ...devices['Desktop Chrome'], viewport: { width: 1440, height: 1000 } } },
  ],
  webServer: { command: 'node tests/start-preview.mjs --production', url: 'http://localhost:3008/f/home/preview', reuseExistingServer: false, timeout: 120000 },
})
