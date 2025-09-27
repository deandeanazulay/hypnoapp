export type TabId = 'home' | 'explore' | 'create' | 'chat' | 'profile';

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
    name: 'Journey',
    icon: '🗺️',
    description: 'Transformation Path'
  },
  {
    id: 'create',
    name: 'Create',
    icon: '✨',
    description: 'Custom Journey Builder'
  },
  {
    id: 'chat',
    name: 'Chat',
    icon: '💬',
    description: 'Talk with Libero'
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