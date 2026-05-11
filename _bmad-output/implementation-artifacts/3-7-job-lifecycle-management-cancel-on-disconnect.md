# Story 4.5: Job Lifecycle Management

Status: done

## Story

As a System,
I want to cancel BQ jobs if the user cancels,
so that I eliminate zombie costs.

## Acceptance Criteria

1. **Given** an active BigQuery query job, **When** the client closes the HTTPS connection (e.g., user hits 'Stop' in Power BI or closes Excel), **Then** the System immediately detects the disconnect.
2. **And** the System issues a `job.cancel()` command to BigQuery for the specific job associated with that request.
3. **And** the cancellation event is logged with the job ID and correlation ID.
4. **And** zombie costs (queries continuing after client is gone) are eliminated.

## Tasks / Subtasks

- [ ] Implement Job Tracking in Execution Service
  - [ ] Update `createBigQueryStream` or the route handler to capture the `Job` object created by BigQuery.
- [ ] Implement Disconnect Listener
  - [ ] Update `src/routes/v1/index.ts`.
  - [ ] Use `request.raw.on('close', ...)` or Fastify's `onResponse` hook to detect premature disconnects.
- [ ] Implement Cancellation Logic
  - [ ] If the connection closes before the stream completes, call `job.cancel()`.
- [ ] Verify with Tests
  - [ ] Add a test case in `test/services/bq-executor.test.ts` or `test/routes/v1-data.test.ts` simulating a premature connection close and verifying the cancel call.

## Dev Notes

- **Architecture Compliance:** Eliminating zombie costs.
- **Node.js Event:** `request.raw.on('close', ...)` is the standard way to detect client disconnect in Fastify/Node.
- **BigQuery API:** The `job.cancel()` method is asynchronous but the gateway doesn't necessarily need to wait for its completion after client is gone.

## Dev Agent Record

### Agent Model Used

gemini-2.0-flash-thinking-exp-1219 (via Gemini CLI)

