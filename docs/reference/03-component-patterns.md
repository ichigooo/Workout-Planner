# Component Patterns

> How to build React Native components following Trainichi conventions.

---

## Component Structure

### Basic Component Template

```typescript
// File: mobile/src/components/MyComponent.tsx
import React from "react";
import {
    View,
    Text,
    StyleSheet,
    TouchableOpacity,
    useColorScheme,
} from "react-native";
import { getTheme, spacing, radii, typography } from "../theme";

interface MyComponentProps {
    title: string;
    onPress?: () => void;
    disabled?: boolean;
}

export const MyComponent: React.FC<MyComponentProps> = ({
    title,
    onPress,
    disabled = false,
}) => {
    const scheme = useColorScheme();
    const theme = getTheme(scheme === "dark" ? "dark" : "light");

    return (
        <TouchableOpacity
            style={[
                styles.container,
                { backgroundColor: theme.colors.surface },
                disabled && styles.disabled,
            ]}
            onPress={onPress}
            disabled={disabled}
            activeOpacity={0.8}
        >
            <Text style={[styles.title, { color: theme.colors.text }]}>
                {title}
            </Text>
        </TouchableOpacity>
    );
};

const styles = StyleSheet.create({
    container: {
        padding: spacing.md,
        borderRadius: radii.lg,
    },
    title: {
        fontFamily: typography.fonts.bodyMedium,
        fontSize: typography.sizes.md,
    },
    disabled: {
        opacity: 0.5,
    },
});
```

---

## Naming Conventions

| Type | Convention | Example |
|------|------------|---------|
| Component file | PascalCase | `WorkoutCard.tsx` |
| Component name | PascalCase | `export const WorkoutCard` |
| Props interface | `{Name}Props` | `WorkoutCardProps` |
| Styles | `styles.{name}` | `styles.container` |
| Event handlers | `handle{Event}` or `on{Event}` | `handlePress`, `onClose` |

---

## Common Patterns

### 1. Card Component

```typescript
// File: mobile/src/components/WorkoutCard.tsx
import React from "react";
import {
    View,
    Text,
    StyleSheet,
    TouchableOpacity,
    Image,
    useColorScheme,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { getTheme, spacing, radii, typography } from "../theme";
import { Workout } from "../types";

interface WorkoutCardProps {
    workout: Workout;
    onPress: () => void;
    onEdit?: () => void;
}

export const WorkoutCard: React.FC<WorkoutCardProps> = ({
    workout,
    onPress,
    onEdit,
}) => {
    const scheme = useColorScheme();
    const theme = getTheme(scheme === "dark" ? "dark" : "light");

    return (
        <TouchableOpacity
            style={[
                styles.card,
                {
                    backgroundColor: theme.colors.surface,
                    borderColor: theme.colors.border,
                },
            ]}
            onPress={onPress}
            activeOpacity={0.85}
        >
            {/* Category Badge */}
            <View style={[styles.badge, { backgroundColor: theme.colors.accent }]}>
                <Text style={styles.badgeText}>
                    {workout.category.toUpperCase()}
                </Text>
            </View>

            {/* Title */}
            <Text
                style={[styles.title, { color: theme.colors.text }]}
                numberOfLines={2}
            >
                {workout.title}
            </Text>

            {/* Description */}
            {workout.description && (
                <Text
                    style={[styles.description, { color: theme.colors.subtext }]}
                    numberOfLines={2}
                >
                    {workout.description}
                </Text>
            )}

            {/* Stats Row */}
            <View style={styles.statsRow}>
                {workout.sets && workout.reps && (
                    <Text style={[styles.stat, { color: theme.colors.text }]}>
                        {workout.sets} sets × {workout.reps} reps
                    </Text>
                )}
            </View>

            {/* Edit Button (optional) */}
            {onEdit && (
                <TouchableOpacity
                    style={styles.editButton}
                    onPress={onEdit}
                    hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
                >
                    <Ionicons name="pencil" size={16} color={theme.colors.subtext} />
                </TouchableOpacity>
            )}
        </TouchableOpacity>
    );
};

const styles = StyleSheet.create({
    card: {
        borderRadius: radii.lg,
        padding: spacing.md,
        borderWidth: StyleSheet.hairlineWidth,
    },
    badge: {
        alignSelf: "flex-start",
        paddingHorizontal: spacing.sm,
        paddingVertical: spacing.xxs,
        borderRadius: radii.full,
        marginBottom: spacing.xs,
    },
    badgeText: {
        color: "#FFFFFF",
        fontFamily: typography.fonts.bodySemibold,
        fontSize: typography.sizes.xs,
    },
    title: {
        fontFamily: typography.fonts.headlineSemibold,
        fontSize: typography.sizes.lg,
        marginBottom: spacing.xxs,
    },
    description: {
        fontFamily: typography.fonts.body,
        fontSize: typography.sizes.sm,
        marginBottom: spacing.xs,
    },
    statsRow: {
        flexDirection: "row",
        gap: spacing.sm,
    },
    stat: {
        fontFamily: typography.fonts.bodyMedium,
        fontSize: typography.sizes.sm,
    },
    editButton: {
        position: "absolute",
        top: spacing.sm,
        right: spacing.sm,
    },
});
```

### 2. Modal / Bottom Sheet

```typescript
// File: mobile/src/components/AddToPlanBottomSheet.tsx
import React, { useState } from "react";
import {
    View,
    Text,
    StyleSheet,
    TouchableOpacity,
    Modal,
    Pressable,
    ScrollView,
    useColorScheme,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { Ionicons } from "@expo/vector-icons";
import { getTheme, spacing, radii, typography } from "../theme";

interface AddToPlanBottomSheetProps {
    visible: boolean;
    workoutTitle: string;
    onClose: () => void;
    onConfirm: (dates: string[]) => Promise<void>;
}

export const AddToPlanBottomSheet: React.FC<AddToPlanBottomSheetProps> = ({
    visible,
    workoutTitle,
    onClose,
    onConfirm,
}) => {
    const scheme = useColorScheme();
    const theme = getTheme(scheme === "dark" ? "dark" : "light");
    const insets = useSafeAreaInsets();

    const [selectedDates, setSelectedDates] = useState<string[]>([]);
    const [loading, setLoading] = useState(false);

    const handleConfirm = async () => {
        setLoading(true);
        try {
            await onConfirm(selectedDates);
            onClose();
        } catch (error) {
            console.error("Failed to add to plan:", error);
        } finally {
            setLoading(false);
        }
    };

    return (
        <Modal
            visible={visible}
            animationType="slide"
            transparent
            onRequestClose={onClose}
        >
            {/* Backdrop */}
            <Pressable style={styles.overlay} onPress={onClose}>
                {/* Content - prevent close on content tap */}
                <Pressable
                    style={[
                        styles.content,
                        {
                            backgroundColor: theme.colors.bg,
                            paddingBottom: insets.bottom + spacing.md,
                        },
                    ]}
                    onPress={(e) => e.stopPropagation()}
                >
                    {/* Handle Bar */}
                    <View style={styles.handleContainer}>
                        <View
                            style={[
                                styles.handle,
                                { backgroundColor: theme.colors.border },
                            ]}
                        />
                    </View>

                    {/* Header */}
                    <View style={styles.header}>
                        <Text style={[styles.title, { color: theme.colors.text }]}>
                            Add to Plan
                        </Text>
                        <TouchableOpacity onPress={onClose}>
                            <Ionicons
                                name="close"
                                size={24}
                                color={theme.colors.subtext}
                            />
                        </TouchableOpacity>
                    </View>

                    {/* Body */}
                    <ScrollView style={styles.body}>
                        <Text style={[styles.subtitle, { color: theme.colors.subtext }]}>
                            Select dates for "{workoutTitle}"
                        </Text>
                        {/* Calendar or date picker would go here */}
                    </ScrollView>

                    {/* Actions */}
                    <View style={styles.actions}>
                        <TouchableOpacity
                            style={[styles.cancelButton, { borderColor: theme.colors.border }]}
                            onPress={onClose}
                        >
                            <Text style={[styles.cancelText, { color: theme.colors.text }]}>
                                Cancel
                            </Text>
                        </TouchableOpacity>
                        <TouchableOpacity
                            style={[
                                styles.confirmButton,
                                { backgroundColor: theme.colors.accent },
                            ]}
                            onPress={handleConfirm}
                            disabled={loading || selectedDates.length === 0}
                        >
                            <Text style={styles.confirmText}>
                                {loading ? "Adding..." : "Add to Plan"}
                            </Text>
                        </TouchableOpacity>
                    </View>
                </Pressable>
            </Pressable>
        </Modal>
    );
};

const styles = StyleSheet.create({
    overlay: {
        flex: 1,
        backgroundColor: "rgba(0, 0, 0, 0.5)",
        justifyContent: "flex-end",
    },
    content: {
        borderTopLeftRadius: radii.xl,
        borderTopRightRadius: radii.xl,
        paddingTop: spacing.sm,
        paddingHorizontal: spacing.md,
        maxHeight: "85%",
    },
    handleContainer: {
        alignItems: "center",
        paddingVertical: spacing.xs,
    },
    handle: {
        width: 40,
        height: 4,
        borderRadius: 2,
    },
    header: {
        flexDirection: "row",
        justifyContent: "space-between",
        alignItems: "center",
        paddingVertical: spacing.sm,
    },
    title: {
        fontFamily: typography.fonts.headlineSemibold,
        fontSize: typography.sizes.lg,
    },
    body: {
        flex: 1,
    },
    subtitle: {
        fontFamily: typography.fonts.body,
        fontSize: typography.sizes.sm,
        marginBottom: spacing.md,
    },
    actions: {
        flexDirection: "row",
        gap: spacing.sm,
        paddingTop: spacing.md,
    },
    cancelButton: {
        flex: 1,
        paddingVertical: spacing.sm,
        borderRadius: radii.xl,
        borderWidth: 1,
        alignItems: "center",
    },
    cancelText: {
        fontFamily: typography.fonts.bodyMedium,
        fontSize: typography.sizes.md,
    },
    confirmButton: {
        flex: 2,
        paddingVertical: spacing.sm,
        borderRadius: radii.xl,
        alignItems: "center",
    },
    confirmText: {
        color: "#FFFFFF",
        fontFamily: typography.fonts.bodySemibold,
        fontSize: typography.sizes.md,
    },
});
```

### 3. List Item with Actions

```typescript
// Pattern for swipeable or actionable list items
<TouchableOpacity
    style={[styles.listItem, { backgroundColor: theme.colors.surface }]}
    onPress={handlePress}
    onLongPress={handleLongPress}  // Show options
    activeOpacity={0.85}
>
    <View style={styles.listItemContent}>
        <Text style={[styles.listItemTitle, { color: theme.colors.text }]}>
            {item.title}
        </Text>
        <Text style={[styles.listItemSubtitle, { color: theme.colors.subtext }]}>
            {item.subtitle}
        </Text>
    </View>
    <Ionicons name="chevron-forward" size={20} color={theme.colors.subtext} />
</TouchableOpacity>
```

---

## DO's and DON'Ts

### DO

```typescript
// Use theme colors with dynamic scheme
const scheme = useColorScheme();
const theme = getTheme(scheme === "dark" ? "dark" : "light");

// Use StyleSheet for performance
const styles = StyleSheet.create({ ... });

// Destructure props
const { title, onPress } = props;

// Use safe area insets for modals
const insets = useSafeAreaInsets();

// Handle loading states
const [loading, setLoading] = useState(false);

// Use activeOpacity on TouchableOpacity
<TouchableOpacity activeOpacity={0.85}>

// Use hitSlop for small touch targets
<TouchableOpacity hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}>
```

### DON'T

```typescript
// DON'T hardcode colors
style={{ backgroundColor: "#FAF7F2" }}  // Bad

// DON'T use inline styles for complex styling
style={{ padding: 24, margin: 16, borderRadius: 20 }}  // Bad

// DON'T forget null checks
{workout.description && <Text>{workout.description}</Text>}  // Good

// DON'T mutate state directly
setItems(items.push(newItem));  // Bad
setItems([...items, newItem]);  // Good

// DON'T forget error handling in async functions
const handlePress = async () => {
    try {
        await doSomething();
    } catch (error) {
        Alert.alert("Error", "Something went wrong");
    }
};
```

---

## Component Checklist

When creating a new component:

- [ ] Define TypeScript interface for props
- [ ] Use theme colors (not hardcoded)
- [ ] Use spacing/radii constants
- [ ] Use typography tokens for fonts
- [ ] Support dark mode via `useColorScheme()`
- [ ] Use `useSafeAreaInsets()` for edge-to-edge layouts
- [ ] Handle loading states
- [ ] Handle error states
- [ ] Use `numberOfLines` for text truncation
- [ ] Add `activeOpacity` to touchables
- [ ] Export named export (not default)

---

## File Organization

```
src/components/
├── plan/                    # Feature-specific components
│   ├── PlanSetupModal.tsx
│   └── planScheduling.ts    # Non-component utilities
├── WorkoutCard.tsx          # Reusable across features
├── WorkoutDetail.tsx        # Large, single-use component
└── index.ts                 # Re-exports (optional)
```

---

## Related Documentation

- [02-design-system.md](./02-design-system.md) - Theme tokens
- [05-adding-mobile-feature.md](./05-adding-mobile-feature.md) - Full feature workflow
- [07-state-management.md](./07-state-management.md) - State patterns
