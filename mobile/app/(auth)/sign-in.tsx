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
    Alert,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useRouter } from "expo-router";
import { getTheme, typography, radii } from "@/src/theme";
import { Ionicons } from "@expo/vector-icons";
import { supabase } from "@/src/lib/supabase";
import initApp from "@/src/services/startup";
import { setCurrentUserId } from "@/src/state/session";
import { apiService } from "@/src/services/api";

export default function SignInScreen() {
    const router = useRouter();
    const scheme = useColorScheme();
    const theme = getTheme(scheme === "dark" ? "dark" : "light");
    const insets = useSafeAreaInsets();

    const [email, setEmail] = useState("");
    const [password, setPassword] = useState("");
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);

    const isFormValid = email.trim().length > 0 && password.length >= 8;

    const handleSignIn = async () => {
        if (!isFormValid) return;

        const emailValue = email.trim();
        setError(null);
        setIsLoading(true);

        try {
            console.log("[SignIn] Attempting Supabase sign-in for", emailValue);

            const { data, error: authError } = await supabase.auth.signInWithPassword({
                email: emailValue,
                password,
            });
            console.log("[SignIn] Auth data:", data);

            if (authError || !data?.user) {
                console.warn("[SignIn] Auth failed:", authError);
                setError(authError?.message + "Invalid email or password. Please try again.");
                return;
            }

            const userId = data.user.id;
            const userEmail = data.user.email ?? emailValue;
            const userName =
                // Supabase standard metadata keys
                (data.user.user_metadata &&
                    (data.user.user_metadata.full_name || data.user.user_metadata.name)) ||
                null;

            // Ensure a corresponding profile exists in our backend users table
            try {
                await apiService.createUserIfNeeded({
                    id: userId,
                    email: userEmail,
                    name: userName,
                });
            } catch (createErr) {
                console.error("[SignIn] Failed to sync user profile to backend:", createErr);
                setError("Account created, but we couldn't set up your profile. Please try again.");
                return;
            }

            // Store the authenticated user ID for the rest of the app.
            await setCurrentUserId(userId);

            console.log("[SignIn] Auth success, user id:", userId);

            // Fully initialize the app (plan id, cache, etc.) then go to main content.
            await initApp();
            router.replace("/(tabs)");
        } catch (e) {
            console.error("[SignIn] Unexpected error during sign-in:", e);
            setError("Something went wrong while signing in. Please try again.");
        } finally {
            setIsLoading(false);
        }
    };

    const handleGoogleSignIn = () => {
        Alert.alert("Google auth not wired yet");
    };

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
                    <Text style={[styles.title, { color: theme.colors.text, fontFamily: typography.fonts.headlineSemibold }]}>Sign In</Text>
                    <Text style={[styles.subtitle, { color: theme.colors.subtext, fontFamily: typography.fonts.body }]}>
                        Welcome back! Please sign in to continue.
                    </Text>
                </View>

                <View style={styles.form}>
                    <View style={styles.inputGroup}>
                        <Text style={[styles.label, { color: theme.colors.text, fontFamily: typography.fonts.bodyMedium }]}>Email</Text>
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
                            />
                        </View>
                    </View>

                    <View style={styles.inputGroup}>
                        <Text style={[styles.label, { color: theme.colors.text, fontFamily: typography.fonts.bodyMedium }]}>Password</Text>
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
                                name="lock-closed-outline"
                                size={20}
                                color={theme.colors.subtext}
                                style={styles.inputIcon}
                            />
                            <TextInput
                                style={[styles.input, { color: theme.colors.text }]}
                                placeholder="Enter your password"
                                placeholderTextColor={theme.colors.subtext}
                                value={password}
                                onChangeText={setPassword}
                                secureTextEntry
                                autoCapitalize="none"
                                autoCorrect={false}
                            />
                        </View>
                        {password.length > 0 && password.length < 8 && (
                            <Text style={[styles.helperText, { color: theme.colors.danger }]}>
                                Password must be at least 8 characters
                            </Text>
                        )}
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
                        onPress={() => router.push("/(auth)/forgot-password")}
                        style={styles.forgotPasswordLink}
                    >
                        <Text style={[styles.linkText, { color: theme.colors.accent }]}>
                            Forgot Password?
                        </Text>
                    </TouchableOpacity>

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
                        onPress={handleSignIn}
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
                                Sign In
                            </Text>
                        )}
                    </TouchableOpacity>

                    <View style={styles.divider}>
                        <View
                            style={[styles.dividerLine, { backgroundColor: theme.colors.border }]}
                        />
                        <Text style={[styles.dividerText, { color: theme.colors.subtext }]}>
                            OR
                        </Text>
                        <View
                            style={[styles.dividerLine, { backgroundColor: theme.colors.border }]}
                        />
                    </View>

                    <TouchableOpacity
                        style={[
                            styles.secondaryButton,
                            {
                                backgroundColor: theme.colors.glassWhite,
                                borderColor: theme.colors.glassBorder,
                                borderRadius: radii.full,
                            },
                        ]}
                        onPress={handleGoogleSignIn}
                        activeOpacity={0.8}
                    >
                        <Ionicons name="logo-google" size={20} color={theme.colors.text} />
                        <Text style={[styles.secondaryButtonText, { color: theme.colors.text }]}>
                            Continue with Google
                        </Text>
                    </TouchableOpacity>

                    <View style={styles.signUpLink}>
                        <Text style={[styles.signUpText, { color: theme.colors.subtext }]}>
                            Don't have an account?{" "}
                        </Text>
                        <TouchableOpacity onPress={() => router.push("/(auth)/sign-up")}>
                            <Text style={[styles.linkText, { color: theme.colors.accent }]}>
                                Sign Up
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
    helperText: {
        fontSize: 12,
        marginTop: 4,
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
    forgotPasswordLink: {
        alignSelf: "flex-end",
        marginBottom: 24,
    },
    linkText: {
        fontSize: typography.sizes.sm,
        fontFamily: typography.fonts.bodySemibold,
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
    divider: {
        flexDirection: "row",
        alignItems: "center",
        marginVertical: 24,
    },
    dividerLine: {
        flex: 1,
        height: 1,
    },
    dividerText: {
        marginHorizontal: 16,
        fontSize: typography.sizes.sm,
        fontFamily: typography.fonts.bodyMedium,
    },
    secondaryButton: {
        flexDirection: "row",
        alignItems: "center",
        justifyContent: "center",
        height: 52,
        borderRadius: radii.full,
        borderWidth: 1,
        gap: 8,
        marginBottom: 24,
    },
    secondaryButtonText: {
        fontSize: typography.sizes.md,
        fontFamily: typography.fonts.bodySemibold,
    },
    signUpLink: {
        flexDirection: "row",
        justifyContent: "center",
        alignItems: "center",
    },
    signUpText: {
        fontSize: 14,
    },
});
