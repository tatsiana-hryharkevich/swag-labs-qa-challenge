import AxeBuilder from '@axe-core/playwright';
import { test, expect } from '../fixtures/test.js';
import { USERS, PRODUCTS } from '../fixtures/data.js';

/** Automated accessibility rules. [REQ-009]
 *
 *  These check the rules a machine can decide. They cannot establish that the
 *  application is usable with assistive technology -- keyboard order, focus visibility
 *  and screen-reader output are judged by a person, and are out of scope here. A clean
 *  result means no rule was broken, not that the page is accessible. See
 *  docs/ACCESSIBILITY.md.
 *
 *  The target level is an assumption: nobody stated one (Q-07).
 */
const WCAG = ['wcag2a', 'wcag2aa', 'wcag21a', 'wcag21aa'];

const scan = (page) => new AxeBuilder({ page }).withTags(WCAG).analyze();

const report = (violations) =>
  violations
    .map((v) => `${v.impact}: ${v.id} on ${v.nodes.length} element(s) — ${v.help}`)
    .join('\n');

test.describe('Accessibility, automated rules [REQ-009]', () => {
  test('TC-UI-082 @P3 the sign-in page breaks no automated rule', async ({ loginPage, page }) => {
    await loginPage.goto();
    const { violations } = await scan(page);
    expect(violations, report(violations)).toEqual([]);
  });

  test('TC-UI-083 @P3 the catalogue breaks no automated rule', async ({ signInAs, page }) => {
    await signInAs(USERS.standard);
    const { violations } = await scan(page);
    expect(violations, report(violations)).toEqual([]);
  });

  test('TC-UI-084 @P3 the checkout form breaks no automated rule', async ({ signInAs, cartPage, page }) => {
    const inventory = await signInAs(USERS.standard);
    await inventory.addToCart(PRODUCTS[0].name);
    await inventory.openCart();
    await cartPage.checkout();
    const { violations } = await scan(page);
    expect(violations, report(violations)).toEqual([]);
  });

  /** A scanner that silently does nothing also reports zero violations. This breaks the
   *  page on purpose and requires the scan to notice, so the three clean results above
   *  mean something. */
  test('TC-UI-085 @P3 the scan detects a violation when one is introduced', async ({ loginPage, page }) => {
    await loginPage.goto();
    await page.evaluate(() => {
      const input = document.createElement('input');
      input.type = 'text';
      const image = document.createElement('img');
      image.src = '/does-not-exist.png';
      document.body.prepend(input, image);
    });
    const { violations } = await scan(page);
    expect(violations.map((v) => v.id).sort()).toEqual(['image-alt', 'label']);
  });
});
