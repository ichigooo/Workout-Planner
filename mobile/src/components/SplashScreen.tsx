import React, { useEffect, useState } from "react";
import {
    View,
    Text,
    StyleSheet,
    Animated,
    Dimensions,
    useColorScheme,
    Image,
    TouchableOpacity,
} from "react-native";
import { getTheme } from "../theme";

interface SplashScreenProps {
    onFinish: () => void;
}

const { width: _width, height: _height } = Dimensions.get("window");

export const SplashScreen: React.FC<SplashScreenProps> = ({ onFinish }) => {
    const scheme = useColorScheme();
    const theme = getTheme(scheme === "dark" ? "dark" : "light");

    const [fadeAnim] = useState(new Animated.Value(0));
    const [scaleAnim] = useState(new Animated.Value(0.8));
    const [slideAnim] = useState(new Animated.Value(50));

    // Inspirational phrases
    const inspirationalPhrases = [
        "Every rep counts",
        "Strength starts within",
        "Your journey begins now",
        "Push beyond limits",
        "Consistency is key",
        "Believe in yourself",
        "Progress over perfection",
        "You've got this!",
    ];

    const [currentPhrase, _setCurrentPhrase] = useState(
        inspirationalPhrases[Math.floor(Math.random() * inspirationalPhrases.length)],
    );

    useEffect(() => {
        // Animate in
        Animated.parallel([
            Animated.timing(fadeAnim, {
                toValue: 1,
                duration: 800,
                useNativeDriver: true,
            }),
            Animated.spring(scaleAnim, {
                toValue: 1,
                tension: 50,
                friction: 7,
                useNativeDriver: true,
            }),
            Animated.timing(slideAnim, {
                toValue: 0,
                duration: 600,
                useNativeDriver: true,
            }),
        ]).start();
    }, [fadeAnim, scaleAnim, slideAnim]);

    const handleNext = () => {
        // Animate out
        Animated.parallel([
            Animated.timing(fadeAnim, {
                toValue: 0,
                duration: 500,
                useNativeDriver: true,
            }),
            Animated.timing(scaleAnim, {
                toValue: 0.8,
                duration: 500,
                useNativeDriver: true,
            }),
        ]).start(() => {
            onFinish();
        });
    };

    return (
        <View style={[styles.container, { backgroundColor: theme.colors.bg }]}>
            {/* App Icon Area */}
            <Animated.View
                style={[
                    styles.iconContainer,
                    {
                        opacity: fadeAnim,
                        transform: [{ scale: scaleAnim }, { translateY: slideAnim }],
                    },
                ]}
            >
                <View style={[styles.iconBackground, { backgroundColor: "#FF6B35" }]}>
                    <Image
                        source={require("../../assets/images/catt.png")}
                        style={styles.iconImage}
                        resizeMode="cover"
                    />
                </View>
            </Animated.View>

            {/* Inspirational Phrase */}
            <Animated.View
                style={[
                    styles.phraseContainer,
                    {
                        opacity: fadeAnim,
                        transform: [{ translateY: slideAnim }],
                    },
                ]}
            >
                <Text style={[styles.inspirationalPhrase, { color: theme.colors.accent }]}>
                    "{currentPhrase}"
                </Text>
            </Animated.View>

            {/* Next Button */}
            <Animated.View
                style={[
                    styles.buttonContainer,
                    {
                        opacity: fadeAnim,
                    },
                ]}
            >
                <TouchableOpacity
                    style={[styles.nextButton, { backgroundColor: theme.colors.accent }]}
                    onPress={handleNext}
                >
                    <Text style={[styles.nextButtonText, { color: theme.colors.surface }]}>
                        Start Your Journey
                    </Text>
                </TouchableOpacity>
            </Animated.View>
        </View>
    );
};

const styles = StyleSheet.create({
    container: {
        flex: 1,
        justifyContent: "center",
        alignItems: "center",
        paddingHorizontal: 40,
    },
    iconContainer: {
        marginBottom: 40,
    },
    iconBackground: {
        width: 120,
        height: 120,
        borderRadius: 60,
        justifyContent: "center",
        alignItems: "center",
        shadowColor: "#000",
        shadowOffset: { width: 0, height: 8 },
        shadowOpacity: 0.2,
        shadowRadius: 16,
        elevation: 8,
    },
    iconImage: {
        width: 100,
        height: 100,
        borderRadius: 50, // Make the image circular
    },
    phraseContainer: {
        marginBottom: 60,
        marginTop: 20,
        paddingHorizontal: 20,
    },
    inspirationalPhrase: {
        fontSize: 18,
        fontFamily: "Inter_500Medium",
        textAlign: "center",
        fontStyle: "italic",
        lineHeight: 24,
    },
    buttonContainer: {
        marginTop: 40,
    },
    nextButton: {
        paddingHorizontal: 32,
        paddingVertical: 16,
        borderRadius: 12,
        shadowColor: "#000",
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.2,
        shadowRadius: 8,
        elevation: 4,
    },
    nextButtonText: {
        fontSize: 18,
        fontFamily: "Inter_600SemiBold",
        textAlign: "center",
        letterSpacing: -0.3,
    },
});
