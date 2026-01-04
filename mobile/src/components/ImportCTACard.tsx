import React from "react";
import { View, Text, StyleSheet, TouchableOpacity, useColorScheme } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { getTheme, spacing, radii } from "../theme";

interface ImportCTACardProps {
    onPress: () => void;
    onDismiss?: () => void;
}

export const ImportCTACard: React.FC<ImportCTACardProps> = ({ onPress, onDismiss }) => {
    const scheme = useColorScheme();
    const theme = getTheme(scheme === "dark" ? "dark" : "light");

    return (
        <TouchableOpacity
            style={[
                styles.container,
                {
                    backgroundColor: theme.colors.surface,
                    borderColor: theme.colors.border,
                },
            ]}
            onPress={onPress}
            activeOpacity={0.7}
        >
            <View style={styles.iconRow}>
                <Ionicons name="logo-instagram" size={20} color="#E4405F" />
                <Ionicons name="logo-youtube" size={20} color="#FF0000" />
                <Ionicons
                    name="logo-tiktok"
                    size={20}
                    color={scheme === "dark" ? "#FFFFFF" : "#000000"}
                />
            </View>

            <Text style={[styles.text, { color: theme.colors.text }]}>
                Import from social media
            </Text>

            <Ionicons name="chevron-forward" size={18} color={theme.colors.accent} />

            {onDismiss && (
                <TouchableOpacity
                    style={styles.dismissButton}
                    onPress={(e) => {
                        e.stopPropagation();
                        onDismiss();
                    }}
                    hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
                >
                    <Ionicons name="close-circle" size={16} color={theme.colors.subtext} />
                </TouchableOpacity>
            )}
        </TouchableOpacity>
    );
};

const styles = StyleSheet.create({
    container: {
        flexDirection: "row",
        alignItems: "center",
        paddingVertical: 10,
        paddingHorizontal: 12,
        borderRadius: radii.md,
        borderWidth: 1,
        gap: spacing.sm,
        marginBottom: spacing.sm,
        minHeight: 50,
    },
    iconRow: {
        flexDirection: "row",
        alignItems: "center",
        gap: 6,
    },
    text: {
        flex: 1,
        fontSize: 14,
        fontWeight: "600",
    },
    dismissButton: {
        padding: 4,
    },
});
