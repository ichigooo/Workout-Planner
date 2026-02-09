import React, { useState } from "react";
import {
    View,
    Text,
    StyleSheet,
    TouchableOpacity,
    ScrollView,
    Modal,
    Image,
    useColorScheme,
    Switch,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { getTheme, spacing, radii } from "../theme";
import { WorkoutImport, WorkoutCategory } from "../types";
import { WORKOUT_CATEGORIES as CATEGORIES } from "../constants/workoutCategories";

interface WorkoutImportPreviewProps {
    visible: boolean;
    workout: WorkoutImport | null;
    onConfirm: (category: string, isGlobal: boolean) => void;
    onCancel: () => void;
    isAdmin?: boolean;
}

const CATEGORY_ICONS: Record<WorkoutCategory, keyof typeof Ionicons.glyphMap> = {
    "Upper Body - Pull": "arrow-down-outline",
    "Upper Body - Push": "arrow-up-outline",
    "Legs": "walk-outline",
    "Core": "body-outline",
    "Climbing - Power": "flash-outline",
    "Climbing - Endurance": "trending-up-outline",
    "Climbing - Warm Up": "flame-outline",
    "Cardio": "bicycle-outline",
    "Mobility": "fitness-outline",
};

const WORKOUT_CATEGORY_OPTIONS = CATEGORIES.map((cat) => ({
    value: cat,
    label: cat,
    icon: CATEGORY_ICONS[cat],
}));

export const WorkoutImportPreview: React.FC<WorkoutImportPreviewProps> = ({
    visible,
    workout,
    onConfirm,
    onCancel,
    isAdmin = false,
}) => {
    const scheme = useColorScheme();
    const theme = getTheme(scheme === "dark" ? "dark" : "light");

    // Default to existing category or first category
    const [selectedCategory, setSelectedCategory] = useState<string>(
        workout?.category || WORKOUT_CATEGORY_OPTIONS[0].value
    );
    const [makePublic, setMakePublic] = useState(false);

    if (!workout) return null;

    // Determine platform icon and color
    const getPlatformIcon = () => {
        const platform = workout.sourcePlatform?.toLowerCase();
        if (platform?.includes("instagram")) return "logo-instagram";
        if (platform?.includes("youtube")) return "logo-youtube";
        if (platform?.includes("tiktok")) return "logo-tiktok";
        return "cloud-upload-outline";
    };

    const getPlatformColor = () => {
        const platform = workout.sourcePlatform?.toLowerCase();
        if (platform?.includes("instagram")) return "#E4405F";
        if (platform?.includes("youtube")) return "#FF0000";
        if (platform?.includes("tiktok")) return "#000000";
        return theme.colors.accent;
    };

    return (
        <Modal
            visible={visible}
            animationType="slide"
            presentationStyle="pageSheet"
            onRequestClose={onCancel}
        >
            <View style={[styles.container, { backgroundColor: theme.colors.bg }]}>
                {/* Header */}
                <View style={[styles.header, { borderBottomColor: theme.colors.border }]}>
                    <TouchableOpacity onPress={onCancel} style={styles.closeButton}>
                        <Ionicons name="close" size={28} color={theme.colors.text} />
                    </TouchableOpacity>
                    <Text style={[styles.headerTitle, { color: theme.colors.text }]}>
                        Preview Workout
                    </Text>
                    <View style={styles.closeButton} />
                </View>

                <ScrollView
                    style={styles.content}
                    contentContainerStyle={styles.scrollContent}
                    showsVerticalScrollIndicator={false}
                >
                    {/* Thumbnail */}
                    {workout.thumbnailUrl && (
                        <Image
                            source={{ uri: workout.thumbnailUrl }}
                            style={styles.thumbnail}
                            resizeMode="cover"
                        />
                    )}

                    {/* Platform Badge */}
                    <View style={styles.badgeRow}>
                        <View
                            style={[
                                styles.platformBadge,
                                { backgroundColor: `${getPlatformColor()}15` },
                            ]}
                        >
                            <Ionicons name={getPlatformIcon()} size={16} color={getPlatformColor()} />
                            <Text style={[styles.platformText, { color: getPlatformColor() }]}>
                                {(workout.sourcePlatform || "IMPORTED").toUpperCase()}
                            </Text>
                        </View>
                    </View>

                    {/* Title */}
                    <Text style={[styles.title, { color: theme.colors.text }]}>
                        {workout.title || "Imported Workout"}
                    </Text>

                    {/* Description */}
                    {workout.description && workout.description !== "TBD" && (
                        <Text style={[styles.description, { color: theme.colors.subtext }]}>
                            {workout.description}
                        </Text>
                    )}

                    {/* Metadata */}
                    {workout.metadata?.duration && (
                        <View style={styles.metadataRow}>
                            <Ionicons name="time-outline" size={20} color={theme.colors.subtext} />
                            <Text style={[styles.metadataText, { color: theme.colors.text }]}>
                                {workout.metadata.duration}
                            </Text>
                        </View>
                    )}

                    {/* Category Selection */}
                    <View style={styles.categorySection}>
                        <Text style={[styles.sectionLabel, { color: theme.colors.text }]}>
                            Select Category
                        </Text>
                        <Text style={[styles.sectionSubtext, { color: theme.colors.subtext }]}>
                            Choose the best category for this workout
                        </Text>

                        <View style={styles.categoryGrid}>
                            {WORKOUT_CATEGORY_OPTIONS.map((cat) => {
                                const isSelected = selectedCategory === cat.value;
                                return (
                                    <TouchableOpacity
                                        key={cat.value}
                                        style={[
                                            styles.categoryButton,
                                            {
                                                backgroundColor: isSelected
                                                    ? theme.colors.accent
                                                    : theme.colors.surface,
                                                borderColor: isSelected
                                                    ? theme.colors.accent
                                                    : theme.colors.border,
                                            },
                                        ]}
                                        onPress={() => setSelectedCategory(cat.value)}
                                        activeOpacity={0.7}
                                    >
                                        <Ionicons
                                            name={cat.icon as any}
                                            size={24}
                                            color={isSelected ? "#FFFFFF" : theme.colors.text}
                                        />
                                        <Text
                                            style={[
                                                styles.categoryLabel,
                                                {
                                                    color: isSelected
                                                        ? "#FFFFFF"
                                                        : theme.colors.text,
                                                },
                                            ]}
                                        >
                                            {cat.label}
                                        </Text>
                                    </TouchableOpacity>
                                );
                            })}
                        </View>
                    </View>

                    {/* Make Public Toggle - Admin Only */}
                    {isAdmin && (
                        <View style={styles.publicToggleSection}>
                            <View style={styles.publicToggleRow}>
                                <View style={styles.publicToggleTextContainer}>
                                    <Text style={[styles.sectionLabel, { color: theme.colors.text }]}>
                                        Make Public
                                    </Text>
                                    <Text style={[styles.sectionSubtext, { color: theme.colors.subtext, marginBottom: 0 }]}>
                                        This workout will appear for all users
                                    </Text>
                                </View>
                                <Switch
                                    value={makePublic}
                                    onValueChange={setMakePublic}
                                    trackColor={{ false: theme.colors.border, true: theme.colors.accent }}
                                    thumbColor="#FFFFFF"
                                />
                            </View>
                        </View>
                    )}
                </ScrollView>

                {/* Action Buttons */}
                <View
                    style={[
                        styles.actionButtons,
                        {
                            backgroundColor: theme.colors.bg,
                            borderTopColor: theme.colors.border,
                        },
                    ]}
                >
                    <TouchableOpacity
                        style={[styles.cancelButton, { borderColor: theme.colors.border }]}
                        onPress={onCancel}
                        activeOpacity={0.8}
                    >
                        <Text style={[styles.cancelButtonText, { color: theme.colors.text }]}>
                            Cancel
                        </Text>
                    </TouchableOpacity>

                    <TouchableOpacity
                        style={[styles.confirmButton, { backgroundColor: theme.colors.accent }]}
                        onPress={() => onConfirm(selectedCategory, makePublic)}
                        activeOpacity={0.8}
                    >
                        <Ionicons name="checkmark-circle-outline" size={20} color="#FFFFFF" />
                        <Text style={styles.confirmButtonText}>Confirm Import</Text>
                    </TouchableOpacity>
                </View>
            </View>
        </Modal>
    );
};

const styles = StyleSheet.create({
    container: {
        flex: 1,
    },
    header: {
        flexDirection: "row",
        alignItems: "center",
        justifyContent: "space-between",
        paddingHorizontal: spacing.md,
        paddingVertical: spacing.md,
        borderBottomWidth: 1,
    },
    closeButton: {
        width: 40,
        height: 40,
        alignItems: "center",
        justifyContent: "center",
    },
    headerTitle: {
        fontSize: 18,
        fontWeight: "700",
    },
    content: {
        flex: 1,
    },
    scrollContent: {
        paddingHorizontal: spacing.lg,
        paddingBottom: spacing.xxl,
    },
    thumbnail: {
        width: "100%",
        height: 200,
        borderRadius: radii.lg,
        marginTop: spacing.md,
        marginBottom: spacing.md,
    },
    badgeRow: {
        flexDirection: "row",
        marginBottom: spacing.sm,
    },
    platformBadge: {
        flexDirection: "row",
        alignItems: "center",
        gap: 6,
        paddingHorizontal: spacing.sm,
        paddingVertical: 6,
        borderRadius: radii.sm,
    },
    platformText: {
        fontSize: 12,
        fontWeight: "700",
        letterSpacing: 0.5,
    },
    title: {
        fontSize: 26,
        fontWeight: "700",
        marginBottom: spacing.sm,
        lineHeight: 32,
    },
    description: {
        fontSize: 16,
        lineHeight: 24,
        marginBottom: spacing.md,
    },
    metadataRow: {
        flexDirection: "row",
        alignItems: "center",
        gap: 8,
        marginBottom: spacing.lg,
    },
    metadataText: {
        fontSize: 16,
        fontWeight: "500",
    },
    categorySection: {
        marginTop: spacing.lg,
        marginBottom: spacing.md,
    },
    sectionLabel: {
        fontSize: 18,
        fontWeight: "700",
        marginBottom: spacing.xs,
    },
    sectionSubtext: {
        fontSize: 14,
        marginBottom: spacing.md,
    },
    categoryGrid: {
        flexDirection: "row",
        flexWrap: "wrap",
        gap: spacing.sm,
    },
    categoryButton: {
        width: "48%",
        flexDirection: "column",
        alignItems: "center",
        justifyContent: "center",
        gap: spacing.xs,
        paddingVertical: spacing.md,
        paddingHorizontal: spacing.xs,
        borderRadius: radii.md,
        borderWidth: 2,
        minHeight: 70,
    },
    categoryLabel: {
        fontSize: 12,
        fontWeight: "600",
        textAlign: "center",
    },
    publicToggleSection: {
        marginTop: spacing.lg,
        marginBottom: spacing.md,
    },
    publicToggleRow: {
        flexDirection: "row",
        alignItems: "center",
        justifyContent: "space-between",
    },
    publicToggleTextContainer: {
        flex: 1,
        marginRight: spacing.md,
    },
    actionButtons: {
        flexDirection: "row",
        gap: spacing.sm,
        paddingHorizontal: spacing.md,
        paddingVertical: spacing.md,
        borderTopWidth: 1,
        shadowColor: "#000",
        shadowOffset: { width: 0, height: -2 },
        shadowOpacity: 0.1,
        shadowRadius: 8,
        elevation: 8,
    },
    cancelButton: {
        flex: 1,
        paddingVertical: spacing.md,
        borderRadius: radii.xl,
        borderWidth: 2,
        alignItems: "center",
        justifyContent: "center",
    },
    cancelButtonText: {
        fontSize: 16,
        fontWeight: "600",
    },
    confirmButton: {
        flex: 2,
        flexDirection: "row",
        alignItems: "center",
        justifyContent: "center",
        gap: spacing.xs,
        paddingVertical: spacing.md,
        borderRadius: radii.xl,
        shadowColor: "#000",
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.2,
        shadowRadius: 8,
        elevation: 4,
    },
    confirmButtonText: {
        color: "#FFFFFF",
        fontSize: 16,
        fontWeight: "700",
    },
});
