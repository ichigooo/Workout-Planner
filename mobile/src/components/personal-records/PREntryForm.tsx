import React, { useState, useEffect } from "react";
import {
    View,
    Text,
    StyleSheet,
    TouchableOpacity,
    TextInput,
    Modal,
    useColorScheme,
    Alert,
    KeyboardAvoidingView,
    Platform,
    ScrollView,
} from "react-native";
import { getTheme } from "../../theme";
import { apiService } from "../../services/api";

// Standard rep options for quick selection
const QUICK_REPS = [1, 3, 5, 6, 8, 10, 12];

interface PREntryFormProps {
    visible: boolean;
    workoutId: string;
    userId: string;
    initialReps?: number | null; // null means user can choose, number means pre-selected
    existingReps?: number[]; // Rep counts that already have records (for highlighting)
    onClose: () => void;
    onSave: (isNewRecord: boolean, reps: number) => void;
}

export const PREntryForm: React.FC<PREntryFormProps> = ({
    visible,
    workoutId,
    userId,
    initialReps = null,
    existingReps = [],
    onClose,
    onSave,
}) => {
    const scheme = useColorScheme();
    const theme = getTheme(scheme === "dark" ? "dark" : "light");

    const [selectedReps, setSelectedReps] = useState<number | null>(initialReps);
    const [customRepsInput, setCustomRepsInput] = useState("");
    const [weight, setWeight] = useState("");
    const [saving, setSaving] = useState(false);
    const [showCustomInput, setShowCustomInput] = useState(false);

    // Reset form when opened
    useEffect(() => {
        if (visible) {
            setSelectedReps(initialReps);
            setCustomRepsInput("");
            setWeight("");
            setShowCustomInput(false);
        }
    }, [visible, initialReps]);

    const formatRepLabel = (r: number): string => {
        if (r === 1) return "1 rep";
        return `${r} reps`;
    };

    const handleSelectReps = (reps: number) => {
        setSelectedReps(reps);
        setShowCustomInput(false);
        setCustomRepsInput("");
    };

    const handleCustomRepsChange = (value: string) => {
        setCustomRepsInput(value);
        const parsed = parseInt(value, 10);
        if (!isNaN(parsed) && parsed >= 1 && parsed <= 20) {
            setSelectedReps(parsed);
        } else {
            setSelectedReps(null);
        }
    };

    const handleSave = async () => {
        if (selectedReps === null) {
            Alert.alert("Select Reps", "Please select or enter a rep count");
            return;
        }

        const weightNum = parseFloat(weight);
        if (isNaN(weightNum) || weightNum <= 0) {
            Alert.alert("Invalid Weight", "Please enter a positive number");
            return;
        }

        try {
            setSaving(true);
            const response = await apiService.createPREntry(workoutId, {
                userId,
                reps: selectedReps,
                weight: weightNum,
            });

            setWeight("");
            setSelectedReps(null);
            onSave(response.isNewRecord, selectedReps);
        } catch (error) {
            console.error("Error saving PR:", error);
            Alert.alert("Error", "Failed to save personal record");
        } finally {
            setSaving(false);
        }
    };

    const handleClose = () => {
        setWeight("");
        setSelectedReps(null);
        setCustomRepsInput("");
        setShowCustomInput(false);
        onClose();
    };

    const isRepSelected = (reps: number) => selectedReps === reps;
    const hasExistingRecord = (reps: number) => existingReps.includes(reps);

    return (
        <Modal
            visible={visible}
            animationType="slide"
            transparent
            onRequestClose={handleClose}
        >
            <KeyboardAvoidingView
                style={styles.modalOverlay}
                behavior={Platform.OS === "ios" ? "padding" : "height"}
            >
                <View
                    style={[
                        styles.modalContent,
                        {
                            backgroundColor: theme.colors.bg,
                            borderColor: theme.colors.border,
                        },
                    ]}
                >
                    <View style={styles.header}>
                        <Text style={[styles.title, { color: theme.colors.text }]}>
                            Log Personal Record
                        </Text>
                        <TouchableOpacity onPress={handleClose}>
                            <Text style={[styles.closeButton, { color: theme.colors.subtext }]}>
                                Cancel
                            </Text>
                        </TouchableOpacity>
                    </View>

                    {/* Rep Selection */}
                    {initialReps === null && (
                        <>
                            <Text style={[styles.label, { color: theme.colors.subtext }]}>
                                How many reps?
                            </Text>
                            <ScrollView
                                horizontal
                                showsHorizontalScrollIndicator={false}
                                style={styles.repsScrollView}
                                contentContainerStyle={styles.repsContainer}
                            >
                                {QUICK_REPS.map((reps) => (
                                    <TouchableOpacity
                                        key={reps}
                                        style={[
                                            styles.repButton,
                                            {
                                                backgroundColor: isRepSelected(reps)
                                                    ? theme.colors.accent
                                                    : theme.colors.surface,
                                                borderColor: hasExistingRecord(reps)
                                                    ? theme.colors.accent
                                                    : theme.colors.border,
                                            },
                                        ]}
                                        onPress={() => handleSelectReps(reps)}
                                    >
                                        <Text
                                            style={[
                                                styles.repButtonText,
                                                {
                                                    color: isRepSelected(reps)
                                                        ? "#FFFFFF"
                                                        : theme.colors.text,
                                                },
                                            ]}
                                        >
                                            {reps}
                                        </Text>
                                        {hasExistingRecord(reps) && !isRepSelected(reps) && (
                                            <View style={[styles.existingDot, { backgroundColor: theme.colors.accent }]} />
                                        )}
                                    </TouchableOpacity>
                                ))}
                                <TouchableOpacity
                                    style={[
                                        styles.repButton,
                                        styles.customRepButton,
                                        {
                                            backgroundColor: showCustomInput
                                                ? theme.colors.accent
                                                : theme.colors.surface,
                                            borderColor: theme.colors.border,
                                        },
                                    ]}
                                    onPress={() => {
                                        setShowCustomInput(true);
                                        setSelectedReps(null);
                                    }}
                                >
                                    <Text
                                        style={[
                                            styles.repButtonText,
                                            {
                                                color: showCustomInput
                                                    ? "#FFFFFF"
                                                    : theme.colors.text,
                                            },
                                        ]}
                                    >
                                        Other
                                    </Text>
                                </TouchableOpacity>
                            </ScrollView>

                            {showCustomInput && (
                                <View style={styles.customInputRow}>
                                    <TextInput
                                        style={[
                                            styles.customRepsInput,
                                            {
                                                backgroundColor: theme.colors.surface,
                                                borderColor: theme.colors.border,
                                                color: theme.colors.text,
                                            },
                                        ]}
                                        placeholder="Enter reps (1-20)"
                                        placeholderTextColor={theme.colors.subtext}
                                        value={customRepsInput}
                                        onChangeText={handleCustomRepsChange}
                                        keyboardType="number-pad"
                                        maxLength={2}
                                        autoFocus
                                    />
                                    <Text style={[styles.repsLabel, { color: theme.colors.subtext }]}>
                                        reps
                                    </Text>
                                </View>
                            )}
                        </>
                    )}

                    {/* Show selected reps if pre-selected */}
                    {initialReps !== null && (
                        <View style={styles.preSelectedReps}>
                            <Text style={[styles.preSelectedLabel, { color: theme.colors.subtext }]}>
                                Recording for
                            </Text>
                            <Text style={[styles.preSelectedValue, { color: theme.colors.text }]}>
                                {formatRepLabel(initialReps)}
                            </Text>
                        </View>
                    )}

                    {/* Weight Input */}
                    <Text style={[styles.label, { color: theme.colors.subtext, marginTop: 20 }]}>
                        Weight (lbs)
                    </Text>
                    <TextInput
                        style={[
                            styles.input,
                            {
                                backgroundColor: theme.colors.surface,
                                borderColor: theme.colors.border,
                                color: theme.colors.text,
                            },
                        ]}
                        placeholder="Enter weight"
                        placeholderTextColor={theme.colors.subtext}
                        value={weight}
                        onChangeText={setWeight}
                        keyboardType="decimal-pad"
                        autoFocus={initialReps !== null}
                    />

                    {/* Summary */}
                    {selectedReps !== null && weight && (
                        <View style={[styles.summary, { backgroundColor: theme.colors.surface }]}>
                            <Text style={[styles.summaryText, { color: theme.colors.text }]}>
                                {weight} lbs × {selectedReps} {selectedReps === 1 ? "rep" : "reps"}
                            </Text>
                        </View>
                    )}

                    <TouchableOpacity
                        style={[
                            styles.saveButton,
                            { backgroundColor: theme.colors.accent },
                            (saving || !weight || selectedReps === null) && styles.saveButtonDisabled,
                        ]}
                        onPress={handleSave}
                        disabled={saving || !weight || selectedReps === null}
                    >
                        <Text style={styles.saveButtonText}>
                            {saving ? "Saving..." : "Save Record"}
                        </Text>
                    </TouchableOpacity>
                </View>
            </KeyboardAvoidingView>
        </Modal>
    );
};

const styles = StyleSheet.create({
    modalOverlay: {
        flex: 1,
        justifyContent: "flex-end",
        backgroundColor: "rgba(0, 0, 0, 0.5)",
    },
    modalContent: {
        borderTopLeftRadius: 20,
        borderTopRightRadius: 20,
        borderWidth: StyleSheet.hairlineWidth,
        padding: 24,
        paddingBottom: 40,
    },
    header: {
        flexDirection: "row",
        justifyContent: "space-between",
        alignItems: "center",
        marginBottom: 24,
    },
    title: {
        fontSize: 20,
        fontWeight: "700",
        fontFamily: "Fraunces_700Bold",
    },
    closeButton: {
        fontSize: 16,
        fontWeight: "500",
    },
    label: {
        fontSize: 14,
        fontWeight: "500",
        marginBottom: 12,
    },
    repsScrollView: {
        marginBottom: 8,
    },
    repsContainer: {
        gap: 10,
        paddingRight: 20,
    },
    repButton: {
        width: 52,
        height: 52,
        borderRadius: 26,
        alignItems: "center",
        justifyContent: "center",
        borderWidth: 2,
        position: "relative",
    },
    customRepButton: {
        width: 70,
        borderRadius: 26,
    },
    repButtonText: {
        fontSize: 16,
        fontWeight: "600",
    },
    existingDot: {
        position: "absolute",
        bottom: 4,
        width: 6,
        height: 6,
        borderRadius: 3,
    },
    customInputRow: {
        flexDirection: "row",
        alignItems: "center",
        marginTop: 8,
        gap: 10,
    },
    customRepsInput: {
        flex: 1,
        borderWidth: StyleSheet.hairlineWidth,
        borderRadius: 12,
        paddingHorizontal: 16,
        paddingVertical: 12,
        fontSize: 18,
    },
    repsLabel: {
        fontSize: 16,
        fontWeight: "500",
    },
    preSelectedReps: {
        marginBottom: 8,
    },
    preSelectedLabel: {
        fontSize: 14,
        marginBottom: 4,
    },
    preSelectedValue: {
        fontSize: 20,
        fontWeight: "700",
        fontFamily: "Fraunces_700Bold",
    },
    input: {
        borderWidth: StyleSheet.hairlineWidth,
        borderRadius: 12,
        paddingHorizontal: 16,
        paddingVertical: 14,
        fontSize: 18,
    },
    summary: {
        marginTop: 16,
        padding: 12,
        borderRadius: 10,
        alignItems: "center",
    },
    summaryText: {
        fontSize: 16,
        fontWeight: "600",
    },
    saveButton: {
        marginTop: 20,
        paddingVertical: 16,
        borderRadius: 12,
        alignItems: "center",
    },
    saveButtonDisabled: {
        opacity: 0.5,
    },
    saveButtonText: {
        color: "#FFFFFF",
        fontSize: 16,
        fontWeight: "600",
    },
});
