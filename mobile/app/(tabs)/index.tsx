import React from "react";
import { useRouter } from "expo-router";
import Home from "@/src/screens/Home";

export default function Index() {
    const router = useRouter();

    return (
        <Home
            onOpenCalendar={() => router.push("/(tabs)/calendar")}
            onOpenProfile={() => router.push("/(tabs)/profile")}
            onOpenLibrary={(category?: string) =>
                category
                    ? router.push(`/workout?category=${encodeURIComponent(category)}`)
                    : router.push("/workout")
            }
            onOpenRoutine={() => router.push("/(tabs)/library?tab=routine")}
        />
    );
}
