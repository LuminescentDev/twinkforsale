import { createContextId, useContext, useContextProvider, useSignal, useStore, useVisibleTask$, $ } from "@builder.io/qwik";
import { getThemePreference, setThemePreference } from "./cookie-utils";

export type ThemeName = 'dark' | 'light' | 'pastel' | 'neon' | 'valentine' | 'auto';

export interface ThemeColors {
  // Background colors
  bgPrimary: string;
  bgSecondary: string;
  bgTertiary: string;

  // Background gradients
  bgGradientFrom: string;
  bgGradientVia: string;
  bgGradientTo: string;

  // Text colors
  textPrimary: string;
  textSecondary: string;
  textMuted: string;

  // Accent colors (the main cute gradient colors)
  accentPrimary: string;
  accentSecondary: string;
  accentTertiary: string;
  accentQuaternary: string;

  // UI element colors
  cardBg: string;
  cardBorder: string;
  glassBg: string;
  glassBorder: string;

  // Scrollbar colors
  scrollbarTrack: string;
  scrollbarThumb: string;
  scrollbarThumbHover: string;
  // Button colors
  buttonGradientStart: string;
  buttonGradientEnd: string;
  buttonShadow: string;

  // Action colors
  confirm: string;
  confirmHover: string;
  deny: string;
  denyHover: string;
}

export const themes: Record<ThemeName, ThemeColors> = {
  dark: {
    bgPrimary: '#0f172a',
    bgSecondary: '#1e293b',
    bgTertiary: '#334155',
    bgGradientFrom: '#0f172a',
    bgGradientVia: '#7c2d92',
    bgGradientTo: '#9d174d',
    textPrimary: '#ffffff',
    textSecondary: '#f1f5f9',
    textMuted: '#94a3b8',
    accentPrimary: '#ec4899',
    accentSecondary: '#f472b6',
    accentTertiary: '#c084fc',
    accentQuaternary: '#8b5cf6',
    cardBg: 'linear-gradient(135deg, rgba(15, 23, 42, 0.8), rgba(30, 41, 59, 0.6))',
    cardBorder: 'rgba(236, 72, 153, 0.2)',
    glassBg: 'rgba(15, 23, 42, 0.3)',
    glassBorder: 'rgba(255, 255, 255, 0.1)',
    scrollbarTrack: '#1e293b',
    scrollbarThumb: 'linear-gradient(to bottom, #ec4899, #8b5cf6)',
    scrollbarThumbHover: 'linear-gradient(to bottom, #f472b6, #a855f7)',
    buttonGradientStart: '#ec4899',
    buttonGradientEnd: '#8b5cf6',
    buttonShadow: 'rgba(236, 72, 153, 0.3)',
    confirm: '#10b981',
    confirmHover: '#059669',
    deny: '#ef4444',
    denyHover: '#dc2626',
  }, light: {
    bgPrimary: '#ffffff',
    bgSecondary: '#f8fafc',
    bgTertiary: '#f1f5f9',
    bgGradientFrom: '#bae6fd',
    bgGradientVia: '#fce7f3',
    bgGradientTo: '#ddd6fe',
    textPrimary: '#0f172a',
    textSecondary: '#334155',
    textMuted: '#64748b',
    accentPrimary: '#ec4899',
    accentSecondary: '#f472b6',
    accentTertiary: '#c084fc',
    accentQuaternary: '#8b5cf6',
    cardBg: 'linear-gradient(135deg, rgba(248, 250, 252, 0.9), rgba(241, 245, 249, 0.8))',
    cardBorder: 'rgba(236, 72, 153, 0.3)',
    glassBg: 'rgba(255, 255, 255, 0.3)',
    glassBorder: 'rgba(15, 23, 42, 0.1)',
    scrollbarTrack: '#f1f5f9',
    scrollbarThumb: 'linear-gradient(to bottom, #ec4899, #8b5cf6)',
    scrollbarThumbHover: 'linear-gradient(to bottom, #f472b6, #a855f7)',
    buttonGradientStart: '#ec4899',
    buttonGradientEnd: '#8b5cf6',
    buttonShadow: 'rgba(236, 72, 153, 0.3)',
    confirm: '#059669',
    confirmHover: '#047857',
    deny: '#dc2626',
    denyHover: '#b91c1c',
  }, pastel: {
    bgPrimary: '#fef7ff',
    bgSecondary: '#fdf4ff',
    bgTertiary: '#fae8ff',
    bgGradientFrom: '#f0abfc',
    bgGradientVia: '#fae8ff',
    bgGradientTo: '#e0e7ff',
    textPrimary: '#701a75',
    textSecondary: '#86198f',
    textMuted: '#a21caf',
    accentPrimary: '#f0abfc',
    accentSecondary: '#e879f9',
    accentTertiary: '#d946ef',
    accentQuaternary: '#c026d3',
    cardBg: 'linear-gradient(135deg, rgba(253, 244, 255, 0.9), rgba(250, 232, 255, 0.8))',
    cardBorder: 'rgba(240, 171, 252, 0.4)',
    glassBg: 'rgba(255, 255, 255, 0.5)',
    glassBorder: 'rgba(240, 171, 252, 0.2)',
    scrollbarTrack: '#fae8ff',
    scrollbarThumb: 'linear-gradient(to bottom, #f0abfc, #c026d3)',
    scrollbarThumbHover: 'linear-gradient(to bottom, #e879f9, #a21caf)',
    buttonGradientStart: '#f0abfc',
    buttonGradientEnd: '#c026d3',
    buttonShadow: 'rgba(240, 171, 252, 0.4)',
    confirm: '#34d399',
    confirmHover: '#10b981',
    deny: '#f87171',
    denyHover: '#ef4444',
  },
  neon: {
    bgPrimary: '#000000',
    bgSecondary: '#111111',
    bgTertiary: '#1a1a1a',
    bgGradientFrom: '#000000',
    bgGradientVia: '#1a0033',
    bgGradientTo: '#330066',
    textPrimary: '#ffffff',
    textSecondary: '#f0f0f0',
    textMuted: '#a0a0a0',
    accentPrimary: '#ff0080',
    accentSecondary: '#ff40a0',
    accentTertiary: '#8000ff',
    accentQuaternary: '#4080ff',
    cardBg: 'linear-gradient(135deg, rgba(0, 0, 0, 0.9), rgba(17, 17, 17, 0.8))',
    cardBorder: 'rgba(255, 0, 128, 0.5)',
    glassBg: 'rgba(0, 0, 0, 0.3)',
    glassBorder: 'rgba(255, 64, 160, 0.3)',
    scrollbarTrack: '#111111',
    scrollbarThumb: 'linear-gradient(to bottom, #ff0080, #8000ff)',
    scrollbarThumbHover: 'linear-gradient(to bottom, #ff40a0, #4080ff)',
    buttonGradientStart: '#ff0080',
    buttonGradientEnd: '#8000ff',
    buttonShadow: 'rgba(255, 0, 128, 0.5)',
    confirm: '#00ff80',
    confirmHover: '#00cc66',
    deny: '#ff4080',
    denyHover: '#ff0066',
  }, valentine: {
    bgPrimary: '#fdf2f8',
    bgSecondary: '#fce7f3',
    bgTertiary: '#fbcfe8',
    bgGradientFrom: '#fecaca',
    bgGradientVia: '#fde68a',
    bgGradientTo: '#f9a8d4',
    textPrimary: '#881337',
    textSecondary: '#9f1239',
    textMuted: '#be185d',
    accentPrimary: '#f472b6',
    accentSecondary: '#ec4899',
    accentTertiary: '#e11d48',
    accentQuaternary: '#dc2626',
    cardBg: 'linear-gradient(135deg, rgba(252, 231, 243, 0.9), rgba(251, 207, 232, 0.8))',
    cardBorder: 'rgba(244, 114, 182, 0.4)',
    glassBg: 'rgba(255, 255, 255, 0.4)',
    glassBorder: 'rgba(244, 114, 182, 0.2)',
    scrollbarTrack: '#fbcfe8',
    scrollbarThumb: 'linear-gradient(to bottom, #f472b6, #dc2626)',
    scrollbarThumbHover: 'linear-gradient(to bottom, #ec4899, #b91c1c)',
    buttonGradientStart: '#f472b6',
    buttonGradientEnd: '#dc2626',
    buttonShadow: 'rgba(244, 114, 182, 0.4)',
    confirm: '#fb7185',
    confirmHover: '#f43f5e',
    deny: '#be123c',
    denyHover: '#9f1239',
  },
  auto: {
    bgPrimary: '#0f172a',
    bgSecondary: '#1e293b',
    bgTertiary: '#334155',
    bgGradientFrom: '#0f172a',
    bgGradientVia: '#7c2d92',
    bgGradientTo: '#9d174d',
    textPrimary: '#ffffff',
    textSecondary: '#f1f5f9',
    textMuted: '#94a3b8',
    accentPrimary: '#ec4899',
    accentSecondary: '#f472b6',
    accentTertiary: '#c084fc',
    accentQuaternary: '#8b5cf6',
    cardBg: 'linear-gradient(135deg, rgba(15, 23, 42, 0.8), rgba(30, 41, 59, 0.6))',
    cardBorder: 'rgba(236, 72, 153, 0.2)',
    glassBg: 'rgba(15, 23, 42, 0.3)',
    glassBorder: 'rgba(255, 255, 255, 0.1)',
    scrollbarTrack: '#1e293b',
    scrollbarThumb: 'linear-gradient(to bottom, #ec4899, #8b5cf6)',
    scrollbarThumbHover: 'linear-gradient(to bottom, #f472b6, #a855f7)',
    buttonGradientStart: '#ec4899',
    buttonGradientEnd: '#8b5cf6',
    buttonShadow: 'rgba(236, 72, 153, 0.3)',
    confirm: '#10b981',
    confirmHover: '#059669',
    deny: '#ef4444',
    denyHover: '#dc2626',
  },
};

export interface ThemeContextType {
  currentTheme: ThemeName;
  setTheme: (theme: ThemeName) => void;
  isDark: boolean;
  themeColors: ThemeColors;
}

export const ThemeContext = createContextId<ThemeContextType>('theme-context');

export const useThemeProvider = () => {
  const currentTheme = useSignal<ThemeName>('dark');
  const isDark = useSignal(true);

  // Apply theme to CSS variables
  const applyTheme = $((themeName: ThemeName) => {
    if (typeof document === 'undefined') return;

    let effectiveTheme = themeName;
    if (themeName === 'auto') {
      effectiveTheme = (typeof window !== 'undefined' && window.matchMedia?.('(prefers-color-scheme: dark)').matches) ? 'dark' : 'light';
    }

    const themeColors = themes[effectiveTheme];
    const root = document.documentElement;

    // Apply CSS custom properties
    Object.entries(themeColors).forEach(([key, value]) => {
      const cssVarName = `--theme-${key.replace(/([A-Z])/g, '-$1').toLowerCase()}`;
      root.style.setProperty(cssVarName, value);
    });

    // Update data attributes for additional styling hooks
    root.setAttribute('data-theme', effectiveTheme);
    root.setAttribute('data-theme-variant', themeName);

    isDark.value = effectiveTheme === 'dark' ||
      (themeName === 'neon') ||
      (themeName === 'auto' && (typeof window !== 'undefined' && window.matchMedia?.('(prefers-color-scheme: dark)').matches));
  }); const setTheme = $((theme: ThemeName) => {
    currentTheme.value = theme;
    applyTheme(theme);
    setThemePreference(theme);
  });
  // Load saved theme on initialization
  // eslint-disable-next-line qwik/no-use-visible-task
  useVisibleTask$(async () => {
    // Check if theme is already applied server-side
    const root = document.documentElement;
    const serverTheme = root.getAttribute('data-theme-variant');

    let initialTheme: ThemeName;

    if (serverTheme && themes[serverTheme as ThemeName]) {
      // Use server-side theme if available
      initialTheme = serverTheme as ThemeName;
      currentTheme.value = initialTheme;
    } else {
      // Fallback to cookie-based theme detection
      const savedTheme = await getThemePreference();
      initialTheme = savedTheme || 'auto';
      currentTheme.value = initialTheme;
    }

    // Apply theme (this will update if needed)
    applyTheme(initialTheme);

    // Listen for system theme changes when using auto theme
    if (typeof window !== 'undefined' && window.matchMedia) {
      const mediaQuery = window.matchMedia('(prefers-color-scheme: dark)');
      const handleChange = () => {
        if (currentTheme.value === 'auto') {
          applyTheme('auto');
        }
      };
      mediaQuery.addEventListener('change', handleChange);

      // Cleanup function
      return () => mediaQuery.removeEventListener('change', handleChange);
    }
  }); const contextValue: ThemeContextType = {
    currentTheme: currentTheme.value,
    setTheme,
    isDark: isDark.value,
    themeColors: themes[currentTheme.value],
  };

  useContextProvider(ThemeContext, contextValue);

  return {
    currentTheme,
    setTheme,
    isDark,
    get themeColors() { return themes[currentTheme.value]; },
  };
};

export const useTheme = () => {
  return useContext(ThemeContext);
};

/**
 * Generate CSS variables string for server-side theme injection
 * This prevents theme flashing by applying theme styles immediately during SSR
 * @param themeName - The theme name to apply
 * @param userAgent - Optional user agent string for auto theme detection
 * @returns CSS variables string to inject into the document
 */
export function generateThemeCSS(themeName: ThemeName, userAgent?: string): string {
  let effectiveTheme = themeName;

  // Handle auto theme detection on server-side
  if (themeName === 'auto') {
    // Basic server-side dark mode detection (fallback to dark)
    // In a real implementation, you might want to detect this differently
    effectiveTheme = 'dark'; // Default fallback for server-side
  }

  const themeColors = themes[effectiveTheme];

  // Generate CSS custom properties
  const cssVars = Object.entries(themeColors)
    .map(([key, value]) => {
      const cssVarName = `--theme-${key.replace(/([A-Z])/g, '-$1').toLowerCase()}`;
      return `${cssVarName}: ${value};`;
    })
    .join('\n    ');

  return cssVars;
}

/**
 * Get the effective theme name (resolves 'auto' to actual theme)
 * @param themeName - The theme name (including 'auto')
 * @param userAgent - Optional user agent string for auto theme detection
 * @returns The effective theme name ('dark' or 'light' etc.)
 */
export function getEffectiveTheme(themeName: ThemeName, userAgent?: string): Exclude<ThemeName, 'auto'> {
  if (themeName === 'auto') {
    // Server-side auto theme detection fallback
    return 'dark'; // Default fallback
  }
  return themeName;
}
