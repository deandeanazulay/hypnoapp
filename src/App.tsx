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
  const [selectedAction, setSelectedAction] = useState<any>(null);
  const [sessionConfig, setSessionConfig] = useState<any>(null);

  const handleOrbTap = () => {
    // Start session with current ego state
    setSessionConfig({
      egoState: selectedEgoState,
      action: selectedAction, // Pass the selected action from HomeScreen
      type: 'unified'
    });
    setCurrentMode('session');
  };

  const handleActionSelect = (action: any) => {
    setSelectedAction(action);
  };

  const handleProtocolSelect = (protocol: any) => {
    // Start session with current ego state and any selected action
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
            activeTab={activeTab}
            onTabChange={setActiveTab}
            selectedAction={selectedAction}
            onActionSelect={handleActionSelect}
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
          />
        );
    }
  };

  // Navigation mode - tabbed interface
  return (
    <GameStateProvider>
      <div className="h-screen w-screen bg-black flex flex-col">
        {/* Main Body Content */}
        <div className="flex h-full flex-col">
          {renderCurrentTab()}
        </div>
        
        {/* Bottom Navigation Tabs */}
        <div className="flex-shrink-0">
          <NavigationTabs
            activeTab={activeTab}
            onTabChange={setActiveTab}
          />
        </div>
      </div>
    </GameStateProvider>
  );
}

export default App;