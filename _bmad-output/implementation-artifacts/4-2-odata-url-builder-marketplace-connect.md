# Story 4.2: OData URL Builder (Marketplace Connect)

Status: ready-for-dev

## Story

As an Analyst,
I want to easily generate my connection URL by selecting my project and dataset from dropdowns,
so that I can avoid manual typing errors when connecting Excel or Power BI.

## Acceptance Criteria

1. **Dataset Discovery:** The component must load the list of authorized datasets (Project/Dataset pairs) as defined in the system configuration (`tenants.yaml`).
2. **Interactive Selection:** Users can select a "Project" and then a "Dataset" from interactive dropdowns (Shadcn/UI Select).
3. **Dynamic URL Generation:** The UI must dynamically generate the valid OData V4 URL segment in real-time. The URL MUST NOT include the `/web/` portal prefix and should follow: `https://[GATEWAY_URL]/v1/{project_id}/{dataset_id}`.
4. **URL Preview:** The generated URL must be displayed in a read-only Shadcn/UI **Input** field to allow easy selection.
5. **One-Click Copy:** A "Copy URL" button must be present, using a Shadcn/UI Button with a Lucide `Copy` icon.
6. **Clipboard Integration:** Clicking "Copy" must copy the generated URL to the system clipboard.
7. **Success Feedback:** A Shadcn/UI Toast notification must confirm the successful copy.
8. **Visual Design:** The component must adhere to the project's visual foundation: **Indigo-700** primary color, airy **8px** spacing, and **Geist Mono** for the generated URL preview.
9. **Accessibility:** Must meet WCAG Level AA standards (aria-labels, keyboard navigation, focus states).

## Tasks / Subtasks

- [ ] **Infrastructure & Data Fetching** (AC: #1)
  - [ ] Implement a Next.js Server Action to fetch authorized tenants from `backend/config/tenants.yaml`.
  - [ ] Define shared types in `common/src/` for Tenant/Dataset objects if not already present.
- [ ] **UI Component Implementation** (AC: #2, #3, #4, #8)
  - [ ] Create `ODataUrlBuilder` component as a Client Component (`'use client'`).
  - [ ] Integrate Shadcn/UI `Select` and `Input` components.
  - [ ] Implement reactive state to handle selection and URL preview.
  - [ ] Style the URL preview using `Geist Mono` font.
- [ ] **Interactive Actions** (AC: #5, #6, #7)
  - [ ] Implement the Copy-to-Clipboard logic using the `navigator.clipboard` API.
  - [ ] Add the Shadcn/UI `Toast` provider and trigger a success message on copy.
- [ ] **Verification & Standards** (AC: #9)
  - [ ] Implement unit tests using Vitest and React Testing Library.
  - [ ] Verify WCAG AA compliance using `axe-core`.

## Dev Notes

- **Tech Stack:** Next.js 15 (App Router), Tailwind CSS, Shadcn/UI, Lucide-React.
- **Routing:** Since `basePath: '/web'` is enabled, the page is located at `src/app/marketplace/page.tsx` but served at `/web/marketplace`.
- **URL Base:** Use `NEXT_PUBLIC_GATEWAY_URL` for the base domain; ensure it points to the backend (e.g., port 3001) and does not include the `/web/` prefix.
- **Data Source:** Access `backend/config/tenants.yaml` directly from the Server Action via relative path `../../backend/config/tenants.yaml`.

### Project Structure Notes

- Component Location: `frontend/src/components/marketplace/ODataUrlBuilder.tsx`.
- Page Location: `frontend/src/app/marketplace/page.tsx`.
- UI Primitives: Use `npx shadcn@latest add select input button toast` to ensure latest versions.

### References

- [Source: _bmad-output/planning-artifacts/epics.md#Epic 4]
- [Source: _bmad-output/project-context.md#Framework-Specific Rules]
- [Source: backend/config/tenants.yaml]

## Dev Agent Record

### Agent Model Used
Gemini 2.0 Flash

### Debug Log References
N/A

### Completion Notes List
- Updated to include Shadcn/UI Input per user requirement.
- Corrected file path to respect `basePath: '/web'`.
- Clarified that generated URL must bypass `/web/` prefix for OData compatibility.

### File List
- `frontend/src/components/marketplace/ODataUrlBuilder.tsx` (New)
- `frontend/src/app/marketplace/page.tsx` (New)
- `common/src/types/tenant.ts` (Potential New/Modify)
