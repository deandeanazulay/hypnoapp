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
  };
  
  // Toasts
  toasts: Toast[];
  
  // Actions
  setActiveTab: (tab: TabId) => void;
  setActiveEgoState: (id: EgoStateId) => void;
  setLoading: (loading: boolean) => void;
  openModal: (modal: keyof AppState['modals']) => void;
  closeModal: (modal: keyof AppState['modals']) => void;
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
        auth: false
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
  { id: 'guardian', name: 'Guardian', icon: '🛡️', role: 'Protector' },
  { id: 'rebel', name: 'Rebel', icon: '🔥', role: 'Liberator' },
  { id: 'healer', name: 'Healer', icon: '🌿', role: 'Nurturer' },
  { id: 'explorer', name: 'Explorer', icon: '🌍', role: 'Adventurer' },
  { id: 'mystic', name: 'Mystic', icon: '✨', role: 'Transcendent' },
  { id: 'sage', name: 'Sage', icon: '📜', role: 'Teacher' },
  { id: 'child', name: 'Child', icon: '🎈', role: 'Playful' },
  { id: 'performer', name: 'Performer', icon: '🎭', role: 'Expressive' },
  { id: 'shadow', name: 'Shadow', icon: '🌑', role: 'Integrator' },
  { id: 'builder', name: 'Builder', icon: '🛠️', role: 'Creator' },
  { id: 'seeker', name: 'Seeker', icon: '🔭', role: 'Student' },
  { id: 'lover', name: 'Lover', icon: '💞', role: 'Connector' },
  { id: 'trickster', name: 'Trickster', icon: '🃏', role: 'Pattern Breaker' },
  { id: 'warrior', name: 'Warrior', icon: '⚔️', role: 'Fighter' },
  { id: 'visionary', name: 'Visionary', icon: '🌌', role: 'Prophet' }
] as const;

// Helper functions
export const getEgoState = (id: EgoStateId) => {
  return EGO_STATES.find(state => state.id === id) || EGO_STATES[0];
};