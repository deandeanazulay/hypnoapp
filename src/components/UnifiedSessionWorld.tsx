import React, { useState, useEffect, useRef } from 'react';
import { X, Mic, MicOff, Volume2, VolumeX, MessageCircle, Brain, Play, Pause } from 'lucide-react';
import WebGLOrb from './WebGLOrb';
import { useGameState } from './GameStateManager';

interface UnifiedSessionWorldProps {
  onComplete: () => void;
  onCancel: () => void;
}

type SessionPhase = 'preparation' | 'induction' | 'deepening' | 'transformation' | 'integration' | 'complete';

interface SessionState {
  phase: SessionPhase;
  depth: number;
  breathing: 'inhale' | 'hold' | 'exhale' | 'rest';
  isListening: boolean;
  isSpeaking: boolean;
  timer: number;
  phaseProgress: number;
}

interface ChatMessage {
  role: 'ai' | 'user';
  content: string;
  timestamp: number;
}

export default function UnifiedSessionWorld({ onComplete, onCancel }: UnifiedSessionWorldProps) {
  const { user, updateUserState, completeSession } = useGameState();
  const [sessionState, setSessionState] = useState<SessionState>({
    phase: 'preparation',
    depth: 1,
    breathing: 'rest',
    isListening: false,
    isSpeaking: false,
    timer: 0,
    phaseProgress: 0
  });

  const [conversation, setConversation] = useState<ChatMessage[]>([]);
  const [isVoiceEnabled, setIsVoiceEnabled] = useState(true);
  const [isMicEnabled, setIsMicEnabled] = useState(true);
  const [breathPhase, setBreathPhase] = useState(0);
  const [lastAIMessageTime, setLastAIMessageTime] = useState(0);
  const [currentCards, setCurrentCards] = useState([
    { id: '1', type: 'belief', title: 'I am confident', content: 'I trust in my abilities and speak my truth' },
    { id: '2', type: 'fear', title: 'Fear of rejection', content: 'What if others judge me negatively?' },
    { id: '3', type: 'desire', title: 'Inner peace', content: 'I want to feel calm and centered always' }
  ]);

  const recognitionRef = useRef<any>(null);
  const synthRef = useRef<SpeechSynthesis | null>(null);
  const orbRef = useRef<any>(null);

  // Initialize speech systems
  useEffect(() => {
    if (typeof window !== 'undefined') {
      synthRef.current = window.speechSynthesis;
      
      if ('webkitSpeechRecognition' in window || 'SpeechRecognition' in window) {
        const SpeechRecognition = (window as any).webkitSpeechRecognition || (window as any).SpeechRecognition;
        recognitionRef.current = new SpeechRecognition();
        recognitionRef.current.continuous = true;
        recognitionRef.current.interimResults = true;
        recognitionRef.current.lang = 'en-US';

        recognitionRef.current.onresult = (event: any) => {
          const transcript = Array.from(event.results)
            .map((result: any) => result[0])
            .map((result: any) => result.transcript)
            .join('');

          if (event.results[event.results.length - 1].isFinal) {
            handleUserSpeech(transcript);
          }
        };
      }
    }
  }, []);

  // Breathing animation
  useEffect(() => {
    const interval = setInterval(() => {
      setBreathPhase(prev => (prev + 1) % 240); // 8 second cycle
    }, 33);
    return () => clearInterval(interval);
  }, []);

  // Continuous AI guidance - never stops talking
  useEffect(() => {
    const continuousGuidance = () => {
      const now = Date.now();
      const timeSinceLastMessage = now - lastAIMessageTime;
      
      // Send new AI message every 8-15 seconds if no recent activity
      if (timeSinceLastMessage > 8000 && !sessionState.isSpeaking && !sessionState.isListening) {
        const guidance = generateContinuousGuidance(sessionState.phase, sessionState.timer);
        
        setConversation(prev => [...prev, { 
          role: 'ai', 
          content: guidance, 
          timestamp: now 
        }]);
        
        if (isVoiceEnabled) {
          speakAI(guidance);
        }
        
        setLastAIMessageTime(now);
      }
    };

    const interval = setInterval(continuousGuidance, 2000); // Check every 2 seconds
    return () => clearInterval(interval);
  }, [sessionState.phase, sessionState.timer, sessionState.isSpeaking, sessionState.isListening, lastAIMessageTime, isVoiceEnabled]);

  // Session progression timer
  useEffect(() => {
    const interval = setInterval(() => {
      setSessionState(prev => {
        const newTimer = prev.timer + 1;
        let newPhase = prev.phase;
        let newProgress = prev.phaseProgress;
        let newDepth = prev.depth;

        // Phase progression logic
        switch (prev.phase) {
          case 'preparation':
            if (newTimer >= 30) {
              newPhase = 'induction';
              newProgress = 0;
              const message = "Perfect. Now we begin the induction. Follow my voice and let yourself relax deeply...";
              speakAI(message);
              setConversation(prev => [...prev, { role: 'ai', content: message, timestamp: Date.now() }]);
              setLastAIMessageTime(Date.now());
            }
            break;
          case 'induction':
            if (newTimer >= 180) { // 3 minutes
              newPhase = 'deepening';
              newProgress = 0;
              newDepth = Math.min(prev.depth + 1, 5);
              const message = "Excellent. You're going deeper now. Let's work with what's in your mind...";
              speakAI(message);
              setConversation(prev => [...prev, { role: 'ai', content: message, timestamp: Date.now() }]);
              setLastAIMessageTime(Date.now());
            }
            break;
          case 'deepening':
            if (newTimer >= 480) { // 8 minutes total
              newPhase = 'transformation';
              newProgress = 0;
              newDepth = Math.min(prev.depth + 1, 5);
              speakAI("Beautiful. Now we transform what no longer serves you...");
            }
            break;
          case 'transformation':
            if (newTimer >= 720) { // 12 minutes total
              newPhase = 'integration';
              newProgress = 0;
              const message = "Perfect. Let's integrate these changes into your being...";
              speakAI(message);
              setConversation(prev => [...prev, { role: 'ai', content: message, timestamp: Date.now() }]);
              setLastAIMessageTime(Date.now());
            }
            break;
          case 'integration':
            if (newTimer >= 900) { // 15 minutes total
              newPhase = 'complete';
              newProgress = 100;
              const message = "Session complete. You've done beautiful work. These changes are now part of you.";
              speakAI(message);
              setConversation(prev => [...prev, { role: 'ai', content: message, timestamp: Date.now() }]);
              setLastAIMessageTime(Date.now());
              setTimeout(() => {
                completeSession('unified', newTimer);
                onComplete();
              }, 3000);
            }
            break;
        }

        // Update progress within phase
        const phaseTimers = {
          preparation: 30,
          induction: 150,
          deepening: 300,
          transformation: 240,
          integration: 180
        };
        
        const phaseTimer = phaseTimers[newPhase as keyof typeof phaseTimers] || 60;
        newProgress = Math.min((newTimer % phaseTimer) / phaseTimer * 100, 100);

        return {
          ...prev,
          timer: newTimer,
          phase: newPhase,
          phaseProgress: newProgress,
          depth: newDepth
        };
      });
    }, 1000);

    return () => clearInterval(interval);
  }, []);

  // Breathing cycle
  useEffect(() => {
    const breathingCycle = ['inhale', 'hold', 'exhale', 'rest'] as const;
    const durations = [4000, 2000, 6000, 2000]; // 4-2-6-2 relaxing pattern
    
    let currentIndex = 0;
    let breathingTimeout: NodeJS.Timeout;
    
    const cycleBreathing = () => {
      setSessionState(prev => ({ ...prev, breathing: breathingCycle[currentIndex] }));
      
      breathingTimeout = setTimeout(() => {
        currentIndex = (currentIndex + 1) % breathingCycle.length;
        cycleBreathing(); // Keep breathing guide running throughout
      }, durations[currentIndex]);
    };

    // Start breathing cycle immediately
    cycleBreathing();

    return () => {
      if (breathingTimeout) {
        clearTimeout(breathingTimeout);
      }
    };
  }, []); // Run once on mount

  // AI Response Generator
  const generateAIResponse = (userInput: string, phase: SessionPhase) => {
    const responses = {
      preparation: [
        "Focus your eyes on the center of the orb... follow the breathing rhythm if you like... and as you watch the spirals... notice how they pull your attention deeper and deeper inward...",
        "Good... now just watch the mathematical patterns... the golden ratio spirals... and you might notice your eyelids becoming heavy... that's perfectly natural...",
        "Perfect... the breathing will continue on its own... just focus on the center... watch the fractals... and let your conscious mind begin to fade away..."
      ],
      induction: [
        "Now... your eyes are locked on the center... completely absorbed... and with each spiral rotation... you go deeper... and deeper... into trance...",
        "The fractal patterns are hypnotizing you... pulling you into a deep... deep... trance state... your critical mind dissolving away...",
        "Perfect fixation... your unconscious mind is completely open now... receptive to change... as the mathematical patterns reprogram your neural pathways..."
      ],
      deepening: [
        "And now... in this deep, receptive state... your unconscious mind is completely open... ready to release what no longer serves you... and install new, empowering beliefs... what would you like to transform?",
        "Beautiful... you're accessing the deepest levels of your mind now... where real change happens... and you might be surprised at what insights emerge... what's coming up for you?",
        "Perfect depth... and your unconscious mind is now ready to do the work... to dissolve old patterns... and create new neural pathways... what beliefs are ready to shift?"
      ],
      transformation: [
        "Yes... I can sense the transformation happening now... old limiting beliefs dissolving... melting away... as new, empowering thoughts take their place... feel that shift...",
        "Beautiful... your unconscious mind is rewiring itself right now... creating new neural pathways of confidence and strength... notice how different you feel already...",
        "Excellent... the old patterns are completely gone now... replaced by powerful new beliefs... and you can feel this new strength becoming part of who you are..."
      ],
      integration: [
        "And now... these changes are integrating at the cellular level... becoming part of your DNA... your new normal... permanent and unshakeable...",
        "Perfect... these transformations are now hardwired into your nervous system... automatic responses... and you'll be amazed at how naturally you embody this new you...",
        "Beautiful integration... and when you return to full awareness... you'll carry these changes with you... stronger, more confident, completely transformed..."
      ]
    };

    const phaseResponses = responses[phase] || responses.preparation;
    return phaseResponses[Math.floor(Math.random() * phaseResponses.length)];
  };

  // Generate continuous guidance that flows naturally
  const generateContinuousGuidance = (phase: SessionPhase, timer: number) => {
    const continuousResponses = {
      preparation: [
        "That's it... just keep watching the center... notice how the spirals draw your attention deeper...",
        "Good... your breathing is becoming more natural... more relaxed... with each breath you take...",
        "Perfect... just let your eyes follow the patterns... and feel your body beginning to relax...",
        "Excellent... you're doing beautifully... just continue to focus on the center of the orb...",
        "Notice how your eyelids are becoming heavier... that's perfectly natural... just let it happen...",
        "Beautiful... you can feel yourself beginning to drift... deeper and deeper into relaxation..."
      ],
      induction: [
        "Deeper now... with each spiral rotation... you go deeper... and deeper... into trance...",
        "That's right... your conscious mind is fading away... and your unconscious mind is opening...",
        "Perfect... you're entering a beautiful state of deep relaxation... completely safe and comfortable...",
        "Excellent... the mathematical patterns are hypnotizing you... pulling you deeper into trance...",
        "Good... you can feel yourself going deeper... with each breath... with each spiral...",
        "Beautiful... your unconscious mind is now completely open... ready for positive change..."
      ],
      deepening: [
        "Now... in this deep state... your mind is completely receptive... ready for transformation...",
        "Perfect... you're accessing the deepest levels of your unconscious mind... where real change happens...",
        "Excellent... old limiting beliefs are beginning to dissolve... melting away like ice in warm water...",
        "Good... you can feel the old patterns releasing... making space for new, empowering beliefs...",
        "Beautiful... your unconscious mind is rewiring itself... creating new neural pathways of strength...",
        "That's right... deep healing is happening now... at the cellular level... permanent and lasting..."
      ],
      transformation: [
        "Yes... the transformation is happening now... old fears dissolving completely...",
        "Perfect... new confidence is flowing through every cell of your being... strong and unshakeable...",
        "Excellent... you can feel the shift... the old you melting away... the new you emerging...",
        "Beautiful... these changes are becoming part of your DNA... your new normal...",
        "Good... the transformation is complete... you are becoming who you were meant to be...",
        "That's right... feel the power flowing through you... this is your true self emerging..."
      ],
      integration: [
        "Now... these changes are integrating at the deepest level... becoming permanent...",
        "Perfect... your new beliefs are hardwiring into your nervous system... automatic responses...",
        "Excellent... when you return to full awareness... you'll carry this transformation with you...",
        "Beautiful... these changes are now part of who you are... unshakeable and permanent...",
        "Good... you can feel the integration happening... in every cell... every fiber of your being...",
        "That's right... you are transformed... stronger... more confident... completely renewed..."
      ]
    };

    const phaseResponses = continuousResponses[phase] || continuousResponses.preparation;
    return phaseResponses[Math.floor(Math.random() * phaseResponses.length)];
  };

  const handleUserSpeech = (transcript: string) => {
    const timestamp = Date.now();
    setConversation(prev => [...prev, { role: 'user', content: transcript, timestamp }]);
    setLastAIMessageTime(timestamp);
    
    setTimeout(() => {
      const aiResponse = generateAIResponse(transcript, sessionState.phase);
      setConversation(prev => [...prev, { role: 'ai', content: aiResponse, timestamp: timestamp + 1000 }]);
      setLastAIMessageTime(timestamp + 1000);
      if (isVoiceEnabled) {
        speakAI(aiResponse);
      }
    }, 1000);

    setSessionState(prev => ({ ...prev, isListening: false }));
  };

  const speakAI = (text: string) => {
    if (!synthRef.current || !isVoiceEnabled) return;

    // Don't cancel if it's a short breathing instruction
    const isBreathingInstruction = ['Inhale', 'Hold', 'Exhale', 'Rest'].includes(text);
    if (!isBreathingInstruction) {
      synthRef.current.cancel();
    }
    
    const utterance = new SpeechSynthesisUtterance(text);
    
    // Different settings for breathing vs conversation
    if (isBreathingInstruction) {
      utterance.rate = 0.8;
      utterance.pitch = 0.9;
      utterance.volume = 0.6; // Softer for breathing cues
    } else {
      utterance.rate = 0.7;
      utterance.pitch = 0.8;
      utterance.volume = 0.8;
    }

    utterance.onstart = () => setSessionState(prev => ({ ...prev, isSpeaking: true }));
    utterance.onend = () => {
      // Only clear speaking state for non-breathing instructions
      if (!isBreathingInstruction) {
        setSessionState(prev => ({ ...prev, isSpeaking: false }));
      }
    };

    synthRef.current.speak(utterance);
  };

  const toggleListening = () => {
    if (!recognitionRef.current) return;

    if (sessionState.isListening) {
      recognitionRef.current.stop();
      setSessionState(prev => ({ ...prev, isListening: false }));
    } else {
      recognitionRef.current.start();
      setSessionState(prev => ({ ...prev, isListening: true }));
    }
  };

  // Auto-start AI guidance
  useEffect(() => {
    if (conversation.length === 0) {
      setTimeout(() => {
        const welcomeMessage = "Focus your eyes on the center of the orb... you can follow the breathing guide if you like... and as you watch the spirals... notice how they draw your attention deeper and deeper inward... your eyelids may begin to feel heavy... that's perfectly natural...";
        setConversation([{ role: 'ai', content: welcomeMessage, timestamp: Date.now() }]);
        setLastAIMessageTime(Date.now());
        if (isVoiceEnabled) {
          speakAI(welcomeMessage);
        }
      }, 2000);
    }
  }, [isVoiceEnabled]);

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  const getPhaseColor = () => {
    switch (sessionState.phase) {
      case 'preparation': return 'from-blue-400 to-cyan-400';
      case 'induction': return 'from-purple-400 to-blue-400';
      case 'deepening': return 'from-teal-400 to-green-400';
      case 'transformation': return 'from-orange-400 to-red-400';
      case 'integration': return 'from-green-400 to-teal-400';
      case 'complete': return 'from-gold-400 to-yellow-400';
      default: return 'from-teal-400 to-blue-400';
    }
  };

  return (
    <div className="h-screen bg-black relative overflow-hidden flex flex-col">
      {/* Dynamic background based on phase */}
      <div className="fixed inset-0">
        <div className={`absolute inset-0 bg-gradient-to-br ${
          sessionState.phase === 'preparation' ? 'from-blue-950/20 via-black to-cyan-950/20' :
          sessionState.phase === 'induction' ? 'from-purple-950/20 via-black to-blue-950/20' :
          sessionState.phase === 'deepening' ? 'from-teal-950/20 via-black to-green-950/20' :
          sessionState.phase === 'transformation' ? 'from-orange-950/20 via-black to-red-950/20' :
          sessionState.phase === 'integration' ? 'from-green-950/20 via-black to-teal-950/20' :
          'from-gold-950/20 via-black to-yellow-950/20'
        }`} />
        
        {/* Breathing glow effect */}
        <div 
          className="absolute inset-0 transition-opacity duration-1000"
          style={{
            background: `radial-gradient(circle at center, rgba(20, 184, 166, ${0.1 + Math.sin(breathPhase * 0.026) * 0.05}) 0%, transparent 70%)`,
            opacity: sessionState.phase !== 'complete' ? 1 : 0
          }}
        />
      </div>

      {/* Exit button */}
      <button 
        onClick={onCancel}
        className="absolute top-2 right-2 z-30 w-7 h-7 sm:w-10 sm:h-10 sm:top-6 sm:right-6 rounded-full bg-black/40 backdrop-blur-md border border-white/20 flex items-center justify-center text-white/80 hover:text-white hover:bg-black/60 transition-all duration-300"
      >
        <X size={14} className="sm:w-5 sm:h-5" />
      </button>

      {/* Main content - Mobile-first flexbox */}
      <div className="relative z-10 flex-1 flex flex-col p-2 sm:p-4 min-h-0">
        
        {/* Top HUD - Phase & Progress - Compact on mobile */}
        <div className="flex items-center justify-between mb-2 sm:mb-4 flex-shrink-0">
          <div className="text-left">
            <h2 className="text-white text-base sm:text-lg font-light capitalize tracking-wide">
              {sessionState.phase.replace('_', ' ')}
            </h2>
            <p className="text-white/60 text-xs sm:text-sm">
              Depth L{Math.floor(sessionState.depth)} • {formatTime(sessionState.timer)}
            </p>
          </div>
          
          {/* Phase progress bar */}
          <div className="w-24 sm:w-32">
            <div className="h-1 sm:h-1 bg-white/10 rounded-full overflow-hidden">
              <div 
                className={`h-full bg-gradient-to-r ${getPhaseColor()} rounded-full transition-all duration-1000`}
                style={{ width: `${sessionState.phaseProgress}%` }}
              />
            </div>
            <p className="text-white/40 text-xs text-center mt-1">
              {Math.floor(sessionState.phaseProgress)}%
            </p>
          </div>
        </div>

        {/* Center - Orb & Content - Flexible mobile layout */}
        <div className="flex-1 flex flex-col lg:grid lg:grid-cols-3 lg:gap-6 w-full max-w-7xl mx-auto min-h-0 overflow-hidden lg:items-start lg:h-full">
            
            {/* Left Column - AI Conversation */}
            <div className="hidden lg:flex lg:flex-col lg:h-full">
              <div className="bg-black/40 backdrop-blur-md rounded-2xl p-6 border border-white/10 flex-1 flex flex-col min-h-0">
                <h3 className="text-white text-lg font-medium mb-4 flex items-center flex-shrink-0">
                  <Brain size={20} className="mr-3" />
                  AI Guide
                </h3>
                <div className="flex-1 overflow-y-auto space-y-4 min-h-0">
                  {conversation.slice(-4).map((msg, i) => (
                    <div key={i} className={`p-3 rounded-lg ${
                      msg.role === 'ai' 
                        ? 'bg-teal-500/10 border border-teal-500/20 text-teal-300' 
                        : 'bg-white/5 border border-white/10 text-white'
                    }`}>
                      <div className="text-xs opacity-70 mb-2 font-medium uppercase tracking-wide">
                        {msg.role === 'ai' ? 'AI' : 'You'}
                      </div>
                      <p className="text-sm leading-relaxed">{msg.content}</p>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            {/* Center Column - Orb */}
            <div className="flex-1 flex items-center justify-center lg:h-full relative min-h-0 py-2 sm:py-4">
              {/* Eye fixation instruction overlay */}
              {sessionState.phase === 'preparation' && (
                <div className="absolute inset-0 flex items-center justify-center z-20 pointer-events-none lg:top-1/3">
                  <div className="text-center">
                    <div className="w-3 h-3 bg-white rounded-full animate-pulse mb-3 mx-auto" />
                    <p className="text-white/80 text-base lg:text-lg font-light tracking-wide">
                      Focus on the center
                    </p>
                  </div>
                </div>
              )}
              
             {/* Mobile Breathing Guide - Compact overlay */}
             <div className="absolute top-2 left-2 lg:hidden z-10">
               <div className="bg-black/60 backdrop-blur-md rounded-lg p-2 border border-white/20">
                 <div className="flex items-center space-x-2">
                   {/* Breathing circle indicator */}
                   <div className="relative w-6 h-6">
                     <div 
                       className={`absolute inset-0 rounded-full border transition-all duration-1000 ${
                         sessionState.breathing === 'inhale' ? 'border-teal-400 scale-125 border-2' :
                         sessionState.breathing === 'hold' ? 'border-yellow-400 scale-125 border-2' :
                         sessionState.breathing === 'exhale' ? 'border-orange-400 scale-75 border-2' :
                         'border-white/40 scale-100 border-1'
                       }`}
                     />
                     <div 
                       className={`absolute inset-1 rounded-full transition-all duration-1000 ${
                         sessionState.breathing === 'inhale' ? 'bg-teal-400/40 scale-125' :
                         sessionState.breathing === 'hold' ? 'bg-yellow-400/40 scale-125' :
                         sessionState.breathing === 'exhale' ? 'bg-orange-400/40 scale-75' :
                         'bg-white/20 scale-100'
                       }`}
                     />
                   </div>
                   
                   {/* Breathing text */}
                   <div className="text-xs">
                     <div className={`font-medium capitalize transition-colors duration-300 ${
                       sessionState.breathing === 'inhale' ? 'text-teal-400' :
                       sessionState.breathing === 'hold' ? 'text-yellow-400' :
                       sessionState.breathing === 'exhale' ? 'text-orange-400' : 'text-white/60'
                     }`}>
                       {sessionState.breathing}
                     </div>
                     <div className="text-white/40 text-xs">
                       {sessionState.breathing === 'inhale' ? '4s' :
                        sessionState.breathing === 'hold' ? '2s' :
                        sessionState.breathing === 'exhale' ? '6s' : '2s'}
                     </div>
                   </div>
                 </div>
               </div>
             </div>
             
              {/* Responsive orb sizing */}
              <WebGLOrb 
                ref={orbRef}
                onTap={() => {}}
                breathPhase={sessionState.breathing}
                size={typeof window !== 'undefined' && window.innerWidth >= 1024 ? 320 : 180}
                afterglow={sessionState.phase !== 'preparation'}
              />
            </div>

            {/* Right Column - Phase Content */}
            <div className="hidden lg:flex lg:flex-col lg:h-full">
              <div className="bg-black/40 backdrop-blur-md rounded-2xl p-6 border border-white/10 flex-1 flex flex-col min-h-0">
                {sessionState.phase === 'deepening' || sessionState.phase === 'transformation' ? (
                  <div className="flex flex-col h-full">
                    <h3 className="text-white text-lg font-medium mb-4 flex-shrink-0">Transformation Work</h3>
                    <div className="flex-1 space-y-3 overflow-y-auto min-h-0">
                      {currentCards.slice(0, 2).map((card, i) => (
                        <div key={card.id} className="bg-white/5 rounded-lg p-4 border border-white/10 hover:bg-white/10 transition-colors">
                          <h4 className="text-white text-base font-medium mb-2">{card.title}</h4>
                          <p className="text-white/70 text-sm leading-relaxed">{card.content}</p>
                        </div>
                      ))}
                    </div>
                  </div>
                ) : sessionState.phase === 'integration' ? (
                  <div className="flex flex-col h-full">
                    <h3 className="text-white text-lg font-medium mb-4 flex-shrink-0">Integration</h3>
                    <div className="flex-1 space-y-3 overflow-y-auto min-h-0">
                      <div className="bg-green-500/20 rounded-lg p-4 border border-green-500/40">
                        <p className="text-green-400 text-base font-medium">✓ Confidence installed</p>
                      </div>
                      <div className="bg-blue-500/20 rounded-lg p-4 border border-blue-500/40">
                        <p className="text-blue-400 text-base font-medium">⚓ Breath → Calm anchor</p>
                      </div>
                    </div>
                  </div>
                ) : (
                  <div className="flex flex-col h-full">
                    <h3 className="text-white text-lg font-medium mb-4 flex-shrink-0">Breathing Guide</h3>
                    <div className="flex-1 flex flex-col items-center justify-center space-y-6">
                      {/* Visual breathing indicator */}
                      <div className="relative w-32 h-32 mx-auto">
                        <div 
                          className={`absolute inset-0 rounded-full border-3 transition-all duration-1000 ${
                            sessionState.breathing === 'inhale' ? 'border-teal-400 scale-110' :
                            sessionState.breathing === 'hold' ? 'border-yellow-400 scale-110' :
                            sessionState.breathing === 'exhale' ? 'border-orange-400 scale-90' :
                            'border-white/40 scale-100'
                          }`}
                        />
                        <div 
                          className={`absolute inset-3 rounded-full transition-all duration-1000 ${
                            sessionState.breathing === 'inhale' ? 'bg-teal-400/30 scale-110' :
                            sessionState.breathing === 'hold' ? 'bg-yellow-400/30 scale-110' :
                            sessionState.breathing === 'exhale' ? 'bg-orange-400/30 scale-90' :
                            'bg-white/10 scale-100'
                          }`}
                        />
                      </div>
                      
                      <div className={`text-3xl font-light capitalize transition-colors duration-300 ${
                        sessionState.breathing === 'inhale' ? 'text-teal-400' :
                        sessionState.breathing === 'hold' ? 'text-yellow-400' :
                        sessionState.breathing === 'exhale' ? 'text-orange-400' : 'text-white/60'
                      }`}>
                        {sessionState.breathing}
                      </div>
                      
                      {/* Breathing pattern display */}
                      <div className="text-white/60 text-sm">
                        <div className="flex justify-center space-x-3 mb-3">
                          <span className={sessionState.breathing === 'inhale' ? 'text-teal-400' : ''}>4s</span>
                          <span>→</span>
                          <span className={sessionState.breathing === 'hold' ? 'text-yellow-400' : ''}>2s</span>
                          <span>→</span>
                          <span className={sessionState.breathing === 'exhale' ? 'text-orange-400' : ''}>6s</span>
                          <span>→</span>
                          <span className={sessionState.breathing === 'rest' ? 'text-white' : ''}>2s</span>
                        </div>
                        <p className="text-center">Relaxing breath pattern</p>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>

        {/* Bottom HUD - Controls & Chat - Compact mobile */}
        <div className="space-y-2 flex-shrink-0">
          {/* Mobile conversation */}
          <div className="lg:hidden bg-black/40 backdrop-blur-md rounded-lg p-3 border border-white/10 max-h-20 overflow-y-auto">
            {conversation.slice(-1).map((msg, i) => (
              <div key={i} className={`${msg.role === 'ai' ? 'text-teal-400' : 'text-white'}`}>
                <p className="text-sm leading-relaxed">{msg.content}</p>
              </div>
            ))}
          </div>

          {/* Interactive Chat Input Bar */}
          <div className="bg-black/60 backdrop-blur-md rounded-lg border border-white/10">
            <div className="flex items-center space-x-3 p-3">
              {/* Text Input */}
              <div className="flex-1 relative">
                <input
                  type="text"
                  placeholder={sessionState.isListening ? "Listening..." : "Type your response or hold mic to speak..."}
                  className="w-full bg-white/5 border border-white/20 rounded-lg px-4 py-2 text-white placeholder-white/50 focus:outline-none focus:border-teal-400/50 focus:bg-white/10 transition-all duration-300"
                  disabled={sessionState.isListening}
                  onKeyPress={(e) => {
                    if (e.key === 'Enter' && e.currentTarget.value.trim()) {
                      handleUserSpeech(e.currentTarget.value);
                      e.currentTarget.value = '';
                    }
                  }}
                />
                {sessionState.isListening && (
                  <div className="absolute right-3 top-1/2 transform -translate-y-1/2 flex items-center space-x-1">
                    <div className="w-1 h-3 bg-red-400 rounded-full animate-pulse" />
                    <div className="w-1 h-4 bg-red-400 rounded-full animate-pulse" style={{ animationDelay: '0.1s' }} />
                    <div className="w-1 h-3 bg-red-400 rounded-full animate-pulse" style={{ animationDelay: '0.2s' }} />
                  </div>
                )}
              </div>

              {/* Voice Record Button */}
              <button
                onMouseDown={() => {
                  if (!sessionState.isListening) {
                    toggleListening();
                  }
                }}
                onMouseUp={() => {
                  if (sessionState.isListening) {
                    toggleListening();
                  }
                }}
                onTouchStart={() => {
                  if (!sessionState.isListening) {
                    toggleListening();
                  }
                }}
                onTouchEnd={() => {
                  if (sessionState.isListening) {
                    toggleListening();
                  }
                }}
                className={`p-3 rounded-full transition-all duration-300 ${
                  sessionState.isListening 
                    ? 'bg-red-500/30 text-red-400 scale-110 animate-pulse' 
                    : 'bg-teal-500/20 text-teal-400 hover:bg-teal-500/30 hover:scale-105'
                }`}
              >
                <Mic size={20} />
              </button>

              {/* Send Button */}
              <button
                onClick={() => {
                  const input = document.querySelector('input[type="text"]') as HTMLInputElement;
                  if (input?.value.trim()) {
                    handleUserSpeech(input.value);
                    input.value = '';
                  }
                }}
                className="p-3 rounded-full bg-blue-500/20 text-blue-400 hover:bg-blue-500/30 hover:scale-105 transition-all duration-300"
              >
                <MessageCircle size={20} />
              </button>
            </div>
          </div>

          {/* Controls */}
          <div className="bg-black/40 backdrop-blur-md rounded-lg p-2 border border-white/10">
            <div className="flex items-center justify-between">
              {/* Breathing indicator */}
              <div className="flex items-center space-x-2">
                <div className={`w-2.5 h-2.5 sm:w-3 sm:h-3 rounded-full transition-all duration-1000 ${
                  sessionState.breathing === 'inhale' ? 'bg-teal-400' :
                  sessionState.breathing === 'hold' ? 'bg-yellow-400' :
                  sessionState.breathing === 'exhale' ? 'bg-orange-400' : 'bg-gray-400'
                } ${
                  sessionState.breathing === 'inhale' ? 'scale-125' :
                  sessionState.breathing === 'hold' ? 'scale-125' :
                  sessionState.breathing === 'exhale' ? 'scale-75' : 'scale-100'
                }`} />
                <div className="text-white text-sm">
                  <span className="capitalize">{sessionState.breathing}</span>
                  {sessionState.phase === 'preparation' && window.innerWidth > 640 && (
                    <span className="text-white/60 ml-2">
                      {sessionState.breathing === 'inhale' ? '4s' :
                       sessionState.breathing === 'hold' ? '2s' :
                       sessionState.breathing === 'exhale' ? '6s' : '2s'}
                    </span>
                  )}
                </div>
              </div>

              {/* Voice controls */}
              <div className="flex items-center space-x-1">
                <button
                  onClick={() => setIsVoiceEnabled(!isVoiceEnabled)}
                  className={`p-1.5 rounded-full transition-colors ${
                    isVoiceEnabled ? 'bg-teal-500/20 text-teal-400' : 'bg-white/10 text-white/60'
                  }`}
                >
                  {isVoiceEnabled ? <Volume2 size={14} /> : <VolumeX size={14} />}
                </button>

                {sessionState.isSpeaking && (
                  <div className="flex items-center space-x-1">
                    <div className="w-0.5 h-3 bg-teal-400 rounded-full animate-pulse" />
                    <div className="w-0.5 h-4 bg-teal-400 rounded-full animate-pulse" style={{ animationDelay: '0.1s' }} />
                    <div className="w-0.5 h-3 bg-teal-400 rounded-full animate-pulse" style={{ animationDelay: '0.2s' }} />
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
