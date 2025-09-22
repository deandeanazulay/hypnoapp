import React, { useState } from 'react';
import NavigationTabs from './components/NavigationTabs';
import HomeScreen from './components/screens/HomeScreen';
import ExploreScreen from './components/screens/ExploreScreen';
import CreateScreen from './components/screens/CreateScreen';
import FavoritesScreen from './components/screens/FavoritesScreen';
import ProfileScreen from './components/screens/ProfileScreen';
import UnifiedSessionWorld from './components/UnifiedSessionWorld';
import { GameStateProvider } from './components/GameStateManager';
import { TabId } from './types/Navigation';
import { EGO_STATES } from './types/EgoState';

type AppMode = 'navigation' | 'session';

function AppContent() {
  const [currentMode, setCurrentMode] = useState<AppMode>('navigation');
  const [activeTab, setActiveTab] = useState<TabId>('home');
  const [selectedEgoState, setSelectedEgoState] = useState('guardian');
  const [sessionConfig, setSessionConfig] = useState<any>(null);

  const handleOrbTap = () => {
    // Start session with current ego state
    setSessionConfig({
      egoState: selectedEgoState,
      action: null,
      type: 'unified'
    });
    setCurrentMode('session');
  };

  const handleActionSelect = (action: any) => {
    // Start session with specific action + ego state
    setSessionConfig({
      egoState: selectedEgoState,
      action: action,
      type: 'unified'
    });
    setCurrentMode('session');
  };

  const handleProtocolSelect = (protocol: any) => {
    // Start session with specific protocol
    setSessionConfig({
      egoState: selectedEgoState,
      protocol: protocol,
      type: 'protocol'
    });
    setCurrentMode('session');
  };

  const handleCustomProtocolCreate = (protocol: any) => {
    // Save and optionally start custom protocol
    console.log('Custom protocol created:', protocol);
    // In real app, save to localStorage or API
  };

  const handleSessionComplete = () => {
    setCurrentMode('navigation');
    setSessionConfig(null);
  };

  const handleCancel = () => {
    setCurrentMode('navigation');
    setSessionConfig(null);
  };

  const handleFavoriteSessionSelect = (session: any) => {
    // Start favorited session
    setSessionConfig({
      egoState: session.egoState,
      action: session.action,
      type: 'favorite',
      session: session
    });
    setCurrentMode('session');
  };

  // Session mode - full screen wizard
  if (currentMode === 'session') {
  }
}

export default App;