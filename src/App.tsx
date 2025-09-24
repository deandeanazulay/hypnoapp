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
import EgoStatesModal from './components/modals/EgoStatesModal';
import ToastManager from './components/layout/ToastManager';
import AuthModal from './components/auth/AuthModal';
import PaymentSuccess from './components/PaymentSuccess';
import PaymentCancelled from './components/PaymentCancelled';
import { useViewportLayout } from './hooks/useViewportLayout';
import { useAppStore } from './store';
import { useSimpleAuth as useAuth } from './hooks/useSimpleAuth';
import { useProtocolStore } from './state/protocolStore';
import { Target } from 'lucide-react';
import './styles/glass.css';
import { TabId } from './types/Navigation';

type AppMode = 'navigation' | 'session';

function App() {
  const { activeEgoState, setActiveEgoState } = useAppStore();
  const { isAuthenticated, user: authUser, loading: authLoading } = useAuth();
  const { addCustomAction } = useProtocolStore();
  useViewportLayout(); // Initialize iOS Safari fixes
  const [showLanding, setShowLanding] = useState(!isAuthenticated);
  const [showHypnoPortal, setShowHypnoPortal] = useState(false);
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
    console.log('Orb tapped, isAuthenticated:', isAuthenticated);
    console.log('selectedAction:', selectedAction);
    console.log('activeEgoState:', activeEgoState);
    // If not authenticated, show auth modal
    if (!isAuthenticated) {
      console.log('Not authenticated, showing auth modal');
      setShowAuthModal(true);
      return;
    }

    console.log('Starting session with config:', { egoState: activeEgoState, action: selectedAction });
    // Show HypnoPortal with current ego state
    setSessionConfig({
      egoState: activeEgoState,
      action: selectedAction, // Pass the selected action from HomeScreen
      type: 'unified'
    });
    setShowHypnoPortal(true);
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
    setShowHypnoPortal(true);
  };

  const handleCustomProtocolCreate = (protocol: any) => {
    // Add to actions bar
    const actionId = addCustomAction({
      name: protocol.name,
      iconData: { type: 'Target', props: { size: 16, className: 'text-cyan-400' } },
      color: 'from-cyan-500/20 to-blue-500/20',
      description: `Custom: ${protocol.name}`,
      induction: protocol.induction,
      deepener: protocol.deepener || 'staircase',
      duration: protocol.duration || 15
    });
    
    // Navigate to home and select the new action
    setActiveTab('home');
    setSelectedAction({
      id: actionId,
      name: protocol.name,
      description: `Custom: ${protocol.name}`
    });
  };

  const handleSessionComplete = () => {
    setShowHypnoPortal(false);
    setSessionConfig(null);
  };

  const handleCancel = () => {
    setShowHypnoPortal(false);
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
    setShowHypnoPortal(true);
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

  // Render current tab content
  const renderCurrentTab = () => {
    switch (activeTab) {
      case 'home':
        return (
          <HomeScreen
            onOrbTap={handleOrbTap}
            onTabChange={setActiveTab}
            selectedAction={selectedAction}
            onActionSelect={handleActionSelect}
            selectedEgoState={activeEgoState}
            onEgoStateChange={setActiveEgoState}
            activeTab={activeTab}
            onShowAuth={() => setShowAuthModal(true)}
          />
        );
      case 'explore':
        return <ExploreScreen onProtocolSelect={handleProtocolSelect} />;
      case 'create':
        return <CreateScreen onProtocolCreate={handleCustomProtocolCreate} onShowAuth={() => setShowAuthModal(true)} />;
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
      <GlobalHUD />
      <div className="h-screen w-screen bg-black flex flex-col overflow-hidden relative">
        {/* Main Body Content - Flex grow */}
        <div className="flex-1 min-h-0 flex flex-col relative z-10 app-content">
          {/* Background Protection */}
          <div className="absolute inset-0 bg-gradient-to-br from-black via-gray-900/50 to-black pointer-events-none" />
          
          {/* Tab Content */}
          <div className="relative z-10 h-full">
            {renderCurrentTab()}
          </div>
        </div>
        
        {/* Bottom Navigation - Portaled to document.body */}
        {!showHypnoPortal && (
          <NavigationTabs
            activeTab={activeTab}
            onTabChange={setActiveTab}
          />
        )}
      </div>
      
      {/* Global Modals - Outside main structure */}
      <>
        <EgoStatesModal />
        <AuthModal 
          isOpen={showAuthModal}
        {/* Toast Notifications */}
        <ToastManager />
      </>
      
      {/* HypnoPortal (UnifiedSessionWorld as Portal) */}
      {showHypnoPortal && sessionConfig && (
        <UnifiedSessionWorld 
          onComplete={handleSessionComplete}
          onCancel={handleCancel}
          sessionConfig={sessionConfig}
        />
      )}
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