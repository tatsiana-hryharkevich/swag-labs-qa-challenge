import { slug } from '../fixtures/data.js';

export class InventoryPage {
  constructor(page) {
    this.page = page;
    this.items = page.getByTestId('inventory-item');
    this.names = page.getByTestId('inventory-item-name');
    this.prices = page.getByTestId('inventory-item-price');
    this.sortSelect = page.getByTestId('product-sort-container');
    this.cartLink = page.getByTestId('shopping-cart-link');
    this.cartBadge = page.getByTestId('shopping-cart-badge');
    this.menuButton = page.locator('#react-burger-menu-btn');
    this.logoutLink = page.getByTestId('logout-sidebar-link');
    this.resetLink = page.getByTestId('reset-sidebar-link');
  }

  async goto() {
    await this.page.goto('/inventory.html');
  }

  async productNames() {
    return (await this.names.allTextContents()).map((t) => t.trim());
  }

  /** Prices as numbers, so comparisons are arithmetic rather than string ordering. */
  async productPrices() {
    const raw = await this.prices.allTextContents();
    return raw.map((t) => Number(t.replace('$', '')));
  }

  async imageSources() {
    return this.page.locator('.inventory_item_img img').evaluateAll((els) =>
      els.map((e) => e.getAttribute('src')),
    );
  }

  async sortBy(option) {
    await this.sortSelect.selectOption(option);
  }

  async addToCart(productName) {
    await this.page.getByTestId(`add-to-cart-${slug(productName)}`).click();
  }

  async removeFromCart(productName) {
    await this.page.getByTestId(`remove-${slug(productName)}`).click();
  }

  /** The badge is absent rather than zero when the cart is empty. */
  async cartCount() {
    if (!(await this.cartBadge.isVisible())) return 0;
    return Number((await this.cartBadge.textContent()).trim());
  }

  /** Waits for the destination to be rendered, not merely for the address to change.
   *  In a single-page application the URL updates before the new view is drawn, so a
   *  page object that returns at that moment hands the next assertion the old page. */
  async openProduct(productName) {
    await this.names.filter({ hasText: productName }).first().click();
    await this.page.waitForURL(/inventory-item\.html/);
    await this.page.getByTestId('back-to-products').waitFor({ state: 'visible' });
  }

  async openCart() {
    await this.cartLink.click();
    await this.page.waitForURL(/cart\.html/);
    await this.page.getByTestId('continue-shopping').waitFor({ state: 'visible' });
  }

  async signOut() {
    await this.menuButton.click();
    await this.logoutLink.click();
    await this.page.waitForURL('https://www.saucedemo.com/');
  }

  async resetAppState() {
    await this.menuButton.click();
    await this.resetLink.click();
  }
}
