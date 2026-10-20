import { test, expect, knownFailure } from '../fixtures/test.js';
import { USERS, PROTECTED_ROUTES, PRODUCTS } from '../fixtures/data.js';

test.describe('Route protection [REQ-006]', () => {
  test('TC-UI-010 @smoke @P1 the catalogue is refused without a session', async ({ page }) => {
    await page.goto('/inventory.html');
    await expect(page.getByTestId('error')).toContainText("You can only access '/inventory.html' when you are logged in");
    await expect(page.getByTestId('inventory-item')).toHaveCount(0);
  });

  // Four of these nine routes are linked from nowhere in the interface and were found
  // by reading the router (docs/STATIC_ANALYSIS.md section 3). They are included
  // because an unlinked page is still a page a URL can reach.
  for (const route of PROTECTED_ROUTES) {
    test(`TC-UI-011 @P2 ${route} is refused without a session`, async ({ page }) => {
      await page.goto(route);
      await expect(page.getByTestId('error')).toContainText(`You can only access '${route}' when you are logged in`);
      await expect(page.getByTestId('inventory-item')).toHaveCount(0);
    });
  }
});

test.describe('Cart lifecycle [REQ-007]', () => {
  test('TC-UI-090 @P2 the cart does not follow the browser to the next person who signs in', async ({ signInAs, page, loginPage }) => {
    knownFailure('DEF-015', 'the cart is bound to the browser rather than to the account');
    const inventory = await signInAs(USERS.standard);
    await inventory.addToCart(PRODUCTS[0].name);
    await inventory.signOut();

    await loginPage.signInAndWait(USERS.problem);
    expect(await inventory.cartCount()).toBe(0);
  });

  test('TC-UI-093 @P3 the cart does not survive a browser restart', async ({ signInAs, page }) => {
    knownFailure('DEF-015', 'the cart is held in localStorage and nothing clears it');
    const inventory = await signInAs(USERS.standard);
    await inventory.addToCart(PRODUCTS[0].name);
    await inventory.signOut();
    expect(await page.evaluate(() => localStorage.getItem('cart-contents'))).toBeNull();
  });

  test('TC-UI-091 @P2 an item cannot be added twice and the quantity is fixed at one', async ({ signInAs, cartPage }) => {
    const inventory = await signInAs(USERS.standard);
    await inventory.addToCart(PRODUCTS[0].name);
    // The control becomes Remove, so there is no second Add to press.
    await expect(inventory.page.getByTestId(`add-to-cart-sauce-labs-backpack`)).toHaveCount(0);
    await inventory.openCart();
    await expect(cartPage.quantities).toHaveText(['1']);
  });

  test('TC-UI-092 @P3 Reset App State empties the cart', async ({ signInAs }) => {
    const inventory = await signInAs(USERS.standard);
    await inventory.addToCart(PRODUCTS[0].name);
    await inventory.addToCart(PRODUCTS[1].name);
    expect(await inventory.cartCount()).toBe(2);
    await inventory.resetAppState();
    expect(await inventory.cartCount()).toBe(0);
  });
});
