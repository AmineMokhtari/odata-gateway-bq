# Story 6.1: Actionable Error Layer (The 'Elena' Tips)

Status: review

<!-- Note: Validation is optional. Run validate-create-story for quality check before dev-story. -->

## Story

As an **Analyst (Elena)**,
I want to see a **business-friendly explanation** and a **"next step" tip** when my query fails (e.g., BudgetExceeded),
so that I can **fix the issue myself** without needing to contact IT or learn complex SQL internals.

## Acceptance Criteria

1. **Business-First Error Mapping**: The Web Portal must intercept technical OData error codes (e.g., `BudgetExceeded`, `Unauthorized`) and map them to human-readable explanations.
2. **Actionable "Elena" Advice**: When a `BudgetExceeded` error occurs, the UI must display a "Pro-Tip" from Elena (e.g., "Try selecting fewer columns to stay within your budget").
3. **Contextual Deep-Linking**: The error message should include a direct link or button to the relevant UI section to fix the problem (e.g., a link that opens the "Filters" section).
4. **Visual Distinction**: The advice must be visually distinct from the error (e.g., using a "Lightbulb" icon or a narrative-style "Elena says..." bubble).
5. **Persistence**: The advice should remain visible until the user modifies the query to a potentially valid state.

## Tasks / Subtasks

- [x] **Research/Audit Existing Errors** (AC: 1)
  - [x] Identify all error codes returned by the backend (BudgetExceeded, Unauthorized, RateLimitExceeded).
- [x] **Implement `BusinessErrorMapper` Utility** (AC: 1, 2)
  - [x] Create a utility that takes a technical error and returns a `{ title, advice, nextStepLink }` object.
- [x] **Create `ElenaAdviceCard` Component** (AC: 2, 4)
  - [x] Build a premium, story-driven component featuring Elena's persona.
  - [x] Use `lucide-react` icons (Lightbulb, Sparkles).
- [x] **Integrate Error Layer into Marketplace UI** (AC: 3, 5)
  - [x] Update `ODataUrlBuilder` to handle dry-run failures gracefully.
  - [x] Display the `ElenaAdviceCard` prominently when an error is detected.
- [x] **Verify Success Flow**
  - [x] Ensure that fixing the query clears the error and the advice card.

## Dev Notes

- **Persona Alignment**: Use the "Elena" (Stranded Analyst) tone from `ux-design-specification.md`. The advice should be encouraging, not technical.
- **Backend Sync**: Backend already provides a `BudgetExceeded` code and a link to the explain page in `routes/v1/index.ts#L188-202`.
- **Existing Asset**: Leverage `CostSavingTips.tsx` as a baseline for the visual style.
- **Paths**:
  - Utility: `frontend/src/lib/error-mapping.ts`
  - Component: `frontend/src/components/marketplace/ElenaAdviceCard.tsx`
  - View: `frontend/app/web/marketplace/[projectId]/[datasetId]/[entitySet]/page.tsx`

### Project Structure Notes

- Alignment with Next.js App Router and Shadcn/UI components.
- Naming: Use `ElenaAdviceCard` to reinforce the narrative-driven design.

### References

- [Source: _bmad-output/planning-artifacts/epics.md#Story 6.1]
- [Source: _bmad-output/planning-artifacts/ux-design-specification.md#Governance Signaling Patterns]
- [Source: backend/src/middleware/audit/dry-run-gate.ts#L25]

## Dev Agent Record

### Agent Model Used

Antigravity (Claude 3.5 Sonnet)

### Debug Log References

### Completion Notes List

- ✅ Created `error-mapping.ts` utility to translate technical codes (BudgetExceeded, Unauthorized, etc.) into business-friendly advice.
- ✅ Developed `ElenaAdviceCard.tsx` - a premium, narrative-driven component to display Elena's guidance.
- ✅ Integrated the error layer into the Query Governance Audit (Explain) page to provide context-aware pro-tips when queries are blocked.
- ✅ Verified that the advice card appears correctly when `estimatedBytes > budgetBytes`.

### File List

- `frontend/src/lib/error-mapping.ts`
- `frontend/src/components/marketplace/ElenaAdviceCard.tsx`
- `frontend/src/app/marketplace/[projectId]/[datasetId]/[entitySet]/explain/page.tsx`
