import { createTheme, ITheme, IPalette } from '@fluentui/react';

export type AppThemeMode = 'dark' | 'light';

export const darkNavyPalette: Partial<IPalette> = {
  themePrimary: '#00a8e8',
  themeLighterAlt: '#05131a',
  themeLighter: '#0f2f3f',
  themeLight: '#184b65',
  themeTertiary: '#2c83b0',
  themeSecondary: '#0097d1',
  themeDarkAlt: '#1ab1ea',
  themeDark: '#3ebeee',
  themeDarker: '#72d2f3',
  neutralLighterAlt: '#0c1524',
  neutralLighter: '#101c2e',
  neutralLight: '#15243b',
  neutralQuaternaryAlt: '#1a2a44',
  neutralQuaternary: '#203350',
  neutralTertiaryAlt: '#273e5f',
  neutralTertiary: '#a1b4cd',
  neutralSecondary: '#bac8db',
  neutralPrimaryAlt: '#d0dceb',
  neutralPrimary: '#f0f4f8',
  neutralDark: '#f7fafc',
  black: '#ffffff',
  white: '#0a1120',
};

export const darkNavyTheme: ITheme = createTheme({
  palette: darkNavyPalette,
  defaultFontStyle: {
    fontFamily: '"Segoe UI", -apple-system, BlinkMacSystemFont, Roboto, "Helvetica Neue", sans-serif',
  },
  effects: {
    roundedCorner2: '4px',
    roundedCorner4: '8px',
    roundedCorner6: '12px',
    elevation4: '0 2px 8px rgba(0, 0, 0, 0.45)',
    elevation8: '0 4px 16px rgba(0, 0, 0, 0.55)',
    elevation16: '0 8px 32px rgba(0, 0, 0, 0.65)',
  }
});

export const lightSaasPalette: Partial<IPalette> = {
  themePrimary: '#0062cc',
  themeLighterAlt: '#f3f8fe',
  themeLighter: '#d2e4fa',
  themeLight: '#adcdf6',
  themeTertiary: '#64a1ec',
  themeSecondary: '#1a74d4',
  themeDarkAlt: '#0058b8',
  themeDark: '#004b9c',
  themeDarker: '#003773',
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
    fontFamily: '"Segoe UI", -apple-system, BlinkMacSystemFont, Roboto, "Helvetica Neue", sans-serif',
  },
  effects: {
    roundedCorner2: '4px',
    roundedCorner4: '8px',
    roundedCorner6: '12px',
    elevation4: '0 2px 8px rgba(15, 23, 42, 0.08)',
    elevation8: '0 4px 16px rgba(15, 23, 42, 0.12)',
    elevation16: '0 8px 32px rgba(15, 23, 42, 0.16)',
  }
});

export const getThemeStyles = (isDark: boolean) => {
  return {
    bgApp: isDark ? '#0b1329' : '#f8fafc',
    bgCard: isDark ? '#111e38' : '#ffffff',
    bgCardHover: isDark ? '#172748' : '#f1f5f9',
    bgSidebar: isDark ? '#080e1d' : '#ffffff',
    bgHeader: isDark ? '#0c162d' : '#ffffff',
    border: isDark ? '#1e2f50' : '#e2e8f0',
    borderLight: isDark ? '#15243f' : '#f1f5f9',
    textPrimary: isDark ? '#f1f5f9' : '#0f172a',
    textSecondary: isDark ? '#94a3b8' : '#64748b',
    textMuted: isDark ? '#64748b' : '#94a3b8',
    accentBlue: '#00a8e8',
    accentGreen: '#10b981',
    accentAmber: '#f59e0b',
    accentRed: '#ef4444',
    accentPurple: '#8b5cf6',
  };
};
