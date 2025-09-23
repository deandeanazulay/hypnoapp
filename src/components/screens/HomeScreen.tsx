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
        {/* Deep Space Base */}
        <div className="absolute inset-0 bg-gradient-to-br from-indigo-950 via-purple-950/90 to-black" />
        
        {/* Animated Nebula Clouds */}
        <div className="absolute inset-0">
          <div 
            className="absolute w-96 h-96 opacity-30 rounded-full blur-3xl animate-pulse"
            style={{
              background: 'radial-gradient(circle, rgba(147, 51, 234, 0.4) 0%, rgba(79, 70, 229, 0.2) 40%, transparent 70%)',
              top: '10%',
              left: '20%',
              transform: `translate(${mousePosition.x * 30}px, ${mousePosition.y * 20}px)`,
              animation: 'float 8s ease-in-out infinite'
            }}
          />
          <div 
            className="absolute w-80 h-80 opacity-25 rounded-full blur-3xl animate-pulse"
            style={{
              background: 'radial-gradient(circle, rgba(20, 184, 166, 0.3) 0%, rgba(6, 182, 212, 0.15) 50%, transparent 70%)',
              bottom: '15%',
              right: '15%',
              transform: `translate(${-mousePosition.x * 20}px, ${-mousePosition.y * 15}px)`,
              animation: 'float 12s ease-in-out infinite reverse',
              animationDelay: '4s'
            }}
          />
          <div 
            className="absolute w-64 h-64 opacity-20 rounded-full blur-2xl animate-pulse"
            style={{
              background: 'radial-gradient(circle, rgba(236, 72, 153, 0.3) 0%, rgba(219, 39, 119, 0.1) 60%, transparent 80%)',
              top: '60%',
              left: '10%',
              transform: `translate(${mousePosition.x * 15}px, ${mousePosition.y * 25}px)`,
              animation: 'float 10s ease-in-out infinite',
              animationDelay: '2s'
            }}
          />
        </div>

        {/* Animated Stars Field */}
        <div className="absolute inset-0 overflow-hidden">
          {Array.from({ length: 100 }).map((_, i) => (
            <div
              key={i}
              className="absolute w-1 h-1 bg-white rounded-full animate-pulse opacity-40"
              style={{
                left: `${Math.random() * 100}%`,
                top: `${Math.random() * 100}%`,
                animationDelay: `${Math.random() * 3}s`,
                animationDuration: `${2 + Math.random() * 4}s`,
                transform: `translate(${mousePosition.x * (5 + Math.random() * 10)}px, ${mousePosition.y * (5 + Math.random() * 10)}px)`
              }}
            />
          ))}
        </div>

        {/* Larger Twinkling Stars */}
        <div className="absolute inset-0 overflow-hidden">
          {Array.from({ length: 20 }).map((_, i) => (
            <div
              key={`bright-${i}`}
              className="absolute bg-white rounded-full animate-pulse"
              style={{
                width: `${2 + Math.random() * 3}px`,
                height: `${2 + Math.random() * 3}px`,
                left: `${Math.random() * 100}%`,
                top: `${Math.random() * 100}%`,
                animationDelay: `${Math.random() * 5}s`,
                animationDuration: `${3 + Math.random() * 6}s`,
                opacity: 0.6 + Math.random() * 0.4,
                boxShadow: `0 0 ${4 + Math.random() * 8}px rgba(255, 255, 255, ${0.3 + Math.random() * 0.4})`,
                transform: `translate(${mousePosition.x * (8 + Math.random() * 15)}px, ${mousePosition.y * (8 + Math.random() * 15)}px)`
              }}
            />
          ))}
        </div>

        {/* Cosmic Dust/Particle Field */}
        <div className="absolute inset-0 overflow-hidden">
          {Array.from({ length: 50 }).map((_, i) => (
            <div
              key={`dust-${i}`}
              className="absolute bg-gradient-to-r from-cyan-400/20 to-purple-400/20 rounded-full animate-pulse"
              style={{
                width: `${0.5 + Math.random() * 1.5}px`,
                height: `${0.5 + Math.random() * 1.5}px`,
                left: `${Math.random() * 100}%`,
                top: `${Math.random() * 100}%`,
                animationDelay: `${Math.random() * 4}s`,
                animationDuration: `${4 + Math.random() * 8}s`,
                opacity: 0.2 + Math.random() * 0.3,
                transform: `translate(${mousePosition.x * (15 + Math.random() * 20)}px, ${mousePosition.y * (15 + Math.random() * 20)}px)`
              }}
            />
          ))}
        </div>

        {/* Session-based Aurora Effect */}
        {user.lastSessionDate && (
          <div className="absolute inset-0">
            <div 
              className="absolute inset-0 opacity-20"
              style={{
                background: `
                  radial-gradient(ellipse at top, rgba(147, 51, 234, 0.15) 0%, transparent 70%),
                  radial-gradient(ellipse at bottom left, rgba(20, 184, 166, 0.1) 0%, transparent 50%),
                  radial-gradient(ellipse at bottom right, rgba(236, 72, 153, 0.1) 0%, transparent 50%)
                `,
                transform: `translate(${mousePosition.x * 10}px, ${mousePosition.y * 10}px)`,
                animation: 'aurora 20s ease-in-out infinite'
              }}
            />
          </div>
        )}
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
        <div className="flex-shrink-0 pb-2">
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
        @keyframes aurora {
          0%, 100% { 
            opacity: 0.1;
            transform: translateY(0px) rotate(0deg);
          }
          50% { 
            opacity: 0.3;
            transform: translateY(-20px) rotate(180deg);
          }
        }
        
        @keyframes float {
          0%, 100% { 
            transform: translateY(0px) rotate(0deg) scale(1);
          }
          33% { 
            transform: translateY(-15px) rotate(120deg) scale(1.1);
          }
          66% { 
            transform: translateY(-8px) rotate(240deg) scale(0.9);
          }
        }
      `}</style>
    </div>
  );
}