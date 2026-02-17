# Trainichi Project Overview

> Trainichi is a mobile fitness app that helps users track workouts, follow training plans, and import exercises from social media platforms.

## Purpose

Trainichi solves the problem of scattered workout content across social media. Users can:
- Import workouts directly from Instagram, YouTube, and TikTok
- Follow structured training plans with scheduled workouts
- Track personal records and progress
- Browse a curated library of exercises by category

## Tech Stack

| Layer | Technology | Version | Purpose |
|-------|-----------|---------|---------|
| **Mobile** | Expo (React Native) | SDK 54 | Cross-platform mobile app |
| **Navigation** | Expo Router | v4 | File-based routing |
| **Language** | TypeScript | 5.x | Type safety |
| **Backend** | Express.js | v5 | REST API server |
| **Database** | PostgreSQL | - | Via Supabase |
| **ORM** | Prisma | - | Type-safe database queries |
| **Auth** | Supabase Auth | - | User authentication |
| **Storage** | Supabase Storage | - | Image hosting |
| **Deployment** | Vercel | - | Backend hosting |

## Project Structure

```
workout-planner/
├── mobile/          # Expo React Native app
├── backend/         # Express.js API server
├── docs/            # Documentation (you are here)
└── public/          # Static assets
```

## Key Features

### 1. Workout Library
- Browse workouts by category (Upper Body, Legs, Core, Climbing, Cardio, Mobility)
- View detailed exercise information with images
- Track personal records per workout

### 2. Training Plans
- Create custom training plans with start/end dates
- Schedule workouts on specific days
- Use pre-built plan templates
- View weekly calendar overview

### 3. Social Media Import
- Import workouts from YouTube (oEmbed)
- Import workouts from Instagram (planned)
- Import workouts from TikTok (planned)
- Auto-extract thumbnails and metadata

### 4. User Profile
- Authentication via Supabase
- Profile photo upload
- Personal settings

## Design Philosophy

Trainichi uses a **moody editorial aesthetic** with warm, deep tones:
- **Glassmorphism** — translucent cards and blur effects for depth
- **Editorial typography** — bold Fraunces serif headlines, DM Sans body
- **Warm stone palette** — rosewood accent, olive secondary, warm stone backgrounds
- **Pill-shaped CTAs** and generous radii for a modern feel
- High accessibility (contrast, readability)

See [02-design-system.md](./02-design-system.md) for detailed design guidelines.

## Quick Links

| Documentation | Description |
|--------------|-------------|
| [01-repo-structure.md](./01-repo-structure.md) | Complete directory organization |
| [02-design-system.md](./02-design-system.md) | Colors, typography, spacing |
| [03-component-patterns.md](./03-component-patterns.md) | React Native component patterns |
| [04-adding-server-request.md](./04-adding-server-request.md) | How to add new API endpoints |
| [05-adding-mobile-feature.md](./05-adding-mobile-feature.md) | How to add new mobile features |
| [06-navigation-routing.md](./06-navigation-routing.md) | Expo Router navigation |
| [07-state-management.md](./07-state-management.md) | State management patterns |
| [08-database-patterns.md](./08-database-patterns.md) | Supabase/Prisma patterns |
| [09-testing-guidelines.md](./09-testing-guidelines.md) | Testing requirements |
| [10-page-inventory.md](./10-page-inventory.md) | All screens documented |
| [11-common-tasks.md](./11-common-tasks.md) | Quick reference guide |

## Environment Setup

### Backend Server

```bash
cd backend
npm install
cp .env.example .env  # Configure credentials
npm run dev
```

### Mobile App

```bash
cd mobile
npm install
```

**Dev Client** (recommended – requires TestFlight/EAS build installed):
```bash
npx expo start --dev-client
```

**Expo Go** (quick prototyping, no native build needed):
```bash
npx expo start --tunnel
```

For Expo Go: log in with `npx expo login` and sign in to the same account in the Expo Go app. The `--tunnel` flag is required — local network mode does not work reliably.

### Required Environment Variables

**Mobile (`mobile/.env`):**
```
EXPO_PUBLIC_USE_CLOUD=true
EXPO_PUBLIC_API_BASE_URL=https://your-api.vercel.app
EXPO_PUBLIC_SUPABASE_URL=https://xxx.supabase.co
EXPO_PUBLIC_SUPABASE_ANON_KEY=eyJ...
```

**Backend (`backend/.env`):**
```
SUPABASE_URL=https://xxx.supabase.co
SUPABASE_ANON_KEY=eyJ...
SUPABASE_SERVICE_ROLE_KEY=eyJ...
DATABASE_URL=postgresql://...
```

## Current Branch

The project is actively developed on the `import-from-ig` branch, focusing on social media workout import features.

## Getting Help

- Check the documentation files in this directory
- Review existing patterns in the codebase
- Use TypeScript intellisense for API discovery
