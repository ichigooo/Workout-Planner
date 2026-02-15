import FontAwesome from "@expo/vector-icons/FontAwesome";
import { DarkTheme, DefaultTheme, ThemeProvider } from "@react-navigation/native";
import { useFonts } from "expo-font";
import { Stack } from "expo-router";
import * as SplashScreen from "expo-splash-screen";
import { useEffect } from "react";
import "react-native-reanimated";
import { useColorScheme } from "react-native";
import { AuthProvider } from "@/src/state/AuthContext";
import {
    DMSans_400Regular,
    DMSans_500Medium,
    DMSans_600SemiBold,
    DMSans_700Bold,
} from "@expo-google-fonts/dm-sans";
import {
    Fraunces_400Regular,
    Fraunces_400Regular_Italic,
    Fraunces_500Medium,
    Fraunces_600SemiBold,
} from "@expo-google-fonts/fraunces";
import { palettes } from "@/src/theme";

// Custom theme with soft cream background
const CustomDefaultTheme = {
    ...DefaultTheme,
    colors: {
        ...DefaultTheme.colors,
        background: palettes.light.bg, // #F5F5F0 soft cream
        card: palettes.light.surface, // #FAFAF8 soft off-white
        border: palettes.light.border, // #E8E8E8
    },
};

export {
    // Catch any errors thrown by the Layout component.
    ErrorBoundary,
} from "expo-router";

export const unstable_settings = {
    // Start at landing screen (index.tsx), user will navigate to tabs after pressing "Begin Workout"
    initialRouteName: "index",
};

// Prevent the splash screen from auto-hiding before asset loading is complete.
SplashScreen.preventAutoHideAsync();

export default function RootLayout() {
    const [loaded, error] = useFonts({
        SpaceMono: require("../assets/fonts/SpaceMono-Regular.ttf"),
        DMSans_400Regular,
        DMSans_500Medium,
        DMSans_600SemiBold,
        DMSans_700Bold,
        Fraunces_400Regular,
        Fraunces_400Regular_Italic,
        Fraunces_500Medium,
        Fraunces_600SemiBold,
        ...FontAwesome.font,
    });

    // Expo Router uses Error Boundaries to catch errors in the navigation tree.
    useEffect(() => {
        if (error) throw error;
    }, [error]);

    useEffect(() => {
        if (loaded) {
            SplashScreen.hideAsync();
        }
    }, [loaded]);

    if (!loaded) {
        return null;
    }

    return (
        <AuthProvider>
            <RootLayoutNav />
        </AuthProvider>
    );
}

function RootLayoutNav() {
    const colorScheme = useColorScheme();

    return (
        <ThemeProvider value={colorScheme === "dark" ? DarkTheme : CustomDefaultTheme}>
            <Stack
                screenOptions={{
                    gestureEnabled: true,
                    gestureDirection: "horizontal",
                    animation: "slide_from_right",
                    contentStyle: { backgroundColor: palettes.light.bg },
                }}
            >
                <Stack.Screen
                    name="index"
                    options={{ headerShown: false, gestureEnabled: false }}
                />
                <Stack.Screen
                    name="(tabs)"
                    options={{ headerShown: false, gestureEnabled: false }}
                />
                <Stack.Screen
                    name="(auth)"
                    options={{ headerShown: false, gestureEnabled: true }}
                />
                <Stack.Screen
                    name="workout"
                    options={{ headerShown: false, gestureEnabled: true }}
                />
                <Stack.Screen
                    name="workout-detail"
                    options={{ headerShown: false, gestureEnabled: true }}
                />
                <Stack.Screen
                    name="profile"
                    options={{ headerShown: false, gestureEnabled: true }}
                />
                <Stack.Screen
                    name="import-workout"
                    options={{ headerShown: false, gestureEnabled: true }}
                />
                <Stack.Screen
                    name="import-workout/custom"
                    options={{ headerShown: false, gestureEnabled: true }}
                />
                <Stack.Screen
                    name="plan/[id]"
                    options={{ headerShown: false, gestureEnabled: true }}
                />

                <Stack.Screen
                    name="workout-session"
                    options={{
                        headerShown: false,
                        gestureEnabled: false,
                        animation: "slide_from_bottom",
                    }}
                />
                <Stack.Screen
                    name="workout-summary"
                    options={{
                        headerShown: false,
                        gestureEnabled: false,
                        animation: "fade",
                    }}
                />

                <Stack.Screen
                    name="modal"
                    options={{ presentation: "modal", gestureEnabled: true }}
                />
            </Stack>
        </ThemeProvider>
    );
}
