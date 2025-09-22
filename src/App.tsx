import React, { useState } from 'react';
import HomePage from './components/HomePage';
import SessionView from './components/SessionView';
import { GameStateProvider } from './components/GameStateManager';

type AppMode = 'home' | 'session';

function AppContent() {
  const [currentMode, setCurrentMode] = useState<AppMode>('home');

  const handleOrbTap = () => {
    setCurrentMode('session');
  };

  const handleSessionComplete = () => {
    setCurrentMode('home');
  };

  const handleCancel = () => {
    setCurrentMode('home');
  };

  // Single source of truth - only one mode mounts at a time
  if (currentMode === 'home') {
    return <HomePage onOrbTap={handleOrbTap} />;
  }

  if (currentMode === 'session') {
    return (
      <SessionView 
        onComplete={handleSessionComplete}
        onCancel={handleCancel}
      />
    );
  }

  return null;
}

function App() {
  return (
    <GameStateProvider>
      <AppContent />
    </GameStateProvider>
  );
}

export default App;