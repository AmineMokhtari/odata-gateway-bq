# Story 5.3: Master Service Account Execution

Status: done

## Story

As a System,
I want to fetch via master account in Trusted Subsystem mode,
so that I can proxy authorized users.

## Acceptance Criteria

1. **Given** a successfully authorized request (Story 5.2), **When** data is fetched, **Then** the System uses the BigQuery client instantiated with the gateway's own service identity (Master Service Account).
2. **And** the System does not attempt to perform impersonation or credential swapping for the data fetch.
3. **And** the System relies on GCP's Application Default Credentials (ADC) provided by the hosting environment (Cloud Run).
4. **And** the verified user's identity is correctly logged in BigQuery Job Labels (Story 4.4) for auditability.

## Tasks / Subtasks

- [x] Confirm Master Identity Usage
  - [x] Review `src/plugins/bq-client.ts` to ensure it uses default credentials.
- [x] Implement Verification Tests
  - [x] Create `test/plugins/bq-client.test.ts`.
  - [x] Verify that the `BigQuery` instance is created correctly.

## Dev Notes

- **Architecture Compliance:** Trusted Subsystem model (App-as-Proxy).
- **Security:** Reduces IAM management overhead by using a single, governed service account.
- **Source Tree:**
  - `src/plugins/bq-client.ts`

## Dev Agent Record

### Agent Model Used

gemini-2.0-flash-thinking-exp-1219 (via Gemini CLI)

