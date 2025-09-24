import React, { useState, useEffect } from 'react'
import { useSimpleAuth } from './hooks/useSimpleAuth'
import { useViewportLayout } from './hooks/useViewportLayout'
import { useStore } from './store'

// Import screens
import HomeScreen from './components/screens/HomeScreen'
import ExploreScreen from './components/screens/ExploreScreen'
import CreateScreen from './components/screens/CreateScreen'
import FavoritesScreen from './components/screens/FavoritesScreen'
import ProfileScreen from './components/screens/ProfileScreen'

// Import modals and UI components
import AuthModal from './components/auth/AuthModal'
import LandingPage from './components/LandingPage'
import NavigationTabs from './components/NavigationTabs'
import GlobalHUD from './components/HUD/GlobalHUD'
import EgoStatesModal from './components/modals/EgoStatesModal'
import SettingsModal from './components/modals/SettingsModal'
import UnifiedSessionWorld from './components/UnifiedSessionWorld'
import GameStateManager from './components/GameStateManager'
import ToastManager from './components/layout/ToastManager'

export default function App() {
  // Initialize viewport layout
  useViewportLayout()

  // Auth state
  const { user, isAuthenticated, authLoading } = useSimpleAuth()
  
  // App state
  const { 
    currentTab, 
    setCurrentTab,
    isInSession,
    showEgoStatesModal,
    setShowEgoStatesModal,
    showSettingsModal,
    setShowSettingsModal
  } = useStore()
  
  // Local state
  const [showLanding, setShowLanding] = useState(true)
  const [showAuthModal, setShowAuthModal] = useState(false)

  // Update landing page visibility when auth state changes
  useEffect(() => {
    console.log('[APP] Auth effect triggered:', { authLoading, isAuthenticated })
    if (!authLoading) {
      console.log('[APP] Setting showLanding to:', !isAuthenticated)
      setShowLanding(!isAuthenticated)
    }
  }, [isAuthenticated, authLoading])

  // Handlers
  const handleEnterApp = () => {
    if (isAuthenticated) {
      setShowLanding(false)
    } else {
      setShowAuthModal(true)
    }
  }

  const handleShowAuth = () => {
    setShowAuthModal(true)
  }

  const handleCloseAuth = () => {
    setShowAuthModal(false)
  }

  // Show loading screen while auth is loading
  if (authLoading) {
    console.log('[APP] Auth loading state - showing spinner')
    return (
      <div className="h-screen w-screen bg-black flex items-center justify-center">
        <div className="text-center">
          <div className="w-16 h-16 border-4 border-teal-400/20 border-t-teal-400 rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-white/60 text-sm">Loading Libero...</p>
        </div>
      </div>
    )
  }

  // Show landing page first
  if (showLanding) {
    console.log('[APP] Showing landing page')
    return (
      <div style={{ height: '100vh', overflow: 'hidden' }}>
        <LandingPage
          onEnterApp={handleEnterApp}
          onShowAuth={handleShowAuth}
        />
        {showAuthModal && (
          <AuthModal
            onClose={handleCloseAuth}
            onSuccess={() => {
              setShowAuthModal(false)
              setShowLanding(false)
            }}
          />
        )}
      </div>
    )
  }

  console.log('[APP] Showing main app')

  // Show session world if in session
  if (isInSession) {
    return (
      <div className="h-screen w-screen bg-black">
        <UnifiedSessionWorld />
      </div>
    )
  }

  // Render current tab content
  const renderCurrentTab = () => {
    switch (currentTab) {
      case 'home':
        return <HomeScreen />
      case 'explore':
        return <ExploreScreen />
      case 'create':
        return <CreateScreen />
      case 'favorites':
        return <FavoritesScreen />
      case 'profile':
        return <ProfileScreen />
      default:
        return <HomeScreen />
    }
  }

  // Main app layout
  return (
    <>
      {/* Game State Manager - handles background state updates */}
      <GameStateManager />
      
      {/* Toast Manager - global notifications */}
      <ToastManager />
      
      {/* Main App Container */}
      <div className="h-screen w-screen bg-black flex flex-col overflow-hidden relative">
        {/* Global Header HUD */}
        <GlobalHUD />
        
        {/* Main Body Content - Flex grow */}
        <div className="flex-1 min-h-0 flex flex-col relative z-10 app-content" style={{ paddingTop: '48px' }}>
          {/* Tab Content */}
          <div className="relative z-10 h-full">
            {renderCurrentTab()}
          </div>
        </div>
        
        {/* Bottom Navigation */}
        <div className="relative z-20">
          <NavigationTabs
            currentTab={currentTab}
            onTabChange={setCurrentTab}
          />
        </div>
      </div>

      {/* Modals */}
      {showEgoStatesModal && (
        <EgoStatesModal onClose={() => setShowEgoStatesModal(false)} />
      )}
      
      {showSettingsModal && (
        <SettingsModal onClose={() => setShowSettingsModal(false)} />
      )}
    </>
  )
}