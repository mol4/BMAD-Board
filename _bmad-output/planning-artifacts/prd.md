---
stepsCompleted:
  [
    step-01-init,
    step-02-discovery,
    step-02b-vision,
    step-02c-executive-summary,
    step-03-success-criteria,
    step-04-user-journey,
    step-05-feature-requirements,
    step-06-technical-requirements,
    step-07-constraints,
    step-08-risk-assessment,
    step-09-competitive-analysis,
    step-10-monetization,
    step-11-roadmap,
    step-12-acceptance-criteria,
    step-13-signoff,
  ]
status: complete
inputDocuments:
  - _bmad-output/planning-artifacts/ux-design-specification.md
workflowType: "prd"
classification:
  projectType: web_app
  domain: productivity
  complexity: medium
  projectContext: greenfield
lastEdited: "2026-03-25"
---

# Product Requirements Document — TaskFlow

**Author:** PM
**Date:** 2026-03-24

## Executive Summary

TaskFlow is a lightweight project management web application for small teams. Users create projects, add tasks with priorities and deadlines, and track progress on a Kanban board. The app focuses on speed and simplicity — no bloat, no steep learning curve.

**North Star Metric:** _Active tasks managed per team per week._

**Target users:** Small development teams (3–10 people) who need a fast, self-hosted task tracker without enterprise overhead.

**Problem:** Existing tools (Jira, Asana, Monday) are over-engineered for small teams. Setup takes hours, the UI is cluttered, and most features go unused. Teams resort to spreadsheets or sticky notes.

**Why now:** Modern frontend frameworks and component libraries make it possible to build a polished, fast task board in weeks rather than months.

---

## Success Criteria

### User Success

- User creates a project and adds first task within 2 minutes of signing up
- Team members can see task updates in real time without refreshing
- Task board loads in under 1 second on standard broadband

### Business Success

**Phase 1 — MVP:**

- Creator and 2+ teammates use it daily for 4 weeks
- Core CRUD operations work reliably
- Board view renders correctly with 100+ tasks

**Phase 2 — Early Adopters:**

- 5–10 teams using actively
- Average session length ≥ 10 minutes

### Measurable Outcomes

| Metric                        | Target           | Phase |
| ----------------------------- | ---------------- | ----- |
| Time to first task created    | ≤ 2 minutes      | MVP   |
| Board load time               | < 1 second       | MVP   |
| Tasks per active project      | ≥ 20             | MVP   |
| Weekly active teams           | 5–10             | Early |
| User-reported bugs per week   | < 3              | Early |

---

## Product Scope

### MVP — Minimum Viable Product

1. **User Authentication** — register and log in with email/password; JWT-based sessions
2. **Project Management** — create, rename, archive projects
3. **Task CRUD** — create, edit, delete tasks with title, description, priority, assignee, due date
4. **Kanban Board** — drag-and-drop columns: To Do, In Progress, Review, Done
5. **Real-time Updates** — task changes visible to all team members via WebSocket
6. **Search & Filter** — filter tasks by assignee, priority, status; full-text search on title

### Growth Features (Post-MVP)

1. Labels and tags
2. File attachments
3. Activity log / audit trail
4. Email notifications
5. Calendar view
6. API for integrations

---

## User Journey Mapping

### Journey 1: New Team Setup

**Stage 1 — Sign Up**
- Team lead registers, creates a project called "Sprint 12"
- Invites 3 teammates via email

**Stage 2 — First Session**
- Adds 10 tasks from the sprint planning meeting
- Assigns tasks to team members
- Drags 2 tasks to "In Progress"

**Stage 3 — Daily Use**
- Team members open the board, see their assignments
- Move tasks across columns as work progresses
- Board updates in real time for everyone

---

## Functional Requirements

FR1: User can register with email and password; system stores hashed credentials
FR2: User can log in and receive a JWT access token (15 min) + refresh token (7 day)
FR3: User can create a project with a name and optional description
FR4: User can invite team members to a project by email
FR5: User can create a task with: title (required), description, priority (low/medium/high/critical), assignee, due date
FR6: User can edit any field of a task they have access to
FR7: User can delete a task (soft delete with confirmation)
FR8: Kanban board displays tasks in columns: To Do, In Progress, Review, Done
FR9: User can drag and drop tasks between columns; status updates immediately
FR10: All task changes broadcast to connected clients via WebSocket
FR11: User can filter tasks by assignee, priority, and status
FR12: User can search tasks by title (full-text, case-insensitive)

## Non-Functional Requirements

NFR1: Board loads in < 1 second with up to 200 tasks
NFR2: WebSocket latency < 500ms for task updates
NFR3: Passwords hashed with bcrypt (cost factor 12)
NFR4: All API endpoints require valid JWT except login/register
NFR5: Browser support: Chrome, Firefox, Edge (last 2 versions)
NFR6: WCAG 2.1 AA for all interactive elements
NFR7: PostgreSQL with daily backups
NFR8: Docker Compose for local development; single `docker compose up`

## UX Design Requirements

UX-DR1: Clean, minimal UI with a blue/slate color palette
UX-DR2: Task cards show title, priority badge, assignee avatar, and due date
UX-DR3: Drag-and-drop uses smooth 200ms animation
UX-DR4: Empty board state shows a friendly prompt: "Create your first task"
UX-DR5: Dark and light theme toggle in the header
UX-DR6: Responsive layout — desktop-first, usable on tablets

---

## Technical Stack

- **Frontend:** React 18 + Vite + Tailwind CSS + shadcn/ui
- **Backend:** Node.js + Express + Prisma ORM
- **Database:** PostgreSQL 16
- **Real-time:** WebSocket (ws library)
- **Auth:** JWT (access + refresh tokens)
- **Infrastructure:** Docker Compose (3 services: frontend, api, postgres)

---

## Constraints

- MVP is self-hosted only (no managed cloud version)
- No mobile app for MVP — responsive web only
- Maximum 10 team members per project in MVP
- No file storage in MVP

## Risk Assessment

| Risk                           | Likelihood | Impact | Mitigation                              |
| ------------------------------ | ---------- | ------ | --------------------------------------- |
| WebSocket scaling under load   | Medium     | Medium | Connection pooling; fallback to polling |
| Drag-and-drop browser compat   | Low        | High   | Use dnd-kit library (well-tested)       |
| JWT token theft                | Low        | High   | HttpOnly cookies; short expiry          |
