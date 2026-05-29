---
project_name: 'odata-gateway-bq'
user_name: 'Amine_mokhtari'
date: '2026-04-25'
sections_completed:
  - technology_stack
  - language_rules
  - framework_rules
  - testing_rules
  - quality_rules
  - workflow_rules
  - anti_patterns
status: 'complete'
rule_count: 47
optimized_for_llm: true
---

# Project Context for AI Agents

_This file contains critical rules and patterns that AI agents must follow when implementing code in this project. Focus on unobvious details that agents might otherwise miss._

---

## Technology Stack & Versions

- **Runtime:** Node.js 22.x (LTS)
- **Framework:** Fastify v5.0.0 (Asynchronous, performance-oriented)
- **Frontend:** React / Next.js 15+ (App Router)
- **Styling:** Tailwind CSS & Shadcn/UI (Radix UI)
- **Language:** TypeScript 5.9 (ESNext targets, NodeNext resolution, strict mode)
- **Primary SDK:** `@google-cloud/bigquery` v8.1.1
- **Auth/Identity:** `jose` v6.2.2 (OIDC verification)
- **OData Engine:** `odata-v4-sql` v0.1.2
- **Caching:** `lru-cache` v11.3.5 (Sharded per tenant)
- **State Management:** `zustand` (Global frontend state)
- **Logging:** `pino` (structured logs)
- **Icons:** Lucide-React
- **Direct Connection Formats:** Office Data Connection (`.odc`), Power BI Data Source (`.pbids`)

## Critical Implementation Rules

### Language-Specific Rules (TypeScript & React)

- **Configuration:** Project MUST use strict mode and ESM. NodeNext resolution is mandatory in `backend` tsconfig.
- **Import/Export:** Use explicit `.js` extensions for backend local imports. Prefer named exports over defaults for better refactorability.
- **React Components:** Use functional components with explicit `interface` or `type` for Props. Avoid `any` rigorously.
- **Next.js Pattern:** Strictly utilize **App Router** conventions. Default to **Server Components** for page layouts and SEO-critical content; use **Client Components** (`'use client'`) only for interactive elements like the OData URL Builder, Copy buttons, and direct export actions.
- **Error Handling:** Use Fastify's `sensible` patterns for backend errors and React **Error Boundaries** for frontend stability. Always provide OData V4 compliant error objects: `{ "error": { "code": "CodeName", "message": "human message" } }`.
- **Elena's Advice Pattern:** Backend 401/403 errors MUST be decorated with an `elena_tip` object containing a human-readable `message` and `quick_fixes` (actions like `SELECT_COLUMNS`). Frontend MUST reactively trigger the `ElenaDrawer` using Zustand state when these decorated errors are received.
- **Async Pattern:** Exclusively use `async/await`. Use the `pipeline` function from `node:stream/promises` for all BigQuery streaming operations.

### Framework-Specific Rules (Fastify & Next.js)

- **Plugin Isolation:** Backend core capabilities (Auth, BQ Client, Caching) MUST be registered as independent plugins using `fastify-plugin`.
- **The "Audit-Execute" Pipeline:** Mandatory request flow for all data paths: `Identify` -> `Authorize` -> `Translate` -> `Audit` -> `Execute/Stream`.
- **Stateless Compliance:** The entire system MUST remain stateless for Cloud Run. UI interactivity MUST use **long-polling** against usage/audit endpoints; persistent WebSockets or server-side sticky sessions are FORBIDDEN.
- **Next.js UI Patterns:** Use **Server Components** by default. Use **Client Components** only for the OData URL Builder, Copy/Export buttons, and Success Pulse animations.
- **OData Exports (ODC & PBIDS):** Direct OData export actions on the dataset description page MUST target the entire dataset's service root. For PBIDS exports, the feed URL MUST be nested inside the `address` object (i.e. `address: { url: url }`) to satisfy Power BI connection schema parser rules and prevent deserialization errors.
- **Visual Schema Indicators:** Dataset details tables MUST visually flag Primary Keys (PK, blue badge) and Foreign Keys (FK, violet badge with a detailed hover tooltip identifying its referenced target like `References Customers(id)`) to improve catalog discoverability.
- **Portal Routing:** All web portal routes MUST be prefixed with `/web/` (e.g., `/web/`, `/web/Catalog`, `/web/admin`). This MUST be enforced via `basePath: '/web'` in the Next.js configuration.
- **Styling Standards:** Use **Tailwind CSS** with the 8px spacing system and established "Trust" palette (Indigo-700, Emerald, Amber). Use **Shadcn/UI** (Radix UI) for all interactive primitives to ensure WCAG AA compliance.
- **Request Decoration:** Verified user identities and correlation IDs MUST be attached to the request object for BigQuery Job Labeling.
- **Secure Identity Propagation:** Sensitive environment variables (e.g., `DEFAULT_ANONYMOUS_USER_NAME`) MUST NOT use the `NEXT_PUBLIC_` prefix. They must be read in Server Components (like `RootLayout`) and passed as props to Client Components (`Navigation`) to maintain security boundaries.

### Testing Rules

- **Organization:** Mirror the `src/` directory in `test/`. Use `.test.ts` for backend and `.test.tsx` for frontend.
- **Backend Mandate:** Every new route MUST have an integration test verifying the full pipeline from OData input to streamed JSON. Verify that results are streamed and memory remains stable (< 256MB).
- **Frontend Mandate:** Every interactive UI component (URL Builder, Budget Gate) MUST have unit tests using **React Testing Library** and **Vitest**.
- **Accessibility Testing:** Integrate **axe-core** for automated WCAG AA compliance checks on all major UI layouts.
- **Mocking:** Prefer dependency injection (via options/props) over global patching. Mock BigQuery `Job` responses using representative multi-tenant result sets.
- **Coverage:** Target > 90% coverage using `c8` or `vitest coverage`.

### Code Quality & Style Rules

- **Naming Conventions:**
    - **Backend Files:** `backend/src/**/*.ts` (kebab-case.ts).
    - **Frontend Components:** `frontend/src/components/**/*.tsx` (PascalCase.tsx).
    - **Common Files:** `common/src/**/*.ts` (kebab-case.ts).
    - **Variables/Functions:** `camelCase`.
    - **OData Entities:** `PascalCase`.
    - **BQ Job Labels:** `snake_case` (e.g., `user_email`, `correlation_id`).
- **Organization:**
    - **Backend:** Logic in `backend/services/`, routing in `backend/routes/`.
    - **Frontend:** UI layouts in `frontend/src/app/`, components in `frontend/src/components/`.
    - **Common:** Shared types, utilities, and schemas in `common/src/`.
- **Logging:** 100% of logs must use `fastify.log` (pino) and MUST include the `correlationId` in the log object.
- **Semantic HTML:** Use appropriate semantic tags (`<nav>`, `<section>`, `<article>`, `<aside>`) for the Catalog Portal.

### Development Workflow Rules

- **Local Dev:** Use **Application Default Credentials (ADC)** for BigQuery access. Run the Fastify (port 3001) and Next.js (port 3000) dev servers concurrently using `npm run dev`.
- **Tenant Config:** `backend/config/tenants.yaml` is the single source of truth for all routing and budget policies.
- **Isolation Keys:** All service lookups (Auth, Metadata, BQ Client) MUST use the `projectId:datasetId` composite key.
- **UI Component Management:** Utilize the **Shadcn/UI** CLI for adding new interactive components to `frontend/src/components/ui/`.
- **Stateless Deployment:** The project is optimized for **Google Cloud Run**.

### Critical Don't-Miss Rules (Anti-Patterns & Edge Cases)

- **Anti-Pattern: Result Buffering:** NEVER buffer BigQuery results using `rows.push()` or `JSON.stringify()`. 100% of data MUST be streamed via `pipeline` to maintain the < 256MB memory footprint.
- **Anti-Pattern: Budget Bypass:** NEVER execute a data-fetch query without first performing a Dry-Run audit. Every byte streamed must be estimated against the `scan_budget_gb`.
- **The "No-Driver" Promise:** NEVER instruct the user to install a local driver (ODBC/JDBC) or configure a System DSN in the portal UI. The UX MUST focus exclusively on the native OData URL path.
- **60s Time-to-Value (TTV):** All implementation decisions for the Catalog Portal MUST support the goal of a < 60s window from landing page to active Excel connection.
- **Regional Chameleon Pattern:** BigQuery dataset residency MUST be verified before instantiating the client to avoid cross-region egress costs and residency violations.
- **Financial Leakage Protection:** Explicitly handle `ERR_STREAM_PREMATURE_CLOSE` by immediately issuing a cancellation signal to the active BigQuery Job ID.
- **Lossless Fidelity:** BigQuery `RECORD` (STRUCT) and `REPEATED` (ARRAY) types MUST be cast to JSON strings using `TO_JSON_STRING()` to ensure compatibility with Excel/Power BI cells.

---

## Usage Guidelines

**For AI Agents:**

- Read this file before implementing any code
- Follow ALL rules exactly as documented
- When in doubt, prefer the more restrictive option
- Update this file if new patterns emerge

**For Humans:**

- Keep this file lean and focused on agent needs
- Update when technology stack changes
- Review quarterly for outdated rules
- Remove rules that become obvious over time

Last Updated: 2026-05-29

