import React, { useState, useEffect } from "react";
import { useRouter } from "expo-router";
import { LandingScreen } from "@/src/screens/LandingScreen";
import initApp from "@/src/services/startup";

export default function Index() {
    const router = useRouter();
    const [isInitializing, setIsInitializing] = useState(false);

    // Start initialization as soon as landing screen loads
    useEffect(() => {
        initApp().catch((error) => {
            console.error("[Index] Initialization failed:", error);
        });
    }, []);

    const handleBegin = () => {
        // Navigate immediately - initialization is already running in background
        router.replace("/(tabs)");
    };

    // Show landing screen
    return <LandingScreen onBegin={handleBegin} isLoading={isInitializing} />;
}
