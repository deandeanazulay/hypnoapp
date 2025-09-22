export type TabId = 'home' | 'explore' | 'create' | 'favorites' | 'profile';

export interface Tab {
  id: TabId;
  name: string;
  icon: string;
  description: string;
}

export const TABS: Tab[] = [
  {
    id: 'home',
    name: 'Home',
    icon: '🏠',
    description: 'Orb Dashboard'
  },
  {
    id: 'explore',
    name: 'Explore',
    icon: '🔍',
    description: 'Library & Protocols'
  },
  {
    id: 'create',
    name: 'Create',
    icon: '✨',
    description: 'Custom Journey Builder'
  },
  {
    id: 'favorites',
    name: 'Favorites',
    icon: '❤️',
    description: 'Quick Access'
  },
  {
    id: 'profile',
    name: 'Profile',
    icon: '👤',
    description: 'Ego Map'
  }
];

export interface Protocol {
  id: string;
  name: string;
  description: string;
  duration: number;
  type: 'induction' | 'deepener' | 'complete';
  difficulty: 'beginner' | 'intermediate' | 'advanced';
  tags: string[];
}

export const DEFAULT_PROTOCOLS: Protocol[] = [
  {
    id: 'rapid-induction',
    name: 'Rapid Induction',
    description: 'Quick entry into trance state using Elman technique',
    duration: 5,
    type: 'induction',
    difficulty: 'intermediate',
    tags: ['quick', 'direct', 'analytical']
  },
  {
    id: 'progressive-relaxation',
    name: 'Progressive Relaxation',
    description: 'Gentle body-based induction for beginners',
    duration: 15,
    type: 'complete',
    difficulty: 'beginner',
    tags: ['gentle', 'body-based', 'relaxing']
  },
  {
    id: 'book-balloon',
    name: 'Book & Balloon',
    description: 'Kinesthetic induction using visualization',
    duration: 12,
    type: 'induction',
    difficulty: 'beginner',
    tags: ['kinesthetic', 'visualization', 'creative']
  },
  {
    id: 'spiral-staircase',
    name: 'Spiral Staircase',
    description: 'Classic deepening technique',
    duration: 8,
    type: 'deepener',
    difficulty: 'beginner',
    tags: ['deepening', 'visualization', 'classic']
  }
];