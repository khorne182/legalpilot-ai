export const Colors = {
  primary: '#0A2540',    // Deep Navy
  secondary: '#007AFF',  // Vibrant Blue
  accent: '#34C759',     // Success/Active
  destructive: '#FF3B30', // Error/Delete
  background: {
    light: '#F2F2F7',
    dark: '#1C1C1E',
  },
  surface: {
    light: '#FFFFFF',
    dark: '#2C2C2E',
  },
  text: {
    primary: {
      light: '#1C1C1E',
      dark: '#FFFFFF',
    },
    secondary: {
      light: '#8E8E93',
      dark: '#8E8E93', // Keep same for now, or lighten slightly
    },
  },
  border: {
    light: '#E5E5EA',
    dark: '#38383A',
  }
};

export const Layout = {
  spacing: {
    xs: 4,
    sm: 8,
    md: 16,
    lg: 24,
    xl: 32,
    xxl: 48,
  },
  borderRadius: {
    sm: 8,
    md: 12,
    lg: 16,
    xl: 24,
  },
  shadow: {
    small: {
      shadowColor: '#000',
      shadowOffset: { width: 0, height: 2 },
      shadowOpacity: 0.1,
      shadowRadius: 4,
      elevation: 3,
    },
    medium: {
      shadowColor: '#000',
      shadowOffset: { width: 0, height: 4 },
      shadowOpacity: 0.15,
      shadowRadius: 12,
      elevation: 5,
    },
  }
};
