---
title: "BMAD Board"
status: final
created: "2026-05-26"
updated: "2026-05-26"
---

# PRD: BMAD Board

## 1. Document Purpose

This PRD defines requirements for migrating BMAD Board from a Next.js web application to a cross-platform Electron desktop application. It is scoped for downstream UX design, architecture, and epic/story creation. The existing codebase (Next.js 14 + React 18 + TypeScript) and its documentation in `docs/` serve as the baseline.

## 2. Vision

BMAD Board is a companion tool for the BMAD Method ecosystem — a local Jira-like project management UI that reads and writes directly from BMAD Method markdown artifacts. The Electron migration transforms it from a browser-based dev server into a native desktop experience with multi-project support, real-time filesystem sync, and a polished dark UI.

## 3. Target Users

### 3.1 Jobs To Be Done

- As a BMAD practitioner, I want to see my epics, stories, and sprint status as an interactive board without opening a browser.
- As a team member, I want to switch between multiple BMAD projects quickly.
- As a user, I want changes made by AI agents to markdown files to appear in the UI within seconds.
- As a cautious editor, I want to be warned before manually editing files, since AI agent editing is the preferred workflow.
- As an open source user, I want to install, update, and contribute to the application freely.

### 3.2 Non-Users (v1)

- Users who need cloud-based collaboration or real-time multi-user editing.
- Mobile users.

### 3.3 Key User Journeys

- **UJ-1 — Open project:** Developer launches the app and sees their last-used project loaded with a dashboard showing epics, stories, and progress. All data is read from markdown files on disk.
- **UJ-2 — Switch projects:** User clicks a project switcher, selects another project, and the UI reloads with that project's artifacts. Project paths and preferences are stored in SQLite.
- **UJ-3 — Agent edits file:** An AI agent modifies a story markdown file. Within ~30 seconds, the board reflects the new status without any manual sync action.
- **UJ-4 — Manual edit:** User opens the document editor, makes a change, and sees a warning that manual editing is discouraged in favor of AI agents. User confirms and saves.

## 4. Glossary

- **BMAD Artifact** — A markdown file following BMAD Method conventions (epics, stories, tasks, planning documents) with YAML frontmatter.
- **Project** — A collection of BMAD artifacts located in one or more filesystem directories. A project has a name, artifact paths, and user preferences stored in SQLite.
- **Store** — In-memory data structure (JavaScript Maps) holding parsed epics, stories, tasks, and sprints. Replaces the current singleton pattern with per-project isolation.
- **Sync Engine** — The subsystem responsible for reading markdown files from disk, parsing them, and updating the in-memory store. Now includes filesystem watching.
- **Agile Board** — The Kanban-style sprint board view showing stories in columns by status (backlog, todo, in-progress, in-review, done).

## 5. Features

### 5.1 Desktop Shell (Electron Migration)

**Description:** Migrate the existing Next.js + React application to run inside Electron. The React UI is reused; Next.js App Router is replaced with a static React SPA served by Electron's local file protocol or a lightweight embedded server. Realizes UJ-1.

**Requirements:**

- **FR-1 — Electron Application Shell:** The application launches as a native desktop window on Windows, macOS, and Linux.
  - Produces a single executable/installer per platform.
  - Window opens with the dashboard view loaded.
  - No browser or dev server required.

- **FR-2 — React UI Reuse:** All existing React components (Sidebar, StatusBadge, CreateModal, pages) are reused within the Electron renderer process.
  - Dashboard, Sprint Board, Backlog, Epics, Stories, Documents, and Diagnostics pages render with no visual regression beyond expected dark-theme adaptations.
  - Tailwind CSS styling is preserved.
  - Visual regression verified against screenshot baseline of current web version.

- **FR-3 — Native Window Management:** The application supports standard desktop window behaviors (minimize, maximize, close, resize).
  - Window state (size, position) is persisted and restored on relaunch.
  - Close behavior: application quits on close (minimize to tray deferred to v2).

### 5.2 Multi-Project Support with SQLite

**Description:** Users can configure, switch between, and manage multiple BMAD projects. Project metadata (name, artifact directory paths, preferences) is stored in a local SQLite database. Realizes UJ-2.

**Requirements:**

- **FR-4 — Project Configuration Storage:** The application stores project configurations in a local SQLite database.
  - Each project record contains: name, epics directory path, stories directory path, stories mode (flat/nested), and user preferences.
  - Data persists across application restarts.
  - Database file is stored in the platform-appropriate user app data directory.

- **FR-5 — Project Switcher:** A UI element allows users to view all configured projects and switch between them.
  - Project switcher is accessible from the sidebar or top bar.
  - Switching projects reloads the store from the selected project's artifact directories.
  - The last-used project is automatically loaded on launch.

- **FR-6 — Add / Remove Projects:** Users can add a new project by selecting artifact directories and remove existing projects.
  - Adding a project validates that the selected directories exist and contain valid BMAD artifacts.
  - Removing a project removes it from SQLite but does NOT delete the markdown files.

### 5.3 Automatic Filesystem Sync

**Description:** Replace manual sync with automatic detection of filesystem changes. The application watches artifact directories and re-parses changed files, updating the UI within ~30 seconds. Realizes UJ-3.

**Requirements:**

- **FR-7 — Filesystem Watcher:** The application monitors artifact directories for file changes using fs.watch or a polling fallback.
  - Changes to markdown files (create, modify, delete) are detected.
  - The store is updated and the UI reflects changes within 30 seconds.
  - Watcher is scoped to the active project's artifact directories only.
  - If a file is locked by another process, retry once after 5 seconds; if still locked, surface a non-blocking error toast.
  - If the watched directory is deleted or becomes inaccessible, the watcher stops gracefully without crashing the application.

- **FR-8 — Manual Sync Fallback:** A manual sync button remains available for explicit re-sync triggers.
  - Clicking the sync button forces an immediate re-read of all artifact files.
  - Sync button shows a loading state during operation.

### 5.4 Edit Functions Verification and Warning

**Description:** Existing read and status-update functions are verified to work correctly in the Electron environment. Creation and deletion of epics, stories, and documents are the responsibility of BMAD AI agents — the UI is read-first and update-only. A warning is displayed before any manual file edit. Realizes UJ-4.

**Requirements:**

- **FR-9 — Edit Functions Verification (Read-First / Update-Only):** All data-reading and status-update operations on epics, stories, and documents work correctly in the Electron environment. Creation and deletion of artifacts are handled by AI agents, not the UI.
  - Reading and parsing all epics, stories, and documents from markdown files displays correctly in the UI.
  - Updating a story status (via drag-and-drop on Kanban or select dropdown) writes the change to the story's markdown file frontmatter and the file remains valid markdown.
  - Document manual edits save correctly to the target markdown file, preserving existing frontmatter and markdown structure.
  - A file lock mechanism prevents concurrent writes between the UI and AI agents; lock owner is tracked, and stale locks auto-release after 30 seconds.
  - The UI does NOT expose Create or Delete actions for epics, stories, tasks, or documents — these operations are the exclusive responsibility of BMAD AI agents.
  - After any write operation, a re-sync confirms the change is reflected in the store.

- **FR-10 — Manual Edit Warning:** Before a user manually edits a BMAD artifact through the document editor, a warning dialog is displayed.
  - Warning text: "You are about to edit a file manually. This is bad practice. Use this only in exceptional cases. AI Agent editing is preferred."
  - User must confirm to continue editing.
  - Warning can be dismissed with a "Don't show again" option per session.

### 5.5 Dark Theme and Windows 11 Design

**Description:** The application provides a dark theme with a design language inspired by Windows 11 (rounded corners, subtle shadows, Fluent-like aesthetics).

**Requirements:**

- **FR-11 — Dark Theme:** The application renders in a dark color scheme by default.
  - All pages (Dashboard, Board, Backlog, Epics, Stories, Documents, Diagnostics) are legible and visually coherent in dark mode.
  - Status badge colors are adjusted for dark background readability.
  - Markdown rendering in dark mode preserves contrast and readability.

- **FR-12 — Windows 11 Design Language:** The UI follows Windows 11 design conventions.
  - Rounded corners on cards, modals, and input fields.
  - Subtle elevation and shadow effects.
  - Fluent-like typography and spacing.
  - Consistent with Windows 11 aesthetics while remaining functional on macOS and Linux.

### 5.6 Automatic Updates

**Description:** The application checks for and installs updates automatically using a free update mechanism.

**Requirements:**

- **FR-13 — Auto-Update Mechanism:** The application checks for updates on launch and periodically thereafter.
  - Updates are distributed via GitHub Releases at no cost.
  - Users are notified when an update is available.
  - Update downloads and installs without requiring manual file replacement.
  - Update mechanism works on Windows, macOS, and Linux.

## 6. Distribution and Licensing

- **D-1 — MIT License:** The repository includes an MIT LICENSE file in the root. All source code is covered by the MIT license.
- **D-2 — Donation Links:** GitHub Sponsors and Buy Me a Coffee links are present in the repository README. An About dialog in the application includes donation links.

## 7. Out of Scope

- Mobile application (iOS/Android)
- Cloud-based synchronization or multi-user collaboration
- Real-time collaborative editing
- Paid/pro tier features
- CI/CD pipeline integration
- Plugin system (envisioned for v2+)
- Integration with external AI agent frameworks (envisioned for v2+)

## 8. MVP Scope

### 8.1 In Scope

- Electron application shell wrapping existing React UI
- Multi-project support with SQLite storage
- Automatic filesystem sync (fs.watch, ~30s interval)
- Verification and fix of all edit/CRUD functions
- Manual edit warning dialog
- Dark theme with Windows 11 design language
- Auto-updates via GitHub Releases (zero cost)
- MIT license, public repository
- GitHub Sponsors and Buy Me a Coffee links

### 8.2 Migration Completion Criteria

The migration is considered complete when:
- All existing features from the web version work in the Electron app with no functional regressions.
- The application builds and runs on Windows 10/11, macOS 12+, and Ubuntu 22.04+.
- All FRs (FR-1 through FR-13) pass their testable consequences.
- The old Next.js dev server is no longer required for local use.

## 9. Success Metrics

**Primary**

- **SM-1:** Application launches and loads a project on Windows, macOS, and Linux with zero unhandled exceptions. Validates FR-1, FR-2.
- **SM-2:** Filesystem changes are reflected in the UI within 30 seconds in 95% of cases. Validates FR-7.
- **SM-3:** All CRUD operations (create, update, delete epics/stories/documents) produce valid markdown files that re-sync correctly into the store. Validates FR-9.

**Secondary**

- **SM-4:** Users can configure and switch between 2+ projects with project switch completing in under 2 seconds. Validates FR-4, FR-5, FR-6.
- **SM-5:** Manual edit warning is displayed before document editing and blocks save until confirmed. Validates FR-10.

**Counter-metrics**

- **SM-C1:** Application memory usage should not exceed 300MB under normal operation (single project, 50+ stories loaded). Counterbalances SM-1.

## 10. Non-Functional Requirements

- **NFR-1 (Performance):** Application startup time under 5 seconds on a typical development machine.
- **NFR-2 (Reliability):** Filesystem watcher does not crash the application if watched directories are deleted or become inaccessible.
- **NFR-3 (Portability):** Application runs on Windows 10/11 (x64), macOS 12+ (x64 + Apple Silicon), and major Linux distributions — Ubuntu 22.04+, Fedora 38+ (x64) without platform-specific configuration.
- **NFR-4 (Security):** SQLite database and artifact files are stored in user-scoped directories; no network access is required for core functionality.

## 11. Testing Approach

- **Unit tests:** Store CRUD operations, markdown parser, filesystem watcher error handling.
- **Integration tests:** API routes (or IPC handlers in Electron), SQLite read/write, sync engine end-to-end.
- **E2E tests:** Critical user journeys (UJ-1 through UJ-4) — project load, project switch, file change detection, manual edit workflow.
- **Visual regression:** Screenshot comparison between current web version and Electron app for all pages.
- **Manual testing:** Cross-platform smoke test on Windows, macOS, and Linux before each release.

## 12. Risk and Mitigation

| Risk | Impact | Mitigation |
|------|--------|------------|
| fs.watch unreliable on macOS (FSEvents) or network drives | File changes not detected | Polling fallback at 30s interval; documented limitation for network drives |
| React component incompatibility with Electron renderer | Pages fail to render | Incremental migration: test each page individually before full cutover |
| SQLite native module build fails on a platform | Multi-project support broken on that platform | Prebuild binaries for all target platforms; fallback to JSON file storage for v1 if SQLite fails on a specific platform |
| Dark theme reveals hardcoded colors in existing components | Visual inconsistencies | Audit all components for hardcoded colors before migration; use Tailwind CSS custom properties for theme tokens |

## 13. Suggested Epic Grouping

| Epic | FRs | Description |
|------|-----|-------------|
| Epic A: Desktop Shell | FR-1, FR-2, FR-3 | Electron migration, React UI reuse, window management |
| Epic B: Multi-Project | FR-4, FR-5, FR-6 | SQLite storage, project switcher, add/remove projects |
| Epic C: Auto Sync | FR-7, FR-8 | Filesystem watcher, manual sync fallback |
| Epic D: Edit Verification | FR-9, FR-10 | CRUD verification, manual edit warning |
| Epic E: Dark Theme | FR-11, FR-12 | Dark mode, Windows 11 design language |
| Epic F: Distribution | FR-13, D-1, D-2 | Auto-updates, MIT license, donation links |

## 14. Constraints

- **Cost:** All infrastructure (updates, distribution) must be free. GitHub Releases satisfies this.
- **License:** MIT — all contributions must be compatible.
- **No proprietary formats:** BMAD artifacts remain pure Markdown with YAML frontmatter.
- **Why Electron over Tauri:** Existing React codebase is large; Electron requires minimal changes. Tauri would require a Rust backend rewrite.
- **Why SQLite over JSON:** Multi-project support requires structured queries and concurrent-safe writes; JSON files would be fragile.

## 15. Assumptions

- Minimize to system tray on close is not required for v1 (was Open Question 1, now resolved).
- "Don't show again" for the manual edit warning is per-session, not persistent.
- Electron version ^33 or latest stable at project start.
- NSIS selected for Windows installer (resolved from Open Question 1; documented in Epic 6 Story 6.1).

## 16. Open Questions

None. All open questions have been resolved.
