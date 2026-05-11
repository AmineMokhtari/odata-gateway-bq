## Deferred from: code review of 1-1-project-initialization-fastify-bootstrap (2026-04-23)
- [x] **Global App Options Leakage [src/app.ts:28-40]:** Fixed by isolating options per AutoLoad call (2026-04-25).

## Deferred from: code review of story-1.3 (2026-04-24) (CANCELLED)
- [x] ~~[Review][Defer] NFR Violation: Lack of Caching [src/plugins/auth.ts:114] — Handshake overhead likely exceeds 500ms due to sequential STS/IAM calls. Handled in Story 1.4.~~ (CANCELLED - Impersonation mode removed)
- [x] ~~[Review][Defer] GCP API Quota Risk [src/middleware/auth/silent-handshake.ts] — High risk of hitting generateAccessToken quotas without caching. Handled in Story 1.4.~~ (CANCELLED - Impersonation mode removed)

## Deferred from: code review of 6-2-visual-join-builder-expand.md (2026-04-26)
- Missing Nested Selection Implementation: AC4 (Stretch) was not implemented in the initial pass of the Visual Join Builder.

## Deferred from: code review of 8-2-nested-column-selection-expand-select.md (2026-04-26)
- **No handling for 1:N expansions**: Current implementation uses `LIMIT 1` for expanded entities. This works for 1:1 and N:1 relationships but truncates data for 1:N. Supporting 1:N requires `ARRAY_AGG(STRUCT(...))` and updating the frontend to handle nested arrays.

