import React from 'react';
import { SettingsProvider } from './contexts/SettingsContext';
import App from './App';
import './index.css';

// Preview component for the Inventory Management Dashboard
const InventoryDashboardPreview = () => {
  return (
    <div className="min-h-screen bg-gray-50">
      <SettingsProvider>
        <App />
      </SettingsProvider>
    </div>
  );
};

export default InventoryDashboardPreview;