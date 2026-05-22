---
stepsCompleted: ['step-01-validate-prerequisites', 'step-02-design-epics', 'step-03-create-stories', 'step-04-final-validation']
inputDocuments: ['_bmad-output/planning-artifacts/prd.md', '_bmad-output/planning-artifacts/architecture.md', '_bmad-output/planning-artifacts/ux-design-specification.md']
---

# OData Gateway - Visual Query Builder - Epic Breakdown

## Overview

This document provides the complete epic and story breakdown for the **OData Gateway Visual Query Builder** component of `odata-gateway-bq`. It decomposes the highly specific graph rendering, state management, BigQuery nested array generation, accessibility, performance, and telemetry requirements into independent, value-focused epics and stories.

## Requirements Inventory

### Functional Requirements

- **FR27**: The System shall render an interactive Entity Relationship Diagram (ERD) on the dataset detail page by parsing the explicit `relationships.json` manifest to visualize 1:N foreign key constraints. The visualization must strictly adhere to the user's authorization context; tables and relationships the user is not authorized to query must be dynamically suppressed from the ERD.
- **FR28**: The System's 24h periodic schema refresh must validate the explicit `relationships.json` manifest against the actual BigQuery schemas. Any relationships referencing missing tables or columns must be automatically pruned from the ERD and flagged in the logs.

### NonFunctional Requirements

- **NFR4 (Performance)**: ERD Rendering & Scalable Fallback - The Catalog UI shall render full interactive ERDs for datasets under 50 tables and 100 relationships in under 3 seconds. For datasets exceeding either limit, the system shall not render the full graph; instead, it must default to a **"Neighborhood View,"** requiring the user to select a root table to visualize only its 1st-degree foreign key relationships.
- **NFR5 (Performance)**: Metadata Decoupling - Data required for the interactive ERD must be fetched asynchronously via a dedicated endpoint or Server Action. It must **not** be bundled into the core OData V4 `$metadata` payload to preserve the < 2s discovery SLA for Excel/PowerBI.

### Additional Requirements (Architecture & UX Specs)

- **ARCH-V1 (Graph Canvas)**: Use React Flow (v11+) + Dagre layout offloaded to a Web Worker (`dagre-layout.worker.ts`) to prevent blocking the React main thread. Node pinning during lazy re-fetches to prevent jarring jumps.
- **ARCH-V2 (Zustand Store)**: Strict visual vs logical state separation (`visual_nodes` transient state restricted to 200 nodes via LRU pruning; `selected_paths` durable query state). Logical state serialized to the URL for sharing/resilience.
- **ARCH-V3 (BigQuery Array Subqueries)**: SQL generator must translate `$expand` clauses into native BigQuery `ARRAY(SELECT AS STRUCT ...)` queries to prevent Cartesian product explosions and ensure accurate dry-runs.
- **ARCH-V4 (Network Resilience)**: Dedicated backend `/v1/metadata/neighborhood` endpoint with 5-second `AbortSignal` client timeouts.
- **ARCH-V5 (Schema Security)**: `schema_version` hash validation in responses. Mismatches trigger a safe UI reset and a clear Toast notification. Dynamic pruning of shared URLs containing unauthorized tables via 403 interception and Elena Tips guidance.
- **ARCH-V6 (Accessibility)**: Spatial canvas `aria-hidden="true"`. Screen reader focus routed to the Query Summary Sidebar serving as a fully functional `aria-live` interactive query builder. Semantic CSS variables used for node branding and WCAG contrast.
- **ARCH-V7 (QA & Telemetry)**: Playwright E2E fixtures with mocked 403s and hash mismatches. Custom nodes decorated with `data-testid`. React Flow wrapped in Error Boundary that scrubs Zustand state of PII and batches telemetry via `navigator.sendBeacon`.

---

## Epic List

### Epic 10: Interactive Schema Explorer (ERD)
**Goal:** Business users can visually explore complex dataset schemas and 1:N relationships on an interactive React Flow canvas with automatic layout and lazy-loading support, allowing them to easily understand data schemas without waiting for SQL documentation.
**FRs & Architecture Covered:** FR27 (Partially - ERD rendering), NFR5 (Metadata Decoupling), ARCH-V1 (Canvas & Layout Worker), ARCH-V4 (Neighborhood Endpoint).

### Epic 11: Visual OData Query Generation ($expand)
**Goal:** Users can select tables and relationships on the ERD canvas to automatically generate complex OData URLs with `$expand` parameters and download one-click connection files, bypassing manual URL construction.
**FRs & Architecture Covered:** FR27 (Query selection), ARCH-V2 (Zustand Visual/Logical Separation & URL Serialization).

### Epic 12: High-Performance Cost & Security Guardrails
**Goal:** The system enforces pristine visual performance on huge datasets, protects budgets by translating visual joins to BigQuery Native Arrays, and dynamically secures the UI from schema drift and unauthorized access.
**FRs & Architecture Covered:** FR28 (Schema refresh validation), NFR4 (Scalable Fallback / Neighborhood View), ARCH-V3 (BigQuery Array Subqueries), ARCH-V5 (Schema Security / Permission Pruning).

### Epic 13: Accessible & Inclusive Interaction
**Goal:** All users, including those relying on screen readers or keyboard navigation, can fully navigate, understand, and build complex queries using the visual catalog via an accessible sidebar alternative and standard keyboard focus patterns.
**FRs & Architecture Covered:** ARCH-V6 (Accessibility routing & standard focus).

### Epic 14: Diagnostics, Observability & Hardening
**Goal:** Operators and developers have full visibility into client-side graph failures and user interactions via batched, PII-scrubbed telemetry, robust error boundaries, and Playwright automated tests.
**FRs & Architecture Covered:** ARCH-V7 (PII-scrubbed Error Boundary, Telemetry beacon, E2E fixtures).

---

### FR Coverage Map

- **FR27 (ERD and dynamic suppression)**:
  - Epic 10: Basic ERD rendering from cached metadata.
  - Epic 11: Visual selection of nodes/edges for query generation.
  - Epic 12: Dynamic suppression of unauthorized tables/relationships based on user context.
- **FR28 (Periodic refresh validation)**:
  - Epic 12: 24h cron schema validation pruning missing relationships.
- **NFR4 (Neighborhood fallback)**:
  - Epic 12: Automated threshold enforcement (> 50 tables/100 edges triggers Neighborhood View).
- **NFR5 (Metadata decoupling)**:
  - Epic 10: Asynchronous fetching of graph metadata, keeping it separate from core `$metadata`.
- **ARCH-V1 (Dagre Worker & Pinning)**:
  - Epic 10: Web worker offloading and layout pinning.
- **ARCH-V2 (Zustand state & URL Serialization)**:
  - Epic 11: Zustand graph state, visual vs logical separation, and query-string URL persistence.
- **ARCH-V3 (BQ Array Subqueries)**:
  - Epic 12: Fastify SQL translator rewriting joins into BQ nested array subqueries.
- **ARCH-V4 (Network timeouts)**:
  - Epic 10: 5s fetch abort client wrapper.
- **ARCH-V5 (Hash validation & URL pruning)**:
  - Epic 12: `schema_version` mismatch triggers and 403 shared URL auto-pruning.
- **ARCH-V6 (Accessibility & Theming)**:
  - Epic 13: Screen-reader sidebar focus, `aria-live` announcements, keyboard navigation, and semantic CSS contrast.
- **ARCH-V7 (E2E, Error boundaries & Telemetry)**:
  - Epic 14: Playwright E2E tests, PII-scrubbing Error boundary, and `sendBeacon` telemetry metrics.

---

## Epic 10: Interactive Schema Explorer (ERD)

Goal: Business users can visually explore complex dataset schemas and 1:N relationships on an interactive React Flow canvas with automatic layout and lazy-loading support, allowing them to easily understand data schemas without waiting for SQL documentation.

### Story 10.1: Backend Graph Introspection (Neighborhood API)

As a backend developer,
I want a secure, lightweight endpoint that returns 1st-degree foreign key relationships for a specified root table by parsing `relationships.json`,
So that the frontend can lazy-load the schema dynamically without transferring massive, monolithic metadata payloads.

**Acceptance Criteria:**

**Given** an authorized user session for a dataset segment `/v1/:projectId/:datasetId`
**When** a `GET` request is made to `/v1/metadata/neighborhood?table=Customers`
**Then** the Fastify gateway returns a `200 OK` JSON response containing the table's fields (identifying partition/cluster keys) and its 1st-degree inbound/outbound relationships, limited to a maximum of 50 related nodes.
**And** the request does *not* trigger a BigQuery job (is evaluated directly against the cached `relationships.json` manifest) and emits a standard application-level audit log recording the user's identity.
**And** a 400 Bad Request is returned if the `table` query parameter is missing, and 404 is returned if the table does not exist in the schema.

### Story 10.2: Interactive Canvas Scaffolding with React Flow

As an explorer,
I want to see an interactive 2D canvas displaying table nodes and relationship edges for my current dataset,
So that I can visually inspect the metadata structure.

**Acceptance Criteria:**

**Given** the Next.js `obq-hub` portal
**When** I navigate to a dataset detail page
**Then** a dedicated Next.js Server Action (`fetchNeighborhoodAction`) is triggered asynchronously to fetch the neighborhood metadata (preserving the <2s OData `$metadata` latency).
**And** a React Flow canvas is rendered containing nodes for the root table and its immediate relationships, styled strictly using Google Cloud MD3 compact tokens (Roboto typography, semantic borders, and high-visibility focus indicators).
**And** the canvas includes React Flow's native `<MiniMap>` and `<Controls>` widgets.

### Story 10.3: Asynchronous Layout Engine with Web Worker

As an explorer,
I want the visual graph to auto-layout without causing my browser screen to freeze,
So that my data exploration is fluid and uninterrupted.

**Acceptance Criteria:**

**Given** a rendering request for a schema graph on the React Flow canvas
**When** the layout is computed
**Then** the mathematically expensive `dagre` layout calculations are offloaded to a Web Worker (`dagre-layout.worker.ts`) via asynchronous message passing (`postMessage`).
**And** the UI thread is never blocked during calculation, preventing any frame drops or lag.
**And** the Web Worker returns calculated X/Y coordinates to the Zustand store (`useVisualQueryStore`) which triggers a single, batched React Flow node update.

### Story 10.4: Lazy Node Expansion & Pinning

As an explorer,
I want to expand any table node's 1st-degree relationships dynamically by clicking a handle,
So that I can browse relationships incrementally without causing the existing layout to jump around.

**Acceptance Criteria:**

**Given** an existing graph rendered on the React Flow canvas
**When** I click the "Expand" handles on a table node
**Then** the frontend makes an asynchronous fetch request with a strict 5-second `AbortSignal` timeout.
**And** upon a successful fetch, the new tables/edges are added to the canvas while the coordinates of all existing nodes are **pinned** in place, avoiding jarring layout shifts.
**And** if the network request exceeds 5 seconds, the request is gracefully aborted, the loading state is cancelled, and a Toast notification is shown to the user.

---

## Epic 11: Visual OData Query Generation ($expand)

Goal: Users can select tables and relationships on the ERD canvas to automatically generate complex OData URLs with `$expand` parameters and download one-click connection files, bypassing manual URL construction.

### Story 11.1: Zustand Graph Store Scaffolding

As a developer,
I want to implement the `useVisualQueryStore` Zustand store with strict separation between visual graph representation (`visual_nodes`) and logical query structure (`selected_paths`),
So that my query compilation logic is robust, decoupled from transient UI rendering details, and protected against memory leaks.

**Acceptance Criteria:**

**Given** a Zustand state store
**When** a table is visualised on the canvas, its state is added to the `visual_nodes` array (visual layer)
**Then** the visual state store enforces a maximum threshold of 200 nodes using a visual-only LRU pruning algorithm, silently fading out the oldest unselected nodes to protect browser memory.
**And** the visual LRU pruning algorithm does *not* modify the logical query path array (`selected_paths`), ensuring that query-building data remains fully intact even if nodes are visualised/hidden dynamically.

### Story 11.2: Visual Selection of Nodes and Edges

As an explorer,
I want to click table nodes and relationship edges on the canvas to toggle their selection,
So that I can build my OData projection and join paths.

**Acceptance Criteria:**

**Given** a rendered React Flow canvas
**When** I click a table node, its selection status is toggled, and the node's background color changes to Google Blue (`#1a73e8` active token) with a high-visibility 2px focus ring
**Then** the selected table is appended to the logical query store's `selected_paths` array as a `$select` projection.
**And** when I click a relationship edge between two selected nodes, the edge turns green, and it is added to `selected_paths` as a candidate for `$expand` translation.
**And** clicking "Clear Canvas" resets both `visual_nodes` and `selected_paths` states in a single atomic transaction.

### Story 11.3: Logical Query State Serialization (URL & Bookmarkable)

As an explorer,
I want my visual query selection to be serialized in real-time to the browser's URL search parameters,
So that my current work is never lost if my token expires, and I can share my visual builder state instantly via a copy-paste link.

**Acceptance Criteria:**

**Given** a user actively building a query in the `obq-hub` visual portal
**When** any changes are made to the logical state (`selected_paths`)
**Then** the query building state is debounced and serialized into a base64-encoded URL search parameter (e.g., `?q=eyJzZWxlY3RlZF9wYXRocyI6WyJjdXN0b21lcnMiXX0=`)
**And** when a user loads a URL with this query parameter, the Next.js page parses the parameter, hydrates the Zustand store's `selected_paths` state, and lazy-loads only the necessary neighborhood tables to reconstruct the visual graph layout without losing the user's progress.

### Story 11.4: OData URL Construction & Connection File Download

As a business analyst,
I want to see my compiled OData `$expand` URL updated in real-time in a Query Summary Sidebar and download one-click connection files,
So that I can instantly integrate the dataset with Excel or Power BI.

**Acceptance Criteria:**

**Given** a set of selected tables and edges in the visual query store
**When** a user expands the Query Summary Sidebar
**Then** the component compiles the logical state `selected_paths` into a standard OData V4 compliant URL with nested `$expand` and `$select` parameters (e.g., `/v1/myProject/myDataset/Customers?$select=Id,Name&$expand=Policies($select=PolicyNumber,Amount)`)
**And** the user can click a "Copy URL" button, copying the validated and properly escaped URL string to their clipboard.
**And** clicking "Download Excel Connection" compiles and downloads a standardized `.odc` connection file containing the active OData service endpoint and session routing headers.
**And** clicking "Download Power BI Connection" compiles and downloads a `.pbids` schema reference file.

---

## Epic 12: High-Performance Cost & Security Guardrails

Goal: The system enforces pristine visual performance on huge datasets, protects budgets by translating visual joins to BigQuery Native Arrays, and dynamically secures the UI from schema drift and unauthorized access.

### Story 12.1: Performance Threshold & Neighborhood Fallback

As a business user browsing a massive database,
I want the UI to automatically default to a single-table "Neighborhood View" instead of loading a monolithic ERD when the dataset exceeds 50 tables or 100 relationships,
So that my canvas loads in under 3 seconds and my browser remains perfectly responsive.

**Acceptance Criteria:**

**Given** a dataset detail page
**When** the page loads, a Next.js Server Action queries the dataset metrics.
**Then** if the table count is less than 50 and relationships are under 100, the React Flow canvas renders the full ERD.
**And** if either metric exceeds the threshold, the canvas remains empty, a prominent Search/Select input is displayed prompting the user to "Select a Root Table to Explore", and selecting a table triggers the asynchronous `fetchNeighborhoodAction` to load *only* its 1st-degree connections.

### Story 12.2: BigQuery Native Array SQL Generation ($expand)

As a cloud operations manager,
I want the gateway's OData-to-SQL translator to compile complex visual `$expand` relationships into BigQuery native `ARRAY(SELECT AS STRUCT ...)` nested queries,
So that queries run without triggering expensive, wasteful Cartesian product join operations in BigQuery.

**Acceptance Criteria:**

**Given** a visual query utilizing a multi-table `$expand` path (e.g., `Customers -> Policies -> Claims`)
**When** Fastify executes the OData-to-SQL translation
**Then** the SQL engine outputs a single parent query where child table relations are wrapped in correlated native nested array subqueries (`ARRAY(SELECT AS STRUCT ... FROM dataset.child WHERE child.foreign_key = parent.primary_key)`)
**And** the BigQuery Dry-Run auditor calculates the scan budget on this highly optimized query structure, returning a correct and minimal byte count.

### Story 12.3: Schema Drift & Hash Mismatch Recovery

As an explorer,
I want the visual canvas to detect if the BigQuery schema has changed during my session and safely reset my workspace,
So that I do not generate OData queries against obsolete columns or tables.

**Acceptance Criteria:**

**Given** a user actively exploring a canvas with a hydrated Zustand store
**When** a new lazy-load neighborhood fetch completes
**Then** the UI compares the backend response's `schema_version` hash with the store's cached `schema_version` hash.
**And** if a hash mismatch is detected, the canvas state is safely cleared, and a globally visible Toast notification is displayed: *"Schema update detected. Visual builder has been refreshed to reflect the latest changes."*

### Story 12.4: Dynamic Permission Suppression & Shared Link Pruning

As a user loading a shared query builder URL,
I want the canvas and query compiler to automatically prune any tables I do not have active IAM authorization to query,
So that I can safely collaborate without getting fatal access crashes or security violations.

**Acceptance Criteria:**

**Given** a shared URL containing serialized logical query paths (e.g., `Customers` and `Billing`)
**When** the frontend hydrates the Zustand store and issues the initial `/dry-run` pre-execution audit
**Then** if the backend returns a `403 Forbidden` (`Unauthorized` code) due to GCP IAM restrictions on a sub-table, the "Elena's Tips" engine intercepts the error.
**And** the UI automatically hides/prunes the unauthorized table nodes and their associated query paths from `selected_paths`.
**And** the Elena Tips Drawer automatically slides open to explain: *"Some tables from this shared query have been pruned as you do not have permission to access them. Click here to re-authorize with a clean, budget-safe subset."*

### Story 12.5: Periodic Schema Validation & Orphan Relationship Pruning

As an administrator,
I want the 24-hour periodic schema refresh cron task to validate our `relationships.json` manifest against the active BigQuery database,
So that any relationships referencing deleted tables or columns are pruned automatically before users encounter them.

**Acceptance Criteria:**

**Given** the 24-hour cron refresh routine
**When** it parses the explicit `relationships.json` manifest
**Then** it validates that every defined table, primary key, and foreign key actively exists in BigQuery's `INFORMATION_SCHEMA.COLUMNS` view.
**And** if a relationship references a missing table or column, it prunes the invalid relation from the manifest, updates the cache, and writes a warning log with the correlation ID detailing the pruned orphan.

---

## Epic 13: Accessible & Inclusive Interaction

Goal: All users, including those relying on screen readers or keyboard navigation, can fully navigate, understand, and build complex queries using the visual catalog via an accessible sidebar alternative and standard keyboard focus patterns.

### Story 13.1: Spatial Canvas Accessibility Hiding

As a developer,
I want to hide the highly interactive, spatial 2D React Flow canvas from screen readers,
So that users who are visually impaired do not get disoriented by meaningless spatial coordinate readings.

**Acceptance Criteria:**

**Given** a rendered visual builder interface
**When** a screen reader traverses the page DOM
**Then** the primary React Flow `<div className="react-flow">` canvas container is strictly decorated with `aria-hidden="true"`, preventing screen readers from drilling into visual nodes or edge coordinates.
**And** a clear skip-link is provided at the top of the page allowing keyboard users to bypass the visual canvas entirely and jump directly to the **Query Summary Sidebar**.

### Story 13.2: Accessible Query Summary Sidebar as Alternative Builder

As a visually impaired user,
I want the Query Summary Sidebar to serve as a fully functional, keyboard-accessible alternative query builder that announces updates audibly,
So that I have full functional parity with visual builders.

**Acceptance Criteria:**

**Given** a screen reader user on the dataset detail page
**When** they focus on the Query Summary Sidebar
**Then** they can add, remove, and project columns using standard, semantic `<select>` inputs and `<button>` elements (e.g., standard accessible buttons to add `$expand` paths).
**And** any changes to the logical query state (`selected_paths`) automatically trigger an `aria-live="polite"` announcement describing the active OData query change (e.g., *"OData Query updated: added Policies expansion"*).
**And** the compiled URL preview is announced clearly, ensuring that all elements are readable.

### Story 13.3: Keyboard Canvas Navigation and High-Visibility Focus

As a keyboard-only user,
I want to navigate all visual table nodes, handles, and canvas control widgets using standard keyboard navigation keys with a highly visible focus indicator,
So that I do not require a mouse to explore relationships.

**Acceptance Criteria:**

**Given** a keyboard user navigating the interactive ERD canvas
**When** they press the `Tab` key
**Then** focus moves systematically between the React Flow control widgets (Zoom In, Zoom Out, Fit View) and individual table nodes.
**And** the currently focused element displays a highly visible `outline: 2px solid #1a73e8` focus ring with an `outline-offset` of `2px` to ensure contrast compliance.
**And** pressing the `Enter` key on a table node's expansion handle triggers the lazy-neighborhood-fetch for that table.
**And** pressing `Space` or `Enter` on a focused table node selects it for the query.

### Story 13.4: Semantic WCAG High-Contrast Theming

As a low-vision or color-blind user,
I want all custom React Flow nodes, partition badges, and status colors to utilize semantic, WCAG-compliant CSS variables rather than hardcoded hex values,
So that elements remain clearly legible in both Light and Dark modes.

**Acceptance Criteria:**

**Given** a user exploring the ERD canvas
**When** they toggle between Light and Dark mode
**Then** the canvas grid background, custom nodes, handles, and connection edges automatically shift using Tailwind semantic CSS variables (e.g., `--bg-surface`, `--border-divider`).
**And** BigQuery partition and cluster badges utilize high-contrast background tokens (maintaining a minimum contrast ratio of 4.5:1 against the node background).
**And** the active selection state uses a high-contrast theme color that is clearly distinguishable without relying solely on red/green hues.

---

## Epic 14: Diagnostics, Observability & Hardening

Goal: Operators and developers have full visibility into client-side graph failures and user interactions via batched, PII-scrubbed telemetry, robust error boundaries, and Playwright automated tests.

### Story 14.1: PII-Scrubbed React Error Boundary

As an administrator,
I want unhandled visual canvas exceptions to be intercepted by a React Error Boundary that scrubs all proprietary database schema names before transmission,
So that we can diagnose visual crashes in production without leaking highly sensitive organizational data.

**Acceptance Criteria:**

**Given** an unhandled runtime error inside the `<InteractiveErd>` component (e.g., a React Flow render crash)
**When** the error triggers the React Error Boundary
**Then** the UI thread does not crash the entire browser window; instead, it renders a friendly, localized Google Cloud-style "Visualizer Offline" empty state.
**And** the boundary captures the exact Zustand state (`visual_nodes` and `selected_paths`) and passes it to a local scrubbing utility.
**And** the utility replaces all raw table names, field names, and OData paths with consistent SHA-256 hashes (e.g., `Customers` -> `7f2d...`), leaving only layout topology and coordinate data in the payload.
**And** the PII-scrubbed diagnostic payload is shipped to the backend error logging endpoint for debugging.

### Story 14.2: Asynchronous Batched Telemetry Beacon

As a developer,
I want visual builder interaction events to be queued and transmitted asynchronously using the browser's non-blocking `navigator.sendBeacon` API,
So that we gather accurate product usage metrics without degrading client rendering framerates.

**Acceptance Criteria:**

**Given** a user actively navigating the visual query builder canvas
**When** telemetry-producing events occur (e.g., table expanded, query selected, LRU node pruned)
**Then** the Zustand store appends the event details to an internal `event_queue` array.
**And** the store debounces and flushes the queued events in batches to Fastify's `/v1/telemetry` endpoint.
**And** the flush strictly utilizes `navigator.sendBeacon` (falling back to a fetch `keepalive: true` wrapper on modern browsers) to guarantee fire-and-forget transmission even if the user closes the tab immediately.
**And** the Fastify gateway logs the telemetry payload under a dedicated logger stream without blocking downstream API processing.

### Story 14.3: Playwright E2E Fixtures & Deterministic UI Mocking

As a QA engineer,
I want a suite of Playwright E2E tests with deterministic mock fixtures covering visual edge cases,
So that the visual builder remains completely stable and regression-free.

**Acceptance Criteria:**

**Given** a local automated testing environment
**When** Playwright executes our visual builder E2E test suite (`visual-builder.spec.ts`)
**Then** it mocks the OIDC session state and initializes mock server responses for the Neighborhood API.
**And** tests explicitly verify that custom nodes are identifiable using strict `data-testid` attributes (e.g., `data-testid="node-Customers"`), avoiding fragile coordinate-based clicks.
**And** mocked edge cases are tested, including:
  1. **Schema Mismatch:** Mocking a changed `schema_version` hash in a neighborhood payload verifies that the UI correctly resets and triggers the expected Toast notification.
  2. **Access Control (403):** Mocking a 403 authorization failure on a table verifies that the UI correctly suppresses it from the ERD and opens Elena's Tips Drawer.
  3. **Performance Fallback:** Mocking a massive dataset (>50 tables) verifies that the UI correctly fallbacks to "Neighborhood View" instead of drawing the full ERD.

---

## Epic 15: Playwright CLI Migration for Token Efficiency

**Goal:** Transition active developer browser automation to Microsoft's `@playwright/cli` to minimize token overhead via local disk accessibility tree snapshotting, retaining the existing regression suites for full system-level CI gates.

### Story 15.1: Local Session Caching & Git Boundary Setup

As a security engineer,
I want to establish local session serialization directories and configure git exclusion rules,
So that session assets can be safely cached without leaking OIDC tokens or corporate credentials.

**Acceptance Criteria:**
* **Given** a local monorepo workspace
* **When** git rules are evaluated
* **Then** the local folder path `playwright/.auth/` is strictly excluded in `.gitignore` to prevent committing JSON session snapshots.
* **And** a validation script confirms that temporary credentials or authorization cookies are never pushed to remote version control.

### Story 15.2: Playwright CLI Configuration & Ephemeral Launching

As a developer,
I want a centralized Playwright CLI configuration file governing headless launch contexts and output paths,
So that browser processes execute headlessly and generate lightweight, predictable outputs.

**Acceptance Criteria:**
* **Given** a root-level workspace environment
* **When** a configuration file is initialized
* **Then** the system creates a valid `.playwright/cli.config.json` defining the headless state, default 1280x800 viewport size, 30-second network timeouts, and local trace/screenshot storage paths.

### Story 15.3: Ephemeral Subprocess CLI Execution Runner

As an automation agent,
I want a custom Node execution script that wraps and executes `@playwright/cli` as a isolated subprocess,
So that browser control processes run without memory leaks, port collisions, or MCP server dependencies.

**Acceptance Criteria:**
* **Given** package.json scripting parameters
* **When** a developer or agent triggers `npm run test:agent`
* **Then** the script spawns a stateless `@playwright/cli` subprocess via stdio.
* **And** the execution handles inputs and outputs asynchronously, returning an exit code matching the test pass/fail state.

### Story 15.4: Flat YAML Accessibility Tree Extraction Pipeline

As an agentic model,
I want the E2E tool to generate flat YAML representations of the browser accessibility tree on disk during execution,
So that my context window consumption is minimized by 80% to 95% per action step.

**Acceptance Criteria:**
* **Given** a running browser session on the visual builder canvas
* **When** an action is executed or a page loads
* **Then** the test fixture serializes the accessibility tree using semantic roles and labels.
* **And** it writes a flat YAML file (`playwright/snapshots/active-tree.yaml`) to the local disk for prompt reference.

### Story 15.5: Unified Hybrid CI & Local Dev E2E Integration

As a QA engineer,
I want a unified testing framework that maintains the existing playwright runner for CI regression tests while using the new `@playwright/cli` pipeline for developer agent loops,
So that our regression safety gates remain fully intact without introducing operational overhead.

**Acceptance Criteria:**
* **Given** the monorepo E2E suite
* **When** tests are run in CI
* **Then** the runner invokes `npx playwright test` with full mock verification.
* **And** when run locally by an agent, the system defaults to `@playwright/cli` using local cached auth states.

