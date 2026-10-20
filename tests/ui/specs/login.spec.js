import { test, expect, knownFailure } from '../fixtures/test.js';
import { USERS, PRODUCTS } from '../fixtures/data.js';

test.describe('Authentication and access control [REQ-001]', () => {
  test.beforeEach(async ({ loginPage }) => loginPage.goto());

  test('TC-UI-001 @smoke @P1 a valid account reaches the catalogue', async ({ loginPage, inventoryPage }) => {
    await loginPage.signInAndWait(USERS.standard);
    await expect(inventoryPage.page).toHaveURL(/inventory\.html/);
    await expect(inventoryPage.items).toHaveCount(PRODUCTS.length);
  });

  test('TC-UI-002 @P1 the locked-out account is refused and told why', async ({ loginPage }) => {
    await loginPage.signIn(USERS.lockedOut);
    await expect(loginPage.error).toBeVisible();
    expect(await loginPage.errorText()).toContain('this user has been locked out');
    await expect(loginPage.page).toHaveURL('https://www.saucedemo.com/');
  });

  test('TC-UI-003 @P1 a valid account with the wrong password is refused', async ({ loginPage }) => {
    await loginPage.signIn(USERS.standard, 'wrong_password');
    expect(await loginPage.errorText()).toContain('Username and password do not match');
  });

  test('TC-UI-004 @P1 an unknown account is refused', async ({ loginPage }) => {
    await loginPage.signIn('no_such_user');
    expect(await loginPage.errorText()).toContain('Username and password do not match');
  });

  // TC-UI-007 is the same check read the other way: the message must not reveal which
  // of the two fields was wrong, so both cases above expect identical wording.
  test('TC-UI-007 @P2 the refusal does not disclose which field was wrong', async ({ loginPage }) => {
    await loginPage.signIn(USERS.standard, 'wrong_password');
    const wrongPassword = await loginPage.errorText();
    await loginPage.goto();
    await loginPage.signIn('no_such_user');
    expect(await loginPage.errorText()).toBe(wrongPassword);
  });

  test('TC-UI-005 @P2 a missing username is named in the error', async ({ loginPage }) => {
    await loginPage.signIn(null, 'anything');
    expect(await loginPage.errorText()).toContain('Username is required');
  });

  test('TC-UI-006 @P2 a missing password is named in the error', async ({ loginPage }) => {
    await loginPage.signIn(USERS.standard, null);
    expect(await loginPage.errorText()).toContain('Password is required');
  });

  test('TC-UI-008 @P2 the seeded-defect account signs in and reaches the catalogue', async ({ loginPage, inventoryPage }) => {
    await loginPage.signInAndWait(USERS.problem);
    await expect(inventoryPage.items).toHaveCount(PRODUCTS.length);
  });

  test('TC-UI-009 @P2 the slow account signs in and reaches the catalogue', async ({ loginPage, inventoryPage }) => {
    // The delay is five seconds of a blocked browser, not a slow response (DEF-013).
    // The timeout is raised here only, so every other test keeps the strict default.
    test.slow();
    await loginPage.signInAndWait(USERS.glitch);
    await expect(inventoryPage.items).toHaveCount(PRODUCTS.length);
  });

  test('TC-UI-014 @P2 the password is masked and absent from the DOM in clear text', async ({ loginPage, page }) => {
    knownFailure('DEF-016', 'the typed password is written into the input as an HTML attribute, so any DOM capture contains it in clear text');
    await expect(loginPage.password).toHaveAttribute('type', 'password');
    await loginPage.password.fill('secret_sauce');
    expect(await page.content()).not.toContain('value="secret_sauce"');
  });
});

test.describe('Signing out [REQ-006]', () => {
  test('TC-UI-012 @P1 signing out ends the session', async ({ signInAs, page }) => {
    const inventory = await signInAs(USERS.standard);
    await inventory.signOut();
    await expect(page).toHaveURL('https://www.saucedemo.com/');
    const cookies = await page.context().cookies();
    expect(cookies.filter((c) => c.name === 'session-username')).toHaveLength(0);
  });

  test('TC-UI-013 @P1 Back after signing out does not restore the session', async ({ signInAs, page }) => {
    const inventory = await signInAs(USERS.standard);
    await inventory.signOut();
    await page.goBack();
    await expect(page.getByTestId('inventory-item')).toHaveCount(0);
    await expect(page.getByTestId('login-button')).toBeVisible();
  });
});
