// Material Design 3 inspired color palette
export const colors = {
  // Primary colors (Material Blue)
  primary: '#2196F3',
  primaryDark: '#1976D2',
  primaryLight: '#64B5F6',
  primaryContainer: '#E3F2FD',
  onPrimary: '#FFFFFF',
  onPrimaryContainer: '#0D47A1',
  
  // Secondary colors
  secondary: '#9C27B0',
  secondaryDark: '#7B1FA2',
  secondaryLight: '#BA68C8',
  
  // Semantic colors
  success: '#4CAF50',
  successLight: '#81C784',
  successDark: '#388E3C',
  warning: '#FF9800',
  warningLight: '#FFB74D',
  warningDark: '#F57C00',
  danger: '#F44336',
  dangerLight: '#E57373',
  dangerDark: '#D32F2F',
  info: '#00BCD4',
  
  // Surface colors (Material Design)
  surface: '#FFFFFF',
  surfaceVariant: '#F5F5F5',
  surfaceDim: '#E0E0E0',
  surfaceBright: '#FAFAFA',
  onSurface: '#212121',
  onSurfaceVariant: '#757575',
  
  // Background colors
  background: '#FAFAFA',
  backgroundDark: '#F5F5F5',
  onBackground: '#212121',
  
  // Gray scale (Material Design)
  gray50: '#FAFAFA',
  gray100: '#F5F5F5',
  gray200: '#EEEEEE',
  gray300: '#E0E0E0',
  gray400: '#BDBDBD',
  gray500: '#9E9E9E',
  gray600: '#757575',
  gray700: '#616161',
  gray800: '#424242',
  gray900: '#212121',
  
  // Standard
  white: '#FFFFFF',
  black: '#000000',
  
  // Divider
  divider: 'rgba(0, 0, 0, 0.12)',
  dividerLight: 'rgba(0, 0, 0, 0.08)',
};

// Material Design elevation shadows
export const elevation = {
  0: {
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0,
    shadowRadius: 0,
    elevation: 0,
  },
  1: {
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.18,
    shadowRadius: 1.0,
    elevation: 1,
  },
  2: {
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.20,
    shadowRadius: 1.41,
    elevation: 2,
  },
  3: {
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.22,
    shadowRadius: 2.22,
    elevation: 3,
  },
  4: {
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.23,
    shadowRadius: 2.62,
    elevation: 4,
  },
  6: {
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.27,
    shadowRadius: 3.84,
    elevation: 6,
  },
  8: {
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.30,
    shadowRadius: 4.65,
    elevation: 8,
  },
  12: {
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 12 },
    shadowOpacity: 0.35,
    shadowRadius: 6.27,
    elevation: 12,
  },
  16: {
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 16 },
    shadowOpacity: 0.40,
    shadowRadius: 7.49,
    elevation: 16,
  },
  24: {
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 24 },
    shadowOpacity: 0.46,
    shadowRadius: 9.46,
    elevation: 24,
  },
};

// Typography scale (Material Design)
export const typography = {
  // Display styles
  displayLarge: {
    fontSize: 57,
    fontWeight: '400' as const,
    lineHeight: 64,
    letterSpacing: -0.25,
  },
  displayMedium: {
    fontSize: 45,
    fontWeight: '400' as const,
    lineHeight: 52,
    letterSpacing: 0,
  },
  displaySmall: {
    fontSize: 36,
    fontWeight: '400' as const,
    lineHeight: 44,
    letterSpacing: 0,
  },
  
  // Headline styles
  headlineLarge: {
    fontSize: 32,
    fontWeight: '400' as const,
    lineHeight: 40,
    letterSpacing: 0,
  },
  headlineMedium: {
    fontSize: 28,
    fontWeight: '400' as const,
    lineHeight: 36,
    letterSpacing: 0,
  },
  headlineSmall: {
    fontSize: 24,
    fontWeight: '400' as const,
    lineHeight: 32,
    letterSpacing: 0,
  },
  
  // Title styles
  titleLarge: {
    fontSize: 22,
    fontWeight: '500' as const,
    lineHeight: 28,
    letterSpacing: 0,
  },
  titleMedium: {
    fontSize: 16,
    fontWeight: '500' as const,
    lineHeight: 24,
    letterSpacing: 0.15,
  },
  titleSmall: {
    fontSize: 14,
    fontWeight: '500' as const,
    lineHeight: 20,
    letterSpacing: 0.1,
  },
  
  // Label styles
  labelLarge: {
    fontSize: 14,
    fontWeight: '500' as const,
    lineHeight: 20,
    letterSpacing: 0.1,
  },
  labelMedium: {
    fontSize: 12,
    fontWeight: '500' as const,
    lineHeight: 16,
    letterSpacing: 0.5,
  },
  labelSmall: {
    fontSize: 11,
    fontWeight: '500' as const,
    lineHeight: 16,
    letterSpacing: 0.5,
  },
  
  // Body styles
  bodyLarge: {
    fontSize: 16,
    fontWeight: '400' as const,
    lineHeight: 24,
    letterSpacing: 0.5,
  },
  bodyMedium: {
    fontSize: 14,
    fontWeight: '400' as const,
    lineHeight: 20,
    letterSpacing: 0.25,
  },
  bodySmall: {
    fontSize: 12,
    fontWeight: '400' as const,
    lineHeight: 16,
    letterSpacing: 0.4,
  },
};

// Spacing scale (8dp grid system)
export const spacing = {
  xs: 4,
  sm: 8,
  md: 16,
  lg: 24,
  xl: 32,
  xxl: 48,
};

// Border radius (Material Design)
export const borderRadius = {
  none: 0,
  xs: 4,
  sm: 8,
  md: 12,
  lg: 16,
  xl: 24,
  full: 9999,
};





