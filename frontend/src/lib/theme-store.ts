import { createContextId, useContext, useContextProvider, useSignal, useVisibleTask$, $ } from "@builder.io/qwik";
import { getThemePreference, setThemePreference } from "./cookie-utils";

export type ThemeName = 'dark' | 'light' | 'pastel' | 'neon' | 'valentine' | 'auto';
export type PaletteName = Exclude<ThemeName, 'auto'>;

/**
 * Semantic roles the whole signed-in application is built on. A theme changes
 * these values and nothing else — geometry, hierarchy and the meaning of a
 * status colour are identical in every theme.
 */
export interface RoleTokens {
  canvas: string;
  nav: string;
  surface: string;
  surfaceSubtle: string;
  surfaceHover: string;
  edge: string;
  edgeStrong: string;
  ink: string;
  inkMuted: string;
  accent: string;
  accentHover: string;
  accentSoft: string;
  /** Accent tuned for text/icons on canvas, where the accent fill is too dark. */
  accentText: string;
  onAccent: string;
  overlay: string;
  shadow: string;
  success: string;
  successSoft: string;
  warning: string;
  warningSoft: string;
  danger: string;
  dangerSoft: string;
  dangerFill: string;
  dangerFillHover: string;
  info: string;
  infoSoft: string;
}

/** Whether a palette reads as dark, used for `color-scheme` and particle defaults. */
export const paletteIsDark: Record<PaletteName, boolean> = {
  dark: true,
  light: false,
  pastel: false,
  neon: true,
  valentine: false,
};

export const palettes: Record<PaletteName, RoleTokens> = {
  dark: {
    canvas: '#0e1016',
    nav: '#12151d',
    surface: '#171b24',
    surfaceSubtle: '#1d222c',
    surfaceHover: '#232833',
    edge: '#2b3240',
    edgeStrong: '#3d4557',
    ink: '#f1f3f8',
    inkMuted: '#99a3b5',
    accent: '#db2777',
    accentHover: '#ec4899',
    accentSoft: 'rgba(236, 72, 153, 0.15)',
    accentText: '#f472b6',
    onAccent: '#ffffff',
    overlay: 'rgba(5, 6, 10, 0.72)',
    shadow: 'rgba(0, 0, 0, 0.55)',
    success: '#4ade80',
    successSoft: 'rgba(74, 222, 128, 0.14)',
    warning: '#fbbf24',
    warningSoft: 'rgba(251, 191, 36, 0.14)',
    danger: '#f87171',
    dangerSoft: 'rgba(248, 113, 113, 0.14)',
    dangerFill: '#b91c1c',
    dangerFillHover: '#dc2626',
    info: '#60a5fa',
    infoSoft: 'rgba(96, 165, 250, 0.14)',
  },
  light: {
    canvas: '#f6f7f9',
    nav: '#ffffff',
    surface: '#ffffff',
    surfaceSubtle: '#f1f3f6',
    surfaceHover: '#e9ecf1',
    edge: '#e0e4ea',
    edgeStrong: '#c6ccd6',
    ink: '#14171f',
    inkMuted: '#5c6474',
    accent: '#db2777',
    accentHover: '#be185d',
    accentSoft: 'rgba(219, 39, 119, 0.10)',
    accentText: '#be185d',
    onAccent: '#ffffff',
    overlay: 'rgba(16, 18, 24, 0.45)',
    shadow: 'rgba(15, 23, 42, 0.18)',
    success: '#15803d',
    successSoft: 'rgba(21, 128, 61, 0.10)',
    warning: '#b45309',
    warningSoft: 'rgba(180, 83, 9, 0.10)',
    danger: '#c2261f',
    dangerSoft: 'rgba(194, 38, 31, 0.10)',
    dangerFill: '#c2261f',
    dangerFillHover: '#a01a14',
    info: '#0369a1',
    infoSoft: 'rgba(3, 105, 161, 0.10)',
  },
  pastel: {
    canvas: '#fbf5fc',
    nav: '#fffbff',
    surface: '#fffdff',
    surfaceSubtle: '#f7ecfa',
    surfaceHover: '#f1e2f6',
    edge: '#ecdcf0',
    edgeStrong: '#d5bade',
    ink: '#3b2340',
    inkMuted: '#77567e',
    accent: '#a3348f',
    accentHover: '#8a2a79',
    accentSoft: 'rgba(163, 52, 143, 0.10)',
    accentText: '#8a2a79',
    onAccent: '#ffffff',
    overlay: 'rgba(48, 26, 50, 0.42)',
    shadow: 'rgba(80, 40, 90, 0.18)',
    success: '#0f7350',
    successSoft: 'rgba(15, 115, 80, 0.10)',
    warning: '#9a5406',
    warningSoft: 'rgba(154, 84, 6, 0.10)',
    danger: '#bd2846',
    dangerSoft: 'rgba(189, 40, 70, 0.10)',
    dangerFill: '#bd2846',
    dangerFillHover: '#9d1c37',
    info: '#2a6296',
    infoSoft: 'rgba(42, 98, 150, 0.10)',
  },
  neon: {
    canvas: '#07070c',
    nav: '#0b0b14',
    surface: '#10101c',
    surfaceSubtle: '#161628',
    surfaceHover: '#1d1d33',
    edge: '#2a2a48',
    edgeStrong: '#3f3f68',
    ink: '#f4f4ff',
    inkMuted: '#9d9dc4',
    accent: '#d4006e',
    accentHover: '#ff0080',
    accentSoft: 'rgba(255, 0, 128, 0.16)',
    accentText: '#ff4da6',
    onAccent: '#ffffff',
    overlay: 'rgba(0, 0, 0, 0.78)',
    shadow: 'rgba(0, 0, 0, 0.7)',
    success: '#00e58a',
    successSoft: 'rgba(0, 229, 138, 0.14)',
    warning: '#ffc400',
    warningSoft: 'rgba(255, 196, 0, 0.14)',
    danger: '#ff4d7d',
    dangerSoft: 'rgba(255, 77, 125, 0.14)',
    dangerFill: '#b0003c',
    dangerFillHover: '#d90050',
    info: '#22d3ee',
    infoSoft: 'rgba(34, 211, 238, 0.14)',
  },
  valentine: {
    canvas: '#fdf3f5',
    nav: '#fffafb',
    surface: '#fffcfd',
    surfaceSubtle: '#fbe9ee',
    surfaceHover: '#f7dce4',
    edge: '#f2d5dd',
    edgeStrong: '#e0aebd',
    ink: '#43101e',
    inkMuted: '#8a4457',
    accent: '#c2185b',
    accentHover: '#9c1348',
    accentSoft: 'rgba(194, 24, 91, 0.10)',
    accentText: '#a8124e',
    onAccent: '#ffffff',
    overlay: 'rgba(52, 12, 24, 0.45)',
    shadow: 'rgba(120, 30, 60, 0.18)',
    success: '#12704a',
    successSoft: 'rgba(18, 112, 74, 0.10)',
    warning: '#9c5306',
    warningSoft: 'rgba(156, 83, 6, 0.10)',
    danger: '#b81f30',
    dangerSoft: 'rgba(184, 31, 48, 0.10)',
    dangerFill: '#b81f30',
    dangerFillHover: '#961523',
    info: '#2c6596',
    infoSoft: 'rgba(44, 101, 150, 0.10)',
  },
};

/**
 * Legacy palette values. Still consumed by the marketing, legal and public bio
 * routes, which are deferred to a later visual pass. Redesigned application
 * components use {@link palettes} instead.
 */
export interface LegacyThemeColors {
  bgPrimary: string;
  bgSecondary: string;
  bgTertiary: string;
  bgGradientFrom: string;
  bgGradientVia: string;
  bgGradientTo: string;
  textPrimary: string;
  textSecondary: string;
  textMuted: string;
  accentPrimary: string;
  accentSecondary: string;
  accentTertiary: string;
  accentQuaternary: string;
  cardBg: string;
  cardBorder: string;
  glassBg: string;
  glassBorder: string;
  scrollbarTrack: string;
  scrollbarThumb: string;
  scrollbarThumbHover: string;
  buttonGradientStart: string;
  buttonGradientEnd: string;
  buttonShadow: string;
  confirm: string;
  confirmHover: string;
  deny: string;
  denyHover: string;
  warning: string;
  warningHover: string;
  info: string;
  infoHover: string;
}

export const themes: Record<PaletteName, LegacyThemeColors> = {
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
    warning: '#f59e0b',
    warningHover: '#d97706',
    info: '#38bdf8',
    infoHover: '#0ea5e9',
  },
  light: {
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
    warning: '#d97706',
    warningHover: '#b45309',
    info: '#0284c7',
    infoHover: '#0369a1',
  },
  pastel: {
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
    warning: '#fbbf24',
    warningHover: '#f59e0b',
    info: '#7dd3fc',
    infoHover: '#38bdf8',
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
    warning: '#ffcc00',
    warningHover: '#ffaa00',
    info: '#00e0ff',
    infoHover: '#00b8d4',
  },
  valentine: {
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
    warning: '#e8890c',
    warningHover: '#c2740a',
    info: '#e05a9c',
    infoHover: '#c23a7e',
  },
};

/** Human-facing theme options, in the order they are offered. */
export const themeOptions: { value: ThemeName; label: string }[] = [
  { value: 'dark', label: 'Dark' },
  { value: 'light', label: 'Light' },
  { value: 'pastel', label: 'Pastel' },
  { value: 'neon', label: 'Neon' },
  { value: 'valentine', label: 'Valentine' },
  { value: 'auto', label: 'Auto' },
];

function camelToCssVar(prefix: string, key: string): string {
  return `--${prefix}-${key.replace(/([A-Z])/g, '-$1').toLowerCase()}`;
}

function cssVarBlock(palette: PaletteName): string {
  const roles = Object.entries(palettes[palette])
    .map(([key, value]) => `${camelToCssVar('ui', key)}: ${value};`);
  const legacy = Object.entries(themes[palette])
    .map(([key, value]) => `${camelToCssVar('theme', key)}: ${value};`);
  return [...roles, ...legacy].join('\n    ');
}

export interface ThemeContextType {
  currentTheme: ThemeName;
  setTheme: (theme: ThemeName) => void;
  isDark: boolean;
}

export const ThemeContext = createContextId<ThemeContextType>('theme-context');

function prefersDark(): boolean {
  return typeof window !== 'undefined' && !!window.matchMedia?.('(prefers-color-scheme: dark)').matches;
}

/** Resolve `auto` to the system-selected Dark or Light palette. */
export function resolvePalette(theme: ThemeName, systemDark = prefersDark()): PaletteName {
  if (theme !== 'auto') return theme;
  return systemDark ? 'dark' : 'light';
}

export const useThemeProvider = () => {
  const currentTheme = useSignal<ThemeName>('dark');
  const isDark = useSignal(true);

  const applyTheme = $((themeName: ThemeName) => {
    if (typeof document === 'undefined') return;

    const palette = resolvePalette(themeName);
    const root = document.documentElement;

    Object.entries(palettes[palette]).forEach(([key, value]) => {
      root.style.setProperty(camelToCssVar('ui', key), value);
    });
    Object.entries(themes[palette]).forEach(([key, value]) => {
      root.style.setProperty(camelToCssVar('theme', key), value);
    });

    root.setAttribute('data-theme', paletteIsDark[palette] ? 'dark' : 'light');
    root.setAttribute('data-palette', palette);
    root.setAttribute('data-theme-variant', themeName);

    isDark.value = paletteIsDark[palette];
  });

  const setTheme = $(async (theme: ThemeName) => {
    currentTheme.value = theme;
    await applyTheme(theme);
    await setThemePreference(theme);
  });

  // eslint-disable-next-line qwik/no-use-visible-task
  useVisibleTask$(async () => {
    const root = document.documentElement;
    const serverTheme = root.getAttribute('data-theme-variant') as ThemeName | null;

    const initialTheme: ThemeName =
      serverTheme && (serverTheme === 'auto' || serverTheme in palettes)
        ? serverTheme
        : (await getThemePreference()) || 'auto';

    currentTheme.value = initialTheme;
    await applyTheme(initialTheme);

    if (typeof window !== 'undefined' && window.matchMedia) {
      const mediaQuery = window.matchMedia('(prefers-color-scheme: dark)');
      const handleChange = () => {
        if (currentTheme.value === 'auto') applyTheme('auto');
      };
      mediaQuery.addEventListener('change', handleChange);
      return () => mediaQuery.removeEventListener('change', handleChange);
    }
  });

  const contextValue: ThemeContextType = {
    currentTheme: currentTheme.value,
    setTheme,
    isDark: isDark.value,
  };

  useContextProvider(ThemeContext, contextValue);

  return { currentTheme, setTheme, isDark };
};

export const useTheme = () => useContext(ThemeContext);

/**
 * CSS custom properties for server-side injection, so the first paint already
 * carries the user's palette. `auto` cannot be resolved on the server, so the
 * emitted block covers Dark and lets a `prefers-color-scheme: light` media
 * query swap to Light before hydration.
 */
export function generateThemeCSS(themeName: ThemeName): string {
  return cssVarBlock(resolvePalette(themeName, true));
}

/** Light-palette override emitted only for `auto`, keyed on the system preference. */
export function generateAutoLightCSS(): string {
  return cssVarBlock('light');
}

export function getEffectiveTheme(themeName: ThemeName): PaletteName {
  return resolvePalette(themeName, true);
}
