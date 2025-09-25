interface AnalyticsEvent {
  event: string;
  payload: Record<string, any>;
  timestamp: number;
  sessionId?: string;
}

class AnalyticsQueue {
  private queue: AnalyticsEvent[] = [];
  private flushTimer: NodeJS.Timeout | null = null;
  private readonly maxQueueSize = 50;
  private readonly flushIntervalMs = 10000; // 10 seconds
  private readonly batchSize = 20;
  private sessionId: string;

  constructor() {
    this.sessionId = this.generateSessionId();
    
    // Flush on page unload
    if (typeof window !== 'undefined') {
      window.addEventListener('beforeunload', () => {
        this.flush(true); // Synchronous flush on unload
      });
    }
  }

  private generateSessionId(): string {
    return 'session_' + Date.now() + '_' + Math.random().toString(36).substr(2, 9);
  }

  add(event: string, payload: Record<string, any>): void {
    const analyticsEvent: AnalyticsEvent = {
      event,
      payload: {
        ...payload,
        userAgent: navigator.userAgent,
        timestamp: Date.now(),
        url: window.location.href
      },
      timestamp: Date.now(),
      sessionId: this.sessionId
    };

    this.queue.push(analyticsEvent);
    
    // Flush if queue is full
    if (this.queue.length >= this.maxQueueSize) {
      this.flush();
    } else {
      // Schedule flush if not already scheduled
      if (!this.flushTimer) {
        this.flushTimer = setTimeout(() => {
          this.flush();
        }, this.flushIntervalMs);
      }
    }

    // Console log for development
    if (import.meta.env.DEV) {
      console.log('Analytics:', event, payload);
    }
  }

  private async flush(synchronous = false): Promise<void> {
    if (this.queue.length === 0) return;

    const eventsToSend = this.queue.splice(0, this.batchSize);
    
    if (this.flushTimer) {
      clearTimeout(this.flushTimer);
      this.flushTimer = null;
    }

    try {
      if (synchronous) {
        // Use sendBeacon for synchronous sending (more reliable on page unload)
        if (navigator.sendBeacon) {
          const data = JSON.stringify({ events: eventsToSend });
          navigator.sendBeacon('/api/analytics', data);
        }
      } else {
        // Regular fetch for asynchronous sending
        await this.sendEvents(eventsToSend);
      }
      
      console.log(\`Analytics: Flushed ${eventsToSend.length} events`);
    } catch (error) {
      console.error('Analytics: Failed to send events:', error);
      // Re-add events to front of queue for retry
      this.queue.unshift(...eventsToSend);
    }

    // Schedule next flush if queue still has items
    if (this.queue.length > 0 && !this.flushTimer) {
      this.flushTimer = setTimeout(() => {
        this.flush();
      }, this.flushIntervalMs);
    }
  }

  private async sendEvents(events: AnalyticsEvent[]): Promise<void> {
    // Check if we have a configured analytics endpoint
    const analyticsEndpoint = import.meta.env.VITE_ANALYTICS_ENDPOINT;
    
    if (!analyticsEndpoint) {
      // No analytics endpoint configured - just log to console in development
      if (import.meta.env.DEV) {
        console.log('Analytics: No endpoint configured, events:', events);
      }
      return;
    }

    const response = await fetch(analyticsEndpoint, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ events })
    });

    if (!response.ok) {
      throw new Error(\`Analytics API error: ${response.status}`);
    }
  }

  // Manual flush method for testing or immediate sending
  public async forceFlush(): Promise<void> {
    await this.flush();
  }

  // Get current queue size for monitoring
  public getQueueSize(): number {
    return this.queue.length;
  }
}

const analyticsQueue = new AnalyticsQueue();

/**
 * Tracks an application event.
 *
 * @param event - The name of the event (e.g., 'session_start', 'segment_play').
 * @param payload - An object containing event-specific data.
 */
export function track(event: string, payload: Record<string, any> = {}): void {
  analyticsQueue.add(event, payload);
}

/**
 * Tracks session-specific events with additional context
 */
export function trackSession(event: string, sessionData: Record<string, any>, additionalPayload: Record<string, any> = {}): void {
  track(event, {
    ...additionalPayload,
    session: sessionData,
    sessionType: 'hypnotherapy'
  });
}

/**
 * Tracks performance metrics
 */
export function trackPerformance(metric: string, value: number, unit: string = 'ms', additionalData: Record<string, any> = {}): void {
  track('performance_metric', {
    metric,
    value,
    unit,
    ...additionalData
  });
}

/**
 * Tracks errors with context
 */
export function trackError(error: Error, context: Record<string, any> = {}): void {
  track('error', {
    message: error.message,
    stack: error.stack,
    name: error.name,
    ...context
  });
}

/**
 * Force flush all pending events (useful for testing)
 */
export async function flushAnalytics(): Promise<void> {
  await analyticsQueue.forceFlush();
}

/**
 * Get analytics queue status
 */
export function getAnalyticsStatus(): {queueSize: number} {
  return {
    queueSize: analyticsQueue.getQueueSize()
  };
}