import { test, expect } from '@playwright/test';

test.describe('Phase G2: Settings Page', () => {
  test('should load settings page, edit preferences, and switch theme', async ({ page }) => {
    await page.goto('http://localhost:3000/settings');
    
    // Wait for initial fetch to complete to prevent race condition where server preferences overwrite our clicks
    await page.waitForResponse(response => response.url().includes('/api/preferences') && response.request().method() === 'GET');
    
    await expect(page.locator('h1')).toContainText('Settings');
    
    const langSelect = page.locator('select').first();
    await langSelect.selectOption('BN');
    
    const themeSelect = page.locator('select').nth(1);
    await themeSelect.selectOption('HACKER');
    
    const depthSelect = page.locator('select').nth(2);
    await depthSelect.selectOption('HIGH');
    
    const saveButton = page.locator('button').first();
    await saveButton.click();
    
    await expect(page.locator('html')).toHaveClass(/theme-hacker/);
    
    await page.reload();
    await expect(page.locator('html')).toHaveClass(/theme-hacker/);
    await expect(page.locator('select').first()).toHaveValue('BN');
    await expect(page.locator('select').nth(2)).toHaveValue('HIGH');
  });
});