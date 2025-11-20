import React, { useState } from "react";
import {
    View,
    Text,
    StyleSheet,
    ImageBackground,
    TouchableOpacity,
    ActivityIndicator,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { getTheme } from "../theme";
import { useColorScheme } from "react-native";

interface LandingScreenProps {
    onBegin: () => void;
    isLoading?: boolean;
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
    const theme = getTheme(scheme === "dark" ? "dark" : "light");

    // Select a random quote once when component mounts
    const [quote] = useState(() => {
        const randomIndex = Math.floor(Math.random() * QUOTES.length);
        return QUOTES[randomIndex];
    });

    return (
        <ImageBackground
            source={require("../../assets/images/landing.jpeg")}
            style={styles.background}
            resizeMode="cover"
        >
            <SafeAreaView style={styles.container} edges={["top", "bottom"]}>
                <View style={styles.content}>
                    {/* Quote - improved styling with emphasis */}
                    <View style={styles.quoteContainer}>
                        <Text style={styles.quote}>{renderQuoteWithEmphasis(quote)}</Text>
                    </View>

                    {/* Modern button */}
                    <View style={styles.buttonContainer}>
                        <TouchableOpacity
                            style={[
                                styles.button,
                                {
                                    opacity: isLoading ? 0.7 : 1,
                                },
                            ]}
                            onPress={onBegin}
                            disabled={isLoading}
                            activeOpacity={0.85}
                        >
                            {isLoading ? (
                                <ActivityIndicator color="#FFFFFF" size="small" />
                            ) : (
                                <Text style={styles.buttonText}>Begin workout</Text>
                            )}
                        </TouchableOpacity>
                    </View>
                </View>
            </SafeAreaView>
        </ImageBackground>
    );
};

const styles = StyleSheet.create({
    background: {
        flex: 1,
        width: "100%",
        height: "100%",
    },
    container: {
        flex: 1,
    },
    content: {
        flex: 1,
        justifyContent: "flex-end",
        alignItems: "center",
        paddingHorizontal: 32,
        paddingBottom: 80,
        paddingTop: 48,
    },
    quoteContainer: {
        alignItems: "center",
        justifyContent: "center",
        paddingHorizontal: 32,
        marginBottom: 56,
        maxWidth: 320,
    },
    quote: {
        fontSize: 19,
        fontWeight: "300",
        textAlign: "center",
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
    button: {
        paddingHorizontal: 48,
        paddingVertical: 16,
        borderRadius: 32,
        minWidth: 220,
        alignItems: "center",
        justifyContent: "center",
        backgroundColor: "#6B8E7F",
        shadowColor: "#000",
        shadowOffset: {
            width: 0,
            height: 2,
        },
        shadowOpacity: 0.15,
        shadowRadius: 4,
        elevation: 3,
    },
    buttonText: {
        fontSize: 16,
        fontWeight: "500",
        letterSpacing: 0.5,
        color: "#FFFFFF",
    },
});
