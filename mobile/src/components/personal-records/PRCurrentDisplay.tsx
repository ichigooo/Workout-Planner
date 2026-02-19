import React from "react";
import { View, Text, StyleSheet, TouchableOpacity, useColorScheme } from "react-native";
import { DisplayPR } from "../../utils/epley";
import { getTheme } from "../../theme";

interface PRCurrentDisplayProps {
    displayPRs: DisplayPR[];
    onAddPR: (reps: number) => void;
    unilateralLabel?: string;
}

export const PRCurrentDisplay: React.FC<PRCurrentDisplayProps> = ({
    displayPRs,
    onAddPR,
    unilateralLabel,
}) => {
    const scheme = useColorScheme();
    const theme = getTheme(scheme === "dark" ? "dark" : "light");

    const formatRepLabel = (reps: number): string => {
        if (reps === 1) return "1RM";
        return `${reps}RM`;
    };

    const formatDate = (dateString: string): string => {
        const date = new Date(dateString);
        return date.toLocaleDateString("en-US", { month: "short", day: "numeric" });
    };

    return (
        <View
            style={[
                styles.container,
                {
                    backgroundColor: theme.colors.surface,
                    borderColor: theme.colors.border,
                },
            ]}
        >
            {displayPRs.map((item, index) => (
                <React.Fragment key={item.reps}>
                    {index > 0 && (
                        <View
                            style={[
                                styles.separator,
                                { backgroundColor: theme.colors.border },
                            ]}
                        />
                    )}
                    <TouchableOpacity
                        style={styles.cell}
                        onPress={() => onAddPR(item.reps)}
                        activeOpacity={0.7}
                    >
                        <Text style={[styles.repLabel, { color: theme.colors.subtext }]}>
                            {formatRepLabel(item.reps)}
                        </Text>

                        {item.weight > 0 ? (
                            item.isEstimate ? (
                                <>
                                    <Text
                                        style={[
                                            styles.estimatedWeight,
                                            { color: theme.colors.subtext },
                                        ]}
                                    >
                                        ~{item.weight} lbs
                                    </Text>
                                    {unilateralLabel && (
                                        <Text style={[styles.unilateralLabel, { color: theme.colors.subtext }]}>
                                            {unilateralLabel}
                                        </Text>
                                    )}
                                    <Text
                                        style={[
                                            styles.estimatedLabel,
                                            { color: theme.colors.subtext },
                                        ]}
                                    >
                                        est.
                                    </Text>
                                </>
                            ) : (
                                <>
                                    <Text style={[styles.weightValue, { color: theme.colors.text }]}>
                                        {item.weight} lbs
                                    </Text>
                                    {unilateralLabel && (
                                        <Text style={[styles.unilateralLabel, { color: theme.colors.subtext }]}>
                                            {unilateralLabel}
                                        </Text>
                                    )}
                                    <Text style={[styles.dateText, { color: theme.colors.subtext }]}>
                                        {formatDate(item.dateAchieved!)}
                                    </Text>
                                </>
                            )
                        ) : (
                            <Text style={[styles.tapToAddText, { color: theme.colors.accent }]}>
                                Tap to add
                            </Text>
                        )}
                    </TouchableOpacity>
                </React.Fragment>
            ))}
        </View>
    );
};

const styles = StyleSheet.create({
    container: {
        flexDirection: "row",
        borderRadius: 12,
        borderWidth: StyleSheet.hairlineWidth,
        overflow: "hidden",
    },
    cell: {
        flex: 1,
        paddingVertical: 10,
        paddingHorizontal: 12,
        alignItems: "center",
    },
    separator: {
        width: StyleSheet.hairlineWidth,
        alignSelf: "stretch",
    },
    repLabel: {
        fontSize: 12,
        fontWeight: "600",
        marginBottom: 2,
    },
    weightValue: {
        fontSize: 16,
        fontWeight: "700",
        fontFamily: "Fraunces_700Bold",
    },
    dateText: {
        fontSize: 11,
        marginTop: 1,
    },
    tapToAddText: {
        fontSize: 12,
        fontWeight: "500",
    },
    estimatedWeight: {
        fontSize: 15,
        fontWeight: "500",
        fontFamily: "DMSans_500Medium",
        opacity: 0.7,
    },
    unilateralLabel: {
        fontSize: 10,
        fontWeight: "500",
        fontFamily: "DMSans_500Medium",
        marginTop: 1,
    },
    estimatedLabel: {
        fontSize: 10,
        fontWeight: "400",
        fontFamily: "DMSans_400Regular",
        opacity: 0.5,
        marginTop: 1,
    },
});
