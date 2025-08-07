# Sentry Configuration Updates

## Summary
Updated Sentry configuration to address errors when starting the solution. The changes made are in line with the latest Sentry/NextJS integration recommendations.

## Issues Addressed
1. Missing `onRequestError` hook in instrumentation file:
   - Error: `[@sentry/nextjs] Could not find 'onRequestError' hook in instrumentation file`
   - Solution: Added the hook to the instrumentation file

2. Deprecated configuration files:
   - Warning: `[@sentry/nextjs] DEPRECATION WARNING: It is recommended renaming your 'sentry.client.config.ts' file, or moving its content to 'instrumentation-client.ts'`
   - Solution: Created recommended instrumentation files

## Changes Made

1. Updated `instrumentation.ts` to include the required `onRequestError` hook:
   ```typescript
   export function onRequestError({ error, request }) {
     Sentry.captureRequestError(error, request);
   }
   ```

2. Created Next.js recommended instrumentation files:
   - Created `instrumentation-client.ts` (replacing `sentry.client.config.ts`)
   - Created `instrumentation-server.ts` (replacing `sentry.server.config.ts`)

3. Updated `next.config.js`:
   - Added a `sentry` configuration section to properly handle the instrumentation files
   ```javascript
   sentry: {
     // Use new instrumentation files instead of legacy config files
     hideSourceMaps: true,
   }
   ```

## Benefits
- Compatibility with Turbopack
- Following the latest Next.js file conventions
- Proper error capturing for server-side errors

## Testing
After these changes, the solution should start without the previous Sentry-related errors or deprecation warnings.