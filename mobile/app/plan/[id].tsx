// app/plan/[id].tsx
import React, { useEffect, useMemo, useState } from "react";
import {
    View,
    Text,
    ScrollView,
    ActivityIndicator,
    TouchableOpacity,
    StyleSheet,
    LayoutAnimation,
    Platform,
    UIManager,
    ImageBackground,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { StatusBar } from "expo-status-bar";
import { useLocalSearchParams, useRouter } from "expo-router";
import { useColorScheme } from "react-native";
import { getTheme } from "@/src/theme";
import type { WorkoutPlanTemplate, Workout } from "@/src/types";
import { planItemsCache } from "@/src/services/planItemsCache";
import { PlanSetupModal } from "@/src/components/plan/PlanSetupModal";

export const options = {
    headerShown: false,
};

if (Platform.OS === "android" && UIManager.setLayoutAnimationEnabledExperimental) {
    UIManager.setLayoutAnimationEnabledExperimental(true);
}

export default function PlanDetailScreen() {
    const { id, data } = useLocalSearchParams<{ id?: string; data?: string }>();
    const router = useRouter();
    const scheme = useColorScheme();
    const theme = getTheme(scheme === "dark" ? "dark" : "light");
    const insets = useSafeAreaInsets();

    const [template, setTemplate] = useState<WorkoutPlanTemplate | null>(null);
    const [loadingTemplate, setLoadingTemplate] = useState(true);
    const [loadingWorkouts, setLoadingWorkouts] = useState(true);
    const [workoutLookup, setWorkoutLookup] = useState<Record<string, Workout>>({});
    const [expandedWeekIndex, setExpandedWeekIndex] = useState<number | null>(null);
    const [showSetup, setShowSetup] = useState(false);

    // Resolve template from params
    useEffect(() => {
        const resolveTemplate = () => {
            if (data) {
                try {
                    const parsed = JSON.parse(decodeURIComponent(data)) as WorkoutPlanTemplate;
                    setTemplate(parsed);
                } catch (err) {
                    console.error("[PlanDetail] Failed to parse passed template:", err);
                }
            }
            setLoadingTemplate(false);
        };
        resolveTemplate();
    }, [data]);

    // Load workouts for lookup
    useEffect(() => {
        const loadWorkouts = async () => {
            try {
                const workouts = await planItemsCache.getWorkouts();
                const map: Record<string, Workout> = {};
                workouts.forEach((w) => {
                    map[w.id] = w;
                });
                setWorkoutLookup(map);
            } catch (err) {
                console.error("[PlanDetail] Failed to load workouts for lookup:", err);
            } finally {
                setLoadingWorkouts(false);
            }
        };
        loadWorkouts();
    }, []);

    const weekDetails = useMemo(() => {
        if (!template) return [];
        return template.workoutStructure.map((week) =>
            week.map((day) => {
                const workouts = day.workoutIds
                    .map((workoutId) => workoutLookup[workoutId])
                    .filter(Boolean) as Workout[];
                return { ...day, workouts };
            }),
        );
    }, [template, workoutLookup]);

    if (loadingTemplate || loadingWorkouts || !template) {
        return (
            <View style={{ flex: 1, justifyContent: "center", alignItems: "center" }}>
                <ActivityIndicator />
            </View>
        );
    }

    const toggleWeek = (index: number) => {
        LayoutAnimation.configureNext(LayoutAnimation.Presets.easeInEaseOut);
        setExpandedWeekIndex((prev) => (prev === index ? null : index));
    };

    return (
        <View style={{ flex: 1 }}>
            {/* Transparent status bar over the image */}
            <StatusBar style="light" translucent backgroundColor="transparent" />

            <ImageBackground
                source={require("@/assets/images/bg3.png")}
                style={styles.bg}
                imageStyle={styles.bgImage}
            >
                <ScrollView
                    style={{ flex: 1 }}
                    contentContainerStyle={{
                        paddingHorizontal: 20,
                        paddingTop: insets.top + 12,
                        paddingBottom: insets.bottom + 32,
                        gap: 16,
                    }}
                    contentInsetAdjustmentBehavior="never"
                >
                    {/* HERO */}
                    <View style={styles.hero}>
                        <TouchableOpacity
                            onPress={() => router.back()}
                            activeOpacity={0.8}
                            style={styles.backButton}
                        >
                            <Text style={styles.backText}>← Back</Text>
                        </TouchableOpacity>

                        <Text style={styles.heroTitle}>{template.name}</Text>
                        {template.description ? (
                            <Text style={styles.heroSubtitle}>{template.description}</Text>
                        ) : null}
                        <Text style={styles.heroMeta}>
                            {template.numWeeks} weeks · {template.daysPerWeek} days/week
                        </Text>
                    </View>

                    {/* CTA placed above week cards */}
                    {!showSetup && (
                        <TouchableOpacity
                            style={[styles.button, { backgroundColor: theme.colors.accent }]}
                            onPress={() => setShowSetup(true)}
                        >
                            <Text style={styles.buttonText}>Use this plan</Text>
                        </TouchableOpacity>
                    )}

                    {/* FLOATING WEEK CARDS */}
                    {weekDetails.map((week, weekIdx) => {
                        const isExpanded = expandedWeekIndex === weekIdx;
                        return (
                            <TouchableOpacity
                                key={weekIdx}
                                activeOpacity={0.9}
                                onPress={() => toggleWeek(weekIdx)}
                            >
                                <View
                                    style={[
                                        styles.weekCard,
                                        { backgroundColor: theme.colors.surface },
                                        isExpanded && styles.weekCardExpanded,
                                    ]}
                                >
                                    <View style={styles.weekHeader}>
                                        <Text style={styles.weekTitle}>Week {weekIdx + 1}</Text>
                                        <Text style={styles.weekToggle}>
                                            {isExpanded ? "Hide" : "Show"}
                                        </Text>
                                    </View>

                                    {week.map((day, dayIdx) => (
                                        <View key={dayIdx} style={styles.dayRow}>
                                            <View style={styles.dayInfo}>
                                                <Text style={styles.dayName}>
                                                    Day {dayIdx + 1}: {day.name}
                                                </Text>
                                                <Text style={styles.dayMeta}>
                                                    {day.workouts.length} workouts
                                                </Text>
                                            </View>

                                            {isExpanded && day.workouts.length > 0 && (
                                                <View style={styles.workoutList}>
                                                    {day.workouts.map((workout) => (
                                                        <Text
                                                            key={workout.id}
                                                            style={styles.workoutItem}
                                                        >
                                                            • {workout.title}
                                                        </Text>
                                                    ))}
                                                </View>
                                            )}
                                        </View>
                                    ))}
                                </View>
                            </TouchableOpacity>
                        );
                    })}
                </ScrollView>
                <PlanSetupModal
                    visible={showSetup}
                    templateId={template.id}
                    template={template}
                    weeklyDays={template.daysPerWeek}
                    onClose={() => setShowSetup(false)}
                    onPlanCreated={() => {
                        setShowSetup(false);
                        router.push("/calendar");
                    }}
                />
            </ImageBackground>
        </View>
    );
}

const styles = StyleSheet.create({
    bg: {
        flex: 1,
    },
    bgImage: {
        resizeMode: "cover",
    },
    hero: {
        marginBottom: 8,
    },
    backButton: {
        marginBottom: 12,
    },
    backText: {
        color: "#FFFFFF",
        fontSize: 16,
    },
    heroTitle: {
        color: "#FFFFFF",
        fontSize: 24,
        fontWeight: "700",
        marginBottom: 8,
    },
    heroSubtitle: {
        color: "#FFFFFF",
        opacity: 0.9,
        fontSize: 14,
        lineHeight: 20,
        marginBottom: 8,
    },
    heroMeta: {
        color: "#FFFFFF",
        fontSize: 14,
        fontWeight: "500",
    },
    weekCard: {
        borderRadius: 18,
        paddingVertical: 14,
        paddingHorizontal: 16,
        marginTop: 8,
        opacity: 0.96,
    },
    weekCardExpanded: {},
    weekHeader: {
        flexDirection: "row",
        justifyContent: "space-between",
        alignItems: "center",
        marginBottom: 8,
    },
    weekTitle: {
        fontSize: 16,
        fontWeight: "600",
    },
    weekToggle: {
        fontSize: 14,
        opacity: 0.7,
    },
    dayRow: {
        marginBottom: 10,
    },
    dayInfo: {
        flexDirection: "row",
        justifyContent: "space-between",
        alignItems: "center",
    },
    dayName: {
        fontSize: 14,
        fontWeight: "500",
    },
    dayMeta: {
        fontSize: 13,
        opacity: 0.7,
    },
    workoutList: {
        marginTop: 6,
        paddingLeft: 8,
    },
    workoutItem: {
        fontSize: 13,
        color: "#333",
        marginBottom: 2,
    },
    button: {
        marginTop: 16,
        borderRadius: 999,
        paddingVertical: 14,
        alignItems: "center",
    },
    buttonText: {
        color: "#fff",
        fontWeight: "600",
        fontSize: 16,
    },
});
