import React, { useState } from 'react';
import EgoStatesRow from '../EgoStatesRow';
import ActionsBar from '../ActionsBar';
import WebGLOrb from '../WebGLOrb';
import { useGameState } from '../GameStateManager';
import { Clock, Zap, Target } from 'lucide-react';
import { TabId } from '../../types/Navigation';

interface HomeScreenProps {
  selectedEgoState: string;
  onEgoStateChange: (egoState: string) => void;
  onOrbTap: () => void;
  activeTab: TabId;
  onTabChange: (tabId: TabId) => void;
  selectedAction: any;
  onActionSelect: (action: any) => void;
}

export default function HomeScreen({ 
  selectedEgoState, 
  onEgoStateChange, 
  onOrbTap, 
  activeTab,
  onTabChange,
  selectedAction,
  onActionSelect
}: HomeScreenProps) {
  const { user } = useGameState();
  const [mousePosition, setMousePosition] = useState({ x: 0, y: 0 });
  const [isDragging, setIsDragging] = useState(false);

  // Get greeting based on time of day
  const getGreeting = () => {
    const hour = new Date().getHours();
    if (hour < 12) return 'Good morning';
    if (hour < 17) return 'Good afternoon';
    return 'Good evening';
  };

  // Format last session time
  const getLastSessionText = () => {
    if (!user.lastSessionDate) return null;
    
    const lastSession = new Date(user.lastSessionDate);
    const now = new Date();
    const diffInHours = Math.floor((now.getTime() - lastSession.getTime()) / (1000 * 60 * 60));
    
    if (diffInHours < 1) return 'Last session: Just now';
    if (diffInHours < 24) return `Last session: ${diffInHours}h ago`;
    
    const diffInDays = Math.floor(diffInHours / 24);
    if (diffInDays === 1) return 'Last session: Yesterday';
    if (diffInDays < 7) return `Last session: ${diffInDays}d ago`;
    
    return 'Last session: Over a week ago';
  };

  const handleActionSelect = (action: any) => {
    onActionSelect(action);
  };

  const handleOrbTap = () => {
    // Start session with selected action (if any) and ego state
    onOrbTap();
  };
  const lastSessionText = getLastSessionText();

  const handleMouseMove = (e: React.MouseEvent) => {
    if (!isDragging) {
      const rect = e.currentTarget.getBoundingClientRect();
      setMousePosition({
        x: (e.clientX - rect.left) / rect.width,
        y: (e.clientY - rect.top) / rect.height
      });
    }
  };

  return (
    <div 
      className="h-full relative overflow-hidden flex flex-col"
      onMouseMove={handleMouseMove}
      style={{ background: '#000' }}
    >
      {/* Cosmic Space Background */}
      <div className="absolute inset-0">
        {/* Black Hole Event Horizon */}
        <div className="absolute inset-0 bg-black" />
        
        {/* Static Cosmic Background */}
        <div className="absolute inset-0 overflow-hidden">
          {/* Static gradient background */}
          <div className="absolute inset-0 bg-gradient-to-br from-black via-purple-950/10 to-teal-950/10" />
          
          {/* Static accent dots */}
          {Array.from({ length: 50 }).map((_, i) => (
            <div
              key={`star-${i}`}
              className="absolute bg-white rounded-full opacity-20"
              style={{
                width: `${0.5 + Math.random() * 2}px`,
                height: `${0.5 + Math.random() * 2}px`,
                left: `${Math.random() * 100}%`,
                top: `${Math.random() * 100}%`
              }}
            />
          ))}
        </div>
      </div>

      {/* Main Layout - Perfect vertical distribution */}
      <div className="relative z-10 h-full flex flex-col">
        
        {/* Ego States Row */}
        <div className="flex-shrink-0 py-1">
          <EgoStatesRow 
            selectedEgoState={selectedEgoState}
            onEgoStateChange={onEgoStateChange}
          />
        </div>

        {/* Center Section - Orb Supreme */}
        <div className="flex-1 flex items-center justify-center min-h-0 relative z-20 px-4">
          <div className="w-full h-full flex items-center justify-center">
            <div className="flex flex-col items-center justify-center max-w-none">
              {/* Orb Container - Sacred Space */}
              <div 
                className="relative z-30" 
                style={{ 
                  minHeight: Math.max(240, Math.min(window.innerHeight * 0.35, 320)),
                  minWidth: Math.max(240, Math.min(window.innerWidth * 0.6, 320)),
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center'
                }}
              >
                <WebGLOrb
                  onTap={onOrbTap}
                  afterglow={user.lastSessionDate !== null}
                  egoState={selectedEgoState}
                  mousePosition={mousePosition}
                  isDragging={isDragging}
                  onDragStart={() => setIsDragging(true)}
                  onDragEnd={() => setIsDragging(false)}
                  size={window.innerWidth < 768 ? 
                    Math.max(200, Math.min(window.innerWidth * 0.6, 280)) :
                    Math.max(240, Math.min(window.innerHeight * 0.3, 300))
                  }
                />
              </div>
                
              {/* Session configuration display - always visible */}
              <div className="mt-3 text-center relative z-20 bg-black/40 backdrop-blur-xl rounded-xl px-3 py-2 border border-white/10 shadow-lg">
                <p className="text-teal-400 text-sm font-medium">
                  {selectedEgoState.charAt(0).toUpperCase() + selectedEgoState.slice(1)} Mode
                </p>
                {selectedAction && (
                  <p className="text-orange-400 text-sm font-medium">
                    {selectedAction.name} ready
                  </p>
                )}
                <p className="text-white/60 text-xs mt-1">
                  {selectedAction ? 'Tap orb to begin' : 'Select action & tap orb'}
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Bottom Section - Actions Bar */}
        <div className="flex-shrink-0 pb-6 px-4" style={{ paddingBottom: 'calc(24px + var(--safe-bottom, 0px))' }}>
          <div className="text-center mb-2">
            <p className="text-white/50 text-xs font-medium">Choose session type</p>
          </div>
          <ActionsBar 
            selectedEgoState={selectedEgoState}
            selectedAction={selectedAction}
            onActionSelect={handleActionSelect}
            onNavigateToCreate={() => onTabChange('create')}
          />
        </div>
      </div>

      {/* Achievement notifications */}
      {user.achievements.length > 0 && (
        <div className="absolute top-20 right-4 bg-gradient-to-r from-amber-400 to-orange-400 text-black px-3 py-1 rounded-full text-xs font-semibold animate-pulse z-20">
          {user.achievements[user.achievements.length - 1]}
        </div>
      )}

      {/* CSS for additional animations */}
      <style jsx>{`
        /* Removed all space background animations for calm experience */
      `}</style>
    </div>
  );
}