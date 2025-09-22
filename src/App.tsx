import React, { useState } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import AppShell from './layouts/AppShell';
import HomeScreen from './components/screens/HomeScreen';
import Explore from './pages/Explore';
import Create from './pages/Create';
import Favorites from './pages/Favorites';
import Profile from './pages/Profile';
import UnifiedSessionWorld from './components/UnifiedSessionWorld';
import { GameStateProvider } from './components/GameStateManager';
import { TabId } from './types/Navigation';

type AppMode = 'navigation' | 'session';

function App() {
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
    return (
      <GameStateProvider>
        <UnifiedSessionWorld 
          onComplete={handleSessionComplete}
          onCancel={handleCancel}
          sessionConfig={sessionConfig}
        />
      </GameStateProvider>
    );
  }

  // Navigation mode - tabbed interface
  return (
    <GameStateProvider>
      <Router>
        <AppShell activeTab={activeTab} onTabChange={setActiveTab}>
          <Routes>
            <Route path="/" element={<Navigate to="/home" replace />} />
            <Route 
              path="/home" 
              element={
                <HomeScreen
                  selectedEgoState={selectedEgoState}
                  onEgoStateChange={setSelectedEgoState}
                  onOrbTap={handleOrbTap}
                  onActionSelect={handleActionSelect}
                  activeTab={activeTab}
                  onTabChange={setActiveTab}
                />
              } 
            />
            <Route 
              path="/explore" 
              element={<Explore onProtocolSelect={handleProtocolSelect} />} 
            />
            <Route 
              path="/create" 
              element={<Create onProtocolCreate={handleCustomProtocolCreate} />} 
            />
            <Route 
              path="/favorites" 
              element={<Favorites onSessionSelect={handleFavoriteSessionSelect} />} 
            />
            <Route 
              path="/profile" 
              element={
                <Profile 
                  selectedEgoState={selectedEgoState}
                  onEgoStateChange={setSelectedEgoState}
                />
              } 
            />
          </Routes>
        </AppShell>
      </Router>
    </GameStateProvider>
  );
}

export default App;