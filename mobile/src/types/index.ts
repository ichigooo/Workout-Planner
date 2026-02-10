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
    | "Cardio"
    | "Mobility";

export type WorkoutType = "strength" | "cardio";

export type IntensityModel = "legacy" | "percentage_1rm" | "sets_reps" | "sets_time";
export type PercentagePreset = "high" | "medium" | "hypertrophy";

export interface PresetConfig {
    label: string;
    reps: number;
    percentage: number;
    description: string;
}

export const PERCENTAGE_PRESETS: Record<PercentagePreset, PresetConfig> = {
    high: {
        label: "High Intensity",
        reps: 1,
        percentage: 95,
        description: "1 rep @ 95% 1RM",
    },
    medium: {
        label: "Medium Intensity",
        reps: 5,
        percentage: 85,
        description: "5 reps @ 85% 1RM",
    },
    hypertrophy: {
        label: "Hypertrophy",
        reps: 8,
        percentage: 80,
        description: "8 reps @ 80% 1RM",
    },
};

// All percentage_1rm workouts show 3 sets as the recommended value
export const PERCENTAGE_1RM_SETS = 3;

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
    trackRecords?: boolean; // Enable PR tracking for this workout
    intensityModel: IntensityModel; // Intensity model type
    defaultPreset?: PercentagePreset; // Default preset for percentage_1rm model
    durationPerSet?: number; // Duration per set in seconds (for sets_time model)
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

export interface WorkoutPersonalRecord {
    id: string;
    workoutId: string;
    userId: string;
    value: string;
    createdAt: string;
    updatedAt: string;
}

// New structured PR tracking types
export interface PersonalRecordEntry {
    id: string;
    userId: string;
    workoutId: string;
    reps: number;
    weight: number;
    dateAchieved: string;
    createdAt: string;
    updatedAt: string;
}

export interface CurrentPR {
    reps: number;
    weight: number;
    dateAchieved: string;
    entryId: string;
}

export interface CreatePREntryRequest {
    userId: string;
    reps: number;
    weight: number;
    dateAchieved?: string;
}

export interface CreatePREntryResponse {
    entry: PersonalRecordEntry;
    isNewRecord: boolean;
    previousBest: { weight: number; dateAchieved: string } | null;
}

export interface UserWorkoutRepConfig {
    id?: string;
    userId?: string;
    workoutId?: string;
    customReps: number[];
    createdAt?: string;
    updatedAt?: string;
}

export interface WorkoutPRSummary {
    workout: Pick<Workout, "id" | "title" | "category" | "imageUrl">;
    currentRecords: CurrentPR[];
    customReps: number[];
}

export interface AllPRsResponse {
    workouts: WorkoutPRSummary[];
}

export interface WorkoutDayTemplate {
    name: string;
    workoutIds: string[];
}

export interface WorkoutPlanTemplate {
    id: string;
    name: string;
    description?: string | null;
    numWeeks: number;
    daysPerWeek: number;
    workoutStructure: WorkoutDayTemplate[][];
    level?: string | null;
    createdBy?: string | null;
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
    trackRecords?: boolean; // Enable PR tracking for this workout
    intensityModel?: IntensityModel; // Intensity model type (defaults to "legacy")
    defaultPreset?: PercentagePreset; // Default preset for percentage_1rm model
    durationPerSet?: number; // Duration per set in seconds (for sets_time model)
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

export interface WorkoutImport {
    id: string;
    userId: string;
    sourceUrl: string;
    sourcePlatform?: string | null;
    title?: string | null;
    category?: string | null;
    description?: string | null;
    thumbnailUrl?: string | null;
    html?: string | null;
    metadata?: Record<string, any> | null;
    isGlobal: boolean;
    createdAt: string;
    updatedAt: string;
}
