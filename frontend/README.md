# Workout Planner Frontend

A React Native application for workout planning and logging.

## Features

- **Workout Library**: Create, edit, and delete individual workouts
- **Workout Plans**: Create workout plans with date ranges
- **Drag & Drop**: Add workouts to plans (coming soon)
- **Calendar View**: View scheduled workouts (coming soon)

## Components

- `WorkoutCard`: Displays workout information with edit/delete actions
- `WorkoutForm`: Form for creating and editing workouts
- `WorkoutPlanForm`: Form for creating workout plans
- `WorkoutLibrary`: Screen for managing workout library
- `WorkoutPlans`: Screen for managing workout plans

## Screens

- **Library Tab**: Browse and manage your workout collection
- **Plans Tab**: Create and manage workout plans

## Setup

1. Install dependencies:
   ```bash
   npm install
   ```

2. Make sure your backend server is running on port 3001

3. Update the API base URL in `src/services/api.ts` if needed

4. Run the app:
   ```bash
   npx react-native run-ios
   # or
   npx react-native run-android
   ```

## API Integration

The app communicates with the Node.js backend through RESTful APIs:
- Workout CRUD operations
- Workout plan management
- Plan item creation

## Dependencies

- React Native
- React
- TypeScript support
- Custom components and services

## Project Structure

```
src/
├── components/     # Reusable UI components
├── screens/       # Screen components
├── services/      # API and business logic
└── types/         # TypeScript type definitions
```

## Development

- The app uses TypeScript for type safety
- Components are built with React Native's built-in components
- Styling is done with StyleSheet for performance
- API calls are centralized in the api service
