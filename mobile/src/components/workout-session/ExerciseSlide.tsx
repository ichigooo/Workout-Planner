import React, { useEffect, useMemo, useState } from "react";
import {
    View,
    Text,
    TouchableOpacity,
    StyleSheet,
    Image,
    Dimensions,
    Linking,
    useColorScheme,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { Ionicons } from "@expo/vector-icons";
import * as Haptics from "expo-haptics";
import { getTheme, spacing, radii, typography } from "../../theme";
import { Workout, getDefaultPreset } from "../../types";

const { width: SCREEN_WIDTH } = Dimensions.get("window");
const CYCLE_INTERVAL = 3000;

interface ExerciseSlideProps {
    workout: Workout;
    completedSets: number;
    totalSets: number;
    onCompleteSet: () => void;
}

// ─── Set Indicator ──────────────────────────────────────────────────

const SET_CIRCLE_SIZE = 14;
const SET_CIRCLE_GAP = 10;

const SetIndicator: React.FC<{
    completedSets: number;
    totalSets: number;
    accentColor: string;
}> = ({ completedSets, totalSets, accentColor }) => (
    <View style={setIndicatorStyles.container}>
        {Array.from({ length: totalSets }).map((_, i) => (
            <View
                key={i}
                style={[
                    setIndicatorStyles.circle,
                    i < completedSets
                        ? { backgroundColor: accentColor }
                        : setIndicatorStyles.emptyCircle,
                ]}
            />
        ))}
    </View>
);

const setIndicatorStyles = StyleSheet.create({
    container: {
        flexDirection: "row",
        justifyContent: "center",
        alignItems: "center",
        gap: SET_CIRCLE_GAP,
        marginBottom: 16,
    },
    circle: {
        width: SET_CIRCLE_SIZE,
        height: SET_CIRCLE_SIZE,
        borderRadius: SET_CIRCLE_SIZE / 2,
    },
    emptyCircle: {
        backgroundColor: "rgba(255,255,255,0.25)",
        borderWidth: 1.5,
        borderColor: "rgba(255,255,255,0.4)",
    },
});

function getExerciseDetails(workout: Workout): {
    setsLabel: string;
    repsLabel: string;
    intensityLabel: string;
} {
    const preset = getDefaultPreset(workout);
    if (!preset) return { setsLabel: "", repsLabel: "", intensityLabel: "" };

    switch (preset.inputType) {
        case "percentage_1rm":
            return {
                setsLabel: preset.sets ? `${preset.sets} sets` : "",
                repsLabel: `${preset.reps} reps @ ${preset.intensityPct}%`,
                intensityLabel: "",
            };
        case "sets_time":
            return {
                setsLabel: preset.sets ? `${preset.sets} sets` : "",
                repsLabel: preset.durationPerSet ? `${preset.durationPerSet}s each` : "",
                intensityLabel: preset.intensityLabel || "",
            };
        default:
            return {
                setsLabel: preset.sets ? `${preset.sets} sets` : "",
                repsLabel: preset.reps ? `${preset.reps} reps` : "",
                intensityLabel: preset.intensityLabel || "",
            };
    }
}

function getSourceLabel(platform?: string): { label: string; icon: string } {
    const p = (platform || "").toLowerCase();
    if (p.includes("youtube")) return { label: "Watch on YouTube", icon: "logo-youtube" };
    if (p.includes("instagram")) return { label: "View on Instagram", icon: "logo-instagram" };
    if (p.includes("tiktok")) return { label: "View on TikTok", icon: "musical-notes" };
    return { label: "View Source", icon: "open-outline" };
}

/** Extract YouTube video URL from a YouTube thumbnail URL, or return sourceUrl if set. */
function deriveSourceUrl(workout: Workout): string | null {
    if (workout.sourceUrl) return workout.sourceUrl;
    const img = workout.imageUrl || "";
    const match = img.match(/(?:ytimg\.com|img\.youtube\.com)\/vi\/([^/]+)/);
    if (match) return `https://www.youtube.com/watch?v=${match[1]}`;
    return null;
}

function deriveSourcePlatform(workout: Workout, derivedUrl: string | null): string | undefined {
    if (workout.sourcePlatform) return workout.sourcePlatform;
    if (derivedUrl?.includes("youtube.com")) return "youtube";
    return undefined;
}

export const ExerciseSlide: React.FC<ExerciseSlideProps> = ({
    workout,
    completedSets,
    totalSets,
    onCompleteSet,
}) => {
    const insets = useSafeAreaInsets();
    const scheme = useColorScheme();
    const theme = getTheme(scheme === "dark" ? "dark" : "light");
    const details = getExerciseDetails(workout);
    const [activeImageIndex, setActiveImageIndex] = useState(0);

    const images = useMemo(
        () =>
            [workout.imageUrl, workout.imageUrl2].filter(Boolean) as string[],
        [workout.imageUrl, workout.imageUrl2],
    );

    const imageHeight = Math.round(SCREEN_WIDTH * 0.75);

    // Auto-cycle for dual images
    useEffect(() => {
        if (images.length <= 1) return;

        const interval = setInterval(() => {
            setActiveImageIndex((prev) => (prev + 1) % images.length);
        }, CYCLE_INTERVAL);

        return () => clearInterval(interval);
    }, [images.length]);

    // Reset index when workout changes
    useEffect(() => {
        setActiveImageIndex(0);
    }, [workout.id]);

    const resolvedSourceUrl = useMemo(() => deriveSourceUrl(workout), [workout]);
    const resolvedPlatform = useMemo(
        () => deriveSourcePlatform(workout, resolvedSourceUrl),
        [workout, resolvedSourceUrl],
    );

    const handleSourcePress = async () => {
        if (resolvedSourceUrl) {
            try {
                await Linking.openURL(resolvedSourceUrl);
            } catch (error) {
                console.error("Error opening source URL:", error);
            }
        }
    };

    const sourceInfo = resolvedSourceUrl
        ? getSourceLabel(resolvedPlatform)
        : null;

    return (
        <View style={[styles.container, { paddingTop: insets.top + 56 }]}>
            {/* Image area */}
            {images.length > 0 ? (
                <View style={[styles.imageContainer, { height: imageHeight }]}>
                    <Image
                        source={{ uri: images[activeImageIndex] }}
                        style={{
                            width: SCREEN_WIDTH,
                            height: imageHeight,
                        }}
                        resizeMode="contain"
                    />
                    {images.length > 1 && (
                        <View style={styles.pagination}>
                            {images.map((_, index) => (
                                <View
                                    key={index}
                                    style={[
                                        styles.dot,
                                        index === activeImageIndex
                                            ? styles.dotActive
                                            : styles.dotInactive,
                                    ]}
                                />
                            ))}
                        </View>
                    )}
                </View>
            ) : (
                <View
                    style={[
                        styles.imagePlaceholder,
                        { height: imageHeight },
                    ]}
                >
                    <Ionicons
                        name="barbell-outline"
                        size={48}
                        color="rgba(255,255,255,0.3)"
                    />
                </View>
            )}

            {/* Info area */}
            <View style={[styles.infoContainer, { paddingBottom: insets.bottom + spacing.lg }]}>
                {/* Category badge */}
                <View
                    style={[
                        styles.categoryBadge,
                        { backgroundColor: theme.colors.accent },
                    ]}
                >
                    <Text style={styles.categoryText}>
                        {workout.category.toUpperCase()}
                    </Text>
                </View>

                {/* Exercise title */}
                <Text style={styles.exerciseTitle}>{workout.title}</Text>

                {/* Description */}
                {workout.description ? (
                    <Text style={styles.description} numberOfLines={2}>
                        {workout.description}
                    </Text>
                ) : null}

                {/* Source link */}
                {sourceInfo && (
                    <TouchableOpacity
                        style={styles.sourcePill}
                        onPress={handleSourcePress}
                        activeOpacity={0.7}
                    >
                        <Ionicons
                            name={sourceInfo.icon as any}
                            size={16}
                            color="#FFFFFF"
                        />
                        <Text style={styles.sourceText}>
                            {sourceInfo.label}
                        </Text>
                    </TouchableOpacity>
                )}

                {/* Details row */}
                {(details.setsLabel || details.repsLabel) && (
                    <View style={styles.detailsRow}>
                        {details.setsLabel ? (
                            <View style={styles.detailPill}>
                                <Text style={styles.detailText}>
                                    {details.setsLabel}
                                </Text>
                            </View>
                        ) : null}
                        {details.repsLabel ? (
                            <View style={styles.detailPill}>
                                <Text style={styles.detailText}>
                                    {details.repsLabel}
                                </Text>
                            </View>
                        ) : null}
                        {details.intensityLabel ? (
                            <View style={styles.detailPill}>
                                <Text style={styles.detailText}>
                                    {details.intensityLabel}
                                </Text>
                            </View>
                        ) : null}
                    </View>
                )}

                <View style={styles.spacer} />

                {/* Set indicator circles */}
                {totalSets > 1 && (
                    <SetIndicator
                        completedSets={completedSets}
                        totalSets={totalSets}
                        accentColor={theme.colors.accent}
                    />
                )}

                {/* Complete button */}
                <TouchableOpacity
                    style={[
                        styles.completeButton,
                        {
                            backgroundColor:
                                completedSets >= totalSets
                                    ? "rgba(255,255,255,0.15)"
                                    : theme.colors.accent,
                        },
                    ]}
                    onPress={() => {
                        if (completedSets < totalSets) {
                            Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light).catch(() => {});
                            onCompleteSet();
                        }
                    }}
                    activeOpacity={completedSets >= totalSets ? 1 : 0.85}
                    disabled={completedSets >= totalSets}
                >
                    <Ionicons
                        name={completedSets >= totalSets ? "checkmark-circle" : "checkmark"}
                        size={22}
                        color="#FFFFFF"
                    />
                    <Text style={styles.completeButtonText}>
                        {completedSets >= totalSets ? "All Sets Done" : "Complete Set"}
                    </Text>
                </TouchableOpacity>
            </View>
        </View>
    );
};

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: "#292521",
    },
    imageContainer: {
        backgroundColor: "#1F1B17",
    },
    imagePlaceholder: {
        backgroundColor: "#1F1B17",
        justifyContent: "center",
        alignItems: "center",
    },
    pagination: {
        position: "absolute",
        bottom: 12,
        alignSelf: "center",
        flexDirection: "row",
        gap: 6,
    },
    dot: {
        width: 7,
        height: 7,
        borderRadius: 4,
    },
    dotActive: {
        backgroundColor: "#FFFFFF",
    },
    dotInactive: {
        backgroundColor: "rgba(255,255,255,0.4)",
    },
    infoContainer: {
        flex: 1,
        paddingHorizontal: spacing.md,
        paddingTop: spacing.md,
    },
    categoryBadge: {
        alignSelf: "flex-start",
        paddingHorizontal: 12,
        paddingVertical: 4,
        borderRadius: radii.sm,
        marginBottom: 12,
    },
    categoryText: {
        fontFamily: typography.fonts.bodySemibold,
        fontSize: typography.sizes.xs,
        color: "#FFFFFF",
        letterSpacing: 0.8,
    },
    exerciseTitle: {
        fontFamily: typography.fonts.headlineSemibold,
        fontSize: typography.sizes.xl,
        color: "#FFFFFF",
        marginBottom: 8,
    },
    description: {
        fontFamily: typography.fonts.body,
        fontSize: typography.sizes.sm,
        color: "rgba(255,255,255,0.7)",
        marginBottom: 12,
        lineHeight: 20,
    },
    sourcePill: {
        flexDirection: "row",
        alignItems: "center",
        alignSelf: "flex-start",
        gap: 6,
        backgroundColor: "rgba(255,255,255,0.10)",
        paddingHorizontal: 12,
        paddingVertical: 8,
        borderRadius: 16,
        marginBottom: 12,
    },
    sourceText: {
        fontFamily: typography.fonts.bodyMedium,
        fontSize: typography.sizes.sm,
        color: "#FFFFFF",
    },
    detailsRow: {
        flexDirection: "row",
        gap: 8,
        flexWrap: "wrap",
    },
    detailPill: {
        backgroundColor: "rgba(255,255,255,0.10)",
        paddingHorizontal: 12,
        paddingVertical: 6,
        borderRadius: 16,
    },
    detailText: {
        fontFamily: typography.fonts.bodyMedium,
        fontSize: typography.sizes.sm,
        color: "#FFFFFF",
    },
    spacer: {
        flex: 1,
    },
    completeButton: {
        flexDirection: "row",
        alignItems: "center",
        justifyContent: "center",
        gap: 8,
        paddingVertical: 16,
        borderRadius: radii.lg,
        minHeight: 56,
    },
    completeButtonText: {
        fontFamily: typography.fonts.bodySemibold,
        fontSize: typography.sizes.md,
        color: "#FFFFFF",
    },
});
