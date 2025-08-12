import React from 'react';
import { useAuth } from '../contexts/AuthContext';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from './ui/card';
import { Button } from './ui/button';

const ProtectedRoute = ({ children, requiredRole = null, fallback = null }) => {
  const { currentUser, userProfile, hasPermission, logout } = useAuth();

  // If user is not authenticated
  if (!currentUser) {
    return fallback || (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <Card className="w-full max-w-md">
          <CardHeader>
            <CardTitle className="text-center text-red-600">Access Denied</CardTitle>
            <CardDescription className="text-center">
              You must be logged in to access this page
            </CardDescription>
          </CardHeader>
          <CardContent className="text-center">
            <Button onClick={() => window.location.reload()}>
              Go to Login
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  // If specific role is required and user doesn't have permission
  if (requiredRole && !hasPermission(requiredRole)) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <Card className="w-full max-w-md">
          <CardHeader>
            <CardTitle className="text-center text-red-600">Insufficient Permissions</CardTitle>
            <CardDescription className="text-center">
              You don't have permission to access this feature
            </CardDescription>
          </CardHeader>
          <CardContent className="text-center space-y-4">
            <p className="text-sm text-gray-600">
              Required role: <span className="font-medium">{requiredRole}</span><br/>
              Your role: <span className="font-medium">{userProfile?.role}</span>
            </p>
            <div className="flex space-x-2 justify-center">
              <Button variant="outline" onClick={() => window.history.back()}>
                Go Back
              </Button>
              <Button variant="outline" onClick={logout}>
                Logout
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  // User has access
  return children;
};

export default ProtectedRoute;
