import React, { useState } from 'react';
import { useSimpleAuth as useAuth } from '../../hooks/useSimpleAuth';
import { useAppStore, getEgoState } from '../../store';
import { useGameState } from '../GameStateManager';
import { useProtocolStore } from '../../state/protocolStore';
import { track } from '../../services/analytics';
import { Heart } from 'lucide-react';
import Orb from '../Orb';
import ActionsBar from '../ActionsBar';
import SessionInitiationFlow from '../session/SessionInitiationFlow';
import HorizontalMilestoneRoadmap from '../shared/HorizontalMilestoneRoadmap';
import PageShell from '../layout/PageShell';
import { TabId } from '../../types/Navigation';

interface HomeScreenProps {
  onOrbTap: () => void;
  onTabChange: (tabId: TabId) => void;
  onShowAuth: () => void;
  activeTab: string;
}

export default function HomeScreen({ onOrbTap, onTabChange, onShowAuth, activeTab }: HomeScreenProps) {
  const { isAuthenticated } = useAuth();
  const { user } = useGameState();
  const { activeEgoState } = useAppStore();
  const { customActions } = useProtocolStore();

  const [selectedAction, setSelectedAction] = useState<any>(null);
  const [showSessionFlow, setShowSessionFlow] = useState(false);

  const currentEgoState = getEgoState(activeEgoState);

  const handleOrbTap = () => {
    if (!isAuthenticated) {
      onShowAuth();
      return;
    }

    setShowSessionFlow(true);
    track('orb_interaction', { 
      state: 'tapped', 
      authenticated: isAuthenticated,
      egoState: activeEgoState 
    });
  };

  const handleMilestoneSelect = (milestone: any) => {
    onTabChange('explore');
    track('milestone_selected', { 
      milestoneId: milestone.id, 
      source: 'home_roadmap' 
    });
  };

  if (!isAuthenticated) {
    return (
      <div className="h-full bg-gradient-to-br from-black via-purple-950/20 to-indigo-950/20 relative overflow-hidden">
        {/* Background Effects */}
        <div className="absolute inset-0">
          <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-gradient-to-br from-teal-500/10 to-cyan-500/5 rounded-full blur-3xl" />
          <div className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-gradient-to-br from-purple-500/10 to-pink-500/5 rounded-full blur-3xl" />
        </div>

        <PageShell
          body={
            <div className="h-full flex items-center justify-center p-4">
              <div className="text-center max-w-sm">
                <div className="w-20 h-20 rounded-full bg-gradient-to-br from-teal-500/20 to-purple-500/20 flex items-center justify-center mx-auto mb-6 border border-teal-500/30">
                  <Heart size={32} className="text-teal-400" />
                </div>
                <h3 className="text-white text-xl font-light mb-4">Sign in to begin your transformation</h3>
                <button
                  onClick={onShowAuth}
                  className="px-6 py-3 bg-gradient-to-r from-teal-400 to-cyan-400 rounded-xl text-black font-semibold hover:scale-105 transition-transform duration-200"
                >
                  Sign In
                </button>
              </div>
            </div>
          }
        />
      </div>
    );
  }

  return (
    <div className="h-full bg-gradient-to-br from-black via-purple-950/20 to-indigo-950/20 relative overflow-hidden">
      {/* Background Effects */}
      <div className="absolute inset-0">
        <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-gradient-to-br from-teal-500/10 to-cyan-500/5 rounded-full blur-3xl" />
        <div className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-gradient-to-br from-purple-500/10 to-pink-500/5 rounded-full blur-3xl" />
      </div>

      <PageShell
        body={
          <div className="relative z-10 h-full overflow-hidden">
            {/* Main Content */}
            <div 
              id="scene" 
              className="relative h-full flex flex-col items-center justify-center px-4"
              style={{ 
                paddingTop: '60px',
                paddingBottom: 'calc(var(--total-nav-height, 128px) + 2rem)'
              }}
            >
              {/* Orb Section */}
              <div className="flex-1 flex items-center justify-center">
                <div className="text-center">
                  <div className="mb-6">
                    <Orb
                      onTap={handleOrbTap}
                      size={Math.min(window.innerWidth * 0.8, 400)}
                      egoState={activeEgoState}
                      variant="auto"
                      className="mx-auto"
                    />
                  </div>
                  
                  {/* Orb Tagline */}
                  <div className="max-w-xs mx-auto">
                    <p className="text-white/90 text-lg font-light mb-2">
                      Enter with Libero in <span className="text-teal-400 font-medium">{currentEgoState.name}</span>
                    </p>
                    <p className="text-white/60 text-sm">
                      Tap to begin your transformation
                    </p>
                  </div>
                </div>
              </div>

              {/* Bottom Section - Milestone Roadmap */}
              <div className="flex-shrink-0 w-full max-w-lg mx-auto mb-4">
                <HorizontalMilestoneRoadmap 
                  user={user}
                  onMilestoneSelect={handleMilestoneSelect}
                  onTabChange={onTabChange}
                />
              </div>
            </div>

            {/* Session Initiation Flow */}
            <SessionInitiationFlow
              isOpen={showSessionFlow}
              onClose={() => setShowSessionFlow(false)}
              onSessionStart={() => {
                track('session_started_from_home', { egoState: activeEgoState });
              }}
              egoState={activeEgoState}
            />
          </div>
        }
      />
    </div>
  );
}