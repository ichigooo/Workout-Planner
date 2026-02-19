import React, { useRef, useEffect } from "react";
import { View, Text, StyleSheet, Animated, PanResponder } from "react-native";
import { WorkoutPreset } from "../types";

interface PresetSelectorProps {
    presets: WorkoutPreset[];
    selected: string;
    onSelect: (presetName: string) => void;
    disabled?: boolean;
}

const SLIDER_PADDING = 16;
const THUMB_SIZE = 28;

export const PresetSelector: React.FC<PresetSelectorProps> = ({
    presets,
    selected,
    onSelect,
    disabled = false,
}) => {
    const containerWidth = useRef(0);
    const translateX = useRef(new Animated.Value(0)).current;

    const presetOrder = presets.map((p) => p.preset);

    const getPositionForPreset = (preset: string, width: number): number => {
        const index = presetOrder.indexOf(preset);
        if (presetOrder.length <= 1) return SLIDER_PADDING;
        const trackWidth = width - SLIDER_PADDING * 2 - THUMB_SIZE;
        return SLIDER_PADDING + (trackWidth * Math.max(0, index)) / (presetOrder.length - 1);
    };

    const getPresetForPosition = (x: number, width: number): string => {
        if (presetOrder.length <= 1) return presetOrder[0] ?? "default";
        const trackWidth = width - SLIDER_PADDING * 2 - THUMB_SIZE;
        const relativeX = x - SLIDER_PADDING;
        const ratio = Math.max(0, Math.min(1, relativeX / trackWidth));
        const index = Math.round(ratio * (presetOrder.length - 1));
        return presetOrder[index];
    };

    useEffect(() => {
        if (containerWidth.current > 0) {
            const pos = getPositionForPreset(selected, containerWidth.current);
            Animated.spring(translateX, {
                toValue: pos,
                useNativeDriver: true,
                tension: 100,
                friction: 10,
            }).start();
        }
    }, [selected, translateX]);

    const panResponder = useRef(
        PanResponder.create({
            onStartShouldSetPanResponder: () => !disabled,
            onMoveShouldSetPanResponder: () => !disabled,
            onPanResponderGrant: () => {
                translateX.extractOffset();
            },
            onPanResponderMove: (_, gestureState) => {
                const newX = gestureState.dx;
                translateX.setValue(newX);
            },
            onPanResponderRelease: (_, gestureState) => {
                translateX.flattenOffset();
                const width = containerWidth.current;
                const currentPos = getPositionForPreset(selected, width) + gestureState.dx;
                const newPreset = getPresetForPosition(currentPos + THUMB_SIZE / 2, width);
                onSelect(newPreset);
            },
        })
    ).current;

    const handleLayout = (event: any) => {
        const { width } = event.nativeEvent.layout;
        containerWidth.current = width;
        const pos = getPositionForPreset(selected, width);
        translateX.setValue(pos);
    };

    const handleStopPress = (preset: string) => {
        if (!disabled) {
            onSelect(preset);
        }
    };

    const selectedPreset = presets.find((p) => p.preset === selected) ?? presets[0];

    if (!selectedPreset) return null;

    const displayLabel = selectedPreset.intensityLabel ?? selectedPreset.preset;
    const displayDescription = selectedPreset.intensityPct
        ? `${selectedPreset.sets ?? 3} sets × ${selectedPreset.reps} ${selectedPreset.reps === 1 ? "rep" : "reps"} @ ${selectedPreset.intensityPct}% 1RM`
        : `${selectedPreset.sets ?? 3} sets × ${selectedPreset.reps} reps`;

    return (
        <View style={styles.container}>
            {/* Current value display */}
            <View style={styles.valueDisplay}>
                <Text style={styles.valueLabel}>{displayLabel}</Text>
                <Text style={styles.valueDescription}>{displayDescription}</Text>
            </View>

            {/* Slider track - only show for multiple presets */}
            {presets.length > 1 && (
                <>
                    <View style={styles.sliderContainer} onLayout={handleLayout}>
                        <View style={styles.track} />

                        <View style={styles.stopsContainer}>
                            {presets.map((preset, index) => {
                                const isSelected = selected === preset.preset;
                                return (
                                    <View
                                        key={preset.preset}
                                        style={[
                                            styles.stopWrapper,
                                            index === 0 && styles.stopWrapperFirst,
                                            index === presets.length - 1 && styles.stopWrapperLast,
                                        ]}
                                    >
                                        <View
                                            style={[
                                                styles.stopDot,
                                                isSelected && styles.stopDotActive,
                                            ]}
                                            onTouchEnd={() => handleStopPress(preset.preset)}
                                        />
                                        <Text
                                            style={[
                                                styles.stopLabel,
                                                isSelected && styles.stopLabelActive,
                                            ]}
                                        >
                                            {preset.intensityPct ? `${preset.intensityPct}%` : preset.preset}
                                        </Text>
                                    </View>
                                );
                            })}
                        </View>

                        <Animated.View
                            style={[
                                styles.thumb,
                                disabled && styles.thumbDisabled,
                                { transform: [{ translateX }] },
                            ]}
                            {...panResponder.panHandlers}
                        >
                            <Text style={styles.thumbText}>
                                {selectedPreset.reps ?? ""}
                            </Text>
                        </Animated.View>
                    </View>

                    <View style={styles.repLabelsContainer}>
                        {presets.map((p) => (
                            <Text key={p.preset} style={styles.repLabel}>
                                {p.reps} {p.reps === 1 ? "rep" : "reps"}
                            </Text>
                        ))}
                    </View>
                </>
            )}
        </View>
    );
};

const styles = StyleSheet.create({
    container: {
        paddingVertical: 8,
    },
    valueDisplay: {
        alignItems: "center",
        marginBottom: 16,
        paddingHorizontal: 16,
        paddingVertical: 12,
        backgroundColor: "#2C2925",
        borderRadius: 12,
    },
    valueLabel: {
        fontSize: 16,
        fontWeight: "700",
        color: "#FAF7F2",
        marginBottom: 2,
    },
    valueDescription: {
        fontSize: 14,
        color: "#FAF7F2",
        opacity: 0.8,
    },
    sliderContainer: {
        height: 60,
        justifyContent: "center",
        position: "relative",
    },
    track: {
        position: "absolute",
        left: SLIDER_PADDING + THUMB_SIZE / 2,
        right: SLIDER_PADDING + THUMB_SIZE / 2,
        height: 4,
        backgroundColor: "#E8E2D9",
        borderRadius: 2,
    },
    stopsContainer: {
        position: "absolute",
        left: SLIDER_PADDING + THUMB_SIZE / 2,
        right: SLIDER_PADDING + THUMB_SIZE / 2,
        flexDirection: "row",
        justifyContent: "space-between",
        alignItems: "center",
    },
    stopWrapper: {
        alignItems: "center",
    },
    stopWrapperFirst: {
        alignItems: "flex-start",
    },
    stopWrapperLast: {
        alignItems: "flex-end",
    },
    stopDot: {
        width: 12,
        height: 12,
        borderRadius: 6,
        backgroundColor: "#D4CCC0",
        borderWidth: 2,
        borderColor: "#fff",
    },
    stopDotActive: {
        backgroundColor: "#C17F61",
    },
    stopLabel: {
        marginTop: 6,
        fontSize: 11,
        fontWeight: "600",
        color: "#9C948A",
    },
    stopLabelActive: {
        color: "#C17F61",
    },
    thumb: {
        position: "absolute",
        width: THUMB_SIZE,
        height: THUMB_SIZE,
        borderRadius: THUMB_SIZE / 2,
        backgroundColor: "#C17F61",
        justifyContent: "center",
        alignItems: "center",
        shadowColor: "#000",
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.2,
        shadowRadius: 4,
        elevation: 4,
    },
    thumbDisabled: {
        opacity: 0.5,
    },
    thumbText: {
        fontSize: 12,
        fontWeight: "700",
        color: "#fff",
    },
    repLabelsContainer: {
        flexDirection: "row",
        justifyContent: "space-between",
        paddingHorizontal: SLIDER_PADDING + THUMB_SIZE / 2 - 12,
        marginTop: 4,
    },
    repLabel: {
        fontSize: 11,
        color: "#9C948A",
    },
});
