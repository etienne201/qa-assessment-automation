import { Page, Locator, expect } from '@playwright/test';

 
export class BasePage {
  readonly page: Page;

  constructor(page: Page) {
    this.page = page;
  }

  //Navigate to a relative path 
  async goto(path = '/'): Promise<void> {
    await this.page.goto(path);
    await this.page.waitForLoadState('domcontentloaded');
  }

  //  Wait for network idle (useful before assertions) 
  async waitForIdle(): Promise<void> {
    await this.page.waitForLoadState('networkidle');
  }

  // Assert that the page title contains a given string
  async assertTitle(text: string): Promise<void> {
    await expect(this.page).toHaveTitle(new RegExp(text, 'i'));
  }

  // Assert that a success banner or confirmation element is visible
  async assertGlobalSuccess(timeout = 8_000): Promise<void> {
    const sel = [
      '[data-testid="success-message"]',
      '[role="alert"].success',
      '.success-banner',
      'text=Profile created',
      'text=Success',
    ].join(', ');
    await expect(this.page.locator(sel).first()).toBeVisible({ timeout });
  }

  // Assert that no French text appears in any visible error messages
  async assertNoFrenchErrors(): Promise<void> {
    const frenchPhrases = [
      'Veuillez',
      'requis',
      'est incorrect',
      'caractère',
      "n'est pas",
    ];
    for (const phrase of frenchPhrases) {
      const match = this.page.locator(`text=${phrase}`);
      const count = await match.count();
      expect(count, `French text "${phrase}" found on page`).toBe(0);
    }
  }

  // Capture a full-page screenshot with a descriptive name 
  async screenshot(name: string): Promise<void> {
    await this.page.screenshot({ path: `test-results/screenshots/${name}.png`, fullPage: true });
  }

  // Scroll to a locator and ensure it is in view
  async scrollTo(locator: Locator): Promise<void> {
    await locator.scrollIntoViewIfNeeded();
  }
}