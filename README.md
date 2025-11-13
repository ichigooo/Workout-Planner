# Workout Planner – Architecture & Deployment Guide

> Version: 2025‑11‑11 · Target stack: Expo (React Native), Node/Express, Supabase, Vercel, EAS

---

## 1) Project Overview

A full‑stack mobile app to plan, track, and log workouts.

- **Mobile app**: Expo + React Native (aka **Trainichi** in `app.json`).
- **Backend API**: Node.js + Express, deployable to **Vercel**.
- **Database & Auth**: **Supabase** (Postgres, Row Level Security, Storage).
- **Data flow**: Mobile ⇄ Express (REST) ⇄ Supabase (DB & Storage).
- **Images**: Optional upload to Supabase Storage (prefer signed upload flow).

---

## 2) Monorepo Structure

```
root/
  package.json          # workspace scripts
  README.md             # product notes & user stories
  eslint.config.js
  .prettierrc

  backend/
    server.js           # Express app (CORS + large JSON bodies)
    vercel.json         # Vercel routing & headers
    .env.example        # Supabase config vars (copy → .env)
    prisma/             # optional schema (keep in sync with Supabase)
    scripts/            # seeding/import helpers (CSV → workouts)
    test/               # API smoke tests (mocha/chai/supertest)

  mobile/
    app.json            # app name: Trainichi, bundle ids, scheme
    eas.json            # EAS profiles (development/preview/production)
    src/
      constants.ts      # API base URL selection (local vs cloud)
      services/api.ts   # typed fetch wrapper
      screens/          # WorkoutHub, Plan Manager, User Profile, etc.
      utils/image.ts    # image helpers
```

---

## 3) Domain Model (current tables)

- **workouts**: id, title, category, description, sets, reps, intensity, image_url, created_at, updated_at
- **workout_plans**: id, user_id, name, start_date, end_date
- **plan_items**: id, plan_id, workout_id, frequency (e.g. days of week), notes
- **workout_logs**: id, user_id, workout_id, logged_at, metrics (RPE, weight, reps, time, distance)
- **users**: id, email, profile (display name, avatar)

> Keep Prisma schema (if used) and Supabase SQL/migrations aligned. Choose **one source of truth** for schema.

---

## 4) API Surface (representative)

```
GET    /api/health

# Workouts
GET    /api/workouts
POST   /api/workouts
PUT    /api/workouts/:id
DELETE /api/workouts/:id

# Plans
GET    /api/workout-plans
POST   /api/workout-plans
POST   /api/workout-plans/:id/plan-items

# (Planned) Logs
POST   /api/workouts/:id/logs
GET    /api/logs?from=...&to=...
```

**Notes**

- JSON body size is increased in Express to accommodate base64 image payloads. On Vercel, prefer **direct uploads** to Supabase Storage from the app to avoid function time/size limits.
- CORS is enabled broadly in development; scope it in production.

---

## 5) Configuration & Environments

### 5.1 Backend `.env`

Create `backend/.env` from `.env.example`:

```ini
# Supabase
SUPABASE_URL="https://<your-project-ref>.supabase.co"
SUPABASE_ANON_KEY="<public-anon-key>"        # optional on server
SUPABASE_SERVICE_ROLE_KEY="<service-role>"  # server-only, never ship to client

# App
NODE_ENV="production"
PORT=3001
```

### 5.2 Mobile env (Expo)

Prefer Expo public envs for runtime config:

- **`EXPO_PUBLIC_API_BASE_URL`** – full base URL to your backend `/api`
- **Optional switches:** `EXPO_PUBLIC_USE_CLOUD=true|false`

`mobile/src/constants.ts` (suggested):

```ts
export const API_BASE_URL = process.env.EXPO_PUBLIC_API_BASE_URL ?? "http://localhost:3001/api";
```

Set values per profile via **EAS** (see §8) or `.env` files with `expo-env`/`dotenv` tooling as needed.

---

## 6) Local Development

### 6.1 Backend (Express)

```bash
# from /backend
cp .env.example .env   # populate keys
pnpm i                 # or npm i / yarn
pnpm dev               # starts on http://localhost:3001
```

Health check:

```bash
curl -i http://localhost:3001/api/health
```

### 6.2 Mobile app (Expo)

```bash
# from /mobile
pnpm i
pnpm start             # or: npx expo start --dev-client --host tunnel
```

If using **Dev Client** (recommended):

```bash
eas build --profile development --platform ios  # first time / when native deps change
npx expo start --dev-client --host tunnel       # run every day
```

> Ensure `EXPO_PUBLIC_API_BASE_URL` points to your local or tunnel address, e.g. `http://<LAN_IP>:3001/api` or `https://<ngrok-subdomain>.ngrok.io/api`.

---

## 7) Testing

```bash
# from /backend
pnpm test
```

Tests use supertest against the running server (default `http://localhost:3001`).

---

## 8) Security & Privacy

- **Never expose** `SUPABASE_SERVICE_ROLE_KEY` to the mobile app or any client.
- Restrict **CORS** origins in production to your domains.
- Use **RLS** in Supabase and insert policies for per‑user rows.
- Prefer **signed URLs** or authenticated Storage policies for images.

---

## 9) Observability

- Add request logging (morgan/pino) in Express.
- Enable Vercel **function logs** & analytics.
- Consider Supabase **Log Drains** for DB events.

---

## 10) Roadmap / Nice‑to‑haves

- Switch image flow to **client → Supabase Storage** (pre‑signed) and store only URLs in DB.
- Add offline queue + optimistic UI for logs.
- Introduce Zod schemas for request/response typing.
- Add E2E tests (Detox) for critical flows.

---

# Deployment Checklist (Supabase · Vercel · EAS)

Use this as a punch list. Check off each item as you ship.

## A) Supabase

1. **Create project** at app.supabase.com
2. **Copy keys** from _Project Settings → API_:
    - `SUPABASE_URL`
    - `anon` (public client key)
    - `service_role` (server‑only)

3. **Database schema**
    - Ensure tables: `workouts`, `workout_plans`, `plan_items`, `workout_logs`, `users`.
    - Run your SQL or Prisma migrations (choose one source of truth).

4. **RLS policies**
    - Enable RLS on user‑scoped tables.
    - Policies: users can `select/insert/update` rows where `user_id = auth.uid()`.

5. **Storage** (optional for images)
    - Create bucket `workout-images` (private).
    - Add policy for authenticated upload or use **pre‑signed URL** flow.

## B) Backend on Vercel (Express)

1. **Import** `backend/` into Vercel (or connect the monorepo and select the folder).
2. **Framework preset**: _Other_ (Node.js). Root = `backend`.
3. **Build & Output**
    - _Build Command_: `npm i && npm run build` (or omit if none)
    - _Output_: not required for serverless functions; ensure `vercel.json` exists.

4. **Environment Variables** (Project → Settings → Environment Variables):
    - `SUPABASE_URL`
    - `SUPABASE_SERVICE_ROLE_KEY`
    - (Optional) `SUPABASE_ANON_KEY`
    - `NODE_ENV=production`

5. **CORS**: Confirm allowed origins in `server.js` or via Vercel `headers`.
6. **Deploy** (Preview → Production).
7. **Smoke tests**

    ```bash
    curl -s https://<your-vercel-domain>/api/health
    curl -s https://<your-vercel-domain>/api/workouts | head
    ```

**Common gotchas**

- _Invalid API key_: verify `SUPABASE_SERVICE_ROLE_KEY` in Vercel **Production** env.
- _Body too large / timeouts_: move image uploads to Supabase Storage (client‑side pre‑signed flow).

## C) Mobile (Expo + EAS)

1. **Set API base URL**
    - In Vercel, copy your prod URL: `https://<domain>/api`.
    - In Expo **Secrets** or EAS profile env, set:
        - `EXPO_PUBLIC_API_BASE_URL=https://<domain>/api`

2. **Update `constants.ts`** to read `EXPO_PUBLIC_API_BASE_URL`.
3. **EAS profiles** (`mobile/eas.json`) example:

    ```json
    {
        "cli": { "version": ">= 11.0.0" },
        "build": {
            "development": {
                "developmentClient": true,
                "distribution": "internal",
                "env": { "EXPO_PUBLIC_API_BASE_URL": "https://<preview-domain>/api" }
            },
            "preview": {
                "distribution": "internal",
                "env": { "EXPO_PUBLIC_API_BASE_URL": "https://<preview-domain>/api" }
            },
            "production": {
                "autoIncrement": true,
                "env": { "EXPO_PUBLIC_API_BASE_URL": "https://<prod-domain>/api" }
            }
        },
        "submit": { "production": {} }
    }
    ```

4. **Build**

    ```bash
    # First-time or when native deps change
    eas build --profile development --platform ios

    # Daily run
    npx expo start --dev-client --host tunnel
    ```

5. **Verify on device**
    - Open the app → hit _Workout Library_ fetch.
    - If it fails, print `API_BASE_URL` at app start to confirm env.

## D) Post‑deploy Verification

- Create a workout from the app → confirm row appears in Supabase.
- Create a plan and attach items → validate via API and DB.
- Upload an image → confirm Storage object + URL saved.

## E) Rollback & Monitoring

- Keep last known good Vercel deployment.
- Add Sentry (client + server) for error tracking.
- Track slow queries in Supabase (pg_stat_statements).

---

## Snippets

### Minimal `vercel.json` (backend)

```json
{
    "version": 2,
    "builds": [{ "src": "server.js", "use": "@vercel/node" }],
    "routes": [{ "src": "/(.*)", "dest": "/server.js" }],
    "headers": [
        {
            "source": "/(.*)",
            "headers": [
                { "key": "Access-Control-Allow-Origin", "value": "*" },
                { "key": "Access-Control-Allow-Methods", "value": "GET,POST,PUT,DELETE,OPTIONS" },
                { "key": "Access-Control-Allow-Headers", "value": "Content-Type, Authorization" }
            ]
        }
    ]
}
```

### Pre‑signed upload flow (outline)

1. Mobile requests a signed URL

```
POST /api/storage/sign-upload { filename, contentType }
→ server uses service role to return signed URL
```

2. Mobile `PUT` file directly to Storage

```
PUT <signedUrl>
```

3. Store the public (or signed) URL in `workouts.image_url`.

---

## Troubleshooting Quick Reference

- **App runs but API 404** → Check `EXPO_PUBLIC_API_BASE_URL` ends with `/api`.
- **Network only on device** → Use `--host tunnel` or proper LAN IP; avoid hard‑coded IPs.
- **Vercel 504/Body too large** → Move images to Storage; reduce payloads; avoid base64 in API.
- **ESLint/React warnings** → Ensure `"type": "module"` if using ESM; install `react` for lint config.

---

## Credits & Naming

- Public‑facing app name: **Trainichi** (mobile `app.json`).
- Repo/workspace: **Workout Planner**.
