import React, { useMemo, useState } from "react";
import {
    View,
    Text,
    StyleSheet,
    Image,
    TouchableOpacity,
    ScrollView,
    Alert,
    Dimensions,
    Modal,
} from "react-native";
import { useRouter, useLocalSearchParams } from "expo-router";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { getTheme, spacing, radii, typography } from "@/src/theme";
import { useColorScheme } from "react-native";
import * as Linking from "expo-linking";
import { WorkoutImport, CreateWorkoutRequest, WorkoutCategory } from "@/src/types";
import { Ionicons } from "@expo/vector-icons";
import { apiService } from "@/src/services/api";
import { AddToPlanBottomSheet } from "@/src/components/AddToPlanBottomSheet";
import { getCurrentPlanId, getCurrentUserId } from "@/src/state/session";
import { planItemsCache } from "@/src/services/planItemsCache";

export default function CustomImportScreen() {
    const router = useRouter();
    const params = useLocalSearchParams<{ payload?: string }>();
    const insets = useSafeAreaInsets();
    const scheme = useColorScheme();
    const theme = getTheme(scheme === "dark" ? "dark" : "light");
    const windowWidth = Dimensions.get("window").width;
    const heroHeight = Math.round(windowWidth * 0.75);
    const [showMenu, setShowMenu] = useState(false);
    const [showAddSheet, setShowAddSheet] = useState(false);
    const [planId, setPlanId] = useState<string | null>(null);

    const data: WorkoutImport | null = useMemo(() => {
        if (!params?.payload) return null;
        try {
            return JSON.parse(params.payload as string);
        } catch (err) {
            console.warn("[CustomImport] Failed to parse payload", err);
            return null;
        }
    }, [params?.payload]);

    const handleOpenSource = () => {
        if (data?.sourceUrl) {
            Linking.openURL(data.sourceUrl).catch(() =>
                Alert.alert("Unable to open link", "Please try again later."),
            );
        }
    };

    const handleDeletePress = () => {
        const userId = getCurrentUserId();
        if (!userId) {
            Alert.alert("Error", "Please sign in to delete workouts.");
            return;
        }

        setShowMenu(false);
        Alert.alert(
            "Delete Workout",
            "Are you sure you want to delete this workout? This action cannot be undone.",
            [
                { text: "Cancel", style: "cancel" },
                {
                    text: "Delete",
                    style: "destructive",
                    onPress: async () => {
                        try {
                            if (data?.id) {
                                await apiService.deleteWorkoutImport(data.id, userId);
                                Alert.alert("Success", "Workout deleted successfully", [
                                    {
                                        text: "OK",
                                        onPress: () => router.back(),
                                    },
                                ]);
                            }
                        } catch (error: any) {
                            console.error("Failed to delete workout:", error);
                            const message = error?.message || "Failed to delete workout. Please try again.";
                            Alert.alert("Error", message);
                        }
                    },
                },
            ],
        );
    };

    const openAddSheet = async () => {
        setShowAddSheet(true);
        const cachedPlanId = getCurrentPlanId();
        setPlanId(cachedPlanId!);
    };

    const handleAddToPlan = async (dates: string[]) => {
        if (!planId) {
            Alert.alert("No plan", "No plan available to add to");
            throw new Error("No plan available");
        }
        if (dates.length === 0) {
            Alert.alert("No dates selected", "Please select at least one date");
            throw new Error("No dates selected");
        }
        if (!data) {
            Alert.alert("Error", "No workout data available");
            throw new Error("No workout data");
        }

        const userId = getCurrentUserId();
        if (!userId) {
            Alert.alert("Error", "Please sign in to add workouts to your plan");
            throw new Error("No user ID");
        }

        try {
            // Step 1: Convert the imported workout to a regular workout
            const workoutRequest: CreateWorkoutRequest = {
                title: data.title || "Imported Workout",
                description: data.description || undefined,
                category: (data.category as WorkoutCategory) || "Cardio",
                intensity: data.metadata?.intensity || "Medium",
                imageUrl: data.thumbnailUrl || undefined,
                workoutType: "cardio", // Default, can be adjusted based on category
                createdBy: userId,
                sourceUrl: data.sourceUrl || undefined,
                sourcePlatform: data.sourcePlatform || undefined,
            };

            const createdWorkout = await apiService.createWorkout(workoutRequest);

            // Step 2: Add the newly created workout to the plan
            await apiService.addWorkoutToPlanOnDates(planId, {
                workoutId: createdWorkout.id,
                dates
            });

            // Refresh cache
            try {
                await planItemsCache.getCachedItems();
            } catch (e) {
                console.warn("Failed to refresh plan items cache", e);
            }

            Alert.alert("Added", `Workout added to ${dates.length} date(s)`);
        } catch (e) {
            console.error("Add to plan failed", e);
            Alert.alert("Error", "Failed to add workout to plan");
            throw e;
        }
    };

    if (!data) {
        return (
            <View style={[styles.screenBackground, { backgroundColor: theme.colors.bg }]}>
                <View style={[styles.container, { paddingTop: insets.top + 20 }]}>
                    <Text style={{ color: theme.colors.text, textAlign: "center" }}>
                        Unable to load imported workout.
                    </Text>
                    <TouchableOpacity style={styles.backButton} onPress={() => router.back()}>
                        <Text style={{ color: theme.colors.accent }}>Go Back</Text>
                    </TouchableOpacity>
                </View>
            </View>
        );
    }

    // Determine platform icon and color
    const getPlatformIcon = (platform?: string | null) => {
        const lower = platform?.toLowerCase();
        if (lower?.includes("instagram")) return "logo-instagram";
        if (lower?.includes("youtube")) return "logo-youtube";
        if (lower?.includes("tiktok")) return "logo-tiktok";
        return "cloud-upload-outline";
    };

    const getPlatformColor = (platform?: string | null) => {
        const lower = platform?.toLowerCase();
        if (lower?.includes("instagram")) return "#E4405F";
        if (lower?.includes("youtube")) return "#FF0000";
        if (lower?.includes("tiktok")) return "#000000";
        return theme.colors.accent;
    };

    const platformIcon = getPlatformIcon(data.sourcePlatform);
    const platformColor = getPlatformColor(data.sourcePlatform);

    return (
        <View style={[styles.screenBackground, { backgroundColor: theme.colors.bg }]}>
            <View style={[styles.container, { backgroundColor: "transparent" }]}>
                {/* Header */}
                <View
                    style={[
                        styles.header,
                        {
                            paddingTop: insets.top + 4,
                            borderBottomColor: theme.colors.border,
                        },
                    ]}
                >
                    <TouchableOpacity onPress={() => router.back()} style={styles.closeButton}>
                        <Text style={[styles.closeButtonText, { color: theme.colors.accent }]}>
                            ✕
                        </Text>
                    </TouchableOpacity>
                    <View style={styles.headerSpacer} />
                    <TouchableOpacity
                        onPress={() => setShowMenu(true)}
                        style={styles.closeButton}
                    >
                        <Ionicons
                            name="ellipsis-horizontal"
                            size={24}
                            color={theme.colors.text}
                        />
                    </TouchableOpacity>
                </View>

                <ScrollView
                    style={styles.content}
                    contentContainerStyle={{
                        paddingBottom: insets.bottom + 100,
                    }}
                    showsVerticalScrollIndicator={false}
                >
                    {/* Hero Image/Thumbnail */}
                    {data.thumbnailUrl ? (
                        <TouchableOpacity
                            activeOpacity={0.8}
                            onPress={handleOpenSource}
                            style={[styles.heroContainer, { height: heroHeight }]}
                        >
                            <Image
                                source={{ uri: data.thumbnailUrl }}
                                style={[styles.heroImage, { width: windowWidth, height: heroHeight }]}
                                resizeMode="cover"
                            />
                            {/* Play overlay if video */}
                            <View style={styles.playOverlay}>
                                <View style={styles.playButton}>
                                    <Ionicons name="play" size={32} color="#fff" />
                                </View>
                            </View>
                        </TouchableOpacity>
                    ) : null}

                    {/* Content */}
                    <View style={styles.body}>
                        {/* Platform Badge */}
                        <View style={styles.badgeRow}>
                            <View
                                style={[
                                    styles.platformBadge,
                                    { backgroundColor: `${platformColor}15` },
                                ]}
                            >
                                <Ionicons name={platformIcon} size={16} color={platformColor} />
                                <Text
                                    style={[styles.platformBadgeText, { color: platformColor }]}
                                >
                                    {(data.sourcePlatform || "Custom").toUpperCase()}
                                </Text>
                            </View>
                            {!data.isGlobal && (
                                <View style={[styles.customBadge, { backgroundColor: "#F0C2C2" }]}>
                                    <Text style={styles.customBadgeText}>IMPORTED</Text>
                                </View>
                            )}
                        </View>

                        {/* Title */}
                        <Text style={[styles.title, { color: theme.colors.text }]}>
                            {data.title || "Imported Workout"}
                        </Text>

                        {/* Author */}
                        {data.metadata?.author_name && (
                            <View style={styles.authorRow}>
                                <Ionicons
                                    name="person-circle-outline"
                                    size={16}
                                    color={theme.colors.textTertiary}
                                />
                                <Text style={[styles.authorText, { color: theme.colors.textTertiary }]}>
                                    by {data.metadata.author_name}
                                </Text>
                            </View>
                        )}

                        {/* Description */}
                        {data.description && data.description !== "TBD" ? (
                            <View style={styles.section}>
                                <Text style={[styles.description, { color: theme.colors.textTertiary }]}>
                                    {data.description}
                                </Text>
                            </View>
                        ) : null}

                        {/* Metadata Pills */}
                        <View style={styles.metadataRow}>
                            {data.metadata?.duration && (
                                <View
                                    style={[
                                        styles.metadataPill,
                                        {
                                            backgroundColor: theme.colors.glassWhite,
                                            borderColor: theme.colors.glassBorder,
                                        },
                                    ]}
                                >
                                    <Ionicons
                                        name="time-outline"
                                        size={16}
                                        color={theme.colors.textTertiary}
                                    />
                                    <Text style={[styles.metadataText, { color: theme.colors.text }]}>
                                        {data.metadata.duration}
                                    </Text>
                                </View>
                            )}
                            {data.category && (
                                <View
                                    style={[
                                        styles.metadataPill,
                                        {
                                            backgroundColor: theme.colors.accent + "20",
                                            borderColor: theme.colors.accent + "40",
                                        },
                                    ]}
                                >
                                    <Ionicons
                                        name="fitness-outline"
                                        size={16}
                                        color={theme.colors.accent}
                                    />
                                    <Text style={[styles.metadataText, { color: theme.colors.accent }]}>
                                        {data.category}
                                    </Text>
                                </View>
                            )}
                        </View>

                        {/* Source URL */}
                        {data.sourceUrl && (
                            <View style={styles.section}>
                                <Text style={[styles.sectionLabel, { color: theme.colors.text }]}>
                                    Source
                                </Text>
                                <TouchableOpacity onPress={handleOpenSource}>
                                    <Text
                                        style={[styles.sourceUrl, { color: theme.colors.accent }]}
                                        numberOfLines={2}
                                    >
                                        {data.sourceUrl}
                                    </Text>
                                </TouchableOpacity>
                            </View>
                        )}
                    </View>
                </ScrollView>

                {/* Sticky Action Buttons */}
                <View
                    style={[
                        styles.stickyButtonContainer,
                        {
                            paddingBottom: insets.bottom + 16,
                            backgroundColor: theme.colors.bg,
                            borderTopColor: theme.colors.border,
                        },
                    ]}
                >
                    <TouchableOpacity
                        style={[
                            styles.secondaryButton,
                            { borderColor: theme.colors.border },
                        ]}
                        onPress={handleOpenSource}
                        activeOpacity={0.8}
                    >
                        <Ionicons name="open-outline" size={18} color={theme.colors.text} />
                        <Text style={[styles.secondaryButtonText, { color: theme.colors.text }]}>
                            Open in {data.sourcePlatform || "Browser"}
                        </Text>
                    </TouchableOpacity>
                    <TouchableOpacity
                        style={[styles.primaryButton, { backgroundColor: theme.colors.accent }]}
                        onPress={openAddSheet}
                        activeOpacity={0.8}
                    >
                        <Ionicons name="add-circle-outline" size={18} color="#fff" />
                        <Text style={styles.primaryButtonText}>Add to Plan</Text>
                    </TouchableOpacity>
                </View>

                {/* Add to Plan Bottom Sheet */}
                <AddToPlanBottomSheet
                    visible={showAddSheet}
                    workoutTitle={data.title || "Imported Workout"}
                    onClose={() => setShowAddSheet(false)}
                    onConfirm={handleAddToPlan}
                />

                {/* Menu Modal */}
                <Modal
                    visible={showMenu}
                    transparent={true}
                    animationType="fade"
                    onRequestClose={() => setShowMenu(false)}
                >
                    <TouchableOpacity
                        style={styles.menuOverlay}
                        activeOpacity={1}
                        onPress={() => setShowMenu(false)}
                    >
                        <View
                            style={[
                                styles.menuContainer,
                                { backgroundColor: theme.colors.surface },
                            ]}
                        >
                            <TouchableOpacity
                                style={styles.menuItem}
                                onPress={handleDeletePress}
                            >
                                <Ionicons
                                    name="trash-outline"
                                    size={20}
                                    color={theme.colors.danger}
                                />
                                <Text
                                    style={[
                                        styles.menuItemText,
                                        { color: theme.colors.danger },
                                    ]}
                                >
                                    Delete Workout
                                </Text>
                            </TouchableOpacity>
                        </View>
                    </TouchableOpacity>
                </Modal>
            </View>
        </View>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
    },
    screenBackground: {
        flex: 1,
    },
    screenBackgroundImage: {
        resizeMode: "cover",
    },
    header: {
        flexDirection: "row",
        alignItems: "center",
        justifyContent: "space-between",
        paddingHorizontal: spacing.md,
        paddingVertical: 10,
        backgroundColor: "transparent",
    },
    closeButton: {
        width: 32,
        height: 32,
        alignItems: "center",
        justifyContent: "center",
    },
    closeButtonText: {
        fontSize: 18,
        fontWeight: "600",
    },
    headerTitle: {
        fontSize: 16,
        fontWeight: "500",
    },
    headerSpacer: {
        flex: 1,
    },
    content: {
        flex: 1,
    },
    heroContainer: {
        width: "100%",
        position: "relative",
        backgroundColor: "#111827",
        marginBottom: spacing.md,
    },
    heroImage: {
        width: "100%",
        height: "100%",
    },
    playOverlay: {
        ...StyleSheet.absoluteFillObject,
        alignItems: "center",
        justifyContent: "center",
        backgroundColor: "rgba(0,0,0,0.2)",
    },
    playButton: {
        width: 64,
        height: 64,
        borderRadius: 32,
        backgroundColor: "rgba(0,0,0,0.6)",
        alignItems: "center",
        justifyContent: "center",
    },
    body: {
        paddingHorizontal: spacing.lg,
        paddingTop: spacing.lg,
    },
    badgeRow: {
        flexDirection: "row",
        gap: spacing.xs,
        marginBottom: spacing.sm,
    },
    platformBadge: {
        flexDirection: "row",
        alignItems: "center",
        gap: 6,
        paddingHorizontal: spacing.sm,
        paddingVertical: 4,
        borderRadius: radii.sm,
    },
    platformBadgeText: {
        fontSize: 11,
        fontFamily: typography.fonts.bodyBold,
        letterSpacing: 0.5,
    },
    customBadge: {
        paddingHorizontal: spacing.sm,
        paddingVertical: 4,
        borderRadius: radii.sm,
    },
    customBadgeText: {
        fontSize: 11,
        fontFamily: typography.fonts.bodyBold,
        color: "#fff",
        letterSpacing: 0.5,
    },
    title: {
        fontSize: 26,
        fontFamily: typography.fonts.headline,
        marginBottom: spacing.sm,
        lineHeight: 32,
    },
    authorRow: {
        flexDirection: "row",
        alignItems: "center",
        gap: 6,
        marginBottom: spacing.md,
    },
    authorText: {
        fontSize: 15,
        fontFamily: typography.fonts.bodyMedium,
    },
    section: {
        marginBottom: spacing.lg,
    },
    sectionLabel: {
        fontSize: 14,
        fontFamily: typography.fonts.bodySemibold,
        marginBottom: spacing.xs,
    },
    description: {
        fontSize: 16,
        fontFamily: typography.fonts.body,
        lineHeight: 24,
    },
    metadataRow: {
        flexDirection: "row",
        flexWrap: "wrap",
        gap: spacing.sm,
        marginBottom: spacing.md,
    },
    metadataPill: {
        flexDirection: "row",
        alignItems: "center",
        gap: 6,
        paddingVertical: spacing.xs,
        paddingHorizontal: spacing.sm,
        borderRadius: radii.md,
        borderWidth: 1,
    },
    metadataText: {
        fontSize: 14,
        fontFamily: typography.fonts.bodyMedium,
    },
    sourceUrl: {
        fontSize: 14,
        textDecorationLine: "underline",
    },
    stickyButtonContainer: {
        flexDirection: "row",
        gap: spacing.sm,
        paddingHorizontal: spacing.md,
        paddingTop: spacing.sm,
        borderTopWidth: 1,
        shadowColor: "#000",
        shadowOffset: { width: 0, height: -2 },
        shadowOpacity: 0.1,
        shadowRadius: 8,
        elevation: 8,
    },
    primaryButton: {
        flex: 1,
        flexDirection: "row",
        alignItems: "center",
        justifyContent: "center",
        gap: spacing.xs,
        paddingVertical: spacing.md,
        borderRadius: 9999,
        shadowColor: "#000",
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.15,
        shadowRadius: 8,
        elevation: 3,
    },
    primaryButtonText: {
        color: "#FFFFFF",
        fontSize: 16,
        fontFamily: typography.fonts.bodyBold,
        letterSpacing: 0.3,
    },
    secondaryButton: {
        flex: 1,
        flexDirection: "row",
        alignItems: "center",
        justifyContent: "center",
        gap: spacing.xs,
        paddingVertical: spacing.md,
        borderRadius: 9999,
        borderWidth: 1,
    },
    secondaryButtonText: {
        fontSize: 16,
        fontFamily: typography.fonts.bodySemibold,
        letterSpacing: 0.3,
    },
    backButton: {
        marginTop: 16,
        alignSelf: "center",
        padding: 8,
    },
    menuOverlay: {
        flex: 1,
        backgroundColor: "rgba(0, 0, 0, 0.5)",
        justifyContent: "flex-end",
        alignItems: "center",
    },
    menuContainer: {
        width: "90%",
        marginBottom: 40,
        borderRadius: radii.lg,
        padding: spacing.xs,
        shadowColor: "#000",
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.25,
        shadowRadius: 8,
        elevation: 5,
    },
    menuItem: {
        flexDirection: "row",
        alignItems: "center",
        gap: spacing.sm,
        paddingVertical: spacing.md,
        paddingHorizontal: spacing.md,
        borderRadius: radii.md,
    },
    menuItemText: {
        fontSize: 16,
        fontFamily: typography.fonts.bodySemibold,
    },
});
