# Story 4.5: Mobile-First Responsive Connection Guide

Status: ready-for-dev

## Story

As a User on the go,
I want to view my connection details and read the setup guide on my phone,
so that I can prepare my reporting tasks during my commute.

## Acceptance Criteria

1. **Mobile-First Layout:** The portal MUST be fully responsive. On mobile devices (< 768px), the navigation MUST collapse into a hamburger menu, and connection cards/sections MUST become full-width. [Source: Story 4.5 in epics.md]
2. **Sticky Action Bar:** The primary "Copy URL" action MUST remain accessible via a sticky bottom-action bar on mobile devices. [Source: Story 4.5 in epics.md]
3. **Accessibility (WCAG AA):** The implementation MUST target WCAG Level AA compliance.
    - All typography MUST meet minimum contrast ratios (4.5:1).
    - All interactive elements MUST have descriptive `aria-labels`.
    - Full keyboard navigation support (focus rings, logical tab order). [Source: UX-DR8]
4. **Touch Target Size:** All interactive touch targets (buttons, links, menu items) MUST meet the minimum size of 44x44px. [Source: Story 4.5 in epics.md]
5. **Clean Dataset Navigation:** Provide a clear, optimized navigation for authorized datasets that works seamlessly across all screen sizes (Mobile, Tablet, Desktop). [Source: User prompt]
6. **60s TTV Alignment:** The mobile experience MUST prioritize the "Copy OData URL" workflow to ensure users can reach their first successful connection in < 60s even on small screens. [Source: project-context.md]

## Tasks / Subtasks

- [ ] Implement Responsive Layout & Navigation (AC: #1, #5, #6)
  - [ ] Update `frontend/src/components/Navigation.tsx` to include a mobile hamburger menu.
  - [ ] Refactor main layout to use a mobile-first grid/flex container.
- [ ] Implement Sticky Bottom-Action Bar (AC: #2, #6)
  - [ ] Create `frontend/src/components/MobileActionBar.tsx`.
  - [ ] Ensure it only displays on mobile viewports and contains the primary OData URL copy action.
- [ ] Enhance Accessibility & Touch Targets (AC: #3, #4)
  - [ ] Audit and update all interactive components to use 44x44px minimum sizing.
  - [ ] Add missing `aria-labels` and ensure focus states are clearly visible.
  - [ ] Validate contrast ratios for all UI elements.
- [ ] Verify with Tests
  - [ ] Add responsiveness tests using Playwright or Vitest (simulating different viewports).
  - [ ] Run `axe-core` accessibility audit on the connection guide page.

## Dev Notes

- **Pattern:** Follow a **Mobile-First strategy** using Tailwind CSS. Write base styles for mobile (unprefixed) and use responsive prefixes (`md:`, `lg:`) exclusively to layer on desktop enhancements.
- **Components:** Utilize **Shadcn/UI** `Sheet` or `Drawer` for the mobile navigation menu.
- **Accessibility:** Use **Radix UI** primitives as they provide robust accessibility defaults. Ensure high-contrast colors and visible focus rings.
- **Constraints:** Next.js 15+ App Router, strictly functional components with TypeScript.

### Project Structure Notes

- Frontend logic resides in `frontend/src/`.
- Interactive components in `frontend/src/components/`.

### References

- [Source: _bmad-output/planning-artifacts/epics.md#Epic 4]
- [Source: _bmad-output/project-context.md#Framework-Specific Rules]

## Dev Agent Record

### Agent Model Used

gemini-2.0-flash-thinking-exp-1219 (via Gemini CLI)

### Debug Log References

### Completion Notes List

### File List

