// Centralized Design System & Theme Configuration
export const THEME = {
  // Core Colors
  colors: {
    primary: '#14B8A6',      // Teal
    secondary: '#A855F7',    // Purple  
    accent: '#F59E0B',       // Amber
    success: '#10B981',      // Green
    warning: '#F59E0B',      // Amber
    error: '#EF4444',        // Red
    
    // Glass Transparency Levels
    glass: {
      light: 'rgba(255, 255, 255, 0.05)',
      medium: 'rgba(255, 255, 255, 0.08)', 
      strong: 'rgba(255, 255, 255, 0.12)'
    },
    
    // Text Colors
    text: {
      primary: 'rgba(255, 255, 255, 0.95)',
      secondary: 'rgba(255, 255, 255, 0.80)',
      muted: 'rgba(255, 255, 255, 0.60)',
      dim: 'rgba(255, 255, 255, 0.40)'
    }
  },

  // Ego State Colors - Simplified
  egoStates: {
    guardian: { bg: 'from-blue-600 to-blue-800', accent: '#3B82F6', baseColorName: 'blue' },
    rebel: { bg: 'from-red-600 to-red-800', accent: '#EF4444', baseColorName: 'red' },
    healer: { bg: 'from-green-600 to-green-800', accent: '#22C55E', baseColorName: 'green' },
    explorer: { bg: 'from-yellow-500 to-yellow-700', accent: '#EAB308', baseColorName: 'yellow' },
    mystic: { bg: 'from-purple-600 to-purple-800', accent: '#A855F7', baseColorName: 'purple' },
    sage: { bg: 'from-gray-300 to-gray-500', accent: '#9CA3AF', baseColorName: 'gray' },
    child: { bg: 'from-orange-500 to-orange-700', accent: '#F97316', baseColorName: 'orange' },
    performer: { bg: 'from-pink-600 to-pink-800', accent: '#EC4899', baseColorName: 'pink' },
    shadow: { bg: 'from-indigo-900 to-black', accent: '#4F46E5', baseColorName: 'indigo' },
    builder: { bg: 'from-gray-600 to-orange-600', accent: '#F97316', baseColorName: 'orange' },
    seeker: { bg: 'from-indigo-600 to-teal-600', accent: '#14B8A6', baseColorName: 'teal' },
    lover: { bg: 'from-rose-600 to-pink-500', accent: '#F472B6', baseColorName: 'pink' },
    trickster: { bg: 'from-green-500 to-purple-600', accent: '#A855F7', baseColorName: 'purple' },
    warrior: { bg: 'from-red-700 to-black', accent: '#B91C1C', baseColorName: 'red' },
    visionary: { bg: 'from-violet-600 to-blue-400', accent: '#8B5CF6', baseColorName: 'violet' }
  },

  // Typography Scale
  typography: {
    h1: 'text-4xl md:text-6xl font-light',
    h2: 'text-2xl md:text-4xl font-light', 
    h3: 'text-xl font-medium',
    body: 'text-base',
    caption: 'text-sm',
    micro: 'text-xs'
  },

  // Spacing Scale (8px system)
  spacing: {
    xs: '0.5rem',  // 8px
    sm: '1rem',    // 16px  
    md: '1.5rem',  // 24px
    lg: '2rem',    // 32px
    xl: '3rem',    // 48px
    xxl: '4rem'    // 64px
  },

  // Border Radius Scale
  radius: {
    sm: '0.5rem',   // 8px
    md: '0.75rem',  // 12px
    lg: '1rem',     // 16px
    xl: '1.5rem',   // 24px
    full: '9999px'
  },

  // Shadows
  shadows: {
    sm: '0 4px 12px rgba(0, 0, 0, 0.15)',
    md: '0 8px 24px rgba(0, 0, 0, 0.20)', 
    lg: '0 12px 32px rgba(0, 0, 0, 0.25)',
    glow: '0 0 20px rgba(20, 184, 166, 0.4)'
  },

  // Animations
  animations: {
    fast: '0.15s ease',
    normal: '0.3s ease',
    slow: '0.5s ease'
  }
} as const;

// Helper Functions
export const getEgoColor = (egoStateId: string) => {
  return THEME.egoStates[egoStateId as keyof typeof THEME.egoStates] || THEME.egoStates.guardian;
};

export const glassClass = (level: 'light' | 'medium' | 'strong' = 'medium') => {
  return `backdrop-blur-xl border border-white/20 shadow-lg`;
};