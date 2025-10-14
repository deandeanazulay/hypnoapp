import { runInsightSummariesOnSchedule } from '../autonomy/InsightSummarizerAgent';
import { supabase } from '../lib/supabase';

export async function runInsightSummaryCron(now = new Date()): Promise<void> {
  const { data, error } = await supabase
    .from('user_profiles')
    .select('id');

  if (error) {
    console.error('[INSIGHT_SUMMARY_CRON] Failed to fetch user ids', error);
    return;
  }

  const userIds = (data ?? [])
    .map((row: any) => row?.id)
    .filter((id: string | null | undefined): id is string => Boolean(id));

  if (!userIds.length) {
    console.info('[INSIGHT_SUMMARY_CRON] No users found, skipping run');
    return;
  }

  await runInsightSummariesOnSchedule({
    userIds,
    now,
    logger: console
  });
}

if (typeof process !== 'undefined' && Array.isArray(process.argv) && process.argv[1]) {
  const entryUrl = new URL(process.argv[1], 'file://').href;
  if (import.meta.url === entryUrl) {
    runInsightSummaryCron().catch((error) => {
      console.error('[INSIGHT_SUMMARY_CRON] Unexpected failure', error);
      process.exit(1);
    });
  }
}
