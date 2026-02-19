import React, { useMemo } from "react";
import { View, Text, StyleSheet, useColorScheme } from "react-native";
import { Workout, getPresetByName, getDefaultPreset } from "../types";
import { getTheme, typography, spacing, radii } from "../theme";
import { GlassCard } from "./GlassCard";
import {
    WARMUP_RAMP,
    PRESET_TO_RAMP,
    BAR_WEIGHT,
    WORKING_REST,
    WarmupRampKey,
} from "../constants/warmupRamp";

interface SetPlanCardProps {
    workout: Workout;
    activePreset: string;
    oneRepMax: number | null;
}

interface SetRow {
    label: string;
    reps: number;
    weightLabel: string;
    restLabel: string;
    isWarmup: boolean;
}

function buildSetRows(
    presetName: string,
    workout: Workout,
    oneRepMax: number | null,
): SetRow[] {
    const preset =
        getPresetByName(workout, presetName) ?? getDefaultPreset(workout);
    if (!preset || preset.inputType !== "percentage_1rm") return [];

    const rampKey: WarmupRampKey =
        PRESET_TO_RAMP[presetName] ?? "hypertrophy";
    const warmupSets = WARMUP_RAMP[rampKey];

    const warmupRows: SetRow[] = warmupSets.map((s) => {
        let weightLabel: string;
        if (s.pct === 0) {
            weightLabel = oneRepMax ? `Bar (${BAR_WEIGHT} lbs)` : "Bar only";
        } else if (oneRepMax) {
            weightLabel = `${Math.round(oneRepMax * s.pct / 100)} lbs`;
        } else {
            weightLabel = `${s.pct}% 1RM`;
        }

        return {
            label: s.label,
            reps: s.reps,
            weightLabel,
            restLabel: `${s.rest}s`,
            isWarmup: true,
        };
    });

    const sets = preset.sets ?? 3;
    const reps = preset.reps ?? 1;
    const pct = preset.intensityPct ?? 80;

    const workingWeightLabel = oneRepMax
        ? `${Math.round(oneRepMax * pct / 100)} lbs`
        : `${pct}% 1RM`;

    const restSeconds = preset.restSeconds ?? WORKING_REST[rampKey];
    const restLabel = `${restSeconds}s`;

    const workingRows: SetRow[] = Array.from({ length: sets }, () => ({
        label: "Working",
        reps,
        weightLabel: workingWeightLabel,
        restLabel,
        isWarmup: false,
    }));

    return [...warmupRows, ...workingRows];
}

export const SetPlanCard: React.FC<SetPlanCardProps> = ({
    workout,
    activePreset,
    oneRepMax,
}) => {
    const scheme = useColorScheme();
    const theme = getTheme(scheme === "dark" ? "dark" : "light");

    const rows = useMemo(
        () => buildSetRows(activePreset, workout, oneRepMax),
        [activePreset, workout, oneRepMax],
    );

    if (rows.length === 0) return null;

    const warmupCount = rows.filter((r) => r.isWarmup).length;

    return (
        <View style={styles.section}>
            <Text
                style={[
                    styles.sectionTitle,
                    { color: theme.colors.text },
                ]}
            >
                Set Plan
            </Text>

            {oneRepMax === null && (
                <View
                    style={[
                        styles.banner,
                        { backgroundColor: theme.colors.accent + "15" },
                    ]}
                >
                    <Text
                        style={[
                            styles.bannerText,
                            { color: theme.colors.accent },
                        ]}
                    >
                        Log your 1RM in Personal Records below to see exact
                        weights.
                    </Text>
                </View>
            )}

            <GlassCard>
                {/* Column headers */}
                <View style={styles.headerRow}>
                    <Text style={[styles.headerCell, styles.rowIndex, { color: theme.colors.subtext }]}>#</Text>
                    <Text style={[styles.headerCell, styles.rowReps, { color: theme.colors.subtext }]}>Reps</Text>
                    <Text style={[styles.headerCell, styles.rowWeight, { color: theme.colors.subtext }]}>Weight</Text>
                    <Text style={[styles.headerCell, styles.rowRest, { color: theme.colors.subtext }]}>Rest</Text>
                </View>

                {/* Warm-up group */}
                <Text
                    style={[
                        styles.groupLabel,
                        { color: theme.colors.subtext },
                    ]}
                >
                    WARM-UP
                </Text>
                {rows.slice(0, warmupCount).map((row, i) => (
                    <View
                        key={`wu-${i}`}
                        style={[
                            styles.row,
                            i < warmupCount - 1 && {
                                borderBottomWidth: StyleSheet.hairlineWidth,
                                borderBottomColor: theme.colors.border,
                            },
                        ]}
                    >
                        <Text
                            style={[
                                styles.rowIndex,
                                { color: theme.colors.subtext },
                            ]}
                        >
                            {i + 1}
                        </Text>
                        <Text
                            style={[
                                styles.rowReps,
                                { color: theme.colors.subtext },
                            ]}
                        >
                            {row.reps} {row.reps === 1 ? "rep" : "reps"}
                        </Text>
                        <Text
                            style={[
                                styles.rowWeight,
                                { color: theme.colors.subtext },
                            ]}
                        >
                            {row.weightLabel}
                        </Text>
                        <Text
                            style={[
                                styles.rowRest,
                                { color: theme.colors.subtext },
                            ]}
                        >
                            {row.restLabel}
                        </Text>
                    </View>
                ))}

                {/* Divider */}
                <View
                    style={[
                        styles.divider,
                        { backgroundColor: theme.colors.border },
                    ]}
                />

                {/* Working group */}
                <Text
                    style={[
                        styles.groupLabel,
                        { color: theme.colors.text },
                    ]}
                >
                    WORKING
                </Text>
                {rows.slice(warmupCount).map((row, i) => (
                    <View
                        key={`wk-${i}`}
                        style={[
                            styles.row,
                            i < rows.length - warmupCount - 1 && {
                                borderBottomWidth: StyleSheet.hairlineWidth,
                                borderBottomColor: theme.colors.border,
                            },
                        ]}
                    >
                        <Text
                            style={[
                                styles.rowIndex,
                                { color: theme.colors.text },
                            ]}
                        >
                            {warmupCount + i + 1}
                        </Text>
                        <Text
                            style={[
                                styles.rowReps,
                                { color: theme.colors.text },
                            ]}
                        >
                            {row.reps} {row.reps === 1 ? "rep" : "reps"}
                        </Text>
                        <Text
                            style={[
                                styles.rowWeight,
                                { color: theme.colors.accent },
                            ]}
                        >
                            {row.weightLabel}
                        </Text>
                        <Text
                            style={[
                                styles.rowRest,
                                { color: theme.colors.subtext },
                            ]}
                        >
                            {row.restLabel}
                        </Text>
                    </View>
                ))}
            </GlassCard>
        </View>
    );
};

const styles = StyleSheet.create({
    section: {
        marginBottom: spacing.md,
    },
    sectionTitle: {
        fontFamily: typography.fonts.headlineSemibold,
        fontSize: typography.sizes.lg,
        marginBottom: spacing.xs,
    },
    banner: {
        borderRadius: radii.sm,
        paddingHorizontal: spacing.sm,
        paddingVertical: spacing.xs,
        marginBottom: spacing.xs,
    },
    bannerText: {
        fontFamily: typography.fonts.body,
        fontSize: typography.sizes.sm,
    },
    headerRow: {
        flexDirection: "row",
        alignItems: "center",
        paddingBottom: spacing.xxs,
        marginBottom: spacing.xxs,
        borderBottomWidth: StyleSheet.hairlineWidth,
        borderBottomColor: "rgba(0,0,0,0.08)",
    },
    headerCell: {
        fontFamily: typography.fonts.bodyMedium,
        fontSize: typography.sizes.xs,
        letterSpacing: typography.letterSpacing.wide,
        textTransform: "uppercase",
    },
    groupLabel: {
        fontFamily: typography.fonts.bodyMedium,
        fontSize: typography.sizes.xs,
        letterSpacing: typography.letterSpacing.wide,
        marginBottom: spacing.xxs,
    },
    row: {
        flexDirection: "row",
        alignItems: "center",
        paddingVertical: spacing.xs,
    },
    rowIndex: {
        width: 24,
        fontFamily: typography.fonts.bodySemibold,
        fontSize: typography.sizes.sm,
    },
    rowReps: {
        flex: 1,
        fontFamily: typography.fonts.body,
        fontSize: typography.sizes.sm,
    },
    rowWeight: {
        flex: 1,
        fontFamily: typography.fonts.bodySemibold,
        fontSize: typography.sizes.sm,
        textAlign: "right",
    },
    rowRest: {
        width: 48,
        fontFamily: typography.fonts.body,
        fontSize: typography.sizes.xs,
        textAlign: "right",
    },
    divider: {
        height: 1,
        marginVertical: spacing.xs,
    },
});
