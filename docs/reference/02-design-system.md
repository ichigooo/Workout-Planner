# Trainichi Design System

> The "Warm Earthy" design system for a grounded, fitness-focused aesthetic.

**Source file:** `mobile/src/theme.ts`

---

## Color Palette

### Warm Neutrals (Backgrounds)

| Token | Hex | Usage |
|-------|-----|-------|
| `bg` | `#FAF7F2` | Primary background (cream) |
| `surface` | `#F5F1EA` | Card surfaces, elevated elements |
| `surfaceElevated` | `#FFFFFF` | Highest elevation (modals) |
| `border` | `#E8E2D9` | Subtle borders (sand) |
| `divider` | `#D4CCC0` | Divider lines (stone) |

### Text Hierarchy

| Token | Hex | Usage |
|-------|-----|-------|
| `text` | `#2C2925` | Primary text (espresso) |
| `textSecondary` | `#3D3A36` | Secondary text (charcoal) |
| `textTertiary` | `#9C948A` | Hints, placeholders (warm gray) |
| `subtext` | `#9C948A` | Alias for textTertiary |

### Earthy Accents (Primary)

| Token | Hex | Usage |
|-------|-----|-------|
| `accent` | `#C17F61` | Primary accent, CTAs (terracotta) |
| `accentHover` | `#D4A088` | Hover state |
| `accentPressed` | `#A86D52` | Pressed state |

### Secondary Accents

| Token | Hex | Usage |
|-------|-----|-------|
| `sage` | `#8B9A7E` | Secondary accent |
| `sageLight` | `#A8B59D` | Lighter sage variant |
| `moss` | `#6B7B5E` | Deep sage |

### Warm Tones

| Token | Hex | Usage |
|-------|-----|-------|
| `clay` | `#B8977A` | Warm accent |
| `stone` | `#D4CCC0` | Stone color |
| `sand` | `#E8E2D9` | Sand color |

### Semantic Colors

| Token | Hex | Usage |
|-------|-----|-------|
| `success` | `#7A9B6F` | Success states |
| `warning` | `#D4A574` | Warning states |
| `danger` | `#C4776A` | Error states, destructive actions |

---

## Typography

### Font Families

| Token | Font | Usage |
|-------|------|-------|
| `display` | Fraunces_400Regular | Display headlines, H1 |
| `displayItalic` | Fraunces_400Regular_Italic | Italic display |
| `headline` | Fraunces_500Medium | H2 headlines |
| `headlineSemibold` | Fraunces_600SemiBold | H3 headlines |
| `body` | DMSans_400Regular | Body text, UI |
| `bodyMedium` | DMSans_500Medium | Labels |
| `bodySemibold` | DMSans_600SemiBold | Emphasis, buttons |
| `bodyBold` | DMSans_700Bold | Strong emphasis |

### Font Sizes

| Token | Size | Usage |
|-------|------|-------|
| `xs` | 12px | Overlines, small labels |
| `sm` | 14px | Captions, small body |
| `md` | 16px | Body text, inputs |
| `lg` | 20px | H3 |
| `xl` | 28px | H2 |
| `xxl` | 42px | H1 |
| `display` | 64px | Hero display |

### Line Heights

| Token | Value | Usage |
|-------|-------|-------|
| `tight` | 1.15 | Headlines |
| `normal` | 1.6 | Body text |
| `relaxed` | 1.7 | Long-form content |

### Letter Spacing

| Token | Value | Usage |
|-------|-------|-------|
| `tight` | -0.02em | Display/large headlines |
| `normal` | 0 | Default |
| `wide` | 0.15em | Overlines, uppercase labels |

---

## Spacing

```typescript
export const spacing = {
    xxs: 4,   // Tight spacing
    xs: 8,    // Small gaps
    sm: 16,   // Default padding
    md: 24,   // Section spacing
    lg: 32,   // Large gaps
    xl: 48,   // Major sections
    xxl: 64,  // Hero spacing
}
```

### Usage Examples

```typescript
// Component padding
paddingHorizontal: spacing.md,  // 24px
paddingVertical: spacing.sm,    // 16px

// Gap between items
gap: spacing.xs,  // 8px

// Section margin
marginBottom: spacing.lg,  // 32px
```

---

## Border Radius

```typescript
export const radii = {
    sm: 8,      // Buttons, badges
    md: 12,     // Inputs, small cards
    lg: 20,     // Cards, panels
    xl: 28,     // Large cards, modals
    full: 9999, // Pills, avatars, circles
}
```

### Usage Examples

```typescript
// Button
borderRadius: radii.sm,  // 8px

// Card
borderRadius: radii.lg,  // 20px

// Avatar/pill
borderRadius: radii.full,  // Fully rounded
```

---

## Shadows

### Light Mode

```typescript
shadows.light = {
    minimal: {
        shadowColor: "#2C2925",
        shadowOpacity: 0.04,
        shadowRadius: 4,
        shadowOffset: { width: 0, height: 1 },
        elevation: 1,
    },
    subtle: {
        shadowColor: "#2C2925",
        shadowOpacity: 0.06,
        shadowRadius: 8,
        shadowOffset: { width: 0, height: 2 },
        elevation: 2,
    },
    card: {
        shadowColor: "#2C2925",
        shadowOpacity: 0.08,
        shadowRadius: 12,
        shadowOffset: { width: 0, height: 4 },
        elevation: 3,
    },
}
```

---

## Using the Theme

### Import and Use

```typescript
// File: mobile/src/components/MyComponent.tsx
import { useColorScheme } from "react-native";
import { getTheme, spacing, radii, typography } from "../theme";

const MyComponent = () => {
    const scheme = useColorScheme();
    const theme = getTheme(scheme === "dark" ? "dark" : "light");

    return (
        <View style={{
            backgroundColor: theme.colors.surface,
            padding: spacing.md,
            borderRadius: radii.lg,
        }}>
            <Text style={{
                color: theme.colors.text,
                fontFamily: typography.fonts.body,
                fontSize: typography.sizes.md,
            }}>
                Hello World
            </Text>
        </View>
    );
};
```

### Theme Object Structure

```typescript
const theme = getTheme("light");

// Access colors
theme.colors.bg           // "#FAF7F2"
theme.colors.accent       // "#C17F61"
theme.colors.text         // "#2C2925"

// Access spacing (also exported directly)
theme.spacing.md          // 24

// Access radii (also exported directly)
theme.radii.lg            // 20

// Access typography (also exported directly)
theme.typography.fonts.body       // "DMSans_400Regular"
theme.typography.sizes.md         // 16
```

---

## DO's and DON'Ts

### DO

- Use theme tokens instead of hardcoded values
- Import `getTheme()` and pass color scheme
- Use `spacing` constants for consistent gaps
- Use `radii` for border radius values
- Apply `typography.fonts` for font families

### DON'T

- Hardcode colors: `color: "#C17F61"`
- Use arbitrary spacing: `padding: 17`
- Mix font families inconsistently
- Ignore dark mode support

### Examples

```typescript
// DO
<View style={{ backgroundColor: theme.colors.surface }}>
<Text style={{ color: theme.colors.text }}>

// DON'T
<View style={{ backgroundColor: "#F5F1EA" }}>
<Text style={{ color: "#2C2925" }}>
```

---

## Common Patterns

### Card Style

```typescript
const cardStyle = {
    backgroundColor: theme.colors.surface,
    borderRadius: radii.lg,
    padding: spacing.md,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: theme.colors.border,
};
```

### Button Primary

```typescript
const primaryButtonStyle = {
    backgroundColor: theme.colors.accent,
    paddingVertical: spacing.sm,
    paddingHorizontal: spacing.md,
    borderRadius: radii.xl,
    alignItems: "center",
};

const primaryButtonTextStyle = {
    color: "#FFFFFF",
    fontFamily: typography.fonts.bodySemibold,
    fontSize: typography.sizes.md,
};
```

### Button Secondary

```typescript
const secondaryButtonStyle = {
    backgroundColor: "transparent",
    borderWidth: 1,
    borderColor: theme.colors.border,
    paddingVertical: spacing.sm,
    paddingHorizontal: spacing.md,
    borderRadius: radii.xl,
};

const secondaryButtonTextStyle = {
    color: theme.colors.text,
    fontFamily: typography.fonts.bodyMedium,
    fontSize: typography.sizes.md,
};
```

### Category Badge

```typescript
const badgeStyle = {
    backgroundColor: theme.colors.accent,
    paddingHorizontal: spacing.sm,
    paddingVertical: spacing.xxs,
    borderRadius: radii.full,
};

const badgeTextStyle = {
    color: "#FFFFFF",
    fontFamily: typography.fonts.bodySemibold,
    fontSize: typography.sizes.xs,
    textTransform: "uppercase",
};
```

---

## Related Documentation

- [03-component-patterns.md](./03-component-patterns.md) - Component implementations
- [05-adding-mobile-feature.md](./05-adding-mobile-feature.md) - Using theme in new features
