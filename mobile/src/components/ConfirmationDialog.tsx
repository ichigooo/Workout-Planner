import React from "react";
import {
    Modal,
    Pressable,
    View,
    Text,
    TouchableOpacity,
    StyleSheet,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import {
    spacing,
    radii,
    typography,
    getTheme,
    hexToRgba,
} from "../theme";

interface ConfirmationDialogProps {
    visible: boolean;
    onDismiss: () => void;
    onConfirm: () => void;
    title: string;
    body: string;
    confirmLabel?: string;
    cancelLabel?: string;
    variant?: "danger" | "default";
    icon?: keyof typeof Ionicons.glyphMap;
}

export default function ConfirmationDialog({
    visible,
    onDismiss,
    onConfirm,
    title,
    body,
    confirmLabel = "Confirm",
    cancelLabel = "Cancel",
    variant = "default",
    icon,
}: ConfirmationDialogProps) {
    const theme = getTheme("light");
    const isDanger = variant === "danger";
    const accentColor = isDanger ? theme.colors.danger : theme.colors.accent;

    return (
        <Modal
            visible={visible}
            animationType="fade"
            transparent
            onRequestClose={onDismiss}
        >
            <Pressable
                style={[styles.overlay, { backgroundColor: theme.colors.overlay }]}
                onPress={onDismiss}
            >
                <Pressable
                    style={[
                        styles.card,
                        {
                            backgroundColor: theme.colors.surfaceElevated,
                            shadowColor: theme.colors.text,
                        },
                    ]}
                    onPress={(e) => e.stopPropagation()}
                >
                    {icon && (
                        <View
                            style={[
                                styles.iconContainer,
                                { backgroundColor: hexToRgba(accentColor, 0.12) },
                            ]}
                        >
                            <Ionicons
                                name={icon}
                                size={32}
                                color={accentColor}
                            />
                        </View>
                    )}

                    <Text style={[styles.title, { color: theme.colors.text }]}>
                        {title}
                    </Text>

                    <Text style={[styles.body, { color: theme.colors.textTertiary }]}>
                        {body}
                    </Text>

                    <View style={styles.buttonRow}>
                        <TouchableOpacity
                            style={[
                                styles.cancelButton,
                                {
                                    borderColor: theme.colors.border,
                                    backgroundColor: theme.colors.surface,
                                },
                            ]}
                            onPress={onDismiss}
                            activeOpacity={0.7}
                        >
                            <Text style={[styles.buttonText, { color: theme.colors.text }]}>
                                {cancelLabel}
                            </Text>
                        </TouchableOpacity>

                        <TouchableOpacity
                            style={[
                                styles.confirmButton,
                                { backgroundColor: accentColor },
                            ]}
                            onPress={onConfirm}
                            activeOpacity={0.7}
                        >
                            <Text style={[styles.buttonText, { color: "#FFFFFF" }]}>
                                {confirmLabel}
                            </Text>
                        </TouchableOpacity>
                    </View>
                </Pressable>
            </Pressable>
        </Modal>
    );
}

const styles = StyleSheet.create({
    overlay: {
        flex: 1,
        justifyContent: "center",
        alignItems: "center",
        paddingHorizontal: spacing.lg,
    },
    card: {
        borderRadius: radii.xl,
        paddingTop: spacing.lg,
        paddingBottom: spacing.md,
        paddingHorizontal: spacing.md,
        width: "100%",
        maxWidth: 320,
        alignItems: "center",
        shadowOffset: { width: 0, height: 8 },
        shadowOpacity: 0.25,
        shadowRadius: 24,
        elevation: 10,
    },
    iconContainer: {
        width: 56,
        height: 56,
        borderRadius: 28,
        justifyContent: "center",
        alignItems: "center",
        marginBottom: spacing.sm,
    },
    title: {
        fontFamily: typography.fonts.headlineSemibold,
        fontSize: typography.sizes.lg,
        marginBottom: spacing.xs,
        textAlign: "center",
    },
    body: {
        fontFamily: typography.fonts.body,
        fontSize: typography.sizes.sm,
        textAlign: "center",
        marginBottom: spacing.md,
        lineHeight: 20,
    },
    buttonRow: {
        flexDirection: "row",
        gap: spacing.sm,
        width: "100%",
    },
    cancelButton: {
        flex: 1,
        borderRadius: radii.sm,
        borderWidth: 1.5,
        paddingVertical: spacing.sm,
        alignItems: "center",
        justifyContent: "center",
        minHeight: 48,
    },
    confirmButton: {
        flex: 1,
        borderRadius: radii.sm,
        paddingVertical: spacing.sm,
        alignItems: "center",
        justifyContent: "center",
        minHeight: 48,
    },
    buttonText: {
        fontFamily: typography.fonts.bodyMedium,
        fontSize: typography.sizes.md,
    },
});
