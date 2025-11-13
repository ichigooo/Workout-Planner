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
} from "react-native";
import * as ImagePicker from "expo-image-picker";
import { imageAssetToDataUrl } from "../utils/image";
import { Workout, CreateWorkoutRequest, WorkoutCategory, WorkoutType } from "../types";
import {
    WORKOUT_CATEGORIES,
    WORKOUT_CATEGORY_DESCRIPTIONS,
    WORKOUT_TYPES,
} from "../constants/workoutCategories";

interface WorkoutFormProps {
    workout?: Workout;
    onSubmit: (workout: CreateWorkoutRequest) => void;
    onCancel: () => void;
}

export const WorkoutForm: React.FC<WorkoutFormProps> = ({ workout, onSubmit, onCancel }) => {
    const [title, setTitle] = useState(workout?.title || "");
    const [category, setCategory] = useState<WorkoutCategory | "">(workout?.category || "");
    // Auto-detect workout type based on category
    const getWorkoutType = (category: WorkoutCategory | ""): WorkoutType => {
        return category === "Cardio" ? WORKOUT_TYPES.CARDIO : WORKOUT_TYPES.STRENGTH;
    };

    const workoutType = useMemo<WorkoutType>(
        () => workout?.workoutType || getWorkoutType(category as WorkoutCategory),
        [workout?.workoutType, category],
    );
    const [description, setDescription] = useState(workout?.description || "");
    const [sets, setSets] = useState(workout?.sets?.toString() || "");
    const [reps, setReps] = useState(workout?.reps?.toString() || "");
    const [duration, setDuration] = useState(workout?.duration?.toString() || "");
    const [intensity, setIntensity] = useState(workout?.intensity || "");
    const [imageUrl, setImageUrl] = useState(workout?.imageUrl || "");
    const [imageUrl2, setImageUrl2] = useState(workout?.imageUrl2 || "");
    const [showCategoryModal, setShowCategoryModal] = useState(false);

    // workoutType is derived from category (and initial workout), no effect needed

    const handleSubmit = () => {
        if (!title || !category || !intensity) {
            Alert.alert("Error", "Please fill in all required fields");
            return;
        }

        // Validate based on workout type
        if (workoutType === WORKOUT_TYPES.STRENGTH) {
            if (!sets || !reps) {
                Alert.alert("Error", "Please fill in sets and reps for strength workouts");
                return;
            }
        } else if (workoutType === WORKOUT_TYPES.CARDIO) {
            if (!duration) {
                Alert.alert("Error", "Please fill in duration for cardio workouts");
                return;
            }
        }

        const workoutData: CreateWorkoutRequest = {
            title,
            category: category as WorkoutCategory,
            workoutType,
            description,
            sets: workoutType === WORKOUT_TYPES.STRENGTH ? parseInt(sets) : undefined,
            reps: workoutType === WORKOUT_TYPES.STRENGTH ? parseInt(reps) : undefined,
            duration: workoutType === WORKOUT_TYPES.CARDIO ? parseInt(duration) : undefined,
            intensity,
            imageUrl: imageUrl || undefined,
            imageUrl2: imageUrl2 || undefined,
            createdBy: workout?.createdBy || undefined, // Optional: who created this workout
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

                {/* Workout type is automatically determined by category */}
                <View style={styles.inputGroup}>
                    <Text style={styles.label}>Workout Type</Text>
                    <View style={styles.typeDisplay}>
                        <Text
                            style={[
                                styles.typeDisplayText,
                                {
                                    color:
                                        workoutType === WORKOUT_TYPES.CARDIO
                                            ? "#FF6B35"
                                            : "#007AFF",
                                },
                            ]}
                        >
                            {workoutType === WORKOUT_TYPES.CARDIO ? "Cardio" : "Strength"}
                            {category && ` (Auto-detected from ${category})`}
                        </Text>
                    </View>
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

                {workoutType === WORKOUT_TYPES.STRENGTH ? (
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
                ) : (
                    <View style={styles.inputGroup}>
                        <Text style={styles.label}>Duration (minutes) *</Text>
                        <TextInput
                            style={styles.input}
                            value={duration}
                            onChangeText={setDuration}
                            placeholder="30"
                            keyboardType="numeric"
                        />
                    </View>
                )}

                <View style={styles.inputGroup}>
                    <Text style={styles.label}>Intensity *</Text>
                    <TextInput
                        style={styles.input}
                        value={intensity}
                        onChangeText={setIntensity}
                        placeholder={
                            workoutType === WORKOUT_TYPES.STRENGTH
                                ? "e.g., 50kg, RPE 8, bodyweight"
                                : "e.g., 8:30/mile, 150 BPM, moderate"
                        }
                    />
                </View>

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
                                        height: 80,
                                        borderRadius: 8,
                                        marginBottom: 6,
                                    }}
                                />
                            ) : null}
                            <TouchableOpacity
                                style={[styles.smallBtn, { backgroundColor: "#007AFF" }]}
                                onPress={async () => {
                                    const res = await ImagePicker.launchImageLibraryAsync({
                                        mediaTypes: ImagePicker.MediaTypeOptions.Images,
                                        allowsEditing: true,
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
                                        height: 80,
                                        borderRadius: 8,
                                        marginBottom: 6,
                                    }}
                                />
                            ) : null}
                            <TouchableOpacity
                                style={[styles.smallBtn, { backgroundColor: "#007AFF" }]}
                                onPress={async () => {
                                    const res = await ImagePicker.launchImageLibraryAsync({
                                        mediaTypes: ImagePicker.MediaTypeOptions.Images,
                                        allowsEditing: true,
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
});
