# Backend API - server.js

This document describes the HTTP endpoints exposed by the local Express server (`backend/server.js`). It includes method, path, example request/response shapes, and notes about required environment variables and auth.

Base URL (local):

- http://localhost:3001

Environment

- The server reads credentials from `backend/.env` (used by Supabase client and DB access):
    - `SUPABASE_URL` - your Supabase project URL
    - `SUPABASE_SERVICE_ROLE_KEY` - service role key for server-side operations
    - `DATABASE_URL` - (used by direct DB scripts)

Health

- GET /health
    - Response: 200
    - Body: {"status": "OK", "timestamp": "..."}

Workouts

- GET /api/workouts
    - Returns list of workouts.
    - Response: 200 JSON array of workout objects
        - Workout fields (camelCase): id, title, category, description, workoutType, sets, reps, duration, intensity, imageUrl, isGlobal, createdBy, createdAt, updatedAt

- POST /api/workouts
    - Create a new workout.
    - Request body (JSON):
      {
      "title": "string",
      "category": "string",
      "description": "string?",
      "sets": number?,
      "reps": number?,
      "duration": number?,
      "intensity": "string?",
      "imageUrl": "string?",
      "createdBy": "string?"
      }
    - Response: 201 created workout object (same shape as GET)

- GET /api/workouts/:id
    - Returns single workout by id.

- PUT /api/workouts/:id
    - Update workout fields (partial allowed).

- DELETE /api/workouts/:id
    - Delete workout (204 No Content)

Workout Plans (Routines)

- GET /api/workout-plans
    - Returns workout plans with nested plan items and (after consolidation) plan item scheduledDate
    - Each plan: id, name, startDate, endDate, userId, createdAt, updatedAt, planItems[]
    - Each planItem: id, workoutId, workoutPlanId, scheduledDate, intensity, createdAt, updatedAt, workout

- POST /api/workout-plans
    - Create a workout plan
    - Request body example:
      { "isRoutine": true, "userId": "<id>" }

- POST /api/workout-plans/:id/plan-items
    - Add a plan item to a plan. Accepts either explicit `dates` (array of YYYY-MM-DD) or a `frequency` token that the server expands into dated occurrences.
    - Request body examples:
      { "workoutId": "<id>", "dates": ["2025-11-03"] }
      { "workoutId": "<id>", "frequency": "Fri,Sun" }
    - Returns created plan item row (with nested plan_item_dates if present) or created dated plan_items after consolidation.

- DELETE /api/plan-items/:id
    - Delete a single plan item (or a dated occurrence depending on consolidation state)

Plan-item dated endpoints (if present)

- POST /api/plan-items/:id/dates { date: 'YYYY-MM-DD' }
- DELETE /api/plan-items/:id/dates/:date

Users

- GET /api/users/:id
- PUT /api/users/:id

User default plan helper

- POST /api/users/:id/default-plan
    - Create (if missing) and return a default routine/workout plan for the given user.
    - Behavior: if the user already has any plans, returns the most recently created one; otherwise creates a new plan with:
        - name: empty string (DB NOT NULL handling)
        - startDate: today
        - endDate: today + 90 days
        - userId: the provided id
        - createdAt/updatedAt: now
    - Response: 201 created plan object or 200 existing plan

Notes & Implementation details

- Column naming: server expects camelCase column names in the DB (e.g. `createdAt`, `workoutType`, `imageUrl`). The server contains mapping code to accept legacy snake_case variants where needed.
- Scheduling model: the project supports two models:
    1. `plan_item_dates` table (separate occurrence rows)
    2. consolidated `plan_items` where each plan item has a `scheduledDate` (single occurrence per row)
       The server has code to work with the consolidated schema; migrations are available under `backend/supabase/migrations/`.
- Authentication: server-side uses Supabase service role key for server-to-DB operations. Do not expose this key in client code.
- Error handling: API returns 500 with a simple { error: '...' } for now and logs detailed DB errors to server console.

Local testing

- Start server (foreground):
  cd backend
  NODE_ENV=development node server.js

- Or start background and view logs:
  NODE_ENV=development nohup node server.js > /tmp/server_run.log 2>&1 &
  tail -f /tmp/server_run.log

Seeding data

- Utility scripts are in `backend/scripts/`:
    - `seedWorkoutsFromCsv.js` (Supabase REST-based seeding)
    - `seedWorkoutsDirectPg.js` (direct DB seeding via pg client)
      Use direct seeding if your REST service key is not accepted by PostgREST.

If anything in this doc is out of date, open an issue or ask me to regenerate after further schema changes.
