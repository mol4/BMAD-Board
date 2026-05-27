# UX Spine Pair Coverage Audit — BMAD Board

**Date:** 2026-05-27
**Spines:** DESIGN.md + EXPERIENCE.md
**Auditor:** automated rubric

---

## 1. Flow Coverage — Verdict: adequate

| Check | Result |
|---|---|
| Named protagonist | 2/3 flows name a specific person; Flow 2 uses generic "Team member" |
| Numbered steps | 3/3 |
| Climax beat | 3/3 (all explicitly marked) |
| Failure path | 1/3 — only Flow 2 covers failure (network error). Flows 1 & 3 have none |

### Findings

| # | Severity | Location | Detail |
|---|---|---|---|
| F1-1 | Medium | EXPERIENCE.md:133 | Flow 2 protagonist is "Team member" — generic. Should be a named persona. |
| F1-2 | High | EXPERIENCE.md:124-131 | Flow 1 has no failure path. Dashboard data could fail to load; stat fetch could error. |
| F1-3 | Medium | EXPERIENCE.md:141-145 | Flow 3 has no failure path. Document save failure is covered in State Patterns but not in the flow itself. |
| F1-4 | Medium | EXPERIENCE.md (missing) | No flow for Create actions (story, epic, task) despite Create modal being a key component. |
| F1-5 | Low | EXPERIENCE.md (missing) | No flow for theme/language toggle despite these being explicit interaction primitives. |
| F1-6 | Low | EXPERIENCE.md (missing) | No flow for Diagnostics surface (`/diagnostics`). |

---

## 2. Token Completeness — Verdict: adequate

| Check | Result |
|---|---|
| All frontmatter tokens defined | Yes — all color, typography, rounded, spacing tokens have values |
| Color tokens have hex values | Yes — all use `#hex` or `rgba()` |
| Light/dark pairs complete | Yes — every light token has a `-dark` counterpart |
| Prose `{path.to.token}` references resolve | 1 broken reference found |

### Findings

| # | Severity | Location | Detail |
|---|---|---|---|
| F2-1 | **Critical** | EXPERIENCE.md:71 | `{components.code-block}` reference does not resolve — no `code-block` entry exists in DESIGN.md frontmatter `components` section. |
| F2-2 | Low | DESIGN.md:125 | `spacing.margin-mobile` token defined but app is desktop-only. Orphan token. |
| F2-3 | Low | DESIGN.md:frontmatter | `border-strong` / `border-strong-dark` defined but never referenced in any component spec. The Input component uses `border-default`, not `border-strong` for focus/active. |
| F2-4 | Low | DESIGN.md:frontmatter | No `priority-*` color tokens defined anywhere, yet EXPERIENCE.md references "priority semantic tokens" (line 68). |

---

## 3. Component Coverage — Verdict: thin

Cross-reference of every component name used across both spines:

| Component | DESIGN.md prose | DESIGN.md frontmatter | EXPERIENCE.md | Verdict |
|---|---|---|---|---|
| Sidebar | ✅ | ✅ sidebar | ✅ | **strong** |
| Card (generic) | ✅ | ✅ card | — | Covered by Epic card / Stat card variants |
| Button-Primary | ✅ | ✅ button-primary | ❌ | **broken** — no behavioral spec |
| Button-Secondary | ✅ | ✅ button-secondary | ❌ | **broken** — no behavioral spec |
| Input/Select | ✅ | ✅ input | ❌ | **broken** — no behavioral spec |
| Status Badge | ✅ | ✅ badge (name mismatch) | ✅ Status badge | **adequate** — naming inconsistency |
| Kanban Column | ✅ | ✅ kanban-column | ✅ | **strong** |
| Kanban Card | ✅ | ✅ kanban-card | ✅ | **strong** |
| Code Block | ✅ | ❌ | ❌ (partial via Markdown renderer) | **broken** — no frontmatter, behavioral spec partial |
| Theme Toggle | ✅ | ❌ | ✅ | **thin** — no visual spec |
| Stat card | ❌ | ❌ | ✅ | **broken** — no visual spec at all |
| Priority badge | ❌ | ❌ | ✅ | **broken** — no visual spec, no color tokens |
| Create modal | ❌ | ❌ | ✅ | **broken** — no visual spec |
| Markdown renderer | ❌ | ❌ | ✅ | **broken** — no visual spec (Code Block prose partially covers) |
| Epic card | ❌ | ❌ | ✅ | **broken** — no visual spec (generic Card prose insufficient) |
| Story detail tabs | ❌ | ❌ | ✅ | **broken** — no visual spec |

### Findings

| # | Severity | Location | Detail |
|---|---|---|---|
| F3-1 | **Critical** | DESIGN.md frontmatter | 6 components in EXPERIENCE.md (Stat card, Priority badge, Create modal, Markdown renderer, Epic card, Story detail tabs) have ZERO visual spec in DESIGN.md. |
| F3-2 | High | DESIGN.md:frontmatter vs EXPERIENCE.md:66 | "badge" (frontmatter) vs "Status badge" (EXPERIENCE.md) — naming inconsistency across spines. |
| F3-3 | High | EXPERIENCE.md:67 | Priority badge references "priority semantic tokens" which do not exist in DESIGN.md. |
| F3-4 | High | DESIGN.md frontmatter | Code Block and Theme Toggle described in prose Components section but absent from frontmatter YAML. |
| F3-5 | Medium | EXPERIENCE.md (missing) | Button-Primary, Button-Secondary, Input/Select have visual specs in DESIGN.md but no behavioral rules in EXPERIENCE.md Component Patterns. |

---

## 4. State Coverage — Verdict: thin

| Surface | empty | cold-load | error | offline | 404 | Covered? |
|---|---|---|---|---|---|---|
| Dashboard | ✅ | ✅ (generic) | ❌ | ❌ | N/A | **thin** |
| Sprint Board | ✅ | ✅ (generic) | ❌ | ❌ | N/A | **thin** |
| Backlog | ❌ | ✅ (generic) | ❌ | ❌ | ❌ | **broken** |
| Epics | ❌ | ✅ (generic) | ❌ | ❌ | ❌ | **broken** |
| Epic detail | ❌ | ✅ (generic) | ❌ | ❌ | ✅ | **thin** |
| Stories | ❌ | ✅ (generic) | ✅ (save) | ❌ | ✅ | **thin** |
| Documents | ✅ | ✅ (generic) | ✅ (save) | ❌ | ✅ | **adequate** |
| Document detail | ❌ | ✅ (generic) | ✅ (save) | ❌ | ✅ | **thin** |
| Diagnostics | ❌ | ✅ (generic) | ❌ | ❌ | N/A | **broken** |

### Findings

| # | Severity | Location | Detail |
|---|---|---|---|
| F4-1 | High | EXPERIENCE.md State Patterns | Backlog has no empty state defined. |
| F4-2 | High | EXPERIENCE.md State Patterns | Epics grid has no empty state defined. |
| F4-3 | High | EXPERIENCE.md State Patterns | Diagnostics surface has zero state coverage. |
| F4-4 | Medium | EXPERIENCE.md State Patterns | No error state for Dashboard or Sprint Board data loading failure. |
| F4-5 | Medium | EXPERIENCE.md State Patterns | No error state for sync failure (only "in progress" spinner covered). |
| F4-6 | Low | EXPERIENCE.md:88 | Offline explicitly deferred: "[ASSUMPTION] Desktop-only, assumed always online for v1." Acceptable for v1 but should be tracked. |
| F4-7 | Low | EXPERIENCE.md State Patterns | Cold-load is "Any" — generic. No surface-specific skeleton patterns (e.g., kanban column skeletons, tab skeletons). |

---

## 5. Visual Reference Coverage — Verdict: thin

| Check | Result |
|---|---|
| `mockups/` directory | Does not exist |
| `wireframes/` directory | Does not exist |
| `imports/` directory | Exists but **empty** |

### Findings

| # | Severity | Location | Detail |
|---|---|---|---|
| F5-1 | Medium | imports/ | Directory exists but is empty — no reference images, mood boards, or wireframes attached. |
| F5-2 | Low | DESIGN.md prose | Mentions Windows 11 / macOS Ventura as visual references but no screenshot or visual anchor. Adequate for text-only spec but risky for implementer alignment. |

---

## 6. Bloat & Overspecification — Verdict: strong

| Check | Result |
|---|---|
| Pixel specs where tokens cover it | Minimal — Layout section references sidebar widths with px values, but these match `spacing.sidebar-width` / `spacing.sidebar-collapsed` tokens. Acceptable. |
| Source restatement | Typography table (DESIGN.md:232-241) is a full duplicate of frontmatter `typography` tokens. |
| Prose where a table works | Colors section uses prose for surface hierarchy explanation that partially duplicates frontmatter — acceptable as narrative context. |
| Sections no downstream consumer reads | None identified. |
| Decorative narrative untied to decision | None. Brand & Style section ties aesthetic to specific decisions (accent usage rules, code block treatment). |

### Findings

| # | Severity | Location | Detail |
|---|---|---|---|
| F6-1 | Medium | DESIGN.md:230-241 | Typography table is a 1:1 restatement of frontmatter `typography` tokens. Should either remove table and reference tokens, or remove frontmatter and keep table. |
| F6-2 | Low | DESIGN.md:125 | `spacing.margin-mobile` is dead content for a desktop-only app. |
| F6-3 | Low | DESIGN.md:199-222 | Colors prose re-explains surface/foreground/border hierarchy already fully defined in frontmatter. Mild redundancy but adds decision context. |

---

## 7. Inheritance Discipline — Verdict: thin

| Check | Result |
|---|---|
| Sources in EXPERIENCE.md frontmatter resolve | Unverified — 8 source paths listed, not checked for existence on disk |
| Component names identical across all sections | No — multiple mismatches (see below) |
| EXPERIENCE.md token refs resolve to DESIGN.md tokens | 1 broken reference |

### Name mismatches

| DESIGN.md prose | DESIGN.md frontmatter | EXPERIENCE.md | Aligned? |
|---|---|---|---|
| Status Badge | badge | Status badge | ❌ three different names |
| Code Block | — (missing) | Markdown renderer (partial) | ❌ no alignment |
| Theme Toggle | — (missing) | Theme toggle | ❌ missing frontmatter |
| Card | card | Epic card / Stat card | ⚠️ generic vs specific |
| Button — Primary | button-primary | — | ❌ no EXPERIENCE.md entry |
| Button — Secondary | button-secondary | — | ❌ no EXPERIENCE.md entry |
| Input / Select | input | — | ❌ no EXPERIENCE.md entry |

### Findings

| # | Severity | Location | Detail |
|---|---|---|---|
| F7-1 | **Critical** | DESIGN.md frontmatter / EXPERIENCE.md:71 | `{components.code-block}` referenced in EXPERIENCE.md does not exist in DESIGN.md frontmatter. Broken inheritance. |
| F7-2 | High | Cross-spine | Component naming is not normalized: "badge" / "Status Badge" / "Status badge" — three different identifiers for the same thing. |
| F7-3 | High | DESIGN.md frontmatter | Code Block and Theme Toggle have prose descriptions but no frontmatter component entry — downstream token resolution will fail. |
| F7-4 | Medium | EXPERIENCE.md:67 | "priority semantic tokens" referenced but never defined in DESIGN.md. Broken inheritance. |
| F7-5 | Low | EXPERIENCE.md:4-12 | 8 source paths listed but not verified for existence. |

---

## 8. Shape Fit — Verdict: strong

### DESIGN.md canonical order check

| Required Section | Present? | Position |
|---|---|---|
| Brand & Style | ✅ | 1 |
| Colors | ✅ | 2 |
| Typography | ✅ | 3 |
| Layout & Spacing | ✅ | 4 |
| Elevation & Depth | ✅ | 5 |
| Shapes | ✅ | 6 |
| Components | ✅ | 7 |
| Do's and Don'ts | ✅ | 8 |

Order is canonical. No missing or out-of-order sections.

### EXPERIENCE.md required defaults check

| Required Section | Present? |
|---|---|
| Foundation | ✅ |
| Information Architecture | ✅ |
| Voice and Tone | ✅ |
| Component Patterns | ✅ |
| State Patterns | ✅ |
| Interaction Primitives | ✅ |
| Accessibility Floor | ✅ |
| Key Flows | ✅ |

All 8 required sections present.

### Findings

| # | Severity | Location | Detail |
|---|---|---|---|
| F8-1 | Low | DESIGN.md | Shape fit is excellent — no findings. |

---

## Summary

| Category | Verdict |
|---|---|
| 1. Flow coverage | **adequate** |
| 2. Token completeness | **adequate** |
| 3. Component coverage | **thin** |
| 4. State coverage | **thin** |
| 5. Visual reference coverage | **thin** |
| 6. Bloat & overspecification | **strong** |
| 7. Inheritance discipline | **thin** |
| 8. Shape fit | **strong** |

### Finding counts by severity

| Severity | Count |
|---|---|
| Critical | 3 |
| High | 7 |
| Medium | 8 |
| Low | 9 |
| **Total** | **27** |

### Critical findings (must fix before implementation)

1. **F2-1** — `{components.code-block}` reference in EXPERIENCE.md does not resolve to any DESIGN.md frontmatter token.
2. **F3-1** — 6 components (Stat card, Priority badge, Create modal, Markdown renderer, Epic card, Story detail tabs) have behavioral specs but zero visual specs.
3. **F7-1** — Same as F2-1; broken token inheritance between spines.

### Top 3 remediation priorities

1. **Add missing component frontmatter entries** in DESIGN.md for Code Block, Theme Toggle, Stat card, Epic card, Priority badge, Create modal, Markdown renderer, Story detail tabs — with full token references (bg, fg, border, radius, shadow).
2. **Define priority color tokens** in DESIGN.md frontmatter and add visual specs for Priority badge and all EXPERIENCE.md-only components.
3. **Normalize component names** across all three contexts (DESIGN.md prose, DESIGN.md frontmatter keys, EXPERIENCE.md Component Patterns) to a single canonical identifier per component.
