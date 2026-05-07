# Story 4.3: 4-3-live-connection-success-pulse-badge

Status: ready-for-dev

## Story

As an Analyst,
I want real-time feedback on the website when my Excel connection is successful,
so that I have confidence the gateway is working before I start building my report.

## Acceptance Criteria

1. Implement a **Success Pulse Badge** component in Next.js using **Shadcn/UI** primitives and **Lucide-React** icons.
2. The component must support three visual states:
   - **Listening (Amber):** Initial state, indicating the portal is waiting for an external connection (Excel/Power BI).
   - **Verifying (Indigo Pulse):** Intermediate state when activity is detected but not yet confirmed.
   - **Connected (Emerald):** Final state, indicating a successful connection has been verified for the current user.
3. Use **long-polling** (5-10 second interval) against the backend status/audit endpoints to maintain Cloud Run's statelessness. **WebSockets are FORBIDDEN.**
4. The backend detection logic must trigger when the gateway receives a metadata discovery call (`/$metadata`) or data fetch from the verified identity of the current portal user.
5. Use **Framer Motion** for a "ripple" or "heartbeat" pulse animation in the "Connected" state.
6. Display a "Connection Verified" message with a relative timestamp (e.g., "Connected 2m ago").
7. The component must be responsive and follow the WCAG Level AA accessibility standards (contrast and aria-labels).

## Tasks / Subtasks

- [ ] **Backend: Connection Tracking Enhancement** (AC: 4)
  - [ ] Update `backend/src/plugins/usage-tracker.ts` to support per-user "Last Active" timestamps or add a dedicated `connection-tracker` plugin.
  - [ ] Instrument `backend/src/routes/v1/index.ts` (especially `/$metadata` and data fetch routes) to record user-specific connection pulses.
  - [ ] Create a new lightweight endpoint `GET /v1/connection-status/:projectId/:datasetId` that returns the connection state for the authenticated user.
- [ ] **Frontend: Success Pulse Component** (AC: 1, 2, 5)
  - [ ] Create `frontend/src/components/SuccessPulseBadge.tsx`.
  - [ ] Implement visual states using Tailwind classes and Shadcn/UI `Badge` or `Card`.
  - [ ] Add Framer Motion pulse animation for the "Connected" state.
- [ ] **Frontend: Long-Polling Logic** (AC: 3, 6)
  - [ ] Implement a custom hook `useConnectionStatus` or use `SWR`/`React Query` with a fixed polling interval.
  - [ ] Connect the polling logic to the new backend status endpoint.
  - [ ] Handle error states and session expiry gracefully.
- [ ] **Validation & Accessibility** (AC: 7)
  - [ ] Verify WCAG AA contrast for Amber/Emerald states.
  - [ ] Add unit tests for component state transitions.

## Dev Notes

- **Statelessness:** Cloud Run can terminate idle connections. Long-polling ensures UI updates without persistent state.
- **Identity Matching:** Ensure the `user.email` or `user.sub` from the OIDC token is used to correlate Portal session with OData client requests.
- **Source Tree:** 
  - Backend Logic: `backend/src/plugins/usage-tracker.ts`, `backend/src/routes/v1/index.ts`.
  - Frontend UI: `frontend/src/components/`, `frontend/src/app/`.

### Project Structure Notes

- **Naming:** Follow `PascalCase.tsx` for React components and `kebab-case.ts` for backend files.
- **Styles:** Use the "Trust" palette: `bg-amber-500` (Listening), `bg-emerald-500` (Connected).

### References

- [Source: _bmad-output/planning-artifacts/epics.md#Epic 4]
- [Source: _bmad-output/project-context.md#Critical Implementation Rules]
- [Source: backend/src/routes/v1/index.ts#OData $metadata]

## Dev Agent Record

### Agent Model Used

Gemini 2.0 Flash (CLI Agent)

### Debug Log References

- Verified `usage-tracker.ts` implementation.
- Verified `v1/index.ts` route structure.

### Completion Notes List

- Story initialized with detailed technical guardrails for long-polling and animation.
- Identified the need for a user-scoped connection status endpoint.
