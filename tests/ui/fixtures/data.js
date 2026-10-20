/** Accounts the application accepts. The brief documents the first four; the
 *  sign-in page itself lists all six -- recorded as OBS-01 in docs/DEFECTS.md. */
export const USERS = {
  standard: 'standard_user',
  problem: 'problem_user',
  glitch: 'performance_glitch_user',
  lockedOut: 'locked_out_user',
  error: 'error_user',
  visual: 'visual_user',
};

export const PASSWORD = 'secret_sauce';

/** The catalogue is a fixed list compiled into the application; there is no backend
 *  to fetch it from, so these are the expected values rather than a snapshot. */
export const PRODUCTS = [
  { name: 'Sauce Labs Backpack', price: 29.99 },
  { name: 'Sauce Labs Bike Light', price: 9.99 },
  { name: 'Sauce Labs Bolt T-Shirt', price: 15.99 },
  { name: 'Sauce Labs Fleece Jacket', price: 49.99 },
  { name: 'Sauce Labs Onesie', price: 7.99 },
  { name: 'Test.allTheThings() T-Shirt (Red)', price: 15.99 },
];

/** Tax rate is a constant compiled into the browser code. Recorded as an assumption,
 *  not as agreed behaviour -- see Q-02 in docs/OPEN_QUESTIONS.md. */
export const TAX_RATE = 0.08;

export const SORT = { nameAsc: 'az', nameDesc: 'za', priceAsc: 'lohi', priceDesc: 'hilo' };

export const PROTECTED_ROUTES = [
  '/inventory.html',
  '/cart.html',
  '/checkout-step-one.html',
  '/checkout-step-two.html',
  '/checkout-complete.html',
  '/inventory-long.html',
  '/dynamic-catalog-lazy-load.html',
  '/dynamic-catalog-spinner.html',
  '/dynamic-catalog-slider.html',
];

/** The application builds its add/remove test ids from the product name. */
export const slug = (name) => name.replace(/\s+/g, '-').toLowerCase();

export const sortedBy = {
  nameAsc: (items) => [...items].sort((a, b) => a.name.localeCompare(b.name)),
  nameDesc: (items) => [...items].sort((a, b) => b.name.localeCompare(a.name)),
  priceAsc: (items) => [...items].sort((a, b) => a.price - b.price),
  priceDesc: (items) => [...items].sort((a, b) => b.price - a.price),
};
