import React, { useState } from "react";
import { View, Text, StyleSheet, ImageBackground, TouchableOpacity, useColorScheme } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { getTheme, spacing, radii, typography } from "../theme";

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
    const scheme = useColorScheme();
    const theme = getTheme(scheme === "dark" ? "dark" : "light");

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
            {/* Warm overlay for readability */}
            <View style={styles.imageOverlay} />

            <SafeAreaView style={styles.safeArea} edges={["top", "bottom"]}>
                <View style={styles.content}>
                    {/* Quote - Fraunces serif font */}
                    <View style={styles.quoteContainer}>
                        <Text
                            style={[
                                styles.quoteText,
                                {
                                    fontFamily: typography.fonts.display,
                                    fontSize: typography.sizes.xl,
                                },
                            ]}
                        >
                            "{quote}"
                        </Text>
                    </View>

                    {/* Buttons - Neutral & Minimal style */}
                    <View style={styles.buttonContainer}>
                        <TouchableOpacity
                            style={[
                                styles.primaryButton,
                                {
                                    backgroundColor: theme.colors.accent,
                                    borderRadius: radii.md,
                                    ...theme.shadows.subtle,
                                },
                            ]}
                            onPress={onBegin}
                            disabled={isLoading}
                            activeOpacity={0.8}
                        >
                            <Text
                                style={[
                                    styles.primaryButtonText,
                                    {
                                        color: "#FFFFFF",
                                        fontFamily: typography.fonts.bodyMedium,
                                        fontSize: typography.sizes.md,
                                    },
                                ]}
                            >
                                {isLoading ? "Loading..." : "Get Started"}
                            </Text>
                        </TouchableOpacity>

                        {/* Conditional Sign In Button - Outline style */}
                        {!isLoggedIn && (
                            <TouchableOpacity
                                style={[
                                    styles.secondaryButton,
                                    {
                                        backgroundColor: "transparent",
                                        borderColor: "#FFFFFF",
                                        borderRadius: radii.md,
                                    },
                                ]}
                                onPress={onBegin}
                                activeOpacity={0.8}
                            >
                                <Text
                                    style={[
                                        styles.secondaryButtonText,
                                        {
                                            color: "#FFFFFF",
                                            fontFamily: typography.fonts.bodyMedium,
                                            fontSize: typography.sizes.sm,
                                        },
                                    ]}
                                >
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
    imageOverlay: {
        ...StyleSheet.absoluteFillObject,
        backgroundColor: "rgba(44, 41, 37, 0.5)", // Warm espresso overlay
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
        // Base style - dynamic values applied inline
        textAlign: "center",
        lineHeight: 36,
        letterSpacing: -0.3, // Tighter for serif font
        color: "#FFFFFF", // White text on dark overlay
        textShadowColor: "rgba(0, 0, 0, 0.4)",
        textShadowOffset: { width: 0, height: 2 },
        textShadowRadius: 8,
    },
    buttonContainer: {
        alignItems: "center",
        gap: spacing.md,
        width: "100%",
    },
    primaryButton: {
        // Terracotta button with white text
        width: "80%",
        paddingVertical: spacing.sm, // 16
        paddingHorizontal: spacing.lg, // 32
        alignItems: "center",
        justifyContent: "center",
        minHeight: 48, // Touch target
    },
    primaryButtonText: {
        fontWeight: "500",
    },
    secondaryButton: {
        // Outline button with transparent bg
        width: "80%",
        paddingVertical: spacing.sm - 2, // 14 (account for border)
        paddingHorizontal: spacing.lg,
        borderWidth: 1.5,
        alignItems: "center",
        justifyContent: "center",
        minHeight: 48,
    },
    secondaryButtonText: {
        fontWeight: "500",
    },
});
