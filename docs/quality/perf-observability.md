# Performance & Observability: Libero Application

This document analyzes current performance characteristics and observability setup.

## Bundle Size Analysis

### Current Bundle Composition
*Note: Run `npm run build && npx vite-bundle-analyzer dist` to get exact numbers*

#### Estimated Bundle Breakdown
| Category | Estimated Size | Key Contributors |
|----------|---------------|------------------|
| **React Core** | ~45KB | react, react-dom |
| **Routing** | ~25KB | react-router-dom |
| **State Management** | ~15KB | zustand |
| **UI Components** | ~35KB | lucide-react icons |
| **3D Graphics** | ~580KB | three.js (for WebGL orb) |
| **Database Client** | ~25KB | @supabase/supabase-js |
| **Application Code** | ~120KB | All src/ files |
| **Total Estimated** | ~845KB | Compressed |

#### Bundle Optimization Opportunities

##### High Impact (Non-Visual)
1. **Three.js Tree Shaking**
   - **Current**: Full three.js import (~580KB)
   - **Optimization**: Import only used modules
   - **File**: `src/components/WebGLOrb.tsx`
   - **Savings**: ~200-300KB
   ```typescript
   // Instead of: import * as THREE from 'three';
   import { Scene, PerspectiveCamera, WebGLRenderer, LineBasicMaterial } from 'three';
   ```

2. **Icon Optimization**
   - **Current**: Individual lucide-react imports (good)
   - **Optimization**: Verify no unused icons
   - **File**: All component files
   - **Savings**: ~5-10KB

3. **Code Splitting Enhancement**
   - **Current**: Some dynamic imports for modals
   - **Optimization**: Split more components
   - **Files**: `src/App.tsx`, modal imports
   - **Savings**: ~20-30KB initial load

##### Medium Impact
1. **Remove Development Dependencies**
   - **Check**: No dev dependencies in production build
   - **Verify**: Source maps disabled in production

2. **Optimize Supabase Client**
   - **Current**: Full client import
   - **Optimization**: Use specific client features only
   - **Savings**: ~5-10KB

### Performance Metrics Targets

| Metric | Target | Current Status | Priority |
|--------|--------|----------------|----------|
| **First Contentful Paint** | <1.5s | ⚠️ Needs measurement | High |
| **Largest Contentful Paint** | <2.5s | ⚠️ Needs measurement | High |
| **Time to Interactive** | <3.0s | ⚠️ Needs measurement | Medium |
| **Bundle Size** | <500KB | ~845KB | Medium |
| **WebGL Orb Load** | <1.0s | ✅ Likely good | Low |

## Memory Management

### Current Memory Patterns

#### Potential Memory Leaks
1. **WebGL Context**
   - **File**: `src/components/WebGLOrb.tsx`
   - **Risk**: Three.js objects not disposed
   - **Status**: ✅ Disposal implemented in `disposeScene()`

2. **Audio Elements**
   - **File**: `src/services/voice.ts`, `src/services/session.ts`
   - **Risk**: Audio URLs not revoked
   - **Status**: ⚠️ Needs verification

3. **Event Listeners**
   - **Files**: Various components
   - **Risk**: Listeners not removed on unmount
   - **Status**: ✅ Most components use proper cleanup

#### Memory Optimization Targets
1. **Session Audio Cache**
   - **Current**: Unlimited cache in `src/services/cache.ts`
   - **Target**: 120MB limit (implemented)
   - **Status**: ✅ LRU eviction working

2. **Component Memoization**
   - **Opportunity**: Expensive components like Orb
   - **Files**: `src/components/Orb.tsx`, `src/components/WebGLOrb.tsx`
   - **Implementation**: `React.memo()` for stable props

## Error Tracking & Observability

### Current Error Handling

#### Frontend Error Boundary
- **File**: `src/components/ErrorBoundary.tsx`
- **Status**: ✅ Implemented
- **Features**: 
  - Catches React errors
  - Logs to analytics service
  - Shows user-friendly error UI
  - Development error details

#### API Error Handling
- **File**: `src/utils/apiErrorHandler.ts`
- **Status**: ✅ Comprehensive
- **Features**:
  - Centralized error handling
  - User-friendly error messages
  - Error tracking integration
  - Retry logic for transient failures

#### Analytics Integration
- **File**: `src/services/analytics.ts`
- **Status**: ✅ Implemented
- **Features**:
  - Event tracking
  - Error tracking
  - Performance metrics
  - Queue-based batching

### Logging Strategy

#### Current Logging
```typescript
// Development logging
if (import.meta.env.DEV) {
  console.log('[COMPONENT] Debug message');
}

// Error tracking
trackError(error, { context: 'component_name' });

// Performance tracking
trackPerformance('session_start', duration);
```

#### Recommended Logging Levels
1. **Error**: Exceptions, API failures, critical issues
2. **Warn**: Fallbacks, deprecated usage, performance issues
3. **Info**: User actions, state changes, feature usage
4. **Debug**: Detailed flow information (dev only)

### Observability Gaps

#### Missing Metrics
1. **Session Completion Rate**
   - **What**: Percentage of started sessions that complete
   - **Where**: `src/services/session.ts`
   - **Implementation**: Track start/end events

2. **API Response Times**
   - **What**: Latency for AI and TTS calls
   - **Where**: `src/utils/apiErrorHandler.ts`
   - **Implementation**: Add timing to `safeFetch`

3. **User Engagement Metrics**
   - **What**: Daily/weekly active users, feature usage
   - **Where**: Throughout app
   - **Implementation**: Enhanced analytics events

4. **Error Rate by Feature**
   - **What**: Error frequency per app feature
   - **Where**: Error boundary and API handlers
   - **Implementation**: Feature-specific error tagging

### Performance Monitoring

#### Client-Side Monitoring
```typescript
// Add to src/services/analytics.ts
export function trackPerformanceMetrics() {
  // Core Web Vitals
  trackPerformance('FCP', performance.getEntriesByType('paint')[0]?.startTime);
  trackPerformance('LCP', performance.getEntriesByType('largest-contentful-paint')[0]?.startTime);
  
  // Memory usage
  if ('memory' in performance) {
    trackPerformance('memory_used', performance.memory.usedJSHeapSize);
  }
  
  // Bundle load time
  trackPerformance('bundle_load', performance.timing.loadEventEnd - performance.timing.navigationStart);
}
```

#### Server-Side Monitoring
- **Edge Functions**: Add timing and error logging
- **Database**: Monitor query performance
- **External APIs**: Track response times and error rates

## Caching Strategy

### Current Caching Implementation

#### Audio Cache
- **File**: `src/services/cache.ts`
- **Status**: ✅ Implemented
- **Features**:
  - 120MB size limit
  - LRU eviction
  - IndexedDB metadata
  - Cache statistics

#### API Response Cache
- **Status**: ❌ Not implemented
- **Opportunity**: Cache AI responses for repeated requests
- **Implementation**: Add response caching to `safeFetch`

#### Static Asset Cache
- **Status**: ✅ Browser default
- **Optimization**: Add service worker for offline support

### Cache Performance Metrics

#### Current Metrics Available
```typescript
// From src/services/cache.ts
const stats = await getStats();
// Returns: { totalItems: number, totalSizeMB: number }
```

#### Recommended Additional Metrics
1. **Cache Hit Rate**: Percentage of requests served from cache
2. **Cache Eviction Rate**: How often items are evicted
3. **Average Cache Item Size**: For optimization insights
4. **Cache Load Time**: Time to retrieve cached items

## Performance Optimization Roadmap

### Phase 1: Bundle Optimization (High Impact)
1. **Three.js Tree Shaking** - Reduce bundle by 200-300KB
2. **Remove Unused Dependencies** - Audit package.json
3. **Code Splitting** - Split large components and routes

### Phase 2: Runtime Optimization (Medium Impact)
1. **Component Memoization** - Memo expensive components
2. **State Update Optimization** - Reduce unnecessary re-renders
3. **Image Optimization** - Optimize any local images

### Phase 3: Advanced Optimization (Lower Impact)
1. **Service Worker** - Add offline support and caching
2. **Preloading** - Preload critical resources
3. **Lazy Loading** - Lazy load non-critical components

## Monitoring Implementation Plan

### 1. Add Performance Tracking
```typescript
// Add to src/main.tsx
import { trackPerformanceMetrics } from './services/analytics';

// Track initial load performance
window.addEventListener('load', trackPerformanceMetrics);
```

### 2. Enhanced Error Context
```typescript
// Enhance error tracking with more context
trackError(error, {
  component: 'SessionManager',
  userLevel: user?.level,
  sessionType: 'custom_protocol',
  timestamp: Date.now()
});
```

### 3. Feature Usage Analytics
```typescript
// Track feature adoption
track('feature_used', {
  feature: 'custom_protocol_creation',
  userLevel: user?.level,
  tokensSpent: 5
});
```

### 4. API Performance Monitoring
```typescript
// Add to safeFetch in apiErrorHandler.ts
const startTime = performance.now();
// ... make request
const duration = performance.now() - startTime;
trackPerformance(`api_${operation}`, duration);
```

## Observability Dashboard Recommendations

### Key Metrics to Track
1. **User Engagement**
   - Daily/Weekly Active Users
   - Session completion rate
   - Feature adoption rate

2. **Technical Health**
   - Error rate by component
   - API response times
   - Bundle load performance

3. **Business Metrics**
   - Conversion to premium
   - Token usage patterns
   - User retention

### Implementation Tools
- **Frontend**: Custom analytics service (already implemented)
- **Backend**: Supabase logs and metrics
- **External**: Consider Sentry for error tracking
- **Performance**: Web Vitals API integration