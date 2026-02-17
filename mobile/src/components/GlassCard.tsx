import React from "react";
import { View, ViewStyle, StyleSheet } from "react-native";
import { BlurView } from "expo-blur";
import { glassStyles, shadows } from "../theme";

interface GlassCardProps {
    children: React.ReactNode;
    style?: ViewStyle;
    dark?: boolean;
    intensity?: number;
    blurTint?: "light" | "dark" | "default";
    noPadding?: boolean;
}

export const GlassCard: React.FC<GlassCardProps> = ({
    children,
    style,
    dark = false,
    intensity = glassStyles.blurIntensity,
    blurTint,
    noPadding = false,
}) => {
    const cardStyle = dark ? glassStyles.cardDark : glassStyles.card;
    const tint = blurTint || (dark ? "dark" : "light");

    return (
        <View style={[cardStyle, shadows.light.card, style]}>
            <BlurView intensity={intensity} tint={tint} style={StyleSheet.absoluteFill} />
            <View style={noPadding ? undefined : styles.content}>{children}</View>
        </View>
    );
};

const styles = StyleSheet.create({
    content: {
        padding: 16,
    },
});
