# Application Bug Fixes

## 1. Sentry Configuration Updates

### Issues Addressed
1. Missing `onRequestError` hook in instrumentation file:
   - Added the hook to the instrumentation file
   
2. Deprecated configuration files:
   - Created recommended instrumentation files (`instrumentation-client.ts` and `instrumentation-server.ts`)
   
3. Missing router transition hook:
   - Added `onRouterTransitionStart` hook to instrumentation-client.ts

### Changes Made
```javascript
// Added to instrumentation-client.ts
export const onRouterTransitionStart = Sentry.captureRouterTransitionStart;
```

## 2. Duplicate Pages Resolution

### Issues Addressed
1. Duplicate page routes:
   - `/admin` (index.js and index.tsx)
   - `/admin/tenants/new` (new.js and new.tsx)
   - `/api/admin/users` (users.ts and users/index.js)

### Files Removed
- `pages\admin\index.js`
- `pages\admin\tenants\new.js`
- `pages\api\admin\users.ts`

### Verification
- Created and ran `scripts/fix-duplicate-pages.js` to verify and fix any remaining duplicate files

## Additional Steps to Try
If Next.js is still detecting duplicate pages after removing the files, try:

1. Clear the Next.js cache:
   ```bash
   npm run build -- --no-cache
   ```

2. Check for any files in the `.next` directory that might be causing issues:
   ```bash
   rm -rf .next
   npm run build
   ```

3. If using a development server, restart it completely:
   ```bash
   npm run dev
   ```