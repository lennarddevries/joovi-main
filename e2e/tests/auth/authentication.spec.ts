import { expect, test } from '@playwright/test';

const mockTokens = {
  access_token: 'test-access-token',
  refresh_token: 'test-refresh-token',
} as const;

const loginPagePath = '/login?locale=en';

test.describe('Authentication', () => {
  test.beforeEach(async ({ page }) => {
    await page.addInitScript(() => {
      window.localStorage.clear();
      window.sessionStorage.clear();
    });
  });

  test.describe('Login form', () => {
    test('shows validation messages when fields are empty', async ({ page }) => {
      await page.goto(loginPagePath);

      const loginForm = page.locator('form');

      await loginForm.getByRole('button', { name: 'Sign In' }).click();

      await expect(loginForm.getByText('Email is required')).toBeVisible();
      await expect(loginForm.getByText('Password is required')).toBeVisible();
    });

    test('submits credentials, receives tokens, and redirects to profile', async ({ page }) => {
      await page.route('**/users/login', async route => {
        const body = JSON.parse(route.request().postData() ?? '{}');
        expect(body).toEqual({
          email: 'user@example.com',
          password: 'StrongPass123!',
        });

        await route.fulfill({
          status: 200,
          contentType: 'application/json',
          body: JSON.stringify(mockTokens),
        });
      });

      await page.goto(loginPagePath);

      const loginForm = page.locator('form');

      await loginForm.getByLabel('Email', { exact: true }).fill('user@example.com');
      await loginForm.getByLabel('Password', { exact: true }).fill('StrongPass123!');
      await loginForm.getByRole('button', { name: 'Sign In' }).click();

      await page.waitForURL('**/profile');

      const [sessionTokens, persistentTokens] = await page.evaluate(() => [
        window.sessionStorage.getItem('joovi_auth_tokens'),
        window.localStorage.getItem('joovi_auth_tokens'),
      ]);

      expect(sessionTokens).not.toBeNull();
      expect(JSON.parse(sessionTokens ?? '{}')).toEqual(mockTokens);
      expect(persistentTokens).toBeNull();

      await expect(page.getByRole('heading', { name: 'Profile' })).toBeVisible();
    });

    test('stores tokens persistently when remember me is checked', async ({ page }) => {
      await page.route('**/users/login', async route => {
        const body = JSON.parse(route.request().postData() ?? '{}');
        expect(body).toEqual({
          email: 'remember@example.com',
          password: 'PersistentPass123!',
        });

        await route.fulfill({
          status: 200,
          contentType: 'application/json',
          body: JSON.stringify(mockTokens),
        });
      });

      await page.goto(loginPagePath);

      const loginForm = page.locator('form');

      await loginForm.getByLabel('Email', { exact: true }).fill('remember@example.com');
      await loginForm.getByLabel('Password', { exact: true }).fill('PersistentPass123!');
      await loginForm.getByLabel('Remember me', { exact: true }).check();
      await loginForm.getByRole('button', { name: 'Sign In' }).click();

      await page.waitForURL('**/profile');

      const [persistentTokens, sessionTokens] = await page.evaluate(() => [
        window.localStorage.getItem('joovi_auth_tokens'),
        window.sessionStorage.getItem('joovi_auth_tokens'),
      ]);

      expect(persistentTokens).not.toBeNull();
      expect(JSON.parse(persistentTokens ?? '{}')).toEqual(mockTokens);
      expect(sessionTokens).toBeNull();

      await expect(page.getByRole('heading', { name: 'Profile' })).toBeVisible();
    });
  });

  test.describe('Registration form', () => {
    test('validates all fields before submitting', async ({ page }) => {
      await page.goto(loginPagePath);
      await page.getByRole('tab', { name: 'Register' }).click();

      const registerForm = page.locator('form');

      await registerForm.getByLabel('Email', { exact: true }).fill('not-an-email');
      await registerForm.getByLabel('Confirm password', { exact: true }).fill('Mismatch123!');
      await registerForm.getByRole('button', { name: 'Create Account' }).click();

      await expect(registerForm.getByText('Please enter a valid email')).toBeVisible();
      await expect(registerForm.getByText('Password is required')).toBeVisible();
      await expect(registerForm.getByText('Display name is required')).toBeVisible();
      await expect(registerForm.getByText('Passwords do not match')).toBeVisible();
    });

    test('auto-fills display name, registers user, and redirects to profile', async ({ page }) => {
      await page.route('**/users/register', async route => {
        const body = JSON.parse(route.request().postData() ?? '{}');
        expect(body).toEqual({
          email: 'new.user@example.com',
          password: 'Str0ngPass!2',
          display_name: 'new.user',
        });

        await route.fulfill({
          status: 200,
          contentType: 'application/json',
          body: JSON.stringify(mockTokens),
        });
      });

      await page.goto(loginPagePath);
      await page.getByRole('tab', { name: 'Register' }).click();

      const registerForm = page.locator('form');

      await registerForm.getByLabel('Email', { exact: true }).fill('new.user@example.com');
      await expect(registerForm.getByLabel('Display name', { exact: true })).toHaveValue(
        'new.user'
      );

      await registerForm.getByLabel('Password', { exact: true }).fill('Str0ngPass!2');
      await registerForm.getByLabel('Confirm password', { exact: true }).fill('Str0ngPass!2');
      await registerForm.getByRole('button', { name: 'Create Account' }).click();

      await page.waitForURL('**/profile');

      const storedTokens = await page.evaluate(() => localStorage.getItem('joovi_auth_tokens'));
      expect(storedTokens).not.toBeNull();
      expect(JSON.parse(storedTokens ?? '{}')).toEqual(mockTokens);

      await expect(page.getByRole('heading', { name: 'Profile' })).toBeVisible();
    });
  });
});
