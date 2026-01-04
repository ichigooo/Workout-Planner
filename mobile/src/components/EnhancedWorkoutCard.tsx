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
import { Ionicons } from "@expo/vector-icons";
import { getTheme, spacing, radii } from "../theme";
import { Workout } from "../types";

interface EnhancedWorkoutCardProps {
    workout: Workout;
    onPress?: () => void;
    onBookmark?: () => void;
    onAddToPlan?: () => void;
    onDelete?: () => void;
    isCustom?: boolean;
    showQuickActions?: boolean;
    isBookmarked?: boolean;
}

export const EnhancedWorkoutCard: React.FC<EnhancedWorkoutCardProps> = ({
    workout,
    onPress,
    onBookmark,
    onAddToPlan,
    onDelete,
    isCustom = false,
    showQuickActions = false,
    isBookmarked = false,
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

    // Determine intensity color
    const getIntensityColor = (intensity: string) => {
        const lower = intensity.toLowerCase();
        if (lower.includes("max") || lower.includes("high") || lower.includes("hard")) {
            return "#F44336"; // Red
        }
        if (lower.includes("medium") || lower.includes("moderate")) {
            return "#FF9800"; // Orange
        }
        return "#4CAF50"; // Green
    };

    const intensityColor = workout.intensity ? getIntensityColor(workout.intensity) : theme.colors.subtext;

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
            activeOpacity={0.7}
        >
            {/* Category Badge - Top Right Corner */}
            <View style={styles.badgeContainer}>
                {!!workout.category && (
                    <View style={[styles.categoryBadge, { backgroundColor: theme.colors.accent }]}>
                        <Text style={styles.categoryText}>{workout.category}</Text>
                    </View>
                )}
                {isCustom && (
                    <View style={[styles.customBadge, { backgroundColor: "#F0C2C2" }]}>
                        <Text style={styles.customText}>CUSTOM</Text>
                    </View>
                )}
            </View>

            {/* Main Content */}
            <View style={styles.content}>
                {/* Title */}
                <View style={styles.titleRow}>
                    <Text style={[styles.title, { color: theme.colors.text }]} numberOfLines={2}>
                        {workout.title}
                    </Text>
                    {equipmentIcon && (
                        <Image
                            source={equipmentIcon}
                            style={styles.equipmentIcon}
                            resizeMode="contain"
                        />
                    )}
                </View>

                {/* Description */}
                {!!workout.description && workout.description !== "TBD" ? (
                    <Text
                        style={[styles.description, { color: theme.colors.subtext }]}
                        numberOfLines={2}
                    >
                        {workout.description}
                    </Text>
                ) : (
                    <Text
                        style={[styles.descriptionPlaceholder, { color: theme.colors.subtext }]}
                    >
                        No description yet
                    </Text>
                )}

                {/* Metadata Icons & Info */}
                <View style={styles.metadata}>
                    {workout.workoutType === "cardio" ? (
                        workout.duration ? (
                            <View style={styles.metadataItem}>
                                <Ionicons name="time-outline" size={16} color={theme.colors.subtext} />
                                <Text style={[styles.metadataText, { color: theme.colors.text }]}>
                                    {workout.duration} min
                                </Text>
                            </View>
                        ) : null
                    ) : workout.sets && workout.reps ? (
                        <View style={styles.metadataItem}>
                            <Ionicons name="fitness-outline" size={16} color={theme.colors.subtext} />
                            <Text style={[styles.metadataText, { color: theme.colors.text }]}>
                                {workout.sets} sets × {workout.reps} reps
                            </Text>
                        </View>
                    ) : null}

                    {!!workout.intensity && (
                        <View style={styles.metadataItem}>
                            <Ionicons name="flash-outline" size={16} color={intensityColor} />
                            <Text style={[styles.metadataText, { color: intensityColor }]}>
                                {workout.intensity}
                            </Text>
                        </View>
                    )}
                </View>

                {/* Delete Button for Custom Workouts */}
                {isCustom && onDelete && (
                    <TouchableOpacity
                        style={[styles.deleteButton, { borderColor: theme.colors.border }]}
                        onPress={(e) => {
                            e.stopPropagation();
                            onDelete();
                        }}
                    >
                        <Ionicons name="trash-outline" size={16} color={theme.colors.danger} />
                        <Text style={[styles.deleteText, { color: theme.colors.danger }]}>
                            Delete
                        </Text>
                    </TouchableOpacity>
                )}

                {/* Quick Actions */}
                {showQuickActions && (
                    <View style={styles.quickActions}>
                        {onBookmark && (
                            <TouchableOpacity
                                style={[
                                    styles.actionButton,
                                    { borderColor: theme.colors.border },
                                ]}
                                onPress={(e) => {
                                    e.stopPropagation();
                                    onBookmark();
                                }}
                            >
                                <Ionicons
                                    name={isBookmarked ? "bookmark" : "bookmark-outline"}
                                    size={18}
                                    color={isBookmarked ? theme.colors.accent : theme.colors.text}
                                />
                                <Text
                                    style={[
                                        styles.actionText,
                                        {
                                            color: isBookmarked
                                                ? theme.colors.accent
                                                : theme.colors.text,
                                        },
                                    ]}
                                >
                                    {isBookmarked ? "Saved" : "Save"}
                                </Text>
                            </TouchableOpacity>
                        )}

                        {onAddToPlan && (
                            <TouchableOpacity
                                style={[
                                    styles.actionButton,
                                    styles.actionButtonPrimary,
                                    { backgroundColor: theme.colors.accent },
                                ]}
                                onPress={(e) => {
                                    e.stopPropagation();
                                    onAddToPlan();
                                }}
                            >
                                <Ionicons name="add-circle-outline" size={18} color="#fff" />
                                <Text style={styles.actionTextPrimary}>Add to Plan</Text>
                            </TouchableOpacity>
                        )}
                    </View>
                )}
            </View>
        </TouchableOpacity>
    );
};

const styles = StyleSheet.create({
    card: {
        borderRadius: radii.lg,
        marginVertical: spacing.xs,
        marginHorizontal: spacing.md,
        borderWidth: 1,
        overflow: "hidden",
    },
    badgeContainer: {
        position: "absolute",
        top: spacing.md,
        right: spacing.md,
        flexDirection: "row",
        gap: spacing.xs,
        zIndex: 1,
    },
    categoryBadge: {
        paddingHorizontal: spacing.sm,
        paddingVertical: 4,
        borderRadius: radii.sm,
    },
    categoryText: {
        fontSize: 10,
        fontWeight: "700",
        color: "#fff",
        textTransform: "uppercase",
        letterSpacing: 0.5,
    },
    customBadge: {
        paddingHorizontal: spacing.sm,
        paddingVertical: 4,
        borderRadius: radii.sm,
    },
    customText: {
        fontSize: 10,
        fontWeight: "700",
        color: "#fff",
        textTransform: "uppercase",
        letterSpacing: 0.5,
    },
    content: {
        padding: spacing.md,
        paddingTop: spacing.xl + spacing.xs, // Extra space for badge
    },
    titleRow: {
        flexDirection: "row",
        alignItems: "flex-start",
        justifyContent: "space-between",
        marginBottom: spacing.xs,
        gap: spacing.xs,
    },
    title: {
        flex: 1,
        fontSize: 18,
        fontWeight: "700",
        letterSpacing: 0.2,
        lineHeight: 24,
    },
    equipmentIcon: {
        width: 24,
        height: 24,
    },
    description: {
        fontSize: 14,
        lineHeight: 20,
        marginBottom: spacing.sm,
    },
    descriptionPlaceholder: {
        fontSize: 14,
        lineHeight: 20,
        marginBottom: spacing.sm,
        fontStyle: "italic",
    },
    metadata: {
        flexDirection: "row",
        flexWrap: "wrap",
        gap: spacing.md,
        marginBottom: spacing.sm,
    },
    metadataItem: {
        flexDirection: "row",
        alignItems: "center",
        gap: 6,
    },
    metadataText: {
        fontSize: 14,
        fontWeight: "500",
    },
    quickActions: {
        flexDirection: "row",
        gap: spacing.sm,
        marginTop: spacing.xs,
        paddingTop: spacing.sm,
        borderTopWidth: 1,
        borderTopColor: "rgba(0,0,0,0.05)",
    },
    actionButton: {
        flex: 1,
        flexDirection: "row",
        alignItems: "center",
        justifyContent: "center",
        gap: 6,
        paddingVertical: spacing.xs,
        paddingHorizontal: spacing.sm,
        borderRadius: radii.md,
        borderWidth: 1,
    },
    actionButtonPrimary: {
        borderWidth: 0,
    },
    actionText: {
        fontSize: 14,
        fontWeight: "600",
    },
    actionTextPrimary: {
        fontSize: 14,
        fontWeight: "600",
        color: "#fff",
    },
    deleteButton: {
        flexDirection: "row",
        alignItems: "center",
        gap: 6,
        paddingVertical: spacing.xs,
        paddingHorizontal: spacing.sm,
        borderRadius: radii.md,
        borderWidth: 1,
        alignSelf: "flex-start",
        marginTop: spacing.xs,
    },
    deleteText: {
        fontSize: 14,
        fontWeight: "600",
    },
});
