# Trainichi Design System

> A **moody editorial** design system — warm stone tones, glassmorphism surfaces, and bold serif typography for a grounded, fitness-focused aesthetic.

**Source file:** `mobile/src/theme.ts`

---

## Design Direction

The visual language blends:
- **Warm, deep tones** (Blue Regatta, olive, cream) for a moodier feel
- **Glassmorphism** (translucent cards, blur effects) for depth and layering
- **Editorial typography** (bold Fraunces serif headlines) for personality
- **Pill-shaped CTAs** and generous radii for a modern, approachable look

Dependencies: `expo-blur` (BlurView for glass effects), `expo-linear-gradient` (gradient overlays)

---

## Color Palette

### Cream Backgrounds

| Token | Hex | Usage |
|-------|-----|-------|
| `bg` | `#F5EDE1` | Primary background (cream) |
| `surface` | `#EDE4D6` | Card surfaces (warm sand) |
| `surfaceElevated` | `#FAF5EC` | Highest elevation (modals, panels) |
| `border` | `#D6CEBF` | Subtle borders (warm taupe) |
| `divider` | `#C9BFAE` | Divider lines (deeper stone) |

### Text Hierarchy

| Token | Hex | Usage |
|-------|-----|-------|
| `text` | `#292521` | Primary text (charcoal) |
| `textSecondary` | `#45413D` | Secondary text (deep charcoal) |
| `textTertiary` | `#8A7F72` | Hints, placeholders (warm taupe) |
| `subtext` | `#8A7F72` | Alias for textTertiary |

### Primary Accent — Blue Regatta

| Token | Hex | Usage |
|-------|-----|-------|
| `accent` | `#366299` | Primary accent, CTAs (Blue Regatta) |
| `accentHover` | `#5E82AD` | Hover state |
| `accentPressed` | `#2B4E7A` | Pressed state |

### Secondary Accent — Olive

| Token | Hex | Usage |
|-------|-----|-------|
| `sage` | `#6B7B5A` | Secondary accent (olive sage) |
| `sageLight` | `#8A9A76` | Light olive |
| `moss` | `#515F42` | Deep moss |

### Warm Tones

| Token | Hex | Usage |
|-------|-----|-------|
| `clay` | `#A68568` | Deep clay accent |
| `stone` | `#C4BAA9` | Stone |
| `sand` | `#D1C9BC` | Sand |

### Semantic Colors

| Token | Hex | Usage |
|-------|-----|-------|
| `success` | `#6B8A5F` | Success states (muted green) |
| `warning` | `#C49560` | Warning states (warm amber) |
| `danger` | `#B06A5E` | Error / destructive (muted rose) |

### Glass Tokens

| Token | Value | Usage |
|-------|-------|-------|
| `glassWhite` | `rgba(255,255,255,0.55)` | Translucent card backgrounds |
| `glassBorder` | `rgba(255,255,255,0.25)` | Translucent card borders |
| `glassOverlay` | `rgba(41,37,33,0.35)` | Dark overlay for image backgrounds |

---

## Typography

### Font Families

| Token | Font | Usage |
|-------|------|-------|
| `display` | Fraunces_400Regular | Display headlines, hero text |
| `displayItalic` | Fraunces_400Regular_Italic | Italic display (quotes, callouts) |
| `headline` | Fraunces_500Medium | H2 headlines, section titles |
| `headlineSemibold` | Fraunces_600SemiBold | H3 headlines |
| `body` | DMSans_400Regular | Body text, UI elements |
| `bodyMedium` | DMSans_500Medium | Labels |
| `bodySemibold` | DMSans_600SemiBold | Emphasis, buttons |
| `bodyBold` | DMSans_700Bold | Strong emphasis |

### Font Sizes

| Token | Size | Usage |
|-------|------|-------|
| `xs` | 11px | Overlines, small labels |
| `sm` | 14px | Captions, small body |
| `md` | 16px | Body text, inputs |
| `lg` | 22px | H3, section titles |
| `xl` | 32px | H2 |
| `xxl` | 48px | H1 |
| `display` | 72px | Hero display |

### Line Heights

| Token | Value | Usage |
|-------|-------|-------|
| `tight` | 1.15 | Headlines |
| `normal` | 1.6 | Body text |
| `relaxed` | 1.7 | Long-form content |

### Letter Spacing

| Token | Value | Usage |
|-------|-------|-------|
| `tight` | -0.03em | Display/large headlines |
| `normal` | 0 | Default |
| `wide` | 0.2em | Overlines, uppercase labels |

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

---

## Border Radius

```typescript
export const radii = {
    sm: 8,      // Buttons, badges
    md: 14,     // Inputs, small cards
    lg: 22,     // Cards, panels
    xl: 30,     // Large cards, modals
    full: 9999, // Pills, avatars, circles
}
```

---

## Shadows

Shadow color uses `#292521` (charcoal) with increasing opacity for depth.

```typescript
shadows.light = {
    minimal: {
        shadowColor: "#292521",
        shadowOpacity: 0.05,
        shadowRadius: 6,
        shadowOffset: { width: 0, height: 2 },
        elevation: 1,
    },
    subtle: {
        shadowColor: "#292521",
        shadowOpacity: 0.08,
        shadowRadius: 12,
        shadowOffset: { width: 0, height: 3 },
        elevation: 2,
    },
    card: {
        shadowColor: "#292521",
        shadowOpacity: 0.1,
        shadowRadius: 16,
        shadowOffset: { width: 0, height: 6 },
        elevation: 4,
    },
}
```

---

## Glassmorphism

The app uses a glassmorphism treatment for cards and overlays, achieved via `expo-blur` BlurView and translucent RGBA backgrounds.

### Glass Style Tokens

```typescript
export const glassStyles = {
    card: {
        backgroundColor: "rgba(255, 255, 255, 0.45)",
        borderWidth: 1,
        borderColor: "rgba(255, 255, 255, 0.25)",
        borderRadius: 22,
        overflow: "hidden",
    },
    cardDark: {
        backgroundColor: "rgba(41, 37, 33, 0.40)",
        borderWidth: 1,
        borderColor: "rgba(255, 255, 255, 0.12)",
        borderRadius: 22,
        overflow: "hidden",
    },
    blurIntensity: 40,
    blurTint: "light",
}
```

### GlassCard Component

Reusable glass card wrapper at `mobile/src/components/GlassCard.tsx`:

```typescript
import { GlassCard } from "../components/GlassCard";

// Light glass card (default — use over image backgrounds)
<GlassCard>
    <Text>Content</Text>
</GlassCard>

// Dark glass card
<GlassCard dark>
    <Text>Content</Text>
</GlassCard>

// Custom intensity and no padding
<GlassCard intensity={60} noPadding>
    <Text>Content</Text>
</GlassCard>
```

**Performance note:** For cards on solid-color backgrounds, use the `glassWhite` / `glassBorder` rgba tokens directly (skip BlurView) for better Android performance.

---

## Using the Theme

### Import and Use

```typescript
import { useColorScheme } from "react-native";
import { getTheme, spacing, radii, typography, glassStyles } from "../theme";

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
                fontFamily: typography.fonts.headline,
                fontSize: typography.sizes.lg,
            }}>
                Section Title
            </Text>
        </View>
    );
};
```

### Theme Object Structure

```typescript
const theme = getTheme("light");

// Colors
theme.colors.bg              // "#F5EDE1"
theme.colors.accent           // "#366299"
theme.colors.text              // "#292521"
theme.colors.glassWhite        // "rgba(255,255,255,0.55)"

// Glass styles
theme.glass.card               // Glass card style object
theme.glass.blurIntensity      // 40

// Spacing, radii, typography (also exported directly)
theme.spacing.md               // 24
theme.radii.lg                 // 22
theme.typography.fonts.body    // "DMSans_400Regular"
theme.typography.sizes.md      // 16
```

---

## DO's and DON'Ts

### DO

- Use theme tokens instead of hardcoded values
- Import `getTheme()` and pass color scheme
- Use `spacing` constants for consistent gaps
- Use `radii` for border radius values
- Apply `typography.fonts` for font families
- Use Fraunces for all headlines and section titles
- Use DM Sans for all body text, labels, and UI
- Use glass tokens for translucent card effects
- Use pill-shaped buttons (`radii.full`) for primary CTAs

### DON'T

- Hardcode colors: `color: "#366299"`
- Use arbitrary spacing: `padding: 17`
- Mix font families inconsistently
- Use Inter or other fonts — only Fraunces and DM Sans
- Use BlurView on solid backgrounds (use rgba tokens instead for performance)

### Examples

```typescript
// DO
<View style={{ backgroundColor: theme.colors.surface }}>
<Text style={{ color: theme.colors.text }}>

// DON'T
<View style={{ backgroundColor: "#EDE4D6" }}>
<Text style={{ color: "#292521" }}>
```

---

## Common Patterns

### Card Style (Solid)

```typescript
const cardStyle = {
    backgroundColor: theme.colors.surface,
    borderRadius: radii.lg,
    padding: spacing.md,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: theme.colors.border,
};
```

### Card Style (Glass)

```typescript
const glassCardStyle = {
    backgroundColor: theme.colors.glassWhite,
    borderRadius: radii.lg,
    padding: spacing.md,
    borderWidth: 1,
    borderColor: theme.colors.glassBorder,
};
```

### Primary Button (Pill)

```typescript
const primaryButtonStyle = {
    backgroundColor: theme.colors.accent,
    paddingVertical: spacing.sm,
    paddingHorizontal: spacing.md,
    borderRadius: radii.full,
    alignItems: "center",
};

const primaryButtonTextStyle = {
    color: "#FFFFFF",
    fontFamily: typography.fonts.bodySemibold,
    fontSize: typography.sizes.md,
};
```

### Secondary Button (Glass Border)

```typescript
const secondaryButtonStyle = {
    backgroundColor: "transparent",
    borderWidth: 1,
    borderColor: theme.colors.glassBorder,
    paddingVertical: spacing.sm,
    paddingHorizontal: spacing.md,
    borderRadius: radii.full,
};

const secondaryButtonTextStyle = {
    color: theme.colors.text,
    fontFamily: typography.fonts.bodyMedium,
    fontSize: typography.sizes.md,
};
```

### Category Badge (Semi-transparent)

```typescript
const badgeStyle = {
    backgroundColor: "rgba(54, 98, 153, 0.15)",
    paddingHorizontal: spacing.sm,
    paddingVertical: spacing.xxs,
    borderRadius: radii.full,
};

const badgeTextStyle = {
    color: theme.colors.accent,
    fontFamily: typography.fonts.bodySemibold,
    fontSize: typography.sizes.xs,
    textTransform: "uppercase",
};
```

### Section Title (Editorial)

```typescript
const sectionTitleStyle = {
    fontFamily: typography.fonts.headline,   // Fraunces_500Medium
    fontSize: typography.sizes.lg,            // 22px
    color: theme.colors.text,
    letterSpacing: typography.letterSpacing.tight,
};
```

### Gradient Overlay (over images)

```typescript
import { LinearGradient } from "expo-linear-gradient";

<LinearGradient
    colors={["transparent", "rgba(41, 37, 33, 0.7)"]}
    style={StyleSheet.absoluteFill}
/>
```

---

## Related Documentation

- [03-component-patterns.md](./03-component-patterns.md) - Component implementations
- [05-adding-mobile-feature.md](./05-adding-mobile-feature.md) - Using theme in new features
