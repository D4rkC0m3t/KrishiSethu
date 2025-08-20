/**
 * Authentication and Role Testing Utilities
 * Use these functions to test the role and trial access fixes
 */

// Mock user profiles for testing
export const mockUsers = {
  admin: {
    id: 'admin-123',
    email: 'admin@krishisethu.com',
    name: 'System Administrator',
    account_type: 'admin',
    role: 'admin',
    is_active: true,
    is_paid: true,
    trial_start: new Date('2024-01-01'),
    trial_end: new Date('2025-12-31'),
    created_at: new Date('2024-01-01')
  },
  
  activeTrialUser: {
    id: 'trial-123',
    email: 'trial@example.com',
    name: 'Trial User',
    account_type: 'trial',
    is_active: true,
    is_paid: false,
    trial_start: new Date(),
    trial_end: new Date(Date.now() + 25 * 24 * 60 * 60 * 1000), // 25 days from now
    created_at: new Date()
  },
  
  expiredTrialUser: {
    id: 'expired-123',
    email: 'expired@example.com',
    name: 'Expired Trial User',
    account_type: 'trial',
    is_active: false,
    is_paid: false,
    trial_start: new Date('2024-01-01'),
    trial_end: new Date('2024-01-31'), // Expired
    created_at: new Date('2024-01-01')
  },
  
  paidUser: {
    id: 'paid-123',
    email: 'paid@example.com',
    name: 'Paid User',
    account_type: 'paid',
    is_active: true,
    is_paid: true,
    trial_start: new Date('2024-01-01'),
    trial_end: new Date('2024-01-31'),
    created_at: new Date('2024-01-01')
  }
};

// Test functions for role checking
export const testRoleAccess = (userProfile, authFunctions) => {
  const { hasPermission, isAdmin, isTrialActive, hasFullAccess } = authFunctions;
  
  console.log('🧪 Testing Role Access for:', userProfile.name);
  console.log('📧 Email:', userProfile.email);
  console.log('🏷️ Account Type:', userProfile.account_type);
  console.log('💰 Is Paid:', userProfile.is_paid);
  console.log('✅ Is Active:', userProfile.is_active);
  
  const results = {
    isAdmin: isAdmin(),
    isTrialActive: isTrialActive(),
    hasFullAccess: hasFullAccess(),
    hasPermission: hasPermission('admin')
  };
  
  console.log('🔍 Test Results:', results);
  console.log('---');
  
  return results;
};

// Test trial period validation
export const testTrialValidation = (userProfile) => {
  const now = new Date();
  const trialEnd = new Date(userProfile.trial_end);
  const daysLeft = Math.ceil((trialEnd - now) / (1000 * 60 * 60 * 24));
  
  console.log('📅 Trial Validation for:', userProfile.name);
  console.log('🗓️ Trial End:', trialEnd.toLocaleDateString());
  console.log('📊 Days Left:', daysLeft);
  console.log('⏰ Is Trial Active:', now <= trialEnd);
  console.log('💳 Is Paid:', userProfile.is_paid);
  console.log('🔓 Should Have Access:', userProfile.is_paid || (now <= trialEnd && userProfile.is_active));
  console.log('---');
  
  return {
    daysLeft,
    isTrialActive: now <= trialEnd,
    shouldHaveAccess: userProfile.is_paid || (now <= trialEnd && userProfile.is_active)
  };
};

// Expected access levels for each user type
export const expectedAccess = {
  admin: {
    shouldSeeAllMenus: true,
    shouldAccessUserManagement: true,
    shouldAccessBackupData: true,
    shouldAccessInventory: true,
    shouldAccessReports: true
  },
  
  activeTrialUser: {
    shouldSeeAllMenus: true,
    shouldAccessUserManagement: true,
    shouldAccessBackupData: true,
    shouldAccessInventory: true,
    shouldAccessReports: true
  },
  
  expiredTrialUser: {
    shouldSeeAllMenus: false,
    shouldAccessUserManagement: false,
    shouldAccessBackupData: false,
    shouldAccessInventory: false,
    shouldAccessReports: false
  },
  
  paidUser: {
    shouldSeeAllMenus: true,
    shouldAccessUserManagement: true,
    shouldAccessBackupData: true,
    shouldAccessInventory: true,
    shouldAccessReports: true
  }
};

// Console test runner
export const runAllTests = (authFunctions) => {
  console.log('🚀 Running Authentication & Role Access Tests');
  console.log('='.repeat(50));
  
  Object.entries(mockUsers).forEach(([userType, userProfile]) => {
    console.log(`\n🧪 Testing ${userType.toUpperCase()}`);
    
    // Mock the userProfile in authFunctions context
    const mockAuthFunctions = {
      ...authFunctions,
      userProfile
    };
    
    const roleResults = testRoleAccess(userProfile, mockAuthFunctions);
    const trialResults = testTrialValidation(userProfile);
    const expected = expectedAccess[userType];
    
    // Validate results
    const passed = roleResults.hasFullAccess === expected.shouldSeeAllMenus;
    console.log(`✅ Test ${passed ? 'PASSED' : 'FAILED'} for ${userType}`);
    
    if (!passed) {
      console.log('❌ Expected:', expected.shouldSeeAllMenus);
      console.log('❌ Got:', roleResults.hasFullAccess);
    }
  });
  
  console.log('\n' + '='.repeat(50));
  console.log('🏁 Tests Complete');
};

// Usage instructions
export const testInstructions = `
🧪 HOW TO TEST THE ROLE & TRIAL FIXES:

1. Open browser console in your app
2. Import the test utilities:
   import { runAllTests, mockUsers, testRoleAccess } from './utils/authTestUtils';

3. Run all tests:
   runAllTests({ hasPermission, isAdmin, isTrialActive, hasFullAccess });

4. Test individual users:
   testRoleAccess(mockUsers.admin, { hasPermission, isAdmin, isTrialActive, hasFullAccess });

5. Expected Results:
   ✅ Admin: Should have full access to all features
   ✅ Active Trial: Should have full access during trial period
   ❌ Expired Trial: Should be blocked from accessing features
   ✅ Paid User: Should have full access to all features

6. Check the sidebar menus:
   - User Management should be visible for admin and active trial users
   - Backup & Data should be visible for admin and active trial users
   - All inventory features should be accessible
`;

console.log(testInstructions);