import React from "react";
import { View, Text, StyleSheet, TouchableOpacity, useColorScheme } from "react-native";
import { CurrentPR } from "../../types";
import { getTheme } from "../../theme";

interface PRCurrentDisplayProps {
    repCounts: number[];
    currentPRs: CurrentPR[];
    customReps: number[];
    onAddPR: (reps: number) => void;
}

export const PRCurrentDisplay: React.FC<PRCurrentDisplayProps> = ({
    repCounts,
    currentPRs,
    customReps,
    onAddPR,
}) => {
    const scheme = useColorScheme();
    const theme = getTheme(scheme === "dark" ? "dark" : "light");

    const getPRForReps = (reps: number): CurrentPR | undefined => {
        return currentPRs.find((pr) => pr.reps === reps);
    };

    const formatRepLabel = (reps: number): string => {
        if (reps === 1) return "1RM";
        return `${reps}RM`;
    };

    const formatDate = (dateString: string): string => {
        const date = new Date(dateString);
        return date.toLocaleDateString("en-US", { month: "short", day: "numeric" });
    };

    const isCustom = (reps: number): boolean => {
        return customReps.includes(reps);
    };

    return (
        <View style={styles.container}>
            {repCounts.map((reps) => {
                const pr = getPRForReps(reps);
                const isCustomRep = isCustom(reps);

                return (
                    <TouchableOpacity
                        key={reps}
                        style={[
                            styles.prCard,
                            {
                                backgroundColor: theme.colors.surface,
                                borderColor: theme.colors.border,
                            },
                        ]}
                        onPress={() => onAddPR(reps)}
                        activeOpacity={0.7}
                    >
                        <View style={styles.cardHeader}>
                            <Text style={[styles.repLabel, { color: theme.colors.text }]}>
                                {formatRepLabel(reps)}
                            </Text>
                            {isCustomRep && (
                                <View style={[styles.customBadge, { backgroundColor: theme.colors.accent + "20" }]}>
                                    <Text style={[styles.customBadgeText, { color: theme.colors.accent }]}>
                                        Custom
                                    </Text>
                                </View>
                            )}
                        </View>

                        {pr ? (
                            <>
                                <Text style={[styles.weightValue, { color: theme.colors.text }]}>
                                    {pr.weight} lbs
                                </Text>
                                <Text style={[styles.dateText, { color: theme.colors.subtext }]}>
                                    {formatDate(pr.dateAchieved)}
                                </Text>
                            </>
                        ) : (
                            <>
                                <Text style={[styles.noRecordText, { color: theme.colors.subtext }]}>
                                    No record
                                </Text>
                                <Text style={[styles.tapToAddText, { color: theme.colors.accent }]}>
                                    Tap to add
                                </Text>
                            </>
                        )}
                    </TouchableOpacity>
                );
            })}
        </View>
    );
};

const styles = StyleSheet.create({
    container: {
        flexDirection: "row",
        flexWrap: "wrap",
        gap: 12,
    },
    prCard: {
        minWidth: 100,
        flex: 1,
        padding: 14,
        borderRadius: 12,
        borderWidth: StyleSheet.hairlineWidth,
    },
    cardHeader: {
        flexDirection: "row",
        alignItems: "center",
        marginBottom: 8,
        gap: 6,
    },
    repLabel: {
        fontSize: 14,
        fontWeight: "600",
    },
    customBadge: {
        paddingHorizontal: 6,
        paddingVertical: 2,
        borderRadius: 4,
    },
    customBadgeText: {
        fontSize: 10,
        fontWeight: "600",
    },
    weightValue: {
        fontSize: 22,
        fontWeight: "700",
        fontFamily: "Fraunces_700Bold",
    },
    dateText: {
        fontSize: 12,
        marginTop: 4,
    },
    noRecordText: {
        fontSize: 14,
    },
    tapToAddText: {
        fontSize: 12,
        marginTop: 4,
        fontWeight: "500",
    },
});
