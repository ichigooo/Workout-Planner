import React from "react";
import { WorkoutDetail } from "@/src/components/WorkoutDetail";
import { useLocalSearchParams, useRouter } from "expo-router";
import { apiService } from "@/src/services/api";
import { useState, useEffect } from "react";
import { View, Text, ActivityIndicator, useColorScheme } from "react-native";
import { getTheme } from "@/src/theme";
import { Workout } from "@/src/types";

export default function WorkoutDetailScreen() {
    const router = useRouter();
    const params = useLocalSearchParams<{ id: string }>();
    const scheme = useColorScheme();
    const theme = getTheme(scheme === "dark" ? "dark" : "light");
    const [workout, setWorkout] = useState<Workout | null>(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const loadWorkout = async () => {
            if (!params.id) {
                router.back();
                return;
            }
            try {
                const data = await apiService.getWorkout(params.id);
                setWorkout(data);
            } catch (error) {
                console.error("Error loading workout:", error);
                router.back();
            } finally {
                setLoading(false);
            }
        };
        loadWorkout();
    }, [params.id]);

    if (loading) {
        return (
            <View
                style={{
                    flex: 1,
                    justifyContent: "center",
                    alignItems: "center",
                    backgroundColor: theme.colors.bg,
                }}
            >
                <ActivityIndicator size="large" color={theme.colors.accent} />
            </View>
        );
    }

    if (!workout) {
        return null;
    }

    return (
        <WorkoutDetail
            workout={workout}
            onEdit={(updated) => {
                setWorkout(updated);
            }}
            onDelete={() => {
                router.back();
            }}
            onClose={() => {
                router.back();
            }}
        />
    );
}
