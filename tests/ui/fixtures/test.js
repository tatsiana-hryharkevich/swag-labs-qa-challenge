import { test as base, expect } from '@playwright/test';
import { LoginPage } from '../pages/login.page.js';
import { InventoryPage } from '../pages/inventory.page.js';
import { CartPage } from '../pages/cart.page.js';
import { CheckoutPage } from '../pages/checkout.page.js';
import { PASSWORD } from './data.js';

export const test = base.extend({
  loginPage: async ({ page }, use) => use(new LoginPage(page)),
  inventoryPage: async ({ page }, use) => use(new InventoryPage(page)),
  cartPage: async ({ page }, use) => use(new CartPage(page)),
  checkoutPage: async ({ page }, use) => use(new CheckoutPage(page)),

  /** Signs in as the given account and leaves the browser on the catalogue.
   *  Every test gets a fresh browser context, which matters here: the cart lives
   *  in localStorage and is not cleared at sign-out (DEF-015), so without
   *  isolation results would carry between tests. */
  signInAs: async ({ page }, use) => {
    await use(async (user, password = PASSWORD) => {
      const login = new LoginPage(page);
      await login.goto();
      await login.signInAndWait(user, password);
      return new InventoryPage(page);
    });
  },

  /** Collects uncaught page errors and failed requests for the whole test. */
  pageFaults: async ({ page }, use) => {
    const faults = { console: [], uncaught: [], failedRequests: [] };
    page.on('console', (m) => m.type() === 'error' && faults.console.push(m.text()));
    page.on('pageerror', (e) => faults.uncaught.push(String(e)));
    page.on('response', (r) => r.status() >= 400 && faults.failedRequests.push(`${r.status()} ${r.url()}`));
    await use(faults);
  },
});

/** Marks a test as a known failure. The assertion is never weakened: the test keeps
 *  checking the correct behaviour, and the defect it is waiting on is named here and
 *  in docs/DEFECTS.md. Removing the defect makes the suite report an unexpected pass,
 *  which is the signal to delete this call. */
export function knownFailure(defectId, summary) {
  test.info().annotations.push({
    type: 'known failure',
    description: `${defectId} — ${summary} — see docs/DEFECTS.md`,
  });
  test.fail(true, `${defectId}: ${summary}`);
}

export { expect };
