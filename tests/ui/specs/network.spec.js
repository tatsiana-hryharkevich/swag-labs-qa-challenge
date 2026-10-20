import { test, expect, knownFailure } from '../fixtures/test.js';
import { USERS } from '../fixtures/data.js';

/** The application makes no request for signing in, the cart or pricing -- all of it
 *  runs in the browser. Its only network surface is static files and error telemetry,
 *  so that is where defects at the request/response level are found. [REQ-005] */
test.describe('Network and configuration [REQ-005]', () => {
  /** Telemetry is sent on its own schedule, so the test waits for the request rather
   *  than sampling whatever has arrived by the time an assertion runs. Sampling made
   *  this test pass intermittently, which is worse than no test at all. */
  const waitForTelemetry = (page) =>
    page.waitForResponse((r) => r.url().includes('backtrace.io'), { timeout: 15_000 });

  test('TC-UI-100 @P2 error telemetry is accepted by its endpoint', async ({ signInAs, page }) => {
    knownFailure('DEF-012', 'the telemetry URL still contains the UNIVERSE and TOKEN build placeholders, so every report is rejected with 401');
    const telemetry = waitForTelemetry(page);
    await signInAs(USERS.standard);
    const response = await telemetry;
    expect(response.url(), 'build placeholders left in the telemetry URL').not.toMatch(/universe=UNIVERSE|token=TOKEN/);
    expect(response.status()).toBeLessThan(400);
  });

  test('TC-UI-101 @P2 the core flow issues no failing requests', async ({ signInAs, page, pageFaults }) => {
    knownFailure('DEF-012', 'telemetry returns 401 on every page');
    const telemetry = waitForTelemetry(page);
    const inventory = await signInAs(USERS.standard);
    await inventory.openCart();
    await telemetry;
    expect(pageFaults.failedRequests, pageFaults.failedRequests.join('\n')).toEqual([]);
  });

  test('TC-UI-102 @P2 the core flow raises no uncaught errors (standard_user)', async ({ signInAs, pageFaults }) => {
    const inventory = await signInAs(USERS.standard);
    await inventory.openCart();
    expect(pageFaults.uncaught).toEqual([]);
  });

  test('TC-UI-102 @P2 the core flow raises no uncaught errors (error_user)', async ({ signInAs, pageFaults }) => {
    knownFailure('DEF-010', 'adding or removing an item raises an uncaught exception');
    const inventory = await signInAs(USERS.error);
    await inventory.addToCart('Sauce Labs Bolt T-Shirt');
    expect(pageFaults.uncaught).toEqual([]);
  });
});
