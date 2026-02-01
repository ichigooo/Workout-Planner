# Page Inventory

> Complete list of all screens and routes in Trainichi.

---

## Overview

Trainichi uses **Expo Router v4** file-based routing. This document lists every screen in the app.

---

## Route Map

```
/
├── / (Landing)
├── /(tabs)
│   ├── index (Home)
│   ├── library (Routine)
│   ├── calendar (Calendar - hidden tab)
│   └── plan (Plans)
├── /(auth)
│   ├── sign-in
│   ├── sign-up
│   └── forgot-password
├── /workout
├── /workout-detail?id=xxx
├── /profile
├── /import-workout
├── /import-workout/custom?id=xxx
├── /plan/[id]
└── /modal
```

---

## Authentication Screens

### Landing Screen

| Property | Value |
|----------|-------|
| File | `src/screens/LandingScreen.tsx` |
| Route | `/` (via `app/index.tsx`) |
| Purpose | Welcome screen with CTA |

**Features:**
- Random motivational quotes
- "Get Started" button
- "I already have an account" link
- Background image with overlay

---

### Sign In

| Property | Value |
|----------|-------|
| File | `app/(auth)/sign-in.tsx` |
| Route | `/(auth)/sign-in` |
| Purpose | User login |

**Features:**
- Email/password inputs
- Form validation
- Forgot password link
- Sign up link
- Supabase authentication

---

### Sign Up

| Property | Value |
|----------|-------|
| File | `app/(auth)/sign-up.tsx` |
| Route | `/(auth)/sign-up` |
| Purpose | Account creation |

**Features:**
- Name, email, password fields
- Password confirmation
- Form validation
- Auto-creates backend profile

---

### Forgot Password

| Property | Value |
|----------|-------|
| File | `app/(auth)/forgot-password.tsx` |
| Route | `/(auth)/forgot-password` |
| Purpose | Password reset |

**Features:**
- Coming soon placeholder

---

## Main Tab Screens

### Home Tab

| Property | Value |
|----------|-------|
| File | `app/(tabs)/index.tsx` → `src/screens/Home.tsx` |
| Route | `/(tabs)` |
| Tab Icon | `home-outline` |
| Purpose | Dashboard |

**Features:**
- Time-based greeting
- User profile photo
- Hero banner with CTAs
- Week snapshot (7-day dots)
- Today's workouts list
- Equipment icons
- Rest day indicator
- Warm up CTA card
- Pull-to-refresh

---

### Routine Tab (Library)

| Property | Value |
|----------|-------|
| File | `app/(tabs)/library.tsx` → `src/screens/TrainingPlanManager.tsx` |
| Route | `/(tabs)/library` |
| Tab Icon | `calendar-outline` |
| Purpose | Manage workout schedule |

**Features:**
- Next 5 days view
- Category filter chips
- Workouts by date
- FAB for adding workouts
- Add workout modal
- Browse workouts link

---

### Calendar Tab

| Property | Value |
|----------|-------|
| File | `app/(tabs)/calendar.tsx` |
| Route | `/(tabs)/calendar` |
| Tab Icon | Hidden (`href: null`) |
| Purpose | Monthly calendar view |

**Features:**
- Full month calendar
- Marked dates (today, has workouts)
- Date selection
- Selected date workouts list
- Workout detail navigation

---

### Plan Tab

| Property | Value |
|----------|-------|
| File | `app/(tabs)/plan.tsx` |
| Route | `/(tabs)/plan` |
| Tab Icon | `barbell-outline` |
| Purpose | Browse plan templates |

**Features:**
- Plan template cards
- Background images
- Metadata (duration, level)
- Pull-to-refresh
- Template detail navigation

---

## Detail Screens

### Workout Library

| Property | Value |
|----------|-------|
| File | `app/workout.tsx` |
| Route | `/workout` |
| Purpose | Browse all workouts |

**Features:**
- Category filter chips
- "All", "Custom" tabs
- Workout cards list
- Admin add button
- Import CTA card
- Quick delete (custom)
- Category query param support

---

### Workout Detail

| Property | Value |
|----------|-------|
| File | `app/workout-detail.tsx` → `src/components/WorkoutDetail.tsx` |
| Route | `/workout-detail?id=xxx` |
| Purpose | Full workout info |

**Features:**
- Workout metadata
- Images
- Sets/reps/intensity
- Edit button (admin)
- Delete with confirmation
- Close navigation

---

### Plan Detail

| Property | Value |
|----------|-------|
| File | `app/plan/[id].tsx` |
| Route | `/plan/[id]` |
| Purpose | View plan structure |

**Features:**
- Hero with plan name
- Expandable weeks
- Day rows with exercise count
- Workout list per day
- "Use this plan" CTA
- Background image

---

### Import Workout

| Property | Value |
|----------|-------|
| File | `app/import-workout.tsx` |
| Route | `/import-workout` |
| Purpose | Import from social media |

**Features:**
- Platform selection (Instagram, YouTube, TikTok)
- URL input
- Step-by-step instructions
- Import validation
- Preview card
- YouTube support active

---

### Custom Import Detail

| Property | Value |
|----------|-------|
| File | `app/import-workout/custom.tsx` |
| Route | `/import-workout/custom?id=xxx&payload=xxx` |
| Purpose | View imported workout |

**Features:**
- Hero image with play overlay
- Platform badge
- "IMPORTED" badge
- Metadata display
- "Open in [Platform]" link
- "Add to Plan" button
- Delete option

---

### User Profile

| Property | Value |
|----------|-------|
| File | `app/profile.tsx` → `src/screens/UserProfile.tsx` |
| Route | `/profile` |
| Purpose | Account settings |

**Features:**
- Profile photo picker
- Name input
- Email display
- Birthday picker
- Save changes
- Log out button

---

## Modals & Sheets

### Warm Up Modal

| Property | Value |
|----------|-------|
| File | `src/components/WarmUpModal.tsx` |
| Trigger | Home screen CTA |
| Purpose | Warm-up exercises |

---

### Add to Plan Bottom Sheet

| Property | Value |
|----------|-------|
| File | `src/components/AddToPlanBottomSheet.tsx` |
| Trigger | Custom import detail |
| Purpose | Date selection for scheduling |

**Features:**
- Calendar date picker
- Multi-date selection
- Confirm/cancel buttons

---

### Plan Setup Modal

| Property | Value |
|----------|-------|
| File | `src/components/plan/PlanSetupModal.tsx` |
| Trigger | Plan detail "Use this plan" |
| Purpose | Create plan from template |

---

### Add Workout Page

| Property | Value |
|----------|-------|
| File | `src/screens/AddWorkoutToPlanPage.tsx` |
| Trigger | Routine tab FAB |
| Purpose | Schedule workouts |

**Features:**
- Category selection
- Workout selection
- Date calendar
- Quick add

---

## Layout Files

### Root Layout

| Property | Value |
|----------|-------|
| File | `app/_layout.tsx` |
| Purpose | App initialization |

**Responsibilities:**
- Font loading
- AuthProvider
- Stack navigation
- Theme configuration
- Screen options

---

### Tabs Layout

| Property | Value |
|----------|-------|
| File | `app/(tabs)/_layout.tsx` |
| Purpose | Tab bar configuration |

**Tabs:**
- Home (index)
- Routine (library)
- Calendar (hidden)
- Plan

---

### Auth Layout

| Property | Value |
|----------|-------|
| File | `app/(auth)/_layout.tsx` |
| Purpose | Auth flow navigation |

**Screens:**
- sign-in
- sign-up
- forgot-password

---

## Screen Count Summary

| Category | Count |
|----------|-------|
| Auth Screens | 4 |
| Tab Screens | 4 |
| Detail Screens | 6 |
| Modals/Sheets | 4 |
| Layouts | 3 |
| **Total** | **21** |

---

## Navigation Flows

### New User Flow
```
Landing → Sign Up → (tabs) Home
```

### Returning User Flow
```
Landing → Sign In → (tabs) Home
```

### Workout Discovery Flow
```
Home → Workout Library → Workout Detail
```

### Plan Setup Flow
```
Plan Tab → Plan Detail → Plan Setup Modal → Calendar
```

### Import Flow
```
Workout Library → Import Workout → Custom Import Detail → Add to Plan
```

---

## Related Documentation

- [06-navigation-routing.md](./06-navigation-routing.md) - Navigation patterns
- [05-adding-mobile-feature.md](./05-adding-mobile-feature.md) - Adding new screens
