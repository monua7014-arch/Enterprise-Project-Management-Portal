import { createTheme, ITheme, IPalette } from '@fluentui/react';

export type AppThemeMode = 'dark' | 'light';

export const darkNavyPalette: Partial<IPalette> = {
  themePrimary: '#0ea5e9',
  themeLighterAlt: '#021018',
  themeLighter: '#072739',
  themeLight: '#0d3f5c',
  themeTertiary: '#197cae',
  themeSecondary: '#0c95d3',
  themeDarkAlt: '#23aee9',
  themeDark: '#44baee',
  themeDarker: '#75cbef',
  neutralLighterAlt: '#070c18',
  neutralLighter: '#0a1120',
  neutralLight: '#0e1628',
  neutralQuaternaryAlt: '#131e34',
  neutralQuaternary: '#18253f',
  neutralTertiaryAlt: '#223456',
  neutralTertiary: '#94a3b8',
  neutralSecondary: '#cbd5e1',
  neutralPrimaryAlt: '#e2e8f0',
  neutralPrimary: '#f8fafc',
  neutralDark: '#ffffff',
  black: '#ffffff',
  white: '#070c18',
};

export const darkNavyTheme: ITheme = createTheme({
  palette: darkNavyPalette,
  defaultFontStyle: {
    fontFamily: '"Plus Jakarta Sans", "Inter", "Segoe UI", -apple-system, sans-serif',
  },
  effects: {
    roundedCorner2: '6px',
    roundedCorner4: '10px',
    roundedCorner6: '14px',
    elevation4: '0 4px 16px rgba(0, 0, 0, 0.45)',
    elevation8: '0 8px 30px rgba(0, 0, 0, 0.6)',
    elevation16: '0 16px 48px rgba(0, 0, 0, 0.75)',
  }
});

export const lightSaasPalette: Partial<IPalette> = {
  themePrimary: '#0284c7',
  themeLighterAlt: '#f3f9fd',
  themeLighter: '#d0e9f8',
  themeLight: '#a9d6f2',
  themeTertiary: '#5cb0e6',
  themeSecondary: '#1a90db',
  themeDarkAlt: '#0276b3',
  themeDark: '#026497',
  themeDarker: '#014a70',
  neutralLighterAlt: '#f8fafc',
  neutralLighter: '#f1f5f9',
  neutralLight: '#e2e8f0',
  neutralQuaternaryAlt: '#cbd5e1',
  neutralQuaternary: '#94a3b8',
  neutralTertiaryAlt: '#64748b',
  neutralTertiary: '#475569',
  neutralSecondary: '#334155',
  neutralPrimaryAlt: '#1e293b',
  neutralPrimary: '#0f172a',
  neutralDark: '#020617',
  black: '#000000',
  white: '#ffffff',
};

export const lightSaasTheme: ITheme = createTheme({
  palette: lightSaasPalette,
  defaultFontStyle: {
    fontFamily: '"Plus Jakarta Sans", "Inter", "Segoe UI", -apple-system, sans-serif',
  },
  effects: {
    roundedCorner2: '6px',
    roundedCorner4: '10px',
    roundedCorner6: '14px',
    elevation4: '0 4px 16px rgba(15, 23, 42, 0.06)',
    elevation8: '0 8px 24px rgba(15, 23, 42, 0.1)',
    elevation16: '0 16px 36px rgba(15, 23, 42, 0.14)',
  }
});

export const getThemeStyles = (isDark: boolean) => {
  return {
    bgApp: isDark ? '#070c18' : '#f8fafc',
    bgCard: isDark ? '#0c1322' : '#ffffff',
    bgCardHover: isDark ? '#111a30' : '#f1f5f9',
    bgCardElevated: isDark ? '#142038' : '#ffffff',
    bgSidebar: isDark ? '#050811' : '#ffffff',
    bgHeader: isDark ? 'rgba(7, 12, 24, 0.85)' : 'rgba(255, 255, 255, 0.92)',
    border: isDark ? 'rgba(255, 255, 255, 0.08)' : '#e2e8f0',
    borderLight: isDark ? 'rgba(255, 255, 255, 0.04)' : '#f1f5f9',
    borderGlow: isDark ? 'rgba(14, 165, 233, 0.35)' : 'rgba(2, 132, 199, 0.25)',
    textPrimary: isDark ? '#f8fafc' : '#0f172a',
    textSecondary: isDark ? '#94a3b8' : '#64748b',
    textMuted: isDark ? '#64748b' : '#94a3b8',
    accentBlue: '#0ea5e9',
    accentCyan: '#06b6d4',
    accentIndigo: '#6366f1',
    accentPurple: '#a855f7',
    accentGreen: '#10b981',
    accentAmber: '#f59e0b',
    accentRed: '#f43f5e',
    cardShadow: isDark ? '0 4px 20px -2px rgba(0, 0, 0, 0.5), 0 2px 6px -1px rgba(0, 0, 0, 0.3)' : '0 4px 20px -2px rgba(15, 23, 42, 0.06), 0 2px 6px -1px rgba(15, 23, 42, 0.04)',
    cardShadowHover: isDark ? '0 12px 30px -4px rgba(0, 0, 0, 0.7), 0 4px 12px -2px rgba(14, 165, 233, 0.15)' : '0 12px 30px -4px rgba(15, 23, 42, 0.12), 0 4px 12px -2px rgba(15, 23, 42, 0.06)',
  };
};
