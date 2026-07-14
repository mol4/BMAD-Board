# BMAD Board

> A desktop project management application that reads directly from [BMAD Method](https://github.com/bmadcode/BMAD-METHOD) markdown artifacts.

## What is BMAD?

**BMAD (Build More Architect Dreams)** is an AI-driven agile development **framework** within the [BMad Method](https://docs.bmad-method.org) Module Ecosystem — the most comprehensive Agile AI-Driven Development framework with true scale-adaptive intelligence that adjusts from bug fixes to enterprise systems. At its core lies the **Spec-Driven Development** methodology — a structured approach where detailed specifications drive every stage of the development lifecycle. 100% free and open source.

Unlike traditional AI tools that do the thinking for you, BMad agents and facilitated workflows act as **expert collaborators** who guide you through a structured process — bringing out your best thinking in partnership with AI.

Key capabilities of the BMad Method:

- **Scale-Domain-Adaptive** — automatically adjusts planning depth based on project complexity
- **Structured Workflows** — grounded in agile best practices across analysis, planning, architecture, and implementation
- **Specialized Agents** — 12+ domain experts (PM, Architect, Developer, UX, Scrum Master, and more)
- **Party Mode** — bring multiple agent personas into one session to collaborate and discuss
- **Complete Lifecycle** — from brainstorming to deployment

All project artifacts — requirements, architecture, design, epics, stories, and sprint status — are kept as **plain markdown and YAML files** in a `_bmad-output/` folder inside your repository.

A typical BMAD workflow:

1. **Planning Phase** — Specialized AI agents generate planning artifacts: a Product Requirements Document (PRD), architecture overview, UX design specification, and an epics file that breaks the project into epics and stories.
2. **Implementation Phase** — For each story, a detailed implementation artifact is generated with tasks, acceptance criteria, API contracts, and technical notes. A `sprint-status.yaml` tracks progress.
3. **Development** — Developers work through stories using specialized BMAD skills, generating and reviewing code in partnership with AI agents. Progress is tracked via `sprint-status.yaml`, and all artifacts stay in version control alongside the code.

> Learn more at [docs.bmad-method.org](https://docs.bmad-method.org)

### BMAD Artifacts in This Repository

The `_bmad-output/` folder in this repo contains example BMAD artifacts for a sample "TaskFlow" project:

```
_bmad-output/
├── planning-artifacts/
│   ├── prd.md                     # Product Requirements Document
│   ├── architecture.md            # System architecture & ADRs
│   ├── ux-design-specification.md # UX flows & wireframes
│   └── epics.md                   # Epics with stories breakdown
└── implementation-artifacts/
    ├── 1-1-story-example.md       # Story 1.1 implementation spec
    ├── 1-2-story-example.md       # Story 1.2 implementation spec
    └── sprint-status.yaml         # Sprint progress tracker
```

**BMAD Board** is a companion desktop app that turns these flat files into an interactive project management experience — so you don't have to read raw markdown to track your projects.

---

## Features

| Page             | Description                                                                          |
| ---------------- | ------------------------------------------------------------------------------------ |
| **Welcome**      | Project launcher — add, switch, and manage multiple projects                         |
| **Dashboard**    | Overview of epics, stories, progress bars, and story points                          |
| **Sprint Board** | Kanban columns (Backlog → To Do → In Progress → In Review → Done) with drag-and-drop |
| **Backlog**      | Full story list with filtering by epic, status, and priority                         |
| **Epics**        | Epic list with progress indicators and detail pages                                  |
| **Stories**      | Story detail view with tasks, acceptance criteria, and inline markdown editor        |
| **Documents**    | Browse and edit all planning artifacts (PRD, architecture, UX spec, etc.)            |
| **Diagnostics**  | File system and configuration health checks                                          |

Additional capabilities:

- **Multi-Project Support** — manage any number of BMAD projects from a single app instance; each project has its own artifact directories and independent state
- **Real-Time Sync** — file system watcher automatically detects changes to epics, stories, and documents; edits in the app are written back to disk instantly
- **File Locking** — prevents edit conflicts between the UI and external agents; lock status is visible and enforced
- **Markdown Editing** — edit any document, epic, or story inline with live preview; changes persist to disk and trigger cross-project sync
- **i18n** — English and Russian UI with a language switcher
- **Offline-First** — all data lives in local files and SQLite; no server or cloud required

---

## Screenshots

### Dashboard

![Dashboard](docs/dashboard.png?v=2)

### Sprint Board (Kanban)

![Sprint Board](docs/board.png?v=2)

### Backlog

![Backlog](docs/backlog.png?v=2)

### Epic Detail

![Epics](docs/epics.png?v=2)

### Document Viewer

![Documents](docs/docs.png?v=2)

### Diagnostics

![Diagnostics](docs/diagnostics.png?v=2)

---

## Installation

### Prerequisites

- **Node.js** 18+
- **npm** 9+
- A `_bmad-output/` folder with BMAD artifacts (this repo includes example artifacts)

### Quick Start

```bash
git clone https://github.com/mol4/BMAD-Board.git
cd BMAD-Board/BMAD\ board
npm install
npm run dev
```

The app opens as a **desktop window** powered by Electron.

### Production Build

```bash
npm run build
```

The packaged app is built into the `dist/` directory. You can also create an installer with:

```bash
npx electron-builder
```

---

## Usage

### Adding a Project

On first launch, the **Welcome** screen prompts you to add a project. You can also add projects at any time via the project switcher in the sidebar.

Each project needs:

| Field        | Description                                              |
| ------------ | -------------------------------------------------------- |
| **Name**     | Display name for the project                             |
| **Epics Dir**| Path to `planning-artifacts/` (where `epics.md` lives)   |
| **Stories Dir**| Path to `implementation-artifacts/` (where stories live) |

The app remembers all added projects in a local SQLite database and restores them on restart.

### Expected Folder Structure

```
your-project/
├── _bmad-output/
│   ├── planning-artifacts/       ← epics & planning docs
│   │   ├── epics.md              ← all epics in one file (## Epic N: Title)
│   │   ├── prd.md
│   │   ├── architecture.md
│   │   └── ...
│   └── implementation-artifacts/ ← stories & sprint status
│       ├── 1-1-some-story.md
│       ├── 1-2-another-story.md
│       ├── sprint-status.yaml
│       └── ...
```

BMAD Board can read from **any path** on your file system — the app is not tied to a specific location.

### Stories Mode

| Mode       | Description                                                                                                                            |
| ---------- | -------------------------------------------------------------------------------------------------------------------------------------- |
| **flat**   | All stories in a single folder. Linked to epics by filename pattern (`1-2-story-name.md` → EPIC-1, STORY-1.2) or frontmatter `epicId`. |
| **nested** | Stories in subdirectories matching epic filenames (`epic-1/story-1.md`).                                                               |

The mode is auto-detected per project and can be overridden in settings.

### File Synchronization

BMAD Board watches your project's artifact directories in real time:

- **External changes** — editing a `.md` file in your IDE triggers an immediate sync into the app
- **In-app changes** — editing in BMAD Board writes directly to disk and updates the file system
- **File locking** — when you start editing a document, the app acquires a lock so external agents know not to modify it concurrently

You can also trigger a manual re-sync at any time from the Diagnostics page.

---

## IPC API

The renderer process communicates with the main process over typed IPC channels:

| Channel                | Direction | Description                            |
| ---------------------- | --------- | -------------------------------------- |
| `project:list`         | invoke    | List all registered projects           |
| `project:add`          | invoke    | Register a new project                 |
| `project:remove`       | invoke    | Remove a project from the app          |
| `project:switch`       | invoke    | Update last-used metadata              |
| `project:update`       | invoke    | Rename or change project paths         |
| `config:read`          | invoke    | Read active project config             |
| `config:write`         | invoke    | Update active project config           |
| `file:read`            | invoke    | Read a file from disk                  |
| `file:write`           | invoke    | Write a file to disk                   |
| `file:lock`            | invoke    | Acquire a file lock                    |
| `file:unlock`          | invoke    | Release a file lock                    |
| `file:lockStatus`      | invoke    | Check lock status                      |
| `file:readDirectory`   | invoke    | List directory contents                |
| `watcher:watch`        | invoke    | Start watching project directories     |
| `watcher:stop`         | invoke    | Stop file watcher                      |
| `watcher:status`       | invoke    | Get watcher health status              |
| `file:changed`         | on        | File system change event (→ renderer)  |
| `watcher:error`        | on        | Watcher error event (→ renderer)       |
| `dialog:openDirectory` | invoke    | Native directory picker dialog         |
| `shell:openPath`       | invoke    | Open a path in the native file manager |
| `window:getState`      | invoke    | Check if window is maximized           |

---

## Tech Stack

- **Electron 33** — desktop shell
- **Vite 5** + **electron-vite** — build tooling
- **React 18** + TypeScript
- **React Router 6** — client-side routing
- **Zustand** — state management
- **Tailwind CSS** + `@tailwindcss/typography`
- **better-sqlite3** — local project metadata storage
- **gray-matter** — frontmatter parsing
- **marked** — markdown rendering
- **mermaid** — diagram rendering
- **shiki** — syntax highlighting
- **js-yaml** — sprint-status.yaml parsing
- **chokidar** — file system watching
- **lucide-react** — icons
- **Vitest** — unit testing
