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
import { getTheme } from "@/src/theme";
import { Ionicons } from "@expo/vector-icons";
import { supabase } from "@/src/lib/supabase";
import { apiService } from "@/src/services/api";
import initApp from "@/src/services/startup";
import { setCurrentUserId } from "@/src/state/session";

export default function SignUpScreen() {
    const router = useRouter();
    const scheme = useColorScheme();
    const theme = getTheme(scheme === "dark" ? "dark" : "light");
    const insets = useSafeAreaInsets();

    const [name, setName] = useState("");
    const [email, setEmail] = useState("");
    const [password, setPassword] = useState("");
    const [confirmPassword, setConfirmPassword] = useState("");
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);

    const passwordMatches = password === confirmPassword;
    const isFormValid =
        name.trim().length > 0 &&
        email.trim().length > 0 &&
        password.trim().length >= 8 &&
        passwordMatches;

    const handleSignUp = async () => {
        if (!isFormValid) return;

        const nameValue = name.trim();
        const emailValue = email.trim();
        const passwordValue = password.trim();
        setError(null);
        setIsLoading(true);

        try {
            if (!passwordMatches) {
                setError("Passwords must match.");
                return;
            }

            console.log("[SignUp] Attempting Supabase sign-up for", emailValue);

            const { data, error: signUpError } = await supabase.auth.signUp({
                email: emailValue,
                password: passwordValue,
                options: {
                    data: {
                        full_name: nameValue,
                    },
                },
            });

            if (signUpError || !data?.user) {
                console.warn("[SignUp] Auth sign-up failed:", signUpError);
                setError(signUpError?.message || "Unable to sign up. Please try again.");
                return;
            }

            const userId = data.user.id;

            try {
                await apiService.createUserIfNeeded({
                    id: userId,
                    email: emailValue,
                    name: nameValue,
                });
            } catch (createErr) {
                console.error("[SignUp] Failed to create backend user profile:", createErr);
                setError(
                    "Your account was created, but we couldn't finish setting up your profile. Please try signing in.",
                );
                return;
            }

            await setCurrentUserId(userId);

            console.log("[SignUp] Auth + profile success, user id:", userId);

            await initApp();
            router.replace("/(tabs)");
        } catch (e) {
            console.error("[SignUp] Unexpected error during sign-up:", e);
            setError("Something went wrong while signing up. Please try again.");
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <KeyboardAvoidingView
            style={[styles.container, { backgroundColor: theme.colors.bg }]}
            behavior={Platform.OS === "ios" ? "padding" : "height"}
        >
            <ScrollView
                contentContainerStyle={styles.scrollContent}
                keyboardShouldPersistTaps="handled"
            >
                <View style={[styles.header, { paddingTop: insets.top + 20 }]}>
                    <Text style={[styles.title, { color: theme.colors.text }]}>Sign Up</Text>
                    <Text style={[styles.subtitle, { color: theme.colors.subtext }]}>
                        Create your account to start training.
                    </Text>
                </View>

                <View style={styles.form}>
                    <View style={styles.inputGroup}>
                        <Text style={[styles.label, { color: theme.colors.text }]}>Name *</Text>
                        <View
                            style={[
                                styles.inputContainer,
                                {
                                    backgroundColor: theme.colors.surface,
                                    borderColor: theme.colors.border,
                                },
                            ]}
                        >
                            <Ionicons
                                name="person-outline"
                                size={20}
                                color={theme.colors.subtext}
                                style={styles.inputIcon}
                            />
                            <TextInput
                                style={[styles.input, { color: theme.colors.text }]}
                                placeholder="Enter your name"
                                placeholderTextColor={theme.colors.subtext}
                                value={name}
                                onChangeText={setName}
                                autoCapitalize="words"
                                autoCorrect
                            />
                        </View>
                    </View>

                    <View style={styles.inputGroup}>
                        <Text style={[styles.label, { color: theme.colors.text }]}>Email *</Text>
                        <View
                            style={[
                                styles.inputContainer,
                                {
                                    backgroundColor: theme.colors.surface,
                                    borderColor: theme.colors.border,
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
                        <Text style={[styles.label, { color: theme.colors.text }]}>Password *</Text>
                        <View
                            style={[
                                styles.inputContainer,
                                {
                                    backgroundColor: theme.colors.surface,
                                    borderColor: theme.colors.border,
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
                                placeholder="Create a password"
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

                    <View style={styles.inputGroup}>
                        <Text style={[styles.label, { color: theme.colors.text }]}>Confirm Password *</Text>
                        <View
                            style={[
                                styles.inputContainer,
                                {
                                    backgroundColor: theme.colors.surface,
                                    borderColor: theme.colors.border,
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
                                placeholder="Confirm password"
                                placeholderTextColor={theme.colors.subtext}
                                value={confirmPassword}
                                onChangeText={setConfirmPassword}
                                secureTextEntry
                                autoCapitalize="none"
                                autoCorrect={false}
                            />
                        </View>
                        {confirmPassword.length > 0 && !passwordMatches && (
                            <Text style={[styles.helperText, { color: theme.colors.danger }]}>
                                Passwords must match
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
	                        style={[
	                            styles.primaryButton,
	                            {
	                                backgroundColor:
	                                    isFormValid && !isLoading
	                                        ? theme.colors.accent
	                                        : theme.colors.border,
	                            },
	                        ]}
                        onPress={handleSignUp}
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
	                                    },
	                                ]}
	                            >
                                Create Account
                            </Text>
                        )}
                    </TouchableOpacity>

                    <View style={styles.signInLink}>
                        <Text style={[styles.signUpText, { color: theme.colors.subtext }]}>
                            Already have an account?{" "}
                        </Text>
                        <TouchableOpacity onPress={() => router.push("/(auth)/sign-in")}>
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
    title: {
        fontSize: 32,
        fontWeight: "700",
        marginBottom: 8,
    },
    subtitle: {
        fontSize: 16,
        lineHeight: 22,
    },
    form: {
        flex: 1,
    },
    inputGroup: {
        marginBottom: 20,
    },
    label: {
        fontSize: 14,
        fontWeight: "600",
        marginBottom: 8,
    },
    inputContainer: {
        flexDirection: "row",
        alignItems: "center",
        borderWidth: 1,
        borderRadius: 12,
        paddingHorizontal: 12,
        paddingVertical: 10,
    },
    inputIcon: {
        marginRight: 8,
    },
    input: {
        flex: 1,
        fontSize: 16,
    },
    helperText: {
        fontSize: 12,
        marginTop: 4,
    },
    errorContainer: {
        flexDirection: "row",
        alignItems: "center",
        padding: 10,
        borderRadius: 10,
        marginBottom: 16,
    },
    errorText: {
        marginLeft: 8,
        fontSize: 13,
        flex: 1,
    },
    primaryButton: {
        marginTop: 8,
        paddingVertical: 14,
        borderRadius: 12,
        alignItems: "center",
        justifyContent: "center",
    },
    primaryButtonText: {
        fontSize: 16,
        fontWeight: "600",
    },
    signInLink: {
        flexDirection: "row",
        justifyContent: "center",
        alignItems: "center",
        marginTop: 24,
    },
    signUpText: {
        fontSize: 14,
    },
    linkText: {
        fontSize: 14,
        fontWeight: "600",
    },
});
