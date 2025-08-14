import React from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from './ui/card';
import { Button } from './ui/button';
import { AlertTriangle, RefreshCw, Home } from 'lucide-react';

/**
 * Error Boundary Component for catching and handling React errors
 */
class ErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = { 
      hasError: false, 
      error: null, 
      errorInfo: null,
      errorId: null
    };
  }

  static getDerivedStateFromError(error) {
    // Update state so the next render will show the fallback UI
    return { 
      hasError: true,
      errorId: Date.now().toString()
    };
  }

  componentDidCatch(error, errorInfo) {
    // Log error details
    console.error('ErrorBoundary caught an error:', error, errorInfo);
    
    this.setState({
      error: error,
      errorInfo: errorInfo
    });

    // Report error to monitoring service (if available)
    if (window.gtag) {
      window.gtag('event', 'exception', {
        description: error.toString(),
        fatal: false
      });
    }
  }

  handleRetry = () => {
    this.setState({ 
      hasError: false, 
      error: null, 
      errorInfo: null,
      errorId: null
    });
  };

  handleGoHome = () => {
    if (this.props.onNavigate) {
      this.props.onNavigate('dashboard');
    } else {
      window.location.href = '/';
    }
  };

  render() {
    if (this.state.hasError) {
      // Custom error UI
      return (
        <div className="min-h-screen flex items-center justify-center bg-background p-4">
          <Card className="w-full max-w-2xl">
            <CardHeader className="text-center">
              <div className="flex justify-center mb-4">
                <AlertTriangle className="h-16 w-16 text-red-500" />
              </div>
              <CardTitle className="text-2xl text-red-600">
                Oops! Something went wrong
              </CardTitle>
              <CardDescription className="text-lg">
                We encountered an unexpected error. Don't worry, your data is safe.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              {/* Error Details (only in development) */}
              {process.env.NODE_ENV === 'development' && this.state.error && (
                <div className="bg-gray-100 p-4 rounded-md">
                  <h4 className="font-semibold text-sm mb-2">Error Details (Development Mode):</h4>
                  <pre className="text-xs text-red-600 overflow-auto max-h-32">
                    {this.state.error.toString()}
                  </pre>
                  {this.state.errorInfo && (
                    <pre className="text-xs text-gray-600 overflow-auto max-h-32 mt-2">
                      {this.state.errorInfo.componentStack}
                    </pre>
                  )}
                </div>
              )}

              {/* Error ID for support */}
              <div className="bg-blue-50 p-3 rounded-md">
                <p className="text-sm text-blue-800">
                  <strong>Error ID:</strong> {this.state.errorId}
                </p>
                <p className="text-xs text-blue-600 mt-1">
                  Please include this ID when reporting the issue to support.
                </p>
              </div>

              {/* Action Buttons */}
              <div className="flex flex-col sm:flex-row gap-3 justify-center">
                <Button onClick={this.handleRetry} className="flex items-center">
                  <RefreshCw className="h-4 w-4 mr-2" />
                  Try Again
                </Button>
                <Button variant="outline" onClick={this.handleGoHome} className="flex items-center">
                  <Home className="h-4 w-4 mr-2" />
                  Go to Dashboard
                </Button>
              </div>

              {/* Help Text */}
              <div className="text-center text-sm text-gray-600">
                <p>If this problem persists, please:</p>
                <ul className="list-disc list-inside mt-2 space-y-1">
                  <li>Refresh the page</li>
                  <li>Clear your browser cache</li>
                  <li>Contact support with the Error ID above</li>
                </ul>
              </div>
            </CardContent>
          </Card>
        </div>
      );
    }

    return this.props.children;
  }
}

/**
 * Higher-order component to wrap components with error boundary
 * @param {React.Component} Component - Component to wrap
 * @param {object} errorBoundaryProps - Props for error boundary
 * @returns {React.Component} Wrapped component
 */
export const withErrorBoundary = (Component, errorBoundaryProps = {}) => {
  return function WrappedComponent(props) {
    return (
      <ErrorBoundary {...errorBoundaryProps}>
        <Component {...props} />
      </ErrorBoundary>
    );
  };
};

/**
 * Hook for error handling in functional components
 * @returns {Function} Error handler function
 */
export const useErrorHandler = () => {
  const handleError = React.useCallback((error, errorInfo = {}) => {
    console.error('Error caught by useErrorHandler:', error, errorInfo);
    
    // Report to monitoring service
    if (window.gtag) {
      window.gtag('event', 'exception', {
        description: error.toString(),
        fatal: false
      });
    }

    // You could also trigger a toast notification here
    // or update a global error state
  }, []);

  return handleError;
};

/**
 * Async error boundary hook for handling promise rejections
 * @returns {Function} Async error handler
 */
export const useAsyncErrorHandler = () => {
  const handleError = useErrorHandler();

  const handleAsyncError = React.useCallback(async (asyncFunction) => {
    try {
      return await asyncFunction();
    } catch (error) {
      handleError(error, { type: 'async' });
      throw error; // Re-throw so calling code can handle it
    }
  }, [handleError]);

  return handleAsyncError;
};

export default ErrorBoundary;
