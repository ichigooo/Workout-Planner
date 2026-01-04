import React, { useState } from "react";
import { View, Text, StyleSheet, ImageBackground, TouchableOpacity } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { spacing } from "../theme";

interface LandingScreenProps {
    onBegin: () => void;
    isLoading?: boolean;
    isLoggedIn?: boolean; // Optional prop to conditionally show sign-in button
}

const QUOTES = [
    "The body achieves what the mind believes.",
    "Your only limit is you.",
    "Don't stop when you're tired. Stop when you're done.",
    "Today's challenges are tomorrow's routines.",
    "Motivation starts the journey; habit sustains it.",
    "If something stands between you and your success, move it. Never be denied.",
    "Your health account and your bank account are the same — the more you put in, the more you can take out.",
    "What hurts today makes you stronger tomorrow.",
    "We are what we repeatedly do. Excellence is a habit.",
    "Start where you are. Use what you have. Do what you can.",
    "The hardest part is over. You showed up.",
    "Get comfortable with being uncomfortable.",
    "Fitness is not about being better than someone else; it's about being better than you used to be.",
    "Exercise is a tribute to the heart.",
];

export const LandingScreen: React.FC<LandingScreenProps> = ({
    onBegin,
    isLoading = false,
    isLoggedIn = false,
}) => {
    // Select a random quote once when component mounts
    const [quote] = useState(() => {
        const randomIndex = Math.floor(Math.random() * QUOTES.length);
        return QUOTES[randomIndex];
    });

    return (
        <ImageBackground
            source={require("../../assets/images/landing2.png")}
            style={styles.container}
            resizeMode="cover"
        >
            {/* Gradient overlay from transparent to sage green */}
            <View style={styles.gradientOverlay} />

            <SafeAreaView style={styles.safeArea} edges={["top", "bottom"]}>
                <View style={styles.content}>
                    {/* Quote */}
                    <View style={styles.quoteContainer}>
                        <Text style={styles.quoteText}>"{quote}"</Text>
                    </View>

                    {/* Buttons */}
                    <View style={styles.buttonContainer}>
                        <TouchableOpacity
                            style={styles.primaryButton}
                            onPress={onBegin}
                            disabled={isLoading}
                            activeOpacity={0.85}
                        >
                            <Text style={styles.primaryButtonText}>
                                {isLoading ? "Loading..." : "Get Started"}
                            </Text>
                        </TouchableOpacity>

                        {/* Conditional Sign In Button */}
                        {!isLoggedIn && (
                            <TouchableOpacity
                                style={styles.secondaryButton}
                                onPress={onBegin}
                                activeOpacity={0.85}
                            >
                                <Text style={styles.secondaryButtonText}>
                                    I already have an account
                                </Text>
                            </TouchableOpacity>
                        )}
                    </View>
                </View>
            </SafeAreaView>
        </ImageBackground>
    );
};

const styles = StyleSheet.create({
    container: {
        flex: 1,
    },
    gradientOverlay: {
        ...StyleSheet.absoluteFillObject,
        backgroundColor: "rgba(76, 107, 60, 0.75)", // Sage green overlay with transparency
    },
    safeArea: {
        flex: 1,
    },
    content: {
        flex: 1,
        justifyContent: "flex-end",
        paddingHorizontal: spacing.lg,
        paddingBottom: spacing.xxl,
    },
    quoteContainer: {
        alignItems: "center",
        marginBottom: spacing.xxl,
        paddingHorizontal: spacing.md,
    },
    quoteText: {
        fontSize: 24,
        fontWeight: "600",
        color: "#FFFFFF",
        textAlign: "center",
        lineHeight: 36,
        letterSpacing: -0.5,
        textShadowColor: "rgba(0, 0, 0, 0.3)",
        textShadowOffset: { width: 0, height: 2 },
        textShadowRadius: 4,
    },
    buttonContainer: {
        alignItems: "center",
        gap: spacing.md,
        width: "100%",
    },
    primaryButton: {
        width: "80%",
        paddingVertical: 18,
        paddingHorizontal: 48,
        borderRadius: 28,
        backgroundColor: "#FFFFFF",
        alignItems: "center",
        justifyContent: "center",
        shadowColor: "#000",
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.3,
        shadowRadius: 12,
        elevation: 6,
    },
    primaryButtonText: {
        color: "#4C6B3C",
        fontSize: 18,
        fontWeight: "700",
        letterSpacing: 0.3,
    },
    secondaryButton: {
        width: "80%",
        paddingVertical: 16,
        paddingHorizontal: 48,
        borderRadius: 28,
        backgroundColor: "rgba(255, 255, 255, 0.15)",
        borderWidth: 2,
        borderColor: "rgba(255, 255, 255, 0.8)",
        alignItems: "center",
        justifyContent: "center",
    },
    secondaryButtonText: {
        color: "#FFFFFF",
        fontSize: 16,
        fontWeight: "600",
        letterSpacing: 0.3,
    },
});
