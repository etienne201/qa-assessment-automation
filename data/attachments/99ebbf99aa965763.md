# Instructions

- Following Playwright test failed.
- Explain why, be concise, respect Playwright best practices.
- Provide a snippet of code with the fix, if possible.

# Test info

- Name: negative/validation.spec.ts >> Negative — mandatory field validation >> TC_081 — non-GitHub URL is rejected
- Location: tests/negative/validation.spec.ts:102:7

# Error details

```
Error: No alert or DOM error found for field github

expect(locator).toBeVisible() failed

Locator: locator('[id*="github-error"], .error:near(:text("github"))').first()
Expected: visible
Timeout: 5000ms
Error: element(s) not found

Call log:
  - No alert or DOM error found for field github with timeout 5000ms
  - waiting for locator('[id*="github-error"], .error:near(:text("github"))').first()

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
- textbox "LinkedIn URL (optional):": https://www.linkedin.com/in/johnsmith
- text: "GitHub URL (optional):"
- textbox "GitHub URL (optional):"
- button "Submit"
- paragraph: Success!
```

# Test source

```ts
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
  119 |         if (this.lastDialogMessage) {
  120 |             const msg = this.lastDialogMessage.toLowerCase();
  121 |             
  122 |             const keywords: Record<string, string[]> = {
  123 |                 firstName: ['first name'],
  124 |                 lastName: ['last name', 'first name'],  
  125 |                 email: ['email'],
  126 |                 password: ['password'],
  127 |                 confirmPassword: ['confirm password', 'match'],
  128 |                 linkedin: ['linkedin'],
  129 |                 phone: ['phone'],
  130 |                 github: ['github']
  131 |             };
  132 | 
  133 |             const expected = keywords[field] || [field.toLowerCase()];
  134 |             const hasKeyword = expected.some(k => msg.includes(k));
  135 |             
  136 |             if (!hasKeyword && errorText) {
  137 |                 expect(msg).toContain(errorText.toLowerCase());
  138 |             } else {
  139 |                 expect(hasKeyword, `Alert mismatch for ${field}. Got: "${this.lastDialogMessage}"`).toBeTruthy();
  140 |             }
  141 |             
  142 |             this.lastDialogMessage = null;
  143 |         } else {
  144 |             const err = this.page.locator(`[id*="${field}-error"], .error:near(:text("${field}"))`).first();
> 145 |             await expect(err, `No alert or DOM error found for field ${field}`).toBeVisible({ timeout: 5000 });
      |                                                                                 ^ Error: No alert or DOM error found for field github
  146 |             if (errorText) {
  147 |                 await expect(err).toContainText(errorText);
  148 |             }
  149 |         }
  150 |     });
  151 |   }
  152 | 
  153 |   async clearForm(): Promise<void> {
  154 |     await this.page.evaluate(() => (document.forms.namedItem("profileForm") as HTMLFormElement | null)?.reset());
  155 |     this.lastDialogMessage = null;
  156 |   }
  157 | }
```