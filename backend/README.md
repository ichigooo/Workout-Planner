# Workout Planner Backend

A Node.js backend for the workout planning and logging application.

## Features

- RESTful API for workouts, workout plans, and plan items
- Supabase integration for database operations
- TypeScript type definitions
- Prisma schema for database modeling

## Setup

1. Install dependencies:

    ```bash
    npm install
    ```

2. Copy `.env.example` to `.env` and fill in your Supabase credentials:

    ```bash
    cp .env.example .env
    ```

3. Set up your Supabase database using the SQL migration in `supabase/migrations/001_initial_schema.sql`

4. Generate Prisma client:

    ```bash
    npx prisma generate
    ```

5. Start the development server:
    ```bash
    npm run dev
    ```

## API Endpoints

### Workouts

- `GET /api/workouts` - Get all workouts
- `POST /api/workouts` - Create a new workout
- `GET /api/workouts/:id` - Get a specific workout
- `PUT /api/workouts/:id` - Update a workout
- `DELETE /api/workouts/:id` - Delete a workout

### Workout Plans

- `GET /api/workout-plans` - Get all workout plans with plan items
- `POST /api/workout-plans` - Create a new workout plan
- `POST /api/workout-plans/:id/plan-items` - Add a workout to a plan

## Database Schema

The application uses the following main tables:

- `users` - User accounts
- `workouts` - Individual workout exercises
- `workout_plans` - Workout plans with date ranges
- `plan_items` - Workouts assigned to specific plans with frequency
- `workout_logs` - Logged workout sessions

## Environment Variables

- `DATABASE_URL` - PostgreSQL connection string
- `SUPABASE_URL` - Your Supabase project URL
- `SUPABASE_ANON_KEY` - Supabase anonymous key
- `SUPABASE_SERVICE_ROLE_KEY` - Supabase service role key
- `FACEBOOK_APP_ID` and `FACEBOOK_APP_SECRET` - Credentials for the Facebook/Instagram oEmbed API (required for Instagram imports)
- `PORT` - Server port (default: 3001)
