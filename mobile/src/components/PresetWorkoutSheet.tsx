import React, { useEffect, useState } from "react";
import {
    Modal,
    View,
    Text,
    TouchableOpacity,
    StyleSheet,
    ScrollView,
    Pressable,
    useColorScheme,
    ActivityIndicator,
    Image,
    ImageSourcePropType,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { Ionicons } from "@expo/vector-icons";
import { getTheme, spacing, radii, typography, hexToRgba } from "../theme";
import { planItemsCache } from "../services/planItemsCache";
import { Workout, getDefaultPreset } from "../types";

interface PresetWorkoutSheetProps {
    visible: boolean;
    presetName: string;
    workoutIds: string[];
    onClose: () => void;
    onStartWorkout: (workoutIds: string[]) => void;
}

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

const PresetWorkoutSheet: React.FC<PresetWorkoutSheetProps> = ({
    visible,
    presetName,
    workoutIds,
    onClose,
    onStartWorkout,
}) => {
    const scheme = useColorScheme();
    const theme = getTheme(scheme === "dark" ? "dark" : "light");
    const insets = useSafeAreaInsets();

    const [workouts, setWorkouts] = useState<Workout[]>([]);
    const [loading, setLoading] = useState(false);

    useEffect(() => {
        if (!visible || workoutIds.length === 0) {
            setWorkouts([]);
            return;
        }

        const resolveWorkouts = async () => {
            setLoading(true);

            // Ensure cache is populated
            let resolved = workoutIds
                .map((id) => planItemsCache.getWorkoutById(id))
                .filter((w): w is Workout => w !== null);

            if (resolved.length === 0) {
                // Cache might not be loaded yet — fetch and retry
                await planItemsCache.getWorkouts();
                resolved = workoutIds
                    .map((id) => planItemsCache.getWorkoutById(id))
                    .filter((w): w is Workout => w !== null);
            }

            setWorkouts(resolved);
            setLoading(false);
        };

        resolveWorkouts();
    }, [visible, workoutIds]);

    return (
        <Modal visible={visible} animationType="fade" transparent={true} onRequestClose={onClose}>
            <Pressable style={[styles.modalOverlay, { backgroundColor: theme.colors.overlay }]} onPress={onClose}>
                <Pressable
                    style={[
                        styles.modalContent,
                        {
                            backgroundColor: hexToRgba(theme.colors.bg, 0.95),
                            paddingBottom: insets.bottom + spacing.md,
                        },
                    ]}
                    onPress={(e) => e.stopPropagation()}
                >
                    {/* Handle Bar */}
                    <View style={styles.handleContainer}>
                        <View style={[styles.handle, { backgroundColor: theme.colors.border }]} />
                    </View>

                    {/* Header */}
                    <View style={styles.header}>
                        <View style={styles.headerContent}>
                            <Ionicons name="barbell-outline" size={28} color={theme.colors.accent} />
                            <View style={styles.headerText}>
                                <Text
                                    style={[
                                        styles.title,
                                        {
                                            color: theme.colors.text,
                                            fontFamily: typography.fonts.headlineSemibold,
                                        },
                                    ]}
                                >
                                    {presetName}
                                </Text>
                                <Text
                                    style={[
                                        styles.subtitle,
                                        {
                                            color: theme.colors.textSecondary,
                                            fontFamily: typography.fonts.body,
                                        },
                                    ]}
                                >
                                    {workouts.length} exercises
                                </Text>
                            </View>
                        </View>
                        <TouchableOpacity
                            onPress={onClose}
                            style={[styles.closeButton, { backgroundColor: theme.colors.surface }]}
                            hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
                        >
                            <Ionicons name="close" size={20} color={theme.colors.textSecondary} />
                        </TouchableOpacity>
                    </View>

                    {/* Exercise List */}
                    {loading ? (
                        <View style={styles.loadingContainer}>
                            <ActivityIndicator color={theme.colors.accent} />
                        </View>
                    ) : (
                        <ScrollView
                            style={styles.exerciseList}
                            contentContainerStyle={styles.exerciseListContent}
                            showsVerticalScrollIndicator={false}
                            bounces={false}
                        >
                            {workouts.map((workout, index) => (
                                <View
                                    key={workout.id}
                                    style={[
                                        styles.exerciseCard,
                                        {
                                            backgroundColor: theme.colors.glassWhite,
                                            borderColor: theme.colors.glassBorder,
                                        },
                                    ]}
                                >
                                    <View style={styles.exerciseHeader}>
                                        <View
                                            style={[
                                                styles.exerciseNumber,
                                                { backgroundColor: theme.colors.accent + "18" },
                                            ]}
                                        >
                                            <Text
                                                style={[
                                                    styles.exerciseNumberText,
                                                    { color: theme.colors.accent },
                                                ]}
                                            >
                                                {index + 1}
                                            </Text>
                                        </View>
                                        <View style={styles.exerciseInfo}>
                                            <View style={styles.exerciseTitleRow}>
                                                <Text
                                                    style={[
                                                        styles.exerciseTitle,
                                                        { color: theme.colors.text },
                                                    ]}
                                                    numberOfLines={1}
                                                >
                                                    {workout.title}
                                                </Text>
                                                {getEquipmentIconForTitle(workout.title) && (
                                                    <Image
                                                        source={getEquipmentIconForTitle(workout.title)!}
                                                        style={styles.equipmentIcon}
                                                        resizeMode="contain"
                                                    />
                                                )}
                                            </View>
                                            <View style={styles.exerciseMeta}>
                                                <View
                                                    style={[
                                                        styles.categoryBadge,
                                                        {
                                                            backgroundColor:
                                                                theme.colors.accent + "20",
                                                            borderColor:
                                                                theme.colors.accent + "40",
                                                        },
                                                    ]}
                                                >
                                                    <Text
                                                        style={[
                                                            styles.categoryBadgeText,
                                                            { color: theme.colors.accent },
                                                        ]}
                                                    >
                                                        {workout.category.toUpperCase()}
                                                    </Text>
                                                </View>
                                                {(() => {
                                                    const preset = getDefaultPreset(workout);
                                                    if (!preset) return null;
                                                    if (preset.sets && preset.reps) {
                                                        return (
                                                            <Text
                                                                style={[
                                                                    styles.exerciseStats,
                                                                    { color: theme.colors.textSecondary },
                                                                ]}
                                                            >
                                                                {preset.sets} sets x {preset.reps} reps
                                                            </Text>
                                                        );
                                                    }
                                                    if (preset.sets && preset.durationPerSet) {
                                                        return (
                                                            <Text
                                                                style={[
                                                                    styles.exerciseStats,
                                                                    { color: theme.colors.textSecondary },
                                                                ]}
                                                            >
                                                                {preset.sets} sets x {preset.durationPerSet}s
                                                            </Text>
                                                        );
                                                    }
                                                    return null;
                                                })()}
                                            </View>
                                        </View>
                                    </View>
                                </View>
                            ))}
                        </ScrollView>
                    )}

                    {/* Start Workout Button */}
                    <TouchableOpacity
                        style={[
                            styles.startButton,
                            {
                                backgroundColor:
                                    workouts.length > 0
                                        ? theme.colors.accent
                                        : theme.colors.textTertiary,
                            },
                        ]}
                        onPress={() => onStartWorkout(workoutIds)}
                        activeOpacity={0.85}
                        disabled={workouts.length === 0 || loading}
                    >
                        <Ionicons name="play" size={20} color="#FFFFFF" />
                        <Text style={styles.startButtonText}>Start Workout</Text>
                    </TouchableOpacity>
                </Pressable>
            </Pressable>
        </Modal>
    );
};

const styles = StyleSheet.create({
    modalOverlay: {
        flex: 1,
        backgroundColor: "rgba(0, 0, 0, 0.6)",
        justifyContent: "flex-end",
    },
    modalContent: {
        borderTopLeftRadius: 30,
        borderTopRightRadius: 30,
        paddingTop: spacing.sm,
        paddingHorizontal: spacing.md,
        maxHeight: "85%",
        shadowColor: "#000",
        shadowOffset: { width: 0, height: -4 },
        shadowOpacity: 0.15,
        shadowRadius: 12,
        elevation: 8,
    },
    handleContainer: {
        alignItems: "center",
        paddingTop: spacing.xs,
        paddingBottom: spacing.sm,
    },
    handle: {
        width: 40,
        height: 4,
        borderRadius: radii.full,
    },
    header: {
        flexDirection: "row",
        alignItems: "flex-start",
        justifyContent: "space-between",
        marginBottom: spacing.md,
    },
    headerContent: {
        flexDirection: "row",
        alignItems: "flex-start",
        gap: spacing.sm,
        flex: 1,
    },
    headerText: {
        flex: 1,
    },
    title: {
        fontSize: typography.sizes.xl,
        marginBottom: 4,
    },
    subtitle: {
        fontSize: typography.sizes.sm,
        lineHeight: 20,
    },
    closeButton: {
        width: 32,
        height: 32,
        borderRadius: radii.md,
        justifyContent: "center",
        alignItems: "center",
    },
    loadingContainer: {
        paddingVertical: spacing.xl,
        alignItems: "center",
    },
    exerciseList: {
        flexShrink: 1,
        marginBottom: spacing.md,
    },
    exerciseListContent: {
        paddingBottom: spacing.xs,
    },
    exerciseCard: {
        borderRadius: radii.lg,
        padding: spacing.md,
        marginBottom: spacing.sm,
        borderWidth: 1,
        shadowColor: "#000",
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.05,
        shadowRadius: 8,
        elevation: 2,
    },
    exerciseHeader: {
        flexDirection: "row",
        alignItems: "center",
        gap: spacing.sm,
    },
    exerciseNumber: {
        width: 36,
        height: 36,
        borderRadius: 18,
        alignItems: "center",
        justifyContent: "center",
    },
    exerciseNumberText: {
        fontSize: typography.sizes.md,
        fontFamily: typography.fonts.bodySemibold,
        fontWeight: "600",
    },
    exerciseInfo: {
        flex: 1,
    },
    exerciseTitleRow: {
        flexDirection: "row",
        alignItems: "center",
        justifyContent: "space-between",
        marginBottom: 6,
    },
    exerciseTitle: {
        fontSize: typography.sizes.md,
        fontFamily: typography.fonts.headline,
        fontWeight: "500",
        flex: 1,
        letterSpacing: -0.2,
    },
    equipmentIcon: {
        width: 22,
        height: 22,
        marginLeft: spacing.xs,
    },
    exerciseMeta: {
        flexDirection: "row",
        alignItems: "center",
        gap: spacing.sm,
    },
    categoryBadge: {
        paddingHorizontal: 8,
        paddingVertical: 4,
        borderRadius: radii.full,
        borderWidth: 1,
    },
    categoryBadgeText: {
        fontFamily: typography.fonts.bodySemibold,
        fontWeight: "600",
        fontSize: 10,
        letterSpacing: 0.5,
    },
    exerciseStats: {
        fontSize: typography.sizes.sm,
        fontFamily: typography.fonts.body,
    },
    startButton: {
        flexDirection: "row",
        alignItems: "center",
        justifyContent: "center",
        gap: spacing.xs,
        paddingVertical: spacing.sm,
        borderRadius: radii.full,
        minHeight: 56,
    },
    startButtonText: {
        fontFamily: typography.fonts.bodySemibold,
        fontSize: typography.sizes.md,
        color: "#FFFFFF",
        fontWeight: "600",
    },
});

export default PresetWorkoutSheet;
