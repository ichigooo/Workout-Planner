// app/(tabs)/index.tsx
import React from "react";
import { useRouter } from "expo-router";
import Home from "@/src/screens/Home";

export default function HomeTabScreen() {
    const router = useRouter();

    return (
        <Home
            onOpenCalendar={() => router.push("/calendar")}
            onOpenProfile={() => router.push("/profile")}
            onOpenLibrary={(category?: string) =>
                router.push({
                    pathname: "/library",
                    params: category ? { category } : undefined,
                })
            }
            onOpenRoutine={() => router.push("/library")}
        />
    );
}
