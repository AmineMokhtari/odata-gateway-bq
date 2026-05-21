# Story 13.2: Accessible Query Summary Sidebar as Alternative Builder

Status: ready-for-dev

## Story

As a visually impaired user,
I want the Query Summary Sidebar to serve as a fully functional, keyboard-accessible alternative query builder that announces updates audibly,
So that I have full functional parity with visual builders.

## Acceptance Criteria

1. **Given** a screen reader user on the dataset detail page
2. **When** they focus on the Query Summary Sidebar
3. **Then** they can add, remove, and project columns using standard, semantic `<select>` inputs and `<button>` elements (e.g., standard accessible buttons to add `$expand` paths).
4. **And** any changes to the logical query state (`selected_paths`) automatically trigger an `aria-live="polite"` announcement describing the active OData query change (e.g., *"OData Query updated: added Policies expansion"*).
5. **And** the compiled URL preview is announced clearly, ensuring that all elements are readable.

## Tasks

- [ ] Task 1: Add Column Selection Dropdown for Primary Table.
  - Implement an accessible `<select id="add-column-select">` dropdown in the sidebar to add unselected primary table columns to `selected_paths`.
- [ ] Task 2: Interactive Column Projection for Expanded Relationships.
  - Render columns inside expanded tables as interactive `<button>` elements to remove them.
  - Add an accessible `<select>` dropdown for each expanded table to allow adding unselected columns of that relationship.
- [ ] Task 3: Dynamic `aria-live="polite"` Announcement region.
  - Track changes in `selected_paths` and compute descriptive text describing what was added/removed.
  - Render the text dynamically inside a visually hidden (`sr-only`) `<div aria-live="polite">` container.
- [ ] Task 4: Accessible naming and controls.
  - Ensure all form fields, select dropdowns, inputs, and action buttons in the sidebar have explicit labels, unique IDs, and proper ARIA support.
- [ ] Task 5: Automated E2E verification tests.
  - Add E2E tests validating alternative builder interactions (adding/removing columns, adding expands, and verifying `aria-live` announcements).
