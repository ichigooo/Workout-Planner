export interface User {
    id: string;
    email: string;
    name?: string;
    profilePhoto?: string;
    birthday?: string;
    createdAt: string;
    updatedAt: string;
    isAdmin: boolean;
}

export type WorkoutCategory =
    | "Upper Body - Pull"
    | "Upper Body - Push"
    | "Legs"
    | "Core"
    | "Climbing - Power"
    | "Climbing - Endurance"
    | "Climbing - Warm Up"
    | "Cardio";

export type WorkoutType = "strength" | "cardio";

export interface Workout {
    id: string;
    title: string;
    category: WorkoutCategory;
    description?: string;
    workoutType: WorkoutType;
    sets?: number; // Only for strength workouts
    reps?: number; // Only for strength workouts
    duration?: number; // Only for cardio workouts (in minutes)
    intensity: string;
    imageUrl?: string;
    imageUrl2?: string; // camelCase column name
    isGlobal: boolean; // Global workout library - shared across all users
    createdBy?: string; // Optional: who created this workout (for admin purposes)
    createdAt: string;
    updatedAt: string;
}

export interface WorkoutPlan {
    id: string;
    name: string;
    startDate: string;
    endDate: string;
    userId: string;
    createdAt: string;
    updatedAt: string;
    planItems?: PlanItem[];
}

export interface PlanItem {
    id: string;
    workoutId: string;
    workoutPlanId: string;
    frequency: string;
    intensity?: string;
    createdAt: string;
    updatedAt: string;
    workout?: Workout;
}

export interface WorkoutLog {
    id: string;
    workoutId: string;
    userId: string;
    date: string;
    sets?: number; // Only for strength workouts
    reps?: number; // Only for strength workouts
    duration?: number; // Only for cardio workouts (in minutes)
    weight?: number; // For strength workouts
    rpe?: number; // Rate of Perceived Exertion (1-10)
    pace?: string; // For cardio workouts (e.g., "8:30/mile")
    heartRate?: number; // For cardio workouts (BPM)
    notes?: string;
    createdAt: string;
    updatedAt: string;
}

export interface CreateWorkoutRequest {
    title: string;
    category: WorkoutCategory;
    description?: string;
    workoutType?: WorkoutType; // Optional - auto-determined from category
    sets?: number; // Only for strength workouts
    reps?: number; // Only for strength workouts
    duration?: number; // Only for cardio workouts (in minutes)
    intensity: string;
    imageUrl?: string;
    imageUrl2?: string;
    createdBy?: string; // Optional: who created this workout (for admin purposes)
}

export interface CreateWorkoutPlanRequest {
    name: string;
    startDate: string;
    endDate: string;
    userId: string;
}

export interface CreatePlanItemRequest {
    workoutId: string;
    frequency: string;
    intensity?: string;
}

export interface UpdateUserProfileRequest {
    name?: string;
    email?: string;
    profilePhoto?: string;
    birthday?: string;
}
