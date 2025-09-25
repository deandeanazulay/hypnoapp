// Libero Brand Design System - $1M Quality
export const LIBERO_BRAND = {
  // Brand Colors (exact hex specifications)
  colors: {
    // Canvas & Backgrounds
    midnight: '#0B0F1A',        // Primary background
    deepSpace: '#0F1523',       // Elevated gradient base
    surface1: '#121A2A',        // Card surfaces
    surface2: '#162035',        // Hover/elevated states
    divider: '#22304A',         // Borders (use with opacity variants)
    
    // Brand Accents
    liberoTeal: '#15E0C3',      // Primary accent (Libero brand)
    iris: '#7C5CFF',            // Secondary accent (premium)
    gold: '#FFC960',            // Hold/highlight states
    danger: '#FF5D5D',          // Error states
    success: '#2ED573',         // Success states
    
    // Text Hierarchy
    textPrimary: '#F2F5FA',     // Primary text (high contrast)
    textSecondary: '#B3C1D1',   // Secondary text
    textMuted: '#7A8699',       // Muted/caption text
    
    // Orb Signature
    orbGlow: '#5AB6FF',         // Orb glow with feathered outer glow
    
    // Opacity Variants for Borders
    dividerSubtle: 'rgba(34, 48, 74, 0.3)',
    dividerMedium: 'rgba(34, 48, 74, 0.4)',
    dividerStrong: 'rgba(34, 48, 74, 0.6)'
  },

  // Gradients
  gradients: {
    brandAura: 'radial-gradient(circle at center, #0F1523 0%, transparent 70%)',
    ctaGlow: `0 0 24px rgba(21, 224, 195, 0.25)`,
    premiumGlow: `0 0 24px rgba(124, 92, 255, 0.25)`,
    surfaceCard: 'linear-gradient(135deg, #121A2A 0%, #162035 100%)',
    hoverCard: 'linear-gradient(135deg, #162035 0%, #1A2441 100%)'
  },

  // Typography System (Cal Sans + Inter)
  typography: {
    // Headlines (Cal Sans / Clash Display)
    h1: {
      fontSize: '28px',
      lineHeight: '36px',
      fontWeight: '700',
      letterSpacing: '-0.01em',
      fontFamily: 'var(--font-display)'
    },
    h2: {
      fontSize: '22px', 
      lineHeight: '28px',
      fontWeight: '600',
      letterSpacing: '-0.01em',
      fontFamily: 'var(--font-display)'
    },
    h3: {
      fontSize: '18px',
      lineHeight: '24px', 
      fontWeight: '600',
      fontFamily: 'var(--font-display)'
    },
    
    // Body Text (Inter)
    bodyL: {
      fontSize: '16px',
      lineHeight: '24px',
      fontWeight: '400'
    },
    bodyM: {
      fontSize: '14px',
      lineHeight: '20px', 
      fontWeight: '400'
    },
    caption: {
      fontSize: '12px',
      lineHeight: '18px',
      fontWeight: '500'
    },
    
    // UI Elements
    buttonM: {
      fontSize: '14px',
      fontWeight: '600',
      letterSpacing: '0.01em'
    }
  },

  // Elevation System
  elevation: {
    e0: 'none', // Flat
    e1: '0 8px 24px rgba(0, 0, 0, 0.24)', // Subtle
    e2: '0 12px 32px rgba(0, 0, 0, 0.28)', // Medium  
    e3: '0 24px 64px rgba(0, 0, 0, 0.32), inset 0 1px 0 rgba(255, 255, 255, 0.02)' // Modal + inner light
  },

  // Shape System
  radius: {
    card: '16px',      // Global card radius
    control: '12px',   // Small controls
    button: '10px',    // Buttons
    full: '9999px'     // Pills/circles
  },

  // Spacing Scale (8pt grid)
  spacing: {
    xs: '4px',   // 4
    sm: '8px',   // 8  
    md: '12px',  // 12
    lg: '16px',  // 16
    xl: '24px',  // 24
    xxl: '32px', // 32
    xxxl: '48px', // 48
    xxxxl: '64px' // 64
  },

  // Animation System
  motion: {
    // Durations
    micro: '120ms',
    sm: '180ms', 
    md: '240ms',
    lg: '320ms',
    
    // Easing
    enter: 'cubic-bezier(0.2, 0.9, 0.2, 1)',
    exit: 'ease-out',
    standard: 'cubic-bezier(0.4, 0, 0.2, 1)'
  },

  // Component Tokens
  components: {
    // Rail Tiles (Session Screen)
    railTileDesktop: {
      width: '56px',
      height: '56px', 
      radius: '12px'
    },
    railTileMobile: {
      width: '48px',
      height: '48px',
      radius: '12px'
    },
    
    // Indicator Cards (Right Rail)
    indicatorDesktop: {
      width: '64px',
      height: '64px',
      radius: '12px'
    },
    indicatorMobile: {
      width: '56px', 
      height: '56px',
      radius: '12px'
    },

    // Header
    headerHeight: '64px',
    headerMobile: '56px',
    
    // Bottom Dock
    dockHeight: '88px',
    dockMobile: '72px'
  }
} as const;

// Legacy theme wrapper for backward compatibility
export const THEME = {
  colors: {
    primary: LIBERO_BRAND.colors.liberoTeal,
    secondary: LIBERO_BRAND.colors.iris,
    accent: LIBERO_BRAND.colors.gold,
    success: LIBERO_BRAND.colors.success,
    warning: LIBERO_BRAND.colors.gold,
    error: LIBERO_BRAND.colors.danger,
    
    text: {
      primary: LIBERO_BRAND.colors.textPrimary,
      secondary: LIBERO_BRAND.colors.textSecondary,
      muted: LIBERO_BRAND.colors.textMuted
    }
  },

  // Ego State Colors - Updated for brand consistency
  egoStates: {
    guardian: { bg: 'from-blue-600 to-blue-800', accent: '#5AB6FF', baseColorName: 'blue' },
    rebel: { bg: 'from-red-600 to-red-800', accent: '#FF5D5D', baseColorName: 'red' },
    healer: { bg: 'from-green-600 to-green-800', accent: '#2ED573', baseColorName: 'green' },
    explorer: { bg: 'from-yellow-500 to-yellow-700', accent: '#FFC960', baseColorName: 'yellow' },
    mystic: { bg: 'from-purple-600 to-purple-800', accent: '#7C5CFF', baseColorName: 'purple' },
    sage: { bg: 'from-gray-300 to-gray-500', accent: '#B3C1D1', baseColorName: 'gray' },
    child: { bg: 'from-orange-500 to-orange-700', accent: '#FFC960', baseColorName: 'orange' },
    performer: { bg: 'from-pink-600 to-pink-800', accent: '#EC4899', baseColorName: 'pink' },
    shadow: { bg: 'from-indigo-900 to-black', accent: '#7C5CFF', baseColorName: 'indigo' },
    builder: { bg: 'from-gray-600 to-orange-600', accent: '#FFC960', baseColorName: 'orange' },
    seeker: { bg: 'from-indigo-600 to-teal-600', accent: '#15E0C3', baseColorName: 'teal' },
    lover: { bg: 'from-rose-600 to-pink-500', accent: '#F472B6', baseColorName: 'pink' },
    trickster: { bg: 'from-green-500 to-purple-600', accent: '#7C5CFF', baseColorName: 'purple' },
    warrior: { bg: 'from-red-700 to-black', accent: '#FF5D5D', baseColorName: 'red' },
    visionary: { bg: 'from-violet-600 to-blue-400', accent: '#7C5CFF', baseColorName: 'violet' }
  },

  shadows: LIBERO_BRAND.elevation,
  radius: LIBERO_BRAND.radius,
  spacing: LIBERO_BRAND.spacing,
  animations: {
    fast: LIBERO_BRAND.motion.micro,
    normal: LIBERO_BRAND.motion.md,
    slow: LIBERO_BRAND.motion.lg
  }
};

// Helper Functions
export const getEgoColor = (egoStateId: string) => {
  return THEME.egoStates[egoStateId as keyof typeof THEME.egoStates] || THEME.egoStates.guardian;
};

export const glassClass = (level: 'light' | 'medium' | 'strong' = 'medium') => {
  return `backdrop-blur-xl border border-white/20 shadow-lg`;
};

// Brand Utility Classes
export const brandClasses = {
  // Card Surfaces
  cardPrimary: `bg-[${LIBERO_BRAND.colors.surface1}] border border-[${LIBERO_BRAND.colors.divider}]/40 rounded-[${LIBERO_BRAND.radius.card}]`,
  cardHover: `bg-[${LIBERO_BRAND.colors.surface2}] border border-[${LIBERO_BRAND.colors.divider}]/60 rounded-[${LIBERO_BRAND.radius.card}]`,
  
  // Controls
  controlTile: `bg-[${LIBERO_BRAND.colors.surface1}]/80 backdrop-blur-xl border border-[${LIBERO_BRAND.colors.divider}]/40 rounded-[${LIBERO_BRAND.radius.control}]`,
  
  // Typography
  headline: 'font-bold tracking-tight',
  body: 'font-normal',
  caption: 'font-medium text-xs',
  
  // Interactive States
  hover: 'hover:scale-105 transition-all duration-240 ease-[cubic-bezier(0.2,0.9,0.2,1)]',
  press: 'active:scale-98',
  focus: 'focus:ring-2 focus:ring-[#15E0C3]/40 focus:outline-none'
};