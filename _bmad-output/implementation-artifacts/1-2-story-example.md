# Story 1.2: User Registration & Login

Status: done

## Story

As a user,
I want to register with email and password and log in securely,
so that my projects and tasks are saved to my account.

## Acceptance Criteria

1. **Registration** (`POST /api/auth/register`):
   - Given a valid email and password where email does not exist, returns `201 Created` with `{ "id": "uuid", "email": "string" }`. Password hashed with bcrypt (cost factor 12).
   - Given an email that already exists, returns `409 Conflict` with `{ "error": "email_already_exists" }`.

2. **Login** (`POST /api/auth/login`):
   - Given correct credentials, returns `200 OK` with `{ "accessToken": "<jwt>", "expiresIn": 900 }` and sets an `HttpOnly; Secure; SameSite=Strict` cookie with 7-day refresh token.
   - Given incorrect credentials, returns `401 Unauthorized` with `{ "error": "invalid_credentials" }`.

3. **Token Refresh** (`POST /api/auth/refresh`):
   - Given a valid refresh token cookie, returns new access token and rotates the refresh token.

4. **Logout** (`POST /api/auth/logout`):
   - Given a valid JWT, revokes the refresh token and returns `204 No Content`.

5. **Protected Endpoints**:
   - Any request to a protected endpoint without a valid JWT returns `401 Unauthorized`.

## Tasks / Subtasks

- [x] Task 1: Configure JWT authentication middleware (AC: 5)
  - [x] Install `jsonwebtoken` and `bcryptjs` packages
  - [x] Create auth middleware that validates JWT from `Authorization: Bearer` header
  - [x] Apply middleware to all routes except `/api/auth/*` and `/health`

- [x] Task 2: Implement auth service (AC: 1, 2, 3, 4)
  - [x] Create `AuthService` class with methods: `register`, `login`, `refresh`, `logout`
  - [x] Hash passwords with bcrypt (cost factor 12)
  - [x] Generate JWT (HS256, 15-min expiry, claims: sub + email)
  - [x] Generate refresh token (crypto.randomBytes), hash with SHA256 before DB storage
  - [x] Token rotation on refresh: revoke old, issue new

- [x] Task 3: Create auth API routes (AC: 1, 2, 3, 4)
  - [x] `POST /api/auth/register` — validate email format + password length (min 8)
  - [x] `POST /api/auth/login` — validate credentials, set refresh token cookie
  - [x] `POST /api/auth/refresh` — read cookie, rotate token
  - [x] `POST /api/auth/logout` — revoke token, clear cookie

- [x] Task 4: Create request/response DTOs (AC: 1-4)
  - [x] Zod schemas for request validation
  - [x] Typed response interfaces

- [x] Task 5: Write integration tests (AC: 1-5)
  - [x] Test registration success and duplicate email
  - [x] Test login success and failure
  - [x] Test token refresh and rotation
  - [x] Test logout and token revocation
  - [x] Test protected endpoint without JWT

## Dev Notes

### Key Implementation Details

- **bcrypt cost factor:** 12 (balance between security and speed for MVP)
- **JWT claims:** `{ sub: userId, email: userEmail }` — minimal claims
- **Refresh token storage:** SHA256 hash in `RefreshToken.tokenHash` column; raw token in cookie
- **Cookie config:** `httpOnly: true, secure: true, sameSite: 'strict', path: '/api/auth', maxAge: 7 * 24 * 60 * 60 * 1000`

### Files Created

```
api/
  src/
    middleware/
      auth.ts           # JWT validation middleware
    services/
      auth.service.ts   # Registration, login, refresh, logout logic
    routes/
      auth.routes.ts    # Express router for /api/auth/*
    schemas/
      auth.schema.ts    # Zod validation schemas
  tests/
    auth.test.ts        # Integration tests
```
