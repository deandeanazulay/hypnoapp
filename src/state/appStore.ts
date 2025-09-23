import { create } from 'zustand';
import { persist } from 'zustand/middleware';

export type EgoStateId =
  | 'guardian' | 'rebel' | 'healer' | 'explorer' | 'mystic' | 'sage' | 'child' | 'performer' | 'shadow'
  | 'builder' | 'seeker' | 'lover' | 'trickster' | 'warrior' | 'visionary';

export interface EgoStateMeta {
  id: EgoStateId;
  name: string;
  role: string;
  color: string;
  glowColor: string;
  icon: string;
  description: string;
  usedFor: string[];
  orbAnimation: 'shield' | 'flare' | 'wave' | 'ripple' | 'spiral' | 'radiant' | 'bounce' | 'pulse' | 'flicker';
}

export const egoStates: EgoStateMeta[] = [
  {
    id: 'guardian', 
    name: 'Guardian',
    role: 'Protector, Safety, Boundaries',
    color: 'from-blue-600 to-blue-800',
    glowColor: 'shadow-blue-500/50',
    icon: '🛡️',
    description: 'Deep Blue — Solid protection and grounding',
    usedFor: ['Anxiety reduction', 'Grounding', 'Trauma safety'],
    orbAnimation: 'shield'
  },
  {
    id: 'rebel',
    name: 'Rebel',
    role: 'Challenger, Fighter, Liberator',
    color: 'from-red-600 to-red-800',
    glowColor: 'shadow-red-500/50',
    icon: '🔥',
    description: 'Crimson — Breaking through limitations',
    usedFor: ['Breaking bad habits', 'Reclaiming power', 'Anger transformation'],
    orbAnimation: 'flare'
  },
  {
    id: 'healer',
    name: 'Healer',
    role: 'Nurturer, Rest, Recovery',
    color: 'from-green-600 to-green-800',
    glowColor: 'shadow-green-500/50',
    icon: '🌿',
    description: 'Emerald Green — Gentle healing energy',
    usedFor: ['Sleep', 'Healing', 'Comfort', 'Inner child care'],
    orbAnimation: 'wave'
  },
  {
    id: 'explorer',
    name: 'Explorer',
    role: 'Adventurer, Learner, Pioneer',
    color: 'from-yellow-500 to-yellow-700',
    glowColor: 'shadow-yellow-500/50',
    icon: '🌍',
    description: 'Golden Yellow — Expanding possibilities',
    usedFor: ['Curiosity', 'Adaptability', 'Creative problem solving'],
    orbAnimation: 'ripple'
  },
  {
    id: 'mystic',
    name: 'Mystic',
    role: 'Spiritual, Transcendent, Higher Wisdom',
    color: 'from-purple-600 to-purple-800',
    glowColor: 'shadow-purple-500/50',
    icon: '✨',
    description: 'Violet — Transcendent consciousness',
    usedFor: ['Deep trance', 'Intuition', 'Spiritual growth'],
    orbAnimation: 'spiral'
  },
  {
    id: 'sage',
    name: 'Sage',
    role: 'Teacher, Wisdom, Guidance',
    color: 'from-gray-300 to-gray-500',
    glowColor: 'shadow-gray-400/50',
    icon: '📜',
    description: 'White/Silver — Pure wisdom and clarity',
    usedFor: ['Decision-making', 'Insight', 'Calm clarity'],
    orbAnimation: 'radiant'
  },
  {
    id: 'child',
    name: 'Child',
    role: 'Playful, Innocent, Imaginative',
    color: 'from-orange-500 to-orange-700',
    glowColor: 'shadow-orange-500/50',
    icon: '🎈',
    description: 'Bright Orange — Joyful spontaneity',
    usedFor: ['Creativity', 'Joy', 'Spontaneity', 'Healing past wounds'],
    orbAnimation: 'bounce'
  },
  {
    id: 'performer',
    name: 'Performer',
    role: 'Expressive, Bold, Charismatic',
    color: 'from-pink-600 to-pink-800',
    glowColor: 'shadow-pink-500/50',
    icon: '🎭',
    description: 'Magenta — Bold self-expression',
    usedFor: ['Confidence', 'Communication', 'Public speaking'],
    orbAnimation: 'pulse'
  },
  {
    id: 'shadow',
    name: 'Shadow',
    role: 'Hidden Drives, Repressed Parts, Raw Power',
    color: 'from-indigo-900 to-black',
    glowColor: 'shadow-indigo-500/50',
    icon: '🌑',
    description: 'Black/Indigo — Integration of hidden aspects',
    usedFor: ['Integration of fear', 'Destructive habits', 'Trauma release'],
    orbAnimation: 'flicker'
  },
  {
    id: 'builder',
    name: 'Builder',
    role: 'Creator, Manifestor, System Architect',
    color: 'from-gray-600 to-orange-600',
    glowColor: 'shadow-orange-500/50',
    icon: '🛠️',
    description: 'Steel Grey/Orange — Grounding visions into reality',
    usedFor: ['Productivity', 'Goal manifestation', 'Structure building', 'Grounding'],
    orbAnimation: 'shield'
  },
  {
    id: 'seeker',
    name: 'Seeker',
    role: 'Student, Pilgrim, Learner',
    color: 'from-indigo-600 to-teal-600',
    glowColor: 'shadow-teal-500/50',
    icon: '🔭',
    description: 'Indigo/Teal — Expanding awareness and growth',
    usedFor: ['Learning', 'Research', 'Curiosity', 'Awareness expansion'],
    orbAnimation: 'ripple'
  },
  {
    id: 'lover',
    name: 'Lover',
    role: 'Connector, Empath, Heart-Driven',
    color: 'from-rose-600 to-pink-500',
    glowColor: 'shadow-rose-500/50',
    icon: '💞',
    description: 'Deep Rose/Pink — Heart connection and vulnerability',
    usedFor: ['Intimacy', 'Empathy', 'Emotional healing', 'Connection'],
    orbAnimation: 'wave'
  },
  {
    id: 'trickster',
    name: 'Trickster',
    role: 'Jester, Disruptor, Pattern Breaker',
    color: 'from-green-500 to-purple-600',
    glowColor: 'shadow-green-500/50',
    icon: '🎭',
    description: 'Neon Green/Purple — Breaking rigid patterns',
    usedFor: ['Pattern breaking', 'Flexibility', 'Creative disruption', 'Freedom'],
    orbAnimation: 'flicker'
  },
  {
    id: 'warrior',
    name: 'Warrior',
    role: 'Fighter, Disciplined Doer, Courage',
    color: 'from-red-700 to-black',
    glowColor: 'shadow-red-600/50',
    icon: '⚔️',
    description: 'Blood Red/Black — Courage and perseverance',
    usedFor: ['Courage building', 'Discipline', 'Breaking resistance', 'Perseverance'],
    orbAnimation: 'flare'
  },
  {
    id: 'visionary',
    name: 'Visionary',
    role: 'Prophet, Dreamer, Future Architect',
    color: 'from-violet-600 to-blue-400',
    glowColor: 'shadow-violet-500/50',
    icon: '🌌',
    description: 'Cosmic Violet/Starlight Blue — Future-self connection',
    usedFor: ['Future visioning', 'Strategic planning', 'Imagination', 'Foresight'],
    orbAnimation: 'spiral'
  }
];

interface AppStore {
  activeEgoState: EgoStateId;
  setActiveEgoState: (id: EgoStateId) => void;
  isEgoModalOpen: boolean;
  openEgoModal: () => void;
  closeEgoModal: () => void;
}

export const useAppStore = create<AppStore>()(
  persist(
    (set) => ({
      activeEgoState: 'guardian',
      setActiveEgoState: (id) => set({ activeEgoState: id }),
      isEgoModalOpen: false,
      openEgoModal: () => set({ isEgoModalOpen: true }),
      closeEgoModal: () => set({ isEgoModalOpen: false }),
    }),
    {
      name: 'app-store',
      partialize: (state) => ({ activeEgoState: state.activeEgoState }),
    }
  )
);

// Helper functions
export const getEgoState = (id: EgoStateId): EgoStateMeta => {
  return egoStates.find(state => state.id === id) || egoStates[0];
};

export const getEgoColor = (id: EgoStateId): string => {
  return getEgoState(id).color;
};

export const getEgoName = (id: EgoStateId): string => {
  return getEgoState(id).name;
};