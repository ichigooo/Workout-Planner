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
    md: 12, // Inputs, small cards
    lg: 20, // Cards, panels
    xl: 28, // Large cards, modals
    full: 9999, // Pills, avatars, fully rounded
} as const;

export const palettes = {
    light: {
        // Trainichi Warm Earthy Design System
        // Warm Neutrals
        bg: "#FAF7F2", // Cream - primary background
        surface: "#F5F1EA", // Warm white - cards and elevated surfaces
        surfaceElevated: "#FFFFFF", // Pure white for highest elevation
        border: "#E8E2D9", // Sand - subtle borders
        divider: "#D4CCC0", // Stone - dividers

        // Text Hierarchy
        text: "#2C2925", // Espresso - primary text
        textSecondary: "#3D3A36", // Charcoal - secondary text
        textTertiary: "#9C948A", // Warm gray - hints and placeholders

        // Earthy Accents
        accent: "#C17F61", // Terracotta - primary accent
        accentHover: "#D4A088", // Terracotta light - hover state
        accentPressed: "#A86D52", // Terracotta dark - pressed state

        // Secondary Accent
        sage: "#8B9A7E", // Sage - secondary accent
        sageLight: "#A8B59D", // Sage light
        moss: "#6B7B5E", // Moss - deep sage

        // Warm Tones
        clay: "#B8977A", // Clay - warm accent
        stone: "#D4CCC0", // Stone
        sand: "#E8E2D9", // Sand

        // Semantic
        success: "#7A9B6F", // Success green
        warning: "#D4A574", // Warning
        danger: "#C4776A", // Error

        // Legacy mappings (for backward compatibility)
        iconBg: "#C17F61",
        greeting: "#F5F1EA",
        subtext: "#9C948A",
        mutedAccent: "#B8977A",
        cream: "#FAF7F2",
        mutedPink: "#D4A088",
        lightBlue: "#A8B59D",
        warmGrey: "#9C948A",
        charcoal: "#3D3A36",
    },
    dark: {
        // Dark mode with sophisticated tones
        bg: "#1A1A1A", // Deep charcoal background
        surface: "#2C2C2C", // Dark grey surface
        border: "#404040", // Subtle dark border
        text: "#F5F5F5", // Light text
        subtext: "#B0B0B0", // Muted light grey
        accent: "#6B7F5F", // Lighter sage green
        mutedAccent: "#9FB0C0", // Lighter blue-grey
        divider: "#333333", // Dark divider
        danger: "#D67A7A", // Lighter muted red
        // Additional sophisticated colors (adjusted for dark mode)
        sage: "#6B7F5F",
        cream: "#3A3A3A",
        mutedPink: "#4A3A3A",
        lightBlue: "#9FB0C0",
        warmGrey: "#A0A0A0",
        charcoal: "#E0E0E0",
    },
} as const;

// Typography system (Trainichi Warm Earthy)
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
        xs: 12, // Overlines, small labels
        sm: 14, // Captions, small body
        md: 16, // Body text, inputs
        lg: 20, // H3
        xl: 28, // H2
        xxl: 42, // H1
        display: 64, // Hero display
    },
    lineHeights: {
        tight: 1.15, // For headlines
        normal: 1.6, // For body text
        relaxed: 1.7, // For long-form content
    },
    letterSpacing: {
        tight: -0.02, // For display/large headlines
        normal: 0, // Default
        wide: 0.15, // For overlines/uppercase labels
    },
} as const;

export const shadows = {
    light: {
        // Very subtle, organic shadows
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

export type ThemeMode = "light" | "dark";

export const getTheme = (_mode: ThemeMode) => ({
    spacing,
    radii,
    typography,
    colors: palettes.light,
    shadows: shadows.light,
});
