import { create } from 'zustand';

export interface ToastMessage {
  id: string;
  type: 'success' | 'error' | 'info' | 'warning';
  message: string;
  duration?: number;
}

export interface EgoState {
  id: string;
  name: string;
  icon: string;
  role: string;
  color: string;
  description: string;
}

export interface AppState {
  // Modal states
  modals: {
    auth: boolean;
    settings: boolean;
    plan: boolean;
    tokens: boolean;
    egoStates: boolean;
    favorites: boolean;
    documentationHub: boolean;
    personalLibrary: boolean;
  };
  
  // Toast system
  toasts: ToastMessage[];
  
  // Navigation
  activeTab: string;
  
  // Ego state
  activeEgoState: string;
  
  // Actions
  openModal: (modal: keyof AppState['modals']) => void;
  closeModal: (modal: keyof AppState['modals']) => void;
  closeAllModals: () => void;
  
  showToast: (toast: Omit<ToastMessage, 'id'>) => void;
  removeToast: (id: string) => void;
  
  setActiveTab: (tab: string) => void;
  setActiveEgoState: (state: string) => void;
}

export const EGO_STATES: EgoState[] = [
  {
    id: 'guardian',
    name: 'Guardian',
    icon: '🛡️',
    role: 'Protector',
    color: '#3B82F6',
    description: 'Provides security and stability'
  },
  {
    id: 'rebel',
    name: 'Rebel',
    icon: '⚡',
    role: 'Challenger',
    color: '#EF4444',
    description: 'Breaks through limitations'
  },
  {
    id: 'mystic',
    name: 'Mystic',
    icon: '🔮',
    role: 'Seeker',
    color: '#8B5CF6',
    description: 'Explores inner wisdom'
  },
  {
    id: 'lover',
    name: 'Lover',
    icon: '💖',
    role: 'Connector',
    color: '#EC4899',
    description: 'Embraces emotional depth'
  },
  {
    id: 'builder',
    name: 'Builder',
    icon: '🔨',
    role: 'Creator',
    color: '#F59E0B',
    description: 'Constructs new realities'
  },
  {
    id: 'seeker',
    name: 'Seeker',
    icon: '🧭',
    role: 'Explorer',
    color: '#10B981',
    description: 'Pursues truth and meaning'
  },
  {
    id: 'trickster',
    name: 'Trickster',
    icon: '🎭',
    role: 'Transformer',
    color: '#F97316',
    description: 'Changes perspective through play'
  },
  {
    id: 'warrior',
    name: 'Warrior',
    icon: '⚔️',
    role: 'Champion',
    color: '#DC2626',
    description: 'Fights for what matters'
  },
  {
    id: 'visionary',
    name: 'Visionary',
    icon: '👁️',
    role: 'Seer',
    color: '#6366F1',
    description: 'Sees possibilities beyond the present'
  }
];

export const getEgoState = (id: string): EgoState => {
  return EGO_STATES.find(state => state.id === id) || EGO_STATES[0];
};

export const useAppStore = create<AppState>((set, get) => ({
  // Initial state
  modals: {
    auth: false,
    settings: false,
    plan: false,
    tokens: false,
    egoStates: false,
    favorites: false,
    documentationHub: false,
    personalLibrary: false,
  },
  
  toasts: [],
  activeTab: 'home',
  activeEgoState: 'guardian',
  
  // Modal actions
  openModal: (modal) => set((state) => ({
    modals: { ...state.modals, [modal]: true }
  })),
  
  closeModal: (modal) => set((state) => ({
    modals: { ...state.modals, [modal]: false }
  })),
  
  closeAllModals: () => set((state) => ({
    modals: {
      auth: false,
      settings: false,
      plan: false,
      tokens: false,
      egoStates: false,
      favorites: false,
      documentationHub: false,
      personalLibrary: false,
    }
  })),
  
  // Toast actions
  showToast: (toast) => {
    const id = Math.random().toString(36).substr(2, 9);
    const newToast = { ...toast, id };
    
    set((state) => ({
      toasts: [...state.toasts, newToast]
    }));
    
    // Auto-remove toast after duration
    setTimeout(() => {
      get().removeToast(id);
    }, toast.duration || 3000);
  },
  
  removeToast: (id) => set((state) => ({
    toasts: state.toasts.filter(toast => toast.id !== id)
  })),
  
  // Navigation actions
  setActiveTab: (tab) => set({ activeTab: tab }),
  
  // Ego state actions
  setActiveEgoState: (state) => set({ activeEgoState: state }),
}));

// Achievement definitions
export const ACHIEVEMENTS = [
  {
    id: 'first_session',
    name: 'First Steps',
    description: 'Complete your first transformation session',
    icon: '🌟',
    rarity: 'common'
  },
  {
    id: 'three_day_streak',
    name: 'Building Momentum',
    description: 'Maintain a 3-day practice streak',
    icon: '⚡',
    rarity: 'common'
  },
  {
    id: 'week_warrior',
    name: 'Week Warrior',
    description: 'Complete 7 consecutive days of practice',
    icon: '🏆',
    rarity: 'rare'
  },
  {
    id: 'month_master',
    name: 'Month Master',
    description: 'Maintain a 30-day streak',
    icon: '👑',
    rarity: 'epic'
  },
  {
    id: 'level_5_master',
    name: 'Level 5 Master',
    description: 'Reach Level 5',
    icon: '🎯',
    rarity: 'rare'
  },
  {
    id: 'level_10_sage',
    name: 'Level 10 Sage',
    description: 'Reach Level 10',
    icon: '🧙',
    rarity: 'epic'
  },
  {
    id: 'ego_explorer',
    name: 'Ego Explorer',
    description: 'Try 3 different ego state guides',
    icon: '🗺️',
    rarity: 'uncommon'
  },
  {
    id: 'archetypal_master',
    name: 'Archetypal Master',
    description: 'Use 6 different ego states',
    icon: '🎭',
    rarity: 'epic'
  },
  {
    id: 'token_collector',
    name: 'Token Collector',
    description: 'Accumulate 100 tokens',
    icon: '💰',
    rarity: 'rare'
  }
];

export const getAchievement = (id: string) => {
  return ACHIEVEMENTS.find(achievement => achievement.id === id);
};
// Convenience function to open ego modal
export const openEgoModal = () => {
  useAppStore.getState().openModal('egoStates');
};