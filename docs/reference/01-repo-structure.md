# Repository Structure

> Complete directory organization for the Trainichi project.

## Root Level

```
workout-planner/
├── mobile/              # Expo React Native app (main focus)
├── backend/             # Express.js API server
├── docs/                # Documentation
│   └── reference/       # Reference documentation (you are here)
├── public/              # Static assets
├── .claude/             # Claude Code configuration
├── eslint.config.js     # ESLint configuration
├── .prettierrc          # Prettier formatting rules
├── package.json         # Root workspace config
└── README.md            # Project readme
```

---

## Mobile App (`mobile/`)

```
mobile/
├── app/                          # Expo Router (file-based routing)
│   ├── (tabs)/                   # Tab navigation group
│   │   ├── _layout.tsx           # Tab bar configuration
│   │   ├── index.tsx             # Home tab
│   │   ├── library.tsx           # Library/Routine tab
│   │   ├── calendar.tsx          # Calendar view (hidden tab)
│   │   └── plan.tsx              # Training plan tab
│   ├── (auth)/                   # Authentication routes
│   │   ├── sign-in.tsx           # Login screen
│   │   ├── sign-up.tsx           # Registration screen
│   │   └── forgot-password.tsx   # Password reset
│   ├── import-workout/           # Import feature
│   │   └── custom.tsx            # Custom import configuration
│   ├── plan/                     # Plan routes
│   │   └── [id].tsx              # Dynamic plan detail
│   ├── _layout.tsx               # Root layout (fonts, theme, auth)
│   ├── index.tsx                 # Landing screen (entry point)
│   ├── workout.tsx               # Workout library screen
│   ├── workout-detail.tsx        # Workout detail modal
│   ├── import-workout.tsx        # Social media import
│   ├── profile.tsx               # User profile
│   ├── modal.tsx                 # Generic modal
│   ├── +html.tsx                 # Web support
│   └── +not-found.tsx            # 404 page
│
├── src/                          # Source code
│   ├── components/               # Reusable UI components
│   │   ├── plan/                 # Plan-specific components
│   │   │   ├── PlanSetupModal.tsx
│   │   │   ├── planScheduling.ts # Frequency expansion logic
│   │   │   └── __tests__/        # Component tests
│   │   ├── AddToPlanBottomSheet.tsx
│   │   ├── CalendarWidget.tsx
│   │   ├── DragDropWorkoutPlanner.tsx
│   │   ├── EnhancedWorkoutCard.tsx
│   │   ├── ImportCTACard.tsx
│   │   ├── SplashScreen.tsx
│   │   ├── WarmUpModal.tsx
│   │   ├── WorkoutCard.tsx
│   │   ├── WorkoutDetail.tsx     # Large component (~47KB)
│   │   ├── WorkoutForm.tsx
│   │   ├── WorkoutImportPreview.tsx
│   │   ├── WorkoutPlanForm.tsx
│   │   └── WorkoutScheduler.tsx
│   │
│   ├── screens/                  # Full-page screen components
│   │   ├── Home.tsx              # Main dashboard
│   │   ├── LandingScreen.tsx     # Entry screen with "Begin"
│   │   ├── TrainingPlanManager.tsx
│   │   ├── UserProfile.tsx
│   │   └── WorkoutHub.tsx
│   │
│   ├── services/                 # API and data services
│   │   ├── api.ts                # API service class (~400 lines)
│   │   ├── planItemsCache.ts     # Caching layer (5-min TTL)
│   │   ├── startup.ts            # App initialization
│   │   └── __tests__/            # Service tests
│   │
│   ├── state/                    # State management
│   │   ├── AuthContext.tsx       # Supabase auth context
│   │   └── session.ts            # User session persistence
│   │
│   ├── hooks/                    # Custom React hooks
│   │   └── useScrollToTopOnTabPress.ts
│   │
│   ├── types/                    # TypeScript definitions
│   │   └── index.ts              # All data models
│   │
│   ├── lib/                      # Third-party setup
│   │   └── supabase.ts           # Supabase client init
│   │
│   ├── constants/                # App constants
│   │   └── workoutCategories.ts  # Categories and labels
│   │
│   ├── utils/                    # Utility functions
│   │   ├── categoryOrder.ts      # Category sorting
│   │   ├── getlocalIP.ts         # Local dev detection
│   │   └── image.ts              # Image utilities
│   │
│   └── theme.ts                  # Design system tokens
│
├── assets/                       # Static assets
│   ├── fonts/                    # Custom fonts
│   │   ├── DMSans-*.ttf          # Body font
│   │   └── Fraunces-*.ttf        # Headline font
│   ├── images/
│   │   ├── workout_types/        # Category icons
│   │   ├── workout_templates/    # Template images
│   │   ├── equipment/            # Equipment icons
│   │   ├── bg*.png               # Background images
│   │   └── homebg.png            # Home hero image
│   └── Trainichi-Design-Guidelines-Warm.html  # Design docs
│
├── constants/                    # Expo constants
├── data/                         # Static data files
├── app.json                      # Expo configuration
├── babel.config.js               # Babel configuration
├── metro.config.js               # Metro bundler config
├── tsconfig.json                 # TypeScript config
├── package.json                  # Dependencies
└── package-lock.json
```

### Key Files Explained

| File | Purpose |
|------|---------|
| `app/_layout.tsx` | Root layout with AuthProvider, fonts, theme |
| `src/theme.ts` | Design tokens (colors, spacing, typography) |
| `src/services/api.ts` | All backend API calls |
| `src/types/index.ts` | TypeScript interfaces for all data |
| `src/state/AuthContext.tsx` | Supabase authentication state |

---

## Backend (`backend/`)

```
backend/
├── server.js              # Main Express server (~1800 lines)
├── prisma/
│   └── schema.prisma      # Database schema definitions
├── types/
│   └── index.ts           # TypeScript types (if used)
├── test/                  # Mocha test suite
│   └── *.test.js          # Test files
├── .env                   # Environment variables (gitignored)
├── .env.example           # Environment template
├── package.json           # Dependencies
├── vercel.json            # Vercel deployment config
└── README.md              # Backend documentation
```

### Key Files Explained

| File | Purpose |
|------|---------|
| `server.js` | All API routes and business logic |
| `prisma/schema.prisma` | Database tables and relationships |
| `vercel.json` | Deployment configuration |
| `.env` | Database URLs, API keys (secret) |

---

## File Naming Conventions

### Components
- **PascalCase** for React components: `WorkoutCard.tsx`
- **camelCase** for utilities: `categoryOrder.ts`
- **kebab-case** for routes: `import-workout.tsx`

### Folders
- **lowercase** for all folders: `components/`, `services/`
- **Grouped routes** use parentheses: `(tabs)/`, `(auth)/`
- **Dynamic routes** use brackets: `[id].tsx`

---

## Where to Put New Files

### Decision Tree

```
Adding a new...
│
├── Screen/Page?
│   └── Add to mobile/app/ (file-based routing)
│
├── Reusable UI component?
│   └── Add to mobile/src/components/
│
├── Full-page screen logic?
│   └── Add to mobile/src/screens/
│
├── API call/service?
│   └── Add method to mobile/src/services/api.ts
│
├── TypeScript type?
│   └── Add to mobile/src/types/index.ts
│
├── API endpoint?
│   └── Add route to backend/server.js
│
├── Database table?
│   └── Modify backend/prisma/schema.prisma
│
└── Design token?
    └── Modify mobile/src/theme.ts
```

---

## Related Documentation

- [00-overview.md](./00-overview.md) - Project overview
- [03-component-patterns.md](./03-component-patterns.md) - Component conventions
- [04-adding-server-request.md](./04-adding-server-request.md) - Backend patterns
- [05-adding-mobile-feature.md](./05-adding-mobile-feature.md) - Mobile patterns
