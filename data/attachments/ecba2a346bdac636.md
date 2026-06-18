# Instructions

- Following Playwright test failed.
- Explain why, be concise, respect Playwright best practices.
- Provide a snippet of code with the fix, if possible.

# Test info

- Name: edge-cases/boundary.spec.ts >> Boundary & edge cases >> TC_038 — phone number with exactly 10 digits is accepted
- Location: tests/edge-cases/boundary.spec.ts:36:7

# Error details

```
TimeoutError: page.goto: Timeout 20000ms exceeded.
Call log:
  - navigating to "https://qa-assessment.pages.dev/", waiting until "networkidle"

```

# Test source

```ts
  1   | import { Page, expect, test } from '@playwright/test';
  2   | 
  3   | export class RegisterPage {
  4   |   readonly page: Page;
  5   |   private lastDialogMessage: string | null = null;
  6   | 
  7   |   constructor(page: Page) {
  8   |     this.page = page;
  9   |     this.page.on('dialog', async dialog => {
  10  |       this.lastDialogMessage = dialog.message();
  11  |       console.log(`[DIALOG] ${this.lastDialogMessage}`);
  12  |       await dialog.dismiss().catch(() => {});
  13  |     });
  14  |   }
  15  | 
  16  |   async goto(): Promise<void> {
  17  |     await test.step('Navigate and Setup', async () => {
> 18  |         await this.page.goto('https://qa-assessment.pages.dev/', { waitUntil: 'networkidle' });
      |                         ^ TimeoutError: page.goto: Timeout 20000ms exceeded.
  19  |         await this.page.waitForSelector('#firstName');
  20  |         
  21  |         await this.page.evaluate(() => {
  22  |             const form = document.forms.namedItem("profileForm");
  23  |             if (form) {
  24  |                 form.addEventListener('submit', (e) => {
  25  |                     // We let the internal validateForm() run (it's called via onsubmit)
  26  |                     // but we prevent the actual HTTP POST/refresh.
  27  |                     e.preventDefault();
  28  |                 });
  29  |             }
  30  |         });
  31  |     });
  32  |   }
  33  | 
  34  |   private async syncFieldValue(name: string, value: string): Promise<void> {
  35  |     await this.page.evaluate(({ n, v }) => {
  36  |         const form = document.forms.namedItem("profileForm") as HTMLFormElement;
  37  |         if (form && form[n]) {
  38  |             const el = form[n] as HTMLInputElement;
  39  |             el.value = v;
  40  |             el.dispatchEvent(new Event('input', { bubbles: true }));
  41  |             el.dispatchEvent(new Event('change', { bubbles: true }));
  42  |         }
  43  |     }, { n: name, v: value });
  44  |   }
  45  | 
  46  |   async fillMandatoryFields(data: any): Promise<void> {
  47  |     await test.step('Fill Mandatory Fields with Defaults', async () => {
  48  |          const firstName = data.firstName !== undefined ? data.firstName : 'John';
  49  |         const lastName = data.lastName !== undefined ? data.lastName : 'Smith';
  50  |         const email = data.email !== undefined ? data.email : 'john.doe@example.com';
  51  |         const password = data.password !== undefined ? data.password : 'Password123!';
  52  |         const confirmPassword = data.confirmPassword !== undefined ? data.confirmPassword : (data.password || 'Password123!');
  53  |         const linkedin = data.linkedinUrl || 'https://www.linkedin.com/in/johndoe';
  54  | 
  55  |         await this.page.fill('#firstName', firstName);
  56  |         await this.syncFieldValue('firstName', firstName);
  57  |         
  58  |         await this.page.fill('#lastName', lastName);
  59  |         await this.syncFieldValue('lastName', lastName);
  60  |         
  61  |         await this.page.fill('#email', email);
  62  |         await this.syncFieldValue('email', email);
  63  |         
  64  |         await this.page.fill('#password', password);
  65  |         await this.syncFieldValue('password', password);
  66  |         
  67  |         await this.page.fill('#confirmPassword', confirmPassword);
  68  |         await this.syncFieldValue('confirmPassword', confirmPassword);
  69  |         
  70  |         await this.page.fill('#linkedIn', linkedin);
  71  |         await this.syncFieldValue('linkedIn', linkedin);
  72  |     });
  73  |   }
  74  | 
  75  |   async fillOptionalFields(data: any): Promise<void> {
  76  |     await test.step('Fill Optional Fields', async () => {
  77  |         if (data.gender) await this.page.check(`#${data.gender}`).catch(() => {});
  78  |         if (data.dateOfBirth) {
  79  |             await this.page.fill('#dob', data.dateOfBirth);
  80  |             await this.syncFieldValue('dob', data.dateOfBirth);
  81  |         }
  82  |         if (data.phoneNumber) {
  83  |             await this.page.fill('#phone', data.phoneNumber);
  84  |             await this.syncFieldValue('phone', data.phoneNumber);
  85  |         }
  86  |     });
  87  |   }
  88  | 
  89  |   async submit(): Promise<void> {
  90  |     await test.step('Submit Form', async () => {
  91  |         this.lastDialogMessage = null;
  92  |         
  93  |          // custom validation script (script.js) is the one triggering the alerts.
  94  |         await this.page.evaluate(() => {
  95  |             const form = document.forms.namedItem("profileForm");
  96  |             if (form) form.setAttribute('novalidate', 'true');
  97  |         });
  98  | 
  99  |         await this.page.click('input[type="submit"]');
  100 |         // Give the legacy script time to execute and trigger the alert
  101 |         await this.page.waitForTimeout(1000);
  102 |     });
  103 |   }
  104 | 
  105 |   async assertSuccess(): Promise<string> {
  106 |     return await test.step('Verify Success Message', async () => {
  107 |         if (this.lastDialogMessage) {
  108 |             throw new Error(`Registration failed with alert: ${this.lastDialogMessage}`);
  109 |         }
  110 |         const successLocator = this.page.locator('.success');
  111 |         await expect(successLocator).toBeVisible({ timeout: 5000 });
  112 |         const message = await successLocator.textContent();
  113 |         return message || '';
  114 |     });
  115 |   }
  116 | 
  117 |   async assertFieldError(field: string, errorText?: string): Promise<void> {
  118 |     await test.step(`Verify error for ${field}`, async () => {
```