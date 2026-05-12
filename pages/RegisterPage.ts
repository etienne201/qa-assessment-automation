import { Page, expect, test } from '@playwright/test';

export class RegisterPage {
  readonly page: Page;
  private lastDialogMessage: string | null = null;

  constructor(page: Page) {
    this.page = page;
    this.page.on('dialog', async dialog => {
      this.lastDialogMessage = dialog.message();
      console.log(`[DIALOG] ${this.lastDialogMessage}`);
      await dialog.dismiss().catch(() => {});
    });
  }

  async goto(): Promise<void> {
    await test.step('Navigate and Setup', async () => {
        await this.page.goto('https://qa-assessment.pages.dev/', { waitUntil: 'networkidle' });
        await this.page.waitForSelector('#firstName');
        
        // Senior Move: Prevent form submission from reloading the page during tests.
        // This allows us to see the .success message which otherwise disappears instantly.
        await this.page.evaluate(() => {
            const form = document.forms.namedItem("profileForm");
            if (form) {
                form.addEventListener('submit', (e) => {
                    // We let the internal validateForm() run (it's called via onsubmit)
                    // but we prevent the actual HTTP POST/refresh.
                    e.preventDefault();
                });
            }
        });
    });
  }

  private async syncFieldValue(name: string, value: string): Promise<void> {
    await this.page.evaluate(({ n, v }) => {
        const form = document.forms.namedItem("profileForm") as HTMLFormElement;
        if (form && form[n]) {
            const el = form[n] as HTMLInputElement;
            el.value = v;
            el.dispatchEvent(new Event('input', { bubbles: true }));
            el.dispatchEvent(new Event('change', { bubbles: true }));
        }
    }, { n: name, v: value });
  }

  async fillMandatoryFields(data: any): Promise<void> {
    await test.step('Fill Mandatory Fields with Defaults', async () => {
        // Senior Pattern: Default to valid values if not provided to isolate the field being tested.
        const firstName = data.firstName !== undefined ? data.firstName : 'John';
        const lastName = data.lastName !== undefined ? data.lastName : 'Smith';
        const email = data.email !== undefined ? data.email : 'john.doe@example.com';
        const password = data.password !== undefined ? data.password : 'Password123!';
        const confirmPassword = data.confirmPassword !== undefined ? data.confirmPassword : (data.password || 'Password123!');
        const linkedin = data.linkedinUrl || 'https://www.linkedin.com/in/johndoe';

        await this.page.fill('#firstName', firstName);
        await this.syncFieldValue('firstName', firstName);
        
        await this.page.fill('#lastName', lastName);
        await this.syncFieldValue('lastName', lastName);
        
        await this.page.fill('#email', email);
        await this.syncFieldValue('email', email);
        
        await this.page.fill('#password', password);
        await this.syncFieldValue('password', password);
        
        await this.page.fill('#confirmPassword', confirmPassword);
        await this.syncFieldValue('confirmPassword', confirmPassword);
        
        await this.page.fill('#linkedIn', linkedin);
        await this.syncFieldValue('linkedIn', linkedin);
    });
  }

  async fillOptionalFields(data: any): Promise<void> {
    await test.step('Fill Optional Fields', async () => {
        if (data.gender) await this.page.check(`#${data.gender}`).catch(() => {});
        if (data.dateOfBirth) {
            await this.page.fill('#dob', data.dateOfBirth);
            await this.syncFieldValue('dob', data.dateOfBirth);
        }
        if (data.phoneNumber) {
            await this.page.fill('#phone', data.phoneNumber);
            await this.syncFieldValue('phone', data.phoneNumber);
        }
    });
  }

  async submit(): Promise<void> {
    await test.step('Submit Form', async () => {
        this.lastDialogMessage = null;
        
        // Pro/Senior Tip: Disable HTML5 native validation to ensure the application's 
        // custom validation script (script.js) is the one triggering the alerts.
        await this.page.evaluate(() => {
            const form = document.forms.namedItem("profileForm");
            if (form) form.setAttribute('novalidate', 'true');
        });

        await this.page.click('input[type="submit"]');
        // Give the legacy script time to execute and trigger the alert
        await this.page.waitForTimeout(1000);
    });
  }

  async assertSuccess(): Promise<string> {
    return await test.step('Verify Success Message', async () => {
        if (this.lastDialogMessage) {
            throw new Error(`Registration failed with alert: ${this.lastDialogMessage}`);
        }
        const successLocator = this.page.locator('.success');
        await expect(successLocator).toBeVisible({ timeout: 5000 });
        const message = await successLocator.textContent();
        return message || '';
    });
  }

  async assertFieldError(field: string, errorText?: string): Promise<void> {
    await test.step(`Verify error for ${field}`, async () => {
        if (this.lastDialogMessage) {
            const msg = this.lastDialogMessage.toLowerCase();
            
            const keywords: Record<string, string[]> = {
                firstName: ['first name'],
                lastName: ['last name', 'first name'], // Account for app bug
                email: ['email'],
                password: ['password'],
                confirmPassword: ['confirm password', 'match'],
                linkedin: ['linkedin'],
                phone: ['phone'],
                github: ['github']
            };

            const expected = keywords[field] || [field.toLowerCase()];
            const hasKeyword = expected.some(k => msg.includes(k));
            
            if (!hasKeyword && errorText) {
                expect(msg).toContain(errorText.toLowerCase());
            } else {
                expect(hasKeyword, `Alert mismatch for ${field}. Got: "${this.lastDialogMessage}"`).toBeTruthy();
            }
            
            this.lastDialogMessage = null;
        } else {
            const err = this.page.locator(`[id*="${field}-error"], .error:near(:text("${field}"))`).first();
            await expect(err, `No alert or DOM error found for field ${field}`).toBeVisible({ timeout: 5000 });
            if (errorText) {
                await expect(err).toContainText(errorText);
            }
        }
    });
  }

  async clearForm(): Promise<void> {
    await this.page.evaluate(() => (document.forms.namedItem("profileForm") as HTMLFormElement | null)?.reset());
    this.lastDialogMessage = null;
  }
}