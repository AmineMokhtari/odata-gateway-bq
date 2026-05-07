---
story_id: "4.1"
story_key: "4-1-story-driven-hero-section-the-elena-narrative"
epic_id: "4"
status: "ready-for-dev"
last_updated: "2026-04-25"
---

# Story 4.1: Story-Driven Hero Section (The "Elena" Narrative)

## Story Foundation
**As a** Stranded Analyst (like Elena),
**I want** a landing page that validates my daily struggle with "SQL Tax" and manual exports,
**So that** I feel immediately understood and confident that this gateway is my path to autonomous data access.

### Acceptance Criteria
- [ ] **Hero Headline:** Display "Stop the SQL Tax. Unlock BigQuery for Excel in 15 Minutes." using bold `Inter` typography.
- [ ] **Empathetic Narrative:** Include the "Elena" journey copy: "Still waiting 48 hours for a CSV export? Meet the zero-driver bridge that puts petabyte-scale data directly into your spreadsheets."
- [ ] **Visual Trust Pipeline:** Include an illustrative "Safety-First Pipeline" graphic showing the 5-step process: `Identify` -> `Authorize` -> `Translate` -> `Audit` -> `Execute`.
- [ ] **Visual Foundation:** Use `Indigo-700 (#4338ca)` as the primary brand color and `Slate-50` for an airy background.
- [ ] **Call to Action (CTA):** A prominent "Deploy for Free" button (`Indigo-700`) and a secondary "Watch Elena's Story" link.
- [ ] **Responsive Design:** Hero section must use a split-pane layout on desktop (Story on left, visual on right) and collapse into a centered, benefit-first stack on mobile.
- [ ] **Accessibility:** All typography must meet WCAG AA contrast ratios (4.5:1 minimum).

## Developer Context
This is the **entry point** of our Data Marketplace. It must feel high-trust, technical, yet deeply accessible. We are building this inside the `src/app` directory of our unified codebase.

### Technical Requirements
- **Framework:** Next.js 15+ (App Router).
- **Component Type:** This section should be implemented as a **React Server Component** for maximum performance and SEO.
- **Styling:** Tailwind CSS. Use the 8px base unit spacing system.
- **Assets:** Use Lucide-React for trust-signaling icons.
- **Pipeline Visual:** Implement the Audit-Execute pipeline as a static or CSS-animated "Flow" component using Shadcn/UI primitives.

### Architecture Compliance
- **Statelessness:** Ensure no component in this story requires persistent server-side state.
- **Audit-Execute Pattern:** The UI visual must strictly mirror the backend pipeline steps defined in `project-context.md`.
- **Unified Style:** Adhere strictly to the "Visual Design Foundation" section of the UX Specification.

### File Structure
- **Page:** `src/app/page.tsx`.
- **Component:** `src/components/marketing/hero-section.tsx`.
- **Pipeline Component:** `src/components/marketing/trust-pipeline.tsx`.
- **UI Base:** Utilize Shadcn/UI components in `src/components/ui/`.

## Testing Requirements
- **Unit Test:** `test/components/hero-section.test.tsx` using Vitest and React Testing Library.
- **Accessibility:** Run an automated `axe-core` check to verify WCAG AA compliance.
- **Responsive Check:** Verify layout integrity at 375px (Mobile), 768px (Tablet), and 1440px (Desktop).

## Project Context Reference
- **No-Driver Promise:** Never mention local driver installation in this hero section.
- **Colors:** Indigo-700 (Primary), Slate-900 (Secondary/Text), Slate-50 (BG).

---
**Status:** ready-for-dev
**Note:** Ultimate context engine analysis completed - validated with Audit-Execute pipeline visual enhancement.
