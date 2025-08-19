import React from 'react';
import ErrorPage404 from './ErrorPage404';

class ErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = { 
      hasError: false, 
      error: null,
      errorInfo: null 
    };
  }

  static getDerivedStateFromError(error) {
    // Update state so the next render will show the fallback UI
    return { hasError: true };
  }

  componentDidCatch(error, errorInfo) {
    // Log the error to console or error reporting service
    console.error('Error Boundary caught an error:', error, errorInfo);
    
    this.setState({
      error: error,
      errorInfo: errorInfo
    });

    // You can also log the error to an error reporting service here
    // logErrorToService(error, errorInfo);
  }

  handleRetry = () => {
    // Reset the error boundary state
    this.setState({ 
      hasError: false, 
      error: null, 
      errorInfo: null 
    });
    
    // Optionally reload the page
    window.location.reload();
  };

  render() {
    if (this.state.hasError) {
      // Check if it's a network-related error
      const isNetworkError = this.state.error?.message?.includes('fetch') ||
                            this.state.error?.message?.includes('network') ||
                            this.state.error?.message?.includes('connection');

      // For network errors, don't show 404 page since we have offline sync
      // Just retry the operation or let the app continue with offline functionality
      if (isNetworkError) {
        console.warn('Network error caught by ErrorBoundary, allowing offline functionality to handle it');
        // Reset error state for network errors to allow offline functionality
        this.setState({
          hasError: false,
          error: null,
          errorInfo: null
        });
        return this.props.children;
      }

      // Only show 404 for actual application errors, not network issues
      return (
        <ErrorPage404
          type="notFound"
          onNavigate={this.props.onNavigate}
          onRetry={this.handleRetry}
        />
      );
    }

    return this.props.children;
  }
}

export default ErrorBoundary;
