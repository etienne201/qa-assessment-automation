import { test, expect } from '@playwright/test';
import { RegisterPage }  from '../../pages/RegisterPage';
import { VALID, INVALID } from '../../fixtures/testData';

test.describe('Negative — mandatory field validation', () => {
  let reg: RegisterPage;

  test.beforeEach(async ({ page }) => {
    reg = new RegisterPage(page);
    await reg.goto();
  });

  test('TC_093 — submit empty form shows first required error', async () => {
    await reg.submit();
    // App only shows one alert at a time, starting with firstName
    await reg.assertFieldError('firstName');
  });


  test('TC_002 — empty first name shows required error', async () => {
    await reg.fillMandatoryFields({
      firstName: INVALID.emptyString, lastName: VALID.lastName,
      email: VALID.email, password: VALID.password, confirmPassword: VALID.confirmPassword,
      linkedinUrl: VALID.linkedinUrl
    });
    await reg.submit();
    await reg.assertFieldError('firstName');
  });


  test('TC_003 — first name with digits shows format error', async () => {
    await reg.fillMandatoryFields({
      firstName: INVALID.nameWithDigits, lastName: VALID.lastName,
      email: VALID.email, password: VALID.password, confirmPassword: VALID.confirmPassword,
      linkedinUrl: VALID.linkedinUrl
    });
    await reg.submit();
    await reg.assertFieldError('firstName');
  });

  test('TC_011 — email without @ shows format error', async () => {
    await reg.fillMandatoryFields({
      firstName: VALID.firstName, lastName: VALID.lastName,
      email: INVALID.emailMissingAt,
      password: VALID.password, confirmPassword: VALID.confirmPassword,
      linkedinUrl: VALID.linkedinUrl
    });
    await reg.submit();
    await reg.assertFieldError('email');
  });

  test('TC_022 — confirm password mismatch shows error', async () => {
    await reg.fillMandatoryFields({
      firstName: VALID.firstName, lastName: VALID.lastName,
      email: VALID.email,
      password: VALID.password,
      confirmPassword: INVALID.passwordMismatch,
      linkedinUrl: VALID.linkedinUrl
    });
    await reg.submit();
    await reg.assertFieldError('confirmPassword', 'match');
  });


  test('TC_051 — phone number over 10 digits is rejected', async () => {
    test.fail(true, 'BUG: Application does not validate phone number length');
    await reg.fillMandatoryFields({
      firstName: VALID.firstName, lastName: VALID.lastName,
      email: VALID.email, password: VALID.password, confirmPassword: VALID.confirmPassword,
      linkedinUrl: VALID.linkedinUrl
    });
    await reg.fillOptionalFields({ phoneNumber: INVALID.phone11Digits });
    await reg.submit();
    await reg.assertFieldError('phone');
  });

 
  test('TC_052 — phone with alphabetical characters is rejected', async () => {
    test.fail(true, 'BUG: Application does not validate phone number characters');
    await reg.fillMandatoryFields({
      firstName: VALID.firstName, lastName: VALID.lastName,
      email: VALID.email, password: VALID.password, confirmPassword: VALID.confirmPassword,
      linkedinUrl: VALID.linkedinUrl
    });
    await reg.fillOptionalFields({ phoneNumber: INVALID.phoneWithLetters });
    await reg.submit();
    await reg.assertFieldError('phone');
  });


  test('TC_071 — non-LinkedIn URL is rejected', async () => {
    test.fail(true, 'BUG: Application does not validate LinkedIn URL format');
    await reg.fillMandatoryFields({
      firstName: VALID.firstName, lastName: VALID.lastName,
      email: VALID.email, password: VALID.password, confirmPassword: VALID.confirmPassword,
      linkedinUrl: INVALID.notLinkedIn
    });
    await reg.submit();
    await reg.assertFieldError('linkedin');
  });

  test('TC_081 — non-GitHub URL is rejected', async () => {
    test.fail(true, 'BUG: Application does not validate GitHub URL format');
    await reg.fillMandatoryFields({
      firstName: VALID.firstName, lastName: VALID.lastName,
      email: VALID.email, password: VALID.password, confirmPassword: VALID.confirmPassword,
      linkedinUrl: VALID.linkedinUrl
    });
    await reg.fillOptionalFields({ githubUrl: INVALID.notGitHub });
    await reg.submit();
    await reg.assertFieldError('github');
  });
});