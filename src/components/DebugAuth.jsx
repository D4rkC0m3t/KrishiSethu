import React from 'react';
import { useAuth } from '../contexts/AuthContext';

const DebugAuth = () => {
  const { 
    currentUser, 
    userProfile, 
    loading, 
    dbStatus, 
    hasFullAccess, 
    isTrialActive 
  } = useAuth();

  return (
    <div className="fixed top-4 right-4 bg-gray-800 text-white p-4 rounded-lg shadow-lg max-w-sm z-50">
      <h3 className="font-bold text-sm mb-2">🔍 Auth Debug</h3>
      <div className="text-xs space-y-1">
        <div>
          <strong>Loading:</strong> 
          <span className={loading ? 'text-yellow-400' : 'text-green-400'}>
            {loading ? ' ⏳ Yes' : ' ✅ No'}
          </span>
        </div>
        <div>
          <strong>DB Status:</strong> 
          <span className={
            dbStatus === 'healthy' ? 'text-green-400' : 
            dbStatus === 'degraded' ? 'text-yellow-400' : 'text-red-400'
          }>
            {dbStatus === 'healthy' ? ' ✅' : dbStatus === 'degraded' ? ' ⚠️' : ' ❌'} {dbStatus}
          </span>
        </div>
        <div>
          <strong>Current User:</strong> 
          <span className={currentUser ? 'text-green-400' : 'text-red-400'}>
            {currentUser ? ` ✅ ${currentUser.email}` : ' ❌ None'}
          </span>
        </div>
        <div>
          <strong>User Profile:</strong> 
          <span className={userProfile ? 'text-green-400' : 'text-red-400'}>
            {userProfile ? ` ✅ ${userProfile.role || userProfile.account_type}` : ' ❌ None'}
          </span>
        </div>
        <div>
          <strong>Full Access:</strong> 
          <span className={hasFullAccess() ? 'text-green-400' : 'text-red-400'}>
            {hasFullAccess() ? ' ✅ Yes' : ' ❌ No'}
          </span>
        </div>
        <div>
          <strong>Trial Active:</strong> 
          <span className={isTrialActive() ? 'text-green-400' : 'text-red-400'}>
            {isTrialActive() ? ' ✅ Yes' : ' ❌ No'}
          </span>
        </div>
        {userProfile && (
          <div className="mt-2 pt-2 border-t border-gray-600">
            <div className="text-xs">
              <strong>Profile Details:</strong>
              <pre className="text-xs mt-1 bg-gray-900 p-1 rounded">
                {JSON.stringify({
                  role: userProfile.role,
                  account_type: userProfile.account_type,
                  is_active: userProfile.is_active,
                  is_paid: userProfile.is_paid,
                  trial_end: userProfile.trial_end_date || userProfile.trial_end
                }, null, 2)}
              </pre>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default DebugAuth;