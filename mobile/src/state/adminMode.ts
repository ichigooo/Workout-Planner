import AsyncStorage from "@react-native-async-storage/async-storage";

const STORAGE_KEY = "@workout_planner:adminModeEnabled";

let dbAdmin = false;
let modeEnabled = true;
let initialized = false;
let listeners: Set<() => void> = new Set();

function emitChange() {
    listeners.forEach((l) => l());
}

export async function initAdminMode(isAdmin: boolean): Promise<void> {
    dbAdmin = isAdmin;
    if (!isAdmin) {
        modeEnabled = true;
        initialized = false;
        emitChange();
        return;
    }
    if (initialized) {
        emitChange();
        return;
    }
    try {
        const stored = await AsyncStorage.getItem(STORAGE_KEY);
        modeEnabled = stored !== null ? stored === "true" : true;
    } catch {
        modeEnabled = true;
    }
    initialized = true;
    emitChange();
}

export async function toggleAdminMode(): Promise<void> {
    if (!dbAdmin) return;
    modeEnabled = !modeEnabled;
    emitChange();
    try {
        await AsyncStorage.setItem(STORAGE_KEY, String(modeEnabled));
    } catch {
        // persist silently fails — toggle still works in-memory
    }
}

export function getIsDbAdmin(): boolean {
    return dbAdmin;
}

export function getSnapshot(): boolean {
    return dbAdmin && modeEnabled;
}

export function subscribe(listener: () => void): () => void {
    listeners.add(listener);
    return () => listeners.delete(listener);
}
