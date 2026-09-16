import { defineConfig, devices } from '@playwright/test'
import core from './playwright.config'

export default defineConfig({
  ...core,
  outputDir: './test-results/webkit',
  projects: [
    { name: 'safari-desktop', use: { ...devices['Desktop Safari'], viewport: { width: 1440, height: 1000 } } },
    { name: 'safari-iphone', use: { ...devices['iPhone 13'] } },
  ],
  webServer: {
    command: 'node tests/start-preview.mjs --production',
    url: 'http://localhost:3008/f/home/preview',
    reuseExistingServer: false,
    timeout: 120000,
  },
})
