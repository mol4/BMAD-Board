---
stepsCompleted:
  [
    step-01-validate-prerequisites,
    step-02-design-epics,
    step-03-create-stories,
    step-04-final-validation,
  ]
status: complete
inputDocuments:
  - _bmad-output/planning-artifacts/prd.md
  - _bmad-output/planning-artifacts/architecture.md
  - _bmad-output/planning-artifacts/ux-design-specification.md
lastUpdated: "2026-03-25"
---

# TaskFlow — Epic Breakdown

## Overview

This document provides the complete epic and story breakdown for TaskFlow, decomposing the requirements from the PRD, UX Design Specification, and Architecture decisions into implementable stories.

## Requirements Inventory

### Functional Requirements

FR1: User can register with email and password
FR2: User can log in and receive JWT access + refresh tokens
FR3: User can create a project with a name and description
FR4: User can invite team members to a project by email
FR5: User can create a task with title, description, priority, assignee, due date
FR6: User can edit any field of a task
FR7: User can delete a task (soft delete with confirmation)
FR8: Kanban board displays tasks in columns: To Do, In Progress, Review, Done
FR9: User can drag and drop tasks between columns
FR10: All task changes broadcast via WebSocket
FR11: User can filter tasks by assignee, priority, and status
FR12: User can search tasks by title

### Non-Functional Requirements

NFR1: Board loads in < 1 second with up to 200 tasks
NFR2: WebSocket latency < 500ms
NFR3: Passwords hashed with bcrypt
NFR4: All API endpoints require valid JWT except login/register
NFR5: Browser support: Chrome, Firefox, Edge (last 2 versions)
NFR6: Docker Compose for local development

### UX Design Requirements

UX-DR1: Blue/slate color palette with CSS variables
UX-DR2: Task cards: title, priority badge, assignee avatar, due date
UX-DR3: Drag-and-drop with 200ms animation
UX-DR4: Empty board state prompt
UX-DR5: Dark/light theme toggle
UX-DR6: Desktop-first responsive layout

### FR Coverage Map

FR1 → Epic 1 — User registration
FR2 → Epic 1 — JWT authentication
FR3 → Epic 1 — Project creation
FR5 → Epic 2 — Task creation
FR6 → Epic 2 — Task editing
FR8 → Epic 2 — Kanban board
FR9 → Epic 2 — Drag and drop

UX-DR1 → Epic 1 — Color palette and design tokens
UX-DR2 → Epic 2 — Task card component
UX-DR3 → Epic 2 — Drag-and-drop animation
UX-DR5 → Epic 1 — Theme toggle

## Epic List

### Epic 1: Project Setup & User Authentication

Development foundation is in place: Docker Compose runs all services; users can register and log in; projects can be created; the design system is configured with theme support.
**FRs covered:** FR1, FR2, FR3
**UX-DRs covered:** UX-DR1, UX-DR5
**Arch requirements covered:** Docker Compose 3 services, Express + Prisma, JWT + refresh tokens, PostgreSQL setup

### Epic 2: Task Management & Board View

Users can create, edit, and manage tasks on a Kanban board with drag-and-drop, real-time updates, and filtering.
**FRs covered:** FR5, FR6, FR7, FR8, FR9, FR10, FR11, FR12
**UX-DRs covered:** UX-DR2, UX-DR3, UX-DR4, UX-DR6
**Arch requirements covered:** WebSocket server, task CRUD API, board queries with indexes

---

## Epic 1: Project Setup & User Authentication

Development foundation is in place: Docker Compose runs all three services; users can register and log in with JWT authentication; the design system (Tailwind + shadcn/ui) is configured with dark/light theme.

### Story 1.1: Project Scaffolding & Dev Environment

As a developer,
I want a Docker Compose environment with all services starting from a single command,
So that the team has a consistent dev stack and features can be built on a stable foundation.

**Acceptance Criteria:**

**Given** the repository is cloned and Docker is installed
**When** the developer runs `docker compose up`
**Then** all 3 services start successfully: `frontend` (port 3000), `api` (port 4000), `postgres` (port 5432)
**And** health checks pass for all services within 30 seconds

**Given** the postgres service is running
**When** the api service starts for the first time
**Then** Prisma migrations run automatically, creating the `User`, `RefreshToken`, and `Project` tables

**Given** all services are running
**When** the developer sends `GET http://localhost:4000/health`
**Then** the API responds with `200 OK` and status showing postgres is reachable

**Given** the frontend is running
**When** the developer opens `http://localhost:3000`
**Then** the React app loads with Tailwind CSS and shadcn/ui components working
**And** dark/light theme toggle is functional

---

### Story 1.2: User Registration & Login

As a user,
I want to register with email and password and log in securely,
So that my projects and tasks are saved to my account.

**Acceptance Criteria:**

**Given** a user sends `POST /api/auth/register` with a valid email and password
**When** the email does not already exist
**Then** the system returns `201 Created` with `{ "id": "uuid", "email": "string" }`
**And** the password is stored hashed with bcrypt (cost factor 12)

**Given** a user sends `POST /api/auth/register` with an existing email
**Then** the system returns `409 Conflict` with `{ "error": "email_already_exists" }`

**Given** a registered user sends `POST /api/auth/login` with correct credentials
**Then** the system returns `200 OK` with `{ "accessToken": "<jwt>", "expiresIn": 900 }`
**And** sets an `HttpOnly; Secure; SameSite=Strict` cookie with the refresh token (7-day expiry)

**Given** a user sends `POST /api/auth/login` with wrong credentials
**Then** the system returns `401 Unauthorized` with `{ "error": "invalid_credentials" }`

**Given** a user has a valid refresh token cookie
**When** sending `POST /api/auth/refresh`
**Then** the system returns a new access token and rotates the refresh token

**Given** a request is made to any protected endpoint without a JWT
**Then** the system returns `401 Unauthorized`

---

## Epic 2: Task Management & Board View

Users can create, edit, delete, and organize tasks on a drag-and-drop Kanban board with real-time updates visible to all team members.

### Story 2.1: Task CRUD API

As a team member,
I want to create, view, edit, and delete tasks in a project,
So that I can manage my team's work items.

**Acceptance Criteria:**

**Given** a logged-in user with project access sends `POST /api/projects/:id/tasks` with `{ "title": "Fix login bug" }`
**Then** the system returns `201 Created` with the full task object (status defaults to `TODO`, priority defaults to `MEDIUM`)

**Given** a task exists in a project
**When** a user sends `PATCH /api/projects/:id/tasks/:taskId` with `{ "status": "IN_PROGRESS" }`
**Then** the task status is updated and `200 OK` is returned
**And** a `task.updated` WebSocket event is broadcast to all connected project members

**Given** a user sends `DELETE /api/projects/:id/tasks/:taskId`
**Then** the task is soft-deleted and `204 No Content` is returned

**Given** a user sends `GET /api/projects/:id/tasks?status=TODO&priority=HIGH`
**Then** only tasks matching the filter criteria are returned

**Given** a user sends `GET /api/projects/:id/tasks?q=login`
**Then** tasks with "login" in the title are returned (case-insensitive)

---

### Story 2.2: Kanban Board UI

As a team member,
I want to see tasks on a visual Kanban board and drag them between columns,
So that I can quickly update task status and see the team's progress at a glance.

**Acceptance Criteria:**

**Given** a user opens a project's board page
**Then** tasks are displayed in 4 columns: To Do, In Progress, Review, Done
**And** each task card shows: title, priority badge (color-coded), assignee avatar, and due date
**And** the board loads in under 1 second

**Given** a user drags a task card from "To Do" to "In Progress"
**Then** the card animates smoothly (200ms) into the new column
**And** a `PATCH` request updates the task status on the server
**And** all other connected users see the card move in real time via WebSocket

**Given** a project has no tasks
**Then** the board shows an empty state: "No tasks yet. Create your first task to get started."
**And** a prominent "Create Task" button is displayed

**Given** a user clicks the "Create Task" button
**Then** a modal opens with fields: title (required), description, priority dropdown, assignee dropdown, due date picker
**And** submitting the form creates the task and adds the card to the "To Do" column instantly

**Given** another team member creates or moves a task
**Then** the board updates in real time without the user refreshing the page
