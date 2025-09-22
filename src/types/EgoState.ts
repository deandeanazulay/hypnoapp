export interface EgoState {
  id: string;
  name: string;
  role: string;
  color: string;
  glowColor: string;
  icon: string;
  description: string;
  usedFor: string[];
  orbAnimation: 'shield' | 'flare' | 'wave' | 'ripple' | 'spiral' | 'radiant' | 'bounce' | 'pulse' | 'flicker';
}

export const EGO_STATES: EgoState[] = [
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
  }
];