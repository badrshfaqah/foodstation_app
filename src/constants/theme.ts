/**
 * Below are the colors that are used in the app. The colors are defined in the light and dark mode.
 * There are many other ways to style your app. For example, [Nativewind](https://www.nativewind.dev/), [Tamagui](https://tamagui.dev/), [unistyles](https://reactnativeunistyles.vercel.app), etc.
 */

import '@/global.css';

import { Platform } from 'react-native';

export const Colors = {
  light: {
    text: '#171717',
    background: '#FFFFFF',
    backgroundElement: '#F2F2F7',
    backgroundSelected: '#E5E5EA',
    textSecondary: '#6C6C70',
    primary: '#E8490F',
    primaryTint: '#FFF1EC',
    accent: '#AA2F00',
    success: '#16A34A',
    danger: '#DC2626',
  },
  dark: {
    text: '#ffffff',
    background: '#1C1C1E',
    backgroundElement: '#000000',
    backgroundSelected: '#2C2C2E',
    textSecondary: '#AEAEB2',
    primary: '#FF6A34',
    primaryTint: '#3A2117',
    accent: '#FF8A5C',
    success: '#4ADE80',
    danger: '#F87171',
  },
} as const;

export type ThemeColor = keyof typeof Colors.light & keyof typeof Colors.dark;

/** خطوط Noto Sans Arabic — يجب تحميلها عبر useFonts في الـ layout الجذري قبل استخدامها. */
export const ArabicFonts = {
  regular: 'NotoSansArabic_400Regular',
  medium: 'NotoSansArabic_500Medium',
  semiBold: 'NotoSansArabic_600SemiBold',
  bold: 'NotoSansArabic_700Bold',
} as const;

/** خط Cairo — يُستخدم خصيصاً لاسم العلامة "فودستيشن". يجب تحميله عبر useFonts في الـ layout الجذري. */
export const CairoFonts = {
  bold: 'Cairo_700Bold',
  black: 'Cairo_900Black',
} as const;

/** أنماط ظل خفيفة للكروت، مطابقة لتصميم Figma. */
export const CardShadow = Platform.select({
  web: { boxShadow: '0 1px 3px rgba(0,0,0,0.08)' },
  default: {
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.08,
    shadowRadius: 3,
    elevation: 2,
  },
}) as object;

export const Fonts = Platform.select({
  ios: {
    /** iOS `UIFontDescriptorSystemDesignDefault` */
    sans: 'system-ui',
    /** iOS `UIFontDescriptorSystemDesignSerif` */
    serif: 'ui-serif',
    /** iOS `UIFontDescriptorSystemDesignRounded` */
    rounded: 'ui-rounded',
    /** iOS `UIFontDescriptorSystemDesignMonospaced` */
    mono: 'ui-monospace',
  },
  default: {
    sans: 'normal',
    serif: 'serif',
    rounded: 'normal',
    mono: 'monospace',
  },
  web: {
    sans: 'var(--font-display)',
    serif: 'var(--font-serif)',
    rounded: 'var(--font-rounded)',
    mono: 'var(--font-mono)',
  },
});

export const Spacing = {
  half: 2,
  one: 4,
  two: 8,
  three: 16,
  four: 24,
  five: 32,
  six: 64,
} as const;

export const BottomTabInset = Platform.select({ ios: 50, android: 80 }) ?? 0;
export const MaxContentWidth = 800;
