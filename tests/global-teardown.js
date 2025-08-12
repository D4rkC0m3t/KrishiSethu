// tests/global-teardown.js
const fs = require('fs');
const path = require('path');

async function globalTeardown() {
  console.log('🧹 Starting KrishiSethu E2E Test Cleanup...');
  
  try {
    // Clean up test artifacts
    const testResultsDir = path.join(__dirname, '..', 'test-results');
    const playwrightReportDir = path.join(__dirname, '..', 'playwright-report');
    
    // Create test results summary
    const summaryFile = path.join(testResultsDir, 'test-summary.txt');
    const timestamp = new Date().toISOString();
    const summary = `
KrishiSethu E2E Test Run Summary
================================
Timestamp: ${timestamp}
Test Environment: ${process.env.NODE_ENV || 'development'}
Base URL: ${process.env.BASE_URL || 'http://localhost:3001'}
Browser: Multiple (Chromium, Firefox, WebKit)
Test Results: Check playwright-report/index.html for detailed results

Test Categories Covered:
- Authentication & Login
- Inventory Management (CRUD operations)
- Point of Sale (POS) System
- Customer Management
- Reports & Analytics
- Mobile Responsiveness
- Performance Testing
- API Integration

For detailed results, run: npm run test:e2e:report
`;
    
    // Ensure test-results directory exists
    if (!fs.existsSync(testResultsDir)) {
      fs.mkdirSync(testResultsDir, { recursive: true });
    }
    
    fs.writeFileSync(summaryFile, summary);
    console.log('📊 Test summary created at:', summaryFile);
    
    // Log completion
    console.log('✅ Global teardown completed successfully');
    console.log('📈 View test report: npm run test:e2e:report');
    
  } catch (error) {
    console.error('❌ Global teardown failed:', error.message);
  }
}

module.exports = globalTeardown;
