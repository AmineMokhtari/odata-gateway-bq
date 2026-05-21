# Story 13.1: Spatial Canvas Accessibility Hiding

Status: ready-for-dev

## Story

As a developer,
I want to hide the highly interactive, spatial 2D React Flow canvas from screen readers,
So that users who are visually impaired do not get disoriented by meaningless spatial coordinate readings.

## Acceptance Criteria

1. **Given** a rendered visual builder interface
2. **When** a screen reader traverses the page DOM
3. **Then** the primary React Flow `<div className="react-flow">` canvas container is strictly decorated with `aria-hidden="true"`, preventing screen readers from drilling into visual nodes or edge coordinates.
4. **And** a clear skip-link is provided at the top of the page allowing keyboard users to bypass the visual canvas entirely and jump directly to the **Query Summary Sidebar**.

## Tasks

- [ ] Task 1: Add `aria-hidden="true"` to the React Flow `<div className="react-flow">` canvas container or wrapper inside the visual ERD canvas component.
- [ ] Task 2: Implement a high-visibility skip-link component at the top of the dataset explorer view page.
- [ ] Task 3: Style the skip-link using GC MD3 compact tokens, hiding it off-screen by default and styling it to appear prominently upon keyboard focus (`:focus`).
- [ ] Task 4: Target the skip-link `href` anchor directly to the **Query Summary Sidebar** component element container (using its unique `id`).
- [ ] Task 5: Add automated unit/integration tests to verify the presence of the skip-link and `aria-hidden="true"` attributes on the visual container.
