import React, { useState } from "react";
import { Text, StyleSheet, ImageBackground, TouchableOpacity, useColorScheme } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { LinearGradient } from "expo-linear-gradient";
import { getTheme, spacing, radii, typography } from "../theme";

interface LandingScreenProps {
    onBegin: () => void;
    isLoading?: boolean;
    isLoggedIn?: boolean;
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
            <LinearGradient
                colors={["rgba(41, 37, 33, 0.15)", "rgba(41, 37, 33, 0.75)"]}
                start={{ x: 0, y: 0 }}
                end={{ x: 0, y: 1 }}
                style={StyleSheet.absoluteFillObject}
            />

            <SafeAreaView style={styles.safeArea} edges={["top", "bottom"]}>
                <LinearGradient
                    colors={["transparent", "rgba(41, 37, 33, 0.5)"]}
                    start={{ x: 0, y: 0.4 }}
                    end={{ x: 0, y: 1 }}
                    style={styles.content}
                >
                    {/* Quote */}
                    <LinearGradient
                        colors={["transparent", "transparent"]}
                        style={styles.quoteContainer}
                    >
                        <Text
                            style={[
                                styles.quoteText,
                                {
                                    fontFamily: typography.fonts.displayItalic,
                                    fontSize: typography.sizes.xl,
                                },
                            ]}
                        >
                            "{quote}"
                        </Text>
                    </LinearGradient>

                    {/* Buttons */}
                    <LinearGradient
                        colors={["transparent", "transparent"]}
                        style={styles.buttonContainer}
                    >
                        <TouchableOpacity
                            style={[
                                styles.primaryButton,
                                {
                                    backgroundColor: theme.colors.accent,
                                    borderRadius: radii.full,
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
                                        fontFamily: typography.fonts.bodySemibold,
                                        fontSize: typography.sizes.md,
                                    },
                                ]}
                            >
                                {isLoading ? "Loading..." : "Get Started"}
                            </Text>
                        </TouchableOpacity>

                        {!isLoggedIn && (
                            <TouchableOpacity
                                style={[
                                    styles.secondaryButton,
                                    {
                                        backgroundColor: "rgba(255,255,255,0.10)",
                                        borderColor: "rgba(255,255,255,0.4)",
                                        borderRadius: radii.full,
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
                    </LinearGradient>
                </LinearGradient>
            </SafeAreaView>
        </ImageBackground>
    );
};

const styles = StyleSheet.create({
    container: {
        flex: 1,
    },
    safeArea: {
        flex: 1,
    },
    content: {
        flex: 1,
        justifyContent: "flex-end",
        paddingHorizontal: spacing.lg,
        paddingBottom: spacing.xxl + spacing.sm,
    },
    quoteContainer: {
        alignItems: "center",
        marginBottom: spacing.xxl,
        paddingHorizontal: spacing.sm,
    },
    quoteText: {
        textAlign: "center",
        lineHeight: 42,
        letterSpacing: -0.5,
        color: "#FFFFFF",
        textShadowColor: "rgba(0, 0, 0, 0.3)",
        textShadowOffset: { width: 0, height: 2 },
        textShadowRadius: 12,
    },
    buttonContainer: {
        alignItems: "center",
        gap: spacing.sm,
        width: "100%",
    },
    primaryButton: {
        width: "85%",
        paddingVertical: spacing.sm + 2,
        paddingHorizontal: spacing.lg,
        alignItems: "center",
        justifyContent: "center",
        minHeight: 52,
    },
    primaryButtonText: {
        fontWeight: "600",
    },
    secondaryButton: {
        width: "85%",
        paddingVertical: spacing.sm,
        paddingHorizontal: spacing.lg,
        borderWidth: 1,
        alignItems: "center",
        justifyContent: "center",
        minHeight: 48,
    },
    secondaryButtonText: {
        fontWeight: "500",
    },
});
