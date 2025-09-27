import { create } from 'zustand';

// Types
export interface ToastMessage {
  id: string;
  type: 'success' | 'error' | 'info' | 'warning';
  message: string;
  duration?: number;
}

export interface EgoState {
  id: string;
  name: string;
  role: string;
  icon: string;
  description: string;
  color: string;
  accent: string;
}

interface AppState {
  // Modal states
  modals: {
    auth: boolean;
    settings: boolean;
    egoStates: boolean;
    favorites: boolean;
    plan: boolean;
    tokens: boolean;
    documentationHub: boolean;
  };
  
  // Toast system
  toasts: ToastMessage[];
  
  // Ego state
  activeEgoState: string;
  
  // Actions
  openModal: (modal: keyof AppState['modals']) => void;
  closeModal: (modal: keyof AppState['modals']) => void;
  openEgoModal: () => void;
  showToast: (toast: Omit<ToastMessage, 'id'>) => void;
  removeToast: (id: string) => void;
  setActiveEgoState: (stateId: string) => void;
}

// Ego States Data
export const EGO_STATES: EgoState[] = [
  {
    id: 'guardian',
    name: 'Guardian',
    role: 'Protector & Stabilizer',
    icon: '🛡️',
    description: 'Shields you from stress and creates safe mental spaces',
    color: '#0891b2',
    accent: '#06b6d4'
  },
  {
    id: 'rebel',
    name: 'Rebel',
    role: 'Breaker of Patterns',
    icon: '⚡',
    description: 'Breaks through mental barriers and limiting beliefs',
    color: '#dc2626',
    accent: '#ef4444'
  },
  {
    id: 'mystic',
    name: 'Mystic',
    role: 'Wisdom Seeker',
    icon: '🔮',
    description: 'Connects you to deeper insight and intuitive knowing',
    color: '#7c3aed',
    accent: '#8b5cf6'
  },
  {
    id: 'lover',
    name: 'Lover',
    role: 'Heart Healer',
    icon: '💖',
    description: 'Cultivates self-compassion and emotional healing',
    color: '#ec4899',
    accent: '#f472b6'
  },
  {
    id: 'builder',
    name: 'Builder',
    role: 'Achievement Catalyst',
    icon: '🏗️',
    description: 'Structures your mind for success and manifestation',
    color: '#ea580c',
    accent: '#f97316'
  },
  {
    id: 'seeker',
    name: 'Seeker',
    role: 'Explorer of Possibilities',
    icon: '🧭',
    description: 'Opens new pathways and expands your perspective',
    color: '#059669',
    accent: '#10b981'
  },
  {
    id: 'trickster',
    name: 'Trickster',
    role: 'Joyful Transformer',
    icon: '🎭',
    description: 'Uses play and humor to shift your mental state',
    color: '#d946ef',
    accent: '#e879f9'
  },
  {
    id: 'warrior',
    name: 'Warrior',
    role: 'Courage Activator',
    icon: '⚔️',
    description: 'Builds inner strength and conquers fears',
    color: '#b91c1c',
    accent: '#dc2626'
  },
  {
    id: 'visionary',
    name: 'Visionary',
    role: 'Future Architect',
    icon: '🌟',
    description: 'Connects you to your highest potential and dreams',
    color: '#7c2d12',
    accent: '#ea580c'
  }
];

// Helper function
export const getEgoState = (id: string): EgoState => {
  return EGO_STATES.find(state => state.id === id) || EGO_STATES[0];
};

// Store
export const useAppStore = create<AppState>((set) => ({
  modals: {
    auth: false,
    settings: false,
    egoStates: false,
    favorites: false,
    plan: false,
    tokens: false,
    documentationHub: false,
  },
  
  toasts: [],
  
  activeEgoState: 'guardian',
  
  openModal: (modal) => 
    set((state) => ({ 
      modals: { ...state.modals, [modal]: true } 
    })),
    
  closeModal: (modal) => 
    set((state) => ({ 
      modals: { ...state.modals, [modal]: false } 
    })),
    
  openEgoModal: () => 
    set((state) => ({ 
      modals: { ...state.modals, egoStates: true } 
    })),
    
  showToast: (toast) =>
    set((state) => ({
      toasts: [...state.toasts, { ...toast, id: Date.now().toString() }]
    })),
    
  removeToast: (id) =>
    set((state) => ({
      toasts: state.toasts.filter(toast => toast.id !== id)
    })),
    
  setActiveEgoState: (stateId) =>
    set({ activeEgoState: stateId }),
}));