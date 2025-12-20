import React from "react";
import {
    View,
    Text,
    StyleSheet,
    TouchableOpacity,
    useColorScheme,
    Image,
    ImageSourcePropType,
} from "react-native";
import { getTheme } from "../theme";
import { Workout } from "../types";

interface WorkoutCardProps {
    workout: Workout;
    onPress?: () => void;
    onEdit?: () => void;
    onDelete?: () => void;
    isCustom?: boolean;
}

export const WorkoutCard: React.FC<WorkoutCardProps> = ({
    workout,
    onPress,
    onEdit: _onEdit,
    onDelete: _onDelete,
    isCustom = false,
}) => {
    const scheme = useColorScheme();
    const theme = getTheme(scheme === "dark" ? "dark" : "light");

    const equipmentIconSources: Record<string, ImageSourcePropType> = {
        dumbbell: require("../../assets/images/equipment/dumbbell.png"),
        barbell: require("../../assets/images/equipment/barbell.png"),
        kettlebell: require("../../assets/images/equipment/kettlebell.png"),
    };

    const getEquipmentIconForTitle = (title: string): ImageSourcePropType | null => {
        const lower = title.toLowerCase();
        if (lower.includes("dumbbell")) return equipmentIconSources.dumbbell;
        if (lower.includes("barbell")) return equipmentIconSources.barbell;
        if (lower.includes("kettlebell")) return equipmentIconSources.kettlebell;
        return null;
    };

    const equipmentIcon = getEquipmentIconForTitle(workout.title);

    return (
        <TouchableOpacity
            style={[
                styles.card,
                {
                    backgroundColor: theme.colors.surface,
                    borderColor: theme.colors.border,
                    ...theme.shadows.card,
                },
            ]}
            onPress={onPress}
        >
            <View style={styles.header}>
                <View style={styles.badgesRow}>
                    {!!workout.category && (
                        <View style={[styles.categoryBadge, { backgroundColor: theme.colors.accent }]}>
                            <Text style={[styles.categoryText, { color: theme.colors.surface }]}>
                                {workout.category}
                            </Text>
                        </View>
                    )}
                    {isCustom && (
                        <View
                            style={[
                                styles.categoryBadge,
                                styles.customBadge,
                                { backgroundColor: "#F0C2C2" },
                            ]}
                        >
                            <Text style={[styles.categoryText, { color: theme.colors.surface }]}>
                                CUSTOM
                            </Text>
                        </View>
                    )}
                </View>
                {equipmentIcon && (
                    <Image
                        source={equipmentIcon}
                        style={styles.equipmentIcon}
                        resizeMode="contain"
                    />
                )}
            </View>
            <View style={styles.content}>
                <Text style={[styles.title, { color: theme.colors.text }]}>{workout.title}</Text>
                {!!workout.description && (
                    <Text
                        style={[styles.description, { color: theme.colors.subtext }]}
                        numberOfLines={2}
                    >
                        {workout.description}
                    </Text>
                )}
                <View style={styles.details}>
                    <View style={styles.detailMeta}>
                        {workout.workoutType === "cardio" ? (
                            workout.duration ? (
                                <Text style={[styles.detailText, { color: theme.colors.text }]}>
                                    {`${workout.duration} min`}
                                </Text>
                            ) : null
                        ) : (
                            workout.sets && workout.reps ? (
                                <Text style={[styles.detailText, { color: theme.colors.text }]}>
                                    {`${workout.sets} sets × ${workout.reps} reps`}
                                </Text>
                            ) : null
                        )}
                    </View>
                    {!!workout.intensity && (
                        <View style={styles.detailIntensityContainer}>
                            <Text
                                style={[
                                    styles.detailIntensityText,
                                    { color: theme.colors.subtext },
                                ]}
                            >
                                {workout.intensity}
                            </Text>
                        </View>
                    )}
                </View>
            </View>
        </TouchableOpacity>
    );
};

const styles = StyleSheet.create({
    card: {
        borderRadius: 12,
        marginVertical: 8,
        marginHorizontal: 16,
        borderWidth: 1,
    },
    header: {
        paddingTop: 16,
        paddingHorizontal: 16,
        paddingBottom: 8,
        flexDirection: "row",
        justifyContent: "space-between",
        alignItems: "center",
    },
    badgesRow: {
        flexDirection: "row",
        alignItems: "center",
    },
    categoryBadge: {
        alignSelf: "flex-start",
        paddingHorizontal: 12,
        paddingVertical: 6,
        borderRadius: 16,
    },
    categoryText: {
        fontSize: 12,
        fontWeight: "600",
        fontFamily: "Inter_600SemiBold",
        textTransform: "uppercase",
        letterSpacing: 0.5,
    },
    customBadge: {
        marginLeft: 8,
    },
    equipmentIcon: {
        width: 24,
        height: 24,
        marginLeft: 8,
    },
    content: {
        paddingHorizontal: 16,
        paddingBottom: 16,
    },
    title: {
        fontSize: 18,
        fontWeight: "600",
        marginBottom: 8,
        fontFamily: "Inter_600SemiBold",
        letterSpacing: -0.3,
    },
    description: {
        fontSize: 14,
        marginBottom: 12,
        lineHeight: 20,
        fontFamily: "Inter_400Regular",
    },
    details: {
        flexDirection: "row",
        alignItems: "flex-start",
        marginTop: 4,
    },
    detailMeta: {
        flexShrink: 0,
        marginRight: 12,
    },
    detailText: {
        fontSize: 14,
        fontWeight: "500",
        fontFamily: "Inter_500Medium",
    },
    detailIntensityContainer: {
        flex: 1,
    },
    detailIntensityText: {
        fontSize: 14,
        fontWeight: "500",
        fontFamily: "Inter_500Medium",
        textAlign: "right",
    },
});
