import AsyncStorage from "@react-native-async-storage/async-storage";
import { apiService } from "../services/api";
import { User } from "../types";
import { initAdminMode } from "./adminMode";

const USER_ID_STORAGE_KEY = "@workout_planner:userId";

let currentUserIdMemory: string | null = null;
let currentPlanIdMemory: string | null = null;

/**
 * Loads the stored user ID from AsyncStorage and syncs to memory
 */
export async function loadStoredUserId(): Promise<string | null> {
    try {
        const userId = await AsyncStorage.getItem(USER_ID_STORAGE_KEY);
        // Sync to memory so getCurrentUserId() works immediately after
        if (userId) {
            currentUserIdMemory = userId;
        }
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
    await initAdminMode(false);
}

export function getCurrentUserId(): string | null {
    return currentUserIdMemory;
}

/**
 * Gets the current user ID, loading from storage if memory is empty.
 * Use this when you need to ensure you have the userId.
 */
export async function ensureCurrentUserId(): Promise<string | null> {
    if (currentUserIdMemory) {
        return currentUserIdMemory;
    }
    return loadStoredUserId();
}

export function setCurrentPlanId(planId: string | null) {
    currentPlanIdMemory = planId;
}

export function getCurrentPlanId(): string | null {
    return currentPlanIdMemory;
}

export async function getCurrentUser(): Promise<User | null> {
    const userId = await ensureCurrentUserId();
    if (!userId) return null;
    try {
        const user = await apiService.getUserProfile(userId);
        await initAdminMode(user.isAdmin);
        return user;
    } catch {
        return null;
    }
}
