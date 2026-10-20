export class CheckoutPage {
  constructor(page) {
    this.page = page;
    this.firstName = page.getByTestId('firstName');
    this.lastName = page.getByTestId('lastName');
    this.postalCode = page.getByTestId('postalCode');
    this.continueButton = page.getByTestId('continue');
    this.cancelButton = page.getByTestId('cancel');
    this.finishButton = page.getByTestId('finish');
    this.error = page.getByTestId('error');
    this.subtotal = page.getByTestId('subtotal-label');
    this.tax = page.getByTestId('tax-label');
    this.total = page.getByTestId('total-label');
    this.names = page.getByTestId('inventory-item-name');
  }

  async fillDetails({ first = 'Anna', last = 'Petrova', postal = '08001' } = {}) {
    if (first !== null) await this.firstName.fill(first);
    if (last !== null) await this.lastName.fill(last);
    if (postal !== null) await this.postalCode.fill(postal);
  }

  async continue() {
    await this.continueButton.click();
  }

  async errorText() {
    return (await this.error.textContent())?.trim() ?? null;
  }

  /** The three summary labels carry their caption with the value, so the number
   *  is extracted rather than compared as text. */
  async orderTotals() {
    const money = async (locator) =>
      Number((await locator.textContent()).replace(/[^0-9.]/g, ''));
    return {
      subtotal: await money(this.subtotal),
      tax: await money(this.tax),
      total: await money(this.total),
    };
  }

  async finish() {
    await this.finishButton.click();
  }

  async cancel() {
    await this.cancelButton.click();
    await this.page.waitForURL(/cart\.html/);
  }
}
