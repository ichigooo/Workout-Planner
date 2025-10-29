export interface User {
    id: string;
    email: string;
    name?: string;
    profilePhoto?: string;
    birthday?: Date;
    createdAt: Date;
    updatedAt: Date;
}

export interface Workout {
    id: string;
    title: string;
    category: string;
    description?: string;
    sets: number;
    reps: number;
    intensity: string;
    imageUrl?: string;
    userId: string;
    createdAt: Date;
    updatedAt: Date;
}

export interface WorkoutPlan {
    id: string;
    name: string;
    startDate: Date;
    endDate: Date;
    userId: string;
    createdAt: Date;
    updatedAt: Date;
}

export interface PlanItem {
    id: string;
    workoutId: string;
    workoutPlanId: string;
    frequency: string;
    intensity?: string;
    createdAt: Date;
    updatedAt: Date;
}

export interface WorkoutLog {
    id: string;
    workoutId: string;
    userId: string;
    date: Date;
    sets: number;
    reps: number;
    weight?: number;
    rpe?: number;
    notes?: string;
    createdAt: Date;
    updatedAt: Date;
}

export interface CreateWorkoutRequest {
    title: string;
    category: string;
    description?: string;
    sets: number;
    reps: number;
    intensity: string;
    imageUrl?: string;
    userId: string;
}

export interface CreateWorkoutPlanRequest {
    name: string;
    startDate: Date;
    endDate: Date;
    userId: string;
}

export interface CreatePlanItemRequest {
    workoutId: string;
    frequency: string;
    intensity?: string;
}

export interface CreateWorkoutLogRequest {
    workoutId: string;
    userId: string;
    date: Date;
    sets: number;
    reps: number;
    weight?: number;
    rpe?: number;
    notes?: string;
}

export interface UpdateUserProfileRequest {
    name?: string;
    email?: string;
    profilePhoto?: string;
    birthday?: Date;
}
