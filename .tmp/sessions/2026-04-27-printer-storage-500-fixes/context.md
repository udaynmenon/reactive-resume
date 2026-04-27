# Task Context: Fix Printer & Storage 500 Errors

Session ID: 2026-04-27-printer-storage-500-fixes
Created: 2026-04-27T00:00:00Z
Status: completed

## Current Request
User is experiencing 500 Internal Server Errors when:
1. Generating a PDF via `printer.printResumeAsPDF`
2. Uploading an image via `storage.uploadFile`

User has approved fixing the issues. They provided Dokploy env vars.

## Context Files (Standards to Follow)
- `.opencode/context/core/standards/code-quality.md`

## Reference Files
- `src/integrations/orpc/services/printer.ts`
- `src/integrations/orpc/services/storage.ts`
- `src/integrations/orpc/router/printer.ts`
- `src/integrations/orpc/router/storage.ts`
- `src/integrations/orpc/client.ts`
- `src/routes/api/rpc.$.ts`
- `src/routes/api/health.ts`

## External Docs
- None required

## Components
- Printer service (PDF generation via Puppeteer + Browserless)
- Storage service (S3/R2 fallback to local filesystem)
- Storage router (file upload/delete RPC endpoints)

## Changes Made
1. **Fixed `process.on("exit")` bug in `printer.ts`** - Replaced with `SIGTERM`/`SIGINT` handlers that properly allow async cleanup
2. **Added error handling in `storage.ts` router** - Wrapped handler in try/catch with descriptive `ORPCError` messages and server-side logging
3. **Added ACL fallback in `S3StorageService.write`** - Cloudflare R2 doesn't support `ACL: "public-read"`. Now retries without ACL when an ACL-related error is detected
4. **Added error handling in `processImageForUpload`** - Catches `sharp` import/processing failures with descriptive messages

## Constraints
- Must follow code-quality standards (pure functions, explicit error handling)
- Must not break existing functionality
- Must use `ORPCError` for RPC errors

## Exit Criteria
- [x] `process.on("exit")` bug fixed
- [x] Storage router has descriptive error handling
- [x] `processImageForUpload` has better error handling
- [ ] `vp lint --type-aware` passes (tool not available in environment)
- [ ] `pnpm typecheck` passes (tool not available in environment)

## Notes
Without server logs, the root cause of the 500s cannot be confirmed with 100% certainty. The most likely culprit for both issues is R2 rejecting the `ACL: "public-read"` header (fix #3). The user should verify by checking server logs after deployment.
