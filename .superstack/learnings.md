# Project Learnings

> Managed by `/learn`. Append-only — latest entry wins on conflicts.

## Patterns

### use-pending-scanned-receipt-store-pattern
- **Insight:** Use zustand store with atomic consumePendingScannedReceipt() instead of module-level mutable variables to bridge scanned receipt data between screens
- **Confidence:** 9/10
- **Source:** opencode
- **Files:** stores/aiChatStore.ts, app/receipt-scanner.tsx, app/(ai-drawer)/ai-chat.tsx
- **Date:** 2026-05-25

### document-scanner-native-module
- **Insight:** For real-time document edge detection with perspective correction, use @dariyd/react-native-document-scanner (wraps Apple VisionKit on iOS, Google ML Kit on Android) instead of building custom camera UI with expo-camera
- **Confidence:** 8/10
- **Source:** opencode
- **Files:** app/receipt-scanner.tsx
- **Date:** 2026-05-25

## Pitfalls

### queued-message-image-loss
- **Insight:** When a message with image data is queued during AI streaming, the image field must be preserved on QueuedMessage type and processQueue must route it to sendImage() instead of silently converting to text-only analyzeMessage()
- **Confidence:** 9/10
- **Source:** opencode
- **Files:** stores/aiChatStore.ts, api/services/ai.service.ts
- **Date:** 2026-05-25

### receipt-scan-race-condition-backend
- **Insight:** Backend had a TOCTOU race on duplicate receipt scan inserts; fixed with UNIQUE constraint on (user_id, image_hash) rather than check-then-insert pattern
- **Confidence:** 9/10
- **Source:** opencode
- **Files:** backend/migrations/218_add_receipt_scans_unique_hash.up.sql
- **Date:** 2026-05-25

### truncated-base64-thumbnail
- **Insight:** Returning truncated base64 as a thumbnail fallback corrupts stored data; return nil instead and let the consumer handle missing thumbnails
- **Confidence:** 9/10
- **Source:** opencode
- **Files:** backend/handlers/investing/image_analysis_handler.go
- **Date:** 2026-05-25

## Preferences

### react-native vision-camera vs native-scanner
- **Insight:** Prefer @dariyd/react-native-document-scanner for document scanning over react-native-vision-camera because it wraps native OS document scanners (VisionKit/ML Kit) with built-in edge detection, perspective correction, and auto-capture — no frame processors needed
- **Confidence:** 8/10
- **Source:** opencode
- **Files:** app/receipt-scanner.tsx
- **Date:** 2026-05-25

## Architecture

### api-three-tier-pattern
- **Insight:** API layer follows Services → Hooks → Components pattern. New endpoints need: service method in api/services/, React Query hook in api/hooks/, query key in api/queryClient.ts
- **Confidence:** 10/10
- **Source:** opencode
- **Files:** api/services/, api/hooks/useAI.ts, api/queryClient.ts
- **Date:** 2026-05-25

## Tools

### receipt-scanning-debug
- **Insight:** To debug receipt scanning, check: (1) frontend camera capture produces base64, (2) pendingScannedReceipt is set in zustand store, (3) ai-chat consumes via consumePendingScannedReceipt, (4) analyzeImage sends to /v1/ai/chat/image, (5) backend handler parses base64 and calls GPT-4o vision
- **Confidence:** 9/10
- **Source:** opencode
- **Files:** app/receipt-scanner.tsx, stores/aiChatStore.ts, app/(ai-drawer)/ai-chat.tsx, api/services/ai.service.ts, backend/handlers/investing/image_analysis_handler.go
- **Date:** 2026-05-25
