import { ReactNativeLDClient } from '@launchdarkly/react-native-client-sdk';
import React, { createContext, useContext, useState, ReactNode } from 'react';

interface FeatureFlaggingContextType {
  counter: number;
  setCounter: React.Dispatch<React.SetStateAction<number>>
  
  ldClient: ReactNativeLDClient | undefined;
  setLdClient: React.Dispatch<React.SetStateAction<ReactNativeLDClient | undefined>>
}

const FeatureFlaggingContext = createContext<FeatureFlaggingContextType | undefined>(undefined);

interface FeatureFlaggingProviderProps {
  children: ReactNode;
}

export const FeatureFlaggingProvider: React.FC<FeatureFlaggingProviderProps> = ({ children }) => {
  const [counter, setCounter] = useState(0);
  const [ldClient, setLdClient] = useState<ReactNativeLDClient | undefined>(undefined);

  return (
    <FeatureFlaggingContext.Provider value={{ counter, setCounter, ldClient, setLdClient }}>
      {children}
    </FeatureFlaggingContext.Provider>
  );
};

export const useFeatureFlagging = () => {
  const context = useContext(FeatureFlaggingContext);
  if (context === undefined) {
    throw new Error('useFeatureFlagging must be used within a FeatureFlaggingProvider');
  }
  return context;
}; 