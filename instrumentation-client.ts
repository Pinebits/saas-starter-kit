// instrumentation-client.ts

import * as Sentry from '@sentry/nextjs';

Sentry.init({
  dsn: process.env.NEXT_PUBLIC_SENTRY_DSN,
  tracesSampleRate: parseFloat(
    process.env.NEXT_PUBLIC_SENTRY_TRACE_SAMPLE_RATE ?? '0.0'
  ),
  debug: false,
});

// Export router transition hook as required by Sentry
export const onRouterTransitionStart = Sentry.captureRouterTransitionStart;