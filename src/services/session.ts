import { supabase } from '../lib/supabase';

export interface SessionState {
  isActive: boolean;
  currentScript?: string;
  startTime?: number;
  duration?: number;
  egoState?: string;
  action?: string;
}

export interface StartSessionOptions {
  egoState: string;
  action: string;
  goal?: string;
  method?: string;
  mode?: string;
  duration?: number;
}

export interface SessionHandle {
  stop: () => Promise<void>;
  pause: () => Promise<void>;
  resume: () => Promise<void>;
  getState: () => SessionState;
}

class SessionManager {
  private currentSession: SessionState | null = null;
  private sessionHandle: SessionHandle | null = null;

  async startSession(options: StartSessionOptions): Promise<SessionHandle> {
    try {
      // Initialize session
      await this._initializeSession(options);
      
      // Create session handle
      this.sessionHandle = {
        stop: this._stopSession.bind(this),
        pause: this._pauseSession.bind(this),
        resume: this._resumeSession.bind(this),
        getState: this._getState.bind(this)
      };

      return this.sessionHandle;
    } catch (error) {
      console.error('Session initialization failed:', error);
      throw error;
    }
  }

  private async _initializeSession(options: StartSessionOptions): Promise<void> {
    try {
      // Generate script using Supabase function
      const script = await this._generateScript(options);
      
      this.currentSession = {
        isActive: true,
        currentScript: script,
        startTime: Date.now(),
        duration: options.duration || 900, // 15 minutes default
        egoState: options.egoState,
        action: options.action
      };
    } catch (error) {
      // Fallback to offline script if generation fails
      console.warn('Script generation failed, using fallback:', error);
      const fallbackScript = this._createFallbackScript(options);
      
      this.currentSession = {
        isActive: true,
        currentScript: fallbackScript,
        startTime: Date.now(),
        duration: options.duration || 900,
        egoState: options.egoState,
        action: options.action
      };
    }
  }

  private async _generateScript(options: StartSessionOptions): Promise<string> {
    try {
      const { data, error } = await supabase.functions.invoke('generate-script', {
        body: {
          egoState: options.egoState,
          action: options.action,
          goal: options.goal,
          method: options.method,
          mode: options.mode,
          duration: options.duration
        }
      });

      if (error) throw error;
      return data.script;
    } catch (error) {
      throw new Error(`Script generation failed: ${error.message}`);
    }
  }

  private _createFallbackScript(options: StartSessionOptions): string {
    return `Welcome to your ${options.action} session with Libero in ${options.egoState} mode. 
    
    Take a moment to settle into a comfortable position. Close your eyes and begin to breathe deeply and naturally.
    
    With each breath, allow yourself to relax more deeply. Feel the tension leaving your body as you sink into this peaceful state.
    
    Focus on your intention for this session: ${options.goal || 'personal growth and transformation'}.
    
    Allow Libero to guide you through this transformative experience, knowing that you are safe and in control.
    
    Take your time to explore this inner space, and when you're ready, you can gently return to full awareness.`;
  }

  private async _stopSession(): Promise<void> {
    if (this.currentSession) {
      // Save session data to database
      await this._saveSessionData();
      this.currentSession = null;
      this.sessionHandle = null;
    }
  }

  private async _pauseSession(): Promise<void> {
    if (this.currentSession) {
      this.currentSession.isActive = false;
    }
  }

  private async _resumeSession(): Promise<void> {
    if (this.currentSession) {
      this.currentSession.isActive = true;
    }
  }

  private _getState(): SessionState {
    return this.currentSession || { isActive: false };
  }

  private async _saveSessionData(): Promise<void> {
    if (!this.currentSession) return;

    try {
      const duration = Math.floor((Date.now() - (this.currentSession.startTime || 0)) / 1000);
      const experienceGained = Math.max(10, Math.floor(duration / 60) * 5); // 5 XP per minute, minimum 10

      await supabase.from('sessions').insert({
        ego_state: this.currentSession.egoState,
        action: this.currentSession.action,
        duration,
        experience_gained: experienceGained
      });
    } catch (error) {
      console.error('Failed to save session data:', error);
    }
  }
}

// Create singleton instance
const sessionManager = new SessionManager();

// Export the main function
export const startSession = (options: StartSessionOptions): Promise<SessionHandle> => {
  return sessionManager.startSession(options);
};