import { Ionicons } from "@expo/vector-icons";
import { WorkoutCategory } from "../types";

export const CATEGORY_ICONS: Record<WorkoutCategory, keyof typeof Ionicons.glyphMap> = {
    "Upper Body - Pull": "arrow-down-outline",
    "Upper Body - Push": "arrow-up-outline",
    "Legs": "walk-outline",
    "Core": "body-outline",
    "Climbing - Power": "flash-outline",
    "Climbing - Endurance": "trending-up-outline",
    "Climbing - Warm Up": "flame-outline",
    "Mobility": "fitness-outline",
};

export const WORKOUT_CATEGORIES: WorkoutCategory[] = [
    "Upper Body - Pull",
    "Upper Body - Push",
    "Legs",
    "Core",
    "Climbing - Power",
    "Climbing - Endurance",
    "Climbing - Warm Up",
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
    "Mobility": "Flexibility and mobility exercises to improve range of motion",
};
