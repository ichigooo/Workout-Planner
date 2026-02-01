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
import { getTheme, spacing, radii, typography } from "../theme";
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
                        <View
                            style={[
                                styles.categoryBadge,
                                {
                                    backgroundColor: theme.colors.accent,
                                    borderRadius: radii.full,
                                },
                            ]}
                        >
                            <Text
                                style={[
                                    styles.categoryText,
                                    {
                                        color: "#FFFFFF",
                                        fontFamily: typography.fonts.bodySemibold,
                                        fontSize: typography.sizes.xs,
                                    },
                                ]}
                            >
                                {workout.category}
                            </Text>
                        </View>
                    )}
                    {isCustom && (
                        <View
                            style={[
                                styles.categoryBadge,
                                styles.customBadge,
                                {
                                    backgroundColor: theme.colors.sage,
                                    borderRadius: radii.full,
                                },
                            ]}
                        >
                            <Text
                                style={[
                                    styles.categoryText,
                                    {
                                        color: "#FFFFFF",
                                        fontFamily: typography.fonts.bodySemibold,
                                        fontSize: typography.sizes.xs,
                                    },
                                ]}
                            >
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
                <Text
                    style={[
                        styles.title,
                        {
                            color: theme.colors.text,
                            fontFamily: typography.fonts.bodySemiBold,
                            fontSize: typography.sizes.lg,
                        },
                    ]}
                >
                    {workout.title}
                </Text>
                {!!workout.description && (
                    <Text
                        style={[
                            styles.description,
                            {
                                color: theme.colors.textSecondary,
                                fontFamily: typography.fonts.body,
                                fontSize: typography.sizes.sm,
                            },
                        ]}
                        numberOfLines={2}
                    >
                        {workout.description}
                    </Text>
                )}
                <View style={styles.details}>
                    <View style={styles.detailMeta}>
                        {workout.workoutType === "cardio" ? (
                            workout.duration ? (
                                <Text
                                    style={[
                                        styles.detailText,
                                        {
                                            color: theme.colors.text,
                                            fontFamily: typography.fonts.bodyMedium,
                                            fontSize: typography.sizes.sm,
                                        },
                                    ]}
                                >
                                    {`${workout.duration} min`}
                                </Text>
                            ) : null
                        ) : (
                            workout.sets && workout.reps ? (
                                <Text
                                    style={[
                                        styles.detailText,
                                        {
                                            color: theme.colors.text,
                                            fontFamily: typography.fonts.bodyMedium,
                                            fontSize: typography.sizes.sm,
                                        },
                                    ]}
                                >
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
                                    {
                                        color: theme.colors.textSecondary,
                                        fontFamily: typography.fonts.bodyMedium,
                                        fontSize: typography.sizes.sm,
                                    },
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
        borderRadius: radii.lg, // 20px - soft, organic shape
        marginVertical: spacing.xs,
        marginHorizontal: spacing.sm,
        borderWidth: 1,
    },
    header: {
        paddingTop: spacing.md,
        paddingHorizontal: spacing.md,
        paddingBottom: spacing.xs,
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
        paddingHorizontal: spacing.sm,
        paddingVertical: 6,
    },
    categoryText: {
        fontWeight: "600",
        textTransform: "uppercase",
        letterSpacing: 0.8,
    },
    customBadge: {
        marginLeft: spacing.xs,
    },
    equipmentIcon: {
        width: 24,
        height: 24,
        marginLeft: spacing.xs,
    },
    content: {
        paddingHorizontal: spacing.md,
        paddingBottom: spacing.md,
    },
    title: {
        fontWeight: "600",
        marginBottom: spacing.xs,
        letterSpacing: -0.3,
    },
    description: {
        marginBottom: spacing.sm,
        lineHeight: 20,
    },
    details: {
        flexDirection: "row",
        alignItems: "flex-start",
        marginTop: spacing.xxs,
    },
    detailMeta: {
        flexShrink: 0,
        marginRight: spacing.sm,
    },
    detailText: {
        fontWeight: "500",
    },
    detailIntensityContainer: {
        flex: 1,
    },
    detailIntensityText: {
        fontWeight: "500",
        textAlign: "right",
    },
});
