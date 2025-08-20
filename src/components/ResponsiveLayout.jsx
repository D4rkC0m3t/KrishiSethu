import React, { useState, useEffect } from 'react';
import { useAuth } from '../contexts/AuthContext';
import MobileNavigation from './MobileNavigation';
import PWAInstallPrompt from './PWAInstallPrompt';

const ResponsiveLayout = ({ children, currentPage, onNavigate, alerts = [] }) => {
  const { currentUser } = useAuth();
  const [isMobile, setIsMobile] = useState(false);
  const [isTablet, setIsTablet] = useState(false);
  const [orientation, setOrientation] = useState('portrait');
  const [viewportHeight, setViewportHeight] = useState(window.innerHeight);

  useEffect(() => {
    const checkDeviceType = () => {
      const width = window.innerWidth;
      const height = window.innerHeight;
      
      setIsMobile(width <= 768);
      setIsTablet(width > 768 && width <= 1024);
      setOrientation(width > height ? 'landscape' : 'portrait');
      setViewportHeight(height);
    };

    const handleResize = () => {
      checkDeviceType();
      
      // Handle viewport height changes (mobile keyboard, etc.)
      const newHeight = window.innerHeight;
      setViewportHeight(newHeight);
      
      // Update CSS custom property for mobile viewport height
      document.documentElement.style.setProperty('--vh', `${newHeight * 0.01}px`);
    };

    const handleOrientationChange = () => {
      // Delay to allow for orientation change to complete
      setTimeout(checkDeviceType, 100);
    };

    // Initial check
    checkDeviceType();
    document.documentElement.style.setProperty('--vh', `${viewportHeight * 0.01}px`);

    window.addEventListener('resize', handleResize);
    window.addEventListener('orientationchange', handleOrientationChange);

    return () => {
      window.removeEventListener('resize', handleResize);
      window.removeEventListener('orientationchange', handleOrientationChange);
    };
  }, [viewportHeight]);

  // Add responsive classes to body
  useEffect(() => {
    const body = document.body;
    
    // Remove existing classes
    body.classList.remove('mobile', 'tablet', 'desktop', 'portrait', 'landscape');
    
    // Add current device classes
    if (isMobile) {
      body.classList.add('mobile');
    } else if (isTablet) {
      body.classList.add('tablet');
    } else {
      body.classList.add('desktop');
    }
    
    body.classList.add(orientation);
    
    return () => {
      body.classList.remove('mobile', 'tablet', 'desktop', 'portrait', 'landscape');
    };
  }, [isMobile, isTablet, orientation]);

  // Handle safe area insets for devices with notches
  useEffect(() => {
    const updateSafeAreaInsets = () => {
      const computedStyle = getComputedStyle(document.documentElement);
      const safeAreaTop = computedStyle.getPropertyValue('--safe-area-inset-top') || '0px';
      const safeAreaBottom = computedStyle.getPropertyValue('--safe-area-inset-bottom') || '0px';
      
      document.documentElement.style.setProperty('--safe-area-top', safeAreaTop);
      document.documentElement.style.setProperty('--safe-area-bottom', safeAreaBottom);
    };

    updateSafeAreaInsets();
    window.addEventListener('resize', updateSafeAreaInsets);
    
    return () => {
      window.removeEventListener('resize', updateSafeAreaInsets);
    };
  }, []);

  const layoutClasses = `
    min-h-screen
    ${isMobile ? 'mobile-layout' : ''}
    ${isTablet ? 'tablet-layout' : ''}
    ${orientation === 'landscape' && isMobile ? 'mobile-landscape' : ''}
  `;

  const contentClasses = `
    ${isMobile ? 'pb-16 pt-10' : ''} // Space for mobile navigation
    ${isTablet ? 'px-4' : ''}
    transition-all duration-300 ease-in-out
  `;

  return (
    <div className={layoutClasses}>
      {/* Mobile Navigation */}
      {isMobile && (
        <MobileNavigation
          currentPage={currentPage}
          onNavigate={onNavigate}
          alerts={alerts}
        />
      )}

      {/* Main Content */}
      <main className={contentClasses}>
        {children}
      </main>

      {/* PWA Install Prompt */}
      <PWAInstallPrompt />

      {/* Mobile-specific styles */}
      <style>{`
        /* Mobile viewport height fix */
        .mobile-layout {
          min-height: calc(var(--vh, 1vh) * 100);
        }

        /* Safe area support */
        .mobile-layout {
          padding-top: env(safe-area-inset-top);
          padding-bottom: env(safe-area-inset-bottom);
        }

        /* Touch-friendly interactions */
        .mobile button,
        .mobile .clickable {
          min-height: 44px;
          min-width: 44px;
        }

        /* Improved scrolling on mobile */
        .mobile {
          -webkit-overflow-scrolling: touch;
          scroll-behavior: smooth;
        }

        /* Prevent zoom on input focus */
        .mobile input,
        .mobile select,
        .mobile textarea {
          font-size: 16px;
        }

        /* Hide scrollbars on mobile for cleaner look */
        .mobile::-webkit-scrollbar {
          display: none;
        }

        /* Landscape mobile adjustments */
        .mobile-landscape {
          --mobile-nav-height: 50px;
        }

        .mobile-landscape .mobile-nav {
          height: var(--mobile-nav-height);
        }

        /* Tablet-specific styles */
        .tablet-layout {
          padding: 0 1rem;
        }

        .tablet-layout .sidebar {
          width: 200px;
        }

        /* High DPI display optimizations */
        @media (-webkit-min-device-pixel-ratio: 2), (min-resolution: 192dpi) {
          .mobile img,
          .mobile .icon {
            image-rendering: -webkit-optimize-contrast;
            image-rendering: crisp-edges;
          }
        }

        /* Dark mode support for mobile */
        @media (prefers-color-scheme: dark) {
          .mobile-layout {
            background-color: #1a1a1a;
            color: #ffffff;
          }
        }

        /* Reduced motion support */
        @media (prefers-reduced-motion: reduce) {
          .mobile-layout * {
            animation-duration: 0.01ms !important;
            animation-iteration-count: 1 !important;
            transition-duration: 0.01ms !important;
          }
        }

        /* Focus styles for accessibility */
        .mobile button:focus,
        .mobile input:focus,
        .mobile select:focus {
          outline: 2px solid #3b82f6;
          outline-offset: 2px;
        }

        /* Improved tap targets */
        .mobile .tap-target {
          position: relative;
        }

        .mobile .tap-target::after {
          content: '';
          position: absolute;
          top: -10px;
          left: -10px;
          right: -10px;
          bottom: -10px;
          z-index: -1;
        }

        /* Card responsiveness */
        .mobile .card {
          margin: 0.5rem;
          border-radius: 12px;
          box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
        }

        /* Table responsiveness */
        .mobile .table-container {
          overflow-x: auto;
          -webkit-overflow-scrolling: touch;
        }

        .mobile table {
          min-width: 600px;
        }

        /* Form improvements */
        .mobile .form-group {
          margin-bottom: 1rem;
        }

        .mobile .form-row {
          display: flex;
          flex-direction: column;
          gap: 1rem;
        }

        .tablet .form-row {
          flex-direction: row;
        }

        /* Modal adjustments */
        .mobile .modal {
          margin: 1rem;
          max-height: calc(100vh - 2rem);
          overflow-y: auto;
        }

        /* Navigation improvements */
        .mobile .nav-item {
          padding: 0.75rem 1rem;
          border-radius: 8px;
          margin: 0.25rem 0;
        }

        /* Loading states */
        .mobile .loading {
          display: flex;
          justify-content: center;
          align-items: center;
          min-height: 200px;
        }

        /* Error states */
        .mobile .error-state {
          text-align: center;
          padding: 2rem 1rem;
        }

        /* Empty states */
        .mobile .empty-state {
          text-align: center;
          padding: 3rem 1rem;
        }

        /* Swipe gestures support */
        .mobile .swipeable {
          touch-action: pan-x;
        }

        /* Pull to refresh indicator */
        .mobile .pull-to-refresh {
          position: fixed;
          top: 0;
          left: 50%;
          transform: translateX(-50%);
          z-index: 1000;
          background: white;
          border-radius: 0 0 12px 12px;
          padding: 0.5rem 1rem;
          box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
          transition: transform 0.3s ease;
        }

        /* Floating action button */
        .mobile .fab {
          position: fixed;
          bottom: 80px;
          right: 1rem;
          z-index: 40;
          width: 56px;
          height: 56px;
          border-radius: 50%;
          box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
        }

        /* Toast notifications */
        .mobile .toast {
          position: fixed;
          bottom: 100px;
          left: 1rem;
          right: 1rem;
          z-index: 50;
          border-radius: 8px;
          padding: 1rem;
          box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
        }
      `}</style>
    </div>
  );
};

export default ResponsiveLayout;
