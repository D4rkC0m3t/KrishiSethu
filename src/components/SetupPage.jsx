import React from 'react';
import DatabaseSetup from './DatabaseSetup';

const SetupPage = () => {
  return (
    <div className="min-h-screen bg-gray-50 py-12">
      <div className="max-w-4xl mx-auto px-4">
        <div className="text-center mb-8">
          <h1 className="text-4xl font-bold text-gray-900 mb-4">
            🔥 Firebase Database Setup
          </h1>
          <p className="text-xl text-gray-600">
            Initialize your inventory management system with sample data
          </p>
        </div>
        
        <DatabaseSetup />
        
        <div className="mt-8 text-center">
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-6">
            <h3 className="text-lg font-semibold text-blue-900 mb-2">
              🚨 Important: Firebase Security Rules
            </h3>
            <p className="text-blue-800 mb-4">
              If you get permission errors, you need to temporarily update your Firestore security rules:
            </p>
            <div className="bg-white border rounded p-4 text-left">
              <p className="text-sm font-mono text-gray-700 mb-2">
                Go to Firebase Console → Firestore → Rules and replace with:
              </p>
              <pre className="text-xs bg-gray-100 p-2 rounded overflow-x-auto">
{`rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    match /{document=**} {
      allow read, write: if true;
    }
  }
}`}
              </pre>
              <p className="text-sm text-red-600 mt-2">
                ⚠️ Remember to restore secure rules after setup!
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default SetupPage;
