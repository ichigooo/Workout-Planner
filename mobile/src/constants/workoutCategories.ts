import { WorkoutCategory } from "../types";

export const WORKOUT_CATEGORIES: WorkoutCategory[] = [
    "Upper Body - Pull",
    "Upper Body - Push",
    "Legs",
    "Core",
    "Climbing - Power",
    "Climbing - Endurance",
    "Climbing - Warm Up",
    "Cardio",
    "Mobility",
];

export const WORKOUT_CATEGORY_LABELS: Record<WorkoutCategory, string> = {
    "Upper Body - Pull": "Upper Body - Pull",
    "Upper Body - Push": "Upper Body - Push",
    "Legs": "Legs",
    "Core": "Core",
    "Climbing - Power": "Climbing - Power",
    "Climbing - Endurance": "Climbing - Endurance",
    "Climbing - Warm Up": "Climbing - Warm Up",
    "Cardio": "Cardio",
    "Mobility": "Mobility",
};

export const WORKOUT_CATEGORY_DESCRIPTIONS: Record<WorkoutCategory, string> = {
    "Upper Body - Pull": "Exercises that pull weight toward your body (rows, pull-ups, etc.)",
    "Upper Body - Push": "Exercises that push weight away from your body (push-ups, presses, etc.)",
    "Legs": "Lower body exercises (squats, lunges, deadlifts, etc.)",
    "Core": "Abdominal and core strengthening exercises",
    "Climbing - Power": "High-intensity climbing movements and power training",
    "Climbing - Endurance": "Sustained climbing and endurance training",
    "Climbing - Warm Up": "Climbing-specific warm-up and mobility exercises",
    "Cardio": "Cardiovascular exercises (running, cycling, swimming, etc.)",
    "Mobility": "Flexibility and mobility exercises to improve range of motion",
};

export const WORKOUT_TYPES = {
    STRENGTH: "strength" as const,
    CARDIO: "cardio" as const,
} as const;

export const INTENSITY_TYPES = {
    WEIGHT: "weight",
    RPE: "RPE (Rate of Perceived Exertion)",
    BODYWEIGHT: "bodyweight",
    PACE: "pace",
    HEART_RATE: "heart rate",
    TIME: "time",
} as const;
