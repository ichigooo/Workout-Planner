import { apiService } from "../services/api";
import { User } from "../types";

let currentUserIdMemory: string | null = null;

export function setCurrentUserId(userId: string | null) {
    currentUserIdMemory = userId;
}

export function getCurrentUserId(): string | null {
    return currentUserIdMemory;
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


