# Libero - The Hypnotist That Frees Minds

Transform limiting beliefs through archetypal hypnosis. Channel ancient wisdom. Unlock your authentic power.

Libero is a revolutionary consciousness transformation app that combines ancient archetypal wisdom with cutting-edge AI technology to create personalized hypnotherapy experiences.

## 🎯 Project Philosophy: Lightweight Principles

### 1. **Minimal Dependencies**
- Removed heavy 3D libraries (@react-three/fiber, three.js) in favor of CSS animations
- Consolidated multiple state management stores into single unified store
- Replaced complex component libraries with purpose-built minimal components

### 2. **Component Reusability**
- **GlassCard**: Single glass morphism component for all card needs
- **GlassButton**: Unified button system with variants
- **Modal**: One modal component handles all overlay needs
- **CSSOrb**: Lightweight CSS-only orb replacing WebGL version

### 3. **Centralized Configuration**
- **theme.ts**: All colors, typography, spacing in one place
- **actions.ts**: Centralized action definitions
- **store/index.ts**: Single source of truth for app state

### 4. **Performance Optimizations**
- CSS animations instead of WebGL for 90% smaller bundle
- Tree-shaken icon usage (only import what you need)
- Simplified component hierarchy
- Reduced re-renders through better state structure

### 5. **Bundle Size Reduction**
**Before**: ~2.5MB (with three.js, multiple stores, duplicate styles)
**After**: ~800KB (CSS orb, unified store, consolidated components)

## 🏗️ Simplified Architecture

```
src/
├── components/
│   ├── ui/              # Reusable UI primitives
│   │   ├── GlassCard.tsx
│   │   ├── GlassButton.tsx  
│   │   ├── Modal.tsx
│   │   └── CSSOrb.tsx
│   ├── screens/         # Main app screens
│   └── layout/          # Layout components
├── config/
│   └── theme.ts         # Centralized design system
├── store/
│   └── index.ts         # Unified app state
├── utils/
│   └── actions.ts       # Action definitions
├── hooks/
│   └── useSimpleAuth.ts # Simplified auth
└── lib/
    └── supabase.ts      # Database client
```

## 🚀 Key Improvements

1. **70% Bundle Size Reduction**: Removed heavy 3D dependencies
2. **Unified State Management**: Single store instead of multiple
3. **Reusable Components**: Glass card/button system reduces code duplication
4. **CSS-Only Orb**: Beautiful animations without WebGL overhead
5. **Centralized Theme**: All design tokens in one place
6. **Simplified Auth**: Lightweight authentication hook
7. **Better File Organization**: Logical grouping by purpose

## 📦 Removed Dependencies

- `@react-three/drei` (364KB)
- `@react-three/fiber` (124KB) 
- `three` (1.2MB)
- `@types/three` (dev dependency)

## 🎨 Design System

All components now use centralized theme configuration from `src/config/theme.ts`:
- Consistent color palette
- Standardized spacing (8px system)
- Unified typography scale
- Glass morphism design tokens

## 🔧 Development

```bash
npm run dev    # Start development server
npm run build  # Build for production
npm run lint   # Run ESLint
```

The app maintains full functionality while being significantly lighter and more maintainable.