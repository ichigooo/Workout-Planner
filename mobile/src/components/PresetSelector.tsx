import React, { useRef, useEffect } from "react";
import { View, Text, StyleSheet, Animated, PanResponder, Dimensions } from "react-native";
import { PercentagePreset, PERCENTAGE_PRESETS } from "../types";

interface PresetSelectorProps {
    selected: PercentagePreset;
    onSelect: (preset: PercentagePreset) => void;
    disabled?: boolean;
}

const presetOrder: PercentagePreset[] = ["high", "medium", "hypertrophy"];
const SLIDER_PADDING = 16;
const THUMB_SIZE = 28;

export const PresetSelector: React.FC<PresetSelectorProps> = ({
    selected,
    onSelect,
    disabled = false,
}) => {
    const containerWidth = useRef(0);
    const translateX = useRef(new Animated.Value(0)).current;

    const getPositionForPreset = (preset: PercentagePreset, width: number): number => {
        const index = presetOrder.indexOf(preset);
        const trackWidth = width - SLIDER_PADDING * 2 - THUMB_SIZE;
        return SLIDER_PADDING + (trackWidth * index) / (presetOrder.length - 1);
    };

    const getPresetForPosition = (x: number, width: number): PercentagePreset => {
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
                // Get current value and set offset
                translateX.extractOffset();
            },
            onPanResponderMove: (_, gestureState) => {
                const newX = gestureState.dx;
                translateX.setValue(newX);
            },
            onPanResponderRelease: (_, gestureState) => {
                translateX.flattenOffset();
                // Calculate final position
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

    const handleStopPress = (preset: PercentagePreset) => {
        if (!disabled) {
            onSelect(preset);
        }
    };

    const selectedConfig = PERCENTAGE_PRESETS[selected];

    return (
        <View style={styles.container}>
            {/* Current value display */}
            <View style={styles.valueDisplay}>
                <Text style={styles.valueLabel}>{selectedConfig.label}</Text>
                <Text style={styles.valueDescription}>
                    3 sets × {selectedConfig.reps} {selectedConfig.reps === 1 ? "rep" : "reps"} @ {selectedConfig.percentage}% 1RM
                </Text>
            </View>

            {/* Slider track */}
            <View style={styles.sliderContainer} onLayout={handleLayout}>
                {/* Track background */}
                <View style={styles.track} />

                {/* Stop markers and labels */}
                <View style={styles.stopsContainer}>
                    {presetOrder.map((preset, index) => {
                        const isSelected = selected === preset;
                        return (
                            <View
                                key={preset}
                                style={[
                                    styles.stopWrapper,
                                    index === 0 && styles.stopWrapperFirst,
                                    index === presetOrder.length - 1 && styles.stopWrapperLast,
                                ]}
                            >
                                <View
                                    style={[
                                        styles.stopDot,
                                        isSelected && styles.stopDotActive,
                                    ]}
                                    onTouchEnd={() => handleStopPress(preset)}
                                />
                                <Text
                                    style={[
                                        styles.stopLabel,
                                        isSelected && styles.stopLabelActive,
                                    ]}
                                >
                                    {PERCENTAGE_PRESETS[preset].percentage}%
                                </Text>
                            </View>
                        );
                    })}
                </View>

                {/* Draggable thumb */}
                <Animated.View
                    style={[
                        styles.thumb,
                        disabled && styles.thumbDisabled,
                        { transform: [{ translateX }] },
                    ]}
                    {...panResponder.panHandlers}
                >
                    <Text style={styles.thumbText}>
                        {PERCENTAGE_PRESETS[selected].reps}
                    </Text>
                </Animated.View>
            </View>

            {/* Rep labels below */}
            <View style={styles.repLabelsContainer}>
                <Text style={styles.repLabel}>1 rep</Text>
                <Text style={styles.repLabel}>5 reps</Text>
                <Text style={styles.repLabel}>8 reps</Text>
            </View>
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
