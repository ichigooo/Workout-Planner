import React, { useEffect, useRef } from "react";
import { View, Text, StyleSheet, Animated, Dimensions } from "react-native";
import * as Haptics from "expo-haptics";

interface PRCelebrationProps {
    visible: boolean;
    onComplete: () => void;
}

const { width: SCREEN_WIDTH, height: SCREEN_HEIGHT } = Dimensions.get("window");

// Confetti particle component
const ConfettiParticle: React.FC<{
    delay: number;
    color: string;
    startX: number;
}> = ({ delay, color, startX }) => {
    const translateY = useRef(new Animated.Value(-50)).current;
    const translateX = useRef(new Animated.Value(startX)).current;
    const rotate = useRef(new Animated.Value(0)).current;
    const opacity = useRef(new Animated.Value(1)).current;

    useEffect(() => {
        const animation = Animated.sequence([
            Animated.delay(delay),
            Animated.parallel([
                Animated.timing(translateY, {
                    toValue: SCREEN_HEIGHT + 50,
                    duration: 2500,
                    useNativeDriver: true,
                }),
                Animated.timing(translateX, {
                    toValue: startX + (Math.random() - 0.5) * 200,
                    duration: 2500,
                    useNativeDriver: true,
                }),
                Animated.timing(rotate, {
                    toValue: 360 * (Math.random() > 0.5 ? 1 : -1) * 3,
                    duration: 2500,
                    useNativeDriver: true,
                }),
                Animated.sequence([
                    Animated.delay(1800),
                    Animated.timing(opacity, {
                        toValue: 0,
                        duration: 700,
                        useNativeDriver: true,
                    }),
                ]),
            ]),
        ]);
        animation.start();
    }, [delay, startX, translateY, translateX, rotate, opacity]);

    const rotateInterpolate = rotate.interpolate({
        inputRange: [0, 360],
        outputRange: ["0deg", "360deg"],
    });

    return (
        <Animated.View
            style={[
                styles.confetti,
                {
                    backgroundColor: color,
                    transform: [
                        { translateY },
                        { translateX },
                        { rotate: rotateInterpolate },
                    ],
                    opacity,
                },
            ]}
        />
    );
};

export const PRCelebration: React.FC<PRCelebrationProps> = ({ visible, onComplete }) => {
    const textScale = useRef(new Animated.Value(0)).current;
    const textOpacity = useRef(new Animated.Value(0)).current;

    // Color palette matching the app's design
    const colors = ["#C17F61", "#9C948A", "#FAF7F2", "#E8D5C4", "#7A9A8A"];

    useEffect(() => {
        if (visible) {
            // Trigger haptic feedback (catch errors if native module not linked)
            Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success).catch(() => {
                // Haptics not available, skip silently
            });

            // Animate text
            Animated.sequence([
                Animated.parallel([
                    Animated.spring(textScale, {
                        toValue: 1,
                        friction: 4,
                        tension: 40,
                        useNativeDriver: true,
                    }),
                    Animated.timing(textOpacity, {
                        toValue: 1,
                        duration: 300,
                        useNativeDriver: true,
                    }),
                ]),
                Animated.delay(1500),
                Animated.timing(textOpacity, {
                    toValue: 0,
                    duration: 300,
                    useNativeDriver: true,
                }),
            ]).start();

            // Auto-dismiss after animation
            const timer = setTimeout(() => {
                textScale.setValue(0);
                textOpacity.setValue(0);
                onComplete();
            }, 2500);

            return () => clearTimeout(timer);
        }
    }, [visible, textScale, textOpacity, onComplete]);

    if (!visible) return null;

    // Generate confetti particles
    const particles = Array.from({ length: 50 }, (_, i) => ({
        id: i,
        delay: Math.random() * 500,
        color: colors[Math.floor(Math.random() * colors.length)],
        startX: Math.random() * SCREEN_WIDTH,
    }));

    return (
        <View style={styles.container} pointerEvents="none">
            {particles.map((particle) => (
                <ConfettiParticle
                    key={particle.id}
                    delay={particle.delay}
                    color={particle.color}
                    startX={particle.startX}
                />
            ))}

            <Animated.View
                style={[
                    styles.textContainer,
                    {
                        transform: [{ scale: textScale }],
                        opacity: textOpacity,
                    },
                ]}
            >
                <Text style={styles.prText}>NEW PR!</Text>
            </Animated.View>
        </View>
    );
};

const styles = StyleSheet.create({
    container: {
        ...StyleSheet.absoluteFillObject,
        zIndex: 1000,
    },
    confetti: {
        position: "absolute",
        width: 12,
        height: 12,
        borderRadius: 2,
    },
    textContainer: {
        position: "absolute",
        top: "40%",
        left: 0,
        right: 0,
        alignItems: "center",
    },
    prText: {
        fontSize: 48,
        fontWeight: "800",
        color: "#C17F61",
        fontFamily: "Fraunces_700Bold",
        textShadowColor: "rgba(0, 0, 0, 0.3)",
        textShadowOffset: { width: 0, height: 2 },
        textShadowRadius: 4,
    },
});
