import React, { useEffect, useMemo, useRef, useState } from "react";
import {
    View,
    Text,
    TouchableOpacity,
    StyleSheet,
    Image,
    Animated,
    Dimensions,
    Linking,
    useColorScheme,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { Ionicons } from "@expo/vector-icons";
import { getTheme, spacing, radii, typography } from "../../theme";
import {
    Workout,
    PERCENTAGE_PRESETS,
    PERCENTAGE_1RM_SETS,
} from "../../types";

const { width: SCREEN_WIDTH } = Dimensions.get("window");
const CYCLE_INTERVAL = 3000;
const FADE_DURATION = 500;

interface ExerciseSlideProps {
    workout: Workout;
    currentSet: number; // 1-based
    totalSets: number;
    onCompleteSet: () => void;
}

function getExerciseDetails(workout: Workout): {
    setsLabel: string;
    repsLabel: string;
} {
    const model = workout.intensityModel;

    if (workout.workoutType === "cardio") {
        return {
            setsLabel: "",
            repsLabel: workout.duration ? `${workout.duration} min` : "",
        };
    }

    switch (model) {
        case "percentage_1rm": {
            const preset =
                workout.defaultPreset && PERCENTAGE_PRESETS[workout.defaultPreset]
                    ? PERCENTAGE_PRESETS[workout.defaultPreset]
                    : PERCENTAGE_PRESETS.hypertrophy;
            return {
                setsLabel: `${PERCENTAGE_1RM_SETS} sets`,
                repsLabel: `${preset.reps} reps @ ${preset.percentage}%`,
            };
        }
        case "sets_time":
            return {
                setsLabel: workout.sets ? `${workout.sets} sets` : "",
                repsLabel: workout.durationPerSet
                    ? `${workout.durationPerSet}s each`
                    : "",
            };
        case "sets_reps":
        case "legacy":
        default:
            return {
                setsLabel: workout.sets ? `${workout.sets} sets` : "",
                repsLabel: workout.reps ? `${workout.reps} reps` : "",
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

export const ExerciseSlide: React.FC<ExerciseSlideProps> = ({
    workout,
    currentSet,
    totalSets,
    onCompleteSet,
}) => {
    const insets = useSafeAreaInsets();
    const scheme = useColorScheme();
    const theme = getTheme(scheme === "dark" ? "dark" : "light");
    const isCardio = workout.workoutType === "cardio";
    const details = getExerciseDetails(workout);
    const [activeImageIndex, setActiveImageIndex] = useState(0);

    const images = useMemo(
        () =>
            [workout.imageUrl, workout.imageUrl2].filter(Boolean) as string[],
        [workout.imageUrl, workout.imageUrl2],
    );

    const imageHeight = Math.round(SCREEN_WIDTH * 0.75);

    // Auto-cycle animation for dual images
    const fadeAnim = useRef(new Animated.Value(1)).current;

    useEffect(() => {
        if (images.length <= 1) return;

        const interval = setInterval(() => {
            Animated.timing(fadeAnim, {
                toValue: 0,
                duration: FADE_DURATION,
                useNativeDriver: true,
            }).start(() => {
                setActiveImageIndex((prev) => (prev + 1) % images.length);
                Animated.timing(fadeAnim, {
                    toValue: 1,
                    duration: FADE_DURATION,
                    useNativeDriver: true,
                }).start();
            });
        }, CYCLE_INTERVAL);

        return () => clearInterval(interval);
    }, [images.length, fadeAnim]);

    // Reset index when workout changes
    useEffect(() => {
        setActiveImageIndex(0);
        fadeAnim.setValue(1);
    }, [workout.id]);

    const handleSourcePress = async () => {
        if (workout.sourceUrl) {
            try {
                await Linking.openURL(workout.sourceUrl);
            } catch (error) {
                console.error("Error opening source URL:", error);
            }
        }
    };

    const sourceInfo = workout.sourceUrl
        ? getSourceLabel(workout.sourcePlatform)
        : null;

    return (
        <View style={[styles.container, { paddingTop: insets.top + 48 }]}>
            {/* Image area */}
            {images.length > 0 ? (
                <View style={[styles.imageContainer, { height: imageHeight }]}>
                    <Animated.Image
                        source={{ uri: images[activeImageIndex] }}
                        style={[
                            {
                                width: SCREEN_WIDTH,
                                height: imageHeight,
                                opacity: fadeAnim,
                            },
                        ]}
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
            <View style={styles.infoContainer}>
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
                        {workout.intensity &&
                        workout.intensityModel !== "percentage_1rm" ? (
                            <View style={styles.detailPill}>
                                <Text style={styles.detailText}>
                                    {workout.intensity}
                                </Text>
                            </View>
                        ) : null}
                    </View>
                )}

                <View style={styles.spacer} />

                {/* Set counter */}
                {!isCardio && totalSets > 0 && (
                    <Text style={styles.setCounter}>
                        Set {currentSet} of {totalSets}
                    </Text>
                )}

                {/* Complete button */}
                <TouchableOpacity
                    style={[
                        styles.completeButton,
                        { backgroundColor: theme.colors.accent },
                    ]}
                    onPress={onCompleteSet}
                    activeOpacity={0.85}
                >
                    <Ionicons name="checkmark" size={22} color="#FFFFFF" />
                    <Text style={styles.completeButtonText}>
                        {isCardio ? "Complete" : "Complete Set"}
                    </Text>
                </TouchableOpacity>
            </View>
        </View>
    );
};

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: "#2C2925",
    },
    imageContainer: {
        backgroundColor: "#1A1A1A",
    },
    imagePlaceholder: {
        backgroundColor: "#1A1A1A",
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
        paddingBottom: spacing.lg,
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
        backgroundColor: "rgba(255,255,255,0.15)",
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
        backgroundColor: "rgba(255,255,255,0.15)",
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
    setCounter: {
        fontFamily: typography.fonts.bodyBold,
        fontSize: typography.sizes.lg,
        color: "#FFFFFF",
        textAlign: "center",
        marginBottom: 16,
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
