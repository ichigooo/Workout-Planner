// app/(tabs)/home/index.tsx
import React from "react";
import { useRouter } from "expo-router";
import Home from "@/src/screens/Home";

export default function HomeTabScreen() {
    const router = useRouter();

    return (
        <Home
            onOpenCalendar={() => router.navigate("/(tabs)/calendar")}
            onOpenProfile={() => router.push("/(tabs)/home/profile")}
            onOpenLibrary={(category?: string) =>
                router.navigate({
                    pathname: "/(tabs)/library",
                    params: category ? { category } : undefined,
                })
            }
            onOpenRoutine={() => router.navigate("/(tabs)/library")}
        />
    );
}
