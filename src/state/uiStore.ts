import { create } from 'zustand';
import { persist } from 'zustand/middleware';

export interface UIState {
  // Modal States
  isEgoModalOpen: boolean;
  isSettingsModalOpen: boolean;
  isFiltersModalOpen: boolean;
  isProtocolDetailsModalOpen: boolean;
  
  // Sheet States
  isCreateStepperOpen: boolean;
  isOnboardingOpen: boolean;
  
  // Navigation
  activeTab: 'home' | 'explore' | 'create' | 'favorites' | 'profile';
  previousTab: 'home' | 'explore' | 'create' | 'favorites' | 'profile' | null;
  
  // UI Flags
  isLoading: boolean;
  isDarkMode: boolean;
  isFirstVisit: boolean;
  hasSeenOnboarding: boolean;
  showHints: boolean;
  enableAnimations: boolean;
  enableHaptics: boolean;
  
  // Selected Items
  selectedProtocol: any | null;
  selectedSession: any | null;
  selectedEgoState: string | null;
  
  // Notifications
  notifications: Notification[];
  toasts: Toast[];
  
  // Performance
  prefersReducedMotion: boolean;
  connectionSpeed: 'slow' | 'fast';
}

interface Notification {
  id: string;
  type: 'success' | 'warning' | 'error' | 'info';
  title: string;
  message?: string;
  timestamp: number;
  read: boolean;
  actionLabel?: string;
  actionHandler?: () => void;
}

interface Toast {
  id: string;
  type: 'success' | 'warning' | 'error' | 'info';
  message: string;
  duration?: number;
  timestamp: number;
}

interface UIActions {
  // Modal Actions
  openEgoModal: () => void;
  closeEgoModal: () => void;
  openSettingsModal: () => void;
  closeSettingsModal: () => void;
  openFiltersModal: () => void;
  closeFiltersModal: () => void;
  openProtocolDetailsModal: (protocol: any) => void;
  closeProtocolDetailsModal: () => void;
  
  // Sheet Actions
  openCreateStepper: () => void;
  closeCreateStepper: () => void;
  openOnboarding: () => void;
  closeOnboarding: () => void;
  
  // Navigation Actions
  setActiveTab: (tab: UIState['activeTab']) => void;
  goBack: () => void;
  
  // UI Actions
  setLoading: (loading: boolean) => void;
  toggleDarkMode: () => void;
  setFirstVisit: (isFirst: boolean) => void;
  markOnboardingComplete: () => void;
  toggleHints: () => void;
  toggleAnimations: () => void;
  toggleHaptics: () => void;
  
  // Selection Actions
  selectProtocol: (protocol: any) => void;
  clearSelectedProtocol: () => void;
  selectSession: (session: any) => void;
  clearSelectedSession: () => void;
  selectEgoState: (egoState: string) => void;
  clearSelectedEgoState: () => void;
  
  // Notification Actions
  addNotification: (notification: Omit<Notification, 'id' | 'timestamp' | 'read'>) => void;
  markNotificationRead: (id: string) => void;
  removeNotification: (id: string) => void;
  clearNotifications: () => void;
  
  // Toast Actions
  showToast: (toast: Omit<Toast, 'id' | 'timestamp'>) => void;
  removeToast: (id: string) => void;
  clearToasts: () => void;
  
  // Performance Actions
  setReducedMotion: (reduced: boolean) => void;
  setConnectionSpeed: (speed: 'slow' | 'fast') => void;
}

const initialState: UIState = {
  // Modal States
  isEgoModalOpen: false,
  isSettingsModalOpen: false,
  isFiltersModalOpen: false,
  isProtocolDetailsModalOpen: false,
  
  // Sheet States
  isCreateStepperOpen: false,
  isOnboardingOpen: false,
  
  // Navigation
  activeTab: 'home',
  previousTab: null,
  
  // UI Flags
  isLoading: false,
  isDarkMode: true,
  isFirstVisit: true,
  hasSeenOnboarding: false,
  showHints: true,
  enableAnimations: true,
  enableHaptics: true,
  
  // Selected Items
  selectedProtocol: null,
  selectedSession: null,
  selectedEgoState: null,
  
  // Notifications
  notifications: [],
  toasts: [],
  
  // Performance
  prefersReducedMotion: false,
  connectionSpeed: 'fast'
};

export const useUIStore = create<UIState & UIActions>()(
  persist(
    (set, get) => ({
      ...initialState,
      
      // Modal Actions
      openEgoModal: () => {
        set({ isEgoModalOpen: true });
        document.body.style.overflow = 'hidden';
      },
      closeEgoModal: () => {
        set({ isEgoModalOpen: false });
        document.body.style.overflow = '';
      },
      openSettingsModal: () => {
        set({ isSettingsModalOpen: true });
        document.body.style.overflow = 'hidden';
      },
      closeSettingsModal: () => {
        set({ isSettingsModalOpen: false });
        document.body.style.overflow = '';
      },
      openFiltersModal: () => set({ isFiltersModalOpen: true }),
      closeFiltersModal: () => set({ isFiltersModalOpen: false }),
      openProtocolDetailsModal: (protocol: any) => {
        set({ isProtocolDetailsModalOpen: true, selectedProtocol: protocol });
        document.body.style.overflow = 'hidden';
      },
      closeProtocolDetailsModal: () => {
        set({ isProtocolDetailsModalOpen: false, selectedProtocol: null });
        document.body.style.overflow = '';
      },
      
      // Sheet Actions
      openCreateStepper: () => set({ isCreateStepperOpen: true }),
      closeCreateStepper: () => set({ isCreateStepperOpen: false }),
      openOnboarding: () => set({ isOnboardingOpen: true }),
      closeOnboarding: () => set({ isOnboardingOpen: false }),
      
      // Navigation Actions
      setActiveTab: (tab) => {
        const current = get().activeTab;
        set({ activeTab: tab, previousTab: current });
      },
      goBack: () => {
        const previousTab = get().previousTab;
        if (previousTab) {
          set({ activeTab: previousTab, previousTab: null });
        }
      },
      
      // UI Actions
      setLoading: (loading) => set({ isLoading: loading }),
      toggleDarkMode: () => set((state) => ({ isDarkMode: !state.isDarkMode })),
      setFirstVisit: (isFirst) => set({ isFirstVisit: isFirst }),
      markOnboardingComplete: () => set({ hasSeenOnboarding: true, isOnboardingOpen: false }),
      toggleHints: () => set((state) => ({ showHints: !state.showHints })),
      toggleAnimations: () => set((state) => ({ enableAnimations: !state.enableAnimations })),
      toggleHaptics: () => set((state) => ({ enableHaptics: !state.enableHaptics })),
      
      // Selection Actions
      selectProtocol: (protocol) => set({ selectedProtocol: protocol }),
      clearSelectedProtocol: () => set({ selectedProtocol: null }),
      selectSession: (session) => set({ selectedSession: session }),
      clearSelectedSession: () => set({ selectedSession: null }),
      selectEgoState: (egoState) => set({ selectedEgoState: egoState }),
      clearSelectedEgoState: () => set({ selectedEgoState: null }),
      
      // Notification Actions
      addNotification: (notification) => {
        const id = Date.now().toString();
        const newNotification: Notification = {
          ...notification,
          id,
          timestamp: Date.now(),
          read: false
        };
        set((state) => ({
          notifications: [newNotification, ...state.notifications].slice(0, 50) // Limit to 50
        }));
      },
      markNotificationRead: (id) => {
        set((state) => ({
          notifications: state.notifications.map(n =>
            n.id === id ? { ...n, read: true } : n
          )
        }));
      },
      removeNotification: (id) => {
        set((state) => ({
          notifications: state.notifications.filter(n => n.id !== id)
        }));
      },
      clearNotifications: () => set({ notifications: [] }),
      
      // Toast Actions
      showToast: (toast) => {
        const id = Date.now().toString();
        const newToast: Toast = {
          ...toast,
          id,
          timestamp: Date.now()
        };
        set((state) => ({
          toasts: [...state.toasts, newToast]
        }));
        
        // Auto-remove toast after duration
        const duration = toast.duration || 4000;
        setTimeout(() => {
          get().removeToast(id);
        }, duration);
      },
      removeToast: (id) => {
        set((state) => ({
          toasts: state.toasts.filter(t => t.id !== id)
        }));
      },
      clearToasts: () => set({ toasts: [] }),
      
      // Performance Actions
      setReducedMotion: (reduced) => set({ prefersReducedMotion: reduced }),
      setConnectionSpeed: (speed) => set({ connectionSpeed: speed })
    }),
    {
      name: 'hypno-ui-store',
      partialize: (state) => ({
        isDarkMode: state.isDarkMode,
        hasSeenOnboarding: state.hasSeenOnboarding,
        showHints: state.showHints,
        enableAnimations: state.enableAnimations,
        enableHaptics: state.enableHaptics,
        isFirstVisit: state.isFirstVisit
      })
    }
  )
);

// Selectors for common use cases
export const useModalStates = () => {
  const store = useUIStore();
  return {
    isEgoModalOpen: store.isEgoModalOpen,
    isSettingsModalOpen: store.isSettingsModalOpen,
    isFiltersModalOpen: store.isFiltersModalOpen,
    isProtocolDetailsModalOpen: store.isProtocolDetailsModalOpen
  };
};

export const useNotifications = () => {
  const store = useUIStore();
  return {
    notifications: store.notifications,
    unreadCount: store.notifications.filter(n => !n.read).length,
    addNotification: store.addNotification,
    markNotificationRead: store.markNotificationRead,
    removeNotification: store.removeNotification,
    clearNotifications: store.clearNotifications
  };
};

export const useToasts = () => {
  const store = useUIStore();
  return {
    toasts: store.toasts,
    showToast: store.showToast,
    removeToast: store.removeToast,
    clearToasts: store.clearToasts
  };
};