import { create } from 'zustand';
import { persist } from 'zustand/middleware';

export interface SerializableIcon {
  type: string;
  props: Record<string, any>;
}

export interface CustomAction {
  id: string;
  name: string;
  iconData: SerializableIcon;
  color: string;
  description: string;
  isCustom: boolean;
  induction?: string;
  deepener?: string;
  duration?: number;
}

interface ProtocolStore {
  customActions: CustomAction[];
  addCustomAction: (action: Omit<CustomAction, 'id' | 'isCustom'>) => string;
  removeCustomAction: (id: string) => void;
  updateCustomAction: (id: string, updates: Partial<CustomAction>) => void;
}

export const useProtocolStore = create<ProtocolStore>()(
  persist(
    (set, get) => ({
      customActions: [],
      
      addCustomAction: (action) => {
        const newAction: CustomAction = {
          ...action,
          id: `custom-${Date.now()}`,
          isCustom: true
        };
        
        set((state) => ({
          customActions: [...state.customActions, newAction]
        }));
        
        return newAction.id;
      },
      
      removeCustomAction: (id) => {
        set((state) => ({
          customActions: state.customActions.filter(action => action.id !== id)
        }));
      },
      
      updateCustomAction: (id, updates) => {
        set((state) => ({
          customActions: state.customActions.map(action =>
            action.id === id ? { ...action, ...updates } : action
          )
        }));
      }
    }),
    {
      name: 'protocol-store',
      partialize: (state) => ({
        customActions: state.customActions
      })
    }
  )
);