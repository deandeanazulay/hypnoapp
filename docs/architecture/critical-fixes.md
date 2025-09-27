# Critical Fixes Required: Libero Application

This document identifies the most critical issues that must be fixed for the application to be fully functional.

## 🔴 Critical Issues (Must Fix)

### 1. Session Completion Flow Broken
**Problem**: Sessions play but don't award XP/tokens or save to database
**Impact**: Core gamification loop non-functional
**Files**: 
- `src/components/session/UnifiedSessionWorld.tsx`
- `src/services/session.ts`
- `src/components/GameStateManager.tsx`

**Fix Required**:
```typescript
// In UnifiedSessionWorld.tsx, add to session end handler:
const handleSessionComplete = async () => {
  const sessionData = {
    user_id: user.id,
    ego_state: activeEgoState,
    action: sessionConfig.action || 'transformation',
    duration: Math.floor(sessionDuration / 60),
    experience_gained: calculateSessionXP(sessionDuration)
  };
  
  // Save to database
  await supabase.from('sessions').insert(sessionData);
  
  // Award XP and tokens
  await addExperience(sessionData.experience_gained);
  await updateUser({ tokens: user.tokens + 2 });
  
  // Update streak
  await incrementStreak();
  
  showToast({
    type: 'success',
    message: `Session complete! +${sessionData.experience_gained} XP, +2 tokens`
  });
};
```

### 2. AI Features Require Configuration
**Problem**: Script generation and chat require OPENAI_API_KEY
**Impact**: Core AI functionality non-functional without API key
**Files**: Supabase Edge Functions environment

**Fix Required**:
1. Set `OPENAI_API_KEY` in Supabase Dashboard → Edge Functions → Settings
2. Test endpoints: `generate-script`, `chatgpt-chat`, `tts`
3. Verify fallback systems work when API unavailable

### 3. Static Protocol Data
**Problem**: All protocols are hardcoded, limiting scalability
**Impact**: Cannot add new protocols without code changes
**Files**: 
- `src/data/protocols.ts`
- `src/components/screens/ExploreScreen.tsx`

**Fix Required**:
Create database tables and migrate data:
```sql
CREATE TABLE protocol_categories (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  icon TEXT NOT NULL,
  color TEXT NOT NULL
);

CREATE TABLE protocols (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  description TEXT NOT NULL,
  category TEXT REFERENCES protocol_categories(id),
  difficulty TEXT CHECK (difficulty IN ('beginner', 'intermediate', 'advanced')),
  duration INTEGER NOT NULL,
  benefits TEXT[] DEFAULT '{}',
  tags TEXT[] DEFAULT '{}',
  script JSONB NOT NULL,
  is_popular BOOLEAN DEFAULT FALSE,
  is_recommended BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMPTZ DEFAULT NOW()
);
```

### 4. Payment Integration Missing
**Problem**: Upgrade and token purchase buttons don't work
**Impact**: No revenue generation capability
**Files**:
- `src/components/modals/PlanModal.tsx`
- `src/components/modals/TokensModal.tsx`
- `src/lib/stripe.ts`

**Fix Required**:
```typescript
// Add to stripe.ts
export const STRIPE_PRODUCTS = {
  'premium-monthly': {
    priceId: 'price_premium_monthly',
    name: 'Premium Monthly',
    description: 'Unlimited sessions and premium features',
    mode: 'subscription' as const
  },
  'tokens-100': {
    priceId: 'price_tokens_100',
    name: '100 Tokens',
    description: '100 tokens + 10 bonus',
    mode: 'payment' as const
  }
};
```

## 🟡 Important Issues (Should Fix)

### 5. Journey Data Not Persisted
**Problem**: Onboarding wizard data only stored in localStorage
**Impact**: Journey progress lost across devices
**Files**:
- `src/components/journey/OnboardingWizard.tsx`
- `src/components/screens/JourneyMapScreen.tsx`

**Fix Required**: Add journey fields to user_profiles or create journey_data table

### 6. Achievement System Non-Functional
**Problem**: Achievements shown but never unlocked or tracked
**Impact**: Reduced user engagement and progression clarity
**Files**:
- `src/components/screens/ProfileScreen.tsx`
- `src/components/GameStateManager.tsx`

**Fix Required**: Implement achievement tracking and unlock logic

### 7. Settings Don't Persist
**Problem**: Settings changes not saved or applied
**Impact**: Poor user experience, settings reset on reload
**Files**:
- `src/components/modals/SettingsModal.tsx`
- Audio/voice components

**Fix Required**: Add settings persistence and application logic

### 8. Voice Transcription Missing
**Problem**: Voice messages recorded but not transcribed
**Impact**: Incomplete voice chat functionality
**Files**:
- `src/components/screens/ChatScreen.tsx`

**Fix Required**: Add OpenAI Whisper integration for voice transcription

## 🟢 Enhancement Issues (Nice to Fix)

### 9. Empty Modal Content
**Problem**: Several modals show empty arrays for features/packages
**Impact**: Incomplete user experience
**Files**:
- `src/components/modals/PlanModal.tsx` (planFeatures)
- `src/components/modals/TokensModal.tsx` (tokenPackages)

**Fix Required**: Populate feature arrays with actual data

### 10. Unused Props in Components
**Problem**: Several components receive unused props
**Impact**: Code confusion and potential bugs
**Files**:
- `src/App.tsx` (ProfileScreen props)
- `src/components/screens/ProfileScreen.tsx`

**Fix Required**: Remove unused props or implement their functionality

### 11. Analytics Data Limited
**Problem**: Analytics modals show limited real data
**Impact**: Users can't track their progress effectively
**Files**:
- `src/components/screens/ProfileScreen.tsx`
- `src/components/modals/EgoStatesModal.tsx`

**Fix Required**: Implement comprehensive analytics queries

## Implementation Order (Least Risk First)

### Immediate (This Week)
1. **AI API Configuration** (Task 2) - Configuration only, no code changes
2. **Session Completion Flow** (Task 1) - Core functionality fix
3. **Session History** (Task 3) - Database integration

### Next Week
4. **Journey Data Persistence** (Task 5) - Data migration
5. **Settings Persistence** (Task 7) - User experience improvement
6. **Achievement System** (Task 6) - Engagement features

### Following Weeks
7. **Stripe Integration** (Task 4) - Payment functionality
8. **Protocol Data Migration** (Task 4) - Scalability improvement
9. **Voice Transcription** (Task 8) - Feature completion

### Polish Phase
10. **Modal Content** (Task 9) - Content population
11. **Code Cleanup** (Task 10) - Remove unused code
12. **Analytics Enhancement** (Task 11) - Better insights

## Quick Wins (Low Risk, High Impact)

### 1. Populate Modal Content
**Time**: 1-2 hours
**Impact**: Immediate UX improvement
**Risk**: None

### 2. Fix Unused Props
**Time**: 30 minutes
**Impact**: Code clarity
**Risk**: None

### 3. Add Loading States
**Time**: 1 hour
**Impact**: Better perceived performance
**Risk**: None

## Validation Checklist

After implementing each fix, verify:

### Session Completion (Task 1)
- [ ] Complete a session → XP and tokens awarded
- [ ] Check database → Session record created
- [ ] Check profile → Streak incremented
- [ ] Check HUD → Stats updated immediately

### AI Integration (Task 2)
- [ ] Start session → Script generated by AI
- [ ] Chat with Libero → AI responses received
- [ ] Voice synthesis → AI voice works (with browser fallback)

### Payment Integration (Task 4)
- [ ] Click upgrade → Stripe checkout opens
- [ ] Complete payment → Plan updated in database
- [ ] Access premium features → Restrictions lifted

### Data Persistence (Tasks 3, 5, 7)
- [ ] Complete onboarding → Data saved to database
- [ ] Change settings → Preferences persisted
- [ ] View session history → Past sessions displayed

## Rollback Plans

### If AI Integration Fails
- Fallback systems already implemented
- Emergency scripts and browser TTS available
- No user-facing impact

### If Payment Integration Fails
- Disable payment buttons
- Show "coming soon" messages
- Core app functionality unaffected

### If Database Changes Fail
- Revert migrations
- Use localStorage fallbacks
- Static data backups available

## Success Metrics

### Technical Metrics
- [ ] 0 critical errors in production
- [ ] <2s average session start time
- [ ] >95% session completion rate
- [ ] <1% payment failure rate

### User Experience Metrics
- [ ] Session rewards working 100% of time
- [ ] AI features working >90% of time
- [ ] Payment flows working >99% of time
- [ ] Data persistence working 100% of time

### Business Metrics
- [ ] Premium conversion tracking functional
- [ ] Token economy balanced and engaging
- [ ] User retention metrics available
- [ ] Revenue tracking accurate