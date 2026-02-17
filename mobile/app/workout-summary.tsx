import React from "react";
import {
    View,
    Text,
    TouchableOpacity,
    StyleSheet,
    ScrollView,
    useColorScheme,
} from "react-native";
import { useLocalSearchParams, useRouter } from "expo-router";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { Ionicons } from "@expo/vector-icons";
import { getTheme, spacing, radii, typography } from "@/src/theme";

interface ExerciseLog {
    workoutId: string;
    title: string;
    setsCompleted: number;
    reps?: number;
    duration?: number;
}

export default function WorkoutSummaryScreen() {
    const { totalTime, exerciseCount, logs } = useLocalSearchParams<{
        totalTime: string;
        exerciseCount: string;
        logs: string;
    }>();
    const router = useRouter();
    const insets = useSafeAreaInsets();
    const scheme = useColorScheme();
    const theme = getTheme(scheme === "dark" ? "dark" : "light");

    const elapsedMs = parseInt(totalTime || "0", 10);
    const totalMinutes = Math.floor(elapsedMs / 60000);
    const totalSeconds = Math.floor((elapsedMs % 60000) / 1000);
    const count = parseInt(exerciseCount || "0", 10);

    let exerciseLogs: ExerciseLog[] = [];
    try {
        exerciseLogs = JSON.parse(decodeURIComponent(logs || "[]"));
    } catch {
        exerciseLogs = [];
    }

    const totalSets = exerciseLogs.reduce(
        (sum, l) => sum + (l.setsCompleted || 0),
        0,
    );

    return (
        <View
            style={[
                styles.container,
                {
                    backgroundColor: theme.colors.bg,
                    paddingTop: insets.top + spacing.xl,
                    paddingBottom: insets.bottom + spacing.md,
                },
            ]}
        >
            <ScrollView
                contentContainerStyle={styles.scrollContent}
                showsVerticalScrollIndicator={false}
            >
                {/* Header */}
                <View style={styles.header}>
                    <View
                        style={[
                            styles.iconCircle,
                            { backgroundColor: theme.colors.accent },
                        ]}
                    >
                        <Ionicons name="checkmark" size={40} color="#FFFFFF" />
                    </View>
                    <Text
                        style={[
                            styles.title,
                            {
                                color: theme.colors.text,
                                fontFamily: typography.fonts.headlineSemibold,
                            },
                        ]}
                    >
                        Workout Complete
                    </Text>
                </View>

                {/* Stats */}
                <View style={styles.statsRow}>
                    <View
                        style={[
                            styles.statCard,
                            {
                                backgroundColor: theme.colors.glassWhite,
                                borderColor: theme.colors.glassBorder,
                            },
                        ]}
                    >
                        <Text
                            style={[
                                styles.statValue,
                                {
                                    color: theme.colors.text,
                                    fontFamily: typography.fonts.headlineSemibold,
                                },
                            ]}
                        >
                            {count}
                        </Text>
                        <Text
                            style={[
                                styles.statLabel,
                                {
                                    color: theme.colors.textTertiary,
                                    fontFamily: typography.fonts.body,
                                },
                            ]}
                        >
                            Exercises
                        </Text>
                    </View>

                    <View
                        style={[
                            styles.statCard,
                            {
                                backgroundColor: theme.colors.glassWhite,
                                borderColor: theme.colors.glassBorder,
                            },
                        ]}
                    >
                        <Text
                            style={[
                                styles.statValue,
                                {
                                    color: theme.colors.text,
                                    fontFamily: typography.fonts.headlineSemibold,
                                },
                            ]}
                        >
                            {totalSets}
                        </Text>
                        <Text
                            style={[
                                styles.statLabel,
                                {
                                    color: theme.colors.textTertiary,
                                    fontFamily: typography.fonts.body,
                                },
                            ]}
                        >
                            Sets
                        </Text>
                    </View>

                    <View
                        style={[
                            styles.statCard,
                            {
                                backgroundColor: theme.colors.glassWhite,
                                borderColor: theme.colors.glassBorder,
                            },
                        ]}
                    >
                        <Text
                            style={[
                                styles.statValue,
                                {
                                    color: theme.colors.text,
                                    fontFamily: typography.fonts.headlineSemibold,
                                },
                            ]}
                        >
                            {totalMinutes > 0
                                ? `${totalMinutes}m`
                                : `${totalSeconds}s`}
                        </Text>
                        <Text
                            style={[
                                styles.statLabel,
                                {
                                    color: theme.colors.textTertiary,
                                    fontFamily: typography.fonts.body,
                                },
                            ]}
                        >
                            Duration
                        </Text>
                    </View>
                </View>

                {/* Exercise list */}
                {exerciseLogs.length > 0 && (
                    <View style={styles.exerciseList}>
                        <Text
                            style={[
                                styles.sectionTitle,
                                {
                                    color: theme.colors.text,
                                    fontFamily: typography.fonts.headline,
                                },
                            ]}
                        >
                            Exercises Completed
                        </Text>
                        {exerciseLogs.map((log, i) => (
                            <View
                                key={i}
                                style={[
                                    styles.exerciseRow,
                                    {
                                        backgroundColor: theme.colors.glassWhite,
                                        borderColor: theme.colors.glassBorder,
                                    },
                                ]}
                            >
                                <View
                                    style={[
                                        styles.checkCircle,
                                        { backgroundColor: theme.colors.accent },
                                    ]}
                                >
                                    <Ionicons
                                        name="checkmark"
                                        size={14}
                                        color="#FFFFFF"
                                    />
                                </View>
                                <View style={styles.exerciseInfo}>
                                    <Text
                                        style={[
                                            styles.exerciseName,
                                            {
                                                color: theme.colors.text,
                                                fontFamily:
                                                    typography.fonts.bodyMedium,
                                            },
                                        ]}
                                        numberOfLines={1}
                                    >
                                        {log.title}
                                    </Text>
                                    <Text
                                        style={[
                                            styles.exerciseDetail,
                                            {
                                                color: theme.colors.textTertiary,
                                                fontFamily: typography.fonts.body,
                                            },
                                        ]}
                                    >
                                        {log.setsCompleted} sets
                                        {log.reps ? ` × ${log.reps} reps` : ""}
                                        {log.duration
                                            ? ` — ${log.duration} min`
                                            : ""}
                                    </Text>
                                </View>
                            </View>
                        ))}
                    </View>
                )}
            </ScrollView>

            {/* Done button */}
            <TouchableOpacity
                style={[
                    styles.doneButton,
                    { backgroundColor: theme.colors.accent },
                ]}
                onPress={() => router.replace("/(tabs)")}
                activeOpacity={0.85}
            >
                <Text style={styles.doneButtonText}>Done</Text>
            </TouchableOpacity>
        </View>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        paddingHorizontal: spacing.md,
    },
    scrollContent: {
        flexGrow: 1,
    },
    header: {
        alignItems: "center",
        marginBottom: spacing.lg,
        gap: 16,
    },
    iconCircle: {
        width: 72,
        height: 72,
        borderRadius: 36,
        justifyContent: "center",
        alignItems: "center",
    },
    title: {
        fontSize: typography.sizes.xl,
    },
    statsRow: {
        flexDirection: "row",
        gap: 12,
        marginBottom: spacing.lg,
    },
    statCard: {
        flex: 1,
        alignItems: "center",
        paddingVertical: spacing.md,
        borderRadius: radii.lg,
        borderWidth: 1,
    },
    statValue: {
        fontSize: typography.sizes.xl,
        marginBottom: 4,
    },
    statLabel: {
        fontSize: typography.sizes.xs,
        textTransform: "uppercase",
        letterSpacing: 0.5,
    },
    sectionTitle: {
        fontSize: typography.sizes.lg,
        marginBottom: 12,
    },
    exerciseList: {
        marginTop: spacing.sm,
    },
    exerciseRow: {
        flexDirection: "row",
        alignItems: "center",
        padding: spacing.sm,
        borderRadius: radii.md,
        borderWidth: 1,
        marginBottom: 8,
        gap: 12,
    },
    checkCircle: {
        width: 28,
        height: 28,
        borderRadius: 14,
        justifyContent: "center",
        alignItems: "center",
    },
    exerciseInfo: {
        flex: 1,
    },
    exerciseName: {
        fontSize: typography.sizes.md,
        marginBottom: 2,
    },
    exerciseDetail: {
        fontSize: typography.sizes.sm,
    },
    doneButton: {
        borderRadius: radii.full,
        paddingVertical: 16,
        alignItems: "center",
        minHeight: 56,
        justifyContent: "center",
    },
    doneButtonText: {
        fontFamily: typography.fonts.bodySemibold,
        fontSize: typography.sizes.md,
        color: "#FFFFFF",
    },
});
