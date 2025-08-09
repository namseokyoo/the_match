import { defineConfig, devices } from '@playwright/test';

/**
 * Production test configuration for testing against deployed site
 */
export default defineConfig({
  testDir: './tests',
  fullyParallel: false, // Run tests sequentially for data consistency
  forbidOnly: true,
  retries: 1,
  workers: 1, // Single worker to avoid conflicts
  reporter: [['html'], ['list']],
  timeout: 60000, // 60 seconds per test
  
  use: {
    baseURL: 'https://the-match-five.vercel.app',
    trace: 'on',
    screenshot: 'only-on-failure',
    video: 'retain-on-failure',
    headless: false, // Show browser for debugging
    viewport: { width: 1280, height: 720 },
    actionTimeout: 15000,
    navigationTimeout: 30000,
  },

  projects: [
    {
      name: 'chromium',
      use: { ...devices['Desktop Chrome'] },
    },
  ],
});