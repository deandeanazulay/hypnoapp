import React, { useState, useEffect } from 'react';
import {
  BrowserRouter as Router,
  Routes,
  Route,
  useLocation,
  useNavigate,
  Location
} from 'react-router-dom';
import { useSimpleAuth as useAuth } from './hooks/useSimpleAuth';
import { useAppStore } from './store';
import { useSessionStore } from './store/sessionStore';
import { useViewportLayout } from './hooks/useViewportLayout';

// Components
import ErrorBoundary from './components/ErrorBoundary';
import GlobalHUD from './components/HUD/GlobalHUD';
import NavigationTabs from './components/NavigationTabs';
import ToastManager from './components/layout/ToastManager';
import LandingPage from './components/LandingPage';

// Screens
import HomeScreen from './components/screens/HomeScreen';
import JourneyMapScreen from './components/screens/JourneyMapScreen';
import CreateScreen from './components/screens/CreateScreen';
import ChatScreen from './components/screens/ChatScreen';
import ProfileScreen from './components/screens/ProfileScreen';

// Modals
import AuthModal from './components/auth/AuthModal';
import SettingsModal from './components/modals/SettingsModal';
import EgoStatesModal from './components/modals/EgoStatesModal';
import PlanModal from './components/modals/PlanModal';
import TokensModal from './components/modals/TokensModal';
import FavoritesModal from './components/modals/FavoritesModal';
import DocumentationHubModal from './components/modals/DocumentationHubModal';
import PersonalLibraryModal from './components/modals/PersonalLibraryModal';
import UnifiedSessionWorld from './components/session/UnifiedSessionWorld';
import AIVoiceSystem from './components/AIVoiceSystem';
import ChatShellOverlay from './components/chat/ChatShellOverlay';

// Session Components
import { TabId } from './types/Navigation';
import { track } from './services/analytics';

type ChatLocationState = {
  backgroundLocation?: Location;
};

interface AppFrameProps {
  isAuthenticated: boolean;
  showLanding: boolean;
  setShowLanding: React.Dispatch<React.SetStateAction<boolean>>;
}

export default function App() {
  const { isAuthenticated, loading } = useAuth();
  const [showLanding, setShowLanding] = useState(!isAuthenticated);

  // Set up viewport layout
  useViewportLayout();

  useEffect(() => {
    setShowLanding(!isAuthenticated);
  }, [isAuthenticated]);

  if (loading) {
    return (
      <div className="min-h-screen bg-black flex items-center justify-center">
        <div className="text-center">
          <div className="w-16 h-16 border-4 border-teal-400/20 border-t-teal-400 rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-white/60 text-sm">Loading Libero...</p>
        </div>
      </div>
    );
  }

  return (
    <Router>
      <AppFrame
        isAuthenticated={isAuthenticated}
        showLanding={showLanding}
        setShowLanding={setShowLanding}
      />
    </Router>
  );
}

function AppFrame({ isAuthenticated, showLanding, setShowLanding }: AppFrameProps) {
  const {
    activeTab,
    setActiveTab,
    modals,
    closeModal,
    openModal,
    activeEgoState
  } = useAppStore();
  const { sessionHandle } = useSessionStore();
  const location = useLocation();
  const navigate = useNavigate();
  const state = location.state as ChatLocationState | undefined;
  const backgroundLocation = state?.backgroundLocation;
  const baseLocation = backgroundLocation ?? location;
  const previousTabRef = React.useRef<TabId>((activeTab as TabId) || 'home');

  useEffect(() => {
    if (!location.pathname.startsWith('/chat')) {
      previousTabRef.current = (activeTab as TabId) || 'home';
    }
  }, [activeTab, location.pathname]);

  const handleEnterApp = () => {
    setShowLanding(false);
    setActiveTab('home');
  };

  const handleShowAuth = () => {
    openModal('auth');
  };

  const handleChatClose = React.useCallback(() => {
    const fallbackTab = previousTabRef.current || 'home';
    setActiveTab(fallbackTab);

    if (backgroundLocation) {
      navigate(-1);
    } else {
      navigate('/', { replace: true });
    }
  }, [backgroundLocation, navigate, setActiveTab]);

  const handleTabChange = (tabId: TabId) => {
    if (tabId === 'chat') {
      previousTabRef.current = (activeTab as TabId) || 'home';
      track('navigation', { tab: tabId, source: 'bottom_tabs' });
      navigate('/chat', { state: { backgroundLocation: location } });
      return;
    }

    if (location.pathname.startsWith('/chat')) {
      if (backgroundLocation) {
        navigate(-1);
      } else {
        navigate('/', { replace: true });
      }
    }

    setActiveTab(tabId);
    track('navigation', { tab: tabId, source: 'bottom_tabs' });
  };

  const handleOrbTap = () => {
    if (!isAuthenticated) {
      openModal('auth');
      return;
    }
    track('orb_interaction', { state: 'tapped', authenticated: isAuthenticated });
  };

  const handleProtocolSelect = (protocol: any) => {
    track('protocol_selected', { protocolId: protocol.id, source: 'explore' });
  };

  const handleProtocolCreate = (protocol: any) => {
    track('protocol_created', { protocolId: protocol.id, source: 'create' });
  };

  const handleFavoriteSelect = (session: any) => {
    track('favorite_selected', { sessionId: session.id, source: 'favorites' });
  };

  if (showLanding) {
    return (
      <ErrorBoundary>
        <div className="min-h-screen">
          <Routes location={baseLocation}>
            <Route
              path="/payment-success"
              element={
                <div className="h-full bg-black flex items-center justify-center">
                  <div className="text-center">
                    <div className="text-white text-2xl font-light mb-4">Payment Successful!</div>
                    <AIVoiceSystem
                      isActive={true}
                      sessionType="integration"
                      onStateChange={() => {}}
                      sessionState={{ phase: 'completion', depth: 1, breathing: 'rest' }}
                      sessionConfig={{ egoState: 'guardian' }}
                    />
                  </div>
                </div>
              }
            />
            <Route
              path="/payment-cancelled"
              element={
                <div className="h-full bg-black flex items-center justify-center">
                  <div className="text-center">
                    <div className="text-white text-2xl font-light mb-4">Payment Cancelled</div>
                    <AIVoiceSystem
                      isActive={true}
                      sessionType="integration"
                      onStateChange={() => {}}
                      sessionState={{ phase: 'preparation', depth: 1, breathing: 'rest' }}
                      sessionConfig={{ egoState: 'guardian' }}
                    />
                  </div>
                </div>
              }
            />
            <Route
              path="*"
              element={
                <LandingPage
                  onEnterApp={handleEnterApp}
                  onShowAuth={handleShowAuth}
                />
              }
            />
          </Routes>
        </div>
        {location.pathname.startsWith('/chat') && (
          <Routes>
            <Route path="/chat/*" element={<ChatShellOverlay onClose={handleChatClose} />} />
          </Routes>
        )}
      </ErrorBoundary>
    );
  }

  return (
    <ErrorBoundary>
      <div className="min-h-screen bg-black" style={{ overflow: 'visible' }}>
        <GlobalHUD />

        <div className="h-screen pt-16" style={{ overflow: 'visible' }}>
          <Routes location={baseLocation}>
            <Route
              path="/payment-success"
              element={
                <div className="h-full bg-black flex items-center justify-center">
                  <div className="text-center">
                    <div className="text-white text-2xl font-light mb-4">Payment Successful!</div>
                    <AIVoiceSystem
                      isActive={true}
                      sessionType="integration"
                      onStateChange={() => {}}
                      sessionState={{ phase: 'completion', depth: 1, breathing: 'rest' }}
                      sessionConfig={{ egoState: activeEgoState }}
                    />
                  </div>
                </div>
              }
            />
            <Route
              path="/payment-cancelled"
              element={
                <div className="h-full bg-black flex items-center justify-center">
                  <div className="text-center">
                    <div className="text-white text-2xl font-light mb-4">Payment Cancelled</div>
                    <AIVoiceSystem
                      isActive={true}
                      sessionType="integration"
                      onStateChange={() => {}}
                      sessionState={{ phase: 'preparation', depth: 1, breathing: 'rest' }}
                      sessionConfig={{ egoState: activeEgoState }}
                    />
                  </div>
                </div>
              }
            />
            <Route
              path="*"
              element={
                <div className="h-full overflow-visible">
                  {activeTab === 'home' && (
                    <HomeScreen
                      onOrbTap={handleOrbTap}
                      onTabChange={handleTabChange}
                      onShowAuth={handleShowAuth}
                      activeTab={activeTab as TabId}
                    />
                  )}

                  {activeTab === 'explore' && (
                    <JourneyMapScreen onProtocolSelect={handleProtocolSelect} />
                  )}

                  {activeTab === 'create' && (
                    <CreateScreen
                      onProtocolCreate={handleProtocolCreate}
                      onShowAuth={handleShowAuth}
                    />
                  )}

                  {activeTab === 'chat' && (
                    <ChatScreen />
                  )}

                  {activeTab === 'profile' && (
                    <ProfileScreen
                      selectedEgoState={'guardian'}
                      onEgoStateChange={() => {}}
                    />
                  )}

                  {!sessionHandle && (
                    <NavigationTabs
                      activeTab={activeTab as TabId}
                      onTabChange={handleTabChange}
                    />
                  )}
                </div>
              }
            />
          </Routes>
        </div>

        <AuthModal isOpen={modals.auth} onClose={() => closeModal('auth')} />
        <SettingsModal isOpen={modals.settings} onClose={() => closeModal('settings')} />
        <EgoStatesModal />
        <PlanModal />
        <TokensModal />
        <FavoritesModal onSessionSelect={handleFavoriteSelect} />
        <DocumentationHubModal />
        <PersonalLibraryModal />

        <ToastManager />

        <UnifiedSessionWorld
          isOpen={!!sessionHandle}
          onClose={() => {
            console.log('[APP] Closing session world');
          }}
        />
      </div>

      {location.pathname.startsWith('/chat') && (
        <Routes>
          <Route path="/chat/*" element={<ChatShellOverlay onClose={handleChatClose} />} />
        </Routes>
      )}
    </ErrorBoundary>
  );
}
