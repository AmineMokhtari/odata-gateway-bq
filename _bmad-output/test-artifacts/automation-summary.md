---
stepsCompleted: ['step-01-preflight-and-context', 'step-02-identify-targets']
lastStep: 'step-02-identify-targets'
lastSaved: '2026-04-26'
inputDocuments:
  - backend/src/plugins/auth.ts
  - backend/src/middleware/auth/access-control.ts
  - backend/src/routes/v1/index.ts
  - backend/src/services/bq-executor.ts
  - _bmad-output/planning-artifacts/epics.md
  - _bmad-output/project-context.md
---

# Automation Summary - Epic 1: Identity & Trusted Access

## 🎯 Automation Targets

### Story 1.2: OIDC Token Interception & Validation
- **Scenario:** Valid token allows access, missing/invalid token returns 401.
- **Level:** API / Integration
- **Priority:** P0

### Story 1.3: Identity Extraction & Correlation ID
- **Scenario:** Extract `sub`, `email`, and `groups` from JWT. Generate unique `correlation_id` per request.
- **Level:** API / Integration
- **Priority:** P1

### Story 1.4: Rule-Based Authorization (Trusted Subsystem)
- **Scenario:** Allow access if user email OR group matches `tenants.yaml` rules.
- **Level:** API / Integration
- **Priority:** P0

### Story 1.4: Pipeline Audit Propagation
- **Scenario:** Verify that the extracted identity and correlation ID reach the BigQuery Job Labels and Usage Tracker.
- **Level:** Integration
- **Priority:** P0

## 🧪 Coverage Plan

| Target Scenario | Level | Priority | File |
| :--- | :--- | :--- | :--- |
| **End-to-End Identity & Authz** | Integration | P0 | `backend/test/routes/v1-authz-audit.test.ts` |
| **Rule Engine (Emails/Groups)** | Unit | P1 | `backend/test/middleware/access-control.test.ts` (Existing) |
| **Token Verification & Discovery** | Unit/API | P1 | `backend/test/plugins/auth.test.ts` (Existing) |

## 🏗️ Technical Approach
- **Mocking:** Mock `jose` for token generation and `bigquery` for job creation.
- **Verification:** Assert on `app.inject` response codes and verify mock calls receive the expected `labels`.
- **Statelessness:** Ensure no cross-test pollution in the `metadataCache`.

**Proceeding to test generation...**
