import React from "react";
import { View, StyleSheet } from "react-native";
import Animated, {
    useAnimatedStyle,
    withTiming,
} from "react-native-reanimated";

interface StoryProgressBarProps {
    totalSegments: number;
    currentSegment: number;
    segmentProgress: number; // 0-1 for current segment
}

export const StoryProgressBar: React.FC<StoryProgressBarProps> = ({
    totalSegments,
    currentSegment,
    segmentProgress,
}) => {
    return (
        <View style={styles.container}>
            {Array.from({ length: totalSegments }).map((_, i) => (
                <View key={i} style={styles.segmentBg}>
                    <SegmentFill
                        progress={
                            i < currentSegment
                                ? 1
                                : i === currentSegment
                                  ? segmentProgress
                                  : 0
                        }
                    />
                </View>
            ))}
        </View>
    );
};

const SegmentFill: React.FC<{ progress: number }> = ({ progress }) => {
    const animatedStyle = useAnimatedStyle(() => ({
        width: withTiming(`${Math.min(progress, 1) * 100}%` as any, {
            duration: 300,
        }),
    }));

    return <Animated.View style={[styles.segmentFill, animatedStyle]} />;
};

const styles = StyleSheet.create({
    container: {
        flexDirection: "row",
        gap: 4,
        paddingHorizontal: 12,
    },
    segmentBg: {
        flex: 1,
        height: 3,
        borderRadius: 2,
        backgroundColor: "rgba(255,255,255,0.3)",
        overflow: "hidden",
    },
    segmentFill: {
        height: "100%",
        borderRadius: 2,
        backgroundColor: "#FFFFFF",
    },
});
