import { supabase } from '../lib/supabase';

export interface UserPreferencesMemory {
  level?: number;
  plan?: string;
  activeEgoState?: string;
  egoStateUsage?: Record<string, number>;
  journeyGoals?: any[];
  journeyPreferences?: Record<string, any>;
  settings?: Record<string, any>;
  lastSessionDate?: string | null;
  sessionStreak?: number;
}

export interface SessionSummaryMemory {
  id: string;
  userId: string;
  egoState: string;
  action: string;
  durationMinutes: number;
  experienceGained: number;
  completedAt: string;
}

export interface OutcomeSummaryMemory {
  totalSessions: number;
  totalExperience: number;
  lastSessionAt: string | null;
  averageDurationMinutes: number | null;
  favoriteEgoState: string | null;
  egoStateCounts: Record<string, number>;
}

export interface UserMemory {
  preferences: UserPreferencesMemory | null;
  recentSessions: SessionSummaryMemory[];
  outcomeSummary: OutcomeSummaryMemory;
}

export interface SessionOutcomeInput {
  userId: string;
  context?: any;
  plan?: any;
  script?: any;
  durationSec?: number;
  experienceGained?: number;
  completedAt?: string;
  previousMemory?: UserMemory | null;
}

function cloneEmptyMemory(): UserMemory {
  return {
    preferences: null,
    recentSessions: [],
    outcomeSummary: {
      totalSessions: 0,
      totalExperience: 0,
      lastSessionAt: null,
      averageDurationMinutes: null,
      favoriteEgoState: null,
      egoStateCounts: {}
    }
  };
}

function generateRandomId(prefix: string): string {
  const globalCrypto = typeof globalThis !== 'undefined' ? (globalThis as any).crypto : undefined;

  if (globalCrypto?.randomUUID) {
    return `${prefix}_${globalCrypto.randomUUID()}`;
  }

  return `${prefix}_${Date.now()}_${Math.random().toString(36).slice(2, 10)}`;
}

function normalizeSessionRow(row: any): SessionSummaryMemory {
  return {
    id: row?.id || generateRandomId('session'),
    userId: row?.user_id || row?.userId || 'unknown',
    egoState: row?.ego_state || row?.egoState || 'guardian',
    action: row?.action || 'guided session',
    durationMinutes: typeof row?.duration === 'number' ? row.duration : 0,
    experienceGained: typeof row?.experience_gained === 'number' ? row.experience_gained : 0,
    completedAt: row?.completed_at || new Date().toISOString()
  };
}

function computeOutcomeSummary(sessions: SessionSummaryMemory[]): OutcomeSummaryMemory {
  if (!sessions.length) {
    return cloneEmptyMemory().outcomeSummary;
  }

  const totalSessions = sessions.length;
  const totalExperience = sessions.reduce((sum, session) => sum + (session.experienceGained || 0), 0);
  const averageDuration = sessions.reduce((sum, session) => sum + (session.durationMinutes || 0), 0) / totalSessions;
  const lastSessionAt = sessions[0]?.completedAt || null;

  const egoStateCounts = sessions.reduce<Record<string, number>>((acc, session) => {
    const key = (session.egoState || 'guardian').toLowerCase();
    acc[key] = (acc[key] || 0) + 1;
    return acc;
  }, {});

  const favoriteEntry = Object.entries(egoStateCounts).sort((a, b) => b[1] - a[1])[0];

  return {
    totalSessions,
    totalExperience,
    lastSessionAt,
    averageDurationMinutes: Number.isFinite(averageDuration) ? Number(averageDuration.toFixed(2)) : null,
    favoriteEgoState: favoriteEntry ? favoriteEntry[0] : null,
    egoStateCounts
  };
}

function mergePreferences(profile: any): UserPreferencesMemory | null {
  if (!profile) {
    return null;
  }

  const preferences: UserPreferencesMemory = {
    level: profile.level,
    plan: profile.plan,
    activeEgoState: profile.active_ego_state,
    egoStateUsage: profile.ego_state_usage || {},
    journeyGoals: 'journey_goals' in profile ? profile.journey_goals : undefined,
    journeyPreferences: 'journey_preferences' in profile ? profile.journey_preferences : undefined,
    settings: 'settings' in profile ? profile.settings : undefined,
    lastSessionDate: profile.last_session_date,
    sessionStreak: profile.session_streak
  };

  return preferences;
}

function buildMemory(preferences: UserPreferencesMemory | null, sessions: SessionSummaryMemory[]): UserMemory {
  return {
    preferences,
    recentSessions: sessions,
    outcomeSummary: computeOutcomeSummary(sessions)
  };
}

function updateMemoryWithSession(memory: UserMemory, session: SessionSummaryMemory): UserMemory {
  const previousSessions = memory.recentSessions || [];
  const updatedSessions = [session, ...previousSessions].slice(0, 50);

  const previousSummary = memory.outcomeSummary || cloneEmptyMemory().outcomeSummary;
  const newTotalSessions = previousSummary.totalSessions + 1;
  const newTotalExperience = previousSummary.totalExperience + (session.experienceGained || 0);
  const averageDurationBase = previousSummary.averageDurationMinutes ?? 0;
  const previousCount = previousSummary.totalSessions;
  const newAverageDuration = previousCount === 0
    ? session.durationMinutes
    : ((averageDurationBase * previousCount) + session.durationMinutes) / newTotalSessions;

  const egoStateCounts = { ...(previousSummary.egoStateCounts || {}) };
  const normalizedEgo = (session.egoState || 'guardian').toLowerCase();
  egoStateCounts[normalizedEgo] = (egoStateCounts[normalizedEgo] || 0) + 1;

  const favoriteEntry = Object.entries(egoStateCounts).sort((a, b) => b[1] - a[1])[0];

  return {
    preferences: memory.preferences,
    recentSessions: updatedSessions,
    outcomeSummary: {
      totalSessions: newTotalSessions,
      totalExperience: newTotalExperience,
      lastSessionAt: session.completedAt,
      averageDurationMinutes: Number(newAverageDuration.toFixed(2)),
      favoriteEgoState: favoriteEntry ? favoriteEntry[0] : memory.outcomeSummary.favoriteEgoState,
      egoStateCounts
    }
  };
}

export async function loadUserMemory(userId?: string | null): Promise<UserMemory> {
  if (!userId) {
    return cloneEmptyMemory();
  }

  try {
    const profilePromise = supabase
      .from('user_profiles')
      .select('*')
      .eq('id', userId)
      .single();

    const sessionsBase = supabase
      .from('sessions')
      .select('*')
      .eq('user_id', userId);

    const sessionsOrdered = typeof (sessionsBase as any).order === 'function'
      ? (sessionsBase as any).order('completed_at', { ascending: false })
      : sessionsBase;

    const sessionsLimited = typeof (sessionsOrdered as any).limit === 'function'
      ? (sessionsOrdered as any).limit(25)
      : sessionsOrdered;

    const [profileResultRaw, sessionsResultRaw] = await Promise.all([
      profilePromise,
      sessionsLimited
    ]);

    const profileResult = (profileResultRaw && typeof profileResultRaw === 'object' && 'data' in profileResultRaw)
      ? profileResultRaw as { data: any; error: any }
      : { data: null, error: { code: 'OFFLINE' } };

    const sessionsResult = (sessionsResultRaw && typeof sessionsResultRaw === 'object' && 'data' in sessionsResultRaw)
      ? sessionsResultRaw as { data: any; error: any }
      : { data: [], error: { code: 'OFFLINE' } };

    const profileError = profileResult.error;
    const sessionsError = sessionsResult.error;

    if (profileError && profileError.code === 'OFFLINE') {
      return cloneEmptyMemory();
    }

    if (sessionsError && sessionsError.code === 'OFFLINE') {
      return buildMemory(mergePreferences(profileResult.data), []);
    }

    if (profileError) {
      console.warn('[MEMORY] Failed to load user profile:', profileError);
    }

    if (sessionsError) {
      console.warn('[MEMORY] Failed to load sessions history:', sessionsError);
    }

    const preferences = mergePreferences(profileResult.data);
    const sessionRows = Array.isArray(sessionsResult.data) ? sessionsResult.data : [];
    const sessions = sessionRows.map(normalizeSessionRow);

    return buildMemory(preferences, sessions);
  } catch (error) {
    console.warn('[MEMORY] Unexpected error while loading memory:', error);
    return cloneEmptyMemory();
  }
}

function inferActionFromContext(context: any): string {
  if (!context) {
    return 'guided session';
  }

  return (
    context.actionName ||
    context.action?.name ||
    context.goalName ||
    context.goal?.name ||
    context.methodName ||
    context.protocolName ||
    context.customProtocol?.name ||
    context.sessionType ||
    'guided session'
  ).toString();
}

function inferEgoStateFromContext(context: any, preferences?: UserPreferencesMemory | null): string {
  if (!context) {
    return preferences?.activeEgoState || 'guardian';
  }

  return (
    context.egoState ||
    context.activeEgoState ||
    context.userPrefs?.activeEgoState ||
    preferences?.activeEgoState ||
    'guardian'
  ).toString();
}

function calculateExperience(durationMinutes: number): number {
  if (!Number.isFinite(durationMinutes) || durationMinutes <= 0) {
    return 2;
  }
  return Math.max(2, Math.floor(durationMinutes * 2));
}

export function mergeMemoryIntoContext(userContext: any, memory?: UserMemory | null): any {
  if (!memory) {
    return userContext;
  }

  const mergedContext = {
    ...userContext,
    userPrefs: {
      ...(userContext?.userPrefs || {}),
      preferredPlan: memory.preferences?.plan,
      activeEgoState: memory.preferences?.activeEgoState,
      egoStateUsage: memory.preferences?.egoStateUsage,
      sessionStreak: memory.preferences?.sessionStreak,
      lastSessionDate: memory.preferences?.lastSessionDate
    },
    memorySummary: memory.outcomeSummary,
    priorSessions: memory.recentSessions,
    lastSessionOutcome: memory.recentSessions[0] || null
  };

  return mergedContext;
}

export async function saveSessionOutcome(outcome: SessionOutcomeInput): Promise<UserMemory> {
  const baseMemory = outcome.previousMemory || cloneEmptyMemory();

  if (!outcome.userId) {
    return baseMemory;
  }

  const context = outcome.context || {};
  const durationSeconds = typeof outcome.durationSec === 'number'
    ? outcome.durationSec
    : (typeof context.lengthSec === 'number' ? context.lengthSec : null);

  const durationMinutes = durationSeconds
    ? Math.max(1, Math.floor(durationSeconds / 60))
    : Math.max(1, Math.round((context.lengthSec || 600) / 60));

  const experience = typeof outcome.experienceGained === 'number'
    ? outcome.experienceGained
    : calculateExperience(durationMinutes);

  const completedAt = outcome.completedAt || new Date().toISOString();

  const sessionRecord = {
    user_id: outcome.userId,
    ego_state: inferEgoStateFromContext(context, baseMemory.preferences),
    action: inferActionFromContext(context),
    duration: durationMinutes,
    experience_gained: experience,
    completed_at: completedAt
  };

  let persistedSession: SessionSummaryMemory | null = null;

  try {
    const { data, error } = await supabase
      .from('sessions')
      .insert(sessionRecord)
      .select()
      .limit(1);

    if (error) {
      throw error;
    }

    const row = Array.isArray(data) ? data[0] : data;
    persistedSession = normalizeSessionRow(row || sessionRecord);
  } catch (error: any) {
    if (error?.code === 'OFFLINE') {
      console.warn('[MEMORY] Offline mode detected while saving outcome, caching locally');
      persistedSession = normalizeSessionRow({ ...sessionRecord, id: `offline_${Date.now()}` });
    } else {
      console.error('[MEMORY] Failed to persist session outcome:', error);
      throw error;
    }
  }

  if (!persistedSession) {
    persistedSession = normalizeSessionRow(sessionRecord);
  }

  const updatedMemory = updateMemoryWithSession(baseMemory, persistedSession);
  return updatedMemory;
}
