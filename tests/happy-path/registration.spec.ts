import { test } from '@playwright/test';
import { RegisterPage } from '../../pages/RegisterPage';
import { VALID } from '../../fixtures/testData';

test.describe('Happy Path — User Registration', () => {
  let reg: RegisterPage;

  test.beforeEach(async ({ page }) => {
    reg = new RegisterPage(page);
    await reg.goto();
  });

  test('TC_001 — successful registration with all fields', async () => {
    await reg.fillMandatoryFields(VALID);
    await reg.fillOptionalFields({
        gender: VALID.gender,
        dateOfBirth: VALID.dateOfBirth,
        phoneNumber: VALID.phoneNumber,
        address: VALID.address,
        githubUrl: VALID.githubUrl
    });
    await reg.submit();
    await reg.assertSuccess();
  });

  test('TC_091 — successful registration with only mandatory fields', async () => {
    await reg.fillMandatoryFields(VALID);
    await reg.submit();
    await reg.assertSuccess();
  });
});