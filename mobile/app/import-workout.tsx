import React, { useState, useEffect } from "react";
import {
    View,
    Text,
    StyleSheet,
    TouchableOpacity,
    useColorScheme,
    ImageBackground,
    TextInput,
    ActivityIndicator,
    ScrollView,
    Image,
    Alert,
} from "react-native";
import { useRouter } from "expo-router";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { getTheme } from "@/src/theme";
import { Ionicons } from "@expo/vector-icons";
import { apiService } from "@/src/services/api";
import {
    getCurrentUserId,
    loadStoredUserId,
    setCurrentUserId as persistCurrentUserId,
} from "@/src/state/session";
import { WorkoutImport } from "@/src/types";

type ImportSource = "instagram" | "youtube" | "tiktok";
type ImportSourceState = {
    url: string;
    result: WorkoutImport | null;
    error: string | null;
    loading: boolean;
};

export default function ImportWorkoutScreen() {
    const router = useRouter();
    const insets = useSafeAreaInsets();
    const scheme = useColorScheme();
    const theme = getTheme(scheme === "dark" ? "dark" : "light");
    const [selectedSource, setSelectedSource] = useState<ImportSource>("instagram");
    const [importStates, setImportStates] = useState<Record<ImportSource, ImportSourceState>>({
        instagram: { url: "", result: null, error: null, loading: false },
        youtube: { url: "", result: null, error: null, loading: false },
        tiktok: { url: "", result: null, error: null, loading: false },
    });
    const [currentUserId, setCurrentUserIdState] = useState<string | null>(() => getCurrentUserId());

    useEffect(() => {
        if (currentUserId) return;
        loadStoredUserId().then((storedId) => {
            if (storedId) {
                persistCurrentUserId(storedId);
                setCurrentUserIdState(storedId);
            }
        });
    }, [currentUserId]);

    const updateImportState = (source: ImportSource, next: Partial<ImportSourceState>) => {
        setImportStates((prev) => ({
            ...prev,
            [source]: {
                ...prev[source],
                ...next,
            },
        }));
    };

    const handleImport = async (source: ImportSource) => {
        if (source === "tiktok") return;
        const state = importStates[source];
        const trimmed = state.url.trim();
        if (!trimmed) {
            updateImportState(source, { error: "Please paste a valid link." });
            return;
        }
        const userId = currentUserId;
        if (!userId) {
            Alert.alert("Please sign in again", "We need your account to save the import.");
            return;
        }

        updateImportState(source, { error: null, loading: true });
        try {
            let result: WorkoutImport;
            if (source === "instagram") {
                result = await apiService.importWorkoutFromInstagram({ userId, url: trimmed });
            } else {
                result = await apiService.importWorkoutFromYouTube({ userId, url: trimmed });
            }
            updateImportState(source, { result, loading: false });
        } catch (err: any) {
            console.error(`[ImportWorkout] ${source} import failed`, err);
            const message =
                err?.message ||
                "We couldn’t fetch that link. Please verify the URL and try again.";
            updateImportState(source, { error: message, loading: false });
        }
    };

    const importOptions: { key: ImportSource; label: string; icon: any }[] = [
        { key: "instagram", label: "Instagram", icon: "logo-instagram" },
        { key: "youtube", label: "YouTube Shorts", icon: "logo-youtube" },
        { key: "tiktok", label: "TikTok", icon: "logo-tiktok" },
    ];
    const selectedOption = importOptions.find((option) => option.key === selectedSource);
    const selectedState = importStates[selectedSource];
    const supportsDirectImport = selectedSource === "instagram" || selectedSource === "youtube";
    const placeholderBySource: Record<ImportSource, string> = {
        instagram: "https://www.instagram.com/reel/...",
        youtube: "https://www.youtube.com/watch?v=...",
        tiktok: "https://www.tiktok.com/@user/video/...",
    };

    return (
        <ImageBackground
            source={require("../assets/images/bg6.png")}
            style={styles.screenBackground}
            imageStyle={styles.screenBackgroundImage}
        >
            <View
                style={[
                    styles.container,
                    { paddingTop: insets.top, backgroundColor: "transparent" },
                ]}
            >
                <View style={[styles.header, { borderBottomColor: theme.colors.border }]}>
                    <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
                        <Text style={[styles.backText, { color: theme.colors.accent }]}>
                            ‹ Back
                        </Text>
                    </TouchableOpacity>
                    <Text style={[styles.title, { color: theme.colors.text }]}>Import Workout</Text>
                    <View style={{ width: 60 }} />
                </View>
                <ScrollView
                    contentContainerStyle={[
                        styles.content,
                        { paddingBottom: insets.bottom + 40, backgroundColor: "transparent" },
                    ]}
                >
                    <Text style={[styles.placeholder, { color: theme.colors.text }]}>
                        Choose where you found the workout:
                    </Text>
                    <View style={styles.options}>
                        {importOptions.map((option) => {
                            const isActive = selectedSource === option.key;
                            return (
                                <TouchableOpacity
                                    key={option.key}
                                    style={[
                                        styles.optionButton,
                                        {
                                            borderColor: theme.colors.border,
                                            backgroundColor: isActive
                                                ? theme.colors.accent
                                                : theme.colors.surface,
                                        },
                                    ]}
                                    onPress={() => setSelectedSource(option.key)}
                                >
                                    <Ionicons
                                        name={option.icon}
                                        size={20}
                                        color={isActive ? "#fff" : theme.colors.text}
                                        style={{ marginRight: 12 }}
                                    />
                                    <Text
                                        style={[
                                            styles.optionLabel,
                                            { color: isActive ? "#fff" : theme.colors.text },
                                        ]}
                                    >
                                        {option.label}
                                    </Text>
                                </TouchableOpacity>
                            );
                        })}
                    </View>

                    {supportsDirectImport ? (
                        <View style={styles.importForm}>
                            <Text style={[styles.formLabel, { color: theme.colors.text }]}>
                                Paste your {selectedOption?.label} link
                            </Text>
                            <TextInput
                                style={[
                                    styles.input,
                                    {
                                        borderColor: theme.colors.border,
                                        backgroundColor: theme.colors.surface,
                                        color: theme.colors.text,
                                    },
                                ]}
                                placeholder={placeholderBySource[selectedSource]}
                                placeholderTextColor={theme.colors.subtext}
                                value={selectedState.url}
                                onChangeText={(text) => updateImportState(selectedSource, { url: text })}
                                autoCapitalize="none"
                                autoCorrect={false}
                            />
                            {selectedState.error && (
                                <Text style={[styles.errorText, { color: theme.colors.danger }]}>
                                    {selectedState.error}
                                </Text>
                            )}
                            <TouchableOpacity
                                style={[
                                    styles.primaryButton,
                                    {
                                        backgroundColor: theme.colors.accent,
                                        opacity: selectedState.loading ? 0.7 : 1,
                                    },
                                ]}
                                onPress={() => handleImport(selectedSource)}
                                disabled={selectedState.loading}
                            >
                                {selectedState.loading ? (
                                    <ActivityIndicator color="#fff" />
                                ) : (
                                    <Text style={styles.primaryButtonText}>Import workout</Text>
                                )}
                            </TouchableOpacity>

                            {selectedState.result && (
                                <View
                                    style={[
                                        styles.previewCard,
                                        {
                                            borderColor: theme.colors.border,
                                            backgroundColor: theme.colors.surface,
                                        },
                                    ]}
                                >
                                    {selectedState.result.thumbnailUrl ? (
                                        <Image
                                            source={{ uri: selectedState.result.thumbnailUrl }}
                                            style={styles.previewImage}
                                        />
                                    ) : null}
                                    <View style={{ flex: 1 }}>
                                        <Text
                                            style={[
                                                styles.previewTitle,
                                                { color: theme.colors.text },
                                            ]}
                                            numberOfLines={2}
                                        >
                                            {selectedState.result.title || "Imported workout"}
                                        </Text>
                                        <Text
                                            style={[
                                                styles.previewDescription,
                                                { color: theme.colors.subtext },
                                            ]}
                                            numberOfLines={3}
                                        >
                                            {selectedState.result.description ||
                                                selectedState.result.metadata?.description ||
                                                selectedState.result.sourceUrl}
                                        </Text>
                                        <Text
                                            style={[
                                                styles.previewUrl,
                                                { color: theme.colors.accent },
                                            ]}
                                            numberOfLines={1}
                                        >
                                            {selectedState.result.sourceUrl}
                                        </Text>
                                    </View>
                                </View>
                            )}
                        </View>
                    ) : (
                        <Text style={[styles.comingSoon, { color: theme.colors.subtext }]}>
                            {selectedOption?.label ?? selectedSource} imports are coming soon.
                        </Text>
                    )}
                </ScrollView>
            </View>
        </ImageBackground>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
    },
    screenBackground: {
        flex: 1,
    },
    screenBackgroundImage: {
        resizeMode: "cover",
    },
    header: {
        flexDirection: "row",
        alignItems: "center",
        justifyContent: "space-between",
        paddingHorizontal: 16,
        paddingVertical: 12,
        borderBottomWidth: 1,
    },
    backButton: {
        width: 60,
    },
    backText: {
        fontSize: 16,
        fontWeight: "600",
    },
    title: {
        fontSize: 18,
        fontWeight: "700",
    },
    content: {
        flexGrow: 1,
        paddingHorizontal: 24,
        paddingTop: 32,
    },
    placeholder: {
        fontSize: 16,
        textAlign: "center",
        marginBottom: 16,
    },
    options: {
        gap: 12,
    },
    optionButton: {
        flexDirection: "row",
        alignItems: "center",
        borderWidth: 1,
        borderRadius: 16,
        paddingVertical: 14,
        paddingHorizontal: 16,
    },
    optionLabel: {
        fontSize: 16,
        fontWeight: "600",
    },
    importForm: {
        marginTop: 24,
        gap: 12,
    },
    formLabel: {
        fontSize: 14,
        fontWeight: "600",
    },
    input: {
        borderWidth: 1,
        borderRadius: 12,
        paddingHorizontal: 14,
        paddingVertical: 12,
        fontSize: 16,
    },
    primaryButton: {
        borderRadius: 16,
        paddingVertical: 14,
        alignItems: "center",
        justifyContent: "center",
    },
    primaryButtonText: {
        color: "#fff",
        fontSize: 16,
        fontWeight: "700",
    },
    errorText: {
        fontSize: 14,
    },
    previewCard: {
        marginTop: 24,
        flexDirection: "row",
        borderWidth: 1,
        borderRadius: 16,
        padding: 12,
        gap: 12,
    },
    previewImage: {
        width: 96,
        height: 96,
        borderRadius: 12,
        backgroundColor: "#00000015",
    },
    previewTitle: {
        fontSize: 16,
        fontWeight: "700",
    },
    previewDescription: {
        fontSize: 14,
        marginTop: 4,
    },
    previewUrl: {
        marginTop: 8,
        fontSize: 12,
    },
    comingSoon: {
        marginTop: 32,
        textAlign: "center",
        fontSize: 16,
    },
});
