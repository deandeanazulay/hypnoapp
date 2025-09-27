import React, { useState, useEffect } from 'react';
import { Play, Target, Brain, Heart, Plus, Sparkles, Users } from 'lucide-react';
import Orb from '../Orb';
import { useGameState } from '../GameStateManager';
import { useAppStore, getEgoState } from '../../store';
import { useSimpleAuth as useAuth } from '../../hooks/useSimpleAuth';
import { QUICK_ACTIONS } from '../../utils/actions';
import { getEgoColor } from '../../config/theme';
import { TabId } from '../../types/Navigation';
import PageShell from '../layout/PageShell';
import HorizontalMilestoneRoadmap from '../shared/HorizontalMilestoneRoadmap';

interface HomeScreenProps {
  onOrbTap: () => void;
  onTabChange: (tabId: TabId) => void;
  onShowAuth: () => void;
  activeTab: string;
}

export default function HomeScreen({ onOrbTap, onTabChange, onShowAuth, activeTab }: HomeScreenProps) {
  const { user } = useGameState();
  const { activeEgoState, openModal, showToast } = useAppStore();
  const { isAuthenticated } = useAuth();
  const [selectedAction, setSelectedAction] = useState<any>(null);

  const currentEgoState = getEgoState(activeEgoState);
  const egoColor = getEgoColor(activeEgoState);

  const handleActionSelect = (action: any) => {
    if (!isAuthenticated) {
      onShowAuth();
      return;
    }
    setSelectedAction(action);
    // TODO: Start session with selected action
  };

  const handleOrbTap = () => {
    if (!isAuthenticated) {
      onShowAuth();
      showToast({
        type: 'info',
        message: 'Sign in to unlock Libero\'s full power'
      });
      return;
    }
    onOrbTap();
  };

  if (!isAuthenticated) {
    return (
      <div className="h-full bg-gradient-to-br from-black via-purple-950/20 to-teal-950/20 relative overflow-hidden">
        {/* Background Effects */}
        <div className="absolute inset-0">
          <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-gradient-to-br from-teal-500/10 to-cyan-500/5 rounded-full blur-3xl animate-pulse" />
          <div className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-gradient-to-br from-purple-500/10 to-pink-500/5 rounded-full blur-3xl animate-pulse" style={{ animationDelay: '2s' }} />
        </div>

        <PageShell
          body={
            <div className="h-full flex items-center justify-center p-4">
              <div className="text-center max-w-sm">
                <div className="w-20 h-20 rounded-full bg-gradient-to-br from-teal-500/20 to-purple-500/20 flex items-center justify-center mx-auto mb-6 border border-teal-500/30">
                  <Users size={32} className="text-teal-400" />
                </div>
                <h3 className="text-white text-xl font-light mb-4">Sign in to awaken Libero</h3>
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
    <div className="h-full bg-gradient-to-br from-black via-teal-950/20 to-purple-950/20 relative overflow-hidden">
      {/* Background Effects */}
      <div className="absolute inset-0">
        <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-gradient-to-br from-teal-500/10 to-cyan-500/5 rounded-full blur-3xl animate-pulse" />
        <div className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-gradient-to-br from-purple-500/10 to-pink-500/5 rounded-full blur-3xl animate-pulse" style={{ animationDelay: '2s' }} />
      </div>

      <PageShell
        body={
          <div className="relative z-10 h-full overflow-y-auto" style={{ paddingTop: '30px', paddingBottom: 'calc(var(--total-nav-height, 128px) + 1rem)' }}>
            <div className="px-4 space-y-4">
              
              {/* Tagline & Orb Section */}
              <div className="text-center space-y-2 mb-4">
                <div className="text-white/80 text-sm font-light mb-1">
                  Enter with Libero in {currentEgoState.name}
                </div>
                
                <div className="flex justify-center mt-1">
                  <Orb
                    onTap={handleOrbTap}
                    size={280}
                    egoState={activeEgoState}
                    variant="webgl"
                  />
                </div>
                
                <div className="text-white/60 text-sm font-light">
                  Tap to begin with Libero
                </div>
              </div>

              {/* Quick Actions - Single Row */}
              <div className="bg-gradient-to-br from-white/5 to-white/10 backdrop-blur-xl rounded-2xl p-4 border border-white/20">
                <div className="grid grid-cols-4 gap-2 w-full max-w-md mx-auto">
                  {QUICK_ACTIONS.slice(0, 4).map((action) => {
                    const IconComponent = action.icon;
                    return (
                      <button
                        key={action.id}
                        onClick={() => handleActionSelect(action)}
                        className={`bg-gradient-to-br ${action.color} border border-white/30 rounded-xl p-3 hover:scale-105 transition-all duration-200 shadow-lg ${
                          selectedAction?.id === action.id ? 'ring-2 ring-white/30' : ''
                        }`}
                      >
                        <div className="flex flex-col items-center space-y-1">
                          <div className="w-6 h-6 rounded-lg bg-black/30 border border-white/30 flex items-center justify-center">
                            <IconComponent size={10} className="text-white" />
                          </div>
                          <div className="text-white font-medium text-xs text-center leading-tight">
                            {action.name === 'Stress Relief' ? 'Relief' : 
                             action.name === 'Focus Boost' ? 'Focus' : 
                             action.name === 'Energy Up' ? 'Energy' : 
                             action.name === 'Confidence' ? 'Confidence' : 
                             action.name}
                          </div>
                        </div>
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Horizontal Milestone Roadmap */}
              <HorizontalMilestoneRoadmap 
                user={user}
                onMilestoneSelect={(milestone) => {
                  // Handle milestone selection
                  console.log('Milestone selected:', milestone);
                }}
                onTabChange={onTabChange}
              />

              {/* Daily Progress */}
              {user && (
                <div className="bg-gradient-to-br from-white/5 to-white/10 backdrop-blur-xl rounded-2xl p-4 border border-white/20">
                  <h3 className="text-white font-semibold text-lg mb-3 flex items-center space-x-2">
                    <Target size={20} className="text-orange-400" />
                    <span>Today's Progress</span>
                  </h3>
                  
                  <div className="grid grid-cols-3 gap-4 text-center">
                    <div className="bg-black/20 rounded-lg p-3 border border-white/10">
                      <div className="text-orange-400 text-xl font-bold">{user.level}</div>
                      <div className="text-white/60 text-xs">Level</div>
                    </div>
                    <div className="bg-black/20 rounded-lg p-3 border border-white/10">
                      <div className="text-yellow-400 text-xl font-bold">{user.session_streak}</div>
                      <div className="text-white/60 text-xs">Streak</div>
                    </div>
                    <div className="bg-black/20 rounded-lg p-3 border border-white/10">
                      <div className="text-teal-400 text-xl font-bold">{Math.max(0, 1 - user.daily_sessions_used)}</div>
                      <div className="text-white/60 text-xs">Sessions Left</div>
                    </div>
                  </div>
                </div>
              )}

              {/* Level Progress */}
              {user && (
                <div className="bg-gradient-to-br from-white/5 to-white/10 backdrop-blur-xl rounded-2xl p-4 border border-white/20">
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-white/80 text-sm">Progress to Level {user.level + 1}</span>
                    <span className="text-orange-400 font-medium text-sm">{user.experience % 100}/100 XP</span>
                  </div>
                  <div className="w-full h-3 bg-white/20 rounded-full overflow-hidden">
                    <div 
                      className="h-full bg-gradient-to-r from-orange-400 to-amber-400 rounded-full transition-all duration-700"
                      style={{ width: `${((user.experience % 100) / 100) * 100}%` }}
                    />
                  </div>
                </div>
              )}
            </div>
          </div>
        }
      />
    </div>
  );
}