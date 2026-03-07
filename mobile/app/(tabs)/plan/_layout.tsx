import { Stack } from "expo-router";
import { palettes } from "@/src/theme";

export const unstable_settings = {
    initialRouteName: "index",
};

export default function PlanStack() {
    return (
        <Stack
            screenOptions={{
                headerShown: false,
                gestureEnabled: true,
                gestureDirection: "horizontal",
                animation: "slide_from_right",
                contentStyle: { backgroundColor: palettes.light.bg },
            }}
        >
            <Stack.Screen name="index" />
            <Stack.Screen name="[id]" />
        </Stack>
    );
}
