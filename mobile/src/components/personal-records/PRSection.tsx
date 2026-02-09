import React, { useState, useEffect, useCallback } from "react";
import {
    View,
    Text,
    StyleSheet,
    TouchableOpacity,
    useColorScheme,
} from "react-native";
import { Workout, CurrentPR } from "../../types";
import { getTheme } from "../../theme";
import { apiService } from "../../services/api";
import { PRCurrentDisplay } from "./PRCurrentDisplay";
import { PREntryForm } from "./PREntryForm";
import { PRCelebration } from "./PRCelebration";
import { useRouter } from "expo-router";

// Standard rep counts that are always shown
const STANDARD_REPS = [1, 6];

interface PRSectionProps {
    workout: Workout;
    userId: string | null;
}

export const PRSection: React.FC<PRSectionProps> = ({ workout, userId }) => {
    const scheme = useColorScheme();
    const theme = getTheme(scheme === "dark" ? "dark" : "light");
    const router = useRouter();

    const [currentPRs, setCurrentPRs] = useState<CurrentPR[]>([]);
    const [customReps, setCustomReps] = useState<number[]>([]);
    const [loading, setLoading] = useState(true);
    const [showEntryForm, setShowEntryForm] = useState(false);
    const [selectedReps, setSelectedReps] = useState<number | null>(null);
    const [showCelebration, setShowCelebration] = useState(false);

    // All tracked rep counts (standard + custom)
    const allRepCounts = [...STANDARD_REPS, ...customReps].sort((a, b) => a - b);

    // Rep counts that have existing records
    const existingRepCounts = currentPRs.map((pr) => pr.reps);

    const fetchData = useCallback(async () => {
        if (!userId) return;

        try {
            setLoading(true);
            const [prs, config] = await Promise.all([
                apiService.getCurrentPRs(workout.id, userId),
                apiService.getRepConfig(workout.id, userId),
            ]);
            setCurrentPRs(prs);
            setCustomReps(config.customReps || []);
        } catch (error) {
            console.error("Error fetching PR data:", error);
        } finally {
            setLoading(false);
        }
    }, [workout.id, userId]);

    useEffect(() => {
        fetchData();
    }, [fetchData]);

    // Opens form with a specific rep count pre-selected (for tapping on existing cards)
    const handleAddPR = (reps: number) => {
        setSelectedReps(reps);
        setShowEntryForm(true);
    };

    // Opens form to log any PR (user picks reps)
    const handleLogNewPR = () => {
        setSelectedReps(null); // null means user will choose
        setShowEntryForm(true);
    };

    const handlePRSaved = async (isNewRecord: boolean, savedReps: number) => {
        setShowEntryForm(false);

        // If user saved a custom rep count that we're not tracking yet, add it
        if (!allRepCounts.includes(savedReps) && userId) {
            const newCustomReps = [...customReps, savedReps].slice(0, 2); // max 2 custom
            try {
                await apiService.updateRepConfig(workout.id, userId, newCustomReps);
                setCustomReps(newCustomReps);
            } catch (error) {
                console.error("Error saving custom rep config:", error);
            }
        }

        fetchData();
        if (isNewRecord) {
            setShowCelebration(true);
        }
    };

    const handleViewHistory = () => {
        router.push({
            pathname: "/workout-pr-history",
            params: { workoutId: workout.id, workoutTitle: workout.title },
        });
    };

    if (!userId) {
        return (
            <View style={styles.section}>
                <Text style={[styles.sectionTitle, { color: theme.colors.text }]}>
                    Personal Records
                </Text>
                <Text style={[styles.signInHint, { color: theme.colors.subtext }]}>
                    Sign in to track your personal records.
                </Text>
            </View>
        );
    }

    return (
        <View style={styles.section}>
            <View style={styles.headerRow}>
                <Text style={[styles.sectionTitle, { color: theme.colors.text }]}>
                    Personal Records
                </Text>
                <TouchableOpacity onPress={handleViewHistory}>
                    <Text style={[styles.viewHistoryLink, { color: theme.colors.accent }]}>
                        View History
                    </Text>
                </TouchableOpacity>
            </View>

            {loading ? (
                <Text style={[styles.loadingText, { color: theme.colors.subtext }]}>
                    Loading records...
                </Text>
            ) : (
                <>
                    <PRCurrentDisplay
                        repCounts={allRepCounts}
                        currentPRs={currentPRs}
                        onAddPR={handleAddPR}
                        customReps={customReps}
                    />

                    {/* Log New PR Button */}
                    <TouchableOpacity
                        style={[styles.logNewButton, { backgroundColor: theme.colors.accent }]}
                        onPress={handleLogNewPR}
                        activeOpacity={0.8}
                    >
                        <Text style={styles.logNewButtonText}>+ Log New PR</Text>
                    </TouchableOpacity>
                </>
            )}

            <PREntryForm
                visible={showEntryForm}
                workoutId={workout.id}
                userId={userId}
                initialReps={selectedReps}
                existingReps={existingRepCounts}
                onClose={() => setShowEntryForm(false)}
                onSave={handlePRSaved}
            />

            <PRCelebration
                visible={showCelebration}
                onComplete={() => setShowCelebration(false)}
            />
        </View>
    );
};

const styles = StyleSheet.create({
    section: {
        paddingHorizontal: 20,
        paddingVertical: 16,
    },
    headerRow: {
        flexDirection: "row",
        justifyContent: "space-between",
        alignItems: "center",
        marginBottom: 12,
    },
    sectionTitle: {
        fontSize: 18,
        fontWeight: "700",
        fontFamily: "Fraunces_700Bold",
    },
    viewHistoryLink: {
        fontSize: 14,
        fontWeight: "600",
    },
    loadingText: {
        fontSize: 14,
        marginTop: 8,
    },
    signInHint: {
        fontSize: 14,
        marginTop: 8,
    },
    logNewButton: {
        marginTop: 16,
        paddingVertical: 14,
        paddingHorizontal: 20,
        borderRadius: 12,
        alignItems: "center",
    },
    logNewButtonText: {
        color: "#FFFFFF",
        fontSize: 15,
        fontWeight: "600",
    },
});
