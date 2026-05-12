import { test, expect } from '@playwright/test';
import { RegisterPage }  from '../../pages/RegisterPage';
import { VALID, INVALID, BOUNDARY } from '../../fixtures/testData';

/**
 * Edge case & boundary suite — TC_005, TC_006, TC_012, TC_037, TC_043, TC_058, TC_059.
 * Tests limit values and spec-unclear behaviours that need documentation.
 */

test.describe('Boundary & edge cases', () => {
  let reg: RegisterPage;

  test.beforeEach(async ({ page }) => {
    reg = new RegisterPage(page);
    await reg.goto();
  });

  // TC_006 — single-char first name
  test('TC_006 — single alphabetical character is accepted as first name', async () => {
    await reg.fillMandatoryFields({
      firstName: 'A', lastName: VALID.lastName,
      email: VALID.email, password: VALID.password, confirmPassword: VALID.confirmPassword,
      linkedinUrl: VALID.linkedinUrl
    });
    await reg.submit();
    await reg.assertSuccess();
  });

  // TC_005 — whitespace-only first name should be treated as empty
  test('TC_005 — whitespace-only first name is treated as empty', async () => {
    await reg.fillMandatoryFields({
      firstName: INVALID.whitespaceOnly, lastName: VALID.lastName,
      email: VALID.email, password: VALID.password, confirmPassword: VALID.confirmPassword,
      linkedinUrl: VALID.linkedinUrl
    });
    await reg.submit();
    await reg.assertFieldError('firstName');
  });

  // TC_038 — phone: exactly 10 digits (valid boundary)
  test('TC_038 — phone number with exactly 10 digits is accepted', async () => {
    await reg.fillMandatoryFields({
      firstName: VALID.firstName, lastName: VALID.lastName,
      email: VALID.email, password: VALID.password, confirmPassword: VALID.confirmPassword,
      linkedinUrl: VALID.linkedinUrl
    });
    await reg.fillOptionalFields({ phoneNumber: BOUNDARY.phone10Digits });
    await reg.submit();
    await reg.assertSuccess();
  });

  // TC_043 — phone: 9 digits (boundary — spec unclear, document result)
  test('TC_043 — phone number with 9 digits: document actual behaviour', async ({ page }) => {
    await reg.fillMandatoryFields({
      firstName: VALID.firstName, lastName: VALID.lastName,
      email: VALID.email, password: VALID.password, confirmPassword: VALID.confirmPassword,
      linkedinUrl: VALID.linkedinUrl
    });
    await reg.fillOptionalFields({ phoneNumber: BOUNDARY.phone9Digits });
    await reg.submit();
    // Capture and log actual result for spec clarification (BUG_006)
    const hasError = await page.locator(
      '[data-testid="phone-error"], #phone-error, .error',
    ).first().isVisible().catch(() => false);
    console.log(`TC_043 — 9-digit phone result: error displayed = ${hasError}`);
    // Soft assertion — test passes either way; result is documented
    test.info().annotations.push({
      type: 'spec-clarification',
      description: `BUG_006: 9-digit phone error = ${hasError}. Confirm with dev team whether min is 10 or max is 10.`,
    });
  });

  // TC_037 — DOB: oldest plausible date
  test('TC_037 — date of birth 1900-01-01 is accepted', async () => {
    await reg.fillMandatoryFields({
      firstName: VALID.firstName, lastName: VALID.lastName,
      email: VALID.email, password: VALID.password, confirmPassword: VALID.confirmPassword,
      linkedinUrl: VALID.linkedinUrl
    });
    await reg.fillOptionalFields({ dateOfBirth: '1900-01-01' });
    await reg.submit();
    await reg.assertSuccess();
  });

  // TC_035 — DOB: far future date
  test('TC_035 — date of birth in the far future: document actual behaviour', async ({ page }) => {
    await reg.fillMandatoryFields({
      firstName: VALID.firstName, lastName: VALID.lastName,
      email: VALID.email, password: VALID.password, confirmPassword: VALID.confirmPassword,
      linkedinUrl: VALID.linkedinUrl
    });
    await reg.fillOptionalFields({ dateOfBirth: INVALID.dateFuture });
    await reg.submit();
    const hasError = await page.locator(
      '[data-testid="dob-error"], #dob-error, .error',
    ).first().isVisible().catch(() => false);
    console.log(`TC_035 — future DOB result: error displayed = ${hasError}`);
  });

  // TC_064 — Network assertion: a real POST to the profile API must be visible
  test('TC_064 — form submission must trigger a profile creation API call', async ({ page }) => {
    // Listen for any POST request that is NOT the Firebase Remote Config endpoint
    const profileRequests: string[] = [];
    page.on('request', req => {
      if (
        req.method() === 'POST' &&
        !req.url().includes('firebaseremoteconfig.googleapis.com')
      ) {
        profileRequests.push(req.url());
      }
    });

    test.fail(true, 'BUG_008: Form submission does not trigger a POST request as expected.');

    await reg.fillMandatoryFields({
      firstName: VALID.firstName, lastName: VALID.lastName,
      email: VALID.email, password: VALID.password, confirmPassword: VALID.confirmPassword,
      linkedinUrl: VALID.linkedinUrl
    });
    await reg.submit();
    // Wait briefly for any async request
    await page.waitForTimeout(2000);

    // BUG_008: this assertion is expected to FAIL until the bug is fixed
    expect(
      profileRequests.length,
      'Expected at least one non-Firebase POST request (profile creation API call)',
    ).toBeGreaterThan(0);
  });
});