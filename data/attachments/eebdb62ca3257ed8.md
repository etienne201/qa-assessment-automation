# Instructions

- Following Playwright test failed.
- Explain why, be concise, respect Playwright best practices.
- Provide a snippet of code with the fix, if possible.

# Test info

- Name: negative/validation.spec.ts >> Negative — mandatory field validation >> TC_071 — non-LinkedIn URL is rejected
- Location: tests/negative/validation.spec.ts:91:7

# Error details

```
Error: No alert or DOM error found for field linkedin

expect(locator).toBeVisible() failed

Locator: locator('[id*="linkedin-error"], .error:near(:text("linkedin"))').first()
Expected: visible
Timeout: 5000ms
Error: element(s) not found

Call log:
  - No alert or DOM error found for field linkedin with timeout 5000ms
  - waiting for locator('[id*="linkedin-error"], .error:near(:text("linkedin"))').first()

```

```yaml
- heading "User Profile Creation" [level=1]
- text: "First Name (mandatory):"
- textbox "First Name (mandatory):": John
- text: "Last Name (mandatory):"
- textbox "Last Name (mandatory):": Smith
- text: "Email (mandatory):"
- textbox "Email (mandatory):": john.smith@example.com
- text: "Password (mandatory):"
- textbox "Password (mandatory):": P@ssw0rd
- text: "Confirm Password (mandatory):"
- textbox "Confirm Password (mandatory):": P@ssw0rd
- group "Gender (optional):":
  - text: "Gender (optional):"
  - radio "Male"
  - text: Male
  - radio "Female"
  - text: Female
  - radio "Prefer not to say"
  - text: Prefer not to say
- text: "Date ofBirth (optional):"
- textbox "Date ofBirth (optional):"
- text: "Phone Number (optional):"
- textbox "Phone Number (optional):"
- text: "Address (optioal):"
- textbox "Address (optioal):"
- text: "LinkedIn URL (optional):"
- textbox "LinkedIn URL (optional):": https://www.twitter.com/johnsmith
- text: "GitHub URL (optional):"
- textbox "GitHub URL (optional):"
- button "Submit"
- paragraph: Success!
```

# Test source

```ts
  49  |     await test.step('Fill Mandatory Fields with Defaults', async () => {
  50  |         // Senior Pattern: Default to valid values if not provided to isolate the field being tested.
  51  |         const firstName = data.firstName !== undefined ? data.firstName : 'John';
  52  |         const lastName = data.lastName !== undefined ? data.lastName : 'Smith';
  53  |         const email = data.email !== undefined ? data.email : 'john.doe@example.com';
  54  |         const password = data.password !== undefined ? data.password : 'Password123!';
  55  |         const confirmPassword = data.confirmPassword !== undefined ? data.confirmPassword : (data.password || 'Password123!');
  56  |         const linkedin = data.linkedinUrl || 'https://www.linkedin.com/in/johndoe';
  57  | 
  58  |         await this.page.fill('#firstName', firstName);
  59  |         await this.syncFieldValue('firstName', firstName);
  60  |         
  61  |         await this.page.fill('#lastName', lastName);
  62  |         await this.syncFieldValue('lastName', lastName);
  63  |         
  64  |         await this.page.fill('#email', email);
  65  |         await this.syncFieldValue('email', email);
  66  |         
  67  |         await this.page.fill('#password', password);
  68  |         await this.syncFieldValue('password', password);
  69  |         
  70  |         await this.page.fill('#confirmPassword', confirmPassword);
  71  |         await this.syncFieldValue('confirmPassword', confirmPassword);
  72  |         
  73  |         await this.page.fill('#linkedIn', linkedin);
  74  |         await this.syncFieldValue('linkedIn', linkedin);
  75  |     });
  76  |   }
  77  | 
  78  |   async fillOptionalFields(data: any): Promise<void> {
  79  |     await test.step('Fill Optional Fields', async () => {
  80  |         if (data.gender) await this.page.check(`#${data.gender}`).catch(() => {});
  81  |         if (data.dateOfBirth) {
  82  |             await this.page.fill('#dob', data.dateOfBirth);
  83  |             await this.syncFieldValue('dob', data.dateOfBirth);
  84  |         }
  85  |         if (data.phoneNumber) {
  86  |             await this.page.fill('#phone', data.phoneNumber);
  87  |             await this.syncFieldValue('phone', data.phoneNumber);
  88  |         }
  89  |     });
  90  |   }
  91  | 
  92  |   async submit(): Promise<void> {
  93  |     await test.step('Submit Form', async () => {
  94  |         this.lastDialogMessage = null;
  95  |         
  96  |         // Pro/Senior Tip: Disable HTML5 native validation to ensure the application's 
  97  |         // custom validation script (script.js) is the one triggering the alerts.
  98  |         await this.page.evaluate(() => {
  99  |             const form = document.forms.namedItem("profileForm");
  100 |             if (form) form.setAttribute('novalidate', 'true');
  101 |         });
  102 | 
  103 |         await this.page.click('input[type="submit"]');
  104 |         // Give the legacy script time to execute and trigger the alert
  105 |         await this.page.waitForTimeout(1000);
  106 |     });
  107 |   }
  108 | 
  109 |   async assertSuccess(): Promise<string> {
  110 |     return await test.step('Verify Success Message', async () => {
  111 |         if (this.lastDialogMessage) {
  112 |             throw new Error(`Registration failed with alert: ${this.lastDialogMessage}`);
  113 |         }
  114 |         const successLocator = this.page.locator('.success');
  115 |         await expect(successLocator).toBeVisible({ timeout: 5000 });
  116 |         const message = await successLocator.textContent();
  117 |         return message || '';
  118 |     });
  119 |   }
  120 | 
  121 |   async assertFieldError(field: string, errorText?: string): Promise<void> {
  122 |     await test.step(`Verify error for ${field}`, async () => {
  123 |         if (this.lastDialogMessage) {
  124 |             const msg = this.lastDialogMessage.toLowerCase();
  125 |             
  126 |             const keywords: Record<string, string[]> = {
  127 |                 firstName: ['first name'],
  128 |                 lastName: ['last name', 'first name'], // Account for app bug
  129 |                 email: ['email'],
  130 |                 password: ['password'],
  131 |                 confirmPassword: ['confirm password', 'match'],
  132 |                 linkedin: ['linkedin'],
  133 |                 phone: ['phone'],
  134 |                 github: ['github']
  135 |             };
  136 | 
  137 |             const expected = keywords[field] || [field.toLowerCase()];
  138 |             const hasKeyword = expected.some(k => msg.includes(k));
  139 |             
  140 |             if (!hasKeyword && errorText) {
  141 |                 expect(msg).toContain(errorText.toLowerCase());
  142 |             } else {
  143 |                 expect(hasKeyword, `Alert mismatch for ${field}. Got: "${this.lastDialogMessage}"`).toBeTruthy();
  144 |             }
  145 |             
  146 |             this.lastDialogMessage = null;
  147 |         } else {
  148 |             const err = this.page.locator(`[id*="${field}-error"], .error:near(:text("${field}"))`).first();
> 149 |             await expect(err, `No alert or DOM error found for field ${field}`).toBeVisible({ timeout: 5000 });
      |                                                                                 ^ Error: No alert or DOM error found for field linkedin
  150 |             if (errorText) {
  151 |                 await expect(err).toContainText(errorText);
  152 |             }
  153 |         }
  154 |     });
  155 |   }
  156 | 
  157 |   async clearForm(): Promise<void> {
  158 |     await this.page.evaluate(() => (document.forms.namedItem("profileForm") as HTMLFormElement | null)?.reset());
  159 |     this.lastDialogMessage = null;
  160 |   }
  161 | }
```