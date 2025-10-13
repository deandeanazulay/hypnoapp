import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { flushAnalytics, getAnalyticsStatus, track } from './analytics';

const ORIGINAL_VITE_ANALYTICS_ENDPOINT = process.env.VITE_ANALYTICS_ENDPOINT;
const ORIGINAL_NODE_ENV = process.env.NODE_ENV;

describe('AnalyticsQueue in non-browser environments', () => {
  beforeEach(() => {
    (import.meta as any).env = {
      ...import.meta.env,
      DEV: false,
      VITE_ANALYTICS_ENDPOINT: 'https://example.com/analytics',
    };

    process.env.VITE_ANALYTICS_ENDPOINT = 'https://example.com/analytics';
    process.env.NODE_ENV = 'test';
  });

  afterEach(async () => {
    await flushAnalytics();
    vi.restoreAllMocks();
    vi.unstubAllGlobals();
    process.env.VITE_ANALYTICS_ENDPOINT = ORIGINAL_VITE_ANALYTICS_ENDPOINT;
    process.env.NODE_ENV = ORIGINAL_NODE_ENV;
  });

  it('queues and flushes events using fallbacks when browser globals are unavailable', async () => {
    const fetchMock = vi.fn().mockResolvedValue({ ok: true });
    vi.stubGlobal('fetch', fetchMock);
    vi.stubGlobal('navigator', undefined as unknown as Navigator);
    vi.stubGlobal('window', undefined as unknown as Window);
    vi.stubGlobal('performance', undefined as unknown as Performance);

    track('test_event', { foo: 'bar' });

    const statusAfterTrack = getAnalyticsStatus();
    expect(statusAfterTrack.queueSize).toBe(1);
    expect(statusAfterTrack.pendingFlush).toBe(true);
    expect(statusAfterTrack.maxQueueSize).toBeGreaterThan(0);

    await flushAnalytics();

    const statusAfterFlush = getAnalyticsStatus();
    expect(statusAfterFlush.queueSize).toBe(0);
    expect(statusAfterFlush.pendingFlush).toBe(false);
    expect(fetchMock).toHaveBeenCalledTimes(1);

    const fetchBody = fetchMock.mock.calls[0]?.[1]?.body as string;
    expect(typeof fetchBody).toBe('string');

    const payload = JSON.parse(fetchBody);
    expect(Array.isArray(payload.events)).toBe(true);
    expect(payload.events).toHaveLength(1);

    const eventPayload = payload.events[0]?.payload;
    expect(eventPayload.userAgent).toBe('');
    expect(eventPayload.url).toBe('');
  });
});
