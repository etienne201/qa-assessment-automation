# Instructions

- Following Playwright test failed.
- Explain why, be concise, respect Playwright best practices.
- Provide a snippet of code with the fix, if possible.

# Test info

- Name: edge-cases/boundary.spec.ts >> Boundary & edge cases >> TC_064 — form submission must trigger a profile creation API call
- Location: tests/edge-cases/boundary.spec.ts:101:7

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
  28  | 
  29  |   // TC_005 — whitespace-only first name should be treated as empty
  30  |   test('TC_005 — whitespace-only first name is treated as empty', async () => {
  31  |     await reg.fillMandatoryFields({
  32  |       firstName: INVALID.whitespaceOnly, lastName: VALID.lastName,
  33  |       email: VALID.email, password: VALID.password, confirmPassword: VALID.confirmPassword,
  34  |       linkedinUrl: VALID.linkedinUrl
  35  |     });
  36  |     await reg.submit();
  37  |     await reg.assertFieldError('firstName');
  38  |   });
  39  | 
  40  |   // TC_038 — phone: exactly 10 digits (valid boundary)
  41  |   test('TC_038 — phone number with exactly 10 digits is accepted', async () => {
  42  |     await reg.fillMandatoryFields({
  43  |       firstName: VALID.firstName, lastName: VALID.lastName,
  44  |       email: VALID.email, password: VALID.password, confirmPassword: VALID.confirmPassword,
  45  |       linkedinUrl: VALID.linkedinUrl
  46  |     });
  47  |     await reg.fillOptionalFields({ phoneNumber: BOUNDARY.phone10Digits });
  48  |     await reg.submit();
  49  |     await reg.assertSuccess();
  50  |   });
  51  | 
  52  |   // TC_043 — phone: 9 digits (boundary — spec unclear, document result)
  53  |   test('TC_043 — phone number with 9 digits: document actual behaviour', async ({ page }) => {
  54  |     await reg.fillMandatoryFields({
  55  |       firstName: VALID.firstName, lastName: VALID.lastName,
  56  |       email: VALID.email, password: VALID.password, confirmPassword: VALID.confirmPassword,
  57  |       linkedinUrl: VALID.linkedinUrl
  58  |     });
  59  |     await reg.fillOptionalFields({ phoneNumber: BOUNDARY.phone9Digits });
  60  |     await reg.submit();
  61  |     // Capture and log actual result for spec clarification (BUG_006)
  62  |     const hasError = await page.locator(
  63  |       '[data-testid="phone-error"], #phone-error, .error',
  64  |     ).first().isVisible().catch(() => false);
  65  |     console.log(`TC_043 — 9-digit phone result: error displayed = ${hasError}`);
  66  |     // Soft assertion — test passes either way; result is documented
  67  |     test.info().annotations.push({
  68  |       type: 'spec-clarification',
  69  |       description: `BUG_006: 9-digit phone error = ${hasError}. Confirm with dev team whether min is 10 or max is 10.`,
  70  |     });
  71  |   });
  72  | 
  73  |   // TC_037 — DOB: oldest plausible date
  74  |   test('TC_037 — date of birth 1900-01-01 is accepted', async () => {
  75  |     await reg.fillMandatoryFields({
  76  |       firstName: VALID.firstName, lastName: VALID.lastName,
  77  |       email: VALID.email, password: VALID.password, confirmPassword: VALID.confirmPassword,
  78  |       linkedinUrl: VALID.linkedinUrl
  79  |     });
  80  |     await reg.fillOptionalFields({ dateOfBirth: '1900-01-01' });
  81  |     await reg.submit();
  82  |     await reg.assertSuccess();
  83  |   });
  84  | 
  85  |   // TC_035 — DOB: far future date
  86  |   test('TC_035 — date of birth in the far future: document actual behaviour', async ({ page }) => {
  87  |     await reg.fillMandatoryFields({
  88  |       firstName: VALID.firstName, lastName: VALID.lastName,
  89  |       email: VALID.email, password: VALID.password, confirmPassword: VALID.confirmPassword,
  90  |       linkedinUrl: VALID.linkedinUrl
  91  |     });
  92  |     await reg.fillOptionalFields({ dateOfBirth: INVALID.dateFuture });
  93  |     await reg.submit();
  94  |     const hasError = await page.locator(
  95  |       '[data-testid="dob-error"], #dob-error, .error',
  96  |     ).first().isVisible().catch(() => false);
  97  |     console.log(`TC_035 — future DOB result: error displayed = ${hasError}`);
  98  |   });
  99  | 
  100 |   // TC_064 — Network assertion: a real POST to the profile API must be visible
  101 |   test('TC_064 — form submission must trigger a profile creation API call', async ({ page }) => {
  102 |     // Listen for any POST request that is NOT the Firebase Remote Config endpoint
  103 |     const profileRequests: string[] = [];
  104 |     page.on('request', req => {
  105 |       if (
  106 |         req.method() === 'POST' &&
  107 |         !req.url().includes('firebaseremoteconfig.googleapis.com')
  108 |       ) {
  109 |         profileRequests.push(req.url());
  110 |       }
  111 |     });
  112 | 
  113 |     test.fail(true, 'BUG_008: Form submission does not trigger a POST request as expected.');
  114 | 
  115 |     await reg.fillMandatoryFields({
  116 |       firstName: VALID.firstName, lastName: VALID.lastName,
  117 |       email: VALID.email, password: VALID.password, confirmPassword: VALID.confirmPassword,
  118 |       linkedinUrl: VALID.linkedinUrl
  119 |     });
  120 |     await reg.submit();
  121 |     // Wait briefly for any async request
  122 |     await page.waitForTimeout(2000);
  123 | 
  124 |     // BUG_008: this assertion is expected to FAIL until the bug is fixed
  125 |     expect(
  126 |       profileRequests.length,
  127 |       'Expected at least one non-Firebase POST request (profile creation API call)',
> 128 |     ).toBeGreaterThan(0);
      |       ^ Error: Expected at least one non-Firebase POST request (profile creation API call)
  129 |   });
  130 | });
```