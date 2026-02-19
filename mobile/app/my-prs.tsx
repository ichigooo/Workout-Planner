import React, { useState, useEffect, useCallback } from "react";
import {
    View,
    Text,
    StyleSheet,
    ScrollView,
    useColorScheme,
    TouchableOpacity,
    ActivityIndicator,
    Image,
} from "react-native";
import { useRouter } from "expo-router";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { getTheme, typography } from "../src/theme";
import { apiService } from "../src/services/api";
import { getCurrentUserId } from "../src/state/session";
import { WorkoutPRSummary, CurrentPR } from "../src/types";

export default function MyPRsPage() {
    const router = useRouter();
    const scheme = useColorScheme();
    const theme = getTheme(scheme === "dark" ? "dark" : "light");
    const insets = useSafeAreaInsets();

    const [workouts, setWorkouts] = useState<WorkoutPRSummary[]>([]);
    const [loading, setLoading] = useState(true);
    const [userId] = useState<string | null>(() => getCurrentUserId());

    const fetchData = useCallback(async () => {
        if (!userId) return;

        try {
            setLoading(true);
            const response = await apiService.getAllPRs(userId);
            setWorkouts(response.workouts);
        } catch (error) {
            console.error("Error fetching all PRs:", error);
        } finally {
            setLoading(false);
        }
    }, [userId]);

    useEffect(() => {
        fetchData();
    }, [fetchData]);

    const formatRepLabel = (reps: number): string => {
        if (reps === 1) return "1RM";
        return `${reps}RM`;
    };

    const getPRForReps = (records: CurrentPR[], reps: number): CurrentPR | undefined => {
        return records.find((pr) => pr.reps === reps);
    };

    const handleWorkoutPress = (workout: WorkoutPRSummary) => {
        router.push({
            pathname: "/workout-pr-history",
            params: { workoutId: workout.workout.id, workoutTitle: workout.workout.title },
        });
    };

    return (
        <View style={[styles.container, { backgroundColor: theme.colors.bg }]}>
            {/* Header */}
            <View style={[styles.header, { paddingTop: insets.top + 10 }]}>
                <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
                    <Text style={[styles.backButtonText, { color: theme.colors.text }]}>←</Text>
                </TouchableOpacity>
                <Text style={[styles.headerTitle, { color: theme.colors.text }]}>
                    My Personal Records
                </Text>
                <View style={styles.headerSpacer} />
            </View>

            {loading ? (
                <View style={styles.loadingContainer}>
                    <ActivityIndicator size="large" color={theme.colors.accent} />
                </View>
            ) : workouts.length === 0 ? (
                <View style={styles.emptyContainer}>
                    <Text style={[styles.emptyTitle, { color: theme.colors.text }]}>
                        No Tracked Workouts
                    </Text>
                    <Text style={[styles.emptyText, { color: theme.colors.textTertiary }]}>
                        Workouts with PR tracking enabled will appear here.
                    </Text>
                </View>
            ) : (
                <ScrollView
                    style={styles.content}
                    contentContainerStyle={styles.contentContainer}
                    showsVerticalScrollIndicator={false}
                >
                    {workouts.map((item) => {
                        const pr1RM = getPRForReps(item.currentRecords, 1);
                        const pr6RM = getPRForReps(item.currentRecords, 6);
                        const uniLabel = item.workout.isUnilateral
                            ? item.workout.category === "Legs" ? "per leg" : "per arm"
                            : undefined;

                        return (
                            <TouchableOpacity
                                key={item.workout.id}
                                style={[
                                    styles.workoutCard,
                                    {
                                        backgroundColor: theme.colors.glassWhite,
                                        borderColor: theme.colors.glassBorder,
                                    },
                                ]}
                                onPress={() => handleWorkoutPress(item)}
                                activeOpacity={0.7}
                            >
                                <View style={styles.workoutInfo}>
                                    {item.workout.imageUrl ? (
                                        <Image
                                            source={{ uri: item.workout.imageUrl }}
                                            style={styles.workoutImage}
                                        />
                                    ) : (
                                        <View
                                            style={[
                                                styles.workoutImagePlaceholder,
                                                { backgroundColor: theme.colors.border },
                                            ]}
                                        >
                                            <Text style={[styles.placeholderText, { color: theme.colors.textTertiary }]}>
                                                {item.workout.title.charAt(0).toUpperCase()}
                                            </Text>
                                        </View>
                                    )}
                                    <View style={styles.workoutDetails}>
                                        <Text
                                            style={[styles.workoutTitle, { color: theme.colors.text }]}
                                            numberOfLines={1}
                                        >
                                            {item.workout.title}
                                        </Text>
                                        <Text
                                            style={[styles.workoutCategory, { color: theme.colors.textTertiary }]}
                                        >
                                            {item.workout.category}
                                        </Text>
                                    </View>
                                </View>

                                <View style={styles.prContainer}>
                                    <View style={styles.prItem}>
                                        <Text style={[styles.prLabel, { color: theme.colors.textTertiary }]}>
                                            1RM
                                        </Text>
                                        <Text style={[styles.prValue, { color: theme.colors.text }]}>
                                            {pr1RM ? `${pr1RM.weight} lbs` : "—"}
                                        </Text>
                                        {pr1RM && uniLabel && (
                                            <Text style={[styles.prUnilateral, { color: theme.colors.textTertiary }]}>
                                                {uniLabel}
                                            </Text>
                                        )}
                                    </View>
                                    <View
                                        style={[styles.prDivider, { backgroundColor: theme.colors.border }]}
                                    />
                                    <View style={styles.prItem}>
                                        <Text style={[styles.prLabel, { color: theme.colors.textTertiary }]}>
                                            6RM
                                        </Text>
                                        <Text style={[styles.prValue, { color: theme.colors.text }]}>
                                            {pr6RM ? `${pr6RM.weight} lbs` : "—"}
                                        </Text>
                                        {pr6RM && uniLabel && (
                                            <Text style={[styles.prUnilateral, { color: theme.colors.textTertiary }]}>
                                                {uniLabel}
                                            </Text>
                                        )}
                                    </View>
                                </View>

                                <View style={styles.chevron}>
                                    <Text style={[styles.chevronText, { color: theme.colors.textTertiary }]}>
                                        →
                                    </Text>
                                </View>
                            </TouchableOpacity>
                        );
                    })}

                    <View style={{ height: insets.bottom + 20 }} />
                </ScrollView>
            )}
        </View>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
    },
    header: {
        flexDirection: "row",
        alignItems: "center",
        paddingHorizontal: 16,
        paddingBottom: 16,
    },
    backButton: {
        width: 40,
        height: 40,
        alignItems: "center",
        justifyContent: "center",
    },
    backButtonText: {
        fontSize: 24,
        fontFamily: typography.fonts.bodySemibold,
    },
    headerTitle: {
        flex: 1,
        fontSize: typography.sizes.lg,
        fontFamily: typography.fonts.headline,
        textAlign: "center",
    },
    headerSpacer: {
        width: 40,
    },
    loadingContainer: {
        flex: 1,
        alignItems: "center",
        justifyContent: "center",
    },
    emptyContainer: {
        flex: 1,
        alignItems: "center",
        justifyContent: "center",
        paddingHorizontal: 40,
    },
    emptyTitle: {
        fontSize: 18,
        fontFamily: typography.fonts.headline,
        marginBottom: 8,
    },
    emptyText: {
        fontSize: 14,
        fontFamily: typography.fonts.body,
        textAlign: "center",
    },
    content: {
        flex: 1,
    },
    contentContainer: {
        padding: 16,
    },
    workoutCard: {
        borderRadius: 18,
        borderWidth: 1,
        padding: 16,
        marginBottom: 12,
    },
    workoutInfo: {
        flexDirection: "row",
        alignItems: "center",
        marginBottom: 16,
    },
    workoutImage: {
        width: 48,
        height: 48,
        borderRadius: 10,
    },
    workoutImagePlaceholder: {
        width: 48,
        height: 48,
        borderRadius: 10,
        alignItems: "center",
        justifyContent: "center",
    },
    placeholderText: {
        fontSize: 18,
        fontFamily: typography.fonts.headline,
    },
    workoutDetails: {
        flex: 1,
        marginLeft: 12,
    },
    workoutTitle: {
        fontSize: 16,
        fontFamily: typography.fonts.bodySemibold,
    },
    workoutCategory: {
        fontSize: 13,
        fontFamily: typography.fonts.body,
        marginTop: 2,
    },
    prContainer: {
        flexDirection: "row",
        alignItems: "center",
    },
    prItem: {
        flex: 1,
        alignItems: "center",
    },
    prLabel: {
        fontSize: 12,
        fontFamily: typography.fonts.bodyMedium,
        marginBottom: 4,
    },
    prValue: {
        fontSize: 18,
        fontFamily: typography.fonts.headlineSemibold,
    },
    prUnilateral: {
        fontSize: 10,
        fontFamily: typography.fonts.bodyMedium,
        marginTop: 2,
    },
    prDivider: {
        width: 1,
        height: 32,
    },
    chevron: {
        position: "absolute",
        right: 16,
        top: 16,
    },
    chevronText: {
        fontSize: 18,
    },
});
