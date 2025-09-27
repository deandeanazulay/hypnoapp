# Acceptance Testing Checklist: Libero Application

This document provides click-through acceptance tests for each screen and feature.

## Authentication Flow

### Sign Up Process
- [ ] ✅ Click "Sign In" button → Auth modal opens
- [ ] ✅ Switch to "Sign Up" tab → Form changes correctly
- [ ] ✅ Enter email/password → Validation works
- [ ] ✅ Submit form → User account created
- [ ] ✅ Auto-redirect to app → Profile created in database
- [ ] ❌ **Missing**: Email confirmation flow (if enabled)

**Files**: `src/components/auth/AuthModal.tsx`, `src/components/GameStateManager.tsx`

### Sign In Process  
- [ ] ✅ Enter valid credentials → Successful login
- [ ] ✅ Enter invalid credentials → Clear error message
- [ ] ✅ Use "Forgot Password" → Reset email sent
- [ ] ✅ Profile loads → User data displayed in HUD

**Files**: `src/hooks/useSimpleAuth.ts`, `src/components/GameStateManager.tsx`

## Home Screen Flow

### Orb Interaction
- [ ] ✅ Tap central orb → Session selection modal opens
- [ ] ✅ Orb displays current ego state → Visual state matches HUD
- [ ] ✅ Orb animations → WebGL/CSS fallback working
- [ ] ❌ **Missing**: Orb tap when not authenticated → Auth modal

**Files**: `src/components/screens/HomeScreen.tsx:handleOrbTap`, `src/components/Orb.tsx`

### Quick Actions
- [ ] ✅ Tap "Quick Session" → Session modal opens
- [ ] ✅ Tap "Deep Journey" → Navigate to Explore tab
- [ ] ✅ Tap "Custom" → Navigate to Create tab  
- [ ] ✅ Tap "Chat" → Navigate to Chat tab

**Files**: `src/components/screens/HomeScreen.tsx` (action button handlers)

### Milestone Roadmap
- [ ] ⚠️ **Partial**: Milestone completion status → Static data, needs DB integration
- [ ] ✅ Tap unlocked milestone → Session modal opens
- [ ] ❌ **Missing**: Tap locked milestone → Unlock requirements shown
- [ ] ❌ **Missing**: Complete milestone → Progress updates in real-time

**Files**: `src/components/screens/HomeScreen.tsx:HorizontalMilestoneRoadmap`

## Explore Screen Flow

### Protocol Discovery
- [ ] ✅ Browse protocol categories → Filtering works
- [ ] ✅ Search protocols → Results update correctly
- [ ] ✅ Apply filters → Protocols filtered correctly
- [ ] ✅ Tap protocol → Detail modal opens
- [ ] ⚠️ **Partial**: Start protocol → Session starts (needs completion tracking)

**Files**: `src/components/screens/ExploreScreen.tsx`

### Beginner Guide
- [ ] ✅ Tap "Guide" button → Beginner guide modal opens
- [ ] ✅ Navigate guide steps → Multi-step wizard works
- [ ] ✅ Select recommended protocol → Protocol starts

**Files**: `src/components/BeginnerGuide.tsx`

## Create Screen Flow

### Protocol Builder
- [ ] ✅ Step 1: Enter name and duration → Validation works
- [ ] ✅ Step 2: Select induction method → Selection persists
- [ ] ✅ Step 3: Choose goals → Multiple selection works
- [ ] ✅ Complete wizard → Protocol saved to database
- [ ] ✅ Insufficient tokens → Creation blocked with clear message
- [ ] ✅ Successful creation → Tokens deducted, success message shown

**Files**: `src/components/screens/CreateScreen.tsx:handleComplete`

## Chat Screen Flow

### AI Conversation
- [ ] ⚠️ **Partial**: Send text message → AI response (requires OPENAI_API_KEY)
- [ ] ✅ Message history → Persisted in localStorage
- [ ] ✅ Clear chat → History cleared, welcome message shown
- [ ] ❌ **Missing**: Voice message transcription → Whisper API integration needed

**Files**: `src/components/screens/ChatScreen.tsx:sendMessage`

### Voice Recording
- [ ] ✅ Hold mic button → Recording starts
- [ ] ✅ Release mic button → Recording stops
- [ ] ✅ Play recording → Audio playback works
- [ ] ✅ Send recording → Saved as voice message
- [ ] ❌ **Missing**: Transcribe recording → Text conversion

**Files**: `src/components/screens/ChatScreen.tsx` (voice recording handlers)

## Profile Screen Flow

### User Stats
- [ ] ✅ View level/XP → Data from database displayed
- [ ] ✅ View streak → Current streak shown
- [ ] ✅ View tokens → Token balance accurate
- [ ] ✅ Tap ego state → Ego states modal opens

**Files**: `src/components/screens/ProfileScreen.tsx`

### Profile Actions
- [ ] ✅ Tap "Library" → Personal library modal opens
- [ ] ✅ Tap "Premium" → Plan modal opens
- [ ] ✅ Tap "Tokens" → Tokens modal opens
- [ ] ✅ Tap "Analytics" → Analytics modal opens
- [ ] ❌ **Missing**: Recent sessions → Empty list, needs DB query
- [ ] ❌ **Missing**: Achievements → Count shown but no actual achievements

**Files**: `src/components/screens/ProfileScreen.tsx` (modal trigger handlers)

## Session World Flow

### Session Lifecycle
- [ ] ⚠️ **Partial**: Start session → Script generation (requires API key)
- [ ] ✅ Play/pause controls → Audio playback control works
- [ ] ✅ Skip forward/back → Segment navigation works
- [ ] ✅ Breathing pattern → 4-4-6-4 pattern displays correctly
- [ ] ❌ **Missing**: Complete session → No XP/token rewards
- [ ] ❌ **Missing**: Session data → Not saved to database

**Files**: `src/components/session/UnifiedSessionWorld.tsx`, `src/services/session.ts`

### Audio System
- [ ] ⚠️ **Partial**: AI voice synthesis → Requires API configuration
- [ ] ✅ Browser TTS fallback → Works when API unavailable
- [ ] ✅ Volume controls → Audio level adjustment works
- [ ] ✅ Voice toggle → Enable/disable voice works

**Files**: `src/services/voice.ts`, `src/components/session/UnifiedSessionWorld.tsx`

## Modal Interactions

### Ego States Modal
- [ ] ✅ Open from HUD → Modal displays correctly
- [ ] ✅ Select ego state → State changes globally
- [ ] ✅ Usage statistics → Percentages calculated correctly
- [ ] ⚠️ **Partial**: Usage data → Based on ego_state_usage field (may be empty)

**Files**: `src/components/modals/EgoStatesModal.tsx:handleSelectEgoState`

### Plan Modal
- [ ] ✅ Display current plan → User plan shown correctly
- [ ] ❌ **Missing**: Plan features → Feature arrays empty
- [ ] ❌ **Missing**: Upgrade button → No Stripe integration
- [ ] ❌ **Missing**: Plan comparison → Static content only

**Files**: `src/components/modals/PlanModal.tsx:handleUpgrade`

### Tokens Modal
- [ ] ✅ Display token balance → Current balance shown
- [ ] ❌ **Missing**: Token packages → Empty array
- [ ] ❌ **Missing**: Purchase flow → No Stripe checkout
- [ ] ✅ Earning methods → Information displayed correctly

**Files**: `src/components/modals/TokensModal.tsx:handlePurchaseTokens`

### Favorites Modal
- [ ] ⚠️ **Partial**: Load session history → Queries database but may be empty
- [ ] ✅ Delete session → Database deletion works
- [ ] ⚠️ **Partial**: Replay session → Converts format but needs session integration
- [ ] ⚠️ **Partial**: Session insights → Calculated from available data

**Files**: `src/components/modals/FavoritesModal.tsx`

### Personal Library Modal
- [ ] ✅ Load custom protocols → Database query works
- [ ] ✅ View protocol details → Detail modal functional
- [ ] ✅ Delete protocol → Database deletion works
- [ ] ✅ Copy protocol → Clipboard copy works
- [ ] ⚠️ **Partial**: Start protocol session → Needs session integration

**Files**: `src/components/modals/PersonalLibraryModal.tsx:handleProtocolStart`

## iOS Safari Specific Tests

### Viewport & Safe Areas
- [ ] ✅ Safe area padding → Bottom navigation respects safe area
- [ ] ✅ Viewport height → Uses CSS custom properties correctly
- [ ] ✅ Orientation change → Layout adapts correctly
- [ ] ✅ Keyboard appearance → Layout adjusts for virtual keyboard

**Files**: `src/index.css` (safe area CSS), `src/hooks/useViewportLayout.ts`

### Audio & WebGL
- [ ] ⚠️ **Partial**: Audio autoplay → May require user gesture
- [ ] ✅ WebGL context loss → Handled with fallback to CSS orb
- [ ] ✅ Touch events → Orb tap works on mobile
- [ ] ⚠️ **Partial**: Background audio → May pause when app backgrounded

**Files**: `src/components/WebGLOrb.tsx`, `src/services/voice.ts`

### Actions Bar & Navigation
- [ ] ✅ Actions bar positioning → Fixed above navigation tabs
- [ ] ✅ Navigation tab stacking → Proper z-index hierarchy
- [ ] ✅ Touch targets → Minimum 44px touch targets met
- [ ] ✅ Scroll behavior → Prevented on main screens

**Files**: `src/components/ActionsBar.tsx`, `src/components/NavigationTabs.tsx`

## Payment Flow Tests

### Stripe Checkout
- [ ] ❌ **Missing**: Upgrade to premium → No checkout session creation
- [ ] ❌ **Missing**: Purchase tokens → No token products defined
- [ ] ⚠️ **Partial**: Payment success → Route exists but no profile refresh
- [ ] ⚠️ **Partial**: Payment cancelled → Route exists but basic handling

**Files**: `src/App.tsx` (payment routes), `src/lib/stripe.ts`

### Subscription Management
- [ ] ❌ **Missing**: Customer portal → No portal session creation
- [ ] ❌ **Missing**: Plan status sync → No webhook handling verification
- [ ] ❌ **Missing**: Usage limits → No plan-based restrictions

**Files**: `src/components/modals/SettingsModal.tsx`, `supabase/functions/stripe-webhook/index.ts`

## Error Boundary Tests

### Error Handling
- [ ] ✅ JavaScript errors → Caught by ErrorBoundary
- [ ] ✅ API failures → Graceful fallbacks implemented
- [ ] ✅ Network errors → User-friendly messages shown
- [ ] ✅ Loading states → Spinners and skeletons displayed

**Files**: `src/components/ErrorBoundary.tsx`, `src/utils/apiErrorHandler.ts`

## Performance Tests

### Bundle Size
- [ ] ⚠️ **Needs check**: Current bundle size → Run `npm run build` and analyze
- [ ] ✅ Code splitting → Dynamic imports for modals
- [ ] ✅ Tree shaking → Unused code eliminated
- [ ] ✅ Asset optimization → Images loaded from external URLs

### Runtime Performance
- [ ] ✅ Orb animations → Smooth 60fps on supported devices
- [ ] ✅ Modal transitions → Smooth open/close animations
- [ ] ✅ List scrolling → Smooth scrolling in protocol lists
- [ ] ⚠️ **Needs check**: Memory usage → Monitor for memory leaks in sessions

## Accessibility Tests

### Keyboard Navigation
- [ ] ✅ Tab navigation → All interactive elements accessible
- [ ] ✅ Escape key → Closes modals correctly
- [ ] ✅ Enter key → Activates buttons and forms
- [ ] ✅ Focus indicators → Visible focus states

### Screen Reader Support
- [ ] ✅ Alt text → Images have descriptive alt text
- [ ] ✅ ARIA labels → Interactive elements labeled
- [ ] ✅ Semantic HTML → Proper heading hierarchy
- [ ] ✅ Form labels → All inputs properly labeled

**Files**: Various components with accessibility attributes

## Critical Issues Found

### 🔴 High Priority Fixes Needed
1. **Session completion rewards** - No XP/token awards after sessions
2. **AI API configuration** - Core features require OPENAI_API_KEY
3. **Session persistence** - Completed sessions not saved to database
4. **Stripe integration** - Payment flows not implemented

### 🟡 Medium Priority Fixes Needed
1. **Dynamic protocol data** - Replace static data with database queries
2. **Achievement system** - No actual achievement tracking
3. **Journey data persistence** - Onboarding data only in localStorage
4. **Voice transcription** - Recorded messages not transcribed

### 🟢 Low Priority Enhancements
1. **Analytics enhancement** - More detailed user insights
2. **Social features** - Real comparison data
3. **Advanced personalization** - AI-driven recommendations
4. **Offline support** - Progressive Web App features