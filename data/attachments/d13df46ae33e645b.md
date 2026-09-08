# Instructions

- Following Playwright test failed.
- Explain why, be concise, respect Playwright best practices.
- Provide a snippet of code with the fix, if possible.

# Test info

- Name: edge-cases/boundary.spec.ts >> Boundary & edge cases >> TC_064 — form submission must trigger a profile creation API call
- Location: tests/edge-cases/boundary.spec.ts:96:7

# Error details

```
Error: Expected at least one non-Firebase POST request (profile creation API call)

expect(received).toBeGreaterThan(expected)

Expected: > 0
Received:   0
```

# Page snapshot

```yaml
- generic [ref=e1]:
  - heading "User Profile Creation" [level=1] [ref=e2]
  - generic [ref=e3]:
    - generic [ref=e4]: "First Name (mandatory):"
    - textbox "First Name (mandatory):" [ref=e5]: John
    - generic [ref=e6]: "Last Name (mandatory):"
    - textbox "Last Name (mandatory):" [ref=e7]: Smith
    - generic [ref=e8]: "Email (mandatory):"
    - textbox "Email (mandatory):" [ref=e9]: john.smith@example.com
    - generic [ref=e10]: "Password (mandatory):"
    - textbox "Password (mandatory):" [ref=e11]: P@ssw0rd
    - generic [ref=e12]: "Confirm Password (mandatory):"
    - textbox "Confirm Password (mandatory):" [ref=e13]: P@ssw0rd
    - group "Gender (optional):" [ref=e14]:
      - generic [ref=e15]: "Gender (optional):"
      - radio "Male" [ref=e16]
      - generic [ref=e17]: Male
      - radio "Female" [ref=e18]
      - generic [ref=e19]: Female
      - radio "Prefer not to say" [ref=e20]
      - generic [ref=e21]: Prefer not to say
    - generic [ref=e22]: "Date ofBirth (optional):"
    - textbox "Date ofBirth (optional):" [ref=e23]
    - generic [ref=e24]: "Phone Number (optional):"
    - textbox "Phone Number (optional):" [ref=e25]
    - generic [ref=e26]: "Address (optioal):"
    - textbox "Address (optioal):" [ref=e27]
    - generic [ref=e28]: "LinkedIn URL (optional):"
    - textbox "LinkedIn URL (optional):" [ref=e29]: https://www.linkedin.com/in/johnsmith
    - generic [ref=e30]: "GitHub URL (optional):"
    - textbox "GitHub URL (optional):" [ref=e31]
    - button "Submit" [active] [ref=e32] [cursor=pointer]
  - paragraph [ref=e33]: Success!
```

# Test source

```ts
  23  | 
  24  |   // TC_005 — whitespace-only first name should be treated as empty
  25  |   test('TC_005 — whitespace-only first name is treated as empty', async () => {
  26  |     await reg.fillMandatoryFields({
  27  |       firstName: INVALID.whitespaceOnly, lastName: VALID.lastName,
  28  |       email: VALID.email, password: VALID.password, confirmPassword: VALID.confirmPassword,
  29  |       linkedinUrl: VALID.linkedinUrl
  30  |     });
  31  |     await reg.submit();
  32  |     await reg.assertFieldError('firstName');
  33  |   });
  34  | 
  35  |   // TC_038 — phone: exactly 10 digits (valid boundary)
  36  |   test('TC_038 — phone number with exactly 10 digits is accepted', async () => {
  37  |     await reg.fillMandatoryFields({
  38  |       firstName: VALID.firstName, lastName: VALID.lastName,
  39  |       email: VALID.email, password: VALID.password, confirmPassword: VALID.confirmPassword,
  40  |       linkedinUrl: VALID.linkedinUrl
  41  |     });
  42  |     await reg.fillOptionalFields({ phoneNumber: BOUNDARY.phone10Digits });
  43  |     await reg.submit();
  44  |     await reg.assertSuccess();
  45  |   });
  46  | 
  47  |   // TC_043 — phone: 9 digits (boundary — spec unclear, document result)
  48  |   test('TC_043 — phone number with 9 digits: document actual behaviour', async ({ page }) => {
  49  |     await reg.fillMandatoryFields({
  50  |       firstName: VALID.firstName, lastName: VALID.lastName,
  51  |       email: VALID.email, password: VALID.password, confirmPassword: VALID.confirmPassword,
  52  |       linkedinUrl: VALID.linkedinUrl
  53  |     });
  54  |     await reg.fillOptionalFields({ phoneNumber: BOUNDARY.phone9Digits });
  55  |     await reg.submit();
  56  |     // Capture and log actual result for spec clarification (BUG_006)
  57  |     const hasError = await page.locator(
  58  |       '[data-testid="phone-error"], #phone-error, .error',
  59  |     ).first().isVisible().catch(() => false);
  60  |     console.log(`TC_043 — 9-digit phone result: error displayed = ${hasError}`);
  61  |     // Soft assertion — test passes either way; result is documented
  62  |     test.info().annotations.push({
  63  |       type: 'spec-clarification',
  64  |       description: `BUG_006: 9-digit phone error = ${hasError}. Confirm with dev team whether min is 10 or max is 10.`,
  65  |     });
  66  |   });
  67  | 
  68  |   // TC_037 — DOB: oldest plausible date
  69  |   test('TC_037 — date of birth 1900-01-01 is accepted', async () => {
  70  |     await reg.fillMandatoryFields({
  71  |       firstName: VALID.firstName, lastName: VALID.lastName,
  72  |       email: VALID.email, password: VALID.password, confirmPassword: VALID.confirmPassword,
  73  |       linkedinUrl: VALID.linkedinUrl
  74  |     });
  75  |     await reg.fillOptionalFields({ dateOfBirth: '1900-01-01' });
  76  |     await reg.submit();
  77  |     await reg.assertSuccess();
  78  |   });
  79  | 
  80  |   // TC_035 — DOB: far future date
  81  |   test('TC_035 — date of birth in the far future: document actual behaviour', async ({ page }) => {
  82  |     await reg.fillMandatoryFields({
  83  |       firstName: VALID.firstName, lastName: VALID.lastName,
  84  |       email: VALID.email, password: VALID.password, confirmPassword: VALID.confirmPassword,
  85  |       linkedinUrl: VALID.linkedinUrl
  86  |     });
  87  |     await reg.fillOptionalFields({ dateOfBirth: INVALID.dateFuture });
  88  |     await reg.submit();
  89  |     const hasError = await page.locator(
  90  |       '[data-testid="dob-error"], #dob-error, .error',
  91  |     ).first().isVisible().catch(() => false);
  92  |     console.log(`TC_035 — future DOB result: error displayed = ${hasError}`);
  93  |   });
  94  | 
  95  |   // TC_064 — Network assertion: a real POST to the profile API must be visible
  96  |   test('TC_064 — form submission must trigger a profile creation API call', async ({ page }) => {
  97  |     // Listen for any POST request that is NOT the Firebase Remote Config endpoint
  98  |     const profileRequests: string[] = [];
  99  |     page.on('request', req => {
  100 |       if (
  101 |         req.method() === 'POST' &&
  102 |         !req.url().includes('firebaseremoteconfig.googleapis.com')
  103 |       ) {
  104 |         profileRequests.push(req.url());
  105 |       }
  106 |     });
  107 | 
  108 |     test.fail(true, 'BUG_008: Form submission does not trigger a POST request as expected.');
  109 | 
  110 |     await reg.fillMandatoryFields({
  111 |       firstName: VALID.firstName, lastName: VALID.lastName,
  112 |       email: VALID.email, password: VALID.password, confirmPassword: VALID.confirmPassword,
  113 |       linkedinUrl: VALID.linkedinUrl
  114 |     });
  115 |     await reg.submit();
  116 |     // Wait briefly for any async request
  117 |     await page.waitForTimeout(2000);
  118 | 
  119 |     // BUG_008: this assertion is expected to FAIL until the bug is fixed
  120 |     expect(
  121 |       profileRequests.length,
  122 |       'Expected at least one non-Firebase POST request (profile creation API call)',
> 123 |     ).toBeGreaterThan(0);
      |       ^ Error: Expected at least one non-Firebase POST request (profile creation API call)
  124 |   });
  125 | });
```