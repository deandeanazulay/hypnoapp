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
        
        {/* Gravitational Distortion Field */}
        <div className="absolute inset-0 overflow-hidden">
          {/* Central Singularity */}
          <div 
            className="absolute top-1/2 left-1/2 w-32 h-32 -translate-x-1/2 -translate-y-1/2 rounded-full"
            style={{
              background: 'radial-gradient(circle, #000000 0%, #000000 30%, rgba(20, 184, 166, 0.1) 70%, transparent 100%)',
              animation: 'blackHolePull 8s linear infinite'
            }}
          />
          
          {/* Accretion Disk Rings */}
          {Array.from({ length: 12 }).map((_, i) => (
            <div
              key={`accretion-${i}`}
              className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 rounded-full border"
              style={{
                width: `${150 + i * 80}px`,
                height: `${150 + i * 80}px`,
                borderColor: `rgba(${20 + i * 10}, ${184 - i * 8}, ${166 + i * 5}, ${0.1 + i * 0.02})`,
                borderWidth: '1px',
                animation: `blackHoleOrbit ${3 + i * 0.5}s linear infinite`,
                animationDirection: i % 2 === 0 ? 'normal' : 'reverse',
                opacity: 0.3 + (12 - i) * 0.05
              }}
            />
          ))}
          
          {/* Matter Spiral Arms */}
          {Array.from({ length: 6 }).map((_, i) => (
            <div
              key={`spiral-${i}`}
              className="absolute top-1/2 left-1/2 origin-center"
              style={{
                width: '800px',
                height: '4px',
                background: `linear-gradient(90deg, transparent 0%, rgba(20, 184, 166, ${0.3 + i * 0.1}) 30%, rgba(99, 102, 241, ${0.2 + i * 0.05}) 70%, transparent 100%)`,
                transform: `translate(-50%, -50%) rotate(${i * 60}deg)`,
                transformOrigin: '50% 50%',
                animation: `blackHoleSpiral ${4 + i * 0.3}s linear infinite`,
                filter: 'blur(1px)'
              }}
            />
          ))}
          
          {/* Photon Sphere */}
          <div 
            className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 rounded-full border-2"
            style={{
              width: '420px',
              height: '420px',
              borderColor: 'rgba(255, 255, 255, 0.05)',
              animation: 'blackHolePhotonSphere 6s ease-in-out infinite alternate'
            }}
          />
          
          {/* Event Horizon Distortion */}
          <div 
            className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 rounded-full"
            style={{
              width: '300px',
              height: '300px',
              background: 'conic-gradient(from 0deg, transparent, rgba(0, 0, 0, 0.8), transparent, rgba(0, 0, 0, 0.9), transparent)',
              animation: 'blackHoleDistortion 3s linear infinite',
              filter: 'blur(2px)'
            }}
          />
          
          {/* Hawking Radiation Particles */}
          {Array.from({ length: 200 }).map((_, i) => (
            <div
              key={`radiation-${i}`}
              className="absolute bg-white rounded-full"
              style={{
                width: `${0.5 + Math.random() * 1.5}px`,
                height: `${0.5 + Math.random() * 1.5}px`,
                left: `${Math.random() * 100}%`,
                top: `${Math.random() * 100}%`,
                opacity: 0.2 + Math.random() * 0.4,
                animation: `hawkingRadiation ${2 + Math.random() * 4}s linear infinite`,
                animationDelay: `${Math.random() * 2}s`
              }}
            />
          ))}
          
          {/* Spacetime Curvature Lines */}
          {Array.from({ length: 16 }).map((_, i) => (
            <div
              key={`curvature-${i}`}
              className="absolute top-1/2 left-1/2"
              style={{
                width: '1000px',
                height: '2px',
                background: `linear-gradient(90deg, transparent 0%, rgba(255, 255, 255, ${0.05 + Math.sin(i) * 0.03}) 50%, transparent 100%)`,
                transform: `translate(-50%, -50%) rotate(${i * 22.5}deg)`,
                transformOrigin: '50% 50%',
                animation: `spacetimeCurvature ${8 + i * 0.2}s linear infinite`,
                filter: 'blur(0.5px)'
              }}
            />
          ))}
          
          {/* Tidal Forces */}
          <div 
            className="absolute inset-0"
            style={{
              background: 'radial-gradient(ellipse 40% 60% at 50% 50%, transparent 0%, rgba(0, 0, 0, 0.3) 70%, rgba(0, 0, 0, 0.8) 100%)',
              animation: 'tidalStretch 4s ease-in-out infinite alternate'
            }}
          />
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
        
        @keyframes blackHolePull {
          0% { 
            transform: scale(1) rotate(0deg);
            filter: brightness(0.8) contrast(1.2);
          }
          100% { 
            transform: scale(0.1) rotate(720deg);
            filter: brightness(0.3) contrast(2);
          }
        }
        
        @keyframes blackHoleOrbit {
          0% { 
            transform: translate(-50%, -50%) rotate(0deg) scale(1);
            opacity: 0.8;
          }
          50% {
            transform: translate(-50%, -50%) rotate(180deg) scale(0.95);
            opacity: 0.4;
          }
          100% { 
            transform: translate(-50%, -50%) rotate(360deg) scale(0.9);
            opacity: 0.8;
          }
        }
        
        @keyframes blackHoleSpiral {
          0% { 
            transform: translate(-50%, -50%) rotate(0deg) scaleX(1);
            opacity: 0.6;
          }
          25% {
            transform: translate(-50%, -50%) rotate(90deg) scaleX(0.8);
            opacity: 0.8;
          }
          50% {
            transform: translate(-50%, -50%) rotate(180deg) scaleX(0.6);
            opacity: 0.4;
          }
          75% {
            transform: translate(-50%, -50%) rotate(270deg) scaleX(0.8);
            opacity: 0.8;
          }
          100% { 
            transform: translate(-50%, -50%) rotate(360deg) scaleX(1);
            opacity: 0.6;
          }
        }
        
        @keyframes blackHolePhotonSphere {
          0% { 
            transform: translate(-50%, -50%) scale(1);
            border-color: rgba(255, 255, 255, 0.05);
          }
          50% {
            transform: translate(-50%, -50%) scale(1.1);
            border-color: rgba(20, 184, 166, 0.2);
          }
          100% { 
            transform: translate(-50%, -50%) scale(1);
            border-color: rgba(255, 255, 255, 0.05);
          }
        }
        
        @keyframes blackHoleDistortion {
          0% { 
            transform: translate(-50%, -50%) rotate(0deg) scale(1);
            opacity: 0.8;
          }
          100% { 
            transform: translate(-50%, -50%) rotate(360deg) scale(0.95);
            opacity: 0.4;
          }
        }
        
        @keyframes hawkingRadiation {
          0% { 
            transform: scale(0) rotate(0deg);
            opacity: 0;
          }
          20% {
            transform: scale(1) rotate(90deg);
            opacity: 1;
          }
          80% {
            transform: scale(1.5) rotate(270deg);
            opacity: 0.8;
          }
          100% { 
            transform: scale(0) rotate(360deg);
            opacity: 0;
          }
        }
        
        @keyframes spacetimeCurvature {
          0% { 
            transform: translate(-50%, -50%) rotate(0deg) scaleY(1);
            opacity: 0.05;
          }
          25% {
            transform: translate(-50%, -50%) rotate(90deg) scaleY(0.3);
            opacity: 0.15;
          }
          50% {
            transform: translate(-50%, -50%) rotate(180deg) scaleY(0.1);
            opacity: 0.05;
          }
          75% {
            transform: translate(-50%, -50%) rotate(270deg) scaleY(0.3);
            opacity: 0.15;
          }
          100% { 
            transform: translate(-50%, -50%) rotate(360deg) scaleY(1);
            opacity: 0.05;
          }
        }
        
        @keyframes tidalStretch {
          0% { 
            transform: scaleY(1) scaleX(1);
            opacity: 0.3;
          }
          100% { 
            transform: scaleY(1.2) scaleX(0.8);
            opacity: 0.8;
          }
        }
      `}</style>
    </div>
  );
}