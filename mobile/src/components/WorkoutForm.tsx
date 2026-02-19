import React, { useMemo, useState } from "react";
import {
    View,
    Text,
    TextInput,
    StyleSheet,
    TouchableOpacity,
    ScrollView,
    Alert,
    KeyboardAvoidingView,
    Platform,
    Modal,
    FlatList,
    Image,
    Switch,
} from "react-native";
import * as ImagePicker from "expo-image-picker";
import { imageAssetToDataUrl } from "../utils/image";
import {
    Workout,
    CreateWorkoutRequest,
    WorkoutCategory,
    InputType,
    getDefaultPreset,
} from "../types";
import {
    WORKOUT_CATEGORIES,
    WORKOUT_CATEGORY_DESCRIPTIONS,
} from "../constants/workoutCategories";
import { PresetSelector } from "./PresetSelector";

const IMAGE_CROP_ASPECT: [number, number] = [5, 7];
const IMAGE_ASPECT_RATIO = IMAGE_CROP_ASPECT[0] / IMAGE_CROP_ASPECT[1];

interface WorkoutFormProps {
    workout?: Workout;
    onSubmit: (workout: CreateWorkoutRequest) => void;
    onCancel: () => void;
}

export const WorkoutForm: React.FC<WorkoutFormProps> = ({ workout, onSubmit, onCancel }) => {
    // Initialize from existing workout preset if editing
    const existingPreset = workout ? getDefaultPreset(workout) : undefined;

    const [title, setTitle] = useState(workout?.title || "");
    const [category, setCategory] = useState<WorkoutCategory | "">(workout?.category || "");
    const [description, setDescription] = useState(workout?.description || "");
    const [sets, setSets] = useState(existingPreset?.sets?.toString() || "");
    const [reps, setReps] = useState(existingPreset?.reps?.toString() || "");
    const [intensity, setIntensity] = useState(existingPreset?.intensityLabel || "");
    const [imageUrl, setImageUrl] = useState(workout?.imageUrl || "");
    const [imageUrl2, setImageUrl2] = useState(workout?.imageUrl2 || "");
    const [trackRecords, setTrackRecords] = useState(workout?.trackRecords || false);
    const [showCategoryModal, setShowCategoryModal] = useState(false);

    // Input type state (replaces intensityModel)
    const [inputType, setInputType] = useState<InputType>(
        existingPreset?.inputType || "sets_reps"
    );
    const [defaultPreset, setDefaultPreset] = useState(
        existingPreset?.preset || "hypertrophy"
    );
    const [durationPerSet, setDurationPerSet] = useState(
        existingPreset?.durationPerSet?.toString() || ""
    );

    const handleSubmit = () => {
        if (!title || !category) {
            Alert.alert("Error", "Please fill in all required fields");
            return;
        }

        // Validate based on input type
        if (inputType === "sets_reps") {
            if (!sets || !reps) {
                Alert.alert("Error", "Please fill in sets and reps");
                return;
            }
        } else if (inputType === "sets_time") {
            if (!sets || !durationPerSet) {
                Alert.alert("Error", "Please fill in sets and seconds per set");
                return;
            }
        }
        // percentage_1rm doesn't need additional validation - preset is always set

        // Build presets array based on input type
        const presets: CreateWorkoutRequest["presets"] = [];

        if (inputType === "percentage_1rm") {
            // Create 3 presets for percentage_1rm
            presets.push(
                { preset: "high", sets: 3, reps: 1, intensityPct: 95, intensityLabel: "High Intensity", isDefault: defaultPreset === "high", inputType: "percentage_1rm" },
                { preset: "medium", sets: 3, reps: 5, intensityPct: 85, intensityLabel: "Medium Intensity", isDefault: defaultPreset === "medium", inputType: "percentage_1rm" },
                { preset: "hypertrophy", sets: 3, reps: 8, intensityPct: 80, intensityLabel: "Hypertrophy", isDefault: defaultPreset === "hypertrophy", inputType: "percentage_1rm" },
            );
        } else if (inputType === "sets_time") {
            presets.push({
                preset: "default",
                sets: parseInt(sets),
                durationPerSet: parseInt(durationPerSet),
                intensityLabel: intensity || undefined,
                isDefault: true,
                inputType: "sets_time",
            });
        } else {
            presets.push({
                preset: "default",
                sets: parseInt(sets),
                reps: parseInt(reps),
                intensityLabel: intensity || undefined,
                isDefault: true,
                inputType: "sets_reps",
            });
        }

        const workoutData: CreateWorkoutRequest = {
            title,
            category: category as WorkoutCategory,
            description,
            presets,
            imageUrl: imageUrl || undefined,
            imageUrl2: imageUrl2 || undefined,
            createdBy: workout?.createdBy || undefined,
            trackRecords,
        };

        onSubmit(workoutData);
    };

    return (
        <KeyboardAvoidingView
            style={styles.container}
            behavior={Platform.OS === "ios" ? "padding" : "height"}
            keyboardVerticalOffset={Platform.OS === "ios" ? 0 : 20}
        >
            <ScrollView
                style={styles.scrollView}
                contentContainerStyle={styles.scrollContent}
                keyboardShouldPersistTaps="handled"
                showsVerticalScrollIndicator={false}
            >
                <Text style={styles.title}>{workout ? "Edit Workout" : "Create New Workout"}</Text>
                <Text style={styles.subtitle}>
                    This workout will be added to the global library for all users
                </Text>

                <View style={styles.inputGroup}>
                    <Text style={styles.label}>Title *</Text>
                    <TextInput
                        style={styles.input}
                        value={title}
                        onChangeText={setTitle}
                        placeholder="Enter workout title"
                    />
                </View>

                <View style={styles.inputGroup}>
                    <Text style={styles.label}>Category *</Text>
                    <TouchableOpacity
                        style={styles.categoryButton}
                        onPress={() => setShowCategoryModal(true)}
                    >
                        <Text
                            style={[styles.categoryButtonText, !category && styles.placeholderText]}
                        >
                            {category || "Select a category"}
                        </Text>
                        <Text style={styles.dropdownArrow}>▼</Text>
                    </TouchableOpacity>
                </View>

                <View style={styles.inputGroup}>
                    <Text style={styles.label}>Description</Text>
                    <TextInput
                        style={styles.input}
                        value={description}
                        onChangeText={setDescription}
                        placeholder="Enter workout description"
                        multiline
                        numberOfLines={3}
                    />
                </View>

                {/* Input Type Selector */}
                <View style={styles.inputGroup}>
                    <Text style={styles.label}>Intensity Model</Text>
                    <View style={styles.intensityModelSelector}>
                        <TouchableOpacity
                            style={[
                                styles.modelOption,
                                inputType === "percentage_1rm" &&
                                    styles.modelOptionActive,
                            ]}
                            onPress={() => setInputType("percentage_1rm")}
                        >
                            <Text
                                style={[
                                    styles.modelOptionText,
                                    inputType === "percentage_1rm" &&
                                        styles.modelOptionTextActive,
                                ]}
                            >
                                % 1RM
                            </Text>
                        </TouchableOpacity>
                        <TouchableOpacity
                            style={[
                                styles.modelOption,
                                inputType === "sets_reps" && styles.modelOptionActive,
                            ]}
                            onPress={() => setInputType("sets_reps")}
                        >
                            <Text
                                style={[
                                    styles.modelOptionText,
                                    inputType === "sets_reps" &&
                                        styles.modelOptionTextActive,
                                ]}
                            >
                                Sets × Reps
                            </Text>
                        </TouchableOpacity>
                        <TouchableOpacity
                            style={[
                                styles.modelOption,
                                inputType === "sets_time" && styles.modelOptionActive,
                            ]}
                            onPress={() => setInputType("sets_time")}
                        >
                            <Text
                                style={[
                                    styles.modelOptionText,
                                    inputType === "sets_time" &&
                                        styles.modelOptionTextActive,
                                ]}
                            >
                                Sets × Time
                            </Text>
                        </TouchableOpacity>
                    </View>
                </View>

                {/* percentage_1rm: Show preset selector */}
                {inputType === "percentage_1rm" && (
                    <View style={styles.inputGroup}>
                        <Text style={styles.label}>Default Preset</Text>
                        <PresetSelector
                            presets={[
                                { id: "form-high", preset: "high", sets: 3, reps: 1, intensityPct: 95, intensityLabel: "High Intensity", isDefault: defaultPreset === "high", inputType: "percentage_1rm" },
                                { id: "form-medium", preset: "medium", sets: 3, reps: 5, intensityPct: 85, intensityLabel: "Medium Intensity", isDefault: defaultPreset === "medium", inputType: "percentage_1rm" },
                                { id: "form-hypertrophy", preset: "hypertrophy", sets: 3, reps: 8, intensityPct: 80, intensityLabel: "Hypertrophy", isDefault: defaultPreset === "hypertrophy", inputType: "percentage_1rm" },
                            ]}
                            selected={defaultPreset}
                            onSelect={setDefaultPreset}
                        />
                        <Text style={styles.hintText}>
                            Users can toggle between presets when viewing this workout
                        </Text>
                    </View>
                )}

                {/* sets_reps: Show standard sets + reps inputs */}
                {inputType === "sets_reps" && (
                    <View style={styles.row}>
                        <View style={[styles.inputGroup, styles.halfWidth]}>
                            <Text style={styles.label}>Sets *</Text>
                            <TextInput
                                style={styles.input}
                                value={sets}
                                onChangeText={setSets}
                                placeholder="3"
                                keyboardType="numeric"
                            />
                        </View>

                        <View style={[styles.inputGroup, styles.halfWidth]}>
                            <Text style={styles.label}>Reps *</Text>
                            <TextInput
                                style={styles.input}
                                value={reps}
                                onChangeText={setReps}
                                placeholder="10"
                                keyboardType="numeric"
                            />
                        </View>
                    </View>
                )}

                {/* sets_time: Show sets + duration per set */}
                {inputType === "sets_time" && (
                    <View style={styles.row}>
                        <View style={[styles.inputGroup, styles.halfWidth]}>
                            <Text style={styles.label}>Sets *</Text>
                            <TextInput
                                style={styles.input}
                                value={sets}
                                onChangeText={setSets}
                                placeholder="3"
                                keyboardType="numeric"
                            />
                        </View>

                        <View style={[styles.inputGroup, styles.halfWidth]}>
                            <Text style={styles.label}>Seconds per Set *</Text>
                            <TextInput
                                style={styles.input}
                                value={durationPerSet}
                                onChangeText={setDurationPerSet}
                                placeholder="40"
                                keyboardType="numeric"
                            />
                        </View>
                    </View>
                )}

                {/* Intensity label for non-percentage models */}
                {inputType !== "percentage_1rm" && (
                    <View style={styles.inputGroup}>
                        <Text style={styles.label}>Intensity Label</Text>
                        <TextInput
                            style={styles.input}
                            value={intensity}
                            onChangeText={setIntensity}
                            placeholder="e.g., 50kg, RPE 8, bodyweight"
                        />
                    </View>
                )}

                <View style={styles.inputGroup}>
                    <Text style={styles.label}>Images</Text>
                    <View style={{ flexDirection: "row", gap: 8 }}>
                        <View style={{ flex: 1 }}>
                            <Text style={{ fontSize: 12, color: "#666", marginBottom: 4 }}>
                                Primary
                            </Text>
                            {imageUrl ? (
                                <Image
                                    source={{ uri: imageUrl }}
                                    style={{
                                        width: "100%",
                                        aspectRatio: IMAGE_ASPECT_RATIO,
                                        borderRadius: 8,
                                        marginBottom: 6,
                                    }}
                                />
                            ) : null}
                            {imageUrl ? (
                                <TouchableOpacity
                                    style={[styles.smallBtn, styles.outlineBtn]}
                                    onPress={() => setImageUrl("")}
                                >
                                    <Text style={{ color: "#333", fontWeight: "600" }}>Delete</Text>
                                </TouchableOpacity>
                            ) : null}
                            <TouchableOpacity
                                style={[styles.smallBtn, { backgroundColor: "#007AFF" }]}
                                onPress={async () => {
                                    const res = await ImagePicker.launchImageLibraryAsync({
                                        mediaTypes: ImagePicker.MediaTypeOptions.Images,
                                        allowsEditing: true,
                                        aspect: IMAGE_CROP_ASPECT,
                                        quality: 0.8,
                                        base64: true,
                                    });
                                    if (!res.canceled && res.assets[0]) {
                                        try {
                                            const { dataUrl } = await imageAssetToDataUrl(
                                                res.assets[0] as any,
                                                {
                                                    maxWidth: 1024,
                                                    compress: 0.8,
                                                    format: "jpeg",
                                                },
                                            );
                                            setImageUrl(dataUrl);
                                        } catch (e) {
                                            Alert.alert(
                                                "Unsupported",
                                                "Could not process image. Please try another.",
                                            );
                                        }
                                    }
                                }}
                            >
                                <Text style={{ color: "#fff", fontWeight: "600" }}>
                                    {imageUrl ? "Replace" : "Upload"}
                                </Text>
                            </TouchableOpacity>
                        </View>
                        <View style={{ flex: 1 }}>
                            <Text style={{ fontSize: 12, color: "#666", marginBottom: 4 }}>
                                Secondary
                            </Text>
                            {imageUrl2 ? (
                                <Image
                                    source={{ uri: imageUrl2 }}
                                    style={{
                                        width: "100%",
                                        aspectRatio: IMAGE_ASPECT_RATIO,
                                        borderRadius: 8,
                                        marginBottom: 6,
                                    }}
                                />
                            ) : null}
                            {imageUrl2 ? (
                                <TouchableOpacity
                                    style={[styles.smallBtn, styles.outlineBtn]}
                                    onPress={() => setImageUrl2("")}
                                >
                                    <Text style={{ color: "#333", fontWeight: "600" }}>Delete</Text>
                                </TouchableOpacity>
                            ) : null}
                            <TouchableOpacity
                                style={[styles.smallBtn, { backgroundColor: "#007AFF" }]}
                                onPress={async () => {
                                    const res = await ImagePicker.launchImageLibraryAsync({
                                        mediaTypes: ImagePicker.MediaTypeOptions.Images,
                                        allowsEditing: true,
                                        aspect: IMAGE_CROP_ASPECT,
                                        quality: 0.8,
                                        base64: true,
                                    });
                                    if (!res.canceled && res.assets[0]) {
                                        try {
                                            const { dataUrl } = await imageAssetToDataUrl(
                                                res.assets[0] as any,
                                                {
                                                    maxWidth: 1024,
                                                    compress: 0.8,
                                                    format: "jpeg",
                                                },
                                            );
                                            setImageUrl2(dataUrl);
                                        } catch (e) {
                                            Alert.alert(
                                                "Unsupported",
                                                "Could not process image. Please try another.",
                                            );
                                        }
                                    }
                                }}
                            >
                                <Text style={{ color: "#fff", fontWeight: "600" }}>
                                    {imageUrl2 ? "Replace" : "Upload"}
                                </Text>
                            </TouchableOpacity>
                        </View>
                    </View>
                </View>

                <View style={styles.inputGroup}>
                    <View style={styles.toggleRow}>
                        <View style={styles.toggleLabelContainer}>
                            <Text style={styles.label}>Track Personal Records</Text>
                            <Text style={styles.toggleDescription}>
                                Enable PR tracking to log and compare your best performances
                            </Text>
                        </View>
                        <Switch
                            value={trackRecords}
                            onValueChange={setTrackRecords}
                            trackColor={{ false: "#ddd", true: "#007AFF" }}
                            thumbColor="#fff"
                        />
                    </View>
                </View>

                <View style={styles.buttonContainer}>
                    <TouchableOpacity style={styles.cancelButton} onPress={onCancel}>
                        <Text style={styles.cancelButtonText}>Cancel</Text>
                    </TouchableOpacity>
                    <TouchableOpacity style={styles.submitButton} onPress={handleSubmit}>
                        <Text style={styles.submitButtonText}>{workout ? "Update" : "Create"}</Text>
                    </TouchableOpacity>
                </View>
            </ScrollView>

            {/* Category Selection Modal */}
            <Modal visible={showCategoryModal} animationType="slide" presentationStyle="pageSheet">
                <View style={styles.modalContainer}>
                    <View style={styles.modalHeader}>
                        <Text style={styles.modalTitle}>Select Category</Text>
                        <TouchableOpacity onPress={() => setShowCategoryModal(false)}>
                            <Text style={styles.modalCloseButton}>Done</Text>
                        </TouchableOpacity>
                    </View>
                    <FlatList
                        data={WORKOUT_CATEGORIES}
                        keyExtractor={(item) => item}
                        renderItem={({ item }) => (
                            <TouchableOpacity
                                style={styles.categoryItem}
                                onPress={() => {
                                    setCategory(item);
                                    setShowCategoryModal(false);
                                }}
                            >
                                <Text style={styles.categoryItemText}>{item}</Text>
                                <Text style={styles.categoryItemDescription}>
                                    {WORKOUT_CATEGORY_DESCRIPTIONS[item]}
                                </Text>
                            </TouchableOpacity>
                        )}
                    />
                </View>
            </Modal>
        </KeyboardAvoidingView>
    );
};

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: "#f5f5f5",
    },
    smallBtn: {
        paddingVertical: 8,
        paddingHorizontal: 10,
        borderRadius: 8,
        alignItems: "center",
    },
    outlineBtn: {
        borderWidth: 1,
        borderColor: "#ddd",
        backgroundColor: "#fff",
        marginBottom: 6,
    },
    scrollView: {
        flex: 1,
    },
    scrollContent: {
        padding: 16,
        paddingBottom: 40,
    },
    title: {
        fontSize: 24,
        fontWeight: "bold",
        marginBottom: 8,
        textAlign: "center",
        color: "#333",
    },
    subtitle: {
        fontSize: 14,
        marginBottom: 24,
        textAlign: "center",
        color: "#666",
        fontStyle: "italic",
    },
    inputGroup: {
        marginBottom: 16,
    },
    label: {
        fontSize: 16,
        fontWeight: "500",
        marginBottom: 8,
        color: "#333",
    },
    input: {
        backgroundColor: "white",
        borderWidth: 1,
        borderColor: "#ddd",
        borderRadius: 8,
        padding: 12,
        fontSize: 16,
    },
    row: {
        flexDirection: "row",
        justifyContent: "space-between",
    },
    halfWidth: {
        width: "48%",
    },
    buttonContainer: {
        flexDirection: "row",
        justifyContent: "space-between",
        marginTop: 24,
    },
    submitButton: {
        backgroundColor: "#007AFF",
        paddingVertical: 12,
        paddingHorizontal: 24,
        borderRadius: 8,
        flex: 1,
        marginLeft: 12,
    },
    cancelButton: {
        backgroundColor: "#8E8E93",
        paddingVertical: 12,
        paddingHorizontal: 24,
        borderRadius: 8,
        flex: 1,
        marginRight: 12,
    },
    submitButtonText: {
        color: "white",
        fontSize: 16,
        fontWeight: "600",
        textAlign: "center",
    },
    cancelButtonText: {
        color: "white",
        fontSize: 16,
        fontWeight: "600",
        textAlign: "center",
    },
    categoryButton: {
        backgroundColor: "white",
        borderWidth: 1,
        borderColor: "#ddd",
        borderRadius: 8,
        padding: 12,
        flexDirection: "row",
        justifyContent: "space-between",
        alignItems: "center",
    },
    categoryButtonText: {
        fontSize: 16,
        color: "#333",
    },
    placeholderText: {
        color: "#999",
    },
    dropdownArrow: {
        fontSize: 12,
        color: "#666",
    },
    typeDisplay: {
        backgroundColor: "#f8f9fa",
        borderWidth: 1,
        borderColor: "#e9ecef",
        borderRadius: 8,
        padding: 12,
    },
    typeDisplayText: {
        fontSize: 16,
        fontWeight: "500",
        textAlign: "center",
    },
    typeContainer: {
        flexDirection: "row",
        backgroundColor: "white",
        borderRadius: 8,
        borderWidth: 1,
        borderColor: "#ddd",
        overflow: "hidden",
    },
    typeButton: {
        flex: 1,
        paddingVertical: 12,
        alignItems: "center",
    },
    typeButtonActive: {
        backgroundColor: "#007AFF",
    },
    typeButtonText: {
        fontSize: 16,
        color: "#666",
        fontWeight: "500",
    },
    typeButtonTextActive: {
        color: "white",
        fontWeight: "600",
    },
    modalContainer: {
        flex: 1,
        backgroundColor: "#f5f5f5",
    },
    modalHeader: {
        flexDirection: "row",
        justifyContent: "space-between",
        alignItems: "center",
        padding: 16,
        backgroundColor: "white",
        borderBottomWidth: 1,
        borderBottomColor: "#ddd",
    },
    modalTitle: {
        fontSize: 18,
        fontWeight: "600",
        color: "#333",
    },
    modalCloseButton: {
        fontSize: 16,
        color: "#007AFF",
        fontWeight: "600",
    },
    categoryItem: {
        backgroundColor: "white",
        padding: 16,
        borderBottomWidth: 1,
        borderBottomColor: "#f0f0f0",
    },
    categoryItemText: {
        fontSize: 16,
        fontWeight: "500",
        color: "#333",
        marginBottom: 4,
    },
    categoryItemDescription: {
        fontSize: 14,
        color: "#666",
        lineHeight: 20,
    },
    toggleRow: {
        flexDirection: "row",
        justifyContent: "space-between",
        alignItems: "center",
    },
    toggleLabelContainer: {
        flex: 1,
        marginRight: 12,
    },
    toggleDescription: {
        fontSize: 13,
        color: "#666",
        marginTop: 4,
    },
    intensityModelSelector: {
        flexDirection: "row",
        gap: 8,
    },
    modelOption: {
        flex: 1,
        backgroundColor: "#fff",
        borderWidth: 1,
        borderColor: "#ddd",
        borderRadius: 8,
        paddingVertical: 12,
        paddingHorizontal: 8,
        alignItems: "center",
    },
    modelOptionActive: {
        backgroundColor: "#2C2925",
        borderColor: "#2C2925",
    },
    modelOptionText: {
        fontSize: 13,
        fontWeight: "600",
        color: "#333",
    },
    modelOptionTextActive: {
        color: "#FAF7F2",
    },
    hintText: {
        fontSize: 12,
        color: "#9C948A",
        marginTop: 8,
        fontStyle: "italic",
    },
});
