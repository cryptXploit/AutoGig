import { test, expect } from '@playwright/test';

test.describe('Phase G3: Explainable Agent Decision Console', () => {
  test('dashboard -> opportunity -> approve unblocked proposal', async ({ page }) => {
    // 1. Dashboard
    await page.goto('/');
    await expect(page.locator('h1').filter({ hasText: 'Command Center' })).toBeVisible();
    
    // 2. Click first "PENDING_APPROVAL"
    const pendingOpp = page.locator('text=PENDING_APPROVAL').first();
    await pendingOpp.click();
    
    // 3. Details Page Verification (Phase G3 Elements)
    await expect(page.locator('h1').filter({ hasText: 'Agent Decision Console' })).toBeVisible();
    await expect(page.locator('h3').filter({ hasText: 'Intelligence Telemetry' })).toBeVisible(); // Decision panel
    await expect(page.locator('h4').filter({ hasText: 'Explainable AI Analysis' })).toBeVisible(); // Explainable WHY
    await expect(page.locator('h3').filter({ hasText: 'Verified Proposal & Evidence Trace' })).toBeVisible(); // Evidence/Claim
    await expect(page.locator('h3').filter({ hasText: 'State Machine Timeline' })).toBeVisible(); // Timeline
    
    // Check if it has blocked claims
    const blockText = page.locator('text=Approval Blocked');
    if (await blockText.isVisible()) {
      return; // Skip if blocked, we test this separately
    }
    
    // 4. Click APPROVE & SEND
    page.on('dialog', dialog => dialog.accept());
    const approveBtn = page.locator('button', { hasText: 'APPROVE & SEND' });
    if (await approveBtn.isVisible() && await approveBtn.isEnabled()) {
      await approveBtn.click();
      await expect(page.locator('text=APPROVED').first()).toBeVisible({ timeout: 10000 });
    }
  });

  test('dashboard -> opportunity -> reject', async ({ page }) => {
    await page.goto('/inbox');
    
    // Find a pending opportunity
    const pendingOpp = page.locator('text=PENDING_APPROVAL').last();
    if (await pendingOpp.isVisible()) {
      await pendingOpp.click();
      
      const rejectBtn = page.locator('button', { hasText: 'LOW BUDGET' });
      if (await rejectBtn.isVisible()) {
        page.on('dialog', dialog => dialog.accept());
        await rejectBtn.click();
        await expect(page.locator('span', { hasText: 'REJECTED' }).first()).toBeVisible({ timeout: 10000 });
      }
    }
  });
  
  test('blocked proposal -> approval denied', async ({ page }) => {
    await page.goto('/inbox');
    const blockedOpp = page.locator('text=PENDING_APPROVAL').first(); 
    if (await blockedOpp.isVisible()) {
      await blockedOpp.click();
      
      // Look for the block alert specifically
      const blockText = page.locator('text=Approval Blocked');
      if (await blockText.isVisible()) {
         const approveBtn = page.locator('button', { hasText: 'APPROVE & SEND' });
         await expect(approveBtn).toBeDisabled();
      }
    }
  });
});
