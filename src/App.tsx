import React, { useState } from 'react';
import HomeScreen from './components/screens/HomeScreen';
import ExploreScreen from './components/screens/ExploreScreen';
import CreateScreen from './components/screens/CreateScreen';
import FavoritesScreen from './components/screens/FavoritesScreen';
import ProfileScreen from './components/screens/ProfileScreen';
import NavigationTabs from './components/NavigationTabs';
import UnifiedSessionWorld from './components/UnifiedSessionWorld';
import { GameStateProvider } from './components/GameStateManager';
import EgoStatesModal from './components/modals/EgoStatesModal';
import ToastManager from './components/layout/ToastManager';
import { useAppStore } from './state/appStore';
import './styles/glass.css';
import { TabId } from './types/Navigation';

type AppMode = 'navigation' | 'session';

function App() {
  const { activeEgoState, setActiveEgoState } = useAppStore();
  const [currentMode, setCurrentMode] = useState<AppMode>('navigation');
  const [activeTab, setActiveTab] = useState<TabId>('home');
  const [selectedAction, setSelectedAction] = useState<any>(null);
  const [sessionConfig, setSessionConfig] = useState<any>(null);

  const handleOrbTap = () => {
    // Start session with current ego state
    setSessionConfig({
      egoState: activeEgoState,
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
      egoState: activeEgoState,
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
      egoState: activeEgoState,
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
            selectedEgoState={activeEgoState}
            onEgoStateChange={setActiveEgoState}
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
            selectedEgoState={activeEgoState}
            onEgoStateChange={setActiveEgoState}
          />
        );
      default:
        return (
          <HomeScreen
            selectedEgoState={activeEgoState}
            onEgoStateChange={setActiveEgoState}
            onOrbTap={handleOrbTap}
            selectedAction={selectedAction}
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
      <div className="h-screen w-screen bg-black flex flex-col overflow-hidden">
        {/* Main Content - Takes remaining space above navigation */}
        <div className="flex-1 min-h-0 flex flex-col">
          {renderCurrentTab()}
        </div>
        
        {/* Bottom Navigation Tabs - Fixed at bottom */}
        <div className="flex-shrink-0">
          <NavigationTabs
            activeTab={activeTab}
            onTabChange={setActiveTab}
          />
        </div>
        
        {/* Global Modals */}
        <EgoStatesModal />
        
        {/* Toast Notifications */}
        <ToastManager />
      </div>
    </GameStateProvider>
  );
}

export default App;
