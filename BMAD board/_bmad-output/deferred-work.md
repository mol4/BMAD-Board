# Deferred Work

## Deferred from: code review of 4-1-implement-file-lock-status-update-and-read-only-document-view (2026-07-08)

- **Dead i18n keys** — `epics.create`, `backlog.createStory` and related keys are no longer referenced after removing create UI. Clean up when Epic 5b-i reuses CreateModal.
- **Redundant `getStory` calls** — StoryDetailPage handler calls `useAppStore.getState().getStory(story.id)` 3 times in one flow. Consolidate when refactoring status change logic.
- **Duplicate `handleStatusChange` logic** — BacklogPage and BoardPage have identical async status-change code. Extract to shared hook or utility when adding status change to more surfaces.

## Deferred from: code review of 5b-i-1-build-sidebar-card-and-button-components (2026-07-13)

- **Settings inputs `focus:outline-none` overriding global 2px accent focus ring** — `Sidebar.tsx:287,298` has `focus:border-accent focus:outline-none` on text inputs in settings panel, suppressing the global focus-visible ring defined in `index.css`. Pre-existing code from before story 5b-i.1.
