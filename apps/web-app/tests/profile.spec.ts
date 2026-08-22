import { test, expect } from '@playwright/test';

test.describe('Phase G1: Profile Page', () => {
  test('should load profile page and edit settings', async ({ page }) => {
    // Navigate to profile page
    await page.goto('http://localhost:3000/profile');
    
    // Check heading
    await expect(page.locator('h1')).toContainText('User Profile');
    
    // Check layout components
    await expect(page.locator('text=Identity & Skills')).toBeVisible();
    await expect(page.locator('text=Economics & Risk')).toBeVisible();
    
    // Edit Target Rate
    const targetRateInput = page.locator('input[type="number"]').first();
    await targetRateInput.fill('120');
    
    // Edit Skills
    const skillsTextarea = page.locator('textarea[placeholder*="React"]').first();
    await skillsTextarea.fill('TypeScript, React, Node.js, Next.js');
    
    // Save
    const saveButton = page.locator('button', { hasText: 'Save Changes' });
    await saveButton.click();
    
    // Wait for success message
    await expect(page.locator('text=Profile updated successfully')).toBeVisible();
  });
});
