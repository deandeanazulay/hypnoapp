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

// Protocols should be fetched dynamically from the database
// or from a content management system in production