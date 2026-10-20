import { expect } from '@playwright/test';
import { PASSWORD } from '../fixtures/data.js';

export class LoginPage {
  constructor(page) {
    this.page = page;
    this.username = page.getByTestId('username');
    this.password = page.getByTestId('password');
    this.submit = page.getByTestId('login-button');
    this.error = page.getByTestId('error');
  }

  async goto() {
    await this.page.goto('/');
    await expect(this.submit).toBeVisible();
  }

  async signIn(user, password = PASSWORD) {
    if (user !== null) await this.username.fill(user);
    if (password !== null) await this.password.fill(password);
    await this.submit.click();
  }

  /** Signs in and waits for catalogue content, not merely for the URL to change.
   *  The two are not the same here: the slow account changes the URL immediately
   *  and then blocks the browser for five seconds while rendering (DEF-013). */
  async signInAndWait(user, password = PASSWORD) {
    await this.signIn(user, password);
    await this.page.getByTestId('inventory-item').first().waitFor({ state: 'visible' });
  }

  async errorText() {
    return (await this.error.textContent())?.trim() ?? null;
  }
}
