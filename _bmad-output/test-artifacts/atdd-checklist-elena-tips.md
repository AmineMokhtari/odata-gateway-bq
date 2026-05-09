---
stepsCompleted: ['step-01-preflight-and-context', 'step-02-generation-mode', 'step-03-test-strategy', 'step-04c-aggregate', 'step-05-validate-and-complete']
lastStep: 'step-05-validate-and-complete'
lastSaved: '2026-05-09'
storyId: '6.1'
storyKey: 'elena-tips'
storyFile: '_bmad-output/planning-artifacts/epics.md'
atddChecklistPath: '_bmad-output/test-artifacts/atdd-checklist-elena-tips.md'
generatedTestFiles: ['tests/api/elena-tips.spec.ts', 'tests/e2e/elena-tips.spec.ts']
---

# ATDD Checklist: Elena's Tips (Story 6.1)

## TDD Red Phase (Current)
✅ Red-phase test scaffolds generated

- API Tests: 2 tests (all skipped)
- E2E Tests: 1 test (all skipped)

## Acceptance Criteria Coverage
| Criterion | API Test | E2E Test | Status |
| :--- | :--- | :--- | :--- |
| Given 403, display tip | `elena-tips.spec.ts` | `elena-tips.spec.ts` | 🔴 RED |
| Provide 'Next Step' tip | `elena-tips.spec.ts` | `elena-tips.spec.ts` | 🔴 RED |
| Actionable fix application | N/A | `elena-tips.spec.ts` | 🔴 RED |

## Next Steps (Task-by-Task Activation)
During implementation of each task:
1. Remove `test.skip()` from the current test file or scenario.
2. Run tests: `npx playwright test`.
3. Verify the activated test **fails** first, then **passes** after implementation (green phase).
4. Commit passing tests.

## Implementation Guidance
**Backend Endpoints:**
- Decorate 403/401 responses in `src/backend/plugins/elena-tips.ts`.

**Frontend Components:**
- Implement `ElenaDrawer.tsx` in `src/frontend/components/drawers/`.
- Wire `PulseBadge.tsx` to open the drawer on click when state is `blocked`.

## Completion Summary
- **Test Scaffolds Created**: `tests/api/elena-tips.spec.ts`, `tests/e2e/elena-tips.spec.ts`
- **Fixtures Created**: `tests/fixtures/test-data.ts`
- **Checklist Path**: `_bmad-output/test-artifacts/atdd-checklist-elena-tips.md`
- **Handoff**: Ready for `bmad-dev-story` (Implementation).
