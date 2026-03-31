---
stepsCompleted: [1, 2, 3, 4, 5, review]
reviewedAt: "2026-03-25"
inputDocuments:
  - _bmad-output/planning-artifacts/prd.md
  - _bmad-output/planning-artifacts/ux-design-specification.md
workflowType: "architecture"
project_name: "TaskFlow"
date: "2026-03-25"
---

# Architecture Decision Document

## Architecture Decision Records

### ADR-1: Backend Framework — Node.js + Express

**Status:** Accepted

**Context:**
The team has the most experience with JavaScript/TypeScript. The MVP needs to ship fast. Express is well-understood and has a massive ecosystem.

**Decision:**
Use Node.js 20 LTS with Express 4 and TypeScript. Prisma ORM for database access.

**Trade-offs:**

| Criteria        | Express (chosen) | .NET Minimal API | FastAPI (Python) |
| --------------- | ---------------- | ---------------- | ---------------- |
| Team experience | High             | Low              | Medium           |
| Setup speed     | Fast             | Medium           | Fast             |
| Type safety     | TS (good)        | Excellent        | Moderate         |
| ORM             | Prisma           | EF Core          | SQLAlchemy       |

**Consequences:**
- Prisma schema is the single source of truth for DB schema
- All migrations via `prisma migrate dev`
- TypeScript strict mode enabled

---

### ADR-2: Authentication — JWT with Refresh Tokens

**Status:** Accepted

**Context:**
PRD requires email/password auth with persistent sessions. OAuth is out of scope for MVP.

**Decision:**
JWT access tokens (15 min, HS256) + refresh tokens (7 days, stored hashed in DB). Refresh token in HttpOnly cookie.

**Consequences:**
- Access token in response body; frontend stores in memory (not localStorage)
- Refresh token rotation on every refresh call
- `POST /api/auth/refresh` reads cookie, returns new access token

---

### ADR-3: Real-time — WebSocket (ws library)

**Status:** Accepted

**Context:**
Task updates must be visible to all team members without page refresh. SSE is one-directional; WebSocket supports bidirectional communication.

**Decision:**
Use the `ws` library on Express. Each project gets a "room." When a task is created/updated/deleted, the server broadcasts the event to all connected clients in that project room.

**Message format:**
```json
{
  "type": "task.updated",
  "payload": {
    "taskId": "uuid",
    "changes": { "status": "in_progress" }
  }
}
```

**Consequences:**
- Frontend reconnects automatically on disconnect (exponential backoff)
- No persistence of WebSocket messages — clients fetch full state on reconnect
- MVP: single server instance, no Redis pub/sub needed

---

### ADR-4: Database — PostgreSQL 16

**Status:** Accepted

**Decision:**
PostgreSQL 16 via Docker. Prisma ORM manages schema and migrations.

**Key indexes:**
- `tasks(project_id, status)` — board queries
- `tasks(assignee_id)` — "my tasks" filter
- `projects(owner_id)` — user's projects

---

### ADR-5: Infrastructure — Docker Compose

**Status:** Accepted

**Decision:**
Three-service Docker Compose for local development:

```yaml
services:
  frontend:    # React + Vite, port 3000
  api:         # Node.js + Express, port 4000
  postgres:    # PostgreSQL 16, port 5432
```

**Consequences:**
- `docker compose up` starts everything
- Prisma migrations run on API startup
- Hot reload enabled for both frontend and API in dev mode

---

## Data Model

```prisma
model User {
  id           String   @id @default(uuid())
  email        String   @unique
  passwordHash String
  displayName  String?
  createdAt    DateTime @default(now())
  updatedAt    DateTime @updatedAt

  ownedProjects  Project[]
  memberships    ProjectMember[]
  assignedTasks  Task[]         @relation("assignee")
  createdTasks   Task[]         @relation("creator")
  refreshTokens  RefreshToken[]
}

model RefreshToken {
  id        String   @id @default(uuid())
  tokenHash String
  userId    String
  user      User     @relation(fields: [userId], references: [id])
  expiresAt DateTime
  isRevoked Boolean  @default(false)
  createdAt DateTime @default(now())
}

model Project {
  id          String   @id @default(uuid())
  name        String
  description String?
  ownerId     String
  owner       User     @relation(fields: [ownerId], references: [id])
  createdAt   DateTime @default(now())
  updatedAt   DateTime @updatedAt

  members ProjectMember[]
  tasks   Task[]
}

model ProjectMember {
  id        String  @id @default(uuid())
  projectId String
  project   Project @relation(fields: [projectId], references: [id])
  userId    String
  user      User    @relation(fields: [userId], references: [id])
  role      Role    @default(MEMBER)

  @@unique([projectId, userId])
}

enum Role {
  OWNER
  ADMIN
  MEMBER
}

model Task {
  id          String    @id @default(uuid())
  title       String
  description String?
  status      Status    @default(TODO)
  priority    Priority  @default(MEDIUM)
  position    Int       @default(0)
  dueDate     DateTime?
  projectId   String
  project     Project   @relation(fields: [projectId], references: [id])
  assigneeId  String?
  assignee    User?     @relation("assignee", fields: [assigneeId], references: [id])
  creatorId   String
  creator     User      @relation("creator", fields: [creatorId], references: [id])
  createdAt   DateTime  @default(now())
  updatedAt   DateTime  @updatedAt
}

enum Status {
  TODO
  IN_PROGRESS
  REVIEW
  DONE
}

enum Priority {
  LOW
  MEDIUM
  HIGH
  CRITICAL
}
```

---

## API Contracts

### Auth

| Method | Endpoint             | Request Body                    | Response                                 |
| ------ | -------------------- | ------------------------------- | ---------------------------------------- |
| POST   | /api/auth/register   | `{ email, password }`           | `201 { id, email }`                      |
| POST   | /api/auth/login      | `{ email, password }`           | `200 { accessToken, expiresIn }` + cookie |
| POST   | /api/auth/refresh    | (cookie)                        | `200 { accessToken, expiresIn }`         |
| POST   | /api/auth/logout     | —                               | `204 No Content`                         |

### Projects

| Method | Endpoint                    | Request Body                 | Response                           |
| ------ | --------------------------- | ---------------------------- | ---------------------------------- |
| POST   | /api/projects               | `{ name, description? }`    | `201 { id, name, ... }`           |
| GET    | /api/projects               | —                            | `200 [ { id, name, taskCount } ]` |
| GET    | /api/projects/:id           | —                            | `200 { id, name, members, ... }`  |
| PATCH  | /api/projects/:id           | `{ name?, description? }`   | `200 { id, name, ... }`           |
| POST   | /api/projects/:id/invite    | `{ email }`                  | `201 { memberId }`                |

### Tasks

| Method | Endpoint                         | Request Body                                      | Response                    |
| ------ | -------------------------------- | ------------------------------------------------- | --------------------------- |
| POST   | /api/projects/:id/tasks          | `{ title, description?, priority?, assigneeId? }`  | `201 { id, title, ... }`   |
| GET    | /api/projects/:id/tasks          | query: `?status=&assignee=&priority=&q=`           | `200 [ tasks ]`            |
| PATCH  | /api/projects/:id/tasks/:taskId  | `{ title?, status?, priority?, assigneeId?, ... }` | `200 { id, title, ... }`   |
| DELETE | /api/projects/:id/tasks/:taskId  | —                                                  | `204 No Content`            |

### WebSocket

| Event            | Direction        | Payload                                  |
| ---------------- | ---------------- | ---------------------------------------- |
| task.created     | Server → Client  | `{ task: { id, title, status, ... } }`   |
| task.updated     | Server → Client  | `{ taskId, changes: { ... } }`           |
| task.deleted     | Server → Client  | `{ taskId }`                             |
| join.project     | Client → Server  | `{ projectId }`                          |
| leave.project    | Client → Server  | `{ projectId }`                          |

---

## Component Diagram

```
┌─────────────────────────────────────────────┐
│                   Browser                    │
│  React + Vite + Tailwind + shadcn/ui        │
│  ┌──────────┐  ┌──────────┐  ┌───────────┐ │
│  │ AuthPage │  │BoardView │  │ TaskModal │  │
│  └──────────┘  └──────────┘  └───────────┘  │
│         HTTP REST    │     WebSocket         │
└──────────────────────┼───────────────────────┘
                       │
                       ▼
┌──────────────────────────────────────────────┐
│              API Server (Express)             │
│  ┌──────────┐  ┌───────────┐  ┌───────────┐ │
│  │AuthRoutes│  │TaskRoutes │  │ WS Server │  │
│  └──────────┘  └───────────┘  └───────────┘  │
│         Prisma ORM                           │
└──────────────────────┬───────────────────────┘
                       │
                       ▼
              ┌─────────────────┐
              │  PostgreSQL 16  │
              └─────────────────┘
```
