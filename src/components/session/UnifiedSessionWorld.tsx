import React, { useState, useEffect, useRef } from 'react';
import { X, Play, Pause, SkipBack, SkipForward, Volume2, VolumeX } from 'lucide-react';
import { useSessionStore } from '../../store/sessionStore';
import { useAppStore } from '../../store';
import { useGameState } from '../GameStateManager';
import { supabase } from '../../lib/supabase';
import Orb from '../Orb';

interface UnifiedSessionWorldProps {
  isOpen: boolean;
  onClose: () => void;
}

interface BreathingState {
  phase: 'rest' | 'exhale' | 'hold-exhale' | 'inhale' | 'hold-inhale';
  timeRemaining: number;
  cycleCount: number;
  isActive: boolean;
}
export default function UnifiedSessionWorld({ isOpen, onClose }: UnifiedSessionWorldProps) {
  const { sessionHandle, sessionState, play, pause, nextSegment, prevSegment, disposeSession } = useSessionStore();
  const { activeEgoState, showToast } = useAppStore();
  const { user, updateUser, addExperience, incrementStreak, updateEgoStateUsage } = useGameState();
  const orbRef = useRef(null);
  const [isVoiceEnabled, setIsVoiceEnabled] = useState(true);
  const [sessionStartTime, setSessionStartTime] = useState<number | null>(null);
  const [sessionData, setSessionData] = useState<any>(null);

  // Audio analysis state
  const [analyserAudioLevel, setAnalyserAudioLevel] = useState(0);
  const [audioFrequency, setAudioFrequency] = useState(0);
  const [isSpeaking, setIsSpeaking] = useState(false);
  const audioContextRef = useRef<AudioContext | null>(null);
  const analyserRef = useRef<AnalyserNode | null>(null);
  const audioSourceRef = useRef<MediaElementAudioSourceNode | null>(null);
  const animationFrameRef = useRef<number | null>(null);

  // Session state
  const [depth, setDepth] = useState(1);
  const [phase, setPhase] = useState('preparation');
  const [audioLevel, setAudioLevel] = useState(80);

  // Breathing pattern state (4-4-6-4 pattern)
  const [breathingState, setBreathingState] = useState<BreathingState>({
    phase: 'rest',
    timeRemaining: 5, // 5 second initial rest
    cycleCount: 0,
    isActive: false
  });
  
  const breathingTimerRef = useRef<NodeJS.Timeout | null>(null);
  const breathingAudioRef = useRef<HTMLAudioElement | null>(null);

  // Initialize audio analysis
  useEffect(() => {
    const initAudioAnalysis = async () => {
      try {
        if (!window.AudioContext && !(window as any).webkitAudioContext) {
          console.log('[AUDIO-ANALYSIS] Web Audio API not supported');
          return;
        }

        const AudioContextClass = window.AudioContext || (window as any).webkitAudioContext;
        audioContextRef.current = new AudioContextClass();
        
        // Create analyser for audio visualization
        analyserRef.current = audioContextRef.current.createAnalyser();
        analyserRef.current.fftSize = 256;
        analyserRef.current.smoothingTimeConstant = 0.8;
        
        console.log('[AUDIO-ANALYSIS] Audio analysis initialized');
      } catch (error) {
        console.log('[AUDIO-ANALYSIS] Failed to initialize:', error);
      }
    };

    initAudioAnalysis();

    return () => {
      if (animationFrameRef.current) {
        cancelAnimationFrame(animationFrameRef.current);
      }
      if (audioContextRef.current) {
        audioContextRef.current.close();
      }
    };
  }, []);

  // Connect audio element to analyser when audio starts
  const connectAudioToAnalyser = (audioElement: HTMLAudioElement) => {
    if (!audioContextRef.current || !analyserRef.current || audioSourceRef.current) {
      return;
    }

    try {
      // Resume audio context if suspended
      if (audioContextRef.current.state === 'suspended') {
        audioContextRef.current.resume();
      }

      // Create source from audio element
      audioSourceRef.current = audioContextRef.current.createMediaElementSource(audioElement);
      audioSourceRef.current.connect(analyserRef.current);
      analyserRef.current.connect(audioContextRef.current.destination);
      
      // Start audio analysis
      startAudioAnalysis();
      
      console.log('[AUDIO-ANALYSIS] Connected audio element to analyser');
    } catch (error) {
      console.log('[AUDIO-ANALYSIS] Failed to connect audio:', error);
    }
  };

  // Start real-time audio analysis
  const startAudioAnalysis = () => {
    if (!analyserRef.current) return;

    const bufferLength = analyserRef.current.frequencyBinCount;
    const dataArray = new Uint8Array(bufferLength);

    const analyze = () => {
      if (!analyserRef.current) return;

      analyserRef.current.getByteFrequencyData(dataArray);
      
      // Calculate average volume level
      const average = dataArray.reduce((sum, value) => sum + value, 0) / bufferLength;
      const normalizedLevel = (average / 255) * 100;
      
      // Calculate dominant frequency
      let maxIndex = 0;
      let maxValue = 0;
      for (let i = 0; i < bufferLength; i++) {
        if (dataArray[i] > maxValue) {
          maxValue = dataArray[i];
          maxIndex = i;
        }
      }
      const dominantFreq = (maxIndex / bufferLength) * (audioContextRef.current?.sampleRate || 44100) / 2;
      
      // Update state
      setAnalyserAudioLevel(normalizedLevel);
      setAudioFrequency(dominantFreq);
      setIsSpeaking(normalizedLevel > 5); // Speaking threshold
      
      animationFrameRef.current = requestAnimationFrame(analyze);
    };

    analyze();
  };

  // Auto-start session when opened
  useEffect(() => {
    if (isOpen && sessionHandle && sessionState.isInitialized && sessionState.playState === 'stopped') {
      console.log('[SESSION-WORLD] Auto-starting session');
      setSessionStartTime(Date.now());
      setTimeout(() => {
        play();
      }, 1000);
    }
  }, [isOpen, sessionHandle, sessionState.isInitialized, sessionState.playState, play]);

  // Start breathing pattern when session starts
  useEffect(() => {
    if (sessionState.playState === 'playing' && !breathingState.isActive) {
      startBreathingPattern();
    } else if (sessionState.playState !== 'playing' && breathingState.isActive) {
      pauseBreathingPattern();
    }
  }, [sessionState.playState]);

  // Cleanup breathing timer on unmount
  useEffect(() => {
    return () => {
      if (breathingTimerRef.current) {
        clearInterval(breathingTimerRef.current);
      }
    };
  }, []);
  // Handle session state changes
  useEffect(() => {
    if (sessionHandle) {
      sessionHandle.on('state-change', (newState) => {
        console.log('[SESSION-WORLD] Session state changed:', newState);
        
        // Update local state based on session state
        if (newState.currentSegmentId) {
          // Update phase based on segment
          const segmentId = newState.currentSegmentId;
          if (segmentId.includes('intro') || segmentId.includes('welcome')) {
            setPhase('preparation');
          } else if (segmentId.includes('induction')) {
            setPhase('induction');
            setDepth(2);
          } else if (segmentId.includes('deepening')) {
            setPhase('deepening');
            setDepth(3);
          } else if (segmentId.includes('transformation') || segmentId.includes('core')) {
            setPhase('transformation');
            setDepth(4);
          } else if (segmentId.includes('integration')) {
            setPhase('integration');
            setDepth(3);
          } else if (segmentId.includes('emergence') || segmentId.includes('awakening')) {
            setPhase('completion');
            setDepth(1);
          }
        }
      });

      sessionHandle.on('play', () => {
        console.log('[SESSION-WORLD] Session started playing');
      });

      sessionHandle.on('pause', () => {
        console.log('[SESSION-WORLD] Session paused');
      });

      sessionHandle.on('end', () => {
        console.log('[SESSION-WORLD] Session completed');
        handleSessionComplete();
      });

      // Audio analysis events
      sessionHandle.on('audio-element', (audioElement) => {
        connectAudioToAnalyser(audioElement);
      });

      sessionHandle.on('audio-started', () => {
        setIsSpeaking(true);
      });

      sessionHandle.on('audio-ended', () => {
        setIsSpeaking(false);
        setAnalyserAudioLevel(0);
      });

      sessionHandle.on('audio-error', () => {
        setIsSpeaking(false);
        setAnalyserAudioLevel(0);
      });
    }
  }, [sessionHandle, showToast, onClose]);

  // Calculate session rewards
  const calculateSessionRewards = (durationMinutes: number, completionRate: number = 1.0) => {
    const baseXP = Math.floor(durationMinutes * 2); // 2 XP per minute
    const completionBonus = Math.floor(baseXP * (completionRate - 1)); // Bonus for full completion
    const totalXP = baseXP + completionBonus;
    
    const baseTokens = Math.floor(durationMinutes / 5); // 1 token per 5 minutes
    const minTokens = 2; // Minimum 2 tokens per session
    const totalTokens = Math.max(baseTokens, minTokens);
    
    return { xp: totalXP, tokens: totalTokens };
  };

  // Handle session completion with full gamification
  const handleSessionComplete = async () => {
    if (!user || !sessionStartTime) {
      console.error('[SESSION-WORLD] Cannot complete session - missing user or start time');
      return;
    }

    try {
      const sessionEndTime = Date.now();
      const sessionDurationMs = sessionEndTime - sessionStartTime;
      const sessionDurationMinutes = Math.floor(sessionDurationMs / (1000 * 60));
      
      // Calculate rewards
      const rewards = calculateSessionRewards(sessionDurationMinutes);
      
      // Prepare session data
      const sessionRecord = {
        user_id: user.id,
        ego_state: activeEgoState,
        action: sessionData?.action || 'transformation session',
        duration: sessionDurationMinutes,
        experience_gained: rewards.xp,
        completed_at: new Date().toISOString()
      };

      // Save session to database
      const { error: sessionError } = await supabase
        .from('sessions')
        .insert(sessionRecord);

      if (sessionError) {
        console.error('[SESSION-WORLD] Error saving session:', sessionError);
        showToast({
          type: 'error',
          message: 'Session completed but failed to save progress'
        });
      } else {
        console.log('[SESSION-WORLD] Session saved successfully');
      }

      // Award experience points
      await addExperience(rewards.xp);
      
      // Update ego state usage
      await updateEgoStateUsage(activeEgoState);
      
      // Increment streak and award tokens
      await incrementStreak();
      
      // Award session tokens
      await updateUser({ 
        tokens: (user.tokens || 0) + rewards.tokens,
        daily_sessions_used: (user.daily_sessions_used || 0) + 1
      });

      // Check for achievements
      await checkAndUnlockAchievements(user, rewards);

      // Show completion message
      showToast({
        type: 'success',
        message: `Session completed! +${rewards.xp} XP, +${rewards.tokens} tokens`,
        duration: 5000
      });

      // Close session after brief delay
      setTimeout(() => {
        onClose();
      }, 2000);

    } catch (error) {
      console.error('[SESSION-WORLD] Error completing session:', error);
      showToast({
        type: 'error',
        message: 'Session completed but failed to save progress'
      });
      onClose();
    }
  };

  // Check and unlock achievements
  const checkAndUnlockAchievements = async (currentUser: any, sessionRewards: any) => {
    const newAchievements: string[] = [];
    const currentAchievements = currentUser.achievements || [];

    // First session achievement
    if (!currentAchievements.includes('first_session')) {
      newAchievements.push('first_session');
    }

    // Streak achievements
    const newStreak = (currentUser.session_streak || 0) + 1;
    if (newStreak >= 3 && !currentAchievements.includes('three_day_streak')) {
      newAchievements.push('three_day_streak');
    }
    if (newStreak >= 7 && !currentAchievements.includes('week_warrior')) {
      newAchievements.push('week_warrior');
    }
    if (newStreak >= 30 && !currentAchievements.includes('month_master')) {
      newAchievements.push('month_master');
    }

    // Level achievements
    const newLevel = Math.floor((currentUser.experience + sessionRewards.xp) / 100) + 1;
    if (newLevel >= 5 && !currentAchievements.includes('level_5_master')) {
      newAchievements.push('level_5_master');
    }
    if (newLevel >= 10 && !currentAchievements.includes('level_10_sage')) {
      newAchievements.push('level_10_sage');
    }

    // Ego state achievements
    const egoStateUsage = currentUser.ego_state_usage || {};
    const uniqueStatesUsed = Object.keys(egoStateUsage).length + (egoStateUsage[activeEgoState] ? 0 : 1);
    if (uniqueStatesUsed >= 3 && !currentAchievements.includes('ego_explorer')) {
      newAchievements.push('ego_explorer');
    }
    if (uniqueStatesUsed >= 6 && !currentAchievements.includes('archetypal_master')) {
      newAchievements.push('archetypal_master');
    }

    // Token achievements
    const newTokens = (currentUser.tokens || 0) + sessionRewards.tokens;
    if (newTokens >= 100 && !currentAchievements.includes('token_collector')) {
      newAchievements.push('token_collector');
    }

    // Update achievements if any new ones unlocked
    if (newAchievements.length > 0) {
      const updatedAchievements = [...currentAchievements, ...newAchievements];
      await updateUser({ achievements: updatedAchievements });
      
      // Show achievement notifications
      newAchievements.forEach(achievement => {
        const achievementName = getAchievementName(achievement);
        showToast({
          type: 'success',
          message: `🏆 Achievement Unlocked: ${achievementName}!`,
          duration: 6000
        });
      });
    }
  };

  // Get human-readable achievement names
  const getAchievementName = (achievementId: string): string => {
    const achievementNames: { [key: string]: string } = {
      'first_session': 'First Steps',
      'three_day_streak': 'Building Momentum',
      'week_warrior': 'Week Warrior',
      'month_master': 'Month Master',
      'level_5_master': 'Level 5 Master',
      'level_10_sage': 'Level 10 Sage',
      'ego_explorer': 'Ego Explorer',
      'archetypal_master': 'Archetypal Master',
      'token_collector': 'Token Collector'
    };
    return achievementNames[achievementId] || achievementId;
  };

  // Breathing pattern functions
  const startBreathingPattern = () => {
    console.log('[BREATHING] Starting 4-4-6-4 breathing pattern');
    
    setBreathingState({
      phase: 'rest',
      timeRemaining: 5,
      cycleCount: 0,
      isActive: true
    });
    
    // Start with 5-second rest period
    breathingTimerRef.current = setInterval(() => {
      setBreathingState(prev => {
        if (prev.timeRemaining <= 1) {
          // Move to next phase
          const nextPhase = getNextBreathingPhase(prev.phase);
          const nextDuration = getBreathingPhaseDuration(nextPhase);
          
          // Play audio cue for phase transition
          playBreathingCue(nextPhase);
          
          return {
            ...prev,
            phase: nextPhase,
            timeRemaining: nextDuration,
            cycleCount: nextPhase === 'exhale' ? prev.cycleCount + 1 : prev.cycleCount
          };
        } else {
          return {
            ...prev,
            timeRemaining: prev.timeRemaining - 1
          };
        }
      });
    }, 1000); // Update every second
  };
  
  const pauseBreathingPattern = () => {
    console.log('[BREATHING] Pausing breathing pattern');
    if (breathingTimerRef.current) {
      clearInterval(breathingTimerRef.current);
      breathingTimerRef.current = null;
    }
    setBreathingState(prev => ({ ...prev, isActive: false }));
  };
  
  const getNextBreathingPhase = (currentPhase: BreathingState['phase']): BreathingState['phase'] => {
    switch (currentPhase) {
      case 'rest': return 'exhale';
      case 'exhale': return 'hold-exhale';
      case 'hold-exhale': return 'inhale';
      case 'inhale': return 'hold-inhale';
      case 'hold-inhale': return 'exhale';
      default: return 'exhale';
    }
  };
  
  const getBreathingPhaseDuration = (phase: BreathingState['phase']): number => {
    switch (phase) {
      case 'rest': return 5;
      case 'exhale': return 4;
      case 'hold-exhale': return 4;
      case 'inhale': return 6;
      case 'hold-inhale': return 4;
      default: return 4;
    }
  };
  
  const playBreathingCue = (phase: BreathingState['phase']) => {
    if (!isVoiceEnabled) return;
    
    // Create subtle audio cues for breathing transitions
    try {
      if (!window.AudioContext && !(window as any).webkitAudioContext) {
        console.log('[BREATHING] Web Audio API not supported');
        return;
      }
      
      const audioContext = new (window.AudioContext || (window as any).webkitAudioContext)();
      
      // Check if audio context is suspended (common on mobile)
      if (audioContext.state === 'suspended') {
        audioContext.resume().catch(err => {
          console.log('[BREATHING] Could not resume audio context:', err);
          return;
        });
      }
      
      const oscillator = audioContext.createOscillator();
      const gainNode = audioContext.createGain();
      
      oscillator.connect(gainNode);
      gainNode.connect(audioContext.destination);
      
      // Different tones for different phases
      const frequencies = {
        'exhale': 220,    // Lower tone for exhale
        'hold-exhale': 180,
        'inhale': 330,    // Higher tone for inhale
        'hold-inhale': 280,
        'rest': 200
      };
      
      oscillator.frequency.setValueAtTime(frequencies[phase] || 220, audioContext.currentTime);
      oscillator.type = 'sine';
      
      gainNode.gain.setValueAtTime(0, audioContext.currentTime);
      gainNode.gain.linearRampToValueAtTime(0.1, audioContext.currentTime + 0.1);
      gainNode.gain.linearRampToValueAtTime(0, audioContext.currentTime + 0.3);
      
      oscillator.start(audioContext.currentTime);
      oscillator.stop(audioContext.currentTime + 0.3);
    } catch (error) {
      console.log('[BREATHING] Audio cue failed:', error);
    }
  };
  
  const getBreathingPhaseColor = () => {
    switch (breathingState.phase) {
      case 'exhale': return 'text-blue-400 bg-blue-500/20 border-blue-400';
      case 'hold-exhale': return 'text-cyan-400 bg-cyan-500/20 border-cyan-400';
      case 'inhale': return 'text-green-400 bg-green-500/20 border-green-400';
      case 'hold-inhale': return 'text-teal-400 bg-teal-500/20 border-teal-400';
      case 'rest': return 'text-purple-400 bg-purple-500/20 border-purple-400';
      default: return 'text-white/60 bg-white/10 border-white/20';
    }
  };
  
  const getBreathingInstruction = () => {
    switch (breathingState.phase) {
      case 'exhale': return 'Breathe out slowly and completely';
      case 'hold-exhale': return 'Hold your breath gently';
      case 'inhale': return 'Breathe in deeply and slowly';
      case 'hold-inhale': return 'Hold your breath comfortably';
      case 'rest': return 'Prepare to begin breathing';
      default: return 'Follow your natural breath';
    }
  };
  const handleClose = () => {
    // Stop breathing pattern
    pauseBreathingPattern();
    
    if (sessionHandle) {
      sessionHandle.pause();
      disposeSession();
    }
    setSessionStartTime(null);
    setSessionData(null);
    onClose();
  };

  const handlePlayPause = () => {
    if (sessionState.playState === 'playing') {
      pause();
    } else {
      play();
    }
  };

  const handleVolumeChange = (level: number) => {
    setAudioLevel(level);
    
    // Apply volume to current audio element
    if (sessionHandle) {
      const currentAudio = document.querySelector('audio');
      if (currentAudio) {
        currentAudio.volume = level / 100;
      }
    }
    
    // Apply to speech synthesis
    if (window.speechSynthesis && window.speechSynthesis.speaking) {
      // Note: speechSynthesis doesn't support volume control directly
      // Volume is controlled through the utterance when created
    }
    
    console.log('[SESSION] Volume updated to:', level);
  };

  // Store session configuration when session starts
  useEffect(() => {
    if (sessionHandle && sessionState.plan) {
      setSessionData({
        action: sessionState.plan.summary || 'Transformation Session',
        egoState: activeEgoState,
        protocol: sessionState.script?.metadata || {}
      });
    }
  }, [sessionHandle, sessionState.plan, sessionState.script, activeEgoState]);
  if (!isOpen || !sessionHandle) {
    return null;
  }


  return (
    <div className="fixed inset-0 z-[100] bg-black h-screen w-screen overflow-hidden">
      {/* Session Header */}
      <div className="absolute top-0 left-0 right-0 z-40 bg-black/95 backdrop-blur-xl border-b border-white/10 p-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <div className="w-8 h-8 rounded-full bg-gradient-to-br from-teal-400/30 to-cyan-400/30 border border-teal-400/50 flex items-center justify-center">
              <div className={`w-2 h-2 rounded-full ${
                sessionState.playState === 'playing' ? 'bg-green-400 animate-pulse' : 'bg-yellow-400'
              }`} />
            </div>
            <div>
              <h1 className="text-white font-semibold">Session Active</h1>
              <p className="text-white/60 text-sm">
                Segment {sessionState.currentSegmentIndex + 1} of {sessionState.totalSegments}
              </p>
            </div>
          </div>
          
          <button
            onClick={handleClose}
            className="w-10 h-10 rounded-full bg-white/10 hover:bg-white/20 border border-white/20 flex items-center justify-center transition-all hover:scale-110"
          >
            <X size={18} className="text-white/80" />
          </button>
        </div>
      </div>

      {/* Main Session Area */}
      <div className="relative h-screen bg-gradient-to-br from-black via-purple-950/20 to-indigo-950/20 overflow-hidden">
        {/* Background Effects */}
        <div className="absolute inset-0">
          <div className="absolute top-1/4 right-1/4 w-96 h-96 bg-gradient-to-br from-purple-500/10 to-indigo-500/5 rounded-full blur-3xl animate-pulse" />
        </div>

        {/* Top Indicators - Only Phase and Depth */}
        <div className="absolute top-20 left-1/2 transform -translate-x-1/2 z-30">
          <div className="flex items-center justify-center space-x-8">
            {/* Depth Indicator */}
            <div className="bg-black/80 backdrop-blur-xl rounded-xl px-4 py-3 border border-white/20">
              <div className="text-white/80 text-xs font-medium mb-2 text-center">DEPTH</div>
              <div className="flex items-center space-x-1">
                {[1, 2, 3, 4, 5].map((level) => (
                  <div
                    key={level}
                    className={`w-3 h-3 rounded-full transition-all duration-300 ${
                      level <= depth ? 'bg-blue-400 animate-pulse' : 'bg-white/20'
                    }`}
                  />
                ))}
              </div>
            </div>

            {/* Phase Indicator */}
            <div className="bg-black/80 backdrop-blur-xl rounded-xl px-4 py-3 border border-white/20">
              <div className="text-white/80 text-xs font-medium mb-2 text-center">PHASE</div>
              <div className={`px-3 py-1 rounded-full border transition-all ${
                phase === 'preparation' ? 'text-blue-400 bg-blue-500/20 border-blue-500/40' :
                phase === 'induction' ? 'text-teal-400 bg-teal-500/20 border-teal-500/40' :
                phase === 'deepening' ? 'text-purple-400 bg-purple-500/20 border-purple-500/40' :
                phase === 'transformation' ? 'text-orange-400 bg-orange-500/20 border-orange-500/40' :
                phase === 'integration' ? 'text-green-400 bg-green-500/20 border-green-500/40' :
                phase === 'completion' ? 'text-white bg-white/20 border-white/40' :
                'text-white/60 bg-white/10 border-white/20'
              }`}>
                <span className="text-sm font-medium capitalize">{phase}</span>
              </div>
            </div>
          </div>
        </div>

        {/* Session Controls Sidebar */}
        <div className="absolute left-4 top-1/2 transform -translate-y-1/2 z-30 space-y-3 flex flex-col">
          {/* Play/Pause */}
          <button
            onClick={handlePlayPause}
            className={`w-14 h-14 rounded-full backdrop-blur-xl border transition-all hover:scale-110 flex items-center justify-center ${
              sessionState.playState === 'playing' 
                ? 'bg-orange-500/20 border-orange-500/40 text-orange-400' 
                : 'bg-green-500/20 border-green-500/40 text-green-400'
            }`}
          >
            {sessionState.playState === 'playing' ? <Pause size={24} /> : <Play size={24} className="ml-1" />}
          </button>

          {/* Skip Back */}
          <button
            onClick={prevSegment}
            className="w-12 h-12 rounded-full bg-black/80 backdrop-blur-xl border border-white/20 flex items-center justify-center hover:bg-white/10 hover:scale-110 transition-all"
          >
            <SkipBack size={18} className="text-white/80" />
          </button>

          {/* Skip Forward */}
          <button
            onClick={nextSegment}
            className="w-12 h-12 rounded-full bg-black/80 backdrop-blur-xl border border-white/20 flex items-center justify-center hover:bg-white/10 hover:scale-110 transition-all"
          >
            <SkipForward size={18} className="text-white/80" />
          </button>

          {/* Volume Control */}
          <button
            onClick={() => setIsVoiceEnabled(!isVoiceEnabled)}
            className={`w-12 h-12 rounded-full backdrop-blur-xl border transition-all hover:scale-110 flex items-center justify-center ${
              isVoiceEnabled 
                ? 'bg-green-500/20 border-green-500/40 text-green-400' 
                : 'bg-red-500/20 border-red-500/40 text-red-400'
            }`}
            title={isVoiceEnabled ? 'Voice On' : 'Voice Off'}
          >
            {isVoiceEnabled ? <Volume2 size={18} /> : <VolumeX size={18} />}
          </button>

          {/* Volume Slider */}
          {isVoiceEnabled && (
            <div className="w-12 bg-black/80 backdrop-blur-xl rounded-xl p-2 border border-white/20">
              <input
                type="range"
                min="0"
                max="100"
                value={audioLevel}
                onChange={(e) => handleVolumeChange(parseInt(e.target.value))}
                className="w-full h-1 bg-white/20 rounded-full appearance-none slider-vertical"
                style={{
                  writingMode: 'bt-lr',
                  WebkitAppearance: 'slider-vertical'
                }}
              />
              <div className="text-white/60 text-xs text-center mt-1">{audioLevel}%</div>
            </div>
          )}
        </div>

        {/* Central Orb */}
        <div className={`absolute transition-all duration-2000 ease-out z-20 ${
          sessionState.playState === 'playing' 
            ? 'inset-0 scale-[4] opacity-30' 
            : 'inset-0 flex items-center justify-center scale-100 opacity-100'
        }`} style={{ overflow: 'visible' }}>
          <Orb
            ref={orbRef}
            onTap={handlePlayPause}
            egoState={activeEgoState}
            size={sessionState.playState === 'playing' 
              ? Math.max(window.innerWidth, window.innerHeight) 
              : (window.innerWidth < 768 ? 320 : 480)
            }
            variant="webgl"
            isSpeaking={isSpeaking}
            audioLevel={analyserAudioLevel}
            audioFrequency={audioFrequency}
            className=""
            afterglow={sessionState.playState === 'playing'}
            style={{ overflow: 'visible' }}
          />
        </div>


        {/* Enhanced Breathing Guide - Bottom */}
        <div className="absolute bottom-0 left-0 right-0 z-30 p-4">
          <div className="w-full max-w-6xl mx-auto bg-gradient-to-r from-black/95 via-purple-950/95 to-black/95 backdrop-blur-xl border border-white/10 rounded-2xl shadow-2xl shadow-purple-500/20 overflow-hidden">
            <div className="px-6 py-4">
              <div className="flex items-center justify-between max-w-5xl mx-auto">
                {/* Breathing Phase Display */}
                <div className="flex items-center space-x-6">
                  <div className="text-center">
                    <div className="text-white/60 text-xs font-medium tracking-wider uppercase mb-2">Breathing</div>
                    <div className={`flex items-center justify-center w-24 h-10 rounded-xl border-2 transition-all duration-500 shadow-lg ${getBreathingPhaseColor()}`}>
                      <span className="text-sm font-bold capitalize">
                        {breathingState.phase === 'hold-inhale' ? 'Hold' : 
                         breathingState.phase === 'hold-exhale' ? 'Hold' :
                         breathingState.phase}
                      </span>
                    </div>
                  </div>
                  
                  {/* Countdown Timer */}
                  <div className="text-center">
                    <div className="text-white/60 text-xs font-medium tracking-wider uppercase mb-2">Timer</div>
                    <div className="w-16 h-16 rounded-full bg-gradient-to-br from-teal-400/40 to-cyan-400/40 border-2 border-teal-400/60 flex items-center justify-center shadow-xl shadow-teal-400/30 relative">
                      <span className="text-teal-400 text-lg font-bold">
                        {breathingState.timeRemaining}
                      </span>
                      {/* Progress ring */}
                      <svg className="absolute inset-0 w-full h-full -rotate-90" viewBox="0 0 64 64">
                        <circle
                          cx="32"
                          cy="32"
                          r="28"
                          fill="none"
                          stroke="rgba(255,255,255,0.1)"
                          strokeWidth="2"
                        />
                        <circle
                          cx="32"
                          cy="32"
                          r="28"
                          fill="none"
                          stroke="currentColor"
                          strokeWidth="2"
                          strokeDasharray={`${2 * Math.PI * 28}`}
                          strokeDashoffset={`${2 * Math.PI * 28 * (1 - (breathingState.timeRemaining / getBreathingPhaseDuration(breathingState.phase)))}`}
                          className="text-teal-400 transition-all duration-1000"
                        />
                      </svg>
                    </div>
                  </div>
                </div>

                {/* Breathing Instruction */}
                <div className="flex-1 text-center mx-8">
                  <div className="text-white/60 text-xs font-medium tracking-wider uppercase mb-2">Instruction</div>
                  <div className="text-white text-lg font-light leading-relaxed">
                    {getBreathingInstruction()}
                  </div>
                  <div className="text-white/50 text-sm mt-1">
                    Cycle {breathingState.cycleCount} • 4-4-6-4 Pattern
                  </div>
                </div>

                {/* Pattern Visualization */}
                <div className="flex items-center space-x-4">
                  <div className="text-center">
                    <div className="text-white/60 text-xs font-medium tracking-wider uppercase mb-2">Pattern</div>
                    <div className="flex items-center space-x-2">
                      {[
                        { phase: 'exhale', duration: 4, label: 'Out' },
                        { phase: 'hold-exhale', duration: 4, label: 'Hold' },
                        { phase: 'inhale', duration: 6, label: 'In' },
                        { phase: 'hold-inhale', duration: 4, label: 'Hold' }
                      ].map((step, index) => (
                        <div key={step.phase} className="flex items-center">
                          <div className={`w-4 h-4 rounded-full transition-all duration-500 shadow-lg border-2 ${
                            breathingState.phase === step.phase
                              ? 'bg-teal-400 scale-150 animate-pulse shadow-teal-400/60 border-teal-400'
                              : 'bg-white/20 border-white/30'
                          }`} />
                          <div className="text-center mx-1">
                            <div className={`text-xs font-bold ${
                              breathingState.phase === step.phase ? 'text-teal-400' : 'text-white/60'
                            }`}>
                              {step.duration}s
                            </div>
                            <div className={`text-xs ${
                              breathingState.phase === step.phase ? 'text-teal-400' : 'text-white/40'
                            }`}>
                              {step.label}
                            </div>
                          </div>
                          {index < 3 && <div className="w-2 h-0.5 bg-white/30 rounded-full" />}
                        </div>
                      ))}
                    </div>
                  </div>
                </div>

                {/* Session Stats */}
                <div className="flex items-center space-x-4">
                  <div className="text-center bg-black/30 rounded-lg px-3 py-2 border border-white/10">
                    <div className="text-white text-sm font-bold">{sessionState.currentSegmentIndex + 1}</div>
                    <div className="text-white/50 text-xs">Segment</div>
                  </div>
                  <div className="text-center bg-black/30 rounded-lg px-3 py-2 border border-white/10">
                    <div className="text-orange-400 text-sm font-bold">{sessionState.totalSegments}</div>
                    <div className="text-white/50 text-xs">Total</div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
        {/* Loading State */}
        {!sessionState.isInitialized && (
          <div className="absolute inset-0 bg-black/80 flex items-center justify-center z-50">
            <div className="bg-black/90 backdrop-blur-xl rounded-2xl p-8 border border-white/20 text-center">
              <div className="w-16 h-16 border-4 border-teal-400/20 border-t-teal-400 rounded-full animate-spin mx-auto mb-4"></div>
              <h3 className="text-white font-medium mb-2">Preparing Your Session</h3>
              <p className="text-white/70 text-sm">Generating personalized content...</p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

