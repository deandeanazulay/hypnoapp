import React, { useState } from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import LandingPage from './components/LandingPage';
import HomeScreen from './components/screens/HomeScreen';
import ExploreScreen from './components/screens/ExploreScreen';
import CreateScreen from './components/screens/CreateScreen';
import FavoritesScreen from './components/screens/FavoritesScreen';
import ProfileScreen from './components/screens/ProfileScreen';
import NavigationTabs from './components/NavigationTabs';
import UnifiedSessionWorld from './components/UnifiedSessionWorld';
import { GameStateProvider } from './components/GameStateManager';
import GlobalHUD from './components/HUD/GlobalHUD';
import EgoStatesModal from './components/modals/EgoStatesModal';
import ToastManager from './components/layout/ToastManager';
import AuthModal from './components/auth/AuthModal';
import PaymentSuccess from './components/PaymentSuccess';
import PaymentCancelled from './components/PaymentCancelled';
import { useAppStore } from './state/appStore';
import { useAuth } from './hooks/useAuth';
import './styles/glass.css';
import { TabId } from './types/Navigation';

type AppMode = 'navigation' | 'session';

function App() {
  const { activeEgoState, setActiveEgoState } = useAppStore();
  const { isAuthenticated, user: authUser, loading: authLoading } = useAuth();
  const [showLanding, setShowLanding] = useState(!isAuthenticated);
  const [currentMode, setCurrentMode] = useState<AppMode>('navigation');
  const [activeTab, setActiveTab] = useState<TabId>('home');
  const [selectedAction, setSelectedAction] = useState<any>(null);
  const [sessionConfig, setSessionConfig] = useState<any>(null);
  const [showAuthModal, setShowAuthModal] = useState(false);

  // Update landing page visibility when auth state changes
  React.useEffect(() => {
    if (!authLoading) {
      setShowLanding(!isAuthenticated);
    }
  }, [isAuthenticated, authLoading]);

  const handleEnterApp = () => {
    setShowLanding(false);
  };

  const handleShowAuth = () => {
    setShowAuthModal(true);
  };

  const handleOrbTap = () => {
    // If not authenticated, show auth modal
    if (!isAuthenticated) {
      setShowAuthModal(true);
      return;
    }

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
    // If not authenticated, show auth modal  
    if (!isAuthenticated) {
      setShowAuthModal(true);
      return;
    }

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
    // If not authenticated, show auth modal
    if (!isAuthenticated) {
      setShowAuthModal(true);
      return;
    }

    // Start favorited session
    setSessionConfig({
      egoState: activeEgoState,
      action: session.action,
      type: 'favorite',
      session: session
    });
    setCurrentMode('session');
  };

  // Show loading screen while auth is loading
  if (authLoading) {
    return (
      <div className="h-screen w-screen bg-black flex items-center justify-center">
        <div className="text-center">
          <div className="w-16 h-16 border-4 border-teal-400/20 border-t-teal-400 rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-white/60 text-sm">Loading Libero...</p>
        </div>
      </div>
    );
  }

  // Show landing page first
  if (showLanding) {
    return (
      <div style={{ height: '100vh', overflow: 'hidden' }}>
        <LandingPage
          onEnterApp={handleEnterApp}
          onShowAuth={handleShowAuth}
        />
      </div>
    );
  }

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

  const MainApp = () => (
    <GameStateProvider>
      <div className="h-screen w-screen bg-black flex flex-col overflow-hidden relative">
        {/* Global HUD - Fixed at top */}
        <div className="flex-shrink-0 relative z-50">
          <GlobalHUD onShowAuth={() => setShowAuthModal(true)} />
        </div>
        
        {/* Main Body Content - Flex grow */}
        <div className="flex-1 min-h-0 flex flex-col relative z-10 overflow-hidden">
          {/* Background Protection */}
          <div className="absolute inset-0 bg-gradient-to-br from-black via-gray-900/50 to-black pointer-events-none" />
          
          {/* Tab Content */}
          <div className="relative z-10 h-full overflow-hidden">
            {renderCurrentTab()}
          </div>
        </div>
        
        {/* Bottom Navigation - Fixed at bottom */}
        <div className="flex-shrink-0 relative z-50 safe-area-bottom">
          <NavigationTabs
            activeTab={activeTab}
            onTabChange={setActiveTab}
          />
        </div>
      </div>
      
      {/* Global Modals - Outside main structure */}
      <>
        <EgoStatesModal />
        <AuthModal 
          isOpen={showAuthModal}
          onClose={() => setShowAuthModal(false)}
        />
        
        {/* Toast Notifications */}
        <ToastManager />
      </>
    </GameStateProvider>
  );

  return (
    <Router>
      <Routes>
        <Route path="/payment-success" element={<PaymentSuccess />} />
        <Route path="/payment-cancelled" element={<PaymentCancelled />} />
        <Route path="*" element={<MainApp />} />
      </Routes>
    </Router>
  );
}

export default App;