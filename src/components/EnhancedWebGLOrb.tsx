import React, { useState } from 'react';
import HomeScreen from './components/screens/HomeScreen';
import ExploreScreen from './components/screens/ExploreScreen';
import CreateScreen from './components/screens/CreateScreen';
import FavoritesScreen from './components/screens/FavoritesScreen';
import ProfileScreen from './components/screens/ProfileScreen';
import NavigationTabs from './components/NavigationTabs';
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

  // Render current tab content
  const renderCurrentTab = () => {
    switch (activeTab) {
      case 'home':
        return (
          <HomeScreen
            selectedEgoState={selectedEgoState}
            onEgoStateChange={setSelectedEgoState}
            onOrbTap={handleOrbTap}
            onActionSelect={handleActionSelect}
            activeTab={activeTab}
            onTabChange={setActiveTab}
          />
        );
      case 'explore':
        return <ExploreScreen onProtocolSelect={handleProtocolSelect} />;
      case 'create':
        return <CreateScreen onProtocolCreate={handleCustomProtocolCreate} />;
      case 'favorites':
        return <FavoritesScreen onSessionSelect={handleFavoriteSessionSelect} />;
      case 'profile':
        return (
          <ProfileScreen 
            selectedEgoState={selectedEgoState}
            onEgoStateChange={setSelectedEgoState}
          />
        );
      default:
        return (
          <HomeScreen
            selectedEgoState={selectedEgoState}
            onEgoStateChange={setSelectedEgoState}
            onOrbTap={handleOrbTap}
            onActionSelect={handleActionSelect}
            activeTab={activeTab}
            onTabChange={setActiveTab}
        );
    }
  };

  // Navigation mode - tabbed interface
  return (
    <GameStateProvider>
      <div className="relative h-screen w-screen overflow-hidden bg-black">
        <div className="flex h-full flex-col">
          {/* Content region */}
          <div className="flex-1 min-h-0 overflow-hidden">
            {renderCurrentTab()}
          </div>
          
          {/* Bottom Navigation */}
          <div className="flex-shrink-0 pb-[env(safe-area-inset-bottom)]">
            <NavigationTabs
              activeTab={activeTab}
              onTabChange={setActiveTab}
            />
          </div>
        </div>
      </div>
    </GameStateProvider>
  );
}

export default App;