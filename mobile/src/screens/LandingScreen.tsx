import React, { useState } from "react";
import { View, Text, StyleSheet, Image, ImageBackground, TouchableOpacity } from "react-native";
import { useColorScheme } from "react-native";
import { getTheme } from "../theme";

interface LandingScreenProps {
    onBegin: () => void;
    isLoading?: boolean;
}

const theme = getTheme("light");
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

// Helper function to emphasize key words in quotes
const renderQuoteWithEmphasis = (quote: string) => {
    const keyWords = [
        "achieves",
        "believes",
        "limit",
        "stop",
        "done",
        "challenges",
        "routines",
        "journey",
        "habit",
        "success",
        "health",
        "stronger",
        "excellence",
        "start",
        "hardest",
        "showed",
        "comfortable",
        "uncomfortable",
        "better",
        "tribute",
        "heart",
    ];

    const words = quote.split(" ");
    return words.map((word, index) => {
        const cleanWord = word.replace(/[.,;:!?]/g, "").toLowerCase();
        const isKeyWord = keyWords.some((key) => cleanWord.includes(key.toLowerCase()));

        if (isKeyWord) {
            return (
                <Text key={index}>
                    <Text style={styles.quoteEmphasis}>{word}</Text>
                    {index < words.length - 1 ? " " : ""}
                </Text>
            );
        }
        return (
            <Text key={index}>
                {word}
                {index < words.length - 1 ? " " : ""}
            </Text>
        );
    });
};

export const LandingScreen: React.FC<LandingScreenProps> = ({ onBegin, isLoading = false }) => {
    const scheme = useColorScheme();
    getTheme(scheme === "dark" ? "dark" : "light");

    // Select a random quote once when component mounts
    const [quote] = useState(() => {
        const randomIndex = Math.floor(Math.random() * QUOTES.length);
        return QUOTES[randomIndex];
    });

    return (
        <ImageBackground style={styles.background} resizeMode="cover">
            <View style={styles.container}>
                <ImageBackground
                    source={require("../../assets/images/landing1.png")}
                    style={styles.heroContainer}
                    imageStyle={styles.heroImage}
                    resizeMode="cover"
                >
                    <View style={styles.heroOverlay} />
                </ImageBackground>

                <ImageBackground
                    source={require("../../assets/images/landing1.png")}
                    style={styles.bottomBackground}
                    imageStyle={styles.bottomBackgroundImage}
                >
                    <View style={styles.bottomOverlay}>
                        <View style={styles.quoteContainer}>
                            <Text style={styles.quote}>{renderQuoteWithEmphasis(quote)}</Text>
                        </View>

                        <View style={styles.buttonContainer}>
                            <TouchableOpacity
                                style={styles.compositeButton}
                                onPress={onBegin}
                                disabled={isLoading}
                                activeOpacity={0.85}
                            >
                                <View style={styles.buttonLeft}>
                                    <Text style={styles.buttonText}>
                                        {isLoading ? "Loading..." : "Get Started"}
                                    </Text>
                                </View>

                                <View style={styles.buttonRight}>
                                    <Text style={styles.arrow}>↗</Text>
                                </View>
                            </TouchableOpacity>
                        </View>
                    </View>
                </ImageBackground>
            </View>
        </ImageBackground>
    );
};

const styles = StyleSheet.create({
    background: {
        flex: 1,
        width: "100%",
        height: "100%",
        backgroundColor: "#f16109",
    },
    container: {
        flex: 1,
        width: "100%",
    },
    heroContainer: {
        flex: 1,
        width: "100%",
    },
    heroImage: {
        width: "100%",
        height: "100%",
    },
    heroOverlay: {
        flex: 1,
        backgroundColor: "rgba(0, 0, 0, 0.2)",
    },
    bottomBackground: {
        flex: 1.2,
        width: "100%",
        justifyContent: "flex-start",
    },
    bottomBackgroundImage: {
        width: "100%",
        height: "100%",
    },
    bottomOverlay: {
        flex: 1,
        alignItems: "center",
        justifyContent: "center",
        paddingHorizontal: 32,
        paddingBottom: 30,
        paddingTop: 24,
        backgroundColor: "rgba(0, 0, 0, 0.35)",
    },
    quoteContainer: {
        alignItems: "center",
        justifyContent: "center",
        marginBottom: 80,
        maxWidth: 320,
    },
    quote: {
        fontSize: 19,
        fontFamily: "Roboto",
        fontWeight: "300",
        lineHeight: 32,
        letterSpacing: 0.2,
        color: "rgba(255, 255, 255, 0.95)",
        textShadowColor: "rgba(0, 0, 0, 0.3)",
        textShadowOffset: { width: 0, height: 1 },
        textShadowRadius: 2,
    },
    quoteEmphasis: {
        fontWeight: "500",
        color: "#FFFFFF",
    },
    buttonContainer: {
        alignItems: "center",
        width: "100%",
    },
    compositeButton: {
        flexDirection: "row",
        alignItems: "center",
        backgroundColor: theme.colors.accent,
        borderRadius: 20, // <-- more square than 32
        overflow: "hidden",
        minWidth: 300, // wider
        height: 60, // stable height
    },

    buttonLeft: {
        flex: 1,
        paddingHorizontal: 24,
        justifyContent: "center",
        height: "100%",
    },

    buttonRight: {
        width: 80,
        height: "100%",
        backgroundColor: "#E7A9C8", // pink circle
        justifyContent: "center",
        alignItems: "center",
        borderRadius: 20, // keeps the right side perfectly round
    },

    buttonText: {
        fontSize: 18,
        fontWeight: "600",
        color: "#FFFFFF",
    },

    arrow: {
        fontSize: 20,
        fontWeight: "600",
        color: "#000000",
    },
});
