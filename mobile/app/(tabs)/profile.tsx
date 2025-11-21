import React from "react";
import { UserProfile } from "@/src/screens/UserProfile";
import { getCurrentUserId } from "@/src/state/session";

export default function ProfileScreen() {
    const userId = getCurrentUserId();
    if (!userId) {
        return null; // or show an error/loading state
    }
    return <UserProfile userId={userId} />;
}
