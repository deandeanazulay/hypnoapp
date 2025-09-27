# Tactical Implementation Plan: Libero Application

This document provides a numbered, prioritized list of tasks to make Libero production-ready.

## Implementation Strategy

**Approach**: Least-risk path focusing on core functionality first, then enhancements.
**Principle**: No UI/Orb changes, focus on wiring and data integration.

---

## Phase 1: Core Data Integration (High Priority)

### 1. Session Completion & Rewards System
**Why**: Core gamification loop is broken without session rewards
**Files**: 
- `src/components/session/UnifiedSessionWorld.tsx`
- `src/components/GameStateManager.tsx`
- `src/services/session.ts`
**Risk**: Medium
**Scope**: Medium

**Implementation**:
- Add session end handler in UnifiedSessionWorld
- Implement XP calculation based on session duration/completion
- Add token rewards (2 tokens per session)
- Save session data to `sessions` table
- Update user profile with new XP/tokens/streak

### 2. AI API Configuration Setup
**Why**: Core AI features (script generation, chat) require API keys
**Files**:
- Supabase Edge Functions environment variables
- `supabase/functions/generate-script/index.ts`
- `supabase/functions/chatgpt-chat/index.ts`
- `supabase/functions/tts/index.ts`
**Risk**: Low (configuration only)
**Scope**: Small

**Implementation**:
- Set `OPENAI_API_KEY` in Supabase Edge Functions settings
- Test script generation endpoint
- Test chat endpoint
- Verify TTS endpoint functionality

### 3. Session History & Persistence
**Why**: Users need to see their progress and replay sessions
**Files**:
- `src/components/screens/ProfileScreen.tsx`
- `src/components/modals/FavoritesModal.tsx`
- `src/services/session.ts`
**Risk**: Low
**Scope**: Medium

**Implementation**:
- Add session save logic to session completion
- Populate "Recent Sessions" in ProfileScreen from database
- Ensure FavoritesModal shows actual user sessions
- Add session replay functionality

### 4. Dynamic Protocol Data Integration
**Why**: Static protocol data limits scalability and personalization
**Files**:
- `src/data/protocols.ts` → Database migration
- `src/components/screens/ExploreScreen.tsx`
- New Supabase table: `protocols`
**Risk**: Medium (data migration)
**Scope**: Large

**Implementation**:
- Create `protocols` and `protocol_categories` tables
- Migrate static data to database
- Update ExploreScreen to fetch from database
- Add protocol management for admins

---

## Phase 2: Payment & Premium Features (Medium Priority)

### 5. Stripe Checkout Integration
**Why**: Revenue generation and premium feature access
**Files**:
- `src/components/modals/PlanModal.tsx`
- `src/components/modals/TokensModal.tsx`
- `src/lib/stripe.ts`
**Risk**: High (payment integration)
**Scope**: Medium

**Implementation**:
- Define Stripe products for plans and token packages
- Implement upgrade flow in PlanModal
- Add token purchase flow in TokensModal
- Test payment success/cancel flows

### 6. Stripe Customer Portal
**Why**: Users need to manage their subscriptions
**Files**:
- `src/components/modals/SettingsModal.tsx`
- `src/lib/stripe.ts`
- New Edge Function: `stripe-customer-portal`
**Risk**: Medium
**Scope**: Small

**Implementation**:
- Create customer portal session endpoint
- Add portal link in SettingsModal
- Handle portal return flow

### 7. Plan-Based Feature Restrictions
**Why**: Enforce free vs premium limits
**Files**:
- `src/components/GameStateManager.tsx`
- `src/components/screens/CreateScreen.tsx`
- Various feature components
**Risk**: Low
**Scope**: Medium

**Implementation**:
- Add daily session limit enforcement
- Restrict premium features for free users
- Show upgrade prompts when limits reached

---

## Phase 3: User Experience Enhancement (Medium Priority)

### 8. Achievement System Implementation
**Why**: Gamification and user engagement
**Files**:
- New table: `user_achievements`
- `src/components/GameStateManager.tsx`
- `src/components/screens/ProfileScreen.tsx`
**Risk**: Low
**Scope**: Medium

**Implementation**:
- Create achievements table and logic
- Define achievement criteria (streaks, levels, etc.)
- Add achievement unlock notifications
- Display achievements in ProfileScreen

### 9. Journey Data Persistence
**Why**: Onboarding data should persist across devices
**Files**:
- `src/components/journey/OnboardingWizard.tsx`
- `src/components/screens/JourneyMapScreen.tsx`
- `src/components/GameStateManager.tsx`
**Risk**: Low
**Scope**: Small

**Implementation**:
- Add journey fields to user_profiles table
- Save onboarding data to database
- Load journey data from database instead of localStorage
- Sync journey progress across devices

### 10. Settings Persistence & Application
**Why**: User preferences should be saved and applied
**Files**:
- `src/components/modals/SettingsModal.tsx`
- `src/components/GameStateManager.tsx`
- Audio/voice components
**Risk**: Low
**Scope**: Medium

**Implementation**:
- Add settings field to user_profiles
- Save setting changes to database
- Apply audio settings to voice synthesis
- Apply appearance settings to theme

---

## Phase 4: Advanced Features (Lower Priority)

### 11. Voice Transcription Integration
**Why**: Complete voice chat functionality
**Files**:
- `src/components/screens/ChatScreen.tsx`
- New Edge Function: `whisper-transcription`
**Risk**: Medium (new API integration)
**Scope**: Medium

**Implementation**:
- Create Whisper API integration
- Add transcription to voice message flow
- Handle transcription errors gracefully
- Cache transcriptions for replay

### 12. Real-time Analytics & Insights
**Why**: Better user engagement and personalization
**Files**:
- `src/components/screens/ProfileScreen.tsx`
- `src/components/modals/EgoStatesModal.tsx`
- New analytics queries
**Risk**: Low
**Scope**: Medium

**Implementation**:
- Add real-time analytics queries
- Calculate user insights (most used ego states, etc.)
- Add progress tracking visualizations
- Implement social comparison features

### 13. Advanced AI Personalization
**Why**: Improve session quality and user experience
**Files**:
- `supabase/functions/generate-script/index.ts`
- `src/services/chatgpt.ts`
- User preference tracking
**Risk**: Medium
**Scope**: Large

**Implementation**:
- Track user preferences and responses
- Personalize script generation based on history
- Adapt AI responses to user personality
- Implement learning from user feedback

---

## Phase 5: Polish & Optimization (Low Priority)

### 14. Bundle Size Optimization
**Why**: Faster load times and better user experience
**Files**:
- `src/components/WebGLOrb.tsx` (Three.js imports)
- Various component files (icon imports)
- `vite.config.ts` (build optimization)
**Risk**: Low
**Scope**: Small

**Implementation**:
- Implement Three.js tree shaking
- Audit and remove unused dependencies
- Add code splitting for large components
- Optimize build configuration

### 15. Progressive Web App Features
**Why**: Better mobile experience and offline support
**Files**:
- `vite.config.ts` (PWA plugin)
- `public/manifest.json`
- Service worker implementation
**Risk**: Low
**Scope**: Medium

**Implementation**:
- Add PWA manifest
- Implement service worker for offline support
- Add install prompt
- Cache critical resources

### 16. Advanced Error Recovery
**Why**: Better resilience and user experience
**Files**:
- `src/services/session.ts`
- `src/services/voice.ts`
- `src/utils/apiErrorHandler.ts`
**Risk**: Low
**Scope**: Small

**Implementation**:
- Add automatic retry for failed API calls
- Implement graceful degradation for all features
- Add offline mode detection
- Enhance error recovery flows

---

## Implementation Timeline

### Week 1: Core Functionality
- Tasks 1-4: Session rewards, AI setup, session history, protocol data

### Week 2: Payment Integration  
- Tasks 5-7: Stripe checkout, customer portal, plan restrictions

### Week 3: User Experience
- Tasks 8-10: Achievements, journey persistence, settings

### Week 4: Advanced Features
- Tasks 11-13: Voice transcription, analytics, AI personalization

### Week 5: Polish & Launch Prep
- Tasks 14-16: Optimization, PWA features, error recovery

## Risk Mitigation

### High Risk Tasks
1. **Stripe Integration** (Task 5)
   - Mitigation: Thorough testing in Stripe test mode
   - Rollback plan: Disable payment features if issues

2. **Protocol Data Migration** (Task 4)
   - Mitigation: Keep static data as fallback
   - Rollback plan: Revert to static data if DB issues

### Medium Risk Tasks
1. **AI API Integration** (Task 2)
   - Mitigation: Robust fallback systems already implemented
   - Rollback plan: Use mock/emergency scripts

2. **Voice Transcription** (Task 11)
   - Mitigation: Voice messages work without transcription
   - Rollback plan: Display as audio-only messages

## Success Criteria

### Phase 1 Success
- [ ] Sessions award XP and tokens upon completion
- [ ] AI script generation works with real API
- [ ] Session history displays in Profile and Favorites
- [ ] Protocols can be loaded from database

### Phase 2 Success
- [ ] Users can upgrade to premium via Stripe
- [ ] Token purchases work through Stripe
- [ ] Plan restrictions are enforced
- [ ] Customer portal accessible from settings

### Phase 3 Success
- [ ] Achievements unlock and display correctly
- [ ] Journey data persists across devices
- [ ] Settings save and apply correctly
- [ ] User engagement metrics tracked

### Overall Success Criteria
- [ ] Complete user journey from signup to session completion works
- [ ] Payment flows functional and tested
- [ ] All data persists correctly to database
- [ ] Error handling graceful throughout app
- [ ] Performance meets target metrics

## Dependencies & Blockers

### External Dependencies
1. **OpenAI API Key** - Required for AI features
2. **Stripe Account Setup** - Required for payments
3. **ElevenLabs API Key** - Optional for premium TTS

### Internal Dependencies
1. **Database Schema Updates** - For new features
2. **Edge Function Deployment** - For new endpoints
3. **Environment Configuration** - For API keys

### Potential Blockers
1. **API Rate Limits** - May need usage optimization
2. **Stripe Approval** - Payment processing approval
3. **Performance Issues** - Bundle size or runtime performance