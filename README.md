# Workout Planner App

A full-stack workout planning and logging application built with React Native and Node.js.

## Project Structure

```
workout-planner/
├── backend/           # Node.js + Express + Supabase backend
│   ├── prisma/       # Database schema and migrations
│   ├── supabase/     # Supabase SQL migrations
│   ├── types/        # TypeScript type definitions
│   └── server.js     # Express server
├── frontend/         # React Native mobile app
│   ├── src/
│   │   ├── components/  # Reusable UI components
│   │   ├── screens/     # Screen components
│   │   ├── services/    # API services
│   │   └── types/       # TypeScript types
│   └── index.js         # App entry point
└── README.md           # This file
```

## Features

### Core User Stories Implemented

1. **Workout Library Management**
   - Create workouts with title, category, description, sets/reps, intensity
   - Edit and delete existing workouts
   - Optional image support for workouts

2. **Workout Plan Creation**
   - Create plans with name, start date, and end date
   - Manage multiple workout plans

3. **Workout-Plan Integration** (Backend ready)
   - Add workouts to plans with frequency settings
   - Override intensity for specific plan items

4. **Calendar View** (Coming soon)
   - View scheduled workouts from plans

## Tech Stack

### Backend
- **Node.js** + **Express** - RESTful API server
- **Supabase** - PostgreSQL database with real-time features
- **Prisma** - Type-safe database client and schema management
- **TypeScript** - Type definitions and interfaces

### Frontend
- **React Native** - Cross-platform mobile app
- **TypeScript** - Type-safe React components
- **Custom Components** - Built with React Native primitives
- **API Integration** - RESTful API communication

## Database Schema

### Tables
- `users` - User accounts and profiles
- `workouts` - Individual workout exercises
- `workout_plans` - Workout plans with date ranges
- `plan_items` - Workouts assigned to plans with frequency
- `workout_logs` - Logged workout sessions

### Key Relationships
- Users can have multiple workouts and plans
- Workouts can be assigned to multiple plans
- Plan items link workouts to plans with frequency settings
- Workout logs track actual workout sessions

## Setup Instructions

### Prerequisites
- Node.js (v16 or higher)
- npm or yarn
- Supabase account and project
- React Native development environment

### Backend Setup

1. Navigate to the backend directory:
   ```bash
   cd backend
   ```

2. Install dependencies:
   ```bash
   npm install
   ```

3. Copy environment file and configure:
   ```bash
   cp .env.example .env
   # Edit .env with your Supabase credentials
   ```

4. Set up database:
   - Run the SQL migration in `supabase/migrations/001_initial_schema.sql`
   - Or use Prisma: `npx prisma db push`

5. Generate Prisma client:
   ```bash
   npx prisma generate
   ```

6. Start the server:
   ```bash
   npm run dev
   ```

### Frontend Setup

1. Navigate to the frontend directory:
   ```bash
   cd frontend
   ```

2. Install dependencies:
   ```bash
   npm install
   ```

3. Start the React Native app:
   ```bash
   npx react-native run-ios
   # or
   npx react-native run-android
   ```

## API Endpoints

### Workouts
- `GET /api/workouts` - Get all workouts
- `POST /api/workouts` - Create a new workout
- `GET /api/workouts/:id` - Get a specific workout
- `PUT /api/workouts/:id` - Update a workout
- `DELETE /api/workouts/:id` - Delete a workout

### Workout Plans
- `GET /api/workout-plans` - Get all plans with plan items
- `POST /api/workout-plans` - Create a new plan
- `POST /api/workout-plans/:id/plan-items` - Add workout to plan

## Environment Variables

### Backend (.env)
```env
DATABASE_URL="postgresql://username:password@localhost:5432/workout_planner"
SUPABASE_URL="your-supabase-project-url"
SUPABASE_ANON_KEY="your-supabase-anon-key"
SUPABASE_SERVICE_ROLE_KEY="your-supabase-service-role-key"
PORT=3001
NODE_ENV=development
```

## Development

### Running the Backend
```bash
cd backend
npm run dev  # Development with nodemon
npm start    # Production
```

### Running the Frontend
```bash
cd frontend
npx react-native run-ios     # iOS simulator
npx react-native run-android # Android emulator
```

## Next Steps

### Immediate Improvements
- Add user authentication
- Implement drag & drop for workout plans
- Add calendar view for scheduled workouts
- Implement workout logging functionality

### Future Features
- Progress tracking and analytics
- Social features and workout sharing
- Integration with fitness trackers
- Push notifications for workout reminders

## Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Test thoroughly
5. Submit a pull request

## License

This project is open source and available under the [MIT License](LICENSE).
