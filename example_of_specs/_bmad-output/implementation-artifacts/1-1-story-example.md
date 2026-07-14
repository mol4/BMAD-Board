# Story 1.1: Project Scaffolding & Dev Environment

Status: done

## Story

As a developer,
I want a Docker Compose environment with all services starting from a single command,
so that the team has a consistent dev stack and features can be built on a stable foundation.

## Acceptance Criteria

1. **All 3 services start successfully:** Running `docker compose up` starts `frontend` (port 3000), `api` (port 4000), and `postgres` (port 5432). Health checks pass within 30 seconds.

2. **Database migrations run automatically:** On first api startup, Prisma migrations run, creating `User`, `RefreshToken`, and `Project` tables.

3. **Health check endpoint works:** `GET http://localhost:4000/health` returns `200 OK` with status confirming postgres is reachable.

4. **Frontend loads correctly:** Opening `http://localhost:3000` renders the React app with Tailwind CSS and shadcn/ui components. Dark/light theme toggle works.

## Tasks / Subtasks

- [x] Create `docker-compose.yml` in repo root (AC: 1)
  - [x] Define 3 services: frontend, api, postgres
  - [x] Configure port mappings and health checks
  - [x] Set `restart: unless-stopped` on all services
- [x] Create `.env.example` with required env vars (AC: 1)
  - [x] PostgreSQL connection string, JWT secret
- [x] Scaffold Node.js + Express `api` project (AC: 2, 3)
  - [x] Initialize TypeScript project with Express
  - [x] Add Prisma ORM and configure PostgreSQL connection
  - [x] Create initial Prisma schema with User, RefreshToken, Project models
  - [x] Add auto-migrate on startup (`prisma migrate deploy`)
  - [x] Implement `GET /health` endpoint
- [x] Scaffold React + Vite `frontend` project (AC: 4)
  - [x] Initialize with Vite + React + TypeScript
  - [x] Add Tailwind CSS and shadcn/ui
  - [x] Implement dark/light theme toggle
- [x] Verify `docker compose up` starts all services and health checks pass (AC: 1-4)

## Dev Notes

### Docker Compose Services

```yaml
services:
  frontend:
    build: ./frontend
    ports: ["3000:3000"]
    depends_on:
      api:
        condition: service_healthy

  api:
    build: ./api
    ports: ["4000:4000"]
    environment:
      DATABASE_URL: postgresql://app:secret@postgres:5432/taskflow
      JWT_SECRET: dev-secret-min-32-characters-long
    depends_on:
      postgres:
        condition: service_healthy
    healthcheck:
      test: ["CMD", "curl", "-f", "http://localhost:4000/health"]
      interval: 10s
      timeout: 5s
      retries: 3

  postgres:
    image: postgres:16
    environment:
      POSTGRES_USER: app
      POSTGRES_PASSWORD: secret
      POSTGRES_DB: taskflow
    ports: ["5432:5432"]
    volumes:
      - pgdata:/var/lib/postgresql/data
    healthcheck:
      test: ["CMD-SHELL", "pg_isready -U app"]
      interval: 5s
      timeout: 3s
      retries: 5

volumes:
  pgdata:
```

### Environment Variables (.env)

```
DATABASE_URL=postgresql://app:secret@postgres:5432/taskflow
JWT_SECRET=your-secret-key-at-least-32-characters
```
