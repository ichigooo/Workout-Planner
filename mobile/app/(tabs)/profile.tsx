import React from "react";
import { UserProfile } from "@/src/screens/UserProfile";

export default function ProfileScreen() {
    const userId = "48a1fd02-b5d4-4942-9356-439ecfbf13f8";
    return <UserProfile userId={userId} />;
}
