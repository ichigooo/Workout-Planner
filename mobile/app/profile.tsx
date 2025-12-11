import React from "react";
import { UserProfile } from "@/src/screens/UserProfile";
import { getCurrentUserId } from "@/src/state/session";

export default function ProfileRoute() {
    const userId = getCurrentUserId();
    if (!userId) {
        return null;
    }
    return <UserProfile userId={userId} />;
}

export const options = {
    headerShown: false,
};
