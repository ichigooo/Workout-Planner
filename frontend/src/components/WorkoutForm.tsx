import React, { useState } from "react";
import {
    View,
    Text,
    TextInput,
    StyleSheet,
    TouchableOpacity,
    ScrollView,
    Alert,
} from "react-native";
import { Workout, CreateWorkoutRequest } from "../types";

interface WorkoutFormProps {
    workout?: Workout;
    onSubmit: (workout: CreateWorkoutRequest) => void;
    onCancel: () => void;
}

export const WorkoutForm: React.FC<WorkoutFormProps> = ({ workout, onSubmit, onCancel }) => {
    const [title, setTitle] = useState(workout?.title || "");
    const [category, setCategory] = useState(workout?.category || "");
    const [description, setDescription] = useState(workout?.description || "");
    const [sets, setSets] = useState(workout?.sets?.toString() || "");
    const [reps, setReps] = useState(workout?.reps?.toString() || "");
    const [intensity, setIntensity] = useState(workout?.intensity || "");
    const [imageUrl, setImageUrl] = useState(workout?.imageUrl || "");

    const handleSubmit = () => {
        if (!title || !category || !sets || !reps || !intensity) {
            Alert.alert("Error", "Please fill in all required fields");
            return;
        }

        const workoutData: CreateWorkoutRequest = {
            title,
            category,
            description,
            sets: parseInt(sets),
            reps: parseInt(reps),
            intensity,
            imageUrl: imageUrl || undefined,
            userId: workout?.userId || "temp-user-id", // TODO: Get from auth context
        };

        onSubmit(workoutData);
    };

    return (
        <ScrollView style={styles.container}>
            <Text style={styles.title}>{workout ? "Edit Workout" : "Create New Workout"}</Text>

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
                <TextInput
                    style={styles.input}
                    value={category}
                    onChangeText={setCategory}
                    placeholder="e.g., legs, core, upper body"
                />
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

            <View style={styles.inputGroup}>
                <Text style={styles.label}>Intensity *</Text>
                <TextInput
                    style={styles.input}
                    value={intensity}
                    onChangeText={setIntensity}
                    placeholder="e.g., 50kg, RPE 8, bodyweight"
                />
            </View>

            <View style={styles.inputGroup}>
                <Text style={styles.label}>Image URL</Text>
                <TextInput
                    style={styles.input}
                    value={imageUrl}
                    onChangeText={setImageUrl}
                    placeholder="https://example.com/image.jpg"
                />
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
    );
};

const styles = StyleSheet.create({
    container: {
        flex: 1,
        padding: 16,
        backgroundColor: "#f5f5f5",
    },
    title: {
        fontSize: 24,
        fontWeight: "bold",
        marginBottom: 24,
        textAlign: "center",
        color: "#333",
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
});
