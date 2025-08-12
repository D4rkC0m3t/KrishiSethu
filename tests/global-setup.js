// tests/global-setup.js
const { chromium } = require('@playwright/test');

async function globalSetup() {
  console.log('🚀 Starting KrishiSethu E2E Test Setup...');
  
  // Start browser for setup
  const browser = await chromium.launch();
  const context = await browser.newContext();
  const page = await context.newPage();
  
  try {
    // Check if application is running
    console.log('📡 Checking if KrishiSethu application is accessible...');
    await page.goto(process.env.BASE_URL || 'http://localhost:3001', { 
      waitUntil: 'networkidle',
      timeout: 30000 
    });
    
    // Verify landing page loads
    await page.waitForSelector('text=Krishisetu, text=Get Started', { timeout: 10000 });
    console.log('✅ KrishiSethu application is accessible');
    
    // Navigate to login and verify admin user exists
    const getStartedButton = page.locator('text=Get Started Free');
    if (await getStartedButton.isVisible()) {
      await getStartedButton.click();
    }
    
    // Try to login with admin credentials to verify setup
    console.log('🔐 Verifying admin user access...');
    await page.fill('input[type="email"], input[name="email"], #email', 'admin@krishisethu.com');
    await page.fill('input[type="password"], input[name="password"], #password', 'admin123');
    await page.click('button[type="submit"], button:has-text("Login"), button:has-text("Sign In")');
    
    // Wait for dashboard or handle login error
    try {
      await page.waitForSelector('text=Dashboard, h1, h2', { timeout: 10000 });
      console.log('✅ Admin user authentication successful');
      
      // Logout for clean state
      const logoutButton = page.locator('button:has-text("Logout"), .logout-btn, [data-action="logout"]');
      if (await logoutButton.isVisible()) {
        await logoutButton.click();
      }
    } catch (error) {
      console.log('⚠️  Admin login failed - tests will handle authentication setup');
    }
    
  } catch (error) {
    console.error('❌ Global setup failed:', error.message);
    console.log('💡 Make sure KrishiSethu application is running on http://localhost:3001');
    throw error;
  } finally {
    await browser.close();
  }
  
  console.log('✅ Global setup completed successfully');
}

module.exports = globalSetup;
