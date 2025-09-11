export const spacing = {
  xxs: 4,
  xs: 8,
  sm: 12,
  md: 16,
  lg: 24,
  xl: 32,
  xxl: 40,
} as const;

export const radii = {
  sm: 6, // Subtle rounding for refined feel
  md: 8,
  lg: 12,
  xl: 16,
  xxl: 20, // Maximum for sophisticated elements
} as const;

export const palettes = {
  light: {
    // High-end, sophisticated color palette
    bg: '#F7F7F7', // Clean cream background
    surface: '#FFFFFF', // Pure white surfaces
    border: '#E8E8E8', // Subtle grey border
    text: '#2C2C2C', // Rich dark grey text
    subtext: '#6B6B6B', // Muted grey subtext
    accent: '#5C6F4F', // Sophisticated sage green
    mutedAccent: '#8FA8C0', // Muted blue-grey
    divider: '#F0F0F0', // Very light divider
    danger: '#C85A5A', // Muted red
    // Additional sophisticated colors
    sage: '#5C6F4F', // Sage green
    cream: '#F5E8D7', // Warm cream
    mutedPink: '#F0C2C2', // Soft muted pink
    lightBlue: '#8FA8C0', // Muted blue
    warmGrey: '#8B8B8B', // Warm grey
    charcoal: '#3A3A3A', // Charcoal for emphasis
  },
  dark: {
    // Dark mode with sophisticated tones
    bg: '#1A1A1A', // Deep charcoal background
    surface: '#2C2C2C', // Dark grey surface
    border: '#404040', // Subtle dark border
    text: '#F5F5F5', // Light text
    subtext: '#B0B0B0', // Muted light grey
    accent: '#6B7F5F', // Lighter sage green
    mutedAccent: '#9FB0C0', // Lighter blue-grey
    divider: '#333333', // Dark divider
    danger: '#D67A7A', // Lighter muted red
    // Additional sophisticated colors (adjusted for dark mode)
    sage: '#6B7F5F',
    cream: '#3A3A3A',
    mutedPink: '#4A3A3A',
    lightBlue: '#9FB0C0',
    warmGrey: '#A0A0A0',
    charcoal: '#E0E0E0',
  },
} as const;

export const shadows = {
  light: {
    card: {
      shadowColor: '#000000',
      shadowOpacity: 0.08,
      shadowRadius: 16,
      shadowOffset: { width: 0, height: 4 },
      elevation: 3,
    },
    button: {
      shadowColor: '#000000',
      shadowOpacity: 0.12,
      shadowRadius: 8,
      shadowOffset: { width: 0, height: 2 },
      elevation: 2,
    },
    subtle: {
      shadowColor: '#000000',
      shadowOpacity: 0.04,
      shadowRadius: 8,
      shadowOffset: { width: 0, height: 2 },
      elevation: 1,
    },
  },
  dark: {
    card: {
      shadowColor: '#000000',
      shadowOpacity: 0.25,
      shadowRadius: 20,
      shadowOffset: { width: 0, height: 8 },
      elevation: 6,
    },
    button: {
      shadowColor: '#000000',
      shadowOpacity: 0.3,
      shadowRadius: 12,
      shadowOffset: { width: 0, height: 4 },
      elevation: 4,
    },
    subtle: {
      shadowColor: '#000000',
      shadowOpacity: 0.15,
      shadowRadius: 12,
      shadowOffset: { width: 0, height: 4 },
      elevation: 2,
    },
  },
} as const;

export type ThemeMode = 'light' | 'dark';

export const getTheme = (mode: ThemeMode) => ({
  spacing,
  radii,
  colors: palettes[mode],
  shadows: shadows[mode],
});


