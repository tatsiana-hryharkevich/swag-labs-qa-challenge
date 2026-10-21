import { test, expect, knownFailure } from '../fixtures/test.js';
import { USERS, PRODUCTS, TAX_RATE } from '../fixtures/data.js';

const round2 = (n) => Math.round(n * 100) / 100;

test.describe('Cart [REQ-002]', () => {
  test('TC-UI-020 @smoke @P1 adding one item puts it in the cart', async ({ signInAs, cartPage }) => {
    const inventory = await signInAs(USERS.standard);
    await inventory.addToCart(PRODUCTS[0].name);
    expect(await inventory.cartCount()).toBe(1);
    await inventory.openCart();
    await expect(cartPage.names).toHaveText([PRODUCTS[0].name]);
  });

  for (const [account, defect] of [
    [USERS.standard, null],
    [USERS.problem, ['DEF-005', 'Add to cart silently does nothing for half the catalogue']],
    [USERS.error, ['DEF-010', 'Add to cart throws and silently fails for half the catalogue']],
  ]) {
    test(`TC-UI-021 @P1 every product can be added to the cart (${account})`, async ({ signInAs, page }) => {
      if (defect) knownFailure(...defect);
      // error_user raises an uncaught exception per failed add; it must not abort the run.
      page.on('pageerror', () => {});
      const inventory = await signInAs(account);
      for (const product of PRODUCTS) await inventory.addToCart(product.name);
      expect(await inventory.cartCount()).toBe(PRODUCTS.length);
    });
  }

  for (const [account, defect] of [
    [USERS.standard, null],
    [USERS.problem, ['DEF-006', 'Remove never removes anything']],
  ]) {
    test(`TC-UI-022 @P1 removing from the catalogue empties the cart (${account})`, async ({ signInAs, page }) => {
      if (defect) knownFailure(...defect);
      page.on('pageerror', () => {});
      const inventory = await signInAs(account);
      await inventory.addToCart(PRODUCTS[0].name);
      await inventory.addToCart(PRODUCTS[4].name);
      await inventory.removeFromCart(PRODUCTS[0].name);
      expect(await inventory.cartCount()).toBe(1);
    });
  }

  test('TC-UI-023 @P1 removing from the cart page empties the cart', async ({ signInAs, cartPage }) => {
    const inventory = await signInAs(USERS.standard);
    await inventory.addToCart(PRODUCTS[0].name);
    await inventory.openCart();
    await cartPage.removeItem(PRODUCTS[0].name);
    await expect(cartPage.names).toHaveCount(0);
  });

  test('TC-UI-024 @P2 the cart survives navigating away and back', async ({ signInAs, cartPage }) => {
    const inventory = await signInAs(USERS.standard);
    await inventory.addToCart(PRODUCTS[2].name);
    await inventory.openCart();
    await cartPage.continueShopping.click();
    expect(await inventory.cartCount()).toBe(1);
  });
});

test.describe('Checkout [REQ-002]', () => {
  const threeItems = [PRODUCTS[3], PRODUCTS[4], PRODUCTS[5]];

  async function cartWithThreeItems(signInAs, cartPage) {
    const inventory = await signInAs(USERS.standard);
    for (const p of threeItems) await inventory.addToCart(p.name);
    await inventory.openCart();
    await cartPage.checkout();
    return inventory;
  }

  test('TC-UI-025 @smoke @P1 an order can be completed end to end', async ({ signInAs, cartPage, checkoutPage, page }) => {
    await cartWithThreeItems(signInAs, cartPage);
    await checkoutPage.fillDetails();
    await checkoutPage.continue();
    await expect(page).toHaveURL(/checkout-step-two/);
    await checkoutPage.finish();
    await expect(page).toHaveURL(/checkout-complete/);
    await expect(page.getByTestId('complete-header')).toContainText(/thank you/i);
  });

  for (const [field, missing, message] of [
    ['TC-UI-026 @P1 first name', { first: null }, 'First Name is required'],
    ['TC-UI-027 @P1 last name', { last: null }, 'Last Name is required'],
    ['TC-UI-028 @P1 postal code', { postal: null }, 'Postal Code is required'],
  ]) {
    test(`${field} is required`, async ({ signInAs, cartPage, checkoutPage, page }) => {
      await cartWithThreeItems(signInAs, cartPage);
      await checkoutPage.fillDetails(missing);
      await checkoutPage.continue();
      expect(await checkoutPage.errorText()).toContain(message);
      await expect(page).toHaveURL(/checkout-step-one/);
    });
  }

  test('TC-UI-029 @P1 the order summary adds up', async ({ signInAs, cartPage, checkoutPage }) => {
    await cartWithThreeItems(signInAs, cartPage);
    await checkoutPage.fillDetails();
    await checkoutPage.continue();
    const { subtotal, tax, total } = await checkoutPage.orderTotals();
    const expectedSubtotal = round2(threeItems.reduce((sum, p) => sum + p.price, 0));
    expect(subtotal).toBe(expectedSubtotal);
    expect(tax).toBe(round2(expectedSubtotal * TAX_RATE));
    expect(total).toBe(round2(subtotal + tax));
  });

  test('TC-UI-035 @P1 tax is 8% of the item total', async ({ signInAs, cartPage, checkoutPage }) => {
    await cartWithThreeItems(signInAs, cartPage);
    await checkoutPage.fillDetails();
    await checkoutPage.continue();
    const { subtotal, tax } = await checkoutPage.orderTotals();
    expect(tax).toBe(round2(subtotal * TAX_RATE));
  });

  // Documents current behaviour rather than asserting it is correct: the postal code is
  // collected and then ignored by the calculation. Q-02 asks whether that is intended.
  test('TC-UI-036 @P2 the postal code does not change the tax charged', async ({ signInAs, cartPage, checkoutPage }) => {
    const totalsFor = async (postal) => {
      await checkoutPage.fillDetails({ postal });
      await checkoutPage.continue();
      const totals = await checkoutPage.orderTotals();
      await checkoutPage.page.goBack();
      return totals;
    };
    await cartWithThreeItems(signInAs, cartPage);
    const spain = await totalsFor('08001');
    const usa = await totalsFor('10001');
    expect(usa.tax).toBe(spain.tax);
  });

  test('TC-UI-033 @P2 a name of only whitespace is refused', async ({ signInAs, cartPage, checkoutPage, page }) => {
    knownFailure('DEF-018', 'the form checks only that a field is non-empty, so three spaces satisfy "required"');
    await cartWithThreeItems(signInAs, cartPage);
    await checkoutPage.fillDetails({ first: '   ', last: '   ', postal: '   ' });
    await checkoutPage.continue();
    expect(await checkoutPage.errorText()).toContain('required');
    await expect(page).toHaveURL(/checkout-step-one/);
  });

  // Records what the form accepts rather than judging it: no specification states a
  // format for any of these fields, so nothing here is reported as a defect. The value
  // is as a regression guard -- if validation is added later, these change, and the
  // change will be deliberate.
  for (const [label, value] of [
    ['digits in place of a name', '12345'],
    ['punctuation only', '!@#$%^&*()'],
    ['five hundred characters', 'A'.repeat(500)],
    ['markup', '<script>alert(1)</script>'],
    ['an SQL-shaped string', "' OR 1=1 --"],
    ['non-Latin characters and an emoji', 'Татьяна 🙂'],
    ['a single character', 'A'],
  ]) {
    test(`TC-UI-033 @P3 the form accepts ${label}`, async ({ signInAs, cartPage, checkoutPage, page }) => {
      await cartWithThreeItems(signInAs, cartPage);
      await checkoutPage.fillDetails({ first: value, last: value, postal: value });
      await checkoutPage.continue();
      await expect(page).toHaveURL(/checkout-step-two/);
    });
  }

  test('TC-UI-030 @P2 cancelling returns to the cart with the items intact', async ({ signInAs, cartPage, checkoutPage, page }) => {
    await cartWithThreeItems(signInAs, cartPage);
    await checkoutPage.cancel();
    await expect(page).toHaveURL(/cart\.html/);
    await expect(cartPage.names).toHaveCount(threeItems.length);
  });

  test('TC-UI-032 @P1 the checkout form accepts a last name (problem_user)', async ({ signInAs, cartPage, checkoutPage, page }) => {
    knownFailure('DEF-001', 'the Last Name field writes into First Name, so checkout cannot be passed');
    const inventory = await signInAs(USERS.problem);
    await inventory.addToCart(PRODUCTS[0].name);
    await inventory.openCart();
    await cartPage.checkout();
    await checkoutPage.fillDetails({ first: 'Anna', last: 'Petrova' });
    await expect(checkoutPage.lastName).toHaveValue('Petrova');
    await expect(checkoutPage.firstName).toHaveValue('Anna');
  });

  test('TC-UI-039 @P2 the cart is emptied once the order completes (error_user)', async ({ signInAs, cartPage, checkoutPage, page }) => {
    knownFailure('DEF-002', 'Finish does nothing: no navigation, and the cart keeps its items');
    page.on('pageerror', () => {});
    const inventory = await signInAs(USERS.error);
    await inventory.addToCart(PRODUCTS[0].name);
    await inventory.openCart();
    await cartPage.checkout();
    await checkoutPage.fillDetails();
    await checkoutPage.continue();
    await checkoutPage.finish();
    await expect(page).toHaveURL(/checkout-complete/);
    expect(await page.evaluate(() => localStorage.getItem('cart-contents'))).toBeNull();
  });
});
