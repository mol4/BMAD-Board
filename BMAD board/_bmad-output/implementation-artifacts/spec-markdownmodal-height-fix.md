---
title: 'Fix MarkdownModal edit textarea height'
type: 'bugfix'
created: '2026-07-13'
status: 'done'
route: 'one-shot'
---

# Fix MarkdownModal edit textarea height

## Intent

**Problem:** The MarkdownModal textarea for editing epic markdown files was only 300px tall, making it cramped for editing large markdown documents.

**Approach:** Increase the textarea minimum height from `min-h-[300px]` to `min-h-[50vh]`, giving roughly 4x more vertical editing space on typical desktop resolutions.

## Suggested Review Order

1. [`src/renderer/components/MarkdownModal.tsx:199`](../../src/renderer/components/MarkdownModal.tsx#L199) — the single-line CSS change from `min-h-[300px]` to `min-h-[50vh]`

## Code Map

- `src/renderer/components/MarkdownModal.tsx` — reusable modal for viewing/editing markdown files (epics, stories, docs)
- `src/renderer/components/Textarea.tsx` — shared Textarea component with `resize-y` and `min-h-[80px]` base styles

## Tasks & Acceptance

**Execution:**
- [x] `src/renderer/components/MarkdownModal.tsx` — increase edit textarea `min-h-[300px]` to `min-h-[50vh]` — provides 4x taller editing area for epic markdown files

**Acceptance Criteria:**
- Given the MarkdownModal is open in edit mode, when viewing on a desktop resolution, then the textarea is at least 50vh tall

## Verification

**Manual checks:**
- Open Docs page, click an epic markdown file, click Edit — textarea height should be ~50% of viewport height
- Ensure resize handle still works within modal bounds
