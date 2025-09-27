import { create } from 'zustand';

export type TabId = 'home' | 'explore' | 'create' | 'favorites' | 'profile' | 'chat';

export interface EgoState {
  id: string;
  name: string;
  icon: string;
  role: string;
  description: string;
  color: string;
}

export interface ToastMessage {
  type: 'success' | 'error' | 'info' | 'warning';
  message: string;
}

interface AppState {
  activeTab: TabId;
  activeEgoState: string;
  modals: {
    auth: boolean;
    settings: boolean;
    plan: boolean;
    tokens: boolean;
    egoStates: boolean;
    favorites: boolean;
    documentationHub: boolean;
  };
  toast: ToastMessage | null;
  setActiveTab: (tab: TabId) => void;
  setActiveEgoState: (state: string) => void;
  openModal: (modal: keyof AppState['modals']) => void;
  closeModal: (modal: keyof AppState['modals']) => void;
  openEgoModal: () => void;
  showToast: (toast: ToastMessage) => void;
  hideToast: () => void;
}

export const EGO_STATES: EgoState[] = [
  {
    id: 'guardian',
    name: 'Guardian',
    icon: '🛡️',
    role: 'Protector',
    description: 'Shields you from negativity and builds inner strength',
    color: '#3B82F6'
  },
  {
    id: 'rebel',
    name: 'Rebel',
    icon: '⚡',
    role: 'Challenger',
    description: 'Breaks through limitations and old patterns',
    color: '#EF4444'
  },
  {
    id: 'mystic',
    name: 'Mystic',
    icon: '🔮',
    role: 'Visionary',
    description: 'Connects you to deeper wisdom and intuition',
    color: '#8B5CF6'
  },
  {
    id: 'lover',
    name: 'Lover',
    icon: '💖',
    role: 'Connector',
    description: 'Cultivates self-love and emotional healing',
    color: '#EC4899'
  },
  {
    id: 'builder',
    name: 'Builder',
    icon: '🔨',
    role: 'Creator',
    description: 'Manifests goals and builds new realities',
    color: '#F59E0B'
  },
  {
    id: 'seeker',
    name: 'Seeker',
    icon: '🧭',
    role: 'Explorer',
    description: 'Discovers new paths and possibilities',
    color: '#10B981'
  },
  {
    id: 'trickster',
    name: 'Trickster',
    icon: '🎭',
    role: 'Transformer',
    description: 'Uses humor and playfulness to create change',
    color: '#F97316'
  },
  {
    id: 'warrior',
    name: 'Warrior',
    icon: '⚔️',
    role: 'Fighter',
    description: 'Builds courage and conquers fears',
    color: '#DC2626'
  },
  {
    id: 'visionary',
    name: 'Visionary',
    icon: '👁️',
    role: 'Dreamer',
    description: 'Expands consciousness and imagination',
    color: '#06B6D4'
  }
];

export const useAppStore = create<AppState>((set) => ({
  activeTab: 'home',
  activeEgoState: 'guardian',
  modals: {
    auth: false,
    settings: false,
    plan: false,
    tokens: false,
    egoStates: false,
    favorites: false,
    documentationHub: false,
  },
  toast: null,
  setActiveTab: (tab) => set({ activeTab: tab }),
  setActiveEgoState: (state) => set({ activeEgoState: state }),
  openModal: (modal) =>
    set((state) => ({
      modals: { ...state.modals, [modal]: true },
    })),
  closeModal: (modal) =>
    set((state) => ({
      modals: { ...state.modals, [modal]: false },
    })),
  openEgoModal: () =>
    set((state) => ({
      modals: { ...state.modals, egoStates: true },
    })),
  showToast: (toast) => set({ toast }),
  hideToast: () => set({ toast: null }),
}));

export const getEgoState = (id: string): EgoState => {
  return EGO_STATES.find((state) => state.id === id) || EGO_STATES[0];
};