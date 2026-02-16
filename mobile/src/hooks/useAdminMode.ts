import { useSyncExternalStore } from "react";
import { subscribe, getSnapshot, getIsDbAdmin } from "../state/adminMode";

export function useAdminMode() {
    const isAdminModeActive = useSyncExternalStore(subscribe, getSnapshot);
    return {
        isAdminModeActive,
        isDbAdmin: getIsDbAdmin(),
    };
}
