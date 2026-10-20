import { slug } from '../fixtures/data.js';

export class CartPage {
  constructor(page) {
    this.page = page;
    this.names = page.getByTestId('inventory-item-name');
    this.quantities = page.getByTestId('item-quantity');
    this.checkoutButton = page.getByTestId('checkout');
    this.continueShopping = page.getByTestId('continue-shopping');
  }

  async goto() {
    await this.page.goto('/cart.html');
  }

  async itemNames() {
    return (await this.names.allTextContents()).map((t) => t.trim());
  }

  async quantityValues() {
    return (await this.quantities.allTextContents()).map((t) => t.trim());
  }

  async removeItem(productName) {
    await this.page.getByTestId(`remove-${slug(productName)}`).click();
  }

  async checkout() {
    await this.checkoutButton.click();
    await this.page.waitForURL(/checkout-step-one\.html/);
    await this.page.getByTestId('firstName').waitFor({ state: 'visible' });
  }
}
