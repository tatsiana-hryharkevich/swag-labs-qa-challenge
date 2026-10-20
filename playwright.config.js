import { defineConfig, devices } from '@playwright/test';

const isCI = !!process.env.CI;

export default defineConfig({
  testDir: './tests/ui/specs',
  fullyParallel: true,
  forbidOnly: isCI,
  // One retry on CI only. A test that needs retries locally is a defect in the suite,
  // not noise to be hidden -- see the flaky-test rule in docs/TEST_PLAN.md section 14.3.
  retries: isCI ? 1 : 0,
  workers: isCI ? 2 : undefined,
  timeout: 30_000,
  expect: { timeout: 7_000 },

  reporter: [
    ['list'],
    ['html', { outputFolder: 'playwright-report', open: 'never' }],
  ],

  use: {
    baseURL: 'https://www.saucedemo.com',
    // The application exposes data-test attributes on every interactive element,
    // so getByTestId() is the whole selector strategy: no XPath, nothing tied to
    // layout or wording.
    testIdAttribute: 'data-test',
    trace: 'retain-on-failure',
    screenshot: 'only-on-failure',
    video: 'retain-on-failure',
    actionTimeout: 10_000,
  },

  projects: [
    { name: 'chromium', use: { ...devices['Desktop Chrome'] } },
  ],
});
