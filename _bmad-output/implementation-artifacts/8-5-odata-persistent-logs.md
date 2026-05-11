# Story 8.5: Persistent Audit Logs (BigQuery Storage API)

Status: done

## Story

As a **Governance Officer (Elena)**,
I want to **store all API usage and access events in BigQuery**,
so that I can **maintain a long-term audit trail for compliance and billing transparency**.

## Acceptance Criteria

1. **Persistent Storage**: Usage logs and access pulses must be stored in a central BigQuery table.
2. **BigQuery Storage Write API**: Use the high-throughput Write API to stream logs into the table.
3. **Audit History**: All relevant metadata (user email, correlation ID, action, bytes) must be captured.
4. **Resilience**: The system should gracefully handle failures in log writing without breaking the data streaming.

## Tasks / Subtasks

- [x] **Backend: Update Dependencies**
  - [x] Add `@google-cloud/bigquery-storage` to `package.json`.
- [x] **Backend: Implement Storage Service**
  - [x] Create `bq-storage.ts` using `BigQueryWriteClient`.
  - [x] Define `AuditEvent` interface with user and correlation metadata.
- [x] **Backend: Update Usage Tracker**
  - [x] Refactor `usage-tracker.ts` to call the storage service for every event.
  - [x] Pass `userEmail` and `correlationId` from routes to the tracker.
- [x] **Verification**
  - [x] Verify that log events are triggered on data fetch and metadata discovery.
  - [x] Verify that persistent logs include correct byte counts and user identities.

## Dev Notes

- **BigQuery Storage API**: Using the gRPC-based Write API for near real-time streaming of audit logs.
- **Metadata Context**: Captured `userEmail` (from OIDC) and `correlationId` (from Fastify request ID) for full end-to-end traceability.

## Dev Agent Record

### Agent Model Used

Antigravity (Claude 3.5 Sonnet)

### Completion Notes List
- [x] Integrated BigQuery Storage Write API.
- [x] Enhanced usage tracker with identity context.
- [x] Updated route handlers to push audit events.

