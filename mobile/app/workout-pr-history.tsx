import React, { useState, useEffect, useCallback } from "react";
import {
    View,
    Text,
    StyleSheet,
    ScrollView,
    useColorScheme,
    TouchableOpacity,
    Dimensions,
    ActivityIndicator,
} from "react-native";
import { useLocalSearchParams, useRouter } from "expo-router";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { LineChart } from "react-native-chart-kit";
import { getTheme, typography } from "../src/theme";
import { apiService } from "../src/services/api";
import { getCurrentUserId } from "../src/state/session";
import { PersonalRecordEntry, CurrentPR } from "../src/types";

const SCREEN_WIDTH = Dimensions.get("window").width;

export default function WorkoutPRHistory() {
    const { workoutId, workoutTitle } = useLocalSearchParams<{
        workoutId: string;
        workoutTitle: string;
    }>();
    const router = useRouter();
    const scheme = useColorScheme();
    const theme = getTheme(scheme === "dark" ? "dark" : "light");
    const insets = useSafeAreaInsets();

    const [entries, setEntries] = useState<PersonalRecordEntry[]>([]);
    const [currentPRs, setCurrentPRs] = useState<CurrentPR[]>([]);
    const [loading, setLoading] = useState(true);
    const [selectedReps, setSelectedReps] = useState<number>(1);
    const [userId] = useState<string | null>(() => getCurrentUserId());

    // Get unique rep counts from entries
    const repCounts = [...new Set(entries.map((e) => e.reps))].sort((a, b) => a - b);

    const fetchData = useCallback(async () => {
        if (!userId || !workoutId) return;

        try {
            setLoading(true);
            const [entriesData, currentData] = await Promise.all([
                apiService.getPREntries(workoutId, userId),
                apiService.getCurrentPRs(workoutId, userId),
            ]);
            setEntries(entriesData);
            setCurrentPRs(currentData);

            // Select the first available rep count
            if (entriesData.length > 0) {
                const reps = [...new Set(entriesData.map((e) => e.reps))].sort((a, b) => a - b);
                if (reps.length > 0 && !reps.includes(selectedReps)) {
                    setSelectedReps(reps[0]);
                }
            }
        } catch (error) {
            console.error("Error fetching PR history:", error);
        } finally {
            setLoading(false);
        }
    }, [userId, workoutId, selectedReps]);

    useEffect(() => {
        fetchData();
    }, [fetchData]);

    const formatRepLabel = (reps: number): string => {
        if (reps === 1) return "1RM";
        return `${reps}RM`;
    };

    const formatDate = (dateString: string): string => {
        const date = new Date(dateString);
        return date.toLocaleDateString("en-US", { month: "short", day: "numeric" });
    };

    const formatFullDate = (dateString: string): string => {
        const date = new Date(dateString);
        return date.toLocaleDateString("en-US", {
            month: "short",
            day: "numeric",
            year: "numeric",
        });
    };

    // Filter entries by selected rep count and sort by date
    const filteredEntries = entries
        .filter((e) => e.reps === selectedReps)
        .sort((a, b) => new Date(a.dateAchieved).getTime() - new Date(b.dateAchieved).getTime());

    // Prepare chart data
    const chartData = {
        labels: filteredEntries.slice(-7).map((e) => formatDate(e.dateAchieved)),
        datasets: [
            {
                data: filteredEntries.slice(-7).map((e) => e.weight),
                color: () => theme.colors.accent,
                strokeWidth: 2,
            },
        ],
    };

    const currentBest = currentPRs.find((pr) => pr.reps === selectedReps);

    return (
        <View style={[styles.container, { backgroundColor: theme.colors.bg }]}>
            {/* Header */}
            <View style={[styles.header, { paddingTop: insets.top + 10 }]}>
                <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
                    <Text style={[styles.backButtonText, { color: theme.colors.text }]}>←</Text>
                </TouchableOpacity>
                <View style={styles.headerTitleContainer}>
                    <Text style={[styles.headerTitle, { color: theme.colors.text }]} numberOfLines={1}>
                        {workoutTitle || "PR History"}
                    </Text>
                    <Text style={[styles.headerSubtitle, { color: theme.colors.textTertiary }]}>
                        Progress History
                    </Text>
                </View>
                <View style={styles.headerSpacer} />
            </View>

            {loading ? (
                <View style={styles.loadingContainer}>
                    <ActivityIndicator size="large" color={theme.colors.accent} />
                </View>
            ) : entries.length === 0 ? (
                <View style={styles.emptyContainer}>
                    <Text style={[styles.emptyText, { color: theme.colors.textTertiary }]}>
                        No records yet. Start logging your PRs!
                    </Text>
                </View>
            ) : (
                <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
                    {/* Rep Count Tabs */}
                    <ScrollView
                        horizontal
                        showsHorizontalScrollIndicator={false}
                        style={styles.tabsContainer}
                        contentContainerStyle={styles.tabsContent}
                    >
                        {repCounts.map((reps) => (
                            <TouchableOpacity
                                key={reps}
                                style={[
                                    styles.tab,
                                    {
                                        backgroundColor:
                                            selectedReps === reps
                                                ? theme.colors.accent
                                                : theme.colors.glassWhite,
                                        borderColor: selectedReps === reps
                                            ? theme.colors.accent
                                            : theme.colors.glassBorder,
                                    },
                                ]}
                                onPress={() => setSelectedReps(reps)}
                            >
                                <Text
                                    style={[
                                        styles.tabText,
                                        {
                                            color:
                                                selectedReps === reps ? "#FFFFFF" : theme.colors.text,
                                        },
                                    ]}
                                >
                                    {formatRepLabel(reps)}
                                </Text>
                            </TouchableOpacity>
                        ))}
                    </ScrollView>

                    {/* Current Best */}
                    {currentBest && (
                        <View
                            style={[
                                styles.currentBestCard,
                                {
                                    backgroundColor: theme.colors.glassWhite,
                                    borderColor: theme.colors.glassBorder,
                                },
                            ]}
                        >
                            <Text style={[styles.currentBestLabel, { color: theme.colors.textTertiary }]}>
                                Current Best ({formatRepLabel(selectedReps)})
                            </Text>
                            <Text style={[styles.currentBestValue, { color: theme.colors.text }]}>
                                {currentBest.weight} lbs
                            </Text>
                            <Text style={[styles.currentBestDate, { color: theme.colors.textTertiary }]}>
                                Achieved {formatFullDate(currentBest.dateAchieved)}
                            </Text>
                        </View>
                    )}

                    {/* Chart */}
                    {filteredEntries.length >= 2 && (
                        <View style={styles.chartContainer}>
                            <Text style={[styles.chartTitle, { color: theme.colors.text }]}>
                                Progress Chart
                            </Text>
                            <LineChart
                                data={chartData}
                                width={SCREEN_WIDTH - 40}
                                height={220}
                                chartConfig={{
                                    backgroundColor: theme.colors.surface,
                                    backgroundGradientFrom: theme.colors.surface,
                                    backgroundGradientTo: theme.colors.surface,
                                    decimalPlaces: 0,
                                    color: () => theme.colors.accent,
                                    labelColor: () => theme.colors.textTertiary,
                                    style: {
                                        borderRadius: 12,
                                    },
                                    propsForDots: {
                                        r: "5",
                                        strokeWidth: "2",
                                        stroke: theme.colors.accent,
                                    },
                                }}
                                bezier
                                style={styles.chart}
                            />
                        </View>
                    )}

                    {/* History List */}
                    <View style={styles.historySection}>
                        <Text style={[styles.historyTitle, { color: theme.colors.text }]}>
                            All Entries
                        </Text>
                        {filteredEntries
                            .slice()
                            .reverse()
                            .map((entry, index) => {
                                const isBest = currentBest?.entryId === entry.id;
                                return (
                                    <View
                                        key={entry.id}
                                        style={[
                                            styles.historyItem,
                                            {
                                                backgroundColor: theme.colors.glassWhite,
                                                borderColor: isBest
                                                    ? theme.colors.accent
                                                    : theme.colors.glassBorder,
                                                borderWidth: isBest ? 2 : 1,
                                            },
                                        ]}
                                    >
                                        <View style={styles.historyItemLeft}>
                                            <Text
                                                style={[
                                                    styles.historyWeight,
                                                    { color: theme.colors.text },
                                                ]}
                                            >
                                                {entry.weight} lbs
                                            </Text>
                                            <Text
                                                style={[
                                                    styles.historyDate,
                                                    { color: theme.colors.textTertiary },
                                                ]}
                                            >
                                                {formatFullDate(entry.dateAchieved)}
                                            </Text>
                                        </View>
                                        {isBest && (
                                            <View
                                                style={[
                                                    styles.prBadge,
                                                    { backgroundColor: theme.colors.accent + "20" },
                                                ]}
                                            >
                                                <Text
                                                    style={[
                                                        styles.prBadgeText,
                                                        { color: theme.colors.accent },
                                                    ]}
                                                >
                                                    PR
                                                </Text>
                                            </View>
                                        )}
                                    </View>
                                );
                            })}
                    </View>

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
        paddingBottom: 12,
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
    headerTitleContainer: {
        flex: 1,
        alignItems: "center",
    },
    headerTitle: {
        fontSize: 18,
        fontFamily: typography.fonts.headline,
    },
    headerSubtitle: {
        fontSize: 12,
        fontFamily: typography.fonts.body,
        marginTop: 2,
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
    emptyText: {
        fontSize: 16,
        textAlign: "center",
    },
    content: {
        flex: 1,
    },
    tabsContainer: {
        marginTop: 8,
    },
    tabsContent: {
        paddingHorizontal: 20,
        gap: 10,
    },
    tab: {
        paddingVertical: 10,
        paddingHorizontal: 20,
        borderRadius: 9999,
        borderWidth: 1,
        marginRight: 10,
    },
    tabText: {
        fontSize: 14,
        fontFamily: typography.fonts.bodySemibold,
    },
    currentBestCard: {
        margin: 20,
        padding: 20,
        borderRadius: 18,
        borderWidth: 1,
        alignItems: "center",
    },
    currentBestLabel: {
        fontSize: 14,
        fontFamily: typography.fonts.bodyMedium,
    },
    currentBestValue: {
        fontSize: 36,
        fontFamily: typography.fonts.headlineSemibold,
        marginVertical: 8,
    },
    currentBestDate: {
        fontSize: 13,
    },
    chartContainer: {
        paddingHorizontal: 20,
        marginBottom: 24,
    },
    chartTitle: {
        fontSize: 16,
        fontFamily: typography.fonts.headline,
        marginBottom: 12,
    },
    chart: {
        borderRadius: 16,
    },
    historySection: {
        paddingHorizontal: 20,
    },
    historyTitle: {
        fontSize: 16,
        fontFamily: typography.fonts.headline,
        marginBottom: 12,
    },
    historyItem: {
        flexDirection: "row",
        alignItems: "center",
        justifyContent: "space-between",
        padding: 16,
        borderRadius: 16,
        marginBottom: 10,
    },
    historyItemLeft: {},
    historyWeight: {
        fontSize: 18,
        fontFamily: typography.fonts.headlineSemibold,
    },
    historyDate: {
        fontSize: 13,
        marginTop: 4,
    },
    prBadge: {
        paddingHorizontal: 10,
        paddingVertical: 4,
        borderRadius: 6,
    },
    prBadgeText: {
        fontSize: 12,
        fontFamily: typography.fonts.bodyBold,
    },
});
