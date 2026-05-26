# Data Models

**Part:** root (Web Application)
**Generated:** 2026-05-26

## Overview

BMAD Board uses an in-memory data model that mirrors Jira-like project management entities. Data is persisted as markdown files in the `_bmad-output/` directory and loaded into memory on demand.

## Entity Types

### Epic

Represents a large body of work that can be broken down into stories.

| Field | Type | Description |
|-------|------|-------------|
| `id` | string (UUID) | Unique identifier |
| `key` | string | Human-readable key (e.g., `EPIC-1`) |
| `title` | string | Epic name |
| `description` | string | Epic description (markdown) |
| `status` | EpicStatus | Current status |
| `priority` | Priority | Priority level |
| `stories` | string[] | Array of story IDs |
| `labels` | string[] | Tags/labels |
| `createdAt` | string (ISO) | Creation timestamp |
| `updatedAt` | string (ISO) | Last update timestamp |
| `sourceFile` | string (optional) | Path to source .md file |
| `rawMarkdown` | string (optional) | Raw markdown content |

**EpicStatus:** `draft` | `ready` | `in-progress` | `done`

**Auto-recalculation:** Epic status is automatically recalculated based on child story statuses:
- `draft` — no stories
- `ready` — all stories in backlog/todo
- `in-progress` — at least one story in progress/review
- `done` — all stories done

---

### Story

Represents a user story within an epic.

| Field | Type | Description |
|-------|------|-------------|
| `id` | string (UUID) | Unique identifier |
| `key` | string | Human-readable key (e.g., `STORY-1.1`) |
| `epicId` | string | Parent epic ID |
| `title` | string | Story title |
| `description` | string | Story description (markdown) |
| `acceptanceCriteria` | string[] | Acceptance criteria list |
| `status` | StoryStatus | Current status |
| `priority` | Priority | Priority level |
| `storyPoints` | number (optional) | Story points estimate |
| `assignee` | string (optional) | Assigned person |
| `tasks` | string[] | Array of task IDs |
| `labels` | string[] | Tags/labels |
| `createdAt` | string (ISO) | Creation timestamp |
| `updatedAt` | string (ISO) | Last update timestamp |
| `sourceFile` | string (optional) | Path to source .md file |
| `rawMarkdown` | string (optional) | Raw markdown content |

**StoryStatus:** `backlog` | `todo` | `in-progress` | `in-review` | `done`

---

### Task

Represents a sub-task within a story.

| Field | Type | Description |
|-------|------|-------------|
| `id` | string (UUID) | Unique identifier |
| `key` | string | Human-readable key (e.g., `TASK-1`) |
| `storyId` | string | Parent story ID |
| `title` | string | Task title |
| `description` | string | Task description |
| `status` | TaskStatus | Current status |
| `priority` | Priority | Priority level |
| `assignee` | string (optional) | Assigned person |
| `createdAt` | string (ISO) | Creation timestamp |
| `updatedAt` | string (ISO) | Last update timestamp |

**TaskStatus:** `todo` | `in-progress` | `done`

---

### Sprint

Represents a sprint/iteration.

| Field | Type | Description |
|-------|------|-------------|
| `id` | string (UUID) | Unique identifier |
| `name` | string | Sprint name |
| `goal` | string (optional) | Sprint goal |
| `startDate` | string (optional) | Start date |
| `endDate` | string (optional) | End date |
| `status` | SprintStatus | Sprint status |
| `storyIds` | string[] | Stories in this sprint |

**SprintStatus:** `planning` | `active` | `completed`

---

### BoardColumn

Represents a column on the Kanban board.

| Field | Type | Description |
|-------|------|-------------|
| `id` | StoryStatus | Column identifier (matches story status) |
| `title` | string | Display title |
| `stories` | Story[] | Stories in this column |

---

## Priority Levels

| Value | Description |
|-------|-------------|
| `critical` | Highest priority |
| `high` | High priority |
| `medium` | Default priority |
| `low` | Low priority |

---

## Data Persistence

### Source Formats

| Entity | Source | Format |
|--------|--------|--------|
| Epics | `_bmad-output/planning-artifacts/` | Individual `.md` files or aggregated `epics.md` |
| Stories | `_bmad-output/implementation-artifacts/` | Individual `.md` files |
| Sprint Status | `sprint-status.yaml` | YAML file |

### Markdown Frontmatter

**Epic Frontmatter:**
```yaml
id: 1
title: Epic Title
status: in-progress
priority: high
labels: [label1, label2]
```

**Story Frontmatter:**
```yaml
id: 1.1
title: Story Title
epicId: 1
status: todo
priority: medium
storyPoints: 5
assignee: John
labels: [label1]
```

### In-Memory Store

Data is stored in a singleton `Store` class using JavaScript `Map` collections:
- `epics: Map<string, Epic>`
- `stories: Map<string, Story>`
- `tasks: Map<string, Task>`
- `sprints: Map<string, Sprint>`

The store uses `globalThis.__store` pattern to persist across Next.js hot reloads.
