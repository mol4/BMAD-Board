# API Contracts

**Part:** root (Web Application)
**Generated:** 2026-05-26

## Overview

BMAD Board exposes a REST API via Next.js App Router API routes. All endpoints operate on in-memory data that is synchronized from markdown files in the `_bmad-output/` directory.

## Endpoints

### Epics

| Method | Path | Description |
|--------|------|-------------|
| GET | `/api/epics` | List all epics with story counts |
| GET | `/api/epics?id=<id>` | Get single epic with stories |
| POST | `/api/epics` | Create new epic |
| PATCH | `/api/epics` | Update epic (status or fields) |
| DELETE | `/api/epics?id=<id>` | Delete epic and its stories |

#### GET /api/epics

**Query Parameters:**
- `id` (optional) — Epic ID or key to fetch single epic

**Response (list):**
```json
[
  {
    "id": "uuid",
    "key": "EPIC-1",
    "title": "string",
    "description": "string",
    "status": "draft|ready|in-progress|done",
    "priority": "critical|high|medium|low",
    "storyCount": 0,
    "doneCount": 0
  }
]
```

**Response (single):**
```json
{
  "id": "uuid",
  "key": "EPIC-1",
  "title": "string",
  "storiesData": []
}
```

#### POST /api/epics

**Request Body:**
```json
{
  "title": "string (required)",
  "description": "string",
  "priority": "critical|high|medium|low",
  "labels": ["string"]
}
```

**Response:** `201 Created` — Created epic object

#### PATCH /api/epics

**Request Body:**
```json
{
  "id": "uuid (required)",
  "status": "draft|ready|in-progress|done",
  "...other fields": "..."
}
```

**Response:** Updated epic object

#### DELETE /api/epics

**Query Parameters:**
- `id` (required) — Epic ID to delete

**Response:** `{ "success": true }`

---

### Stories

| Method | Path | Description |
|--------|------|-------------|
| GET | `/api/stories` | List all stories |
| GET | `/api/stories?id=<id>` | Get single story with tasks and epic |
| GET | `/api/stories?epicId=<id>` | Get stories by epic |
| GET | `/api/stories?status=<status>` | Get stories by status |
| POST | `/api/stories` | Create new story |
| PATCH | `/api/stories` | Update story (status or fields) |
| DELETE | `/api/stories?id=<id>` | Delete story |

#### GET /api/stories

**Query Parameters:**
- `id` (optional) — Story ID or key
- `epicId` (optional) — Filter by epic
- `status` (optional) — Filter by status

**Response (list):**
```json
[
  {
    "id": "uuid",
    "key": "STORY-1.1",
    "epicId": "uuid",
    "title": "string",
    "description": "string",
    "acceptanceCriteria": ["string"],
    "status": "backlog|todo|in-progress|in-review|done",
    "priority": "critical|high|medium|low",
    "storyPoints": 0,
    "assignee": "string",
    "tasks": ["task IDs"],
    "labels": ["string"]
  }
]
```

**Response (single):**
```json
{
  "id": "uuid",
  "key": "STORY-1.1",
  "tasksData": [],
  "epicData": {}
}
```

#### POST /api/stories

**Request Body:**
```json
{
  "epicId": "uuid (required)",
  "title": "string (required)",
  "description": "string",
  "acceptanceCriteria": ["string"],
  "priority": "critical|high|medium|low",
  "storyPoints": 0,
  "assignee": "string",
  "labels": ["string"]
}
```

**Response:** `201 Created` — Created story object

#### PATCH /api/stories

**Request Body:**
```json
{
  "id": "uuid (required)",
  "status": "backlog|todo|in-progress|in-review|done",
  "...other fields": "..."
}
```

**Response:** Updated story object

#### DELETE /api/stories

**Query Parameters:**
- `id` (required) — Story ID to delete

**Response:** `{ "success": true }`

---

### Tasks

| Method | Path | Description |
|--------|------|-------------|
| GET | `/api/tasks` | List all tasks |

---

### Documents

| Method | Path | Description |
|--------|------|-------------|
| GET | `/api/docs` | List planning documents |
| GET | `/api/docs/[id]` | Get document content |
| PUT | `/api/docs/[id]` | Update document content |

---

### Configuration

| Method | Path | Description |
|--------|------|-------------|
| GET | `/api/config` | Get current configuration |
| PATCH | `/api/config` | Update configuration (epicsDir, storiesDir, storiesMode) |
| DELETE | `/api/config` | Reset configuration to defaults |

#### PATCH /api/config

**Request Body:**
```json
{
  "epicsDir": "string",
  "storiesDir": "string",
  "storiesMode": "nested|flat"
}
```

---

### Sync

| Method | Path | Description |
|--------|------|-------------|
| POST | `/api/sync` | Re-sync from filesystem markdown files |

**Response:**
```json
{
  "epics": 0,
  "stories": 0
}
```

---

### Diagnostics

| Method | Path | Description |
|--------|------|-------------|
| GET | `/api/diagnostics` | File system and configuration health checks |

---

## Authentication

No authentication required. This is a local development tool.

## Error Responses

| Status | Description |
|--------|-------------|
| 400 | Invalid request body or missing required field |
| 404 | Resource not found |
