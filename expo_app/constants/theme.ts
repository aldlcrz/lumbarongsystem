export const Theme = {
  colors: {
    primary: '#C0422A', // Rust
    primaryLight: '#E8604A', // Rust Light
    secondary: '#3D2B1F', // Bark
    background: '#F7F3EE', // Cream
    surface: '#FDFAF7', // Warm White
    text: '#1C1917', // Charcoal
    textMuted: '#8C7B70', // Muted
    accent: '#D4B896', // Sand/Peach
    border: '#E5DDD5',
    inputBg: '#F9F6F2',
    white: '#FFFFFF',
    error: '#E8604A',
    success: '#4A9E6A',
  },
  spacing: {
    xs: 4,
    sm: 8,
    md: 16,
    lg: 24,
    xl: 32,
    xxl: 40,
  },
  radius: {
    sm: 8,
    md: 16,
    lg: 24,
    xl: 40,
    full: 9999,
  }
};

export const Colors = {
  light: {
    text: Theme.colors.text,
    background: Theme.colors.background,
    tint: Theme.colors.primary,
    icon: Theme.colors.textMuted,
    tabIconDefault: '#9BA1A6',
    tabIconSelected: Theme.colors.primary,
  },
  dark: {
    text: '#ECEDEE',
    background: '#151718',
    tint: '#fff',
    icon: '#9BA1A6',
    tabIconDefault: '#9BA1A6',
    tabIconSelected: '#fff',
  },
};

export const Fonts = {
  rounded: 'System',
  mono: 'System',
};
