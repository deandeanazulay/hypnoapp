// Unified Application Store (consolidates uiStore, appStore)
import { create } from 'zustand';
import { persist } from 'zustand/middleware';

// Types
export type EgoStateId = 'guardian' | 'rebel' | 'healer' | 'explorer' | 'mystic' | 'sage' | 'child' | 'performer' | 'shadow' | 'builder' | 'seeker' | 'lover' | 'trickster' | 'warrior' | 'visionary';
export type TabId = 'home' | 'explore' | 'create' | 'favorites' | 'profile';

interface Toast {
  id: string;
  type: 'success' | 'error' | 'warning' | 'info';
  message: string;
  duration?: number;
}

interface AppState {
  // Navigation
  activeTab: TabId;
  
  // Ego States
  activeEgoState: EgoStateId;
  
  // UI State
  isLoading: boolean;
  modals: {
    egoStates: boolean;
    settings: boolean;
    auth: boolean;
    plan: boolean;
    tokens: boolean;
  };
  
  // Toasts
  toasts: Toast[];
  
  // Actions
  setActiveTab: (tab: TabId) => void;
  setActiveEgoState: (id: EgoStateId) => void;
  setLoading: (loading: boolean) => void;
  openModal: (modal: keyof AppState['modals']) => void;
  closeModal: (modal: keyof AppState['modals']) => void;
  openEgoModal: () => void;
  closeEgoModal: () => void;
  isEgoModalOpen: boolean;
  showToast: (toast: Omit<Toast, 'id'>) => void;
  removeToast: (id: string) => void;
}

export const useAppStore = create<AppState>()(
  persist(
    (set, get) => ({
      // Initial State
      activeTab: 'home',
      activeEgoState: 'guardian',
      isLoading: false,
      modals: {
        egoStates: false,
        settings: false,
        auth: false,
        plan: false,
        tokens: false
      },
      toasts: [],

      // Actions
      setActiveTab: (tab) => set({ activeTab: tab }),
      
      setActiveEgoState: (id) => set({ activeEgoState: id }),
      
      setLoading: (loading) => set({ isLoading: loading }),
      
      openModal: (modal) => set((state) => ({
        modals: { ...state.modals, [modal]: true }
      })),
      
      closeModal: (modal) => set((state) => ({
        modals: { ...state.modals, [modal]: false }
      })),
      
      // Convenience methods for ego states modal
      openEgoModal: () => set((state) => ({
        modals: { ...state.modals, egoStates: true }
      })),
      
      closeEgoModal: () => set((state) => ({
        modals: { ...state.modals, egoStates: false }
      })),
      
      showToast: (toast) => {
        const id = Date.now().toString();
        const newToast = { ...toast, id };
        
        set((state) => ({
          toasts: [...state.toasts, newToast]
        }));
        
        // Auto-remove after duration
        setTimeout(() => {
          get().removeToast(id);
        }, toast.duration || 4000);
      },
      
      removeToast: (id) => set((state) => ({
        toasts: state.toasts.filter(t => t.id !== id)
      }))
    }),
    {
      name: 'app-store',
      partialize: (state) => ({
        activeEgoState: state.activeEgoState,
        activeTab: state.activeTab
      })
    }
  )
);

// Ego States Data (simplified, consolidated)
export const EGO_STATES = [
  { 
    id: 'guardian' as EgoStateId, 
    name: 'Guardian', 
    icon: '🛡️', 
    role: 'Protector', 
    color: 'from-blue-600/20 to-blue-800/20',
    description: 'The protective guide that keeps you safe'
  },
  { 
    id: 'rebel' as EgoStateId, 
    name: 'Rebel', 
    icon: '🔥', 
    role: 'Liberator', 
    color: 'from-red-600/20 to-red-800/20',
    description: 'The revolutionary force that breaks limitations'
  },
  { 
    id: 'healer' as EgoStateId, 
    name: 'Healer', 
    icon: '🌿', 
    role: 'Nurturer', 
    color: 'from-green-600/20 to-green-800/20',
    description: 'The compassionate guide for restoration'
  },
  { 
    id: 'explorer' as EgoStateId, 
    name: 'Explorer', 
    icon: '🌍', 
    role: 'Adventurer', 
    color: 'from-yellow-500/20 to-yellow-700/20',
    description: 'The curious seeker of new possibilities'
  },
  { 
    id: 'mystic' as EgoStateId, 
    name: 'Mystic', 
    icon: '✨', 
    role: 'Transcendent', 
    color: 'from-purple-600/20 to-purple-800/20',
    description: 'The spiritual guide to higher consciousness'
  },
  { 
    id: 'sage' as EgoStateId, 
    name: 'Sage', 
    icon: '📜', 
    role: 'Teacher', 
    color: 'from-gray-300/20 to-gray-500/20',
    description: 'The wise teacher sharing ancient knowledge'
  },
  { 
    id: 'child' as EgoStateId, 
    name: 'Child', 
    icon: '🎈', 
    role: 'Playful', 
    color: 'from-orange-500/20 to-orange-700/20',
    description: 'The joyful spirit of wonder and play'
  },
  { 
    id: 'performer' as EgoStateId, 
    name: 'Performer', 
    icon: '🎭', 
    role: 'Expressive', 
    color: 'from-pink-600/20 to-pink-800/20',
    description: 'The creative artist expressing authentic self'
  },
  { 
    id: 'shadow' as EgoStateId, 
    name: 'Shadow', 
    icon: '🌑', 
    role: 'Integrator', 
    color: 'from-indigo-900/20 to-black/20',
    description: 'The hidden aspects seeking integration'
  },
  { 
    id: 'builder' as EgoStateId, 
    name: 'Builder', 
    icon: '🛠️', 
    role: 'Creator', 
    color: 'from-gray-600/20 to-orange-600/20',
    description: 'The practical architect of new realities'
  },
  { 
    id: 'seeker' as EgoStateId, 
    name: 'Seeker', 
    icon: '🔭', 
    role: 'Student', 
    color: 'from-indigo-600/20 to-teal-600/20',
    description: 'The eternal student of truth and wisdom'
  },
  { 
    id: 'lover' as EgoStateId, 
    name: 'Lover', 
    icon: '💞', 
    role: 'Connector', 
    color: 'from-rose-600/20 to-pink-500/20',
    description: 'The heart that connects all beings'
  },
  { 
    id: 'trickster' as EgoStateId, 
    name: 'Trickster', 
    icon: '🃏', 
    role: 'Pattern Breaker', 
    color: 'from-green-500/20 to-purple-600/20',
    description: 'The clever disruptor of rigid patterns'
  },
  { 
    id: 'warrior' as EgoStateId, 
    name: 'Warrior', 
    icon: '⚔️', 
    role: 'Fighter', 
    color: 'from-red-700/20 to-black/20',
    description: 'The courageous fighter for justice'
  },
  { 
    id: 'visionary' as EgoStateId, 
    name: 'Visionary', 
    icon: '🌌', 
    role: 'Prophet', 
    color: 'from-violet-600/20 to-blue-400/20',
    description: 'The seer of future possibilities'
  }
] as const;

// Helper functions
export const getEgoState = (id: EgoStateId) => {
  return EGO_STATES.find(state => state.id === id) || EGO_STATES[0];
};

// Export session store
import useSessionStoreDefault from './sessionStore';
export const useSessionStore = useSessionStoreDefault;