import React, { useState, useEffect } from "react";
import { useRouter } from "expo-router";
import { LandingScreen } from "@/src/screens/LandingScreen";
import initApp from "@/src/services/startup";
import { loadStoredUserId } from "@/src/state/session";

export default function Index() {
    const router = useRouter();
    const [isInitializing, setIsInitializing] = useState(false);

    // Start initialization in the background (non-blocking)
    useEffect(() => {
        // Try to initialize if user is already logged in
        const tryInitialize = async () => {
            try {
                const userId = await loadStoredUserId();
                if (userId) {
                    // User is logged in, start initialization in background
                    console.log("[Index] User found, initializing app in background");
                    initApp().catch((error) => {
                        console.error("[Index] Background initialization failed:", error);
                    });
                }
            } catch (error) {
                console.error("[Index] Failed to check for user:", error);
            }
        };

        tryInitialize();
    }, []);

    const handleBegin = async () => {
        try {
            setIsInitializing(true);
            if (process.env.EXPO_PUBLIC_CLEAR_STORAGE_ON_START === "true") {
                console.log("[Index] Clearing storage as per config");
                // Clear AsyncStorage for fresh start (for testing purposes)
                const AsyncStorage = require("@react-native-async-storage/async-storage").default;
                await AsyncStorage.clear();
            }
            // Check if user is logged in
            const userId = await loadStoredUserId();

            if (!userId) {
                // No user logged in, navigate to sign-in
                console.log("[Index] No user found, redirecting to sign-in");
                router.replace("/(auth)/sign-in");
                return;
            }

            // User is logged in, ensure app is initialized
            console.log("[Index] User found, ensuring app is initialized");
            await initApp();

            // Navigate to main app
            router.replace("/(tabs)");
        } catch (error) {
            console.error("[Index] Failed to initialize or navigate:", error);
            // On error, redirect to sign-in as fallback
            router.replace("/(auth)/sign-in");
        } finally {
            setIsInitializing(false);
        }
    };

    // Always show landing screen first
    return <LandingScreen onBegin={handleBegin} isLoading={isInitializing} />;
}
