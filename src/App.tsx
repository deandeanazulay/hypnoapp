import React, { useState, useEffect } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { useSimpleAuth as useAuth } from './hooks/useSimpleAuth';
import { useAppStore } from './store';
import { useViewportLayout } from './hooks/useViewportLayout';

// Components
import ErrorBoundary from './components/ErrorBoundary';
import GlobalHUD from './components/HUD/GlobalHUD';
import NavigationTabs from './components/NavigationTabs';
import ToastManager from './components/layout/ToastManager';
import LandingPage from './components/LandingPage';

// Screens
import HomeScreen from './components/screens/HomeScreen';
import ExploreScreen from './components/screens/ExploreScreen';
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

// Session Components
import { TabId } from './types/Navigation';
import { track } from './services/analytics';

export default function App() {
  const { isAuthenticated, loading } = useAuth();
  const { activeTab, setActiveTab, modals, closeModal, openModal } = useAppStore();
  const [showLanding, setShowLanding] = useState(!isAuthenticated);

  // Set up viewport layout
  useViewportLayout();

  // Update landing page visibility based on auth state
  useEffect(() => {
    setShowLanding(!isAuthenticated);
  }, [isAuthenticated]);

  // Handle tab changes
  const handleTabChange = (tabId: TabId) => {
    setActiveTab(tabId);
    track('navigation', { tab: tabId, source: 'bottom_tabs' });
  };

  // Session handlers
  const handleOrbTap = () => {
    if (!isAuthenticated) {
      openModal('auth');
      return;
    }
    // TODO: Handle session start
    track('orb_interaction', { state: 'tapped', authenticated: isAuthenticated });
  };

  const handleProtocolSelect = (protocol: any) => {
    // TODO: Handle protocol selection
    track('protocol_selected', { protocolId: protocol.id, source: 'explore' });
  };

  const handleProtocolCreate = (protocol: any) => {
    // TODO: Handle custom protocol creation
    track('protocol_created', { protocolId: protocol.id, source: 'create' });
  };

  const handleFavoriteSelect = (session: any) => {
    // TODO: Handle favorite session selection
    track('favorite_selected', { sessionId: session.id, source: 'favorites' });
  };

  const handleShowAuth = () => {
    openModal('auth');
  };

  const handleEnterApp = () => {
    setShowLanding(false);
    setActiveTab('home');
  };

  // Show loading state
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

  // Show landing page if not authenticated or explicitly showing landing
  if (showLanding) {
    return (
      <Router>
        <ErrorBoundary>
          <div className="min-h-screen">
            <Routes>
              <Route path="/payment-success" element={<div className="min-h-screen bg-black flex items-center justify-center text-white">Payment Successful!</div>} />
              <Route path="/payment-cancelled" element={<div className="min-h-screen bg-black flex items-center justify-center text-white">Payment Cancelled</div>} />
              <Route path="*" element={
                <LandingPage 
                  onEnterApp={handleEnterApp}
                  onShowAuth={handleShowAuth}
                />
              } />
            </Routes>
            
            {/* Auth Modal */}
            <AuthModal isOpen={modals.auth} onClose={() => closeModal('auth')} />
            <ToastManager />
          </div>
        </ErrorBoundary>
      </Router>
    );
  }

  // Main app interface
  return (
    <Router>
      <ErrorBoundary>
        <div className="min-h-screen bg-black overflow-hidden">
          {/* Global HUD */}
          <GlobalHUD />
          
          {/* Main Content */}
          <div className="h-screen pt-16">
            <Routes>
              <Route path="/payment-success" element={<div className="h-full bg-black flex items-center justify-center text-white">Payment Successful!</div>} />
              <Route path="/payment-cancelled" element={<div className="h-full bg-black flex items-center justify-center text-white">Payment Cancelled</div>} />
              <Route path="*" element={
                <div className="h-full">
                  {/* Screen Content */}
                  {activeTab === 'home' && (
                    <HomeScreen
                      onOrbTap={handleOrbTap}
                      onTabChange={handleTabChange}
                      onShowAuth={handleShowAuth}
                      activeTab={activeTab}
                    />
                  )}
                  
                  {activeTab === 'explore' && (
                    <ExploreScreen
                      onProtocolSelect={handleProtocolSelect}
                    />
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
                  
                  {/* Bottom Navigation */}
                  <NavigationTabs
                    activeTab={activeTab}
                    onTabChange={handleTabChange}
                  />
                </div>
              } />
            </Routes>
          </div>

          {/* Modals */}
          <AuthModal isOpen={modals.auth} onClose={() => closeModal('auth')} />
          <SettingsModal isOpen={modals.settings} onClose={() => closeModal('settings')} />
          <EgoStatesModal />
          <PlanModal />
          <TokensModal />
          <FavoritesModal onSessionSelect={handleFavoriteSelect} />
          <DocumentationHubModal />
          
          {/* Toast System */}
          <ToastManager />
        </div>
      </ErrorBoundary>
    </Router>
  );
}