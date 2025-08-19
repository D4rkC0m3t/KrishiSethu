import React, { createContext, useContext } from 'react';
import { useSettings } from '../hooks/useSettings';

/**
 * Settings Context for providing application settings throughout the app
 */
const SettingsContext = createContext();

/**
 * Settings Provider Component
 */
export const SettingsProvider = ({ children }) => {
  const settingsData = useSettings();

  return (
    <SettingsContext.Provider value={settingsData}>
      {children}
    </SettingsContext.Provider>
  );
};

/**
 * Hook to use settings context
 */
export const useSettingsContext = () => {
  const context = useContext(SettingsContext);
  if (!context) {
    throw new Error('useSettingsContext must be used within a SettingsProvider');
  }
  return context;
};

export default SettingsContext;
