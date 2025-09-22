import React, { useState, useEffect, useRef } from 'react';
import { Check, AlertTriangle, Heart, Snowflake, SkipForward, Pin, VolumeX, Edit, Undo2, Play, Bell, Smartphone, Clock } from 'lucide-react';

interface Card {
  id: string;
  type: 'belief' | 'fear' | 'desire' | 'memory';
  title: string;
  content: string;
  icon: React.ReactNode;
  color: string;
  glowColor: string;
}

interface SessionData {
  sessionId: string;
  depthMax: number;
  installs: string[];
  mutes: string[];
  anchors: Array<{trigger: string; action: string}>;
  microMission: {
    type: string;
    durationSec: number;
    completed: boolean;
    evidence?: string;
  };
  nextHook: {
    trigger: string;
    window: string;
    mode: string;
    cooldownMin: number;
  };
}

const cards: Card[] = [
  {
    id: '1',
    type: 'belief',
    title: 'Belief Suggestion',
    content: 'I am capable of achieving my goals through focused effort',
    icon: <Check size={20} className="text-amber-400" />,
    color: 'from-amber-900/40 via-amber-800/30 to-amber-700/40',
    glowColor: 'shadow-amber-400/30'
  },
  {
    id: '2',
    type: 'fear',
    title: 'Fear Thought',
    content: 'What if I fail and everyone judges me?',
    icon: <AlertTriangle size={20} className="text-red-400" />,
    color: 'from-red-900/40 via-red-800/30 to-red-700/40',
    glowColor: 'shadow-red-400/30'
  },
  {
    id: '3',
    type: 'desire',
    title: 'Desire Image',
    content: 'Living confidently and speaking my truth',
    icon: <Heart size={20} className="text-pink-400" />,
    color: 'from-pink-900/40 via-pink-800/30 to-pink-700/40',
    glowColor: 'shadow-pink-400/30'
  },
  {
    id: '4',
    type: 'memory',
    title: 'Childhood Memory',
    content: 'The feeling of safety and wonder exploring nature',
    icon: <Snowflake size={20} className="text-cyan-400" />,
    color: 'from-cyan-900/40 via-cyan-800/30 to-cyan-700/40',
    glowColor: 'shadow-cyan-400/30'
  }
];

interface DeepeningInterfaceProps {
  onComplete: () => void;
  onCancel: () => void;
}

export default function DeepeningInterface({ onComplete, onCancel }: DeepeningInterfaceProps) {
  const [currentCards, setCurrentCards] = useState(cards);
  const [depth, setDepth] = useState(2); // Start deeper since we have AI guidance
  const [phase, setPhase] = useState<'DEEPEN' | 'INTEGRATE' | 'REWARD' | 'EXIT'>('DEEPEN');
  const [timer, setTimer] = useState(300); // 5 minutes for deeper work
  const [missionTimer, setMissionTimer] = useState(60);
  const [breathPhase, setBreathPhase] = useState(0);
  const [draggedCard, setDraggedCard] = useState<string | null>(null);
  const [dragOffset, setDragOffset] = useState({ x: 0, y: 0 });
  const [installedCount, setInstalledCount] = useState(0);
  const [discardedCount, setDiscardedCount] = useState(0);
  const [sessionData, setSessionData] = useState<SessionData>({
    sessionId: new Date().toISOString(),
    depthMax: 1,
    installs: [],
    mutes: [],
    anchors: [{trigger: "Breath", action: "Shoulders Drop"}],
    microMission: {
      type: "vow",
      durationSec: 60,
      completed: false
    },
    nextHook: {
      trigger: "device_unlock",
      window: "08:00-22:00", 
      mode: "voice",
      cooldownMin: 120
    }
  });
  const [autoReminder, setAutoReminder] = useState(true);
  const dragStartRef = useRef({ x: 0, y: 0 });

  // Breathing animation
  useEffect(() => {
    const interval = setInterval(() => {
      setBreathPhase(prev => (prev + 1) % 120); // 4 second cycle
    }, 33);
    return () => clearInterval(interval);
  }, []);

  // Timer countdown
  useEffect(() => {
    if (phase === 'DEEPEN') {
      const interval = setInterval(() => {
        setTimer(prev => {
          if (prev <= 1) {
            setPhase('INTEGRATE');
            return 0;
          }
          return prev - 1;
        });
      }, 1000);
      return () => clearInterval(interval);
    }
  }, [phase]);

  // Mission timer countdown
  useEffect(() => {
    if (phase === 'REWARD') {
      const interval = setInterval(() => {
        setMissionTimer(prev => {
          if (prev <= 1) {
            setSessionData(prev => ({
              ...prev,
              microMission: { ...prev.microMission, completed: true }
            }));
            setPhase('EXIT');
            return 0;
          }
          return prev - 1;
        });
      }, 1000);
      return () => clearInterval(interval);
    }
  }, [phase]);

  // Auto-transition to INTEGRATE when cards are done
  useEffect(() => {
    if (currentCards.length === 0 && phase === 'DEEPEN') {
      setPhase('INTEGRATE');
    }
  }, [currentCards.length, phase]);

  // Update session data when installs/discards change
  useEffect(() => {
    setSessionData(prev => ({
      ...prev,
      depthMax: depth,
      installs: installedCount > 0 ? ["Confidence", "Focus"].slice(0, installedCount) : [],
      mutes: discardedCount > 0 ? ["Fear: Rejection"].slice(0, discardedCount) : []
    }));
  }, [installedCount, discardedCount, depth]);

  const breathScale = 1 + Math.sin(breathPhase * 0.05) * 0.05;
  const breathOpacity = 0.6 + Math.sin(breathPhase * 0.05) * 0.2;

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  const handleMouseDown = (e: React.MouseEvent, cardId: string) => {
    setDraggedCard(cardId);
    dragStartRef.current = { x: e.clientX, y: e.clientY };
    setDragOffset({ x: 0, y: 0 });
  };

  const handleMouseMove = (e: React.MouseEvent) => {
    if (draggedCard) {
      const deltaX = e.clientX - dragStartRef.current.x;
      const deltaY = e.clientY - dragStartRef.current.y;
      setDragOffset({ x: deltaX, y: deltaY });
    }
  };

  const handleMouseUp = () => {
    if (draggedCard && Math.abs(dragOffset.x) > 100) {
      const card = currentCards.find(c => c.id === draggedCard);
      if (card) {
        if (dragOffset.x > 0) {
          // Swipe right - Accept/Install
          setInstalledCount(prev => prev + 1);
          setDepth(prev => Math.min(prev + 1, 5));
        } else {
          // Swipe left - Discard
          setDiscardedCount(prev => prev + 1);
        }
        
        // Remove card from stack
        setCurrentCards(prev => prev.filter(c => c.id !== draggedCard));
      }
    }
    
    setDraggedCard(null);
    setDragOffset({ x: 0, y: 0 });
  };

  const skipCard = () => {
    if (currentCards.length > 0) {
      setCurrentCards(prev => prev.slice(1));
    }
  };

  const startMicroMission = () => {
    setPhase('REWARD');
    setMissionTimer(60);
  };

  const returnToLobby = () => {
    setPhase('EXIT');
    setTimeout(() => {
      onComplete();
    }, 2000);
  };

  // INTEGRATION PHASE
  if (phase === 'INTEGRATE') {
    return (
      <div className="min-h-screen bg-black relative overflow-hidden">
        {/* Background */}
        <div className="fixed inset-0">
          <div className="absolute inset-0 bg-gradient-to-br from-teal-950/30 via-black to-purple-950/20" />
        </div>

        {/* Floating orb at top */}
        <div className="absolute top-8 left-1/2 transform -translate-x-1/2 z-10">
          <div 
            className="relative w-12 h-12 animate-bounce"
            style={{ animationDuration: '3s' }}
          >
            <div className="absolute inset-0 rounded-full bg-gradient-to-r from-teal-400/40 via-blue-500/40 to-orange-400/40 blur-xl" />
            <div className="relative w-full h-full rounded-full bg-gradient-to-br from-teal-400/80 via-blue-500/60 to-orange-400/80 border border-white/20" />
          </div>
        </div>

        <div className="relative z-10 px-4 pt-20 pb-4">
          {/* Header */}
          <div className="text-center mb-4">
            <h1 className="text-white text-xl font-light mb-1">Session Complete</h1>
            <p className="text-teal-400 text-xs">
              {sessionData.installs.length} beliefs installed • {sessionData.mutes.length} fear released
            </p>
          </div>

          {/* Depth meter - frozen */}
          <div className="w-full max-w-xs mx-auto mb-4">
            <div className="flex justify-between items-center mb-1">
              <span className="text-teal-400 text-xs font-medium">L1</span>
              <span className="text-teal-400 text-xs font-medium">L{sessionData.depthMax}</span>
            </div>
            <div className="relative h-1.5 bg-white/10 rounded-full overflow-hidden">
              <div 
                className="absolute left-0 top-0 h-full bg-gradient-to-r from-teal-400 to-orange-400 rounded-full"
                style={{ width: `${(sessionData.depthMax / 5) * 100}%` }}
              />
            </div>
            <p className="text-center text-teal-400/80 text-xs mt-1">Save & Anchor</p>
          </div>

          {/* Integration chips */}
          <div className="space-y-2 mb-4">
            {sessionData.installs.map((install, i) => (
              <div key={i} className="bg-green-500/20 border border-green-500/40 rounded-lg p-3 flex items-center justify-between">
                <div className="flex items-center space-x-2">
                  <Check size={14} className="text-green-400" />
                  <span className="text-white text-sm font-medium">{install} — Locked in</span>
                </div>
                <div className="flex space-x-2">
                  <button className="text-green-400/80 hover:text-green-400 p-1">
                    <Pin size={12} />
                  </button>
                  <button className="text-white/60 hover:text-white/80 p-1">
                    <Undo2 size={12} />
                  </button>
                </div>
              </div>
            ))}
            
            {sessionData.mutes.map((mute, i) => (
              <div key={i} className="bg-red-500/20 border border-red-500/40 rounded-lg p-3 flex items-center justify-between">
                <div className="flex items-center space-x-2">
                  <VolumeX size={14} className="text-red-400" />
                  <span className="text-white text-sm font-medium">{mute} — Turned down</span>
                </div>
                <div className="flex space-x-2">
                  <button className="text-red-400/80 hover:text-red-400 p-1">
                    <Edit size={12} />
                  </button>
                </div>
              </div>
            ))}

            {sessionData.anchors.map((anchor, i) => (
              <div key={i} className="bg-blue-500/20 border border-blue-500/40 rounded-lg p-3 flex items-center justify-between">
                <div className="flex items-center space-x-2">
                  <div className="w-3 h-3 bg-blue-400 rounded-full" />
                  <span className="text-white text-sm font-medium">
                    When you {anchor.trigger.toLowerCase()}, your {anchor.action.toLowerCase()}. That's the signal.
                  </span>
                </div>
                <button className="text-blue-400/80 hover:text-blue-400 p-1">
                  <Edit size={12} />
                </button>
              </div>
            ))}
          </div>

          {/* Micro-mission card */}
          <div className="bg-gradient-to-br from-orange-500/20 via-teal-500/20 to-purple-500/20 border border-white/20 rounded-xl p-4 mb-4">
            <h3 className="text-white text-base font-semibold mb-1">Micro-mission: 60 seconds</h3>
            <p className="text-white/80 text-xs mb-3 leading-relaxed">
              Stand, shoulders back. Breathe 4–4. Whisper the new line: "I move first."
            </p>
            <button 
              onClick={startMicroMission}
              className="w-full py-3 bg-gradient-to-r from-orange-400 to-teal-400 rounded-lg text-black font-semibold text-sm hover:scale-105 transition-transform duration-200"
            >
              Do it now (60s)
            </button>
          </div>

          {/* Reminder settings */}
          <div className="flex items-center justify-center text-xs">
            <div className="flex items-center space-x-3">
              <button 
                onClick={() => setAutoReminder(!autoReminder)}
                className={`flex items-center space-x-1 px-2 py-1 rounded-md transition-colors ${
                  autoReminder ? 'bg-teal-500/20 text-teal-400' : 'bg-white/10 text-white/60'
                }`}
              >
                <Bell size={12} />
                <span>Auto-remind: {autoReminder ? 'On' : 'Off'}</span>
              </button>
              
              <div className="flex items-center space-x-1 text-white/60">
                <Smartphone size={12} />
                <span>Trigger: Unlock</span>
              </div>
              
              <div className="flex items-center space-x-1 text-white/60">
                <Clock size={12} />
                <span>Voice prompt</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // REWARD PHASE - Mission Timer
  if (phase === 'REWARD') {
    const progress = ((60 - missionTimer) / 60) * 100;
    const circumference = 2 * Math.PI * 120;
    const strokeDashoffset = circumference - (progress / 100) * circumference;

    return (
      <div className="min-h-screen bg-black flex items-center justify-center relative overflow-hidden">
        {/* Breathing background */}
        <div 
          className="fixed inset-0 bg-gradient-to-br from-orange-500/10 via-teal-500/10 to-purple-500/10 transition-opacity duration-1000"
          style={{ opacity: 0.6 + Math.sin(breathPhase * 0.05) * 0.3 }}
        />

        <div className="text-center">
          {/* Timer ring */}
          <div className="relative w-64 h-64 mb-8">
            <svg className="w-full h-full transform -rotate-90" viewBox="0 0 256 256">
              <circle
                cx="128"
                cy="128"
                r="120"
                fill="none"
                stroke="rgba(255,255,255,0.1)"
                strokeWidth="8"
              />
              <circle
                cx="128"
                cy="128"
                r="120"
                fill="none"
                stroke="url(#timerGradient)"
                strokeWidth="8"
                strokeLinecap="round"
                strokeDasharray={circumference}
                strokeDashoffset={strokeDashoffset}
                className="transition-all duration-1000"
              />
              <defs>
                <linearGradient id="timerGradient" x1="0%" y1="0%" x2="100%" y2="100%">
                  <stop offset="0%" stopColor="#f59e0b" />
                  <stop offset="50%" stopColor="#14b8a6" />
                  <stop offset="100%" stopColor="#8b5cf6" />
                </linearGradient>
              </defs>
            </svg>
            
            {/* Timer text */}
            <div className="absolute inset-0 flex items-center justify-center">
              <div className="text-center">
                <div className="text-white text-4xl font-light mb-2">{missionTimer}</div>
                <div className="text-white/60 text-sm">seconds</div>
              </div>
            </div>
          </div>

          <h2 className="text-white text-xl font-light mb-4">Move first</h2>
          <p className="text-white/80 text-sm max-w-sm mx-auto leading-relaxed">
            Stand, shoulders back. Breathe 4–4. Whisper: "I move first."
          </p>
        </div>
      </div>
    );
  }

  // EXIT PHASE - Completion
  if (phase === 'EXIT') {
    return (
      <div className="min-h-screen bg-black flex items-center justify-center relative overflow-hidden">
        {/* Confetti effect */}
        <div className="fixed inset-0 pointer-events-none">
          {Array.from({ length: 20 }).map((_, i) => (
            <div
              key={i}
              className="absolute w-2 h-2 bg-gradient-to-r from-orange-400 to-teal-400 rounded-full animate-bounce"
              style={{
                left: `${Math.random() * 100}%`,
                top: `${Math.random() * 100}%`,
                animationDelay: `${Math.random() * 2}s`,
                animationDuration: `${1 + Math.random()}s`
              }}
            />
          ))}
        </div>

        <div className="text-center">
          {/* Success orb */}
          <div className="relative w-32 h-32 mx-auto mb-8">
            <div className="absolute inset-0 rounded-full bg-gradient-to-r from-green-400 via-teal-400 to-blue-400 animate-pulse blur-xl" />
            <div className="relative w-full h-full rounded-full bg-gradient-to-br from-green-400/80 via-teal-400/80 to-blue-400/80 flex items-center justify-center">
              <Check size={48} className="text-black" />
            </div>
          </div>

          <h2 className="text-white text-2xl font-light mb-4">Mission Complete</h2>
          <p className="text-teal-400 text-sm mb-8">
            Next nudge when you unlock your phone
          </p>

          <button 
            onClick={returnToLobby}
            className="px-8 py-3 bg-white/10 hover:bg-white/20 border border-white/20 rounded-full text-white font-medium transition-all duration-300"
          >
            Return to Lobby
          </button>
        </div>
      </div>
    );
  }

  // DEEPEN PHASE (original interface)
  return (
    <div 
      className="relative overflow-hidden px-6 pt-8"
      onMouseMove={handleMouseMove}
      onMouseUp={handleMouseUp}
    >

      {/* Main content area */}
      <div className="relative z-10 flex flex-col items-center justify-center px-6 pt-8 pb-24">
        
        {/* Card stack */}
        <div className="relative w-full max-w-sm mb-12">
          {currentCards.length > 0 && (
            currentCards.slice(0, 3).map((card, index) => {
              const isTop = index === 0;
              const isDragged = draggedCard === card.id;
              const rotation = isDragged ? dragOffset.x * 0.1 : 0;
              const scale = isDragged ? 1.05 : 1 - (index * 0.02);
              const zIndex = currentCards.length - index;
              
              return (
                <div
                  key={card.id}
                  className={`absolute inset-0 cursor-grab active:cursor-grabbing transition-all duration-200 ${card.glowColor}`}
                  style={{
                    transform: `
                      translateX(${isDragged ? dragOffset.x : index * 2}px) 
                      translateY(${isDragged ? dragOffset.y : index * 4}px) 
                      rotate(${rotation}deg) 
                      scale(${scale})
                    `,
                    zIndex,
                    opacity: isDragged ? 0.9 : 1 - (index * 0.1)
                  }}
                  onMouseDown={(e) => isTop ? handleMouseDown(e, card.id) : undefined}
                >
                  <div 
                    className={`w-full h-48 rounded-2xl bg-gradient-to-br ${card.color} backdrop-blur-md border border-white/10 p-6 relative overflow-hidden`}
                    style={{
                      boxShadow: `0 8px 32px rgba(0, 0, 0, 0.3), 0 0 20px ${card.glowColor.includes('amber') ? '#f59e0b' : card.glowColor.includes('red') ? '#ef4444' : card.glowColor.includes('pink') ? '#ec4899' : '#06b6d4'}20`
                    }}
                  >
                    {/* Swipe indicators */}
                    {isDragged && (
                      <>
                        <div 
                          className="absolute top-4 right-4 text-green-400 font-bold text-lg opacity-0 transition-opacity duration-200"
                          style={{ opacity: dragOffset.x > 50 ? 1 : 0 }}
                        >
                          INSTALL
                        </div>
                        <div 
                          className="absolute top-4 left-4 text-red-400 font-bold text-lg opacity-0 transition-opacity duration-200"
                          style={{ opacity: dragOffset.x < -50 ? 1 : 0 }}
                        >
                          DISCARD
                        </div>
                      </>
                    )}
                    
                    {/* Card content */}
                    <div className="flex items-start space-x-4">
                      <div className="w-10 h-10 rounded-full bg-black/20 backdrop-blur-sm border border-white/20 flex items-center justify-center flex-shrink-0">
                        {card.icon}
                      </div>
                      <div className="flex-1">
                        <h3 className="text-white font-semibold text-lg mb-3">
                          {card.title}
                        </h3>
                        <p className="text-white/80 text-sm leading-relaxed">
                          {card.content}
                        </p>
                      </div>
                    </div>
                    
                    {/* Subtle breathing glow */}
                    <div 
                      className="absolute inset-0 rounded-2xl bg-gradient-to-br from-white/5 to-transparent pointer-events-none"
                      style={{ opacity: breathOpacity * 0.3 }}
                    />
                  </div>
                </div>
              );
            })
          )}
        </div>

        {/* Depth meter */}
        <div className="w-full max-w-sm mb-8">
          <div className="flex justify-between items-center mb-2">
            <span className="text-teal-400 text-sm font-medium">L1</span>
            <span className="text-teal-400 text-sm font-medium">L5</span>
          </div>
          <div className="relative h-2 bg-white/10 rounded-full overflow-hidden">
            <div 
              className="absolute left-0 top-0 h-full bg-gradient-to-r from-teal-400 to-orange-400 rounded-full transition-all duration-500"
              style={{ width: `${(depth / 5) * 100}%` }}
            />
            {/* Depth indicators */}
            {[1, 2, 3, 4, 5].map((level) => (
              <div
                key={level}
                className={`absolute top-0 w-0.5 h-full transition-colors duration-300 ${
                  depth >= level ? 'bg-white/60' : 'bg-white/20'
                }`}
                style={{ left: `${((level - 1) / 4) * 100}%` }}
              />
            ))}
          </div>
        </div>

        {/* Go deeper prompt */}
        <div className="text-center mb-8">
          <p 
            className={`text-lg font-light tracking-wide transition-opacity duration-300 ${
              currentCards.length === 0 ? 'text-orange-400/80' : 'text-teal-400/80'
            }`}
            style={{ opacity: breathOpacity }}
          >
            {currentCards.length === 0 ? 'Integrating...' : 'Go deeper...'}
          </p>
        </div>
      </div>

      {/* Bottom controls */}
      <div className="fixed bottom-32 left-0 right-0 flex justify-between items-center px-6 z-20">
        <button 
          onClick={skipCard}
          className="text-teal-400/80 hover:text-teal-400 transition-colors text-lg font-medium flex items-center space-x-2"
          disabled={currentCards.length === 0}
        >
          <span>Skip</span>
        </button>
        
        <div className="text-teal-400 text-lg font-mono">
          {formatTime(timer)}
        </div>
      </div>

      {/* Swipe instructions (fade out after first interaction) */}
      {installedCount === 0 && discardedCount === 0 && phase === 'DEEPEN' && (
        <div className="fixed bottom-44 left-0 right-0 text-center z-10">
          <div className="text-white/40 text-sm">
            Swipe right to embrace • Swipe left to release • Talk to your AI guide
          </div>
        </div>
      )}
    </div>
  );
}