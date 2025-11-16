import { apiService } from "../services/api";
import { User } from "../types";

let currentUserIdMemory: string | null = null;
let currentPlanIdMemory: string | null = null;

export function setCurrentUserId(userId: string | null) {
    currentUserIdMemory = userId;
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
