---
project: BMAD board
date: '2026-06-22'
status: approved
trigger: Story 2.4 dev execution
---

# Sprint Change Proposal: Remove `storiesMode` from Project Model

## 1. Issue Summary

During the development of **Story 2.4 — Implement Add/Remove Project Flow**, a `storiesMode` setting (flat/nested) was introduced into the project model, UI, and SQLite schema. Subsequent analysis confirmed that the **flat layout alone fully covers the BMAD Method artifact structure** used by this project and by reference projects such as `abeldotam/bmad-viewer`:

- Epics live in `planning-artifacts/` (typically `epics.md`).
- Stories live as individual files in `implementation-artifacts/`.
- `sprint-status.yaml` in `implementation-artifacts/` is the canonical source of status overrides.

Supporting a separate nested mode created branching logic in the markdown parser, extra UI controls, additional IPC validation, and a redundant database column without adding real value. The decision was made to **remove `storiesMode` entirely** and standardize on the flat layout.

The code changes have already been implemented and verified; this proposal documents the corresponding planning-artifact updates so the decision does not resurface in future stories.

## 2. Impact Analysis

### Epic Impact
- **Epic 2: Multi-Project Support** — scope simplified. Project records now store only `name`, `epicsDir`, `storiesDir`, and preferences. No epic is added, removed, or reordered.
- **Epic 3: Real-Time Filesystem Sync** — parser no longer branches on `storiesMode`; sync engine is simpler.
- **Epics 4–6** — unaffected.

### Story Impact
- **Story 2.1 — SQLite/JSON Fallback Storage** — acceptance criteria updated to remove `stories_mode` from the expected schema.
- **Story 2.4 — Implement Add/Remove Project Flow** — project-add form no longer includes a stories-mode selector.
- No future stories need to account for nested mode.

### Artifact Conflicts Resolved
| Artifact | Location | Change |
|----------|----------|--------|
| PRD | FR-4 | Removed `stories mode (flat/nested)` from project record description. |
| Epics | FR-4 summary | Removed `stories mode (flat/nested)`. |
| Epics | Technical Requirements / SQLite Schema | Removed `stories_mode` column. |
| Epics | Story 2.1 AC | Removed `stories_mode` from expected schema. |
| Architecture | SQLite schema snippet | Removed `stories_mode TEXT DEFAULT 'flat'`. |
| Implementation Readiness Report | FR-4 | Removed `stories mode (flat/nested)`. |

### Technical Impact
- Database schema no longer contains `stories_mode`.
- IPC `project:add` no longer validates `storiesMode`.
- `AppConfig`, `Project`, and `NewProject` types no longer contain `storiesMode`.
- Sidebar settings and Add Project modal no longer expose mode selection.
- Diagnostics page no longer displays a mode field.
- Markdown parser runs a single flat-mode sync path.

## 3. Recommended Approach

**Selected:** Direct Adjustment (Option 1).

**Rationale:** The code was already refactored to remove `storiesMode`. The remaining work was limited to aligning planning artifacts with the new reality. This is the lowest-risk, highest-clarity path and avoids reintroducing the nested-mode concept in future agent contexts.

**Not selected:**
- Rollback — would reintroduce unnecessary complexity.
- MVP review — MVP scope is unchanged; this is a simplification, not a reduction.

## 4. Detailed Change Proposals

All proposals were reviewed and approved incrementally. The following edits were applied:

### PRD — FR-4
```markdown
- Each project record contains: name, epics directory path, stories directory path, and user preferences.
```

### Epics — FR-4 Summary
```markdown
Each project record contains: name, epics directory path, stories directory path, and user preferences.
```

### Epics — Technical Requirements / SQLite Schema
```markdown
- **SQLite Schema:** Projects table (id, name, epics_dir, stories_dir, last_used_at, created_at) + Preferences table (key, value).
```

### Epics — Story 2.1 Acceptance Criteria
```markdown
**And** schema includes `projects` table (id, name, epics_dir, stories_dir, last_used_at, created_at)
```

### Architecture — SQLite Schema Snippet
Removed line:
```sql
stories_mode TEXT DEFAULT 'flat',
```

### Implementation Readiness Report — FR-4
```markdown
Each project record contains: name, epics directory path, stories directory path, and user preferences.
```

## 5. Implementation Handoff

**Scope classification:** Minor.

**Handoff:** Developer agent.

**Responsibilities:**
- Verify that no `storiesMode`, `stories_mode`, `flat`, or `nested` references remain in the active source code (`src/`).
- Ensure existing tests pass after artifact-only updates.
- Optional: add a short retrospective note to the implementation story file for Story 2.4 if further context is needed for future agents.

**Success criteria:**
- `npm run lint` passes.
- `npm run test` passes.
- Planning artifacts no longer mention `storiesMode` or `stories_mode`.

## 6. Approval

Approved by: IvanM  
Date: 2026-06-22
