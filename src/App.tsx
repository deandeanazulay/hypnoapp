import React, { useState, useEffect, Suspense } from 'react';
import { BrowserRouter } from 'react-router-dom';
import { GameStateProvider } from './components/GameStateManager';
import { useAppStore } from './store';
import { useSimpleAuth } from './hooks/useSimpleAuth';
import { useViewportLayout } from './hooks/useViewportLayout';

// Lazy-loaded Screens
const HomeScreen = React.lazy(() => import('./components/screens/HomeScreen'));
const ExploreScreen = React.lazy(() => import('./components/screens/ExploreScreen'));
const CreateScreen = React.lazy(() => import('./components/screens/CreateScreen'));
const FavoritesScreen = React.lazy(() => import('./components/screens/FavoritesScreen'));
const ProfileScreen = React.lazy(() => import('./components/screens/ProfileScreen'));

// Layout Components
import NavigationTabs from './components/NavigationTabs';
import GlobalHUD from './components/HUD/GlobalHUD';
import ToastManager from './components/layout/ToastManager';

// Modals
import AuthModal from './components/auth/AuthModal';
import EgoStatesModal from './components/modals/EgoStatesModal';
import SettingsModal from './components/modals/SettingsModal';
import PlanModal from './components/modals/PlanModal';
import TokensModal from './components/modals/TokensModal';
import ChatGPTChatWidget from './components/ChatGPTChatWidget';

// Session Components
import UnifiedSessionWorld from './components/UnifiedSessionWorld';

// Pickers
import GoalPicker from './components/GoalPicker';
import MethodPicker from './components/MethodPicker';
import ModePicker from './components/ModePicker';

// Landing Page
import LandingPage from './components/LandingPage';

import { QUICK_ACTIONS } from './utils/actions';
import { useProtocolStore } from './state/protocolStore';

// Loading fallback component for lazy-loaded screens
function ScreenLoadingFallback() {
  return (
    <div className="h-full flex items-center justify-center bg-black">
      <div className="text-center">
        <div className="w-8 h-8 border-2 border-teal-400/30 border-t-teal-400 rounded-full animate-spin mx-auto mb-3"></div>
        <p className="text-white/60 text-sm">Loading...</p>
      </div>
    </div>
  );
}

export default function App() {
  useViewportLayout();
  
  const { 
    activeTab, 
    setActiveTab, 
    modals, 
    openModal, 
    closeModal,
    activeEgoState, 
    setActiveEgoState,
    showToast 
  } = useAppStore();
  
  const { isAuthenticated, loading: authLoading } = useSimpleAuth();
  const { customActions } = useProtocolStore();
  
  // UI States
  const [showGoalPicker, setShowGoalPicker] = useState(false);
  const [showMethodPicker, setShowMethodPicker] = useState(false);
  const [showModePicker, setShowModePicker] = useState(false);
  const [selectedGoal, setSelectedGoal] = useState<any>(null);
  const [selectedMethod, setSelectedMethod] = useState<any>(null);
  const [showSessionWorld, setShowSessionWorld] = useState(false);
  const [sessionConfig, setSessionConfig] = useState<any>(null);
  const [showLanding, setShowLanding] = useState(true);

  // Update landing page visibility when auth state changes
  useEffect(() => {
    console.log('[APP] Auth effect triggered:', { authLoading, isAuthenticated });
    if (!authLoading) {
      console.log('[APP] Setting showLanding to:', !isAuthenticated);
      setShowLanding(!isAuthenticated);
    }
  }, [isAuthenticated, authLoading]);

  // Show loading screen while auth is loading
  if (authLoading) {
    console.log('[APP] Auth loading state - showing spinner');
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
    console.log('[APP] Showing landing page');
    return (
      <div style={{ height: '100vh', overflow: 'hidden' }}>
        <LandingPage
          onEnterApp={handleEnterApp}
          onShowAuth={handleShowAuth}
        />
      </div>
    );
  }

  console.log('[APP] Showing main app');

  // Render current tab content
  const renderCurrentTab = () => {
    return (
      <Suspense fallback={<ScreenLoadingFallback />}>
        {(() => {
          switch (activeTab) {
            case 'home':
              return (
                <HomeScreen
                  onOrbTap={handleOrbTap}
                  onTabChange={setActiveTab}
                  selectedEgoState={activeEgoState}
                  onEgoStateChange={setActiveEgoState}
                  activeTab={activeTab}
                  onShowAuth={handleShowAuth}
                />
              );
            case 'explore':
              return <ExploreScreen onProtocolSelect={handleProtocolSelect} />;
            case 'create':
              return <CreateScreen onProtocolCreate={handleProtocolCreate} onShowAuth={handleShowAuth} />;
            case 'favorites':
              return <FavoritesScreen onSessionSelect={handleFavoriteSelect} />;
            case 'profile':
              return (
                <ProfileScreen
                  selectedEgoState={activeEgoState}
                  onEgoStateChange={setActiveEgoState}
                />
              );
            default:
              return null;
          }
        })()}
      </Suspense>
    );
  };

  // Event Handlers
  function handleEnterApp() {
    console.log('[APP] handleEnterApp called');
    setShowLanding(false);
  }

  function handleShowAuth() {
    console.log('[APP] handleShowAuth called');
    openModal('auth');
  }

  function handleOrbTap() {
    console.log('[APP] Orb tapped, opening goal picker');
    setShowGoalPicker(true);
  }

  function handleGoalSelect(goal: any) {
    console.log('[APP] Goal selected:', goal);
    setSelectedGoal(goal);
    setShowGoalPicker(false);
    setShowMethodPicker(true);
  }

  function handleMethodSelect(method: any) {
    console.log('[APP] Method selected:', method);
    setSelectedMethod(method);
    setShowMethodPicker(false);
    setShowModePicker(true);
  }

  function handleModeSelect({ mode, duration }: any) {
    console.log('[APP] Mode selected:', { mode, duration });
    
    const config = {
      egoState: activeEgoState,
      action: { id: 'custom', name: 'Personal Transformation' }, // Default action since we removed action bar
      goal: selectedGoal,
      method: selectedMethod,
      mode,
      duration: parseInt(duration),
      type: 'unified' as const
    };
    
    setSessionConfig(config);
    setShowModePicker(false);
    setShowSessionWorld(true);
  }

  function handleProtocolSelect(protocol: any) {
    if (import.meta.env.DEV) {
      console.log('[APP] Protocol selected:', protocol);
    }
    
    if (!isAuthenticated) {
      if (import.meta.env.DEV) {
        console.log('[APP] Not authenticated, showing auth modal');
      }
      openModal('auth');
      showToast({
        type: 'warning',
        message: 'Please sign in to start a session'
      });
      return;
    }
    
    const config = {
      egoState: activeEgoState,
      protocol,
      type: 'protocol' as const,
      duration: protocol.duration
    };
    
    setSessionConfig(config);
    setShowSessionWorld(true);
  }

  function handleProtocolCreate(protocol: any) {
    console.log('[APP] Protocol created:', protocol);
    
    if (!isAuthenticated) {
      console.log('[APP] Not authenticated, showing auth modal');
      openModal('auth');
      showToast({
        type: 'warning',
        message: 'Please sign in to create and use protocols'
      });
      return;
    }
    
    const config = {
      egoState: activeEgoState,
      customProtocol: protocol,
      type: 'protocol' as const,
      duration: protocol.duration
    };
    
    setSessionConfig(config);
    setShowSessionWorld(true);
  }

  function handleFavoriteSelect(session: any) {
    console.log('[APP] Favorite selected:', session);
    
    if (!isAuthenticated) {
      console.log('[APP] Not authenticated, showing auth modal');
      openModal('auth');
      showToast({
        type: 'warning',
        message: 'Please sign in to access your favorites'
      });
      return;
    }
    
    const config = {
      egoState: session.egoState,
      session,
      type: 'favorite' as const,
      duration: session.duration
    };
    
    setSessionConfig(config);
    setShowSessionWorld(true);
  }

  function handleSessionComplete() {
    console.log('[APP] Session completed');
    setShowSessionWorld(false);
    setSelectedGoal(null);
    setSelectedMethod(null);
    setSessionConfig(null);
    setActiveTab('home');
  }

  function handleSessionCancel() {
    console.log('[APP] Session cancelled');
    setShowSessionWorld(false);
    setSelectedGoal(null);
    setSelectedMethod(null);
    setSessionConfig(null);
  }

  // Show session world if active
  if (showSessionWorld && sessionConfig) {
    return (
      <GameStateProvider>
        <UnifiedSessionWorld
          onComplete={handleSessionComplete}
          onCancel={handleSessionCancel}
          sessionConfig={sessionConfig}
        />
      </GameStateProvider>
    );
  }

  return (
    <BrowserRouter>
      <GameStateProvider>
        <div className="h-screen w-screen bg-black flex flex-col overflow-hidden relative">
          {/* Global Header HUD */}
          <GlobalHUD />
          
          {/* Main Body Content - Flex grow */}
          <div className="flex-1 min-h-0 flex flex-col relative z-10 app-content" style={{ paddingTop: '40px' }}>
            {/* Current Tab Content */}
            <div className="relative z-10 h-full">
              {renderCurrentTab()}
            </div>
          </div>

          {/* Bottom Navigation */}
          <NavigationTabs 
            activeTab={activeTab} 
            onTabChange={setActiveTab} 
          />

          {/* Pickers */}
          {showGoalPicker && (
            <GoalPicker
              onSelect={handleGoalSelect}
              onClose={() => setShowGoalPicker(false)}
              onNavigateToCreate={() => setActiveTab('create')}
            />
          )}

          {showMethodPicker && selectedGoal && (
            <MethodPicker
              selectedGoal={selectedGoal}
              onSelect={handleMethodSelect}
              onClose={() => setShowMethodPicker(false)}
            />
          )}

          {showModePicker && (
            <ModePicker
              onSelect={handleModeSelect}
              onClose={() => setShowModePicker(false)}
            />
          )}

          {/* Global Modals */}
          <AuthModal 
            isOpen={modals.auth} 
            onClose={() => closeModal('auth')} 
          />
          
          <EgoStatesModal />
          
          <SettingsModal 
            isOpen={modals.settings} 
            onClose={() => closeModal('settings')}
            selectedEgoState={activeEgoState}
            onEgoStateChange={setActiveEgoState}
          />
          
          <PlanModal />
          <TokensModal />
          
          <ChatGPTChatWidget 
            isOpen={modals.chatgptChat}
            onClose={() => closeModal('chatgptChat')}
          />

          {/* Toast Manager */}
          <ToastManager />
        </div>
      </GameStateProvider>
    </BrowserRouter>
  );
}