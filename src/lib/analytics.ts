type AnalyticsParams = Record<string, string | number | boolean | undefined>;

export function trackEvent(action: string, params: AnalyticsParams = {}) {
  if (typeof window === "undefined") return;
  const { gtag } = window as typeof window & {
    gtag?: (command: "event", action: string, params?: AnalyticsParams) => void;
  };

  if (!gtag) return;
  gtag("event", action, params);
}
