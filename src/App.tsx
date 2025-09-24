import React, { useState, useEffect } from 'react'
import { useSimpleAuth } from './hooks/useSimpleAuth'
import { useViewportLayout } from './hooks/useViewportLayout'
import { NavigationTabs } from './components/NavigationTabs'
import { LandingPage } from './components/LandingPage'
import { HomeScreen } from './components/screens/HomeScreen'
import { ExploreScreen } from './components/screens/ExploreScreen'
import { CreateScreen } from './components/screens/CreateScreen'
import { FavoritesScreen } from './components/screens/FavoritesScreen'
import { ProfileScreen } from './components/screens/ProfileScreen'
import { UnifiedSessionWorld } from './components/UnifiedSessionWorld'
import { AuthModal } from './components/auth/AuthModal'
import { EgoStatesModal } from './components/modals/EgoStatesModal'
import { SettingsModal } from './components/modals/SettingsModal'
import { PlanModal } from './components/modals/PlanModal'
import { TokensModal } from './components/modals/TokensModal'
import { GlobalHUD } from './components/HUD/GlobalHUD'
import { ToastManager } from './components/layout/ToastManager'
import { GameStateManager } from './components/GameStateManager'
import type { NavigationTab } from './types/Navigation'

export default function App() {
  // Initialize viewport layout hook
  useViewportLayout()
  
  // Auth state
  const { user, loading: authLoading, signIn, signUp, signOut, resetPassword } = useSimpleAuth()
  const isAuthenticated = !!user

  // Navigation state
  const [currentTab, setCurrentTab] = useState<NavigationTab>('home')
  
  // Modal states
  const [showLanding, setShowLanding] = useState(!isAuthenticated)
  const [showAuth, setShowAuth] = useState(false)
  const [showEgoStates, setShowEgoStates] = useState(false)
  const [showSettings, setShowSettings] = useState(false)
  const [showPlan, setShowPlan] = useState(false)
  const [showTokens, setShowTokens] = useState(false)

  // Session state
  const [inSession, setInSession] = useState(false)

  // Update landing page visibility when auth state changes
  React.useEffect(() => {
    console.log('[APP] Auth effect triggered:', { authLoading, isAuthenticated })
    if (!authLoading) {
      console.log('[APP] Setting showLanding to:', !isAuthenticated)
      setShowLanding(!isAuthenticated)
    }
  }, [isAuthenticated, authLoading])

  // Handlers
  const handleEnterApp = () => {
    setShowLanding(false)
    setCurrentTab('home')
  }

  const handleShowAuth = () => {
    setShowAuth(true)
  }

  const handleStartSession = (protocol?: any) => {
    setInSession(true)
  }

  const handleEndSession = () => {
    setInSession(false)
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
      </div>
    )
  }

  console.log('[APP] Showing main app')

  // Render current tab content
  const renderCurrentTab = () => {
    if (inSession) {
      return <UnifiedSessionWorld onEndSession={handleEndSession} />
    }

    switch (currentTab) {
      case 'home':
        return <HomeScreen onStartSession={handleStartSession} />
      case 'explore':
        return <ExploreScreen onStartSession={handleStartSession} />
      case 'create':
        return <CreateScreen onStartSession={handleStartSession} />
      case 'favorites':
        return <FavoritesScreen onStartSession={handleStartSession} />
      case 'profile':
        return (
          <ProfileScreen
            onShowEgoStates={() => setShowEgoStates(true)}
            onShowSettings={() => setShowSettings(true)}
            onShowPlan={() => setShowPlan(true)}
            onShowTokens={() => setShowTokens(true)}
          />
        )
      default:
        return <HomeScreen onStartSession={handleStartSession} />
    }
  }

  return (
    <>
      {/* Game State Manager */}
      <GameStateManager />

      {/* Toast Manager */}
      <ToastManager />

      {/* Main App Container */}
      <div className="h-screen w-screen bg-black flex flex-col overflow-hidden relative">
        {/* Global Header HUD */}
        <GlobalHUD />
        
        {/* Main Body Content - Flex grow */}
        <div className="flex-1 min-h-0 flex flex-col relative z-10 app-content" style={{ paddingTop: '48px' }}>
          {/* Page Content */}
          <div className="relative z-10 h-full">
            {renderCurrentTab()}
          </div>
        </div>

        {/* Bottom Navigation */}
        {!inSession && (
          <NavigationTabs
            currentTab={currentTab}
            onTabChange={setCurrentTab}
          />
        )}
      </div>

      {/* Modals */}
      {showAuth && (
        <AuthModal
          isOpen={showAuth}
          onClose={() => setShowAuth(false)}
          onSignIn={signIn}
          onSignUp={signUp}
          onResetPassword={resetPassword}
        />
      )}

      {showEgoStates && (
        <EgoStatesModal
          isOpen={showEgoStates}
          onClose={() => setShowEgoStates(false)}
        />
      )}

      {showSettings && (
        <SettingsModal
          isOpen={showSettings}
          onClose={() => setShowSettings(false)}
          onSignOut={signOut}
        />
      )}

      {showPlan && (
        <PlanModal
          isOpen={showPlan}
          onClose={() => setShowPlan(false)}
        />
      )}

      {showTokens && (
        <TokensModal
          isOpen={showTokens}
          onClose={() => setShowTokens(false)}
        />
      )}
    </>
  )
}