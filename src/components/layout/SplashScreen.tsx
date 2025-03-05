// src/components/layout/SplashScreen.tsx

import React from 'react';
import { Box } from "@mantine/core";
import { useViewportSize } from '@mantine/hooks';
import EnhancedSplashScreen from './EnhancedSplashScreen';

interface SplashScreenProps {
  visible: boolean;
  user: any;
  loading: boolean;
  onLogin: () => void;
  onEnterLobby: () => void;
}

const SplashScreen = ({ visible, user, loading, onLogin, onEnterLobby }: SplashScreenProps) => {
  const { height } = useViewportSize();

  // Function to handle entering the lobby
  const handleEnterLobby = () => {
    // Call the direct toggle function first
    onEnterLobby();
    
    // Also scroll down for visual effect
    window.scrollTo({
      top: height,
      behavior: 'smooth'
    });
  };

  return (
    <EnhancedSplashScreen 
      visible={visible}
      user={user}
      loading={loading}
      onLogin={onLogin}
      onEnterLobby={handleEnterLobby}
    />
  );
};

export default SplashScreen;