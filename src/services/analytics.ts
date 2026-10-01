export type AnalyticsEvent =
  | 'app_open'
  | 'feed_viewed'
  | 'tournament_viewed'
  | 'tournament_created'
  | 'join_requested'
  | 'join_approved'
  | 'fixture_created'
  | 'score_posted'
  | 'paywall_viewed'
  | 'purchase_completed'
  | 'token_bundle_purchased'
  | 'entry_paid_with_tokens'
  | 'welcome_viewed'
  | 'welcome_find_tapped';

class AnalyticsService {
  logEvent(event: AnalyticsEvent, properties?: Record<string, any>): void {
    if (__DEV__) {
      console.log(`📊 [Analytics] ${event}`, properties || '');
    }
    // Ready for PostHog or Supabase analytics ingestion
  }
}

export const analytics = new AnalyticsService();
