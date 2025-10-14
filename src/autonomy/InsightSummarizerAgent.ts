import { loadUserMemory, type OutcomeSummaryMemory, type UserMemory } from '../services/userMemory';

export type TrendConfidence = 'low' | 'medium' | 'high';

export interface TrendInsight {
  id: string;
  type: 'engagement' | 'duration' | 'experience' | 'preference' | 'recency';
  title: string;
  summary: string;
  confidence: TrendConfidence;
  evidence: Record<string, unknown>;
}

export interface NarrativeBrief {
  channel: string;
  title: string;
  body: string;
}

export interface InsightSummaryResult {
  userId: string | null;
  generatedAt: string;
  memory: UserMemory;
  trends: TrendInsight[];
  briefs: NarrativeBrief[];
}

export interface InsightSummarizerOptions {
  userId?: string | null;
  channels?: string[];
  now?: Date;
}

export interface InsightScheduleOptions {
  userIds: string[];
  channels?: string[];
  now?: Date;
  onSummary?: (result: InsightSummaryResult) => Promise<void> | void;
  logger?: Pick<Console, 'info' | 'error'>;
}

const DEFAULT_CHANNELS = ['coach', 'product', 'broadcast'];

function toConfidence(totalSessions: number): TrendConfidence {
  if (totalSessions >= 12) {
    return 'high';
  }

  if (totalSessions >= 4) {
    return 'medium';
  }

  return 'low';
}

function describeEngagement(outcome: OutcomeSummaryMemory, now: Date): TrendInsight {
  const { totalSessions, lastSessionAt } = outcome;
  const confidence = toConfidence(totalSessions);

  if (totalSessions === 0) {
    return {
      id: 'engagement.none',
      type: 'engagement',
      title: 'Awaiting first practice',
      summary: 'No guided sessions have been recorded yet—prompt a gentle kickoff sequence.',
      confidence,
      evidence: { totalSessions }
    };
  }

  const lastSession = lastSessionAt ? new Date(lastSessionAt) : null;
  const daysSince = lastSession ? Math.floor((now.getTime() - lastSession.getTime()) / (1000 * 60 * 60 * 24)) : null;

  let summary: string;
  if (daysSince === null) {
    summary = `Completed ${totalSessions} sessions overall.`;
  } else if (daysSince <= 1) {
    summary = `Consistent momentum with ${totalSessions} sessions and one within the last day.`;
  } else if (daysSince <= 3) {
    summary = `Solid rhythm: ${totalSessions} sessions with a ${daysSince}-day pause since the last.`;
  } else {
    summary = `Activity dip: ${totalSessions} sessions total but the last was ${daysSince} days ago.`;
  }

  return {
    id: 'engagement.activity',
    type: 'engagement',
    title: 'Session momentum',
    summary,
    confidence,
    evidence: {
      totalSessions,
      lastSessionAt,
      daysSinceLastSession: daysSince
    }
  };
}

function describeDuration(outcome: OutcomeSummaryMemory): TrendInsight {
  const { totalSessions, averageDurationMinutes } = outcome;
  const confidence = toConfidence(totalSessions);

  if (!averageDurationMinutes) {
    return {
      id: 'duration.unknown',
      type: 'duration',
      title: 'Duration variance',
      summary: 'Session length data is sparse—suggest collecting more guided sessions to calibrate pacing.',
      confidence,
      evidence: {
        totalSessions,
        averageDurationMinutes
      }
    };
  }

  const summary = averageDurationMinutes >= 25
    ? `Prefers immersive sessions averaging ${averageDurationMinutes} minutes.`
    : averageDurationMinutes >= 12
      ? `Maintains steady practice around ${averageDurationMinutes} minutes per session.`
      : `Short bursts dominate with average duration near ${averageDurationMinutes} minutes.`;

  return {
    id: 'duration.average',
    type: 'duration',
    title: 'Preferred pacing',
    summary,
    confidence,
    evidence: {
      totalSessions,
      averageDurationMinutes
    }
  };
}

function describeExperience(outcome: OutcomeSummaryMemory): TrendInsight {
  const { totalSessions, totalExperience } = outcome;
  const confidence = toConfidence(totalSessions);

  if (!totalSessions) {
    return {
      id: 'experience.none',
      type: 'experience',
      title: 'Experience pending',
      summary: 'No experience earned yet—once sessions begin we can benchmark their pace.',
      confidence,
      evidence: { totalExperience }
    };
  }

  const xpPerSession = totalExperience / totalSessions;
  let summary: string;

  if (xpPerSession >= 20) {
    summary = `High-impact practice: averaging ${xpPerSession.toFixed(1)} XP per session.`;
  } else if (xpPerSession >= 10) {
    summary = `Balanced growth with ~${xpPerSession.toFixed(1)} XP per session.`;
  } else {
    summary = `Slow-build cadence at ~${xpPerSession.toFixed(1)} XP per session—consider higher intensity guidance.`;
  }

  return {
    id: 'experience.pace',
    type: 'experience',
    title: 'Progress velocity',
    summary,
    confidence,
    evidence: {
      totalSessions,
      totalExperience,
      xpPerSession: Number(xpPerSession.toFixed(2))
    }
  };
}

function describePreference(outcome: OutcomeSummaryMemory): TrendInsight {
  const { favoriteEgoState, egoStateCounts, totalSessions } = outcome;
  const confidence = toConfidence(totalSessions);

  if (!favoriteEgoState) {
    return {
      id: 'preference.undetermined',
      type: 'preference',
      title: 'Preference undecided',
      summary: 'No clear ego-state preference yet—rotate archetypes to surface affinities.',
      confidence,
      evidence: {
        totalSessions,
        egoStateCounts
      }
    };
  }

  const usage = egoStateCounts?.[favoriteEgoState.toLowerCase()] ?? 0;
  const percentage = totalSessions ? Math.round((usage / totalSessions) * 100) : 0;

  return {
    id: 'preference.favorite',
    type: 'preference',
    title: 'Dominant ego-state',
    summary: `Shows a ${percentage}% preference for the ${favoriteEgoState} state across recent sessions.`,
    confidence,
    evidence: {
      favoriteEgoState,
      usage,
      totalSessions,
      percentage
    }
  };
}

function describeRecency(outcome: OutcomeSummaryMemory, now: Date): TrendInsight {
  const { lastSessionAt, totalSessions } = outcome;
  const confidence = toConfidence(totalSessions);

  if (!lastSessionAt) {
    return {
      id: 'recency.none',
      type: 'recency',
      title: 'Recency unclear',
      summary: 'We have not captured a completion timestamp yet—remind the user to sync sessions.',
      confidence,
      evidence: { lastSessionAt }
    };
  }

  const lastSession = new Date(lastSessionAt);
  const diffDays = Math.floor((now.getTime() - lastSession.getTime()) / (1000 * 60 * 60 * 24));
  let summary: string;

  if (diffDays <= 0) {
    summary = 'Latest session completed today—capitalize on the active streak.';
  } else if (diffDays === 1) {
    summary = 'Last session yesterday—keep the rhythm going with a fresh recommendation.';
  } else if (diffDays <= 7) {
    summary = `Last session ${diffDays} days ago—gently re-engage soon.`;
  } else {
    summary = `Last session ${diffDays} days ago—plan a reactivation play.`;
  }

  return {
    id: 'recency.last-session',
    type: 'recency',
    title: 'Last touchpoint',
    summary,
    confidence,
    evidence: {
      lastSessionAt,
      daysSinceLastSession: diffDays
    }
  };
}

function deriveTrendInsights(outcome: OutcomeSummaryMemory, now: Date): TrendInsight[] {
  const insights: TrendInsight[] = [];

  insights.push(describeEngagement(outcome, now));
  insights.push(describeDuration(outcome));
  insights.push(describeExperience(outcome));
  insights.push(describePreference(outcome));
  insights.push(describeRecency(outcome, now));

  return insights;
}

function compileBriefBody(intro: string, insights: TrendInsight[]): string {
  const bullets = insights
    .slice(0, 3)
    .map((insight) => `• ${insight.summary}`)
    .join('\n');

  return `${intro}\n${bullets}`.trim();
}

function formatNarrativeBrief(channel: string, insights: TrendInsight[], memory: UserMemory, now: Date): NarrativeBrief {
  const introBase = `Generated ${now.toISOString()} for ${channel} channel.`;

  switch (channel) {
    case 'coach': {
      const intro = `${introBase} Focus coaching nudges on the strongest momentum first.`;
      return {
        channel,
        title: 'Coach Brief',
        body: compileBriefBody(intro, insights)
      };
    }
    case 'product': {
      const intro = `${introBase} Product should adapt UI and rewards to align with current behaviour.`;
      return {
        channel,
        title: 'Product Brief',
        body: compileBriefBody(intro, insights)
      };
    }
    case 'broadcast':
    case 'marketing': {
      const intro = `${introBase} Use this for outbound comms and celebratory messaging.`;
      return {
        channel,
        title: 'Broadcast Brief',
        body: compileBriefBody(intro, insights)
      };
    }
    default: {
      const intro = `${introBase} General summary.`;
      return {
        channel,
        title: `${channel[0]?.toUpperCase() ?? 'G'}${channel.slice(1)} Brief`,
        body: compileBriefBody(intro, insights)
      };
    }
  }
}

export async function runInsightSummarizer(options: InsightSummarizerOptions = {}): Promise<InsightSummaryResult> {
  const { userId = null, channels = DEFAULT_CHANNELS, now = new Date() } = options;

  const memory = await loadUserMemory(userId ?? undefined);
  const trends = deriveTrendInsights(memory.outcomeSummary, now);
  const briefs = channels.map((channel) => formatNarrativeBrief(channel, trends, memory, now));

  return {
    userId,
    generatedAt: now.toISOString(),
    memory,
    trends,
    briefs
  };
}

export async function runInsightSummariesOnSchedule(options: InsightScheduleOptions): Promise<InsightSummaryResult[]> {
  const { userIds, channels = DEFAULT_CHANNELS, now = new Date(), onSummary, logger } = options;
  const results: InsightSummaryResult[] = [];

  for (const userId of userIds) {
    try {
      const result = await runInsightSummarizer({ userId, channels, now });
      results.push(result);
      if (onSummary) {
        await onSummary(result);
      }
      logger?.info?.(`[INSIGHT_SUMMARY] Generated briefs for user ${userId}`);
    } catch (error) {
      logger?.error?.(`[INSIGHT_SUMMARY] Failed to generate briefs for user ${userId}`, error);
    }
  }

  return results;
}
