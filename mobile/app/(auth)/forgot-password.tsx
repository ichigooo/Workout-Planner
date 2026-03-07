import React, { useState } from "react";
import {
    View,
    Text,
    StyleSheet,
    TextInput,
    TouchableOpacity,
    useColorScheme,
    KeyboardAvoidingView,
    Platform,
    ScrollView,
    ActivityIndicator,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useRouter } from "expo-router";
import { getTheme, typography, radii } from "@/src/theme";
import { Ionicons } from "@expo/vector-icons";
import { supabase } from "@/src/lib/supabase";

export default function ForgotPasswordScreen() {
    const router = useRouter();
    const scheme = useColorScheme();
    const theme = getTheme(scheme === "dark" ? "dark" : "light");
    const insets = useSafeAreaInsets();

    const [email, setEmail] = useState("");
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [isEmailSent, setIsEmailSent] = useState(false);

    const isFormValid = email.trim().length > 0;

    const handleResetPassword = async () => {
        if (!isFormValid) return;

        const emailValue = email.trim();
        setError(null);
        setIsLoading(true);

        try {
            console.log("[ForgotPassword] Requesting password reset for", emailValue);

            const { error: resetError } = await supabase.auth.resetPasswordForEmail(emailValue);

            if (resetError) {
                console.warn("[ForgotPassword] Reset failed:", resetError);
                setError(resetError.message || "Failed to send reset email. Please try again.");
                return;
            }

            console.log("[ForgotPassword] Reset email sent successfully");
            setIsEmailSent(true);
        } catch (e) {
            console.error("[ForgotPassword] Unexpected error:", e);
            setError("Something went wrong. Please try again.");
        } finally {
            setIsLoading(false);
        }
    };

    if (isEmailSent) {
        return (
            <View style={[styles.container, { backgroundColor: "transparent" }]}>
                <View style={[styles.successContent, { paddingTop: insets.top + 60 }]}>
                    <View
                        style={[
                            styles.iconCircle,
                            { backgroundColor: theme.colors.surface },
                        ]}
                    >
                        <Ionicons name="mail-outline" size={48} color={theme.colors.accent} />
                    </View>
                    <Text
                        style={[
                            styles.successTitle,
                            { color: theme.colors.text, fontFamily: typography.fonts.headlineSemibold },
                        ]}
                    >
                        Check Your Email
                    </Text>
                    <Text
                        style={[
                            styles.successSubtitle,
                            { color: theme.colors.subtext, fontFamily: typography.fonts.body },
                        ]}
                    >
                        We've sent a password reset link to{"\n"}
                        <Text style={{ fontWeight: "600", color: theme.colors.text }}>
                            {email.trim()}
                        </Text>
                    </Text>
                    <Text
                        style={[
                            styles.successHint,
                            { color: theme.colors.subtext, fontFamily: typography.fonts.body },
                        ]}
                    >
                        Click the link in the email to reset your password. If you don't see it,
                        check your spam folder.
                    </Text>

                    <TouchableOpacity
                        style={[
                            styles.primaryButton,
                            { backgroundColor: theme.colors.accent, borderRadius: radii.full },
                        ]}
                        onPress={() => router.back()}
                        activeOpacity={0.8}
                    >
                        <Text
                            style={[
                                styles.primaryButtonText,
                                { color: "#FFFFFF", fontFamily: typography.fonts.bodySemibold },
                            ]}
                        >
                            Back to Sign In
                        </Text>
                    </TouchableOpacity>

                    <TouchableOpacity
                        onPress={() => {
                            setIsEmailSent(false);
                            setError(null);
                        }}
                        style={styles.resendLink}
                    >
                        <Text style={[styles.linkText, { color: theme.colors.accent }]}>
                            Didn't receive it? Send again
                        </Text>
                    </TouchableOpacity>
                </View>
            </View>
        );
    }

    return (
        <KeyboardAvoidingView
            style={[styles.container, { backgroundColor: "transparent" }]}
            behavior={Platform.OS === "ios" ? "padding" : "height"}
        >
            <ScrollView
                contentContainerStyle={styles.scrollContent}
                keyboardShouldPersistTaps="handled"
            >
                <View style={[styles.header, { paddingTop: insets.top + 20 }]}>
                    <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
                        <Ionicons name="arrow-back" size={24} color={theme.colors.text} />
                    </TouchableOpacity>
                    <Text
                        style={[
                            styles.title,
                            { color: theme.colors.text, fontFamily: typography.fonts.headlineSemibold },
                        ]}
                    >
                        Reset Password
                    </Text>
                    <Text
                        style={[
                            styles.subtitle,
                            { color: theme.colors.subtext, fontFamily: typography.fonts.body },
                        ]}
                    >
                        Enter your email address and we'll send you a link to reset your password.
                    </Text>
                </View>

                <View style={styles.form}>
                    <View style={styles.inputGroup}>
                        <Text
                            style={[
                                styles.label,
                                { color: theme.colors.text, fontFamily: typography.fonts.bodyMedium },
                            ]}
                        >
                            Email
                        </Text>
                        <View
                            style={[
                                styles.inputContainer,
                                {
                                    backgroundColor: theme.colors.glassWhite,
                                    borderColor: theme.colors.glassBorder,
                                },
                            ]}
                        >
                            <Ionicons
                                name="mail-outline"
                                size={20}
                                color={theme.colors.subtext}
                                style={styles.inputIcon}
                            />
                            <TextInput
                                style={[styles.input, { color: theme.colors.text }]}
                                placeholder="Enter your email"
                                placeholderTextColor={theme.colors.subtext}
                                value={email}
                                onChangeText={setEmail}
                                keyboardType="email-address"
                                autoCapitalize="none"
                                autoCorrect={false}
                                autoFocus
                            />
                        </View>
                    </View>

                    {error && (
                        <View
                            style={[
                                styles.errorContainer,
                                { backgroundColor: theme.colors.surface },
                            ]}
                        >
                            <Ionicons
                                name="alert-circle-outline"
                                size={20}
                                color={theme.colors.danger}
                            />
                            <Text style={[styles.errorText, { color: theme.colors.danger }]}>
                                {error}
                            </Text>
                        </View>
                    )}

                    <TouchableOpacity
                        style={[
                            styles.primaryButton,
                            {
                                backgroundColor:
                                    isFormValid && !isLoading
                                        ? theme.colors.accent
                                        : theme.colors.border,
                                borderRadius: radii.full,
                            },
                        ]}
                        onPress={handleResetPassword}
                        disabled={!isFormValid || isLoading}
                        activeOpacity={0.8}
                    >
                        {isLoading ? (
                            <ActivityIndicator color="#FFFFFF" />
                        ) : (
                            <Text
                                style={[
                                    styles.primaryButtonText,
                                    {
                                        color:
                                            isFormValid && !isLoading
                                                ? "#FFFFFF"
                                                : theme.colors.subtext,
                                        fontFamily: typography.fonts.bodySemibold,
                                    },
                                ]}
                            >
                                Send Reset Link
                            </Text>
                        )}
                    </TouchableOpacity>

                    <View style={styles.signInLink}>
                        <Text style={[styles.signInText, { color: theme.colors.subtext }]}>
                            Remember your password?{" "}
                        </Text>
                        <TouchableOpacity onPress={() => router.back()}>
                            <Text style={[styles.linkText, { color: theme.colors.accent }]}>
                                Sign In
                            </Text>
                        </TouchableOpacity>
                    </View>
                </View>
            </ScrollView>
        </KeyboardAvoidingView>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
    },
    scrollContent: {
        flexGrow: 1,
        paddingHorizontal: 24,
        paddingBottom: 40,
    },
    header: {
        marginBottom: 32,
        paddingBottom: 20,
    },
    backButton: {
        marginBottom: 16,
        width: 40,
        height: 40,
        justifyContent: "center",
    },
    title: {
        fontSize: typography.sizes.xl,
        marginBottom: 8,
    },
    subtitle: {
        fontSize: typography.sizes.md,
        lineHeight: 22,
    },
    form: {
        flex: 1,
    },
    inputGroup: {
        marginBottom: 20,
    },
    label: {
        fontSize: typography.sizes.sm,
        marginBottom: 8,
    },
    inputContainer: {
        flexDirection: "row",
        alignItems: "center",
        borderWidth: 1,
        borderRadius: radii.md,
        paddingHorizontal: 16,
        height: 52,
    },
    inputIcon: {
        marginRight: 12,
    },
    input: {
        flex: 1,
        fontSize: typography.sizes.md,
        fontFamily: typography.fonts.body,
    },
    errorContainer: {
        flexDirection: "row",
        alignItems: "center",
        padding: 12,
        borderRadius: 8,
        marginBottom: 16,
        gap: 8,
    },
    errorText: {
        fontSize: 14,
        flex: 1,
    },
    primaryButton: {
        height: 52,
        borderRadius: radii.full,
        alignItems: "center",
        justifyContent: "center",
        marginBottom: 20,
    },
    primaryButtonText: {
        fontSize: typography.sizes.md,
    },
    linkText: {
        fontSize: typography.sizes.sm,
        fontFamily: typography.fonts.bodySemibold,
    },
    signInLink: {
        flexDirection: "row",
        justifyContent: "center",
        alignItems: "center",
    },
    signInText: {
        fontSize: 14,
    },
    successContent: {
        flex: 1,
        paddingHorizontal: 24,
        alignItems: "center",
    },
    iconCircle: {
        width: 96,
        height: 96,
        borderRadius: 48,
        justifyContent: "center",
        alignItems: "center",
        marginBottom: 24,
    },
    successTitle: {
        fontSize: 28,
        marginBottom: 12,
        textAlign: "center",
    },
    successSubtitle: {
        fontSize: typography.sizes.md,
        lineHeight: 24,
        textAlign: "center",
        marginBottom: 8,
    },
    successHint: {
        fontSize: typography.sizes.sm,
        lineHeight: 20,
        textAlign: "center",
        marginBottom: 32,
    },
    resendLink: {
        marginTop: 16,
    },
});
