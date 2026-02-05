/**
 * Lightweight GA4 event tracking utility
 *
 * GA4 Measurement ID는 index.html의 gtag config에서 설정.
 * 이 유틸리티는 앱 내에서 커스텀 이벤트를 보내는 래퍼.
 */

type GTagEvent = {
  action: string;
  category?: string;
  label?: string;
  value?: number;
  [key: string]: string | number | undefined;
};

function gtag(...args: unknown[]) {
  if (typeof window !== 'undefined' && (window as any).gtag) {
    (window as any).gtag(...args);
  }
}

/**
 * Track a custom event in GA4
 */
export function trackEvent({ action, category, label, value, ...rest }: GTagEvent) {
  gtag('event', action, {
    event_category: category,
    event_label: label,
    value,
    ...rest,
  });
}

// ── Pre-defined events ──

/** Landing page CTA button clicked */
export function trackCTAClick(variant: 'primary' | 'demo' | 'sign_in' | 'choice') {
  trackEvent({ action: 'cta_click', category: 'landing', label: variant });
}

/** User started a demo session (no auth) */
export function trackDemoStart() {
  trackEvent({ action: 'demo_start', category: 'engagement' });
}

/** User completed an exercise */
export function trackExerciseComplete(score: number, difficulty: string) {
  trackEvent({
    action: 'exercise_complete',
    category: 'engagement',
    label: difficulty,
    value: score,
  });
}

/** User signed up (Google OAuth) */
export function trackSignUp() {
  trackEvent({ action: 'sign_up', category: 'conversion', label: 'google_oauth' });
}

/** User navigated to a key page */
export function trackPageView(pageName: string) {
  trackEvent({ action: 'page_view', category: 'navigation', label: pageName });
}

/** User added a word to vocabulary */
export function trackVocabAdd() {
  trackEvent({ action: 'vocab_add', category: 'engagement' });
}

/** User started vocabulary review */
export function trackVocabReviewStart(mode: string) {
  trackEvent({ action: 'vocab_review_start', category: 'engagement', label: mode });
}
