# Feature Map: Libero Application Audit

This document provides a matrix of screens and their associated features, along with their current status.

## Key:
- ✅ **Works**: Feature is fully implemented and functional
- ⚠️ **Partially wired**: Feature is present but requires further integration, data fetching, or logic completion
- ❌ **Missing**: Feature is planned or implied but not implemented
- 🐛 **Buggy**: Feature has known issues or unexpected behavior

---

## Screens & Features Matrix

### 1. Home Screen (`src/components/screens/HomeScreen.tsx`)

| Feature | Status | Source File(s) | Key Handlers | Notes |
|---------|--------|----------------|--------------|-------|
| Central Orb Display | ✅ Works | `src/components/Orb.tsx`, `src/components/WebGLOrb.tsx`, `src/components/ui/CSSOrb.tsx` | `onTap` → `handleOrbTap` | WebGL/CSS fallback working |
| Ego State Selection | ⚠️ Partially wired | `src/components/screens/HomeScreen.tsx` (EgoStatesCarousel) | `onEgoStateChange` | Visual selection works, but state persistence needs verification |
| Quick Action Buttons | ⚠️ Partially wired | `src/components/screens/HomeScreen.tsx` | `handleQuickSessionTap`, `onTabChange` | Buttons exist but session start flow incomplete |
| Milestone Roadmap | ⚠️ Partially wired | `src/components/screens/HomeScreen.tsx` (HorizontalMilestoneRoadmap) | `handleMilestoneClick` | Static data, needs dynamic milestone status from DB |
| Session Selection Modal | ⚠️ Partially wired | `src/components/modals/SessionSelectionModal.tsx` | `handleSessionSelect` | Modal opens but session start needs completion |

### 2. Explore Screen (`src/components/screens/ExploreScreen.tsx`)

| Feature | Status | Source File(s) | Key Handlers | Notes |
|---------|--------|----------------|--------------|-------|
| Protocol Library | ⚠️ Partially wired | `src/data/protocols.ts`, `src/components/screens/ExploreScreen.tsx` | `handleProtocolSelect` | Static protocol data, needs DB integration |
| Search & Filters | ✅ Works | `src/components/screens/ExploreScreen.tsx` | `getFilteredProtocols` | Client-side filtering working |
| Protocol Details Modal | ✅ Works | `src/components/screens/ExploreScreen.tsx` | `setSelectedProtocol` | Modal display working |
| Beginner Guide | ✅ Works | `src/components/BeginnerGuide.tsx` | `setShowGuide` | Guide modal functional |
| Category Navigation | ✅ Works | `src/components/screens/ExploreScreen.tsx` | Filter state management | Category filtering working |

### 3. Create Screen (`src/components/screens/CreateScreen.tsx`)

| Feature | Status | Source File(s) | Key Handlers | Notes |
|---------|--------|----------------|--------------|-------|
| Protocol Builder Wizard | ✅ Works | `src/components/screens/CreateScreen.tsx` | `handleNext`, `handleBack`, `handleComplete` | 3-step wizard functional |
| Token Deduction | ✅ Works | `src/components/screens/CreateScreen.tsx` | `handleComplete` | Recently implemented, needs testing |
| Protocol Validation | ✅ Works | `src/components/screens/CreateScreen.tsx` | `canProceed` | Form validation working |
| Database Persistence | ✅ Works | `src/components/screens/CreateScreen.tsx` | Supabase `custom_protocols` insert | Protocol saving to DB working |
| Token Balance Check | ✅ Works | `src/components/screens/CreateScreen.tsx` | Token validation in `handleComplete` | Prevents creation with insufficient tokens |

### 4. Chat Screen (`src/components/screens/ChatScreen.tsx`)

| Feature | Status | Source File(s) | Key Handlers | Notes |
|---------|--------|----------------|--------------|-------|
| AI Chat Interface | ⚠️ Partially wired | `src/components/screens/ChatScreen.tsx`, `supabase/functions/chatgpt-chat/index.ts` | `sendMessage` | Depends on OPENAI_API_KEY configuration |
| Voice Recording | ⚠️ Partially wired | `src/components/screens/ChatScreen.tsx` | `startRecording`, `stopRecording` | Recording works, transcription missing |
| Message Persistence | ✅ Works | `src/components/screens/ChatScreen.tsx` | localStorage save/load | Local storage working |
| Knowledge Base Context | ✅ Works | `src/components/screens/ChatScreen.tsx` | `buildKnowledgeBase` | Context building functional |
| Fallback Responses | ✅ Works | `src/components/screens/ChatScreen.tsx` | Error handling in `sendMessage` | Graceful degradation working |

### 5. Profile Screen (`src/components/screens/ProfileScreen.tsx`)

| Feature | Status | Source File(s) | Key Handlers | Notes |
|---------|--------|----------------|--------------|-------|
| User Stats Display | ✅ Works | `src/components/screens/ProfileScreen.tsx` | Data from `useGameState` | Level, XP, streak display working |
| Ego State Management | ✅ Works | `src/components/screens/ProfileScreen.tsx` | `handleOpenEgoStates` | Links to ego states modal |
| Recent Sessions | ❌ Missing | `src/components/screens/ProfileScreen.tsx` | `recentSessions` state | Empty array, needs DB query |
| Achievements Display | ❌ Missing | `src/components/screens/ProfileScreen.tsx` | `achievements` from user | Shows count but no actual achievements |
| Analytics Modal | ⚠️ Partially wired | `src/components/screens/ProfileScreen.tsx` | `setShowAnalytics` | Modal exists but limited data |
| Settings Integration | ✅ Works | `src/components/screens/ProfileScreen.tsx` | `handleOpenSettings` | Links to settings modal |

### 6. Journey Map Screen (`src/components/screens/JourneyMapScreen.tsx`)

| Feature | Status | Source File(s) | Key Handlers | Notes |
|---------|--------|----------------|--------------|-------|
| Onboarding Wizard | ⚠️ Partially wired | `src/components/journey/OnboardingWizard.tsx` | `handleOnboardingComplete` | Wizard works but data not persisted to DB |
| Daily Tasks | ⚠️ Partially wired | `src/components/journey/DailyTasks.tsx` | `onTaskComplete` | Static task generation, needs DB integration |
| Journey Progress | ⚠️ Partially wired | `src/components/screens/JourneyMapScreen.tsx` | Progress display | Uses localStorage, needs DB persistence |
| Weekly Challenges | ❌ Missing | `src/components/screens/JourneyMapScreen.tsx` | Static display only | No backend logic for challenges |
| Achievement Showcase | ❌ Missing | `src/components/screens/JourneyMapScreen.tsx` | Static display | No real achievements system |

### 7. Session World (`src/components/session/UnifiedSessionWorld.tsx`)

| Feature | Status | Source File(s) | Key Handlers | Notes |
|---------|--------|----------------|--------------|-------|
| Session Orchestration | ⚠️ Partially wired | `src/services/session.ts`, `src/store/sessionStore.ts` | `startNewSession`, `play`, `pause` | Basic playback works, needs completion tracking |
| AI Script Generation | ⚠️ Partially wired | `src/services/chatgpt.ts`, `supabase/functions/generate-script/index.ts` | `getSessionScript` | Depends on OPENAI_API_KEY |
| Text-to-Speech | ⚠️ Partially wired | `src/services/voice.ts`, `supabase/functions/tts/index.ts` | `synthesizeSegment` | Fallback to browser TTS works |
| Breathing Pattern | ✅ Works | `src/components/session/UnifiedSessionWorld.tsx` | Breathing timer logic | 4-4-6-4 pattern implemented |
| Session Controls | ✅ Works | `src/components/session/UnifiedSessionWorld.tsx` | `handlePlayPause`, `nextSegment`, `prevSegment` | Control buttons functional |
| Session Completion | ❌ Missing | `src/components/session/UnifiedSessionWorld.tsx` | Session end handler | No XP/token rewards or DB persistence |

### 8. Modals

#### Auth Modal (`src/components/auth/AuthModal.tsx`)
| Feature | Status | Source File(s) | Key Handlers | Notes |
|---------|--------|----------------|--------------|-------|
| Sign In/Up Forms | ✅ Works | `src/components/auth/AuthModal.tsx` | `handleSubmit` | Form validation and submission working |
| Password Reset | ✅ Works | `src/components/auth/AuthModal.tsx` | Reset flow | Email reset functional |
| Error Handling | ✅ Works | `src/components/auth/AuthModal.tsx` | Form error display | User-friendly error messages |

#### Ego States Modal (`src/components/modals/EgoStatesModal.tsx`)
| Feature | Status | Source File(s) | Key Handlers | Notes |
|---------|--------|----------------|--------------|-------|
| Ego State Selection | ✅ Works | `src/components/modals/EgoStatesModal.tsx` | `handleSelectEgoState` | Selection and state update working |
| Usage Analytics | ⚠️ Partially wired | `src/components/modals/EgoStatesModal.tsx` | `getUsagePercentage` | Shows percentages but needs real session data |
| State Descriptions | ✅ Works | `src/store/index.ts` | Static EGO_STATES data | Descriptions and colors working |

#### Plan Modal (`src/components/modals/PlanModal.tsx`)
| Feature | Status | Source File(s) | Key Handlers | Notes |
|---------|--------|----------------|--------------|-------|
| Plan Comparison | ⚠️ Partially wired | `src/components/modals/PlanModal.tsx` | Static plan features | Features arrays empty, needs population |
| Stripe Integration | ❌ Missing | `src/components/modals/PlanModal.tsx` | `handleUpgrade` | Upgrade button exists but not implemented |
| Current Plan Display | ✅ Works | `src/components/modals/PlanModal.tsx` | User plan from `useGameState` | Shows current plan correctly |

#### Tokens Modal (`src/components/modals/TokensModal.tsx`)
| Feature | Status | Source File(s) | Key Handlers | Notes |
|---------|--------|----------------|--------------|-------|
| Token Balance Display | ✅ Works | `src/components/modals/TokensModal.tsx` | User tokens from `useGameState` | Current balance shown correctly |
| Token Packages | ❌ Missing | `src/components/modals/TokensModal.tsx` | `tokenPackages` state | Empty array, needs Stripe integration |
| Earning Methods | ✅ Works | `src/components/modals/TokensModal.tsx` | Static display | Shows how to earn tokens |
| Purchase Flow | ❌ Missing | `src/components/modals/TokensModal.tsx` | `handlePurchaseTokens` | No Stripe checkout implementation |

#### Favorites Modal (`src/components/modals/FavoritesModal.tsx`)
| Feature | Status | Source File(s) | Key Handlers | Notes |
|---------|--------|----------------|--------------|-------|
| Session History | ⚠️ Partially wired | `src/components/modals/FavoritesModal.tsx` | Supabase `sessions` query | Fetches from DB but sessions table may be empty |
| Session Replay | ⚠️ Partially wired | `src/components/modals/FavoritesModal.tsx` | `handleSessionStart` | Converts to FavoriteSession format |
| Session Deletion | ✅ Works | `src/components/modals/FavoritesModal.tsx` | `handleSessionDelete` | DB deletion working |
| Session Insights | ⚠️ Partially wired | `src/components/modals/FavoritesModal.tsx` | Calculated from sessions data | Depends on having session data |

#### Personal Library Modal (`src/components/modals/PersonalLibraryModal.tsx`)
| Feature | Status | Source File(s) | Key Handlers | Notes |
|---------|--------|----------------|--------------|-------|
| Custom Protocols List | ✅ Works | `src/components/modals/PersonalLibraryModal.tsx` | Supabase `custom_protocols` query | DB fetching working |
| Protocol Details | ✅ Works | `src/components/modals/PersonalLibraryModal.tsx` | `setSelectedProtocol` | Detail modal functional |
| Protocol Execution | ⚠️ Partially wired | `src/components/modals/PersonalLibraryModal.tsx` | `handleProtocolStart` | Needs session integration |
| Protocol Management | ✅ Works | `src/components/modals/PersonalLibraryModal.tsx` | Delete, copy functions | CRUD operations working |

#### Settings Modal (`src/components/modals/SettingsModal.tsx`)
| Feature | Status | Source File(s) | Key Handlers | Notes |
|---------|--------|----------------|--------------|-------|
| Audio Settings | ⚠️ Partially wired | `src/components/modals/SettingsModal.tsx` | UI controls only | No persistence or effect on audio |
| Appearance Settings | ⚠️ Partially wired | `src/components/modals/SettingsModal.tsx` | UI toggles only | No actual theme switching |
| Account Management | ❌ Missing | `src/components/modals/SettingsModal.tsx` | Stripe customer portal | Button exists but not implemented |
| Data Export | ❌ Missing | `src/components/modals/SettingsModal.tsx` | Export buttons | No actual export functionality |

### 9. Global Components

#### Global HUD (`src/components/HUD/GlobalHUD.tsx`)
| Feature | Status | Source File(s) | Key Handlers | Notes |
|---------|--------|----------------|--------------|-------|
| User Stats Display | ✅ Works | `src/components/HUD/GlobalHUD.tsx` | Data from `useGameState` | Level, XP, streak, tokens display working |
| Ego State Button | ✅ Works | `src/components/HUD/GlobalHUD.tsx` | `handleEgoStateClick` → `openEgoModal` | Links to ego states modal |
| Modal Triggers | ✅ Works | `src/components/HUD/GlobalHUD.tsx` | Various `openModal` calls | All modal triggers working |

#### Navigation Tabs (`src/components/NavigationTabs.tsx`)
| Feature | Status | Source File(s) | Key Handlers | Notes |
|---------|--------|----------------|--------------|-------|
| Tab Navigation | ✅ Works | `src/components/NavigationTabs.tsx` | `handleTabClick` | Tab switching functional |
| Active State | ✅ Works | `src/components/NavigationTabs.tsx` | Visual active indicators | Active tab highlighting working |
| Safe Area Support | ✅ Works | `src/index.css`, `src/components/NavigationTabs.tsx` | CSS safe area variables | iOS safe area handled |

---

## Critical Gaps Summary

### High Priority (Blocking Core Functionality)
1. **Session Completion Flow**: No XP/token rewards or session persistence after completion
2. **Dynamic Protocol Data**: All protocols are static, need DB integration
3. **AI API Configuration**: Requires OPENAI_API_KEY setup for script generation and chat
4. **Stripe Integration**: Payment flows not implemented
5. **Session History**: No actual session data being saved to `sessions` table

### Medium Priority (Feature Completeness)
1. **Onboarding Data Persistence**: Wizard data not saved to DB
2. **Achievement System**: No real achievements being tracked or awarded
3. **Settings Persistence**: Settings changes not saved or applied
4. **Voice Transcription**: Recorded voice messages not transcribed

### Low Priority (Polish & Enhancement)
1. **Analytics Data**: Limited real analytics in profile screen
2. **Social Features**: No actual social comparison data
3. **Weekly Challenges**: Static display only
4. **Token Purchase Flow**: UI exists but no Stripe implementation