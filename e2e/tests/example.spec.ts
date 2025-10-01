import { test, expect } from '@playwright/test';

test.describe('Joovi Application E2E Tests', () => {
  test('should load the homepage', async ({ page }) => {
    await page.goto('/');

    // Wait for the page to be fully loaded
    await page.waitForLoadState('networkidle');

    // Basic assertion that the page loaded
    await expect(page).toHaveTitle(/./); // Match any title for now
  });

  test.skip('should have working API connection', async ({ page }) => {
    // Skip until API server is implemented
    // Test that the frontend can communicate with the backend
    const response = await page.request.get('http://localhost:8000/health');

    expect(response.ok()).toBeTruthy();
    expect(response.status()).toBe(200);
  });

  test('should render main content', async ({ page }) => {
    await page.goto('/');

    // Wait for the page to be interactive
    await page.waitForLoadState('domcontentloaded');

    // Check that the body has content
    const body = await page.locator('body');
    await expect(body).toBeVisible();
  });
});
