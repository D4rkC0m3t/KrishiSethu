// Suppress WebSocket connection errors in development
(function() {
  'use strict';
  
  // Only run in development (check if we're on localhost)
  if (window.location.hostname !== 'localhost' && window.location.hostname !== '127.0.0.1') {
    return;
  }
  
  // Store original console methods
  const originalError = console.error;
  const originalWarn = console.warn;
  
  // List of WebSocket error patterns to suppress
  const suppressPatterns = [
    /WebSocket connection to.*failed/i,
    /WebSocket.*ws.*failed/i,
    /Failed to connect to WebSocket/i,
    /WebSocket.*connection.*refused/i
  ];
  
  // Override console.error to filter WebSocket errors
  console.error = function(...args) {
    const message = args.join(' ');
    
    // Check if this is a WebSocket error we want to suppress
    const shouldSuppress = suppressPatterns.some(pattern => 
      pattern.test(message)
    );
    
    if (!shouldSuppress) {
      originalError.apply(console, args);
    }
  };
  
  // Override console.warn for WebSocket warnings
  console.warn = function(...args) {
    const message = args.join(' ');
    
    // Check if this is a WebSocket warning we want to suppress
    const shouldSuppress = suppressPatterns.some(pattern => 
      pattern.test(message)
    );
    
    if (!shouldSuppress) {
      originalWarn.apply(console, args);
    }
  };
  
  // Suppress WebSocket errors at the window level
  window.addEventListener('error', function(event) {
    if (event.message && suppressPatterns.some(pattern => pattern.test(event.message))) {
      event.preventDefault();
      return false;
    }
  });
  
  // Suppress unhandled promise rejections related to WebSocket
  window.addEventListener('unhandledrejection', function(event) {
    if (event.reason && typeof event.reason === 'string') {
      if (suppressPatterns.some(pattern => pattern.test(event.reason))) {
        event.preventDefault();
        return false;
      }
    }
  });
  
  console.log('🔇 WebSocket error suppression active for development');
})();
