# Trainichi Project Context

> Mobile fitness app for tracking workouts, training plans, and importing exercises from social media.

## Quick Reference

**Tech Stack**: Expo (React Native) + Express.js + PostgreSQL (Supabase) + TypeScript

**Key Directories**:
- `mobile/` - Expo app with file-based routing
- `backend/` - Express.js API server
- `docs/reference/` - Detailed documentation

## Documentation

All comprehensive documentation is in [docs/reference/](docs/reference/):

- [00-overview.md](docs/reference/00-overview.md) - Project overview and tech stack
- [01-repo-structure.md](docs/reference/01-repo-structure.md) - Complete directory organization
- [02-design-system.md](docs/reference/02-design-system.md) - Colors, typography, spacing
- [03-component-patterns.md](docs/reference/03-component-patterns.md) - React Native patterns
- [04-adding-server-request.md](docs/reference/04-adding-server-request.md) - API endpoint patterns
- [05-adding-mobile-feature.md](docs/reference/05-adding-mobile-feature.md) - Mobile feature workflow
- [06-navigation-routing.md](docs/reference/06-navigation-routing.md) - Expo Router navigation
- [07-state-management.md](docs/reference/07-state-management.md) - State patterns
- [08-database-patterns.md](docs/reference/08-database-patterns.md) - Supabase/Prisma patterns
- [09-testing-guidelines.md](docs/reference/09-testing-guidelines.md) - Testing requirements
- [10-page-inventory.md](docs/reference/10-page-inventory.md) - Screen documentation
- [11-common-tasks.md](docs/reference/11-common-tasks.md) - Quick tasks reference
- [15-workout-presets.md](docs/reference/15-workout-presets.md) - Workout preset system (sets/reps/intensity)

## Design Guidelines

Complete design system: [docs/reference/02-design-system.md](docs/reference/02-design-system.md)

**Style**: Moody editorial — glassmorphism, bold serif headlines, warm deep tones

**Quick Reference**:
- **Colors**: Cream backgrounds + Blue Regatta accent + olive secondary
- **Typography**: Fraunces (serif, headlines) + DM Sans (sans-serif, body/UI)
- **Surfaces**: Glassmorphism cards (expo-blur BlurView) + gradient overlays (expo-linear-gradient)
- **Spacing**: 8px base unit (4px, 8px, 16px, 24px, 32px, 48px, 64px)
- **Radius**: 8px (buttons), 14px (inputs), 22px (cards), 30px (modals), pill (CTAs)

**Primary Colors**:
```css
--cream: #F5EDE1            /* Backgrounds */
--blue-regatta: #366299     /* Primary accent */
--charcoal: #292521         /* Primary text */
--warm-taupe: #8A7F72       /* Secondary text */
--olive: #6B7B5A            /* Secondary accent */
```

## Current Branch

`import-from-ig` - Focus on social media workout import features

## Key Patterns

- **File-based routing**: Expo Router in `mobile/app/`
- **API requests**: `mobile/src/api/` using fetch with Supabase auth
- **Components**: Reusable components in `mobile/src/components/`
- **Database**: Prisma schema in `backend/prisma/schema.prisma`

## Quick Start

```bash
# Backend
cd backend && npm install && npm run dev

# Mobile app – Dev Client (recommended, requires TestFlight/EAS build installed)
cd mobile && npm install && npx expo start --dev-client

# Mobile app – Expo Go (quick prototyping, no native build needed)
cd mobile && npm install && npx expo start --tunnel
```

For Expo Go: log in with `npx expo login` and sign in to the same account in the Expo Go app. The `--tunnel` flag is required.

Refer to detailed docs for implementation guidance.
