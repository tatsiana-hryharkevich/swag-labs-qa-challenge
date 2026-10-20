import { test, expect, knownFailure } from '../fixtures/test.js';
import { USERS, PRODUCTS, SORT, sortedBy } from '../fixtures/data.js';

/** Each sort mode, the control value it maps to, and the order it must produce. */
const MODES = [
  { id: 'TC-UI-040', label: 'name A to Z', option: SORT.nameAsc, expected: sortedBy.nameAsc(PRODUCTS) },
  { id: 'TC-UI-041', label: 'name Z to A', option: SORT.nameDesc, expected: sortedBy.nameDesc(PRODUCTS) },
  { id: 'TC-UI-042', label: 'price low to high', option: SORT.priceAsc, expected: sortedBy.priceAsc(PRODUCTS) },
  { id: 'TC-UI-043', label: 'price high to low', option: SORT.priceDesc, expected: sortedBy.priceDesc(PRODUCTS) },
];

test.describe('Sorting [REQ-003]', () => {
  for (const mode of MODES) {
    test(`${mode.id} @P1 ${mode.label} orders the catalogue correctly`, async ({ signInAs }) => {
      const inventory = await signInAs(USERS.standard);
      await inventory.sortBy(mode.option);
      expect(await inventory.productNames()).toEqual(mode.expected.map((p) => p.name));
      expect(await inventory.productPrices()).toEqual(mode.expected.map((p) => p.price));
    });
  }

  // The same four checks against the account whose sorting is deliberately broken.
  // The assertion is identical: what changes is that the failure is accounted for.
  //
  // Name A to Z is the exception and is NOT marked as a known failure. The catalogue
  // already opens in that order, so a broken sort and a working one produce the same
  // result and the check cannot tell them apart. It is kept because it still verifies
  // the order is correct, but it is not evidence either way about DEF-004.
  const PROBLEM_CASES = [
    { id: 'TC-UI-044', mode: MODES[0], detects: false },
    { id: 'TC-UI-045', mode: MODES[1], detects: true },
    { id: 'TC-UI-046', mode: MODES[2], detects: true },
    { id: 'TC-UI-047', mode: MODES[3], detects: true },
  ];
  for (const { id, mode, detects } of PROBLEM_CASES) {
    test(`${id} @P1 ${mode.label} orders the catalogue correctly (problem_user)`, async ({ signInAs }) => {
      if (detects) knownFailure('DEF-004', 'sorting has no effect in any of the four modes');
      const inventory = await signInAs(USERS.problem);
      await inventory.sortBy(mode.option);
      expect(await inventory.productNames()).toEqual(mode.expected.map((p) => p.name));
    });
  }

  test('TC-UI-051 @P2 sorting does not show a dialog to the customer (error_user)', async ({ signInAs, page }) => {
    knownFailure('DEF-011', 'a blocking alert naming an internal tool is shown, and the order does not change');
    const dialogs = [];
    page.on('dialog', async (d) => { dialogs.push(d.message()); await d.dismiss(); });
    const inventory = await signInAs(USERS.error);
    await inventory.sortBy(SORT.nameDesc);
    expect(dialogs).toEqual([]);
    expect(await inventory.productNames()).toEqual(sortedBy.nameDesc(PRODUCTS).map((p) => p.name));
  });

  test('TC-UI-048 @P2 the catalogue opens sorted by name A to Z', async ({ signInAs }) => {
    const inventory = await signInAs(USERS.standard);
    await expect(inventory.sortSelect).toHaveValue(SORT.nameAsc);
    expect(await inventory.productNames()).toEqual(sortedBy.nameAsc(PRODUCTS).map((p) => p.name));
  });

  test('TC-UI-049 @P2 sorting is correct for the slow account', async ({ signInAs }) => {
    test.slow();
    const inventory = await signInAs(USERS.glitch);
    await inventory.sortBy(SORT.priceDesc);
    expect(await inventory.productNames()).toEqual(sortedBy.priceDesc(PRODUCTS).map((p) => p.name));
  });
});

test.describe('Catalogue data integrity [REQ-003]', () => {
  test('TC-UI-050 @P2 every product shows its own image (problem_user)', async ({ signInAs }) => {
    knownFailure('DEF-003', 'every product image is replaced with the same placeholder');
    const inventory = await signInAs(USERS.problem);
    const sources = await inventory.imageSources();
    expect(new Set(sources).size).toBe(PRODUCTS.length);
    expect(sources.some((s) => s.includes('sl-404'))).toBe(false);
  });

  test('TC-UI-050 @P2 catalogue prices are the real prices (visual_user)', async ({ signInAs }) => {
    knownFailure('DEF-008', 'catalogue prices are generated at random and differ from the price charged');
    const inventory = await signInAs(USERS.visual);
    expect(await inventory.productPrices()).toEqual(sortedBy.nameAsc(PRODUCTS).map((p) => p.price));
  });

  test('TC-UI-052 @P2 a product tile opens that same product (problem_user)', async ({ signInAs, page }) => {
    knownFailure('DEF-007', 'a tile opens the next product in the catalogue');
    const inventory = await signInAs(USERS.problem);
    await inventory.openProduct(PRODUCTS[0].name);
    await expect(page.getByTestId('inventory-item-name')).toHaveText(PRODUCTS[0].name);
  });

  test('TC-UI-052 @P2 a product tile opens that same product (standard_user)', async ({ signInAs, page }) => {
    const inventory = await signInAs(USERS.standard);
    await inventory.openProduct(PRODUCTS[0].name);
    await expect(page.getByTestId('inventory-item-name')).toHaveText(PRODUCTS[0].name);
  });
});
