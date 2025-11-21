import AsyncStorage from "@react-native-async-storage/async-storage";
import { apiService } from "../services/api";
import { User } from "../types";

const USER_ID_STORAGE_KEY = "@workout_planner:userId";

let currentUserIdMemory: string | null = null;
let currentPlanIdMemory: string | null = null;

/**
 * Loads the stored user ID from AsyncStorage
 */
export async function loadStoredUserId(): Promise<string | null> {
    try {
        const userId = await AsyncStorage.getItem(USER_ID_STORAGE_KEY);
        return userId;
    } catch (error) {
        console.error("[session] Failed to load stored userId:", error);
        return null;
    }
}

/**
 * Saves the user ID to AsyncStorage and updates memory
 */
export async function setCurrentUserId(userId: string | null): Promise<void> {
    currentUserIdMemory = userId;
    try {
        if (userId) {
            await AsyncStorage.setItem(USER_ID_STORAGE_KEY, userId);
        } else {
            await AsyncStorage.removeItem(USER_ID_STORAGE_KEY);
        }
    } catch (error) {
        console.error("[session] Failed to save userId:", error);
    }
}

/**
 * Clears the stored user ID (for logout)
 */
export async function clearCurrentUserId(): Promise<void> {
    await setCurrentUserId(null);
}

export function getCurrentUserId(): string | null {
    return currentUserIdMemory;
}

export function setCurrentPlanId(planId: string | null) {
    currentPlanIdMemory = planId;
}

export function getCurrentPlanId(): string | null {
    return currentPlanIdMemory;
}

export async function getCurrentUser(): Promise<User | null> {
    if (!currentUserIdMemory) return null;
    try {
        const user = await apiService.getUserProfile(currentUserIdMemory);
        return user;
    } catch {
        return null;
    }
}
