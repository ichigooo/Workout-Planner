import React, { useState, useEffect, useCallback, useMemo } from "react";
import {
    View,
    Text,
    StyleSheet,
    TouchableOpacity,
    useColorScheme,
} from "react-native";
import { Workout, CurrentPR } from "../../types";
import { buildDisplayPRs } from "../../utils/epley";
import { getTheme } from "../../theme";
import { apiService } from "../../services/api";
import { PRCurrentDisplay } from "./PRCurrentDisplay";
import { PREntryForm } from "./PREntryForm";
import { PRCelebration } from "./PRCelebration";
import { useRouter } from "expo-router";

interface PRSectionProps {
    workout: Workout;
    userId: string | null;
}

export const PRSection: React.FC<PRSectionProps> = ({ workout, userId }) => {
    const scheme = useColorScheme();
    const theme = getTheme(scheme === "dark" ? "dark" : "light");
    const router = useRouter();

    const [currentPRs, setCurrentPRs] = useState<CurrentPR[]>([]);
    const [loading, setLoading] = useState(true);
    const [showEntryForm, setShowEntryForm] = useState(false);
    const [selectedReps, setSelectedReps] = useState<number | null>(null);
    const [showCelebration, setShowCelebration] = useState(false);

    // Derive tracked rep counts from workout presets
    const presetRepCounts = [...new Set(
        workout.presets
            ?.filter((p) => p.reps != null)
            .map((p) => p.reps!) ?? []
    )].sort((a, b) => a - b);

    const displayPRs = useMemo(
        () => buildDisplayPRs(currentPRs, presetRepCounts),
        [currentPRs, presetRepCounts]
    );

    const unilateralLabel = workout.isUnilateral
        ? workout.category === "Legs" ? "per leg" : "per arm"
        : undefined;

    const fetchData = useCallback(async () => {
        if (!userId) return;

        try {
            setLoading(true);
            const prs = await apiService.getCurrentPRs(workout.id, userId);
            setCurrentPRs(prs);
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

    const handlePRSaved = async (isNewRecord: boolean, _savedReps: number) => {
        setShowEntryForm(false);
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
            ) : presetRepCounts.length === 0 ? (
                <Text style={[styles.loadingText, { color: theme.colors.subtext }]}>
                    No rep-based presets configured for this exercise.
                </Text>
            ) : (
                <PRCurrentDisplay
                    displayPRs={displayPRs}
                    onAddPR={handleAddPR}
                    unilateralLabel={unilateralLabel}
                />
            )}

            <PREntryForm
                visible={showEntryForm}
                workoutId={workout.id}
                userId={userId}
                initialReps={selectedReps}
                repOptions={presetRepCounts}
                existingReps={currentPRs.map((pr) => pr.reps)}
                unilateralLabel={unilateralLabel}
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
        paddingVertical: 12,
    },
    headerRow: {
        flexDirection: "row",
        justifyContent: "space-between",
        alignItems: "center",
        marginBottom: 8,
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
});
