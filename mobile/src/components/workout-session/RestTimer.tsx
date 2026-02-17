import React, { useEffect, useState } from "react";
import { View, Text, TouchableOpacity, StyleSheet } from "react-native";
import { typography } from "../../theme";

interface RestTimerProps {
    duration: number; // seconds
    onRestComplete: () => void;
    onSkip: () => void;
    nextSetNumber: number;
    totalSets: number;
}

export const RestTimer: React.FC<RestTimerProps> = ({
    duration,
    onRestComplete,
    onSkip,
    nextSetNumber,
    totalSets,
}) => {
    const [remaining, setRemaining] = useState(duration);

    useEffect(() => {
        setRemaining(duration);
    }, [duration]);

    useEffect(() => {
        if (remaining <= 0) {
            onRestComplete();
            return;
        }
        const timer = setInterval(() => {
            setRemaining((prev) => prev - 1);
        }, 1000);
        return () => clearInterval(timer);
    }, [remaining, onRestComplete]);

    const minutes = Math.floor(remaining / 60);
    const seconds = remaining % 60;
    const display =
        minutes > 0
            ? `${minutes}:${seconds.toString().padStart(2, "0")}`
            : `${seconds}`;

    return (
        <View style={styles.overlay}>
            <View style={styles.content}>
                <Text style={styles.label}>Rest</Text>
                <Text style={styles.countdown}>{display}</Text>
                <Text style={styles.nextLabel}>
                    Next: Set {nextSetNumber} of {totalSets}
                </Text>
            </View>
            <TouchableOpacity
                style={styles.skipButton}
                onPress={onSkip}
                activeOpacity={0.85}
            >
                <Text style={styles.skipText}>Skip Rest</Text>
            </TouchableOpacity>
        </View>
    );
};

const styles = StyleSheet.create({
    overlay: {
        ...StyleSheet.absoluteFillObject,
        backgroundColor: "rgba(30,27,24,0.85)",
        justifyContent: "center",
        alignItems: "center",
    },
    content: {
        alignItems: "center",
    },
    label: {
        fontFamily: typography.fonts.body,
        fontSize: typography.sizes.md,
        color: "rgba(255,255,255,0.6)",
        marginBottom: 8,
        textTransform: "uppercase",
        letterSpacing: 2,
    },
    countdown: {
        fontFamily: typography.fonts.display,
        fontSize: 96,
        color: "#FFFFFF",
        lineHeight: 110,
    },
    nextLabel: {
        fontFamily: typography.fonts.bodyMedium,
        fontSize: typography.sizes.md,
        color: "rgba(255,255,255,0.7)",
        marginTop: 16,
    },
    skipButton: {
        position: "absolute",
        bottom: 80,
        paddingHorizontal: 32,
        paddingVertical: 14,
        borderRadius: 24,
        borderWidth: 1.5,
        borderColor: "rgba(255,255,255,0.4)",
    },
    skipText: {
        fontFamily: typography.fonts.bodySemibold,
        fontSize: typography.sizes.md,
        color: "#FFFFFF",
    },
});
