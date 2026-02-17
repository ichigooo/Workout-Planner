export const spacing = {
    xxs: 4,
    xs: 8,
    sm: 16,
    md: 24,
    lg: 32,
    xl: 48,
    xxl: 64,
} as const;

export const radii = {
    sm: 8, // Buttons, badges
    md: 14, // Inputs, small cards
    lg: 22, // Cards, panels
    xl: 30, // Large cards, modals
    full: 9999, // Pills, avatars, fully rounded
} as const;

export const palettes = {
    light: {
        // Trainichi Brand Palette
        // Cream Backgrounds
        bg: "#F5EDE1", // Cream - primary background
        surface: "#EDE4D6", // Warm sand - cards and elevated surfaces
        surfaceElevated: "#FAF5EC", // Soft elevated panels
        border: "#D6CEBF", // Warm taupe - subtle borders
        divider: "#C9BFAE", // Deeper stone - dividers

        // Text Hierarchy
        text: "#292521", // Charcoal - primary text
        textSecondary: "#45413D", // Deep charcoal - secondary text
        textTertiary: "#8A7F72", // Warm taupe - hints and placeholders

        // Primary Accent - Blue Regatta
        accent: "#366299", // Blue Regatta - primary accent
        accentHover: "#5E82AD", // Blue Regatta light - hover state
        accentPressed: "#2B4E7A", // Blue Regatta dark - pressed state

        // Secondary Accent - Olive
        sage: "#6B7B5A", // Olive sage - secondary accent
        sageLight: "#8A9A76", // Light olive
        moss: "#515F42", // Deep moss

        // Warm Tones
        clay: "#A68568", // Deep clay - warm accent
        stone: "#C4BAA9", // Stone
        sand: "#D1C9BC", // Sand

        // Semantic
        success: "#6B8A5F", // Muted success green
        warning: "#C49560", // Warm amber
        danger: "#B06A5E", // Muted rose
        error: "#B06A5E", // Alias for danger

        // Modal overlay
        overlay: "rgba(0, 0, 0, 0.6)",

        // Glass tokens (for glassmorphism effects)
        glassWhite: "rgba(255, 255, 255, 0.55)",
        glassBorder: "rgba(255, 255, 255, 0.25)",
        glassOverlay: "rgba(41, 37, 33, 0.35)",

        // Legacy mappings (for backward compatibility)
        iconBg: "#366299",
        greeting: "#EDE4D6",
        subtext: "#8A7F72",
        mutedAccent: "#A68568",
        cream: "#F5EDE1",
        mutedPink: "#5E82AD",
        lightBlue: "#8A9A76",
        warmGrey: "#8A7F72",
        charcoal: "#45413D",
    },
    dark: {
        // Dark mode with brand palette
        bg: "#292521", // Charcoal background
        surface: "#393531", // Elevated surface
        border: "#4A4540", // Subtle warm border
        text: "#F5EDE1", // Cream text
        subtext: "#B5ADA1", // Muted warm grey
        accent: "#5A8CC4", // Light Blue Regatta
        mutedAccent: "#7BA3CB", // Muted blue
        divider: "#3D3935", // Warm dark divider
        danger: "#D67A7A", // Lighter muted red
        error: "#D67A7A", // Alias for danger
        // Additional colors (adjusted for dark mode)
        sage: "#6B7F5F",
        cream: "#3D3935",
        mutedPink: "#3A4A5A",
        lightBlue: "#7BA3CB",
        warmGrey: "#A8A098",
        charcoal: "#E8E2D8",
    },
} as const;

// Typography system (Trainichi Moody Editorial)
export const typography = {
    fonts: {
        // Fraunces for headlines - elegant serif with warmth
        display: "Fraunces_400Regular", // Display, H1
        displayItalic: "Fraunces_400Regular_Italic",
        headline: "Fraunces_500Medium", // H2
        headlineSemibold: "Fraunces_600SemiBold", // H3

        // DM Sans for body - geometric, friendly, readable
        body: "DMSans_400Regular", // Body text, UI elements
        bodyMedium: "DMSans_500Medium", // Labels
        bodySemibold: "DMSans_600SemiBold", // Emphasis, buttons
        bodyBold: "DMSans_700Bold", // Strong emphasis
    },
    sizes: {
        xs: 11, // Overlines, small labels
        sm: 14, // Captions, small body
        md: 16, // Body text, inputs
        lg: 22, // H3
        xl: 32, // H2
        xxl: 48, // H1
        display: 72, // Hero display
    },
    lineHeights: {
        tight: 1.15, // For headlines
        normal: 1.6, // For body text
        relaxed: 1.7, // For long-form content
    },
    letterSpacing: {
        tight: -0.03, // For display/large headlines
        normal: 0, // Default
        wide: 0.2, // For overlines/uppercase labels
    },
} as const;

export const shadows = {
    light: {
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
    },
    dark: {
        minimal: {
            shadowColor: "#000000",
            shadowOpacity: 0.2,
            shadowRadius: 6,
            shadowOffset: { width: 0, height: 2 },
            elevation: 2,
        },
        subtle: {
            shadowColor: "#000000",
            shadowOpacity: 0.3,
            shadowRadius: 12,
            shadowOffset: { width: 0, height: 4 },
            elevation: 4,
        },
        card: {
            shadowColor: "#000000",
            shadowOpacity: 0.4,
            shadowRadius: 16,
            shadowOffset: { width: 0, height: 6 },
            elevation: 6,
        },
    },
} as const;

// Utility to derive rgba from palette hex values
export function hexToRgba(hex: string, alpha: number): string {
    const r = parseInt(hex.slice(1, 3), 16);
    const g = parseInt(hex.slice(3, 5), 16);
    const b = parseInt(hex.slice(5, 7), 16);
    return `rgba(${r}, ${g}, ${b}, ${alpha})`;
}

// Glassmorphism utilities
export const glassStyles = {
    card: {
        backgroundColor: "rgba(255, 255, 255, 0.45)" as const,
        borderWidth: 1,
        borderColor: "rgba(255, 255, 255, 0.25)" as const,
        borderRadius: 22,
        overflow: "hidden" as const,
    },
    cardDark: {
        backgroundColor: "rgba(41, 37, 33, 0.40)" as const,
        borderWidth: 1,
        borderColor: "rgba(255, 255, 255, 0.12)" as const,
        borderRadius: 22,
        overflow: "hidden" as const,
    },
    blurIntensity: 40,
    blurTint: "light" as const,
} as const;

export type ThemeMode = "light" | "dark";

export const getTheme = (_mode: ThemeMode) => ({
    spacing,
    radii,
    typography,
    colors: palettes.light,
    shadows: shadows.light,
    glass: glassStyles,
});
