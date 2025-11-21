import React from "react";
import { View, Text, StyleSheet, useColorScheme } from "react-native";
import { useRouter } from "expo-router";
import { getTheme } from "@/src/theme";

export default function SignUpScreen() {
    const router = useRouter();
    const scheme = useColorScheme();
    const theme = getTheme(scheme === "dark" ? "dark" : "light");

    return (
        <View style={[styles.container, { backgroundColor: theme.colors.bg }]}>
            <Text style={[styles.text, { color: theme.colors.text }]}>Sign Up (Coming Soon)</Text>
        </View>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        justifyContent: "center",
        alignItems: "center",
    },
    text: {
        fontSize: 18,
    },
});

